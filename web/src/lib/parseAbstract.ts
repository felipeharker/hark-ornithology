import fs from 'fs';
import path from 'path';

/**
 * Reads the homepage abstract from web/content/abstract.md.
 *
 * The file is plain Markdown with no frontmatter — it exists so the abstract
 * can be reworded without editing a component. Returns an empty string if the
 * file is missing, in which case the abstract block is simply not rendered.
 */
export function getAbstract(): string {
  const filePath = path.join(process.cwd(), 'content', 'abstract.md');

  if (!fs.existsSync(filePath)) {
    return '';
  }

  return fs.readFileSync(filePath, 'utf-8').trim();
}
