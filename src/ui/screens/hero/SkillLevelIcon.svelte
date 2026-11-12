<script lang="ts">
  /** Badge for a skill level, like sergeant's stripes: one chevron basic, two advanced, three expert. */
  import type { SkillLevel } from '../../../data/skills';
  import Badge from './Badge.svelte';

  interface Props {
    /** None draws an empty frame, for a slot without a skill. */
    level: SkillLevel | null;
    size?: number | undefined;
  }

  let { level, size = 22 }: Props = $props();

  /** Top of each chevron, centred as a group in the 24×24 box. */
  const TOPS: Record<SkillLevel, number[]> = { 1: [10], 2: [7, 13], 3: [4.5, 10, 15.5] };
</script>

{#if level === null}
  <Badge {size} />
{:else}
  <Badge color="var(--color-skill-level)" {size}>
    {#each TOPS[level] as top (top)}
      <path
        d="M5 {top + 4.5}L12 {top}l7 {4.5}"
        fill="none"
        stroke="currentColor"
        stroke-width="2.6"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    {/each}
  </Badge>
{/if}
