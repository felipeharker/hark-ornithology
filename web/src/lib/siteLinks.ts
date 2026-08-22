/**
 * Off-site addresses used in more than one place.
 *
 * These are properties of the project rather than content, which is why they
 * live here and not in a CSV: the repository URL appeared in the navigation
 * bar, the reference list and the colophon, and a change had to be made in
 * three files to take effect. Observations, media and prose still come from
 * the files described in README.md — nothing about a bird or a place belongs
 * in this module.
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
