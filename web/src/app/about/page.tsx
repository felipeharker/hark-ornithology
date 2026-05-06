import { getSiteOptions } from '@/lib/parseOptions';
import Link from 'next/link';

export default function About() {
  const options = getSiteOptions();

  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12 bg-white text-black">
      <div className="max-w-3xl mx-auto space-y-8 md:space-y-12">
        <header className="border-b border-black pb-4 mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">About the Project</h1>
          <div className="mt-2 text-sm md:text-base text-gray-600 font-mono">
            <Link href="/" className="hover:underline">&larr; Return Home</Link>
          </div>
        </header>

        <section className="space-y-6 text-lg font-serif">
          <p>
            This project is built and maintained by Felipe. Resources and additional information are available below. Thank you.
          </p>

          <ul className="list-disc list-inside space-y-4 ml-4">
            <li>
              <a
                href="https://github.com/felipeharker/hark-ornithology"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: options.secondaryColorHex }}
                className="hover:underline font-mono"
              >
                Github Repository
              </a>
              <p>
                See underlying project codebase, contribute your own ideas, and host this site locally.
              </p>
            </li>
            <li>
              <a
                href="https://ebird.org/profile/ODE0ODA5NQ/world"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: options.secondaryColorHex }}
                className="hover:underline font-mono"
              >
                eBird Account
              </a>
              <p>
                All checklists, locations, observstions, and more can also be seen on eBird.
              </p>
            </li>
            <li>
              <a
                href="https://media.ebird.org/catalog?unconfirmed=incl&mediaType=photo&userId=USER8148095"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: options.secondaryColorHex }}
                className="hover:underline font-mono"
              >
                Macaulay Library
              </a>
            </li>
              <p>
                Media such as images, audio, and video recordings are cataloged on Macaulay Library.
              </p>
            <li>
              <a
                href="https://merlin.allaboutbirds.org/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: options.secondaryColorHex }}
                className="hover:underline font-mono"
              >
                Merlin Bird ID
              </a>
              <p>
                State-of-the-art visual and audio bird identification mobile app. Invaluable resource for any birder.
              </p>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
