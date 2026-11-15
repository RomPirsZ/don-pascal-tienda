// Chat en el navegador (E11). Se descarga al abrirlo por primera vez (src/components/Chat.astro).
// La lógica sin DOM vive en lib/chat-cliente.ts; aquí se pinta, se guarda en sessionStorage y se
// habla con /api/chat. Todo lo que escribe el cliente o responde el asistente va con
// textContent, nunca como HTML.
import { t } from '../i18n';
import { avisoDeError, historialParaEnviar, leerGuardado, type MensajeChat } from '../lib/chat-cliente';
import { mountTurnstile, type TurnstileWidget } from '../lib/turnstile-widget';
import { enlaceWhatsApp } from '../lib/whatsapp';

const CLAVE = 'don-pascal:chat';
/** Claude puede tardar: hasta dos intentos de 30 s en el servidor */
const ESPERA_MS = 70_000;

let abrir: (() => void) | undefined;

export function abrirChat(): void {
  const dialogo = document.getElementById('chat') as HTMLDialogElement | null;
  if (!dialogo) return;
  abrir ??= iniciar(dialogo);
  abrir();
}

function leer(): MensajeChat[] {
  try {
    return leerGuardado(sessionStorage.getItem(CLAVE));
  } catch {
    return [];
  }
}

function guardar(conversacion: MensajeChat[]): void {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(conversacion));
  } catch {
    // Sin almacenamiento: la conversación dura lo que la página
  }
}

