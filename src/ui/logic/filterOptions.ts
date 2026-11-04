/** Search used by Combobox: case-insensitive, ignores "ё" vs "е", every word must match. */

interface SearchableOption {
  label: string;
  /** Extra words that should also match, e.g. town or school names. */
  keywords?: string | undefined;
}

export function normalizeSearchText(text: string): string {
  return text.toLocaleLowerCase().replaceAll('ё', 'е').replace(/\s+/g, ' ').trim();
}

/**
 * Returns the options that contain every word of the query.
 * Options whose label starts with the query come first; otherwise the original order is kept.
 */
export function filterOptions<Option extends SearchableOption>(
  options: readonly Option[],
  query: string,
): Option[] {
  const normalizedQuery = normalizeSearchText(query);
  if (normalizedQuery === '') {
    return [...options];
  }
  const words = normalizedQuery.split(' ');
  const startsWith: Option[] = [];
  const contains: Option[] = [];
  for (const option of options) {
    const label = normalizeSearchText(option.label);
    const haystack = option.keywords ? `${label} ${normalizeSearchText(option.keywords)}` : label;
    if (!words.every((word) => haystack.includes(word))) {
      continue;
    }
    (label.startsWith(normalizedQuery) ? startsWith : contains).push(option);
  }
  return [...startsWith, ...contains];
}
