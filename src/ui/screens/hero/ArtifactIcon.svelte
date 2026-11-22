<script lang="ts">
  /**
   * The category badge of an artifact of the opened save. A combination artifact gets a gold
   * sparkle in the top left corner, so it stands out in lists and on the hero.
   */
  import { session } from '../../../app/session.svelte';
  import { artifactById } from '../../../data/artifacts';
  import { combinationLocks } from '../../../data/equipment';
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
      <svg class="sparkle" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 1.5c.9 5.4 2.1 6.7 7.5 7.5-5.4.9-6.6 2.1-7.5 7.5-.9-5.4-2.1-6.6-7.5-7.5 5.4-.8 6.6-2.1 7.5-7.5z"
          transform="translate(0 2.5)"
        />
        <path
          d="M19.5 15.5c.4 2.2.9 2.7 3 3-2.1.4-2.6.9-3 3-.4-2.1-.9-2.6-3-3 2.1-.3 2.6-.8 3-3z"
        />
      </svg>
    {/if}
  </span>
{/if}

<style>
  .artifact {
    position: relative;
    flex: none;
    display: inline-grid;
  }

  .sparkle {
    position: absolute;
    top: -34%;
    left: -34%;
    width: 74%;
    height: 74%;
    fill: #f3d678;
    stroke: #5a3a08;
    stroke-width: 1.2;
    stroke-linejoin: round;
    filter: drop-shadow(0 0 1.5px rgb(0 0 0 / 60%));
    pointer-events: none;
  }
</style>
