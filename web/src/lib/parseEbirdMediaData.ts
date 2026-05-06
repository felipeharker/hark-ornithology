import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export interface EbirdMediaObservation {
  MLCatalogNumber: string;
  Format: string;
  CommonName: string;
  ScientificName: string;
  Recordist: string;
  Date: string;
  Time: string;
  Country: string;
  State: string;
  County: string;
  Locality: string;
  Latitude: number;
  Longitude: number;
  eBirdChecklistID: string;
}

let mediaCache: { data: EbirdMediaObservation[], mtime: number } | null = null;

export function getLatestEbirdMediaData(): { data: EbirdMediaObservation[] } {
  const dataDir = path.join(process.cwd(), '../observation-data');
  const filePath = path.join(dataDir, 'ebird-media-latest.csv');

  if (!fs.existsSync(filePath)) {
    return { data: [] };
  }

  const stats = fs.statSync(filePath);
  const mtime = stats.mtime.getTime();

  if (mediaCache && mediaCache.mtime === mtime) {
    return { data: mediaCache.data };
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const parsed = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
  });

  const parsedData = parsed.data.map((rawRow: unknown) => {
    const row = rawRow as Record<string, string>;
    return {
      MLCatalogNumber: row['ML Catalog Number'] || '',
      Format: row['Format'] || '',
      CommonName: row['Common Name'] || '',
      ScientificName: row['Scientific Name'] || '',
      Recordist: row['Recordist'] || '',
      Date: row['Date'] || '',
      Time: row['Time'] || '',
      Country: row['Country'] || '',
      State: row['State'] || '',
      County: row['County'] || '',
      Locality: row['Locality'] || '',
      Latitude: parseFloat(row['Latitude']) || 0,
      Longitude: parseFloat(row['Longitude']) || 0,
      eBirdChecklistID: row['eBird Checklist ID'] || '',
    };
  });

  mediaCache = { data: parsedData, mtime };
  return { data: parsedData };
}
