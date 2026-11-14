// El catálogo para las páginas que se generan en el Worker (plan §4): lee la configuración
// de Supabase del entorno y, si falla, devuelve undefined para que la página muestre su aviso.
import { env } from 'cloudflare:workers';
import { leerCatalogo, type Catalogo } from './catalogo';

export async function catalogoDelServidor(): Promise<Catalogo | undefined> {
  try {
    return await leerCatalogo({
      url: env['SUPABASE_URL'] as string | undefined,
      key: env['SUPABASE_PUBLISHABLE_KEY'] as string | undefined,
    });
  } catch (error) {
    console.error(JSON.stringify({ evento: 'catalogo-error', motivo: error instanceof Error ? error.message : 'desconocido' }));
    return undefined;
  }
}
