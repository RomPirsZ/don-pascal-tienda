// Carrito en el navegador (plan §5). Sin dependencias: la lógica vive en lib/carrito.ts y
// aquí solo se lee y guarda localStorage, se pinta el <dialog> y se atienden los botones.
// Todo el texto del catálogo se escribe con textContent, nunca como HTML.
import { t } from '../i18n';
import { anadir, fijarCantidad, mensajePedido, normalizar, quitar, resumir, type Linea, type ProductoCarrito } from '../lib/carrito';
import { formatoBs, formatoUsd, precioUnitario } from '../lib/precios';
import { enlaceWhatsApp } from '../lib/whatsapp';
import { pulsoContador } from './movimiento';

interface Datos {
  tasa: number;
  tasaFecha: string;
  numero: string | null;
  productos: (ProductoCarrito & { foto: string | null })[];
}

const CLAVE = 'don-pascal:carrito';

function leer(): Linea[] {
  try {
    return normalizar(JSON.parse(localStorage.getItem(CLAVE) ?? '[]'));
  } catch {
    return [];
  }
}

function guardar(lineas: Linea[]): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lineas));
  } catch {
    // Sin almacenamiento (modo privado estricto): el carrito vive mientras dure la página
  }
}

const $ = <T extends Element>(raiz: ParentNode, selector: string) => raiz.querySelector<T>(selector);

