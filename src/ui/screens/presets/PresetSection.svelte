<script lang="ts">
  /**
   * A part of a preset saved or loaded as a whole (a hero window tab): its checkbox, a line of
   * what it holds, and maybe a choice of how to load it. Not in the preset: greyed out.
   */
  import type { Snippet } from 'svelte';
  import type { TooltipContent } from '../../actions/tooltip';
  import Checkbox from '../../components/Checkbox.svelte';
  import Icon from '../../components/Icon.svelte';
  import type { IconName } from '../../components/icons';
  import { t } from '../../../i18n/index.svelte';
  import { PRESET_HINT_DELAY_MS } from './hints';

  interface Props {
    label: string;
    icon: IconName;
    checked: boolean;
    /** False when the preset has no such part. */
    available: boolean;
    summary: string;
    hint: TooltipContent | undefined;
    children?: Snippet | undefined;
  }

  let {
    label,
    icon: iconName,
    checked = $bindable(),
    available,
    summary,
    hint,
    children,
  }: Props = $props();
</script>

<div class="section">
  <Checkbox
    {label}
    checked={available && checked}
    disabled={!available}
    hint={available ? hint : t('preset.notSavedHint')}
    hintDelayMs={PRESET_HINT_DELAY_MS}
    onchange={(value) => (checked = value)}
  >
    {#snippet icon()}<Icon name={iconName} size={16} />{/snippet}
  </Checkbox>
  <span class="summary">{available ? summary || t('preset.empty.slot') : t('preset.notSaved')}</span
  >
  {#if available && children}
    <div class="more">{@render children()}</div>
  {/if}
</div>

<style>
  /* Items keep their own width: a checkbox stretched across the column would keep its hint up
     over empty space. */
  .section {
    display: grid;
    gap: 2px;
    justify-items: start;
  }

  .summary,
  .more {
    padding-left: calc(18px + var(--space-2));
  }

  .summary {
    font-size: 13px;
    color: var(--color-text-muted);
  }
</style>
