/**
 * Everything about the site that is a property of the project rather than a
 * record of an observation.
 *
 * Observations, media and field notes still come from files — the eBird
 * exports in `observation-data/` and the Markdown in `field-notes/` — because
 * those change whenever a new checklist is submitted. The values below change
 * when the project itself changes, which is rarely and always alongside a code
 * edit, so they live here instead of in a CSV nobody remembers to look at.
 */

/** Browser tab, masthead, and the nav brand on interior pages. */
export const SITE_TITLE = 'Harker Ornithology Report';

/** Sits under the title on the homepage. */
export const SITE_SUBTITLE = 'A Record of Field Observations, Checklists, and Media';

/** Byline under the subtitle. */
export const SITE_AUTHOR = 'Felipe Harker';

/** Used for the page description in metadata. */
export const SITE_DESCRIPTION = 'Personal birding project visualizing eBird observation data.';

/** The summary paragraph on the homepage, below the masthead. */
export const ABSTRACT =
  'This project catalogs and shares birding observations from around the world, ' +
  'with checklists and media hosted on eBird and the Macaulay Library. It began ' +
  'as an experiment merging a love of birds with web development, and remains ' +
  'under active, frequent development.';

/**
 * Off-site addresses used in more than one place — the repository URL alone
 * appears in the navigation bar, the reference list and the colophon.
 */
export const SITE_LINKS = {
  repository: 'https://github.com/felipeharker/hark-ornithology',
  ebirdProfile: 'https://ebird.org/profile/ODE0ODA5NQ/world',
  macaulayLibrary:
    'https://media.ebird.org/catalog?unconfirmed=incl&mediaType=photo&userId=USER8148095',
  merlin: 'https://merlin.allaboutbirds.org/',
} as const;

/**
 * Props every outbound link needs. Collected here so no link ships without
 * `rel="noopener noreferrer"`, and so an internal href (which must not open a
 * new tab) is handled by the same call.
 */
export function externalLinkProps(href: string) {
  return href.startsWith('http')
    ? { target: '_blank', rel: 'noopener noreferrer' as const }
    : {};
}
