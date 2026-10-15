#!/bin/bash
# 15 Oct 2026 (owner): slide pictures for the portal's slide viewer (teachers look back at a lesson without downloading it).
# For every deck in materials/: PowerPoint -> PDF -> one JPEG per slide in materials/view/<deck>/NN.jpg, plus materials/view/index.json.
# Run from the repo root:  bash tools/make-previews.sh [deck.pptx ...]   (no arguments = every deck)
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd)
TMP=$(mktemp -d)
decks=("$@"); [ ${#decks[@]} -eq 0 ] && mapfile -t decks < <(ls "$ROOT"/materials/*/*.pptx)
for f in "${decks[@]}"; do
  b=$(basename "$f" .pptx); out="$ROOT/materials/view/$b"
  rm -rf "$TMP/w" && mkdir -p "$TMP/w"
  cp "$f" "$TMP/w/d.pptx"
  (cd "$TMP/w" && timeout 300 soffice --headless --convert-to pdf d.pptx >/dev/null 2>&1) || { echo "FAIL $b"; continue; }
  pdftoppm -r 90 -png "$TMP/w/d.pdf" "$TMP/w/s"
  rm -rf "$out" && mkdir -p "$out"
  i=0; for p in $(ls "$TMP/w"/s-*.png | sort -V); do i=$((i+1)); ffmpeg -v error -y -i "$p" -q:v 9 "$out/$(printf %02d $i).jpg"; done
  echo "$b $i"
done
python3 - "$ROOT" <<'PY'
import os,sys,json
root=sys.argv[1]; v=os.path.join(root,"materials","view")
idx={d:len([x for x in os.listdir(os.path.join(v,d)) if x.endswith(".jpg")]) for d in sorted(os.listdir(v)) if os.path.isdir(os.path.join(v,d))}
json.dump(idx,open(os.path.join(v,"index.json"),"w"),indent=1)
print(len(idx),"decks in index")
PY
rm -rf "$TMP"
