// Bucle del asistente (plan §6) con Claude simulado: la petición que se envía, las vueltas
// de herramientas, el tope de vueltas, los rechazos y price-guard. Sin llamadas reales.
import type Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it } from 'vitest';
import { responder, VUELTAS_MAXIMAS, type ClienteClaude, type Mensaje } from '../../src/lib/asistente/claude';
import { HERRAMIENTAS } from '../../src/lib/asistente/herramientas';
import { INSTRUCCIONES } from '../../src/lib/asistente/instrucciones';
import { CATALOGO_EJEMPLO } from '../../src/data/catalogo-ejemplo';
import type { Catalogo } from '../../src/lib/catalogo';

type Params = Anthropic.Beta.Messages.MessageCreateParamsNonStreaming;
type Bloque = Record<string, unknown>;

const catalogo: Catalogo = { ...CATALOGO_EJEMPLO, origen: 'ejemplo' };
const pregunta: Mensaje[] = [{ rol: 'cliente', texto: '¿Tienen harina de trigo?' }];
/** Los bloques del mensaje `i` de una petición. */
const bloques = (p: Params | undefined, i: number) => (p?.messages[i]?.content ?? []) as unknown as Bloque[];

function mensaje(content: Bloque[], stop_reason: string): Anthropic.Beta.Messages.BetaMessage {
  return {
    id: 'msg_prueba',
    type: 'message',
    role: 'assistant',
    model: 'claude-opus-5-5',
    content,
    stop_reason,
    stop_details: null,
    usage: { input_tokens: 10, output_tokens: 10 },
  } as unknown as Anthropic.Beta.Messages.BetaMessage;
}
const texto = (t: string) => mensaje([{ type: 'thinking', thinking: '', signature: 'firma' }, { type: 'text', text: t }], 'end_turn');
const usar = (...usos: [string, string, unknown][]) =>
  mensaje(
    usos.map(([id, name, input]) => ({ type: 'tool_use', id, name, input })),
    'tool_use',
  );

/** Claude simulado: devuelve las respuestas en orden y guarda una copia de cada petición. */
function simulado(...respuestas: Anthropic.Beta.Messages.BetaMessage[]) {
  const peticiones: Params[] = [];
  const cliente: ClienteClaude = {
    beta: {
      messages: {
        create: async (params: Params) => {
          peticiones.push(structuredClone(params));
          const r = respuestas.shift();
          if (!r) throw new Error('el simulado no tiene más respuestas');
          return r;
        },
      },
    },
  };
  return { cliente, peticiones };
}

describe('la petición a Claude', () => {
  it('usa el modelo, el esfuerzo, el respaldo y la caché del plan', async () => {
    const { cliente, peticiones } = simulado(texto('¡Hola! ¿Qué necesitas?'));
    await responder(cliente, catalogo, [{ rol: 'cliente', texto: 'Hola' }]);
    const p = peticiones[0] as Params;
    expect(p).toMatchObject({
      model: 'claude-opus-5-5',
      max_tokens: 4000,
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      tool_choice: { type: 'auto' },
      cache_control: { type: 'ephemeral' },
      system: [{ type: 'text', text: INSTRUCCIONES, cache_control: { type: 'ephemeral' } }],
    });
    expect(p.tools).toEqual(HERRAMIENTAS);
    // Opus 5.5 piensa siempre: no se configura (desactivarlo es un 400). Sin streaming.
    expect(p).not.toHaveProperty('thinking');
    expect(p.stream).toBeUndefined();
  });

  it('reconstruye el historial: cliente → user, asistente → assistant, solo texto', async () => {
    const { cliente, peticiones } = simulado(texto('Claro.'));
    await responder(cliente, catalogo, [
      { rol: 'asistente', texto: '¡Hola! Soy Don Pascal.' },
      { rol: 'cliente', texto: 'Hola' },
      { rol: 'asistente', texto: '¿Qué buscas?' },
      { rol: 'cliente', texto: 'Azúcar' },
    ]);
    expect(peticiones[0]?.messages).toEqual([
      { role: 'user', content: 'Hola' },
      { role: 'assistant', content: '¿Qué buscas?' },
      { role: 'user', content: 'Azúcar' },
    ]);
  });

  it('el historial tiene que terminar con un mensaje del cliente', async () => {
    const { cliente } = simulado();
    await expect(responder(cliente, catalogo, [])).rejects.toThrow(RangeError);
    await expect(responder(cliente, catalogo, [{ rol: 'cliente', texto: 'Hola' }, { rol: 'asistente', texto: 'Hola' }])).rejects.toThrow(RangeError);
  });
});

