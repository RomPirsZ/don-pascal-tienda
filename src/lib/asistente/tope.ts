// Tope diario de respuestas del asistente (plan §6), compartido entre la web y WhatsApp. Usa
// la API REST de Supabase con la clave publicable: anon solo puede insertar el canal en
// chat_uso y contar con chat_count_24h(), que devuelve el número y nada más (supabase/tienda.sql).

export const TOPE_POR_DEFECTO = 30;

export type Canal = 'web' | 'whatsapp';

interface Conexion {
  /** URL del proyecto (https://<ref>.supabase.co) */
  url: string;
  /** Clave publicable; nunca la secreta */
  key: string;
  /** Inyectable para los tests */
  fetch?: typeof globalThis.fetch;
  timeoutMs?: number;
}

const esTimeout = (error: unknown) => error instanceof Error && error.name === 'TimeoutError';
const base = (url: string) => `${url.replace(/\/+$/, '')}/rest/v1`;

/** El tope de la variable TOPE_DIARIO del Worker; si no es un entero desde 0, el de por defecto. */
export function topeDiario(valor: unknown): number {
  return typeof valor === 'string' && /^\d{1,6}$/.test(valor) ? Number(valor) : TOPE_POR_DEFECTO;
}

/** Respuestas de las últimas 24 horas. Un fallo es un error, nunca un cero: el tope falla cerrado. */
export async function contarRespuestas({ url, key, fetch = globalThis.fetch, timeoutMs = 3000 }: Conexion): Promise<{ cuenta: number } | { error: string }> {
  if (!url || !key) return { error: 'sin-configuracion' };
  try {
    const respuesta = await fetch(`${base(url)}/rpc/chat_count_24h`, {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!respuesta.ok) return { error: `http-${respuesta.status}` };
    // PostgREST devuelve el número suelto
    const cuenta: unknown = await respuesta.json().catch(() => null);
    return typeof cuenta === 'number' && Number.isInteger(cuenta) && cuenta >= 0 ? { cuenta } : { error: 'respuesta-invalida' };
  } catch (error) {
    return { error: esTimeout(error) ? 'timeout' : 'red' };
  }
}

/** Apunta una respuesta en chat_uso: solo el canal; la hora la pone la base de datos. */
export async function registrarRespuesta(canal: Canal, { url, key, fetch = globalThis.fetch, timeoutMs = 3000 }: Conexion): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!url || !key) return { ok: false, error: 'sin-configuracion' };
  try {
    const respuesta = await fetch(`${base(url)}/chat_uso`, {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ canal }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    return respuesta.ok ? { ok: true } : { ok: false, error: `http-${respuesta.status}` };
  } catch (error) {
    return { ok: false, error: esTimeout(error) ? 'timeout' : 'red' };
  }
}
