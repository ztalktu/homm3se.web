<script lang="ts">
  /** "Your changes were not saved. Save?" before something would throw them away. */
  import { t } from '../../i18n/index.svelte';
  import Button from '../components/Button.svelte';
  import Dialog from '../components/Dialog.svelte';

  interface Props {
    open: boolean;
    onsave: () => void;
    ondiscard: () => void;
  }

  let { open = $bindable(), onsave, ondiscard }: Props = $props();
</script>

<Dialog bind:open title={t('unsaved.title')} size="small">
  <p>{t('unsaved.text')}</p>
  {#snippet footer()}
    <Button onclick={() => (open = false)}>{t('unsaved.cancel')}</Button>
    <Button variant="danger" onclick={ondiscard}>{t('unsaved.discard')}</Button>
    <Button variant="primary" icon="save" onclick={onsave}>{t('unsaved.save')}</Button>
  {/snippet}
</Dialog>

<style>
  p {
    margin: 0;
  }
</style>
