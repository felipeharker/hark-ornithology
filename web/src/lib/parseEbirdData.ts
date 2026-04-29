import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

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

export function getLatestEbirdData(): EbirdObservation[] {
  const dataDir = path.join(process.cwd(), '../observation-data');

  if (!fs.existsSync(dataDir)) {
    return [];
  }

  const files = fs.readdirSync(dataDir);
  const csvFiles = files.filter(f => f.endsWith('.csv'));

  if (csvFiles.length === 0) {
    return [];
  }

  // Sort files by name to get the latest (assuming ebird-data-YYMMDD.csv or similar)
  // or just get the first one if there's only one
  csvFiles.sort((a, b) => b.localeCompare(a));
  const latestFile = csvFiles[0];

  const filePath = path.join(dataDir, latestFile);
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const parsed = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
  });

  return parsed.data.map((row: any) => ({
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
