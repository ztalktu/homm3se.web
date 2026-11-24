<script lang="ts">
  import type { Hero } from '../../../core/hero';
  import { classTown } from '../../../data/heroClasses';
  import { t } from '../../../i18n/index.svelte';
  import TroopsEditor from '../shared/TroopsEditor.svelte';

  interface Props {
    hero: Hero;
  }

  let { hero = $bindable() }: Props = $props();
</script>

<TroopsEditor
  bind:troops={hero.troops}
  ownTown={classTown(hero.classId)}
  label={t('heroDialog.tab.troops')}
/>
