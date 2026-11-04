/** The option a native <select> change event picked, or undefined if it is not in the list. */
export function selectedOption<Option extends { value: string }>(
  event: Event,
  options: readonly Option[],
): Option | undefined {
  const selected = (event.currentTarget as HTMLSelectElement).value;
  return options.find((candidate) => candidate.value === selected);
}
