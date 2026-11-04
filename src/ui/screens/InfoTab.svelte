<script lang="ts">
  import { session } from '../../app/session.svelte';
  import { editionName } from '../../i18n/game.svelte';
  import { t } from '../../i18n/index.svelte';
  import Button from '../components/Button.svelte';
  import Fieldset from '../components/Fieldset.svelte';
  import { formatName, formatSize, formatTime, gameTypeLabel } from '../format';

  interface Props {
    onopen: () => void;
  }

  let { onopen }: Props = $props();

  const save = $derived(session.save);
</script>

{#if save}
  <div class="grid">
    <Fieldset legend={t('info.openedTitle')}>
      <dl>
        <dt>{t('info.file')}</dt>
        <dd>{save.fileName}</dd>
        <dt>{t('info.game')}</dt>
        <dd>{gameTypeLabel(save.gameType)}</dd>
        <dt>{t('info.edition')}</dt>
        <dd>{editionName(session.edition)}</dd>
        <dt>{t('info.format')}</dt>
        <dd>{formatName(save.format)}</dd>
        <dt>{t('info.size')}</dt>
        <dd>{formatSize(save.buffer.length)}</dd>
      </dl>
    </Fieldset>
    <Fieldset legend={t('info.savedTitle')}>
      {#if session.savedAs}
        <dl>
          <dt>{t('info.file')}</dt>
          <dd>{session.savedAs.fileName}</dd>
          <dt>{t('info.savedAt')}</dt>
          <dd>{formatTime(session.savedAs.at)}</dd>
        </dl>
      {:else}
        <p class="muted">{t('info.notSavedYet')}</p>
      {/if}
    </Fieldset>
  </div>
{:else}
  <div class="empty">
    <h2>{t('info.emptyTitle')}</h2>
    <p>{t('info.emptyText')}</p>
    <Button variant="primary" icon="open" onclick={onopen}>{t('toolbar.open')}</Button>
  </div>
{/if}

<p class="warning">{t('info.warning')}</p>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--space-4);
  }

  dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: var(--space-2) var(--space-4);
    margin: var(--space-2) 0 0;
  }

  dt {
    color: var(--color-label);
    font-size: 13px;
  }

  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }

  .empty {
    display: grid;
    justify-items: start;
    gap: var(--space-3);
    max-width: 560px;
  }

  .empty h2 {
    font-size: 20px;
  }

  .empty p {
    margin: 0;
  }

  .muted {
    margin: var(--space-2) 0 0;
    color: var(--color-text-muted);
  }

  .warning {
    margin: var(--space-5) 0 0;
    font-size: 13px;
    font-style: italic;
    color: var(--color-text-muted);
  }
</style>
