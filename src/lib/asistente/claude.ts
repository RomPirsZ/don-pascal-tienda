// Bucle del asistente con Claude (plan §6). Lo usan la web (/api/chat) y WhatsApp: mismas
// instrucciones, mismas herramientas y la misma comprobación de cifras.
//
// - Claude Opus 5.5 con esfuerzo bajo (es un chat). Piensa siempre: no se configura.
// - Sin streaming: price-guard necesita la respuesta entera antes de enviarla.
// - Si el modelo rechaza la petición, la repite el modelo de respaldo que elige la API
//   (`fallbacks: "default"`). Se mira stop_reason antes de leer el contenido.
// - Como mucho VUELTAS_MAXIMAS vueltas de herramientas; después, respuesta segura.
import Anthropic from '@anthropic-ai/sdk';
import type { Catalogo } from '../catalogo';
import { ejecutarHerramienta, HERRAMIENTAS } from './herramientas';
import { INSTRUCCIONES } from './instrucciones';
import { cifrasNoConfirmadas } from './price-guard';

type Params = Anthropic.Beta.Messages.MessageCreateParamsNonStreaming;
type MensajeApi = Anthropic.Beta.Messages.BetaMessageParam;

export const MODELO = 'claude-opus-5-5';
export const VUELTAS_MAXIMAS = 4;

export interface Mensaje {
  rol: 'cliente' | 'asistente';
  texto: string;
}

/**
 * La respuesta, o por qué no se puede enviar. Quien llama sustituye un `ok: false` por la
 * respuesta segura (remitir a WhatsApp) y lo registra sin el texto del cliente.
 */
export type Respuesta =
  | { ok: true; texto: string }
  | { ok: false; motivo: 'rechazo' | 'vueltas' | 'corte' | 'sin-texto' }
  | { ok: false; motivo: 'cifras'; cifras: number };

/** Lo único del SDK que usa el bucle: así los tests le pasan un Claude simulado. */
export interface ClienteClaude {
  beta: { messages: { create(params: Params): PromiseLike<Anthropic.Beta.Messages.BetaMessage> } };
}

/** Un reintento ante errores temporales y 30 s por intento, para no dejar al cliente esperando. */
export function crearCliente(apiKey: string): ClienteClaude {
  return new Anthropic({ apiKey, maxRetries: 1, timeout: 30_000 });
}

function peticion(mensajes: MensajeApi[]): Params {
  return {
    model: MODELO,
    max_tokens: 4000,
    output_config: { effort: 'low' },
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    // Las herramientas y las instrucciones son fijas: van en caché. La caché automática
    // cubre además la conversación entre una vuelta de herramientas y la siguiente.
    tools: HERRAMIENTAS,
    tool_choice: { type: 'auto' },
    system: [{ type: 'text', text: INSTRUCCIONES, cache_control: { type: 'ephemeral' } }],
    cache_control: { type: 'ephemeral' },
    messages: [...mensajes],
  };
}

/**
 * El historial tal como llega: solo texto, con los roles reconstruidos en el servidor. Se
 * descartan los saludos del asistente anteriores al primer mensaje del cliente.
 */
function aMensajesApi(historial: readonly Mensaje[]): MensajeApi[] {
  const inicio = historial.findIndex((m) => m.rol === 'cliente');
  if (inicio < 0 || historial[historial.length - 1]?.rol !== 'cliente') {
    throw new RangeError('El historial tiene que terminar con un mensaje del cliente');
  }
  return historial.slice(inicio).map((m) => ({ role: m.rol === 'cliente' ? 'user' : 'assistant', content: m.texto }));
}

export async function responder(cliente: ClienteClaude, catalogo: Catalogo, historial: readonly Mensaje[]): Promise<Respuesta> {
  const mensajes = aMensajesApi(historial);
  // Lo que devolvieron las herramientas en esta petición: lo único que price-guard acepta
  const resultados: unknown[] = [];

  for (let vuelta = 0; ; vuelta++) {
    const respuesta = await cliente.beta.messages.create(peticion(mensajes));

    if (respuesta.stop_reason === 'refusal') return { ok: false, motivo: 'rechazo' };

    if (respuesta.stop_reason === 'tool_use') {
      if (vuelta >= VUELTAS_MAXIMAS) return { ok: false, motivo: 'vueltas' };
      // El turno vuelve tal cual (pensamiento incluido) y todos los resultados en un mensaje
      mensajes.push({ role: 'assistant', content: respuesta.content });
      const bloques = respuesta.content.flatMap((bloque) => {
        if (bloque.type !== 'tool_use') return [];
        const salida = ejecutarHerramienta(bloque.name, bloque.input, catalogo);
        if (!salida.error) resultados.push(salida.resultado);
        return [{ type: 'tool_result' as const, tool_use_id: bloque.id, content: JSON.stringify(salida.resultado), is_error: salida.error }];
      });
      mensajes.push({ role: 'user', content: bloques });
      continue;
    }

    // max_tokens, pause_turn y cualquier otro final: la respuesta puede estar a medias
    if (respuesta.stop_reason !== 'end_turn') return { ok: false, motivo: 'corte' };

    const texto = respuesta.content
      .flatMap((bloque) => (bloque.type === 'text' ? [bloque.text] : []))
      .join('')
      .trim();
    if (!texto) return { ok: false, motivo: 'sin-texto' };

    const cifras = cifrasNoConfirmadas(texto, resultados);
    if (cifras.length > 0) return { ok: false, motivo: 'cifras', cifras: cifras.length };
    return { ok: true, texto };
  }
}
