# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static website for Margin Studio (marginstudio.in), hosted on GitHub Pages. There is no build step, package manager, linter, or test suite — the files in the repo root are served as-is, and everything (fonts included) is self-hosted with zero third-party requests.

Preview it with a local server, since root-absolute paths mean `file://` will not load the CSS, fonts, or script:

```bash
python -m http.server 8000
```

`.claude/launch.json` defines that same server for the `preview_start` browser tool.

## Design concept

The whole design hangs on one idea: **marginalia**. A margin is the blank edge of a printed page where a reader writes notes (and, for an expense app, financial headroom). So the margin is an *active* part of the layout, not empty space:

- A left **rail** carries folio numbers (`01`, `02`, `03`), section labels, and annotations in proofreader's vermillion.
- The hero centrepiece is a stack of **ruled sheets** tilted in 3D, each with a red margin rule — a page from a notebook, lifting off a desk.

Changes should serve that concept rather than dilute it.

## Architecture

- `index.html` — landing page. Four parts: hero, Under Control (`#work`), studio note (`#studio`), footer.
- `undercontrol/privacy/index.html` — the Under Control privacy policy, served at `/undercontrol/privacy/`. **This URL is linked from the app and the Play Store listing, so it must stay stable.** It deliberately shares the site's tokens and type but stays a plain readable document: no 3D, no motion, no script.
- `style.css` — the single shared stylesheet, in numbered sections (fonts → tokens → base → layout → hero → 3D → sections → reveals → responsive → reduced-motion → document pages).
- `script.js` — ~50 lines, no dependencies. Only two jobs: pointer parallax and staged reveals.
- `fonts/` — self-hosted woff2 (latin subset) plus the OFL licence for each. Both faces are SIL OFL; the licence files must travel with them.
- `CNAME` (custom domain) and `.nojekyll` (disables Jekyll) are GitHub Pages configuration — don't remove them.

## Conventions and constraints

**Colour** lives entirely in CSS variables on `:root`, redefined under `@media (prefers-color-scheme: dark)`. Never hardcode a colour; add a token to both blocks. The accent `--annot` was chosen by measuring contrast, not by eye — light mode is `#ad3b0b` at 5.47:1 on `--paper`. A brighter vermillion (`#c1440e`) measured 4.54:1, which is too thin a margin for 13px mono. **Re-measure if you change it.**

**Type** is Fraunces (display) and IBM Plex Mono (labels, folios, annotations). Fraunces is variable with four axes — `opsz` 9–144, `wght`, `SOFT` 0–100, `WONK` 0–1. Two traps:

- `opsz` **defaults to 9**, the small-text cut. Large text must set it explicitly (`"opsz" 144` on the hero) or it renders with the wrong design.
- Always set all four axes together in `font-variation-settings`. Mixing it with `font-weight` gives inconsistent results across browsers.

**Motion is always an enhancement, never a gate.** The reveal's hidden state sits inside `@media (scripting: enabled)`, so with JS off the content simply renders. `prefers-reduced-motion: reduce` disables parallax, drift, and reveals while leaving everything visible. Verify both when touching animation.

**Keep the headline out of 3D.** Text inside a `preserve-3d` context with `translateZ` gets rasterized to a composited texture and then scaled, which softens the glyph edges. The headline uses 2D `translateX` parallax only; real 3D is confined to the sheet stage.

**`overflow-x` on `body` must stay `clip`, not `hidden`.** The stage deliberately bleeds past the right edge. `hidden` would make body a scroll container and silently break the sticky rail. Note that `documentElement.scrollWidth` over-reports under `clip` — test real overflow by attempting `window.scrollTo(200, 0)` and checking `window.scrollX` stays `0`.

**Layout** uses root-absolute paths (`/style.css`, `/fonts/…`) and one `index.html` per directory so URLs end in a trailing slash. New pages reuse the header/`main`/footer skeleton and the `.shell` / `.tracks` / `.rail` primitives.

## Outstanding

- The privacy policy is still a **placeholder**. Before Play submission: write the real policy, then remove the `noindex` meta, drop `(Draft)` from the `<title>`, and delete the `.notice` block. There is a TODO comment in the file listing these.
- `index.html` carries a TODO above the feature list. The three feature points were derived only from copy that already existed; the data-handling facts (on-device or synced, account required, any analytics SDKs) are unverified. **Do not add a data-handling claim to the page until it is confirmed** — a Play reviewer may read it. The same three answers are what the privacy policy needs.
- Both pages ship a strict CSP via `<meta>`. A meta CSP cannot express `frame-ancestors`; that needs a real HTTP header, which GitHub Pages cannot send.
