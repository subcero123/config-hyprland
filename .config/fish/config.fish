if status is-interactive
    # Commands to run in interactive sessions can go here
end

set -U fish_greeting ""


function ytmov
    if test (count $argv) -lt 1
        echo "Uso: ytmov <URL_de_YT> [carpeta_salida]"
        return 1
    end

    set url $argv[1]
    set outdir (if test (count $argv) -ge 2; echo $argv[2]; else; echo "$HOME/Descargas/Disco3/YT Material/Media"; end)

    mkdir -p "$outdir"

    echo "🎥 Descargando desde: $url"
    echo "📁 Guardando en: $outdir"

    yt-dlp -f "bestvideo+bestaudio" \
        --merge-output-format mov \
        --postprocessor-args 'ffmpeg:-c:v libx264 -crf 18 -preset medium -c:a pcm_s16le' \
        -o "$outdir/%(title)s.%(ext)s" \
        "$url"

    echo "✅ Descarga completada en: $outdir"
end

function xdlp
    if test (count $argv) -lt 1
        echo "Uso: xdlp <URL_de_X> [nombre_archivo_sin_extension] [carpeta_salida]"
        return 1
    end

    set url $argv[1]
    set name (if test (count $argv) -ge 2; echo $argv[2]; else; echo "video_"(date +%s); end)
    set outdir (if test (count $argv) -ge 3; echo $argv[3]; else; echo "$HOME/Descargas/Disco3/YT Material/Media"; end)

    mkdir -p "$outdir"

    echo "🎬 Descargando $url..."
    yt-dlp -f "bestvideo+bestaudio" --merge-output-format mp4 \
        -o "$outdir/$name"_temp".%(ext)s" "$url"

    echo "🧰 Reencodeando a H.264 + Linear PCM..."
    ffmpeg -i "$outdir/$name"_temp".mp4" \
        -c:v libx264 -crf 23 -preset fast \
        -c:a pcm_s16le \
        -movflags +faststart \
        "$outdir/$name.mp4"

    echo "🧹 Limpiando archivo temporal..."
    rm -f "$outdir/$name"_temp".mp4"

    echo "✅ Video listo en $outdir/$name.mp4"
end




function spicetify-upgrade
    spicetify backup
    spicetify upgrade
    spicetify restore backup apply
end

export GTK_IM_MODULE=fcitx
export QT_IM_MODULE=fcitx
export XMODIFIERS=@im=fcitx

alias config='/usr/bin/git --git-dir=$HOME/.cfg/ --work-tree=$HOME'
