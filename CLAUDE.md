# Instrucciones para el agente — Don Pascal

Tienda online de un mercado y repostería **ficticio** de Guanare: proyecto 002 del portafolio [A]nkordev (T28). Se usa **SDD**. Antes de escribir código:

1. Lee `docs/constitution.md` (copia de la del portafolio, en solo lectura). Sus principios tienen prioridad sobre todo lo demás.
2. Lee `docs/specs/001-tienda/spec.md` (qué y por qué) y `plan.md` (cómo).
3. Trabaja según `docs/specs/001-tienda/tasks.md`:
   - Una tarea a la vez, en orden, con sus tests.
   - Al terminar: `npm test`, marca `[x]` y haz commit convencional (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).
   - Al terminar cada **fase**, detente y espera revisión.
4. No agregues dependencias fuera del plan sin preguntar. Nunca instales nada (paquetes, skills, herramientas globales) sin preguntar primero.
5. Si la spec o el plan son ambiguos o contradicen la constitución, pregunta antes de seguir.

Textos de interfaz siempre en `src/i18n/es.json`.

## Producto y diseño

- `PRODUCT.md`: público, marca, voz y límites. La marca es **ficticia** y se rotula. Se inspira en el modelo de negocio de los comercios locales de Guanare, pero **no se parece a ninguno en concreto**: nunca se usan el nombre, el logo, la mascota ni las piezas de un comercio real.
- Nada de reseñas, valoraciones, cifras de clientes, premios ni urgencia falsa (cuentas atrás). Los precios son ficticios y se rotulan.
- Dirección visual: se fija en E00 con impeccable y se documenta en `DESIGN.md` al terminar.
- Orden de autoridad: **constitución → spec/plan → PRODUCT.md / DESIGN.md → guía de cualquier skill**.

## Asistente con IA

- **No inventa productos ni precios.** Solo usa lo que devuelven sus herramientas en ese turno, y `src/lib/price-guard.ts` lo comprueba en el servidor. Cualquier cambio en el asistente mantiene sus tests en verde.
- Modelo y parámetros: los del plan §6. No se cambian sin preguntar.
- La clave de la API, los tokens de Meta y los de Supabase son secretos del Worker. Nunca se ven, se imprimen ni se guardan en archivos del repo: los escribe el usuario con `!`.
- Toda prueba contra la API real de Claude o de Meta cuesta dinero o usa cuentas reales: se pregunta antes y se dice el coste estimado.

## Herramientas

| Tarea | Herramienta |
|---|---|
| Construir UI, crítica, auditoría, pulido, `DESIGN.md` | **impeccable** (la principal) |
| Accesibilidad, textos de interfaz, formularios, UX móvil | **ux-designer** |
| Revisión visual con capturas a varios anchos | **design-taste-frontend** (solo su revisión) |
| Afinar duraciones y curvas existentes | **transitions-polish** |
| Ilustraciones estáticas en la paleta de la tienda | **canvas-design** |
| Llamadas a la API de Claude | **claude-api** (léela antes de tocar el asistente) |

Choques conocidos:
- **Movimiento (constitución II, 1.3.0):** se pueden animar `transform`, `opacity`, `clip-path`, `mask`, filtros (blur incluido), color, fondo, borde y `box-shadow`. Nunca propiedades que recalculan el diseño (`width`, `height`, `top`, `left`, `margin`…). Sin WebGL: el fondo WebGL es solo del portafolio. Si un skill propone otra cosa, se descarta.
- **Scripts:** nunca por CDN. Todo por npm y servido desde el propio sitio.
- **Fotos:** las de producto son libres y llevan créditos. La mascota (Don Pascal) está generada con IA por el usuario y se acredita como tal. Nunca se presentan como trabajo o clientes reales.
