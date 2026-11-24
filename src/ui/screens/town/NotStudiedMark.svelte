<script lang="ts">
  /** "Not studied" next to a town of a save whose town records are not fully known. */
  import { t } from '../../../i18n/index.svelte';
  import { tooltip } from '../../actions/tooltip';
  import Icon from '../../components/Icon.svelte';
</script>

<span class="mark" use:tooltip={t('town.notStudiedHint')}>
  <Icon name="warning" size={12} />
  {t('town.notStudied')}
</span>

<style>
  .mark {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--color-warning);
    color: var(--color-warning-text);
    font-size: 11px;
    white-space: nowrap;
    vertical-align: middle;
  }
</style>
