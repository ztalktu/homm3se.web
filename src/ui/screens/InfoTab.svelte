<script lang="ts">
  import { session } from '../../app/session.svelte';
  import { editionName } from '../../i18n/game.svelte';
  import { t } from '../../i18n/index.svelte';
  import Button from '../components/Button.svelte';
  import Fieldset from '../components/Fieldset.svelte';
  import { formatDateTime, formatName, formatSize, gameTypeLabel } from '../format';
  import ChangesSummary from './ChangesSummary.svelte';

  interface Props {
    onopen: () => void;
  }

  let { onopen }: Props = $props();

  const save = $derived(session.save);
</script>

{#if save}
  <div class="blocks">
    <Fieldset legend={t('info.openedTitle')}>
      <!-- Two columns of three, filled top to bottom. -->
      <dl>
        <div>
          <dt>{t('info.file')}</dt>
          <dd>{save.fileName}</dd>
        </div>
        <div>
          <dt>{t('info.game')}</dt>
          <dd>{gameTypeLabel(save.gameType)}</dd>
        </div>
        <div>
          <dt>{t('info.edition')}</dt>
          <dd>{editionName(session.edition)}</dd>
        </div>
        <div>
          <dt>{t('info.format')}</dt>
          <dd>{formatName(save.format)}</dd>
        </div>
        <div>
          <dt>{t('info.size')}</dt>
          <dd>{formatSize(save.buffer.length)}</dd>
        </div>
        <div>
          <dt>{t('info.savedTitle')}</dt>
          <dd>
            {#if session.savedAs}
              <strong>{session.savedAs.fileName}</strong>
              <span class="muted when">· {formatDateTime(session.savedAs.at)}</span>
            {:else}
              <span class="muted">{t('info.notSavedYet')}</span>
            {/if}
          </dd>
        </div>
      </dl>
    </Fieldset>
    <Fieldset legend={t('info.changesTitle')}>
      <ChangesSummary />
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
  .blocks {
    display: grid;
    gap: var(--space-4);
  }

  dl {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(3, auto);
    grid-auto-flow: column;
    gap: var(--space-2) var(--space-6);
    margin: var(--space-2) 0 0;
  }

  dl > div {
    display: grid;
    grid-template-columns: 190px minmax(0, 1fr);
    gap: var(--space-4);
  }

  dt {
    padding-top: 2px;
    color: var(--color-label);
    font-size: 13px;
  }

  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }

  .when {
    white-space: nowrap;
  }

  @media (max-width: 760px) {
    dl {
      grid-template-columns: minmax(0, 1fr);
      grid-auto-flow: row;
    }

    dl > div {
      grid-template-columns: minmax(0, 1fr);
      gap: 0;
    }
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
    color: var(--color-text-muted);
  }

  .warning {
    margin: var(--space-5) 0 0;
    font-size: 13px;
    font-style: italic;
    color: var(--color-text-muted);
  }
</style>