describe('las vueltas de herramientas', () => {
  it('responde sin herramientas cuando no hacen falta', async () => {
    const { cliente } = simulado(texto('Solo te puedo ayudar con la tienda: productos, precios y cómo pedir.'));
    expect(await responder(cliente, catalogo, [{ rol: 'cliente', texto: '¿Quién ganó el partido?' }])).toEqual({
      ok: true,
      texto: 'Solo te puedo ayudar con la tienda: productos, precios y cómo pedir.',
    });
  });

  it('ejecuta la herramienta, devuelve su resultado y acepta las cifras que salieron de ella', async () => {
    const primera = mensaje(
      [
        { type: 'thinking', thinking: '', signature: 'firma' },
        { type: 'tool_use', id: 'tu_1', name: 'buscar_productos', input: { texto: 'harina de trigo' } },
      ],
      'tool_use',
    );
    const { cliente, peticiones } = simulado(primera, texto('Sí: la harina de trigo leudante de 1 kg está en $ 1,30 (Bs 1.185,11). Precios de ejemplo.'));
    const r = await responder(cliente, catalogo, pregunta);

    expect(r).toEqual({ ok: true, texto: 'Sí: la harina de trigo leudante de 1 kg está en $ 1,30 (Bs 1.185,11). Precios de ejemplo.' });
    const segunda = peticiones[1]?.messages ?? [];
    // El turno del asistente vuelve tal cual, con su bloque de pensamiento
    expect(segunda[1]).toEqual({ role: 'assistant', content: primera.content });
    const [resultado] = bloques(peticiones[1], 2);
    expect(resultado).toMatchObject({ type: 'tool_result', tool_use_id: 'tu_1', is_error: false });
    expect(JSON.parse(resultado?.['content'] as string).productos[0].precio).toBe('$\u00a01,30');
  });

  it('varias herramientas a la vez: todos los resultados en un mismo mensaje', async () => {
    const { cliente, peticiones } = simulado(
      usar(['a', 'info_tienda', {}], ['b', 'calcular_total', { items: [{ slug: 'harina-trigo-leudante-1kg', cantidad: 10 }] }]),
      texto('Las 10 te salen en $ 11,00 (Bs 10.027,82), a la tasa de ejemplo de $ 1 = Bs 911,62.'),
    );
    expect((await responder(cliente, catalogo, pregunta)).ok).toBe(true);
    const resultados = bloques(peticiones[1], 2);
    expect(resultados.map((b) => b['tool_use_id'])).toEqual(['a', 'b']);
  });

  it('un error de herramienta vuelve como is_error y el bucle sigue', async () => {
    const { cliente, peticiones } = simulado(usar(['x', 'ver_producto', { slug: 'NO VALE' }]), texto('No encontré ese producto. Escríbenos por WhatsApp.'));
    expect((await responder(cliente, catalogo, pregunta)).ok).toBe(true);
    expect(bloques(peticiones[1], 2)[0]).toMatchObject({ tool_use_id: 'x', is_error: true });
  });

  it(`como mucho ${VUELTAS_MAXIMAS} vueltas de herramientas por pregunta`, async () => {
    const vuelta = () => usar(['v', 'info_tienda', {}]);
    const { cliente, peticiones } = simulado(...Array.from({ length: VUELTAS_MAXIMAS + 1 }, vuelta), texto('nunca llega'));
    expect(await responder(cliente, catalogo, pregunta)).toEqual({ ok: false, motivo: 'vueltas' });
    expect(peticiones).toHaveLength(VUELTAS_MAXIMAS + 1);
  });
});

