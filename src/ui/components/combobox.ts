export interface ComboboxItem<Value> {
  value: Value;
  label: string;
  /** Second line in the list, e.g. town and level of a creature. */
  description?: string | undefined;
  /** Extra words that should also match the search, e.g. town names. */
  keywords?: string | undefined;
  disabled?: boolean | undefined;
}
