"""Extract high-signal pain quotes from Reddit post + comment JSON trees.

Reddit post .json format: [post_listing, comments_listing]
We walk both, scoring text by keyword density × length.
"""
import json
import re
from pathlib import Path

SCRAPE_DIR = Path(r"C:\Users\dylan\Documents\axiom-balloon\Core Business\reddit-scrape")
COMMENTS_DIR = SCRAPE_DIR / "comments"
OUT_PATH = SCRAPE_DIR / "ranked_quotes.md"

# Keyword categories for relevance scoring + bucketing
PAIN_KEYWORDS = {
    "creative_fatigue": [
        "creative fatigue", "ad fatigue", "fatigue", "cpa", "cpm",
        "creative is dead", "ads stopped working", "roas dropped", "roas tanked",
        "andromeda", "stopped converting", "winning ad", "winners burning out",
    ],
    "ugc_pain": [
        "ugc creator", "ugc agency", "ugc cost", "ugc creators",
        "took weeks", "waited weeks", "two weeks", "2 weeks", "turnaround",
        "found a creator", "creator marketplace", "billo", "minisocial",
    ],
    "agency_disappointment": [
        "fired our agency", "fired the agency", "fired my agency",
        "agency was", "agency didn't", "agency wasted", "agency is",
        "$5k/mo agency", "5k a month", "agency disappointment", "switched agencies",
        "in-house", "in house",
    ],
    "founder_grind": [
        "writing scripts", "writing my own", "1am", "2am", "founder",
        "doing it myself", "no creative team", "wear all the hats",
        "i write all", "i create all", "burnt out", "burnout",
    ],
    "scale_paralysis": [
        "can't scale", "cant scale", "scaling problem", "stuck at",
        "can't push spend", "scaling wall", "plateau", "ceiling",
        "ran out of creative", "out of winning creative",
    ],
    "ai_skepticism": [
        "ai slop", "looks fake", "uncanny", "authentic", "doesn't feel real",
        "ai-generated looks", "ai looks", "weird ai", "ai garbage",
        "won't fool", "viewers can tell", "looks ai",
    ],
    "ai_ad_tools": [
        "arcads", "creatify", "heygen", "ai ugc", "ai-generated ad",
        "ai ad", "synthetic", "nano banana", "sora", "veo",
        "ai video", "ai avatar", "ai actor",
    ],
    "vertical_signals": [
        "supplement", "supplements", "mushroom", "adaptogen", "gummies",
        "nootropic", "greens", "functional beverage", "wellness brand",
        "health brand", "magic mind", "ag1", "mudwtr",
    ],
}

ICP_CONTEXT_KEYWORDS = [
    "shopify", "dtc", "d2c", "ecom", "ecommerce", "brand owner",
    "founder", "agency", "media buyer", "ad spend", "monthly spend",
    "$20k", "$30k", "$50k", "$100k", "per month", "/mo",
]

def walk_comments(node):
    """Recursively yield all comment dicts from a comments listing."""
    if not isinstance(node, dict):
        return
    if node.get("kind") == "Listing":
        for child in node.get("data", {}).get("children", []):
            yield from walk_comments(child)
    elif node.get("kind") == "t1":  # comment
        data = node.get("data", {})
        yield data
        replies = data.get("replies")
        if isinstance(replies, dict):
            yield from walk_comments(replies)

def score_text(text):
    """Return (total_score, hit_categories) tuple."""
    if not text or len(text) < 60:
        return (0, [])
    text_low = text.lower()
    hits = []
    score = 0
    for category, keywords in PAIN_KEYWORDS.items():
        for kw in keywords:
            if kw in text_low:
                score += 3
                hits.append(category)
                break  # one hit per category per text
    for kw in ICP_CONTEXT_KEYWORDS:
        if kw in text_low:
            score += 1
            break  # one context bonus
    # Length bonus (longer = more substantive)
    if len(text) > 200:
        score += 1
    if len(text) > 500:
        score += 1
    return (score, list(set(hits)))

all_quotes = []  # list of dicts

for fp in sorted(COMMENTS_DIR.glob("p[0-9][0-9].json")):
    try:
        data = json.loads(fp.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"ERROR parsing {fp.name}: {e}")
        continue
    if not isinstance(data, list) or len(data) < 2:
        continue
    post_listing, comments_listing = data[0], data[1]
    post = post_listing.get("data", {}).get("children", [{}])[0].get("data", {})
    subreddit = post.get("subreddit", "")
    post_title = post.get("title", "")
    post_author = post.get("author", "")
    post_permalink = f"https://old.reddit.com{post.get('permalink', '')}"
    post_selftext = post.get("selftext", "") or ""
    post_num_comments = post.get("num_comments", 0)

    # Score the post body itself
    sc, hits = score_text(post_selftext)
    if sc >= 4:
        all_quotes.append({
            "type": "post",
            "score": sc,
            "categories": hits,
            "subreddit": subreddit,
            "author": post_author,
            "permalink": post_permalink,
            "post_title": post_title,
            "post_num_comments": post_num_comments,
            "text": post_selftext,
        })

    # Walk comments
    for c in walk_comments(comments_listing):
        body = c.get("body", "")
        if not body or body == "[deleted]" or body == "[removed]":
            continue
        sc, hits = score_text(body)
        if sc >= 4:
            all_quotes.append({
                "type": "comment",
                "score": sc,
                "categories": hits,
                "subreddit": subreddit,
                "author": c.get("author", "[unknown]"),
                "permalink": f"https://old.reddit.com{c.get('permalink', '')}",
                "post_title": post_title,
                "post_num_comments": post_num_comments,
                "text": body,
                "comment_score": c.get("score", 0),
            })

all_quotes.sort(key=lambda q: (-q["score"], -q.get("comment_score", 0)))

print(f"Total scored quotes: {len(all_quotes)}")
print(f"  Posts: {sum(1 for q in all_quotes if q['type']=='post')}")
print(f"  Comments: {sum(1 for q in all_quotes if q['type']=='comment')}")
print()
print("Quote distribution by pain category:")
cat_counts = {}
for q in all_quotes:
    for cat in q["categories"]:
        cat_counts[cat] = cat_counts.get(cat, 0) + 1
for cat, n in sorted(cat_counts.items(), key=lambda x: -x[1]):
    print(f"  {cat}: {n}")

# Output ranked markdown
with OUT_PATH.open("w", encoding="utf-8") as f:
    f.write(f"# Ranked Pain Quotes — Top {min(200, len(all_quotes))}\n\n")
    f.write(f"Total scored: {len(all_quotes)}\n\n")
    f.write("---\n\n")
    for i, q in enumerate(all_quotes[:200], 1):
        text = q["text"].strip()
        # Truncate ultra-long quotes
        if len(text) > 2000:
            text = text[:2000] + "...[TRUNCATED]"
        f.write(f"## #{i} | score {q['score']} | {q['type']} | r/{q['subreddit']} | u/{q['author']}\n")
        f.write(f"**Categories:** {', '.join(q['categories'])}\n")
        f.write(f"**Post:** {q['post_title']} ({q['post_num_comments']} comments)\n")
        f.write(f"**Link:** {q['permalink']}\n\n")
        f.write("> " + text.replace("\n", "\n> ") + "\n\n")
        f.write("---\n\n")

print(f"\nWrote top 200 ranked quotes to: {OUT_PATH}")
print(f"File size: {OUT_PATH.stat().st_size:,} bytes")
