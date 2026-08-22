# `content/`

Prose that appears on the site, kept as plain files so it can be edited without
touching any code.

| File | Where it appears |
|---|---|
| `abstract.md` | The summary paragraphs under the title on the homepage. |

Write ordinary Markdown. Paragraphs are separated by a blank line; `*italic*`,
`**bold**`, and `[links](https://example.com)` all work. Save the file and
refresh — no rebuild step in development, and a normal `npm run build` picks it
up for production.

Field notes are content too, but they live in [`../field-notes/`](../field-notes/)
because each one carries its own frontmatter (title, date, location, conditions).
