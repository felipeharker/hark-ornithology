import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export interface SiteOptions {
  title: string;
  secondaryColorHex: string;
  dataFileName: string;
}

const DEFAULT_OPTIONS: SiteOptions = {
  title: 'Ornithological Report',
  secondaryColorHex: '#ff6361',
  dataFileName: 'ebird-data-latest.csv',
};

export function getSiteOptions(): SiteOptions {
  // First try checking if we're in the web directory and the file is in public/
  let optionsPath = path.join(process.cwd(), '../public/options.csv');

  if (!fs.existsSync(optionsPath)) {
    // Try the root level (if process.cwd() is the root)
    optionsPath = path.join(process.cwd(), 'public/options.csv');
  }

  if (!fs.existsSync(optionsPath)) {
    return DEFAULT_OPTIONS;
  }

  try {
    const fileContent = fs.readFileSync(optionsPath, 'utf-8');
    const parsed = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    const options = { ...DEFAULT_OPTIONS };

    parsed.data.forEach((rawRow: unknown) => {
      const row = rawRow as Record<string, string>;
      const item = row['item']?.toLowerCase().trim();
      const value = row['value']?.trim();

      if (!item || !value) return;

      if (item === 'title' || item === 'header') {
        options.title = value;
      } else if (item === 'secondary color hex' || item === 'location color hex' || item === 'link color hex') {
        options.secondaryColorHex = value;
      } else if (item === 'data file name') {
        options.dataFileName = value;
      }
    });

    return options;
  } catch (error) {
    console.error('Error reading options.csv:', error);
    return DEFAULT_OPTIONS;
  }
}
