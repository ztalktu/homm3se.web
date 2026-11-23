<script lang="ts">
  /**
   * The category badge of an artifact of the opened save. A combination artifact gets a gold
   * sparkle in the top left corner, so it stands out in lists and on the hero.
   */
  import { session } from '../../../app/session.svelte';
  import { artifactById } from '../../../data/artifacts';
  import { combinationLocks } from '../../../data/equipment';
  import Sparkle from '../shared/Sparkle.svelte';
  import ArtifactCategoryIcon from './ArtifactCategoryIcon.svelte';

  interface Props {
    artifactId: number;
    size?: number | undefined;
  }

  let { artifactId, size = 22 }: Props = $props();

  const category = $derived(artifactById(artifactId, session.edition)?.category);
  const combination = $derived(combinationLocks(artifactId, session.edition) !== undefined);
</script>

{#if category}
  <span class="artifact" style:width="{size}px" style:height="{size}px">
    <ArtifactCategoryIcon {category} {size} />
    {#if combination}
      <Sparkle />
    {/if}
  </span>
{/if}

<style>
  .artifact {
    position: relative;
    flex: none;
    display: inline-grid;
  }
</style>
