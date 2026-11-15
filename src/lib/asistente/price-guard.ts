// price-guard (plan §6): el asistente solo puede decir cifras que le hayan dado sus
// herramientas en esa misma petición. Se comprueba en el servidor, después de Claude: así ni
// un historial manipulado ni instrucciones inyectadas consiguen colar un precio.
//
// - Se revisan las cifras con moneda ($, US$, USD, dólares, Bs, bolívares, VES), los
//   porcentajes y todo número decimal. Los enteros sueltos (cantidades, horas, fechas,
//   gramos) no, porque no son precios.
// - Cada cifra con moneda tiene que coincidir con una de la misma moneda en los resultados:
//   «$ 10» no pasa porque 10 sea un mínimo al mayor. Por eso las herramientas devuelven los
//   precios ya formateados («$ 1,30», «Bs 1.185,11», «10 %»), como en la web.
// - 1.234,56 y 1234.56 son el mismo valor. Una cifra con moneda que no se puede leer se
//   bloquea. Las cifras escritas en letras no se detectan: las instrucciones piden números.

type Moneda = 'usd' | 'bs' | 'pct';

interface Lectura {
  /** Valor canónico: sin ceros sobrantes y con punto decimal («1185.11», «10») */
  valor: string;
  decimal: boolean;
}

interface Cifra {
  texto: string;
  moneda: Moneda | null;
  /** Todas las formas de leerla; null si está mal formada */
  lecturas: Lectura[] | null;
}

const NUMERO = /\d+(?:[.,]\d+)*/g;
const OTROS_DIGITOS = /(?:(?![0-9])\p{Nd})+/gu;
// Marca de moneda justo antes del número («$ 1,30», «Bs. 1.185,11», «**$ 1,30**», «Bs: 5»)
const ANTES_USD = /(?:\$|(?<![\p{L}\d])usd)[\s:*_]*$/iu;
const ANTES_BS = /(?<![\p{L}\d])(?:bs(?:\.?[sdf])?\.?|ves|ved)[\s:*_]*$/iu;
// …o justo después («1,30 $», «911,62 bolívares», «10 %»)
const DESPUES_USD = /^[\s*_]*(?:\$|us\$|(?:usd|d[oó]lar(?:es)?)(?!\p{L}))/iu;
const DESPUES_BS = /^[\s*_]*(?:bs|bol[ií]var(?:es)?|ves|ved)(?!\p{L})/iu;
const DESPUES_PCT = /^[\s*_]*(?:%|por\s+ciento)/iu;

function canonico(entero: string, fraccion: string): Lectura {
  const e = entero.replace(/^0+(?=\d)/, '');
  const f = fraccion.replace(/0+$/, '');
  return { valor: f ? `${e}.${f}` : e, decimal: fraccion !== '' };
}

/** Formas de leer un número con separadores: «1.185» puede ser 1185 o 1,185. */
function lecturas(texto: string): Lectura[] | null {
  const separadores = texto.match(/[.,]/g) ?? [];
  const partes = texto.split(/[.,]/);
  if (separadores.length === 0) return [canonico(texto, '')];

  const miles = (grupos: string[]) => grupos.every((g) => g.length === 3);
  const primero = partes[0] as string;
  const ultimo = partes[partes.length - 1] as string;
  const tipos = new Set(separadores);

  if (tipos.size === 2) {
    // El último separador es el decimal; los anteriores, de miles y todos del otro tipo
    const decimal = separadores[separadores.length - 1];
    const anteriores = separadores.slice(0, -1);
    if (anteriores.some((s) => s === decimal) || primero.length > 3 || !miles(partes.slice(1, -1))) return null;
    return [canonico(partes.slice(0, -1).join(''), ultimo)];
  }
  if (separadores.length > 1) {
    // Un solo tipo repetido: solo puede ser de miles («1.234.567»)
    return primero.length <= 3 && miles(partes.slice(1)) ? [canonico(partes.join(''), '')] : null;
  }
  // Un solo separador: con tres cifras detrás puede ser de miles o decimal
  const comoDecimal = canonico(primero, ultimo);
  if (ultimo.length === 3 && primero.length <= 3 && !/^0+$/.test(primero)) {
    return [canonico(primero + ultimo, ''), comoDecimal];
  }
  return [comoDecimal];
}

function monedaDe(antes: string, despues: string): Moneda | null {
  if (ANTES_USD.test(antes)) return 'usd';
  if (ANTES_BS.test(antes)) return 'bs';
  if (DESPUES_USD.test(despues)) return 'usd';
  if (DESPUES_BS.test(despues)) return 'bs';
  if (DESPUES_PCT.test(despues)) return 'pct';
  return null;
}

function cifrasDe(texto: string): Cifra[] {
  const normal = texto.normalize('NFKC');
  return [...normal.matchAll(NUMERO)].map((m) => {
    const inicio = m.index;
    const fin = inicio + m[0].length;
    return {
      texto: m[0],
      moneda: monedaDe(normal.slice(Math.max(0, inicio - 12), inicio), normal.slice(fin, fin + 16)),
      lecturas: lecturas(m[0]),
    };
  });
}

interface Confirmadas {
  usd: Set<string>;
  bs: Set<string>;
  pct: Set<string>;
  /** Todas, con o sin moneda: para los decimales sueltos de la respuesta */
  todas: Set<string>;
}

/** Cifras de los resultados de las herramientas: valores de texto y números, nunca claves. */
function confirmadas(resultados: readonly unknown[]): Confirmadas {
  const c: Confirmadas = { usd: new Set(), bs: new Set(), pct: new Set(), todas: new Set() };
  const recorrer = (valor: unknown): void => {
    if (typeof valor === 'string') {
      for (const cifra of cifrasDe(valor)) {
        for (const { valor: v } of cifra.lecturas ?? []) {
          c.todas.add(v);
          if (cifra.moneda) c[cifra.moneda].add(v);
        }
      }
    } else if (typeof valor === 'number' && Number.isFinite(valor)) {
      // Un número sin moneda solo confirma decimales sueltos, nunca un precio
      const [entero = '0', fraccion = ''] = Math.abs(valor)
        .toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 20 })
        .split('.');
      c.todas.add(canonico(entero, fraccion).valor);
    } else if (Array.isArray(valor)) {
      valor.forEach(recorrer);
    } else if (valor !== null && typeof valor === 'object') {
      Object.values(valor).forEach(recorrer);
    }
  };
  resultados.forEach(recorrer);
  return c;
}

/**
 * Cifras de la respuesta que no salieron de las herramientas en esta petición, en el orden
 * en que aparecen. Vacío: la respuesta puede enviarse. Si no, se sustituye por la respuesta
 * segura (lo hace /api/chat).
 */
export function cifrasNoConfirmadas(respuesta: string, resultados: readonly unknown[]): string[] {
  const c = confirmadas(resultados);
  const sinConfirmar = cifrasDe(respuesta)
    .filter(({ moneda, lecturas: l }) => {
      if (moneda) return l === null || !l.some(({ valor }) => c[moneda].has(valor));
      if (l === null || !l.some(({ decimal }) => decimal)) return false;
      return !l.some(({ valor }) => c.todas.has(valor));
    })
    .map(({ texto }) => texto);
  // Dígitos de otros sistemas (árabes, devanagari…): NUMERO no los lee, así que se bloquean
  const otrosDigitos = respuesta.normalize('NFKC').match(OTROS_DIGITOS) ?? [];
  return [...sinConfirmar, ...otrosDigitos];
}
