#!/usr/bin/env bash
# Downloads and normalizes every media asset listed in assets.json into public/.
# assets.json: {"speaker": URL, "vo": URL, "music": URL, "sfx": {name: URL}, "br": {name: URL}}
set -euo pipefail
M=${1:-assets.json}
mkdir -p public/br public/sfx public/audio tmp
get() { python3 -c "import json,sys;d=json.load(open('$M'));print(eval('d'+sys.argv[1]))" "$1"; }
# talking head (lip-synced, 720p 25fps) -> 1080x1920 30fps, lanczos + light sharpen
curl -sfL -o tmp/speaker.mp4 "$(get "['speaker']")"
ffmpeg -v error -y -i tmp/speaker.mp4 -an -vf "scale=1080:1920:flags=lanczos,unsharp=5:5:0.6:5:5:0,fps=30" \
  -c:v libx264 -crf 16 -preset veryfast -pix_fmt yuv420p public/speaker.mp4
curl -sfL -o public/audio/vo.mp3 "$(get "['vo']")"
curl -sfL -o public/audio/music.mp3 "$(get "['music']")"
for n in $(python3 -c "import json;print(' '.join(json.load(open('$M'))['sfx']))"); do
  curl -sfL -o tmp/$n.mp3 "$(get "['sfx']['$n']")"
  # trim leading silence so every hit lands on its frame
  ffmpeg -v error -y -i tmp/$n.mp3 -af "silenceremove=start_periods=1:start_threshold=-42dB" public/sfx/$n.mp3
done
for n in $(python3 -c "import json;print(' '.join(json.load(open('$M'))['br']))"); do
  curl -sfL -o public/br/$n.mp4 "$(get "['br']['$n']")"
done
rm -rf tmp
echo "assets ready"
