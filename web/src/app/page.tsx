import { getLatestEbirdData } from '@/lib/parseEbirdData';
import { getLatestEbirdMediaData } from '@/lib/parseEbirdMediaData';
import { getFieldNotes } from '@/lib/parseFieldNotes';
import { getSiteOptions } from '@/lib/parseOptions';
import HomeDocument from '@/components/HomeDocument';

export default function Home() {
  const { data } = getLatestEbirdData();
  const { data: mediaData } = getLatestEbirdMediaData();
  const fieldNotes = getFieldNotes();
  const options = getSiteOptions();

  return (
    <HomeDocument data={data} mediaData={mediaData} fieldNotes={fieldNotes} options={options} />
  );
}
