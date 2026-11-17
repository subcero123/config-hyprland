#!/usr/bin/env sh
# Control de volumen con OSD en swaync: icono + barra + porcentaje.
#
# Uso: volume-control.sh up|down|mute [paso]
#   paso por defecto: 5%

set -u

action="${1:-}"
step="${2:-5%}"
sink="@DEFAULT_AUDIO_SINK@"
bar_width=20

read_volume() { # deja en VOLUME_RAW el estado del sink
    VOLUME_RAW=$(wpctl get-volume "$sink" 2>/dev/null) || exit 1
}

notify() { # $1=icono, $2=cuerpo (markup Pango)
    notify-send \
        --app-name="Volumen" \
        --icon="$1" \
        --urgency=low \
        --expire-time=2000 \
        --hint=string:x-canonical-private-synchronous:volume \
        --hint=int:transient:1 \
        "Volumen" "$2"
}

case "$action" in
    up)   wpctl set-volume -l 1 "$sink" "$step+" || exit 1 ;;
    down) wpctl set-volume "$sink" "$step-" || exit 1 ;;
    mute) wpctl set-mute "$sink" toggle || exit 1 ;;
    *)
        echo "uso: $0 {up|down|mute} [paso]" >&2
        exit 2
        ;;
esac

read_volume

pct=$(printf '%s\n' "$VOLUME_RAW" | awk '{ printf "%d", $2 * 100 + 0.5 }')
muted=0
case "$VOLUME_RAW" in *MUTED*) muted=1 ;; esac

if [ "$muted" -eq 1 ] || [ "$pct" -le 0 ]; then
    icon="audio-volume-muted"
elif [ "$pct" -lt 34 ]; then
    icon="audio-volume-low"
elif [ "$pct" -lt 67 ]; then
    icon="audio-volume-medium"
else
    icon="audio-volume-high"
fi

filled=$(( (pct * bar_width + 50) / 100 ))
bar=""
i=0
while [ "$i" -lt "$bar_width" ]; do
    if [ "$i" -lt "$filled" ]; then
        bar="${bar}█"
    else
        bar="${bar}░"
    fi
    i=$(( i + 1 ))
done

body="<span font_family=\"monospace\" size=\"large\">${bar}</span>  ${pct} %"
if [ "$muted" -eq 1 ]; then
    body="$body  ·  silenciado"
fi

notify "$icon" "$body"
