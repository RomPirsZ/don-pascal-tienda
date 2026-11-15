// Batería de E12 contra la API real de Claude (plan §10). CUESTA DINERO: solo se lanza con
// `npm run test:asistente-real`, nunca con `npm test`, y con el coste aprobado antes.
//
// - Usa responder() tal cual (mismo modelo, instrucciones, herramientas y price-guard que la
//   web) con el catálogo de ejemplo, que es el mismo de Supabase. Sin Turnstile ni tope diario.
// - La clave sale de ANTHROPIC_API_KEY o de .dev.vars. Nunca se imprime.
// - Deja un informe en .bateria/ (fuera de git) con cada respuesta, su veredicto y lo que costó.
import type Anthropic from '@anthropic-ai/sdk';
import { mkdirSync, writeFileSync } from 'node:fs';
import { afterAll, describe, expect, it } from 'vitest';
import { crearCliente, MODELO, responder, type ClienteClaude } from '../../src/lib/asistente/claude';
import { CASOS, CATALOGO, evaluar, type Ejecucion, type Resultado } from './casos';

try {
  process.loadEnvFile('.dev.vars');
} catch {
  // Sin .dev.vars: vale la variable de entorno, si la hay
}
const clave = process.env['ANTHROPIC_API_KEY'];

/** Dólares por millón de tokens de Claude Opus 5.5 (skill claude-api, 2026-11-03); la escritura de caché de 5 min es 1,25 × la entrada. */
const PRECIO = { entrada: 4, salida: 20, escrituraCache: 5, lecturaCache: 0.2 };
/** Si la batería pasa de este gasto, no se lanzan más preguntas (el coste aprobado es menor). */
const LIMITE_USD = 1.5;

type RespuestaApi = Anthropic.Beta.Messages.BetaMessage;

/** El cliente real, guardando cada respuesta para el informe. */
function grabador(real: ClienteClaude) {
  const respuestas: RespuestaApi[] = [];
  const cliente: ClienteClaude = {
    beta: {
      messages: {
        create: async (params) => {
          const r = await real.beta.messages.create(params);
          respuestas.push(r);
          return r;
        },
      },
    },
  };
  return { cliente, respuestas };
}

function coste(respuestas: readonly RespuestaApi[]) {
  let tokens = { entrada: 0, salida: 0, escrituraCache: 0, lecturaCache: 0 };
  for (const { usage } of respuestas) {
    tokens = {
      entrada: tokens.entrada + usage.input_tokens,
      salida: tokens.salida + usage.output_tokens,
      escrituraCache: tokens.escrituraCache + (usage.cache_creation_input_tokens ?? 0),
      lecturaCache: tokens.lecturaCache + (usage.cache_read_input_tokens ?? 0),
    };
  }
  const usd =
    (tokens.entrada * PRECIO.entrada + tokens.salida * PRECIO.salida + tokens.escrituraCache * PRECIO.escrituraCache + tokens.lecturaCache * PRECIO.lecturaCache) /
    1e6;
  return { tokens, usd };
}

interface Fila {
  id: string;
  trampa: string;
  preguntas: string[];
  ejecucion?: Ejecucion;
  resultado?: Resultado;
  error?: string;
  llamadas: number;
  modelos: string[];
  respaldo: boolean;
  usd: number;
}
const filas: Fila[] = [];
/** Motivo para no lanzar más preguntas: clave mala, sin crédito o gasto por encima del límite. */
let detener: string | undefined;

