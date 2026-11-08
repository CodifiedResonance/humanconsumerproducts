# Human Consumer Products

Concepts from human minds, for humans. Live at humanconsumerproducts.com.

- `public/` — the site (static; served as-is)
- `public/creators.js` — the registry of admitted minds and their concepts; the only file that changes when a mind or concept is added
- `build.py` — run `python3 build.py` after editing the registry to regenerate `public/concepts.json` and `public/llms.txt` (the machine-readable index for agents)
- `wrangler.jsonc` — Cloudflare config; every push to `main` deploys
