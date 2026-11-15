// Asistente de la web (plan §6). La lógica vive en src/lib/chat-handler.ts; aquí solo se
// conecta con el Worker: su entorno, el catálogo de Supabase y el cliente de Claude.
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { crearCliente } from '../../lib/asistente/claude';
import { catalogoDelServidor } from '../../lib/catalogo-servidor';
import { atenderChat } from '../../lib/chat-handler';
import { createRateLimiter } from '../../lib/rate-limit';

export const prerender = false;

// 5 preguntas por minuto y IP. Uno por instancia del Worker: se reinicia entre ellas (plan §6)
const limitador = createRateLimiter({ limit: 5, windowMs: 60_000 });

// ALL y no POST: así un GET recibe el 405 del handler, con su cabecera Allow
export const ALL: APIRoute = ({ request }) =>
  atenderChat(request, { env: env as unknown as Record<string, unknown>, limitador, catalogo: catalogoDelServidor, claude: crearCliente });
