# ALTYN — Meta-safe Microsite

Premium dark-gold Meta-safe landing page for ALTYN Therapy.
Static HTML/CSS/vanilla JS site, optimized for Cloudflare Pages.

## Pages
- `/` — main landing (hero / format / FAQ / final CTA)
- `/privacy/`, `/terms/`, `/contact/`, `/disclaimer/` — legal pages
- `/go/telegram?cta=hero|format|final|footer|contact` — visible bridge to `@altyntherapybot`

## Stack
- Pure static HTML + CSS + vanilla JS — server-rendered, crawler-readable
- Meta Pixel for analytics
- Cloudflare Pages Functions for `/api/click` (optional, logs to CF dashboard)
- No build step required for static files

## Local preview
Any static server. Example:
```bash
npx serve . -l 8080
```

## Deploy to Cloudflare Pages

### Option A — Direct upload via wrangler
```bash
CLOUDFLARE_API_TOKEN=*** wrangler pages deploy . --project-name=altyn-meta-new --branch=main --commit-dirty=true
```

### Option B — GitHub integration
1. Connect this repo to a NEW Cloudflare Pages project (do not reuse the main ALTYN project).
2. Production branch: `main`
3. Build command: *(none)*
4. Output directory: `/`
5. Save & deploy.

## Configuration
Site URL is hard-coded in HTML/sitemap/robots/JSON-LD. To change it:
```bash
OLD=https://altyn-meta-new.pages.dev
NEW=https://your-new-domain.tld
grep -rIl "$OLD" . | xargs sed -i "s|$OLD|$NEW|g"
```
Commit and redeploy.

## Meta-safety contract (do not break)
- No words on the homepage / titles / meta / OG: `психолог`, `психотерап`, `терапия`, `гипно`, `леч`, `диагноз`, `депресс`, `тревог`, `травм`, `расстрой`, `зависим`, `исцел`, `верн.*муж`, `гарант`
- No schema.org entities in JSON-LD: `MedicalBusiness`, `Physician`, `ProfessionalService`, `diagnosis`, `treatment`, `therapist`, `therapy`
- No cloaking — Meta crawler and users receive the same HTML
- Bridge is visible (no instant hidden redirect)

## What this microsite does NOT touch
- Main site `altyn-therapy.uz`
- Main ALTYN Cloudflare project / DNS
- Telegram bot, VPS, TORNADO, CRM, Railway
- Old Meta / Google Ads campaigns

## License
Proprietary — ALTYN Therapy.
