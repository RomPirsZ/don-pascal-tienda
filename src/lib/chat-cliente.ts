// Lógica del chat en el navegador (E11), sin DOM: el historial que se envía a /api/chat, lo que
// se guarda en sessionStorage (PRODUCT.md: la conversación solo vive en el navegador) y el
// aviso que ve el cliente con cada código de error de src/lib/chat-handler.ts.
import { t, type Clave } from '../i18n';

export interface MensajeChat {
  rol: 'cliente' | 'asistente';
  texto: string;
  /** Respuesta segura: el chat ofrece escribir por WhatsApp */
  remitir?: true;
}

/** Los mismos límites que valida el servidor (chat-handler.ts) */
export const MENSAJES_ENVIADOS = 12;
export const LARGO_MAXIMO = 600;
/** Lo que se guarda de una conversación en la pestaña */
const MENSAJES_GUARDADOS = 40;

/**
 * Los últimos mensajes, empezando por una pregunta y solo con rol y texto. Las respuestas del
 * asistente pueden pasar del máximo que acepta la API: se recortan (solo dan contexto).
 */
export function historialParaEnviar(conversacion: readonly MensajeChat[]): { rol: MensajeChat['rol']; texto: string }[] {
  const ultimos = conversacion.slice(-MENSAJES_ENVIADOS);
  const inicio = ultimos.findIndex((m) => m.rol === 'cliente');
  return ultimos.slice(Math.max(inicio, 0)).map(({ rol, texto }) => ({ rol, texto: texto.slice(0, LARGO_MAXIMO) }));
}

/** La conversación guardada, sin nada que no sea un mensaje válido. */
export function leerGuardado(guardado: string | null): MensajeChat[] {
  let datos: unknown;
  try {
    datos = JSON.parse(guardado ?? '[]');
  } catch {
    return [];
  }
  if (!Array.isArray(datos)) return [];
  return datos
    .flatMap((m): MensajeChat[] => {
      const { rol, texto, remitir } = (typeof m === 'object' && m !== null ? m : {}) as Record<string, unknown>;
      if ((rol !== 'cliente' && rol !== 'asistente') || typeof texto !== 'string' || texto === '') return [];
      return [remitir === true ? { rol, texto, remitir: true } : { rol, texto }];
    })
    .slice(-MENSAJES_GUARDADOS);
}

export type CodigoError = 'entrada' | 'verificacion' | 'limite' | 'tope' | 'no-disponible' | 'servidor' | 'red';

const AVISOS: Record<CodigoError, { clave: Clave; remitir: boolean; reintentar: boolean }> = {
  // La pregunta no llegó a Claude: vuelve al campo para enviarla otra vez
  entrada: { clave: 'chat.error.entrada', remitir: false, reintentar: true },
  verificacion: { clave: 'chat.error.verificacion', remitir: false, reintentar: true },
  limite: { clave: 'chat.error.limite', remitir: false, reintentar: true },
  red: { clave: 'chat.error.red', remitir: false, reintentar: true },
  // Hoy Don Pascal no puede responder: WhatsApp
  tope: { clave: 'chat.error.tope', remitir: true, reintentar: false },
  'no-disponible': { clave: 'chat.error.no-disponible', remitir: true, reintentar: false },
  servidor: { clave: 'chat.error.servidor', remitir: true, reintentar: false },
};

/** Qué se le dice al cliente, si se le ofrece WhatsApp y si su pregunta vuelve al campo. */
export function avisoDeError(codigo: unknown): { texto: string; remitir: boolean; reintentar: boolean } {
  const aviso = AVISOS[(typeof codigo === 'string' && codigo in AVISOS ? codigo : 'servidor') as CodigoError];
  return { texto: t(aviso.clave), remitir: aviso.remitir, reintentar: aviso.reintentar };
}
