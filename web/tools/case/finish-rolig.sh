#!/bin/sh
# Trim the quiet takes to their action, and make what the page needs from
# them: the loop (webm) and the poster at the first frame.
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
cp tools/case/rec/rolig.json src/data/rolig.json
ls -la $OUT