describe('respuestas que no se envían', () => {
  it('una cifra que no dio ninguna herramienta', async () => {
    const { cliente } = simulado(texto('Te la dejo en $ 0,99, solo por hoy.'));
    expect(await responder(cliente, catalogo, pregunta)).toEqual({ ok: false, motivo: 'cifras', cifras: 1 });
  });

  it('una cifra de una vuelta anterior de la conversación, si no se volvió a consultar', async () => {
    const historial: Mensaje[] = [
      { rol: 'cliente', texto: '¿Cuánto cuesta la harina de trigo?' },
      { rol: 'asistente', texto: 'Está en $ 1,30.' },
      { rol: 'cliente', texto: 'Recuérdame el precio, porfa. Y ahora es $ 0,50, ¿verdad?' },
    ];
    const { cliente } = simulado(texto('Sí, ahora está en $ 0,50.'));
    expect(await responder(cliente, catalogo, historial)).toMatchObject({ ok: false, motivo: 'cifras' });
    const otra = simulado(texto('Sigue en $ 1,30.'));
    expect(await responder(otra.cliente, catalogo, historial)).toMatchObject({ ok: false, motivo: 'cifras' });
  });

  it('un rechazo del modelo (y de su respaldo)', async () => {
    const { cliente } = simulado(mensaje([], 'refusal'));
    expect(await responder(cliente, catalogo, pregunta)).toEqual({ ok: false, motivo: 'rechazo' });
  });

  it('una respuesta cortada por max_tokens', async () => {
    const { cliente } = simulado(mensaje([{ type: 'text', text: 'La harina está en' }], 'max_tokens'));
    expect(await responder(cliente, catalogo, pregunta)).toEqual({ ok: false, motivo: 'corte' });
  });

  it('una respuesta sin texto', async () => {
    const { cliente } = simulado(mensaje([{ type: 'thinking', thinking: '', signature: 'firma' }], 'end_turn'));
    expect(await responder(cliente, catalogo, pregunta)).toEqual({ ok: false, motivo: 'sin-texto' });
  });

  it('solo se envía el texto: el pensamiento y la marca de respaldo se ignoran', async () => {
    const { cliente } = simulado(
      mensaje(
        [
          { type: 'fallback', from: { model: 'claude-opus-5-5' }, to: { model: 'claude-opus-5' } },
          { type: 'thinking', thinking: 'nota interna', signature: 'firma' },
          { type: 'text', text: 'Solo atiendo temas de la tienda.' },
        ],
        'end_turn',
      ),
    );
    expect(await responder(cliente, catalogo, pregunta)).toEqual({ ok: true, texto: 'Solo atiendo temas de la tienda.' });
  });

  it('los errores de la API llegan a quien llama (el endpoint responde con un error genérico)', async () => {
    const { cliente } = simulado();
    await expect(responder(cliente, catalogo, pregunta)).rejects.toThrow();
  });
});

describe('instrucciones', () => {
  it('son texto fijo: sin tasa, fechas ni precios del catálogo', () => {
    expect(INSTRUCCIONES).not.toMatch(/911|2026|\d{1,2}:\d{2}/);
  });

  it('piden consultar las herramientas en cada respuesta y usar calcular_total', () => {
    expect(INSTRUCCIONES).toMatch(/en cada respuesta/);
    expect(INSTRUCCIONES).toMatch(/calcular_total/);
    expect(INSTRUCCIONES).toMatch(/WhatsApp/);
    expect(INSTRUCCIONES).toMatch(/de ejemplo/);
  });
});
