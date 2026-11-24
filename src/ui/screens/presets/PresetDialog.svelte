<script lang="ts" generics="Kind extends PresetKind">
  /**
   * The window that saves or loads a preset. Both look the same: the name across the top, the
   * saved presets on the left, what to save or load on the right. Saving types the name (a
   * click in the list takes a name to overwrite); loading shows the picked preset's name.
   */
  import type { Snippet } from 'svelte';
  import {
    deletePreset,
    presetsOf,
    type Preset,
    type PresetKind,
  } from '../../../app/presets.svelte';
  import { editionName } from '../../../i18n/game.svelte';
  import { t } from '../../../i18n/index.svelte';
  import Button from '../../components/Button.svelte';
  import Dialog from '../../components/Dialog.svelte';
  import OptionList from '../../components/OptionList.svelte';
  import TextField from '../../components/TextField.svelte';
  import { formatDateTime } from '../../format';
  import WarningNote from '../shared/WarningNote.svelte';

  interface Props {
    open: boolean;
    kind: Kind;
    mode: 'save' | 'load';
    /** Saving: the name typed. Loading: the name of the picked preset. */
    name: string;
    /** More about a preset after its date and edition (a town's faction). */
    describe?: ((preset: Preset<Kind>) => string | undefined) | undefined;
    /** Three columns: the list and two of choices (the hero). */
    wide?: boolean | undefined;
    canApply: boolean;
    onapply: () => void;
    /** The choices, one or two grid columns. */
    children: Snippet;
    /** Warnings under the columns: what will be skipped. */
    notes?: Snippet | undefined;
  }

  let {
    open = $bindable(),
    kind,
    mode,
    name = $bindable(),
    describe,
    wide = false,
    canApply,
    onapply,
    children,
    notes,
  }: Props = $props();

  const presets = $derived(presetsOf(kind));
  const overwrites = $derived(
    mode === 'save' && presets.some((preset) => preset.name === name.trim()),
  );
  let deleting: string | null = $state(null);
  let confirmOpen = $state(false);

  function meta(preset: Preset<Kind>): string {
    const line = t('preset.meta', {
      date: formatDateTime(preset.savedAt),
      edition: editionName(preset.edition),
    });
    const more = describe?.(preset);
    return more ? `${line} · ${more}` : line;
  }

  function askToDelete(presetName: string): void {
    deleting = presetName;
    confirmOpen = true;
  }

  function confirmDelete(): void {
    if (deleting !== null) {
      deletePreset(kind, deleting);
      if (mode === 'load' && name === deleting) {
        name = presetsOf(kind)[0]?.name ?? '';
      }
    }
    confirmOpen = false;
  }
</script>

<Dialog
  bind:open
  title={t(mode === 'save' ? `preset.saveTitle.${kind}` : `preset.loadTitle.${kind}`)}
  size={wide ? 'large' : 'medium'}
>
  <div class="frame">
    {#if mode === 'save'}
      <TextField label={t('preset.name')} bind:value={name} maxlength={60} />
    {:else}
      <TextField label={t('preset.picked')} value={name} disabled />
    {/if}
    <div class="columns" class:wide>
      <div class="list-column">
        <span class="list-title">{t('preset.list')}</span>
        {#if presets.length === 0}
          <p class="empty">{t('preset.empty')}</p>
        {:else}
          <OptionList
            items={presets}
            key={(preset) => preset.name}
            selected={(preset) => preset.name === name.trim()}
            label={t('preset.list')}
            onpick={(preset) => (name = preset.name)}
          >
            {#snippet row(preset)}
              <span class="item">
                <span class="name">{preset.name}</span>
                <small>{meta(preset)}</small>
              </span>
            {/snippet}
            {#snippet trailing(preset)}
              <span class="delete">
                <Button
                  variant="ghost"
                  size="small"
                  icon="trash"
                  label={t('preset.delete')}
                  hint={t('preset.delete')}
                  onclick={() => askToDelete(preset.name)}
                />
              </span>
            {/snippet}
          </OptionList>
        {/if}
      </div>
      {@render children()}
    </div>
    {#if overwrites}
      <WarningNote text={t('preset.overwrite')} />
    {/if}
    {@render notes?.()}
    {#if mode === 'load'}
      <p class="note">{t(`preset.loadNote.${kind}`)}</p>
    {/if}
  </div>

  {#snippet footer()}
    <Button onclick={() => (open = false)}>{t('common.cancel')}</Button>
    <Button
      variant="primary"
      icon={mode === 'save' ? 'save' : 'open'}
      disabled={!canApply}
      onclick={onapply}
    >
      {t(mode === 'save' ? 'preset.save' : 'preset.load')}
    </Button>
  {/snippet}
</Dialog>

<Dialog bind:open={confirmOpen} title={t('preset.deleteTitle')} size="small">
  <p class="text">{t('preset.deleteText', { name: deleting ?? '' })}</p>
  {#snippet footer()}
    <Button onclick={() => (confirmOpen = false)}>{t('common.cancel')}</Button>
    <Button variant="danger" icon="trash" onclick={confirmDelete}
      >{t('preset.deleteConfirm')}</Button
    >
  {/snippet}
</Dialog>

<style>
  .frame {
    display: grid;
    gap: var(--space-3);
  }

  .columns {
    display: grid;
    grid-template-columns: minmax(200px, 1fr) minmax(0, 1.3fr);
    gap: var(--space-4);
    align-items: start;
  }

  .columns.wide {
    grid-template-columns: minmax(200px, 1fr) minmax(0, 1.1fr) minmax(0, 1.4fr);
  }

  @media (max-width: 760px) {
    .columns,
    .columns.wide {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .list-column {
    display: grid;
    gap: var(--space-1);
  }

  .list-title {
    font-size: 13px;
    color: var(--color-label);
  }

  .empty,
  .note {
    margin: 0;
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .text {
    margin: 0;
  }

  .item {
    display: grid;
    line-height: 1.25;
  }

  .name {
    overflow-wrap: anywhere;
  }

  /* The list has a field background: the icon takes the field's text color. */
  .delete :global(button) {
    color: inherit;
  }

  .item small {
    font-size: 12px;
    color: var(--color-field-placeholder);
  }
</style>
