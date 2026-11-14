<script lang="ts">
  import { session } from '../../app/session.svelte';
  import { editionName } from '../../i18n/game.svelte';
  import { tooltip } from '../actions/tooltip';
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

<!-- A name too long for its place is cut at the end of its stem and keeps the extension: "se_homm3_hot….GM4". -->
{#snippet fileName(name: string)}
  {@const dot = name.lastIndexOf('.')}
  <span class="file-name" use:tooltip={name}>
    <span class="stem">{dot > 0 ? name.slice(0, dot) : name}</span>{dot > 0 ? name.slice(dot) : ''}
  </span>
{/snippet}

{#if save}
  <div class="blocks">
    <Fieldset legend={t('info.openedTitle')}>
      <!-- Two columns of three, filled top to bottom. -->
      <dl>
        <div>
          <dt>{t('info.file')}</dt>
          <dd>{@render fileName(save.fileName)}</dd>
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
          <dd class="saved">
            {#if session.savedAs}
              <strong>{@render fileName(session.savedAs.fileName)}</strong>
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

  /* Labels take only the width they need, so the values get the rest. */
  dl {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr) max-content minmax(0, 1fr);
    grid-template-rows: repeat(3, auto);
    grid-auto-flow: column;
    gap: var(--space-2) var(--space-4);
    margin: var(--space-2) 0 0;
  }

  dl > div {
    grid-column: span 2;
    display: grid;
    grid-template-columns: subgrid;
  }

  dl > div:nth-child(n + 4) dt {
    padding-left: var(--space-5);
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

  .file-name {
    display: inline-flex;
    max-width: 100%;
    min-width: 0;
    white-space: nowrap;
  }

  .stem {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* The saved file name gives way to the time, which always stays whole. */
  .saved {
    display: flex;
    align-items: baseline;
    gap: var(--space-1);
  }

  .saved strong {
    display: flex;
    min-width: 0;
  }

  .when {
    flex: none;
    white-space: nowrap;
  }

  @media (max-width: 760px) {
    dl {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: none;
      grid-auto-flow: row;
    }

    dl > div {
      grid-column: auto;
      grid-template-columns: minmax(0, 1fr);
    }

    dl > div:nth-child(n + 4) dt {
      padding-left: 0;
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