function iniciar(dialogo: HTMLDialogElement): () => void {
  const $ = <T extends Element>(selector: string) => dialogo.querySelector<T>(selector)!;
  const lista = $<HTMLOListElement>('[data-chat-lista]');
  const sugerencias = $<HTMLUListElement>('[data-chat-sugerencias]');
  const borrar = $<HTMLButtonElement>('[data-chat-borrar]');
  const desplazable = $<HTMLElement>('[data-chat-desplazable]');
  const form = $<HTMLFormElement>('[data-chat-form]');
  const campo = $<HTMLInputElement>('#chat-campo');
  const enviarBoton = $<HTMLButtonElement>('[data-chat-enviar]');
  const anuncio = document.querySelector<HTMLElement>('[data-chat-anuncio]')!;
  const plantilla = (id: string) => (document.getElementById(id) as HTMLTemplateElement).content.firstElementChild!.cloneNode(true) as HTMLLIElement;
  const numero = dialogo.dataset['numero'] || null;

  let conversacion = leer();
  let enviando = false;
  let turnstile: TurnstileWidget | undefined;

  const alFinal = () => {
    desplazable.scrollTop = desplazable.scrollHeight;
  };

  function whatsapp(fila: HTMLElement, pregunta: string): void {
    const enlace = enlaceWhatsApp(`${t('chat.whatsapp-texto')} ${pregunta}`.trim(), numero);
    const boton = fila.querySelector<HTMLAnchorElement>('[data-whatsapp]');
    if (!boton || !enlace) return;
    boton.href = enlace;
    boton.hidden = false;
  }

  function pintar(mensaje: MensajeChat): HTMLLIElement {
    const fila = plantilla(mensaje.rol === 'cliente' ? 'chat-mensaje-cliente' : 'chat-mensaje-asistente');
    // Las instrucciones piden texto sencillo; si se cuela una negrita de markdown, sin asteriscos
    fila.querySelector('[data-texto]')!.textContent = mensaje.rol === 'asistente' ? mensaje.texto.replace(/\*\*/g, '') : mensaje.texto;
    if (mensaje.remitir) whatsapp(fila, ultimaPregunta());
    lista.append(fila);
    return fila;
  }

  function ultimaPregunta(): string {
    return conversacion.findLast((m) => m.rol === 'cliente')?.texto ?? '';
  }

  /** Avisos de error: se ven y se anuncian, pero no se guardan ni se envían a la API. */
  function avisar(texto: string, remitir: boolean): void {
    const fila = plantilla('chat-mensaje-asistente');
    const parrafo = fila.querySelector<HTMLElement>('[data-texto]')!;
    parrafo.textContent = texto;
    parrafo.classList.add('text-aji-texto');
    if (remitir) whatsapp(fila, ultimaPregunta());
    lista.append(fila);
    anuncio.textContent = texto;
  }

  function actualizar(): void {
    sugerencias.hidden = conversacion.some((m) => m.rol === 'cliente');
    borrar.hidden = conversacion.length === 0;
  }

  async function preguntar(texto: string): Promise<void> {
    const pregunta = texto.trim();
    if (enviando || !pregunta) return;
    enviando = true;
    enviarBoton.setAttribute('aria-disabled', 'true');
    campo.value = '';

    conversacion.push({ rol: 'cliente', texto: pregunta });
    guardar(conversacion);
    const filaPregunta = pintar({ rol: 'cliente', texto: pregunta });
    actualizar();
    const escribiendo = plantilla('chat-escribiendo');
    lista.append(escribiendo);
    alFinal();

    const fallar = (codigo: unknown) => {
      const aviso = avisoDeError(codigo);
      if (aviso.reintentar) {
        // La pregunta no llegó a Don Pascal: vuelve al campo para enviarla otra vez
        conversacion.pop();
        guardar(conversacion);
        filaPregunta.remove();
        campo.value = pregunta;
        actualizar();
      }
      avisar(aviso.texto, aviso.remitir);
    };

    try {
      turnstile ??= mountTurnstile(dialogo.querySelector<HTMLElement>('[data-chat-turnstile]')!, {
        sitekey: dialogo.dataset['sitekey'] ?? '',
        lang: 'es',
        theme: 'light',
      });
      let token: string;
      try {
        token = await turnstile.token(30_000);
      } catch {
        fallar('verificacion');
        return;
      }
      const respuesta = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ mensajes: historialParaEnviar(conversacion), turnstile: token }),
        signal: AbortSignal.timeout(ESPERA_MS),
      });
      const datos = (await respuesta.json().catch(() => ({}))) as { texto?: unknown; remitir?: unknown; error?: unknown };
      if (!respuesta.ok || typeof datos.texto !== 'string') {
        fallar(datos.error);
        return;
      }
      const mensaje: MensajeChat = datos.remitir === true ? { rol: 'asistente', texto: datos.texto, remitir: true } : { rol: 'asistente', texto: datos.texto };
      conversacion.push(mensaje);
      guardar(conversacion);
      pintar(mensaje);
      anuncio.textContent = t('chat.anuncio', { texto: mensaje.texto });
    } catch {
      fallar('red');
    } finally {
      // Cada token de Turnstile vale para una sola pregunta (plan §6)
      turnstile?.reset();
      escribiendo.remove();
      enviando = false;
      enviarBoton.removeAttribute('aria-disabled');
      actualizar();
      alFinal();
      if (dialogo.open) campo.focus();
    }
  }

  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    void preguntar(campo.value);
  });

  dialogo.addEventListener('click', (evento) => {
    const objetivo = evento.target as Element;
    // Un clic en el fondo oscuro (el propio <dialog>, fuera del panel) lo cierra
    if (objetivo === dialogo || objetivo.closest('[data-chat-cerrar]')) {
      dialogo.close();
      return;
    }
    const sugerencia = objetivo.closest<HTMLButtonElement>('[data-chat-sugerencia]');
    if (sugerencia) {
      void preguntar(sugerencia.textContent ?? '');
      campo.focus();
      return;
    }
    if (objetivo.closest('[data-chat-borrar]')) {
      conversacion = [];
      guardar(conversacion);
      // Se queda solo el saludo
      for (const fila of [...lista.children].slice(1)) fila.remove();
      actualizar();
      anuncio.textContent = t('chat.borrada');
      campo.focus();
    }
  });

  for (const mensaje of conversacion) pintar(mensaje);
  actualizar();

  return () => {
    if (!dialogo.open) dialogo.showModal();
    alFinal();
    campo.focus();
  };
}
