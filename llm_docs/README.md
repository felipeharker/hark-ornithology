# `llm_docs/`

Design references used when building the site. **Not documentation** — see
[`../README.md`](../README.md) and [`../user_guide.md`](../user_guide.md) for
that.

| Path | What it is | Current? |
|---|---|---|
| `ref_hark_web_styles/` | Self-contained HTML exports of the earlier "Modernist" design reference — Archivo headings, a light-grey ground, an orange-red accent. Each file is a bundled artifact that needs JavaScript to render. | **Superseded.** The site has since adopted the shared visual language described below. Kept for history only. |

## The current design reference

The site now shares one visual language with its sibling project, [Alexandria
Library](https://github.com/felipeharker/alexandria_script_library_master) — a
quiet, modern document: Inter for headings and prose, IBM Plex Mono for recorded
values, hairline rules rather than heavy ones, three type weights and no bold,
one deep-red accent that only ever means "interactive or selected", and no
numbering on sections, figures or references.

The authoritative sources for it, in order:

1. **`/design-standards`** on the running site — the type scale, palette, rule
   weights, and document conventions, rendered in the design itself.
2. **`web/src/app/styles_primary.css`** and **`web/src/app/styles_map.css`** —
   the implementation. Both open with a block of design tokens.
3. **Alexandria Library's `web/design-standards.html` and
   `web/assets/style.css`** — the same design implemented in static HTML. Token
   and class names are deliberately shared, so a change made in one project can
   be read straight across into the other.

Do not restyle anything from `ref_hark_web_styles/`.
