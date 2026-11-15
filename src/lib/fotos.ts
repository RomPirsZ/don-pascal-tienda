// Imágenes de la tienda (plan §9). Se sirven estáticas desde public/img/, preparadas por
// scripts/imagenes.sh: el adaptador no transforma imágenes en páginas generadas en cada
// petición. Las fuentes viven en src/assets/ con su procedencia incrustada.
import { FOTOS_DISPONIBLES, RECORTES_DISPONIBLES } from '../data/fotos-disponibles';

export interface Imagen {
  src: string;
  srcset: string;
  width: number;
  height: number;
}

const srcset = (ruta: (ancho: number) => string, anchos: number[]) => anchos.map((a) => `${ruta(a)} ${a}w`).join(', ');

/** Foto cuadrada de un producto, o undefined si aún no tiene. */
export function fotoProducto(slug: string): Imagen | undefined {
  if (!FOTOS_DISPONIBLES.has(slug)) return undefined;
  const ruta = (ancho: number) => `/img/productos/${slug}-${ancho}.webp`;
  return { src: ruta(360), srcset: srcset(ruta, [240, 360, 480, 640]), width: 640, height: 640 };
}

/** El producto recortado, con transparencia, para flotar sobre un color (banners de oferta), o undefined. */
export function recorteProducto(slug: string): Imagen | undefined {
  if (!RECORTES_DISPONIBLES.has(slug)) return undefined;
  const ruta = (ancho: number) => `/img/productos/recortes/${slug}-${ancho}.webp`;
  return { src: ruta(360), srcset: srcset(ruta, [240, 360, 480]), width: 480, height: 480 };
}

/** Don Pascal de cuerpo entero, con transparencia (proporción del original, 1340 × 2400). */
export const DON_PASCAL: Imagen = {
  src: '/img/don-pascal-480.webp',
  srcset: srcset((a) => `/img/don-pascal-${a}.webp`, [320, 480, 640, 820]),
  width: 820,
  height: 1469,
};

/** La cara de Don Pascal, cuadrada. */
export const AVATAR: Imagen = {
  src: '/img/avatar-224.webp',
  srcset: srcset((a) => `/img/avatar-${a}.webp`, [96, 224, 448]),
  width: 448,
  height: 448,
};
