// Tope diario del asistente (plan §6): cuenta las respuestas de 24 horas con chat_count_24h() y
// registra cada una en chat_uso, con la API REST de Supabase y la clave publicable.
import { describe, expect, it, vi } from 'vitest';
import { contarRespuestas, registrarRespuesta, topeDiario, TOPE_POR_DEFECTO } from '../../src/lib/asistente/tope';

const URL_SUPABASE = 'https://proyecto.supabase.co/';
const conf = (fetch: typeof globalThis.fetch) => ({ url: URL_SUPABASE, key: 'sb_publishable_prueba', fetch });

describe('contarRespuestas', () => {
  it('llama a chat_count_24h con la clave publicable y devuelve el número', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json(7));
    expect(await contarRespuestas(conf(fetch))).toEqual({ cuenta: 7 });
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe('https://proyecto.supabase.co/rest/v1/rpc/chat_count_24h');
    expect(init?.method).toBe('POST');
    expect(new Headers(init?.headers).get('apikey')).toBe('sb_publishable_prueba');
  });

  it.each([
    ['un error HTTP', async () => new Response('{}', { status: 404 }), 'http-404'],
    ['una respuesta que no es un número', async () => Response.json('7'), 'respuesta-invalida'],
    ['un número negativo', async () => Response.json(-1), 'respuesta-invalida'],
    ['un fallo de red', async () => Promise.reject(new TypeError('red')), 'red'],
  ])('%s es un error, nunca un cero', async (_caso, respuesta, error) => {
    expect(await contarRespuestas(conf(vi.fn<typeof globalThis.fetch>(respuesta)))).toEqual({ error });
  });

  it('sin configuración no llama a nadie', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    expect(await contarRespuestas({ url: '', key: '', fetch })).toEqual({ error: 'sin-configuracion' });
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('registrarRespuesta', () => {
  it('inserta solo el canal en chat_uso, sin pedir la fila de vuelta', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(null, { status: 201 }));
    expect(await registrarRespuesta('web', conf(fetch))).toEqual({ ok: true });
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe('https://proyecto.supabase.co/rest/v1/chat_uso');
    expect(JSON.parse(init?.body as string)).toEqual({ canal: 'web' });
    expect(new Headers(init?.headers).get('prefer')).toBe('return=minimal');
  });

  it('un fallo se devuelve como error', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(null, { status: 401 }));
    expect(await registrarRespuesta('whatsapp', conf(fetch))).toEqual({ ok: false, error: 'http-401' });
  });
});

describe('topeDiario', () => {
  it(`por defecto, ${TOPE_POR_DEFECTO}`, () => {
    expect(TOPE_POR_DEFECTO).toBe(30);
    expect(topeDiario(undefined)).toBe(30);
  });

  it('se puede cambiar con la variable del Worker', () => {
    expect(topeDiario('10')).toBe(10);
    expect(topeDiario('0')).toBe(0);
  });

  it.each(['', 'treinta', '-3', '2.5', '1e3'])('un valor que no es un entero desde 0 deja el de por defecto: %j', (valor) => {
    expect(topeDiario(valor)).toBe(30);
  });
});
