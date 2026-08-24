/**
 * Readers for the two eBird exports in `observation-data/`.
 *
 * Both files are read once at build time and cached on the file's modification
 * time, because every statically-generated page asks for the same rows: without
 * the cache a repository with a few hundred checklists re-parses the same CSV a
 * few hundred times.
 *
 * The field-name maps below are the only place eBird's column headers appear.
 * They need touching when eBird changes its export format, and at no other time.
 *
 * This module reads the filesystem, so only server components may import a
 * *value* from it — `formatDate` lives in its own module precisely because the
 * client components need it and importing it from here would pull `fs` into
 * the browser bundle. Importing the two row *types* from here is fine: types
 * are erased before bundling.
 */

import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

/** Both exports live at the repository root, one level up from `web/`. */
const DATA_DIR = path.join(process.cwd(), '../observation-data');
const OBSERVATIONS_FILE = 'ebird-data-latest.csv';
const MEDIA_FILE = 'ebird-media-latest.csv';

export interface EbirdObservation {
  SubmissionID: string;
  CommonName: string;
  ScientificName: string;
  TaxonomicOrder: string;
  Count: string;
  StateProvince: string;
  County: string;
  LocationID: string;
  Location: string;
  Latitude: number;
  Longitude: number;
  Date: string;
  Time: string;
  Protocol: string;
  DurationMin: string;
  AllObsReported: string;
  DistanceTraveledKm: string;
  AreaCoveredHa: string;
  NumberOfObservers: string;
  BreedingCode: string;
  ObservationDetails: string;
  ChecklistComments: string;
  MLCatalogNumbers: string;
}

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

const caches = new Map<string, { rows: unknown[]; mtime: number }>();

/**
 * Parse one CSV from `observation-data/`, reusing the previous result while the
 * file on disk has not changed. A missing file yields no rows rather than an
 * error: the site renders its empty states instead of failing the build.
 */
function readCsv<T>(fileName: string, toRow: (row: Record<string, string>) => T): T[] {
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) return [];

  const mtime = fs.statSync(filePath).mtime.getTime();
  const cached = caches.get(fileName);
  if (cached && cached.mtime === mtime) return cached.rows as T[];

  const parsed = Papa.parse(fs.readFileSync(filePath, 'utf-8'), {
    header: true,
    skipEmptyLines: true,
  });
  const rows = parsed.data.map((raw) => toRow(raw as Record<string, string>));

  caches.set(fileName, { rows, mtime });
  return rows;
}

/** Every observation row: map pins, the location index, species, checklists. */
export function getObservations(): EbirdObservation[] {
  return readCsv(OBSERVATIONS_FILE, (row) => ({
    SubmissionID: row['Submission ID'] || '',
    CommonName: row['Common Name'] || '',
    ScientificName: row['Scientific Name'] || '',
    TaxonomicOrder: row['Taxonomic Order'] || '',
    Count: row['Count'] || '',
    StateProvince: row['State/Province'] || '',
    County: row['County'] || '',
    LocationID: row['Location ID'] || '',
    Location: row['Location'] || '',
    Latitude: parseFloat(row['Latitude']) || 0,
    Longitude: parseFloat(row['Longitude']) || 0,
    Date: row['Date'] || '',
    Time: row['Time'] || '',
    Protocol: row['Protocol'] || '',
    DurationMin: row['Duration (Min)'] || '',
    AllObsReported: row['All Obs Reported'] || '',
    DistanceTraveledKm: row['Distance Traveled (km)'] || '',
    AreaCoveredHa: row['Area Covered (ha)'] || '',
    NumberOfObservers: row['Number of Observers'] || '',
    BreedingCode: row['Breeding Code'] || '',
    ObservationDetails: row['Observation Details'] || '',
    ChecklistComments: row['Checklist Comments'] || '',
    MLCatalogNumbers: row['ML Catalog Numbers'] || '',
  }));
}

/** Every Macaulay Library asset: the Media section and the lightboxes. */
export function getMedia(): EbirdMediaObservation[] {
  return readCsv(MEDIA_FILE, (row) => ({
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
  }));
}
