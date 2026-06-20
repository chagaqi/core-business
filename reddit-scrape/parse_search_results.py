"""Parse all Reddit search-result JSON files; emit ranked high-comment posts."""
import json
import os
from pathlib import Path

SCRAPE_DIR = Path(r"C:\Users\dylan\Documents\axiom-balloon\Core Business\reddit-scrape")
MIN_COMMENTS = 15  # threshold for "worth diving into for comment trees"

all_posts = []
files_with_zero_results = []
files_with_errors = []

for fp in sorted(SCRAPE_DIR.glob("[0-9][0-9][0-9].json")):
    try:
        data = json.loads(fp.read_text(encoding="utf-8"))
    except Exception as e:
        files_with_errors.append((fp.name, str(e)))
        continue

    if not isinstance(data, dict) or "data" not in data:
        files_with_errors.append((fp.name, f"unexpected shape: {str(data)[:100]}"))
        continue

    children = data.get("data", {}).get("children", [])
    if not children:
        files_with_zero_results.append(fp.name)
        continue

    for c in children:
        p = c.get("data", {})
        all_posts.append({
            "src_file": fp.name,
            "subreddit": p.get("subreddit"),
            "title": p.get("title", "")[:200],
            "author": p.get("author"),
            "num_comments": p.get("num_comments", 0),
            "score": p.get("score", 0),
            "selftext_len": len(p.get("selftext", "") or ""),
            "selftext_preview": (p.get("selftext") or "")[:300].replace("\n", " "),
            "permalink": f"https://old.reddit.com{p.get('permalink', '')}",
            "url": p.get("url"),
            "created_utc": p.get("created_utc"),
            "id": p.get("id"),
        })

# Dedupe by post id (same post can appear in multiple search results)
seen_ids = set()
deduped = []
for post in sorted(all_posts, key=lambda x: -x["num_comments"]):
    if post["id"] in seen_ids:
        continue
    seen_ids.add(post["id"])
    deduped.append(post)

high_comment = [p for p in deduped if p["num_comments"] >= MIN_COMMENTS]

print(f"Total files parsed: {len(list(SCRAPE_DIR.glob('[0-9][0-9][0-9].json')))}")
print(f"Files with zero results: {len(files_with_zero_results)}")
print(f"  → {files_with_zero_results}")
print(f"Files with errors: {len(files_with_errors)}")
print(f"  → {files_with_errors[:5]}")
print(f"Total post records: {len(all_posts)}")
print(f"Unique posts (deduped): {len(deduped)}")
print(f"High-comment posts (>={MIN_COMMENTS} comments): {len(high_comment)}")
print()
print("=" * 100)
print(f"TOP {min(50, len(high_comment))} POSTS BY COMMENT COUNT:")
print("=" * 100)
for i, p in enumerate(high_comment[:50], 1):
    print(f"\n#{i} [{p['num_comments']:>4} comments | score {p['score']:>4}] r/{p['subreddit']} | u/{p['author']}")
    print(f"   {p['title']}")
    print(f"   {p['permalink']}")
    if p['selftext_len'] > 50:
        print(f"   PREVIEW: {p['selftext_preview'][:200]}...")

# Save the high-comment URL list for second-pass scrape
url_list_path = SCRAPE_DIR / "high_comment_urls.txt"
with url_list_path.open("w", encoding="utf-8") as f:
    for p in high_comment[:40]:
        # post permalink + .json gives full post + comments
        f.write(f"{p['permalink'].rstrip('/')}.json?limit=500\n")
print()
print("=" * 100)
print(f"Saved top 40 high-comment URLs to: {url_list_path}")

# Save the full deduped post index as JSON for later use
index_path = SCRAPE_DIR / "posts_index.json"
with index_path.open("w", encoding="utf-8") as f:
    json.dump(deduped, f, indent=2)
print(f"Saved full deduped post index to: {index_path} ({len(deduped)} posts)")
