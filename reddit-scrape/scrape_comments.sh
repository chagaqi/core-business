#!/bin/bash
cd "C:/Users/dylan/Documents/axiom-balloon/Core Business/reddit-scrape"
mkdir -p comments
i=1
while IFS= read -r url; do
    fname=$(printf 'comments/p%02d.json' "$i")
    curl -s -A "ChagaAIAds/1.0 research bot" "$url" -o "$fname"
    size=$(wc -c < "$fname" 2>/dev/null || echo 0)
    echo "$i: $size bytes -> $fname"
    i=$((i+1))
    sleep 1
done < high_comment_urls.txt
echo "DONE. Files in comments/:"
ls comments/ | wc -l
