/**
 * eBird writes a date as either YYYY-MM-DD or MM/DD/YYYY; the first part's
 * length is what tells the two apart. Anything that does not parse is handed
 * back untouched, so an unexpected format shows as itself rather than as
 * "Invalid Date".
 *
 * This is a plain string helper with no Node imports, which is why it is not
 * in parseEbird.ts: client components format dates too, and that module reads
 * the filesystem.
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split(/[-/]/);
  if (parts.length < 3) return dateStr;

  const [year, month, day] = parts[0].length === 4 ? parts : [parts[2], parts[0], parts[1]];
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  if (isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}
