import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface FieldNote {
  id: number;
  slug: string;
  title: string;
  date: string;
  location: string;
  conditions: string;
  links: string[];
  content: string;
}

export function getFieldNotes(): FieldNote[] {
  const notesDirectory = path.join(process.cwd(), 'field-notes');

  if (!fs.existsSync(notesDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(notesDirectory);

  const allNotes = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      // Remove ".md" from file name to get slug
      const slug = fileName.replace(/\.md$/, '');

      // Extract the id from the filename (e.g. field-note-1.md -> 1).
      // Anchored so template/reference files (TEMPLATE.md, README.md) are skipped.
      const match = fileName.match(/^field-note-(\d+)\.md$/);
      const id = match ? parseInt(match[1], 10) : -1;

      const fullPath = path.join(notesDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');

      // Use gray-matter to parse the post metadata section
      const matterResult = matter(fileContents);

      return {
        id,
        slug,
        title: matterResult.data.title || 'Untitled',
        date: matterResult.data.date || '',
        location: matterResult.data.location || '',
        conditions: matterResult.data.conditions || '',
        links: matterResult.data.links || [],
        content: matterResult.content,
      };
    })
    .filter((note) => note.id >= 0); // Only include notes that matched the numbering pattern

  // Sort notes by id descending
  return allNotes.sort((a, b) => b.id - a.id);
}
