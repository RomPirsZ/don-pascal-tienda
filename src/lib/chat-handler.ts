// POST /api/chat (plan §6): método → tamaño → JSON → Turnstile → límite por IP → tope diario →
// Claude (con price-guard) → apuntar en chat_uso.
// Recibe el entorno, el límite, el catálogo, Claude, fetch y los logs como dependencias, para
// probarse sin red ni Worker; src/pages/api/chat.ts solo lo conecta con el runtime.
import { t } from '../i18n';
import { responder, type ClienteClaude, type Mensaje } from './asistente/claude';
import { contarRespuestas, registrarRespuesta, topeDiario } from './asistente/tope';
import type { Catalogo } from './catalogo';
import { rateLimitKey, type RateLimitResult } from './rate-limit';
import { SERVER_SECURITY_HEADERS } from './server-headers';
import { verifyTurnstile } from './turnstile';

/** 12 mensajes de 600 caracteres (hasta 4 bytes cada uno en UTF-8) más el token, con holgura. */
export const MAX_BYTES = 32 * 1024;
const MENSAJES_MAXIMOS = 12;
const LARGO_MAXIMO = 600;

/** Códigos estables: el widget (E11) los traduce con src/i18n. */
export type ErrorChat = 'entrada' | 'verificacion' | 'metodo' | 'tamano' | 'limite' | 'tope' | 'no-disponible' | 'servidor';

/** `remitir`: la respuesta segura, el widget ofrece escribir por WhatsApp. */
export type RespuestaChat = { texto: string; remitir?: true } | { error: ErrorChat };

const ESTADO: Record<ErrorChat, number> = {
  entrada: 400,
  verificacion: 403,
  metodo: 405,
  tamano: 413,
  limite: 429,
  tope: 503,
  'no-disponible': 503,
  servidor: 500,
};

/** Códigos de Turnstile que indican un fallo de configuración, no un visitante sospechoso. */
const TURNSTILE_CONFIGURACION = ['missing-input-secret', 'invalid-input-secret'];

// public/_headers no llega a lo que responde el Worker (plan §8): se ponen aquí
const CABECERAS = { 'Cache-Control': 'no-store', ...SERVER_SECURITY_HEADERS };

/** Solo códigos y números, nunca lo que escribió el visitante ni lo que respondió Claude (constitución V y X). */
export type LogChat = (nivel: 'warn' | 'error', evento: string, detalle?: Record<string, unknown>) => void;

export interface DepsChat {
  /** Variables y secretos del Worker: TURNSTILE_SECRET_KEY, ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY y TOPE_DIARIO. */
  env: Record<string, unknown>;
  limitador: { check(clave: string): RateLimitResult };
  /** El catálogo, o undefined si no se pudo leer */
  catalogo: () => Promise<Catalogo | undefined>;
  /** Crea el cliente de Claude con la clave de la API */
  claude: (clave: string) => ClienteClaude;
  fetch?: typeof globalThis.fetch;
  log?: LogChat;
}

const escribirLog: LogChat = (nivel, evento, detalle) => console[nivel](JSON.stringify({ evento: `chat.${evento}`, ...detalle }));

