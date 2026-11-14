#!/usr/bin/env bash
# Versiones WebP de las imágenes (plan §9). Las páginas se generan en cada petición y el
# adaptador de Cloudflare no transforma imágenes en ese caso (serviría los originales, el
# hero pesa 2 MB), así que se preparan aquí y se sirven estáticas desde public/img/.
# Requiere ImageMagick con WebP. Se vuelve a ejecutar si cambia una imagen de src/assets/.
set -euo pipefail
cd "$(dirname "$0")/.."

salida=public/img
rm -rf "$salida" && mkdir -p "$salida/productos"

# Productos: cuadrados, tres anchos
for foto in src/assets/productos/*.jpg; do
  slug=$(basename "$foto" .jpg)
  for ancho in 240 360 480; do
    magick "$foto" -resize "${ancho}x${ancho}" -strip -quality 78 "$salida/productos/$slug-$ancho.webp"
  done
done

# Don Pascal de cuerpo entero (hero), con transparencia
for ancho in 320 480 640 820; do
  magick src/assets/don-pascal/cuerpo-entero.png -resize "${ancho}x" -strip -quality 80 -define webp:alpha-quality=90 "$salida/don-pascal-$ancho.webp"
done

# Avatar: la cara de la ilustración de medio cuerpo (el mismo recorte que el favicon)
for lado in 96 224 448; do
  magick src/assets/don-pascal/medio-cuerpo.png -crop 1200x1200+84+192 +repage -resize "${lado}x${lado}" -strip -quality 82 "$salida/avatar-$lado.webp"
done

# Lista de fotos para la app: un producto sin foto se muestra sin imagen, nunca con un enlace roto
{
  echo "// Generado por scripts/imagenes.sh: no editar a mano."
  echo "export const FOTOS_DISPONIBLES: ReadonlySet<string> = new Set(["
  for foto in src/assets/productos/*.jpg; do echo "  '$(basename "$foto" .jpg)',"; done
  echo "]);"
} > src/data/fotos-disponibles.ts

echo "Listo: $(find "$salida" -name '*.webp' | wc -l) imágenes, $(du -sh "$salida" | cut -f1)"
