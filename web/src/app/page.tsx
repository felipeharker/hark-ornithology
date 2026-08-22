import { getLatestEbirdData } from '@/lib/parseEbirdData';
import { getLatestEbirdMediaData } from '@/lib/parseEbirdMediaData';
import { getFieldNotes } from '@/lib/parseFieldNotes';
import { getSiteOptions } from '@/lib/parseOptions';
import { getAbstract } from '@/lib/parseAbstract';
import HomeDocument from '@/components/HomeDocument';

/**
 * Reads every content source at build time and hands it to HomeDocument:
 *
 *   observation-data/ebird-data-latest.csv   → map pins, locations, species
 *   observation-data/ebird-media-latest.csv  → the Media section
 *   web/field-notes/*.md                     → Field Notes
 *   web/content/abstract.md                  → the abstract
 *   public/options.csv                       → title, accent colour, data file
 */
export default function Home() {
  const { data } = getLatestEbirdData();
  const { data: mediaData } = getLatestEbirdMediaData();
  const fieldNotes = getFieldNotes();
  const abstract = getAbstract();
  const options = getSiteOptions();

  return (
    <HomeDocument
      data={data}
      mediaData={mediaData}
      fieldNotes={fieldNotes}
      abstract={abstract}
      options={options}
    />
  );
}
