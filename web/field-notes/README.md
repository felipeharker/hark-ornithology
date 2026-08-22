# Field Notes

Markdown blog posts rendered in the Field Notes section of the site
(parsed by `src/lib/parseFieldNotes.ts`).

## Adding a note

1. Copy `TEMPLATE.md` to `field-note-<N>.md`, where `<N>` is the next
   integer after the highest-numbered note in this folder.
2. Fill in the frontmatter and write the body in Markdown.
3. Commit the file — no code changes or build step needed.

Notes are listed newest-first by `<N>`, so it must be unique and
increasing. Any file that doesn't match `field-note-<N>.md` exactly
(such as `TEMPLATE.md` or this `README.md`) is ignored and never
published.

## Frontmatter fields

| Field        | Required | Description                                      |
| ------------ | -------- | ------------------------------------------------- |
| `title`      | yes      | Displayed as the note's heading in the list.       |
| `date`       | yes      | Shown alongside the title; any string works.       |
| `location`   | no       | Shown in the note's meta section if present.       |
| `conditions` | no       | Weather/conditions, shown in the meta section.     |
| `links`      | no       | List of URLs (e.g. eBird checklists) shown below the meta section. |

Everything after the closing `---` is the note body, rendered with
`react-markdown` + `remark-gfm` (GitHub-flavored Markdown: tables,
strikethrough, task lists, etc.).
