// Movimiento que necesita JS (E14, spec §8). El CSS (src/styles/global.css) hace el resto.
// - Secciones al hacer scroll: solo se esconde lo que está por debajo de la pantalla al cargar,
//   y se muestra al entrar. Sin JS, si falla o con reduced-motion, todo está visible desde el
//   principio (constitución I y II).
// - Las listas marcadas con data-revelar-lista se escalonan (el índice lo pone el CSS).
// - El vaivén de las insignias del hero se pausa cuando el hero no se ve.

export function iniciarMovimiento(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  // Después de pintar y en un momento libre: no compite con la primera pantalla (E16, Lighthouse).
  // Para entonces solo se esconde lo que siga por debajo de la pantalla, así que nada visible parpadea.
  if ('requestIdleCallback' in window) requestIdleCallback(empezar, { timeout: 600 });
  else setTimeout(empezar, 200);
}

function empezar(): void {
  // El índice del escalonado lo pone el CSS (nth-child); aquí solo se marca qué se revela
  for (const lista of document.querySelectorAll<HTMLElement>('[data-revelar-lista]')) {
    for (const hijo of lista.children) {
      if (hijo instanceof HTMLElement) hijo.dataset['revelar'] ??= lista.dataset['revelarLista'] || '';
    }
  }

  const alto = window.innerHeight;
  const pendientes = [...document.querySelectorAll<HTMLElement>('[data-revelar]')].filter((el) => el.getBoundingClientRect().top > alto);
  const revelar = new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue;
        entrada.target.classList.remove('revelar-pendiente');
        revelar.unobserve(entrada.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  for (const el of pendientes) {
    el.classList.add('revelar-pendiente');
    revelar.observe(el);
  }
  // El teclado no espera al scroll: lo que recibe el foco se muestra en el acto
  document.addEventListener('focusin', (evento) => {
    const pendiente = (evento.target as Element | null)?.closest?.('.revelar-pendiente');
    if (!pendiente) return;
    pendiente.classList.remove('revelar-pendiente');
    revelar.unobserve(pendiente);
  });

  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (hero) {
    new IntersectionObserver(([entrada]) => {
      hero.toggleAttribute('data-fuera', !entrada?.isIntersecting);
    }).observe(hero);
  }
}

/** Un pulso breve en el contador del carrito al añadir: confirma la acción aunque el carrito esté lejos. */
export function pulsoContador(contador: Element): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('animate' in contador)) return;
  contador.animate([{ scale: 1 }, { scale: 1.35 }, { scale: 1 }], { duration: 320, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
}
