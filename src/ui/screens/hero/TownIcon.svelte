<script lang="ts">
  /**
   * Badge for a creature's town, on the colour that rules that town's screen in the game.
   * The glyph is the town's own sign, mostly its mightiest creature; creatures without a
   * town (neutrals, war machines, In the Wake of Gods ones) get a sign for their kind.
   */
  import type { CreatureGroup } from '../../../data/creatures';
  import Badge from './Badge.svelte';
  import { cannon, skull } from './SharedGlyphs.svelte';
  import SpellPurposeIcon from './SpellPurposeIcon.svelte';

  interface Props {
    /** None draws an empty frame for a free slot. */
    group: CreatureGroup | undefined;
    size?: number | undefined;
  }

  let { group, size = 22 }: Props = $props();
</script>

{#if !group}
  <Badge {size} />
{:else if group === 'necropolis'}
  <Badge color="var(--color-town-necropolis)" {size}>{@render skull()}</Badge>
{:else if group === 'warMachine'}
  <Badge color="var(--color-creature-war-machine)" {size}>{@render cannon()}</Badge>
{:else if group === 'conflux'}
  <SpellPurposeIcon purpose="summoning" {size} color="var(--color-town-conflux)" />
{:else if group === 'special'}
  <SpellPurposeIcon purpose="special" {size} />
{:else}
  <Badge color="var(--color-town-{group})" {size}>
    {#if group === 'castle'}
      <!-- Wall with a gate -->
      <path
        d="M2.5 21V9h3V5.5h2.6V9h2.6V5.5h2.6V9h2.6V5.5h2.6V9h3v12h-7v-4.5a2.5 2.5 0 0 0-5 0V21z"
        fill="currentColor"
      />
    {:else if group === 'rampart'}
      <!-- Walking tree: a crown, branch arms, a face in the trunk, root legs -->
      <g fill="currentColor">
        <circle cx="12" cy="5.4" r="4.2" />
        <circle cx="7.6" cy="8" r="3.2" />
        <circle cx="16.4" cy="8" r="3.2" />
        <path d="M8.8 9.5h6.4l.4 7.3 2.4 5.2h-3.2l-1.6-3.8h-2.4L9.2 22H6l2.4-5.2z" />
      </g>
      <path
        d="M9 12.4 4.6 10l-.8-2.4M15 12.4l4.4-2.4.8-2.4"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle cx="10.8" cy="12.2" r=".75" class="cut" />
      <circle cx="13.2" cy="12.2" r=".75" class="cut" />
      <path d="M10.9 14.8h2.2" stroke-width="1" stroke-linecap="round" class="cut-stroke" />
    {:else if group === 'tower'}
      <!-- Wizard's tower -->
      <path d="M12 1 6.5 9h2V22h7V9h2z" fill="currentColor" />
      <circle cx="12" cy="13" r="1.6" class="cut" />
      <path d="M10.8 22v-3.2a1.2 1.2 0 0 1 2.4 0V22" class="cut" />
    {:else if group === 'inferno'}
      <!-- Hellhound, face on: pointed ears, long muzzle, slanted eyes -->
      <path
        d="M12 4.6 9.2 6.2 6.2 1.4 4.8 8.6c-.5 1.4-.2 3 .8 4.2l3 3.4.9 4.4c.5 1.2 1.4 1.9 2.5 1.9s2-.7 2.5-1.9l.9-4.4 3-3.4c1-1.2 1.3-2.8.8-4.2L17.8 1.4l-3 4.8z"
        fill="currentColor"
      />
      <path
        d="M7 4.4 6.6 7.6 8 6.4zM17 4.4l.4 3.2L16 6.4zM8 9.8l2.6 1-.5 1.3-2-.7zM16 9.8l-2.6 1 .5 1.3 2-.7zM10.5 17.4h3l-1.5 1.5z"
        class="cut"
      />
    {:else if group === 'dungeon'}
      <!-- Minotaur: bull's head, horns up, a ring in the nose -->
      <path
        d="M12 7c-3 0-5 2-5 5 0 2 .8 3.4 1.6 4.6.5 2.6 1.5 5.4 3.4 5.4s2.9-2.8 3.4-5.4c.8-1.2 1.6-2.6 1.6-4.6 0-3-2-5-5-5z"
        fill="currentColor"
      />
      <path
        d="M7.5 9C4 8.5 2 5.5 2.5 2c1 2.5 3 4 5.8 4.5zM16.5 9c3.5-.5 5.5-3.5 5-7-1 2.5-3 4-5.8 4.5zM7 10.5l-3.5 1 3.8 1.2zM17 10.5l3.5 1-3.8 1.2z"
        fill="currentColor"
      />
      <circle cx="9.8" cy="11.6" r=".9" class="cut" />
      <circle cx="14.2" cy="11.6" r=".9" class="cut" />
      <circle cx="10.9" cy="18.6" r=".6" class="cut" />
      <circle cx="13.1" cy="18.6" r=".6" class="cut" />
      <circle cx="12" cy="20.3" r="1.3" fill="none" stroke-width="1" class="cut-stroke" />
    {:else if group === 'stronghold'}
      <!-- Cyclops, face on: one big eye -->
      <path
        d="M12 3c-4.4 0-7.5 3.4-7.5 8 0 3.2 1.2 5.8 3.2 7.6.9 2.2 2.3 3.4 4.3 3.4s3.4-1.2 4.3-3.4c2-1.8 3.2-4.4 3.2-7.6 0-4.6-3.1-8-7.5-8zM4.8 10.4l-2.4-.9.6 4 2.2.6zM19.2 10.4l2.4-.9-.6 4-2.2.6z"
        fill="currentColor"
      />
      <circle cx="12" cy="10.6" r="3.3" class="cut" />
      <circle cx="12" cy="10.8" r="1.5" fill="currentColor" />
    {:else if group === 'fortress'}
      <!-- Winged swamp serpent, one wing showing -->
      <path
        d="M7.4 11.6 .6 2.8l.8 4.8-1.2.6 2.6 2.4-.8 1.6 2.8.6-.2 1.4 4-.9z"
        fill="currentColor"
      />
      <path
        d="M5 21.5c4.5 0 7-2 7-5.2S5 13 5 9s3.3-6.5 7.5-6.5c2.7 0 4.8 1.2 6 3"
        fill="none"
        stroke="currentColor"
        stroke-width="3.2"
        stroke-linecap="round"
      />
      <circle cx="19.2" cy="6" r="2.6" fill="currentColor" />
      <circle cx="19.8" cy="5.4" r=".8" class="cut" />
    {:else}
      <!-- Neutral: paw print -->
      <g fill="currentColor">
        <ellipse cx="12" cy="16.5" rx="5.5" ry="4.8" />
        <ellipse cx="5" cy="10" rx="2.2" ry="2.8" />
        <ellipse cx="9.3" cy="5.6" rx="2.2" ry="2.9" />
        <ellipse cx="14.7" cy="5.6" rx="2.2" ry="2.9" />
        <ellipse cx="19" cy="10" rx="2.2" ry="2.8" />
      </g>
    {/if}
  </Badge>
{/if}
