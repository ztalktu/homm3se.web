<script lang="ts" generics="Key extends string">
  /**
   * Values saved or loaded one by one (hero attributes, resources): a checkbox and the value on
   * each row, and "All" on top.
   */
  import type { Snippet } from 'svelte';
  import { t } from '../../../i18n/index.svelte';
  import type { TooltipContent } from '../../actions/tooltip';
  import Checkbox from '../../components/Checkbox.svelte';
  import Fieldset from '../../components/Fieldset.svelte';
  import { PRESET_HINT_DELAY_MS } from './hints';

  interface Row {
    key: Key;
    label: string;
    value: string;
    hint?: TooltipContent | undefined;
    /** False when the preset lacks just this value. */
    available?: boolean | undefined;
  }

  interface Props {
    legend: string;
    rows: readonly Row[];
    checked: Record<Key, boolean>;
    /** False when the preset has none of these values: everything is greyed out. */
    available?: boolean | undefined;
    unavailableText?: string | undefined;
    /** A picture before a row's label (a resource icon). */
    icon?: Snippet<[Key]> | undefined;
  }

  let {
    legend,
    rows,
    checked = $bindable(),
    available = true,
    unavailableText,
    icon,
  }: Props = $props();

  const usable = $derived(available ? rows.filter((row) => row.available !== false) : []);
  const count = $derived(usable.filter((row) => checked[row.key]).length);

  function setAll(value: boolean): void {
    for (const row of usable) {
      checked[row.key] = value;
    }
  }
</script>

<Fieldset {legend}>
  <div class="all">
    <Checkbox
      label={t('preset.all')}
      checked={usable.length > 0 && count === usable.length}
      disabled={usable.length === 0}
      onchange={setAll}
    />
    {#if count > 0 && count < usable.length}
      <span class="count">{t('preset.selected', { count, total: usable.length })}</span>
    {/if}
  </div>
  <div class="rows">
    {#each rows as row (row.key)}
      {@const on = usable.includes(row)}
      {#snippet rowIcon()}{@render icon?.(row.key)}{/snippet}
      <Checkbox
        label={row.label}
        checked={on && checked[row.key]}
        disabled={!on}
        hint={on ? row.hint : undefined}
        hintDelayMs={PRESET_HINT_DELAY_MS}
        onchange={(value) => (checked[row.key] = value)}
        icon={icon ? rowIcon : undefined}
      />
      <span class="value">{on ? row.value : '—'}</span>
    {/each}
  </div>
  {#if !available && unavailableText}
    <p class="count">{unavailableText}</p>
  {/if}
</Fieldset>

<style>
  .all {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-2);
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--color-frame-soft);
  }

  .rows {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    gap: 0 var(--space-3);
    align-items: center;
  }

  .value {
    font-variant-numeric: tabular-nums;
    text-align: right;
    overflow-wrap: anywhere;
  }

  .count {
    margin: 0;
    font-size: 13px;
    color: var(--color-text-muted);
  }
</style>
