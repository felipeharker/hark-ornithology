import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { execSync } from 'child_process';

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

let cache: { data: EbirdObservation[], lastUpdated: string | null, mtime: number } | null = null;

export function getLatestEbirdData(): { data: EbirdObservation[], lastUpdated: string | null } {
  const dataDir = path.join(process.cwd(), '../observation-data');
  const latestFile = 'ebird-data-latest.csv';
  const filePath = path.join(dataDir, latestFile);

  if (!fs.existsSync(filePath)) {
    return { data: [], lastUpdated: null };
  }

  const stats = fs.statSync(filePath);
  const mtime = stats.mtime.getTime();

  if (cache && cache.mtime === mtime) {
    return { data: cache.data, lastUpdated: cache.lastUpdated };
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');

  // Try getting last updated date from git commit history
  let lastUpdated = '';
  try {
    const gitDate = execSync(`git log -1 --format=%cd --date=short -- "${filePath}"`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
    if (gitDate) {
      lastUpdated = gitDate;
    } else {
      const d = stats.mtime;
      const month = ('0' + (d.getMonth() + 1)).slice(-2);
      const day = ('0' + d.getDate()).slice(-2);
      lastUpdated = `${d.getFullYear()}-${month}-${day}`;
    }
  } catch (_e) {
    const d = stats.mtime;
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    lastUpdated = `${d.getFullYear()}-${month}-${day}`;
  }

  const parsed = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
  });

  const parsedData = parsed.data.map((rawRow: unknown) => {
    const row = rawRow as Record<string, string>;
    return {
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
  }});

  cache = { data: parsedData, lastUpdated: lastUpdated, mtime };
  return { data: parsedData, lastUpdated: lastUpdated };
}