export async function atenderChat(request: Request, { env, limitador, catalogo, claude, fetch = globalThis.fetch, log = escribirLog }: DepsChat): Promise<Response> {
  if (request.method !== 'POST') {
    await request.body?.cancel();
    return responderJson({ error: 'metodo' }, { Allow: 'POST' });
  }
  const ajuste = (clave: string) => {
    const valor = env[clave];
    return typeof valor === 'string' ? valor : '';
  };
  // Cloudflare la pone en cada petición y sustituye la que mande el cliente
  const ip = request.headers.get('cf-connecting-ip') ?? '';

  const bytes = await leerLimitado(request, MAX_BYTES);
  if (!bytes) return responderJson({ error: 'tamano' });
  const tipo = (request.headers.get('content-type') ?? '').split(';')[0]!.trim().toLowerCase();
  const pedido = tipo === 'application/json' ? leerPedido(bytes) : null;
  if (!pedido) return responderJson({ error: 'entrada' });

  // Sin log: un token ausente o rechazado no le cuesta nada a quien ataca, y cada log gasta cupo
  const humano = await verifyTurnstile(pedido.turnstile, { secret: ajuste('TURNSTILE_SECRET_KEY'), remoteip: ip || undefined, fetch });
  if (!humano.success) {
    if (humano.errorCodes.some((c) => TURNSTILE_CONFIGURACION.includes(c))) {
      log('error', 'turnstile-mal-configurado', { codigos: humano.errorCodes });
      return responderJson({ error: 'servidor' });
    }
    return responderJson({ error: 'verificacion' });
  }

  const limite = limitador.check(rateLimitKey(ip));
  if (!limite.allowed) {
    log('warn', 'limite', { retryAfter: limite.retryAfter });
    return responderJson({ error: 'limite' }, { 'Retry-After': String(limite.retryAfter) });
  }

  const faltan = ['ANTHROPIC_API_KEY', 'SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY'].filter((clave) => !ajuste(clave));
  if (faltan.length > 0) {
    log('error', 'configuracion-incompleta', { faltan });
    return responderJson({ error: 'servidor' });
  }
  const supabase = { url: ajuste('SUPABASE_URL'), key: ajuste('SUPABASE_PUBLISHABLE_KEY'), fetch };

  // El tope protege el gasto: si no se puede contar, no se llama a Claude
  const cuenta = await contarRespuestas(supabase);
  if ('error' in cuenta) {
    log('error', 'cuenta-fallida', { error: cuenta.error });
    return responderJson({ error: 'servidor' });
  }
  const tope = topeDiario(env['TOPE_DIARIO']);
  if (cuenta.cuenta >= tope) {
    log('warn', 'tope', { cuenta: cuenta.cuenta, tope });
    return responderJson({ error: 'tope' });
  }

  const datos = await catalogo();
  if (!datos) return responderJson({ error: 'servidor' });

  let respuesta: Awaited<ReturnType<typeof responder>> | undefined;
  try {
    respuesta = await responder(claude(ajuste('ANTHROPIC_API_KEY')), datos, pedido.mensajes);
  } catch (error) {
    // Ni el mensaje del error: podría citar la petición
    log('error', 'claude-error', { tipo: error instanceof Error ? error.name : typeof error, status: (error as { status?: unknown })?.status });
  }

  // Se apunta aunque Claude haya fallado o la respuesta no se envíe: pudo costar igual
  const uso = await registrarRespuesta('web', supabase);
  if (!uso.ok) log('error', 'uso-fallido', { error: uso.error });

  if (!respuesta) return responderJson({ error: 'no-disponible' });
  if (!respuesta.ok) {
    if (respuesta.motivo === 'cifras') log('warn', 'guard-blocked', { cifras: respuesta.cifras });
    else log('warn', 'respuesta-segura', { motivo: respuesta.motivo });
    return responderJson({ texto: t('chat.segura'), remitir: true });
  }
  return responderJson({ texto: respuesta.texto });
}

function responderJson(cuerpo: RespuestaChat, cabeceras?: Record<string, string>): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: 'error' in cuerpo ? ESTADO[cuerpo.error] : 200,
    headers: { ...CABECERAS, 'Content-Type': 'application/json; charset=utf-8', ...cabeceras },
  });
}

/**
 * El historial y el token, o null si no son válidos. Solo texto con roles conocidos: ni
 * bloques de herramientas ni roles de sistema desde el navegador (plan §6).
 */
function leerPedido(bytes: Uint8Array): { mensajes: Mensaje[]; turnstile: unknown } | null {
  let datos: unknown;
  try {
    datos = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
  if (typeof datos !== 'object' || datos === null || Array.isArray(datos)) return null;
  const { mensajes, turnstile } = datos as Record<string, unknown>;
  if (!Array.isArray(mensajes) || mensajes.length === 0 || mensajes.length > MENSAJES_MAXIMOS) return null;

  const validos: Mensaje[] = [];
  for (const m of mensajes) {
    const { rol, texto } = (typeof m === 'object' && m !== null ? m : {}) as Record<string, unknown>;
    if ((rol !== 'cliente' && rol !== 'asistente') || typeof texto !== 'string') return null;
    const limpio = texto.trim();
    if (limpio.length === 0 || limpio.length > LARGO_MAXIMO) return null;
    validos.push({ rol, texto: limpio });
  }
  if (validos[validos.length - 1]?.rol !== 'cliente') return null;
  return { mensajes: validos, turnstile };
}

/** El cuerpo, o null si pasa de `max` bytes (se corta al pasarse, sin leer el resto). Del portafolio. */
async function leerLimitado(request: Request, max: number): Promise<Uint8Array | null> {
  if (Number(request.headers.get('content-length')) > max) {
    await request.body?.cancel();
    return null;
  }
  const trozos: Uint8Array[] = [];
  let tamano = 0;
  if (request.body) {
    const lector = request.body.getReader();
    for (;;) {
      const { done, value } = await lector.read();
      if (done) break;
      tamano += value.byteLength;
      if (tamano > max) {
        await lector.cancel();
        return null;
      }
      trozos.push(value);
    }
  }
  const bytes = new Uint8Array(tamano);
  let posicion = 0;
  for (const trozo of trozos) {
    bytes.set(trozo, posicion);
    posicion += trozo.byteLength;
  }
  return bytes;
}
