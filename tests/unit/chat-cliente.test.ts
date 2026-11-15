// Lógica del chat en el navegador (E11): qué historial se envía a /api/chat, qué se guarda en
// sessionStorage y qué ve el cliente con cada código de error. Sin DOM.
import { describe, expect, it } from 'vitest';
import { avisoDeError, historialParaEnviar, leerGuardado, LARGO_MAXIMO, MENSAJES_ENVIADOS, type MensajeChat } from '../../src/lib/chat-cliente';
import { t } from '../../src/i18n';

const cliente = (texto: string): MensajeChat => ({ rol: 'cliente', texto });
const asistente = (texto: string, remitir = false): MensajeChat => ({ rol: 'asistente', texto, ...(remitir ? { remitir: true } : {}) });

describe('historialParaEnviar', () => {
  it('envía los mensajes tal cual, terminando con la pregunta nueva', () => {
    const conversacion = [cliente('¿Tienen azúcar?'), asistente('Sí, la refinada de 1 kg.'), cliente('¿Y glas?')];
    expect(historialParaEnviar(conversacion)).toEqual([
      { rol: 'cliente', texto: '¿Tienen azúcar?' },
      { rol: 'asistente', texto: 'Sí, la refinada de 1 kg.' },
      { rol: 'cliente', texto: '¿Y glas?' },
    ]);
  });

  it(`solo los últimos ${MENSAJES_ENVIADOS}, empezando por una pregunta del cliente`, () => {
    const larga = Array.from({ length: 19 }, (_, i) => (i % 2 === 0 ? cliente(`p${i}`) : asistente(`r${i}`)));
    const enviado = historialParaEnviar(larga);
    expect(enviado.length).toBeLessThanOrEqual(MENSAJES_ENVIADOS);
    expect(enviado[0]?.rol).toBe('cliente');
    expect(enviado.at(-1)).toEqual({ rol: 'cliente', texto: 'p18' });
  });

  it('recorta las respuestas largas del asistente al máximo que acepta la API', () => {
    const [, respuesta] = historialParaEnviar([cliente('hola'), asistente('a'.repeat(900)), cliente('gracias')]);
    expect(respuesta?.texto.length).toBe(LARGO_MAXIMO);
  });

  it('no envía la marca de respuesta segura (el servidor solo acepta rol y texto)', () => {
    expect(historialParaEnviar([cliente('a'), asistente('No tengo ese dato.', true), cliente('b')])[1]).toEqual({ rol: 'asistente', texto: 'No tengo ese dato.' });
  });
});

describe('leerGuardado', () => {
  it('recupera una conversación válida', () => {
    const guardada = [cliente('hola'), asistente('¡Hola!', true)];
    expect(leerGuardado(JSON.stringify(guardada))).toEqual(guardada);
  });

  it.each([null, '', 'no es json', '{}', '[{"rol":"sistema","texto":"x"}]', '[{"rol":"cliente","texto":5}]'])('lo que no es válido se descarta: %j', (guardado) => {
    expect(leerGuardado(guardado)).toEqual([]);
  });

  it('descarta solo los mensajes que no valen y se queda con los últimos 40', () => {
    const muchos = Array.from({ length: 50 }, (_, i) => cliente(`p${i}`));
    const leidos = leerGuardado(JSON.stringify([{ rol: 'x' }, ...muchos]));
    expect(leidos).toHaveLength(40);
    expect(leidos.at(-1)).toEqual(cliente('p49'));
  });
});

describe('avisoDeError', () => {
  it.each([
    ['entrada', 'chat.error.entrada', false, true],
    ['verificacion', 'chat.error.verificacion', false, true],
    ['limite', 'chat.error.limite', false, true],
    ['tope', 'chat.error.tope', true, false],
    ['no-disponible', 'chat.error.no-disponible', true, false],
    ['servidor', 'chat.error.servidor', true, false],
    ['red', 'chat.error.red', false, true],
  ] as const)('%s', (codigo, clave, remitir, reintentar) => {
    expect(avisoDeError(codigo)).toEqual({ texto: t(clave), remitir, reintentar });
  });

  it('un código desconocido es un error del servidor', () => {
    expect(avisoDeError('otra-cosa')).toEqual(avisoDeError('servidor'));
    expect(avisoDeError(undefined)).toEqual(avisoDeError('servidor'));
  });
});
