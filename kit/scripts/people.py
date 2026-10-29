"""Fetches real X accounts for the film: name, verification and a sharp profile picture.

  npm run people -- <handle> [<handle>...] [--kind real|self|brand]

For each handle it saves public/faces/x/<handle>.jpg (the 400x400 picture, not the 48 px default),
records it in public/faces/x/accounts.json with the fetch date, and prints a Person entry to paste
into PEOPLE in src/content.ts. Real third parties come out with consent "pending": showing a real
person in an ad reads as an endorsement, so `npm run clearance -- --release` blocks the final render
until you record their yes. Never put invented words on a real account.
Uses verified_type (blue, business, government, none), not `verified`: the API said verified false
for accounts that show a blue check. Draw a check only where verified_type says there is one.
The token comes from X_BEARER_TOKEN or ~/.config/x/credentials.env, and is never printed.
"""
import datetime, json, os, re, sys, urllib.parse, urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
DIR = os.path.join(ROOT, "public", "faces", "x")


def token():
    if os.environ.get("X_BEARER_TOKEN"):
        return os.environ["X_BEARER_TOKEN"]
    path = os.path.expanduser("~/.config/x/credentials.env")
    if os.path.exists(path):
        for line in open(path):
            m = re.match(r"\s*(?:export\s+)?X_BEARER_TOKEN\s*=\s*['\"]?([^'\"\s]+)", line)
            if m:
                return m.group(1)
    sys.exit("No X_BEARER_TOKEN in the environment or ~/.config/x/credentials.env")


def get(url, auth=None):
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {auth}"} if auth else {})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def short(name, limit=18):
    """A display name that fits a card without an ellipsis ("Konstantina Alexandr..." read as broken)."""
    if len(name) <= limit:
        return name
    cut = name[:limit].rsplit(" ", 1)[0]
    return cut if len(cut) >= 4 else name[:limit]


def main():
    args = sys.argv[1:]
    kind = args[args.index("--kind") + 1] if "--kind" in args else "real"
    handles = [a.lstrip("@") for i, a in enumerate(args) if not a.startswith("--") and (i == 0 or args[i - 1] != "--kind")]
    if not handles or kind not in ("real", "self", "brand"):
        sys.exit(__doc__)
    q = urllib.parse.urlencode({"usernames": ",".join(handles), "user.fields": "name,profile_image_url,verified_type"})
    try:
        body = json.loads(get(f"https://api.x.com/2/users/by?{q}", token()))
    except urllib.error.HTTPError as e:  # the message never includes the token
        sys.exit(f"X API error {e.code}: {e.read()[:300].decode(errors='replace')}")
    for err in body.get("errors", []):
        print(f"not found: {err.get('value', '')} ({err.get('detail', '')})", file=sys.stderr)

    os.makedirs(DIR, exist_ok=True)
    manifest_path = os.path.join(DIR, "accounts.json")
    manifest = json.load(open(manifest_path)) if os.path.exists(manifest_path) else {}
    today = datetime.date.today().isoformat()
    entries = []
    for u in body.get("data", []):
        h = u["username"]
        pic = u.get("profile_image_url", "").replace("_normal", "_400x400")
        file = f"faces/x/{h}.jpg"
        if pic:
            open(os.path.join(ROOT, "public", file), "wb").write(get(pic))
        verified = u.get("verified_type", "none")
        manifest[h] = {"name": u["name"], "file": file, "verified_type": verified, "fetched": today}
        person = {"key": h.lower(), "name": u["name"], "display": short(u["name"]), "handle": f"@{h}",
                  "face": file, "kind": kind, "verified": verified, "source": f"X API {today}"}
        if kind == "real":
            person["consent"] = "pending"
        entries.append(person)
    json.dump(manifest, open(manifest_path, "w"), indent=1)

    print(f"Saved {len(entries)} picture(s) to {os.path.relpath(DIR, ROOT)}/. Paste into PEOPLE in src/content.ts:\n")
    for p in entries:
        print("  { " + ", ".join(f"{k}: {json.dumps(v)}" for k, v in p.items()) + " },")
    if kind == "real" and entries:
        print("\nEach real person needs their yes before posting. Set consent: \"yes\" only once you have it.")


if __name__ == "__main__":
    main()
