#!/usr/bin/env sh
# Control de reproductores MPRIS desde las teclas multimedia.
# Muestra una notificación (swaync) con carátula, título, artista y álbum.
#
# Uso: media-control.sh next|previous|play-pause|stop

set -u

action="${1:-}"
cache_dir="${XDG_CACHE_HOME:-$HOME/.cache}/hypr-media"
art_fallback="audio-x-generic"

notify() { # $1=título, $2=cuerpo, $3=icono
    notify-send \
        --app-name="Reproductor" \
        --icon="$3" \
        --urgency=low \
        --expire-time=3000 \
        --hint=string:x-canonical-private-synchronous:media \
        --hint=int:transient:1 \
        "$1" "$2"
}

fail() { # $1=mensaje
    notify "Reproductor" "$1" "$art_fallback"
    exit 0
}

case "$action" in
    next|previous|play-pause|stop) ;;
    *)
        echo "uso: $0 {next|previous|play-pause|stop}" >&2
        exit 2
        ;;
esac

command -v playerctl >/dev/null 2>&1 || fail "playerctl no está instalado"
playerctl status >/dev/null 2>&1 || fail "No hay ningún reproductor activo"

# "stop" no lo implementan todos los reproductores (Spotify, por ejemplo):
# si falla, al menos pausamos.
if [ "$action" = "stop" ]; then
    playerctl stop >/dev/null 2>&1 || playerctl pause >/dev/null 2>&1 || true
else
    playerctl "$action" >/dev/null 2>&1 || fail "No se pudo ejecutar «$action»"
fi

status=$(playerctl status 2>/dev/null || echo Stopped)
title=$(playerctl metadata xesam:title 2>/dev/null || true)
artist=$(playerctl metadata xesam:artist 2>/dev/null || true)
album=$(playerctl metadata xesam:album 2>/dev/null || true)
art=$(playerctl metadata mpris:artUrl 2>/dev/null || true)

# Icono de respaldo según el estado
case "$status" in
    Playing) icon="media-playback-start" ;;
    Paused)  icon="media-playback-pause" ;;
    *)       icon="media-playback-stop"  ;;
esac

# Carátula del álbum: archivo local o URL remota (se cachea)
art_path=""
case "$art" in
    file://*)
        art_path="${art#file://}"
        if printf '%s' "$art_path" | grep -q '%'; then
            art_path=$(printf '%b' "$(printf '%s' "$art_path" | sed 's/%/\\x/g')")
        fi
        ;;
    http://*|https://*)
        mkdir -p "$cache_dir"
        art_path="$cache_dir/$(printf '%s' "$art" | md5sum | cut -d' ' -f1)"
        if [ ! -s "$art_path" ]; then
            curl -fsSL --max-time 5 -o "$art_path" "$art" 2>/dev/null || rm -f "$art_path"
        fi
        ;;
esac
if [ -n "$art_path" ] && [ -f "$art_path" ]; then
    icon="$art_path"
fi

track="$title"
if [ -n "$artist" ]; then
    track="$artist — $title"
fi
if [ -n "$album" ]; then
    track="$track
$album"
fi
[ -n "$track" ] || track="Sin metadatos"

case "$action" in
    next)     header="Siguiente canción" ;;
    previous) header="Canción anterior" ;;
    stop)     header="Reproducción detenida" ;;
    *)
        if [ "$status" = "Playing" ]; then
            header="Reproduciendo"
        else
            header="En pausa"
        fi
        ;;
esac

notify "$header" "$track" "$icon"
