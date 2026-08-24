import { getObservations, getMedia } from '@/lib/parseEbird';
import { getFieldNotes } from '@/lib/parseFieldNotes';
import HomeDocument from '@/components/HomeDocument';

/**
 * Reads every content source at build time and hands it to HomeDocument:
 *
 *   observation-data/ebird-data-latest.csv   → map pins, locations, species
 *   observation-data/ebird-media-latest.csv  → the Media section
 *   web/field-notes/*.md                     → Field Notes
 *
 * The title, abstract and off-site links are project settings rather than
 * observations, so they come from src/lib/siteConfig.ts and are imported
 * where they are used rather than threaded through here.
 */
export default function Home() {
  return (
    <HomeDocument
      data={getObservations()}
      mediaData={getMedia()}
      fieldNotes={getFieldNotes()}
    />
  );
}
