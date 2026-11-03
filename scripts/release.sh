#!/bin/bash
# usage: scripts/release.sh <round> <checkpoint> <base-label> <base-dir> <cumulative-base-dir> <outdir>
# هر اجرا شمارنده b را بالا می‌برد؛ هیچ فایل موجودی بازنویسی نمی‌شود.
set -e
R=$1; C=$2; START=${START:-1}; BASE=$3; BASEDIR=$4; CUMDIR=$5; OUT=$6; SRC=${7:-.}
mkdir -p "$OUT"; N=$START
while ls "$OUT"/AkhavanCRM-SolarEmber_r${R}-cp${C}_b$(printf %02d $N)* >/dev/null 2>&1; do N=$((N+1)); done
STEM="AkhavanCRM-SolarEmber_r${R}-cp${C}_b$(printf %02d $N)"
mkd(){ T=$(mktemp -d); cp -r "$1" $T/a; cp -r "$2" $T/b; (cd $T && git diff --no-index --no-color --no-prefix a b > "$3" || true); rm -rf $T; }
(cd "$SRC" && zip -qr "$OUT/$STEM.zip" . -x 'node_modules/*' -x 'dist/*' -x '.git/*')
mkd "$BASEDIR" "$SRC" "$OUT/${STEM}_vs-${BASE}.diff"
mkd "$CUMDIR" "$SRC" "$OUT/${STEM}_cumulative-from-r3-cp1.diff"
V=$(mktemp -d)
cp -r "$BASEDIR" $V/x1; (cd $V/x1 && patch -p1 -s --no-backup-if-mismatch < "$OUT/${STEM}_vs-${BASE}.diff") || echo "!! vs-${BASE}: PATCH FAILED"
if diff -rq -x '*.woff2' -x '*.orig' -x '*.rej' $V/x1 "$SRC" >/dev/null; then echo "vs-${BASE}: applies, text files IDENTICAL (فایل‌های باینری woff2 فقط در ZIP هستند)"; else echo "!! vs-${BASE}: MISMATCH"; fi
cp -r "$CUMDIR" $V/x2; (cd $V/x2 && patch -p1 -s --no-backup-if-mismatch < "$OUT/${STEM}_cumulative-from-r3-cp1.diff") || echo "!! cumulative: PATCH FAILED"
if diff -rq -x '*.woff2' -x '*.orig' -x '*.rej' $V/x2 "$SRC" >/dev/null; then echo "cumulative: applies, text files IDENTICAL"; else echo "!! cumulative: MISMATCH"; fi
rm -rf $V; echo "STEM=$STEM"