export function iniciarCarrito(): void {
  const bloque = document.getElementById('carrito-datos');
  const dialogo = document.getElementById('carrito') as HTMLDialogElement | null;
  const plantilla = document.getElementById('carrito-linea') as HTMLTemplateElement | null;
  if (!bloque || !dialogo || !plantilla) return;

  const datos = JSON.parse(bloque.textContent ?? '{}') as Datos;
  let lineas = leer();

  const lista = $<HTMLUListElement>(dialogo, '[data-carrito-lista]')!;
  const vacio = $<HTMLElement>(dialogo, '[data-carrito-vacio]')!;
  const pie = $<HTMLElement>(dialogo, '[data-carrito-pie]')!;
  const estado = $<HTMLElement>(dialogo, '[data-carrito-estado]')!;
  const anuncio = $<HTMLElement>(document, '[data-carrito-anuncio]')!;

  function cambiar(nuevas: Linea[]): void {
    lineas = nuevas;
    guardar(lineas);
    pintar();
  }

  function pintar(): void {
    const resumen = resumir(lineas, datos.productos, datos.tasa);
    // Lo que ya no existe o está agotado se quita del carrito guardado
    if (resumen.omitidos.length > 0) {
      lineas = lineas.filter((l) => !resumen.omitidos.includes(l.slug));
      guardar(lineas);
    }
    $<HTMLElement>(dialogo!, '[data-carrito-omitidos]')!.hidden = resumen.omitidos.length === 0;

    for (const boton of document.querySelectorAll<HTMLButtonElement>('[data-carrito-abrir]')) {
      const cantidad = $<HTMLElement>(boton, '[data-carrito-cantidad]');
      if (cantidad) cantidad.textContent = String(resumen.unidades);
      const unidades = $<HTMLElement>(boton, '[data-carrito-unidades-sr]');
      if (unidades) unidades.textContent = resumen.unidades === 1 ? t('carrito.unidad-sr') : t('carrito.unidades-sr');
    }

    const hayItems = resumen.items.length > 0;
    vacio.hidden = hayItems;
    lista.hidden = !hayItems;
    pie.hidden = !hayItems;
    if (!hayItems) return;

    lista.replaceChildren(
      ...resumen.items.map((item) => {
        const fila = plantilla!.content.firstElementChild!.cloneNode(true) as HTMLLIElement;
        const { producto } = item;
        const foto = datos.productos.find((p) => p.slug === producto.slug)?.foto;
        const img = $<HTMLImageElement>(fila, '[data-foto]')!;
        if (foto) img.src = foto;
        else img.remove();
        $<HTMLElement>(fila, '[data-nombre]')!.textContent = producto.nombre;
        $<HTMLElement>(fila, '[data-presentacion]')!.textContent = producto.presentacion;
        $<HTMLElement>(fila, '[data-mayor]')!.hidden = !item.alMayor;
        const pista = $<HTMLElement>(fila, '[data-pista]')!;
        if (!item.alMayor && producto.minimoMayor && precioUnitario(producto, producto.minimoMayor) < item.unitario) {
          pista.textContent = t('carrito.pista-mayor', { n: String(producto.minimoMayor), precio: formatoUsd(precioUnitario(producto, producto.minimoMayor)) });
          pista.hidden = false;
        }
        $<HTMLElement>(fila, '[data-cantidad]')!.textContent = String(item.cantidad);
        $<HTMLElement>(fila, '[data-subtotal]')!.textContent = formatoUsd(item.subtotal);
        for (const [accion, texto] of [['menos', 'carrito.menos'], ['mas', 'carrito.mas'], ['quitar', 'carrito.quitar']] as const) {
          const boton = $<HTMLButtonElement>(fila, `[data-accion="${accion}"]`)!;
          boton.dataset['slug'] = producto.slug;
          boton.setAttribute('aria-label', t(texto, { nombre: producto.nombre }));
        }
        return fila;
      }),
    );

    $<HTMLElement>(dialogo!, '[data-carrito-unidades]')!.textContent = resumen.unidades === 1 ? t('carrito.unidad') : t('carrito.unidades', { n: String(resumen.unidades) });
    $<HTMLElement>(dialogo!, '[data-carrito-total]')!.textContent = formatoUsd(resumen.total);
    $<HTMLElement>(dialogo!, '[data-carrito-total-bs]')!.textContent = formatoBs(resumen.totalBs);

    const mensaje = mensajePedido(resumen, { tasa: datos.tasa, tasaFecha: datos.tasaFecha });
    const enlace = enlaceWhatsApp(mensaje, datos.numero);
    const enviar = $<HTMLAnchorElement>(dialogo!, '[data-carrito-enviar]')!;
    enviar.hidden = !enlace;
    if (enlace) enviar.href = enlace;
    $<HTMLElement>(dialogo!, '[data-carrito-copia]')!.hidden = Boolean(enlace);
    $<HTMLElement>(dialogo!, '[data-carrito-mensaje]')!.textContent = mensaje;
  }

  // Con JS, el carrito sustituye a los enlaces directos de WhatsApp de cada producto
  for (const el of document.querySelectorAll<HTMLElement>('[data-anadir], [data-carrito-abrir]')) el.hidden = false;
  for (const el of document.querySelectorAll<HTMLElement>('[data-sin-js]')) el.hidden = true;

  document.addEventListener('click', (evento) => {
    const objetivo = evento.target as Element;
    const botonAnadir = objetivo.closest<HTMLElement>('[data-anadir]');
    if (botonAnadir) {
      const slug = botonAnadir.dataset['anadir']!;
      cambiar(anadir(lineas, slug));
      for (const contador of document.querySelectorAll('[data-carrito-cantidad]')) pulsoContador(contador);
      const nombre = datos.productos.find((p) => p.slug === slug)?.nombre ?? '';
      anuncio.textContent = t('carrito.anadido', { nombre });
      return;
    }
    if (objetivo.closest('[data-carrito-abrir]')) {
      estado.textContent = '';
      pintar();
      dialogo.showModal();
    }
  });

  dialogo.addEventListener('click', async (evento) => {
    const objetivo = evento.target as Element;
    // Un clic en el fondo oscuro (el propio <dialog>, fuera del panel) lo cierra
    if (objetivo === dialogo || objetivo.closest('[data-carrito-cerrar]')) {
      dialogo.close();
      return;
    }
    const accion = objetivo.closest<HTMLButtonElement>('[data-accion]');
    if (accion) {
      const slug = accion.dataset['slug']!;
      const actual = lineas.find((l) => l.slug === slug)?.cantidad ?? 0;
      if (accion.dataset['accion'] === 'menos') cambiar(fijarCantidad(lineas, slug, actual - 1));
      if (accion.dataset['accion'] === 'mas') cambiar(fijarCantidad(lineas, slug, actual + 1));
      if (accion.dataset['accion'] === 'quitar') cambiar(quitar(lineas, slug));
      const resumen = resumir(lineas, datos.productos, datos.tasa);
      anuncio.textContent = t('carrito.anuncio-total', { usd: formatoUsd(resumen.total), bs: formatoBs(resumen.totalBs) });
      // El foco no se pierde si la fila desapareció
      const mismo = dialogo.querySelector<HTMLButtonElement>(`[data-accion="${accion.dataset['accion']}"][data-slug="${CSS.escape(slug)}"]`);
      (mismo ?? $<HTMLButtonElement>(dialogo, '[data-carrito-cerrar]'))?.focus();
      return;
    }
    if (objetivo.closest('[data-carrito-vaciar]')) {
      cambiar([]);
      $<HTMLButtonElement>(dialogo, '[data-carrito-cerrar]')?.focus();
      return;
    }
    if (objetivo.closest('[data-carrito-copiar]')) {
      const texto = $<HTMLElement>(dialogo, '[data-carrito-mensaje]')!.textContent ?? '';
      try {
        await navigator.clipboard.writeText(texto);
        estado.textContent = t('carrito.copiado');
      } catch {
        estado.textContent = t('carrito.copiar-error');
      }
    }
  });

  // Otra pestaña cambió el carrito
  window.addEventListener('storage', (evento) => {
    if (evento.key === CLAVE) {
      lineas = leer();
      pintar();
    }
  });

  pintar();
}
