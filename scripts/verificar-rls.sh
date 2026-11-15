#!/usr/bin/env bash
# Comprueba los permisos de Supabase con la clave publicable (rol anon), como lo haría
# cualquiera desde fuera (plan §4). No escribe datos: las escrituras que deben fallar
# fallan antes de tocar la tabla, y las de chat_uso se prueban con un canal inválido.
# Nunca imprime la clave.
#
# Uso: scripts/verificar-rls.sh [archivo de variables]   (por defecto, .dev.vars)
set -uo pipefail

archivo=${1:-.dev.vars}
[ -r "$archivo" ] || { echo "No encuentro $archivo"; exit 1; }
set -a; . "$archivo"; set +a
: "${SUPABASE_URL:?falta SUPABASE_URL}" "${SUPABASE_PUBLISHABLE_KEY:?falta SUPABASE_PUBLISHABLE_KEY}"
case "$SUPABASE_PUBLISHABLE_KEY" in
  sb_secret_*) echo "Es una clave secreta: aquí solo va la publicable"; exit 1 ;;
esac

api="${SUPABASE_URL%/}/rest/v1"
fallos=0

# comprobar <descripción> <método> <ruta> <código HTTP esperado> <texto esperado> [cuerpo]
comprobar() {
  local salida codigo cuerpo
  salida=$(curl -sS --max-time 20 -X "$2" "$api/$3" \
    -H "apikey: $SUPABASE_PUBLISHABLE_KEY" -H 'Content-Type: application/json' \
    -H 'Prefer: return=minimal' ${6:+--data "$6"} -w $'\n%{http_code}')
  codigo=${salida##*$'\n'}
  cuerpo=${salida%$'\n'*}
  if [ "$codigo" = "$4" ] && [[ "$cuerpo" == *"$5"* ]]; then
    printf 'ok    %s\n' "$1"
  else
    printf 'FALLO %s (HTTP %s)\n' "$1" "$codigo"
    fallos=$((fallos + 1))
  fi
}

# Lectura pública del catálogo
comprobar 'anon lee categorías'           GET  'categorias?select=slug&limit=1' 200 '"slug"'
comprobar 'anon lee productos'            GET  'productos?select=slug&limit=1'  200 '"slug"'
comprobar 'anon lee ajustes'              GET  'ajustes?select=clave&limit=1'   200 '"clave"'

# Nadie escribe el catálogo ni lee el uso del asistente (42501: sin permiso)
comprobar 'anon no lee chat_uso'          GET    'chat_uso?select=id'        401 '42501'
comprobar 'anon no crea categorías'       POST   'categorias'                401 '42501' '{"slug":"prueba","nombre":"Prueba"}'
comprobar 'anon no edita productos'       PATCH  'productos?id=eq.-1'        401 '42501' '{"disponible":false}'
comprobar 'anon no borra productos'       DELETE 'productos?id=eq.-1'        401 '42501'
comprobar 'anon no edita ajustes'         PATCH  'ajustes?clave=eq.nada'     401 '42501' '{"valor":"1"}'

# chat_uso: anon inserta solo el canal. Un canal inválido llega al check (23514), así que
# el permiso existe sin guardar nada; una fecha propia no tiene permiso de columna.
comprobar 'chat_uso valida el canal'      POST   'chat_uso'                  400 '23514' '{"canal":"x"}'
comprobar 'chat_uso no acepta fecha'      POST   'chat_uso'                  401 '42501' '{"canal":"web","creado":"2020-01-01T00:00:00Z"}'

# Funciones: solo las dos previstas
comprobar 'anon cuenta respuestas (24 h)' POST   'rpc/chat_count_24h'        200 ''   '{}'
comprobar 'anon llama a ping()'           POST   'rpc/ping'                  200 '1'  '{}'
comprobar 'no existe rls_auto_enable'     POST   'rpc/rls_auto_enable'       404 'PGRST202' '{}'

[ "$fallos" -eq 0 ] && echo 'RLS correcta' || { echo "$fallos comprobaciones fallaron"; exit 1; }
