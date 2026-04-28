import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export interface Observation {
  'Submission ID': string;
  'Common Name': string;
  'Scientific Name': string;
  'Taxonomic Order': string;
  Count: string;
  'State/Province': string;
  County: string;
  'Location ID': string;
  Location: string;
  Latitude: string;
  Longitude: string;
  Date: string;
  Time: string;
  Protocol: string;
  'Duration (Min)': string;
  'All Obs Reported': string;
  'Distance Traveled (km)': string;
  'Area Covered (ha)': string;
  'Number of Observers': string;
  'Breeding Code': string;
  'Observation Details': string;
  'Checklist Comments': string;
  'ML Catalog Numbers': string;
}

export interface LocationSummary {
  locationId: string;
  locationName: string;
  latitude: number;
  longitude: number;
  observations: {
    commonName: string;
    scientificName: string;
    date: string;
    count: string;
  }[];
  uniqueSpeciesCount: number;
}

export function getBirdingData(): LocationSummary[] {
  const filePath = path.join(process.cwd(), '..', 'observation-data', 'ebird-data-260427.csv');
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const { data } = Papa.parse<Observation>(fileContent, {
    header: true,
    skipEmptyLines: true,
  });

  const locationMap = new Map<string, LocationSummary>();

  data.forEach((row) => {
    if (!row['Location ID'] || !row.Latitude || !row.Longitude) return;

    const locId = row['Location ID'];
    const lat = parseFloat(row.Latitude);
    const lng = parseFloat(row.Longitude);

    if (isNaN(lat) || isNaN(lng)) return;

    if (!locationMap.has(locId)) {
      locationMap.set(locId, {
        locationId: locId,
        locationName: row.Location || 'Unknown Location',
        latitude: lat,
        longitude: lng,
        observations: [],
        uniqueSpeciesCount: 0,
      });
    }

    const locSummary = locationMap.get(locId)!;
    locSummary.observations.push({
      commonName: row['Common Name'],
      scientificName: row['Scientific Name'],
      date: row.Date,
      count: row.Count,
    });
  });

  const summaries = Array.from(locationMap.values()).map((summary) => {
    const uniqueSpecies = new Set(summary.observations.map((obs) => obs.commonName));
    return {
      ...summary,
      uniqueSpeciesCount: uniqueSpecies.size,
    };
  });

  return summaries;
}