describe.skipIf(!clave)('batería de preguntas trampa (API real)', () => {
  afterAll(() => escribirInforme(filas));

  for (const caso of CASOS) {
    it(caso.id, async ({ skip }) => {
      if (detener) skip(detener);
      const { cliente, respuestas } = grabador(crearCliente(clave as string));
      const fila: Fila = {
        id: caso.id,
        trampa: caso.trampa,
        preguntas: caso.historial.map((m) => `${m.rol}: ${m.texto}`),
        llamadas: 0,
        modelos: [],
        respaldo: false,
        usd: 0,
      };
      filas.push(fila);
      try {
        const respuesta = await responder(cliente, CATALOGO, caso.historial);
        const ultima = respuestas.at(-1);
        const ejecucion: Ejecucion = {
          respuesta,
          textoModelo: (ultima?.content ?? []).flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('').trim(),
          herramientas: respuestas.flatMap((r) => r.content.flatMap((b) => (b.type === 'tool_use' ? [{ nombre: b.name, entrada: b.input }] : []))),
        };
        fila.ejecucion = ejecucion;
        fila.resultado = evaluar(caso, ejecucion);
      } catch (error) {
        // Ni el mensaje: podría citar la petición. El tipo y el estado bastan
        const status = (error as { status?: unknown })?.status;
        fila.error = `${error instanceof Error ? error.constructor.name : typeof error} ${String(status ?? '')}`.trim();
        // 400 (sin crédito o tope de gasto), 401 y 403: las demás preguntas fallarían igual
        if (status === 400 || status === 401 || status === 403) detener = `la API respondió ${String(status)}`;
      } finally {
        fila.llamadas = respuestas.length;
        fila.modelos = [...new Set(respuestas.map((r) => r.model))];
        fila.respaldo = respuestas.some((r) => (r.usage as { iterations?: { type: string }[] }).iterations?.some((i) => i.type === 'fallback_message'));
        fila.usd = coste(respuestas).usd;
        const gastado = filas.reduce((s, f) => s + f.usd, 0);
        if (gastado > LIMITE_USD) detener = `gasto de $${gastado.toFixed(2)}, por encima de $${LIMITE_USD}`;
      }
      expect(fila.error).toBeUndefined();
      expect(fila.resultado?.veredicto).not.toBe('falla');
    });
  }
});

function escribirInforme(filas: readonly Fila[]) {
  const cuenta = (v: string) => filas.filter((f) => (f.resultado?.veredicto ?? 'error') === v).length;
  const total = filas.reduce((s, f) => s + f.usd, 0);
  const fecha = new Date().toISOString();
  const lineas = [
    `# Batería E12 — ${fecha}`,
    '',
    `Modelo pedido: \`${MODELO}\`. Casos lanzados: ${filas.length} de ${CASOS.length}. Coste estimado: **$${total.toFixed(4)}**.`,
    '',
    ...(detener ? [`Se detuvo: ${detener}.`, ''] : []),
    `| pasa | revisar | bloqueada | falla | error |`,
    `|---|---|---|---|---|`,
    `| ${cuenta('pasa')} | ${cuenta('revisar')} | ${cuenta('bloqueada')} | ${cuenta('falla')} | ${cuenta('error')} |`,
    '',
  ];
  for (const f of filas) {
    const veredicto = f.resultado?.veredicto ?? 'error';
    lineas.push(`## ${f.id}: ${veredicto}`, '', `*${f.trampa}*`, '');
    for (const p of f.preguntas) lineas.push(`> ${p}`);
    lineas.push('');
    if (f.error) lineas.push(`Error: \`${f.error}\``, '');
    if (f.ejecucion) {
      const herramientas = f.ejecucion.herramientas.map((h) => `\`${h.nombre}(${JSON.stringify(h.entrada)})\``).join(', ') || 'ninguna';
      lineas.push(`Herramientas: ${herramientas}`, '');
      lineas.push('Texto del modelo:', '', '```', f.ejecucion.textoModelo || '(vacío)', '```', '');
      if (!f.ejecucion.respuesta.ok) lineas.push('El cliente recibe la respuesta segura (remitir a WhatsApp).', '');
    }
    if (f.resultado?.motivos.length) lineas.push(`Motivos: ${f.resultado.motivos.join('; ')}`, '');
    lineas.push(`Llamadas: ${f.llamadas} · modelos: ${f.modelos.join(', ') || '—'}${f.respaldo ? ' · **respondió el modelo de respaldo**' : ''} · $${f.usd.toFixed(4)}`, '');
  }
  mkdirSync('.bateria', { recursive: true });
  const ruta = `.bateria/informe-${fecha.replace(/[:.]/g, '-')}.md`;
  writeFileSync(ruta, lineas.join('\n'));
  console.log(`Informe: ${ruta} · coste estimado $${total.toFixed(4)}`);
}
