#!/bin/sh
# Trim the quiet takes to their action, and make what the page needs from
# them: the loop (webm), the poster at the first frame, and — for the two
# chapters a phone scrubs — an H.264 copy with a keyframe every fourth frame.
# Usage: FFMPEG=/path/to/ffmpeg sh tools/case/finish-rolig.sh   (from web/)
set -e
F=${FFMPEG:-ffmpeg}
OUT=public/assets/halsen/rolig
mkdir -p $OUT
for v in dagen byttet lanet uka; do
  t0=$(node -e "console.log(require('./tools/case/rec/rolig.json')['$v'].t0)")
  $F -v error -y -ss $t0 -i tools/case/rec/rolig-$v.webm -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 -an $OUT/$v.webm
  $F -v error -y -i $OUT/$v.webm -frames:v 1 -q:v 3 $OUT/$v-poster.jpg
done
for v in byttet lanet; do
  $F -v error -y -i $OUT/$v.webm -vf fps=20 -c:v libx264 -preset slow -crf 28 -g 4 -keyint_min 4 -sc_threshold 0 -bf 0 -pix_fmt yuv420p -movflags +faststart -an $OUT/$v.mp4
done
cp tools/case/rec/rolig.json src/data/rolig.json
ls -la $OUT
