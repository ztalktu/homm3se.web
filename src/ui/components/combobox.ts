export interface ComboboxItem<Value> {
  value: Value;
  label: string;
  /** Second line in the list, e.g. town and level of a creature. */
  description?: string | undefined;
  /** Extra words that should also match the search, e.g. town names. */
  keywords?: string | undefined;
  disabled?: boolean | undefined;
  /** On a light gold background, e.g. an artifact the hero already carries. */
  highlighted?: boolean | undefined;
  /** CSS colors of small round marks at the right end of the option, e.g. player colors. */
  marks?: readonly string[] | undefined;
}
