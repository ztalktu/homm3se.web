<script lang="ts">
  /** "Your changes were not saved. Save?" before something would throw them away. */
  import { t } from '../../i18n/index.svelte';
  import Button from '../components/Button.svelte';
  import Dialog from '../components/Dialog.svelte';

  interface Props {
    open: boolean;
    /** Defaults are for the save file; the hero window asks about its own changes. */
    text?: string | undefined;
    saveLabel?: string | undefined;
    discardLabel?: string | undefined;
    onsave: () => void;
    ondiscard: () => void;
  }

  let {
    open = $bindable(),
    text = t('unsaved.text'),
    saveLabel = t('unsaved.save'),
    discardLabel = t('unsaved.discard'),
    onsave,
    ondiscard,
  }: Props = $props();
</script>

<Dialog bind:open title={t('unsaved.title')} size="small">
  <p>{text}</p>
  {#snippet footer()}
    <Button onclick={() => (open = false)}>{t('unsaved.cancel')}</Button>
    <Button variant="danger" onclick={ondiscard}>{discardLabel}</Button>
    <Button variant="primary" icon="save" onclick={onsave}>{saveLabel}</Button>
  {/snippet}
</Dialog>

<style>
  p {
    margin: 0;
  }
</style>
