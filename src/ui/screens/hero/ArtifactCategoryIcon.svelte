<script lang="ts">
  /** Coloured badge with a glyph for what an artifact mainly does, like the spell purpose ones. */
  import type { ArtifactCategory } from '../../../data/artifacts';
  import type { SpellPurpose } from '../../../data/spells';
  import Badge from './Badge.svelte';
  import SpellPurposeIcon from './SpellPurposeIcon.svelte';

  interface Props {
    category: ArtifactCategory;
    size?: number | undefined;
  }

  let { category, size = 22 }: Props = $props();

  /** Categories that mean the same as a spell purpose get the very same badge. */
  const SAME_AS_SPELL: Partial<Record<ArtifactCategory, SpellPurpose>> = {
    attack: 'damage',
    defense: 'protection',
    movement: 'adventure',
    special: 'special',
  };
  const purpose = $derived(SAME_AS_SPELL[category]);
  /** spellPower → --color-artifact-spell-power */
  const color = $derived(
    `var(--color-artifact-${category.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)})`,
  );
</script>

{#if purpose}
  <SpellPurposeIcon {purpose} {size} />
{:else}
  <Badge {color} {size}>
    {#if category === 'spellPower'}
      <!-- Lightning -->
      <path d="M14 1.5 4.5 13.5h6.2L9.5 22.5l10-12.5h-6.3z" fill="currentColor" />
    {:else if category === 'knowledge'}
      <!-- Open book -->
      <path
        d="M2 5.2c3.3-1.3 6.3-1 9 .9v14.4c-2.7-1.8-5.7-2.1-9-.9zM22 5.2c-3.3-1.3-6.3-1-9 .9v14.4c2.7-1.8 5.7-2.1 9-.9z"
        fill="currentColor"
      />
    {:else if category === 'primary'}
      <!-- Four diamonds: the four primary skills -->
      <path
        d="M7 2.4 11.2 6.6 7 10.8 2.8 6.6zM17 2.4l4.2 4.2-4.2 4.2-4.2-4.2zM7 13.2l4.2 4.2L7 21.6l-4.2-4.2zM17 13.2l4.2 4.2-4.2 4.2-4.2-4.2z"
        fill="currentColor"
      />
    {:else if category === 'luckMorale'}
      <!-- Clover -->
      <g fill="currentColor">
        <circle cx="12" cy="6.8" r="4" />
        <circle cx="17.2" cy="12" r="4" />
        <circle cx="12" cy="17.2" r="4" />
        <circle cx="6.8" cy="12" r="4" />
      </g>
      <circle cx="12" cy="12" r="1.6" class="cut" />
    {:else if category === 'skills'}
      <!-- Medal -->
      <path d="M6.5 2h4.2l2 6.2-3.6 1.6zM13.3 2h4.2l-2.6 7.8-3.4-1.6z" fill="currentColor" />
      <circle cx="12" cy="15.5" r="6.5" fill="currentColor" />
      <path
        d="M12 11.6l1.2 2.5 2.7.3-2 1.9.6 2.7-2.5-1.4-2.5 1.4.6-2.7-2-1.9 2.7-.3z"
        class="cut"
      />
    {:else if category === 'magic'}
      <!-- Wand -->
      <path
        d="M3.5 20.5 14 10"
        fill="none"
        stroke="currentColor"
        stroke-width="2.8"
        stroke-linecap="round"
      />
      <path
        d="M17.5 1.5l1.4 4.1 4.1 1.4-4.1 1.4-1.4 4.1-1.4-4.1L12 7l4.1-1.4z"
        fill="currentColor"
      />
    {:else if category === 'immunity'}
      <!-- Shield with a spell star -->
      <path d="M12 2l8 3v6c0 5-3.4 9-8 11-4.6-2-8-6-8-11V5z" fill="currentColor" />
      <path d="M12 6.5l1.3 3.7 3.7 1.3-3.7 1.3L12 16.5l-1.3-3.7L7 11.5l3.7-1.3z" class="cut" />
    {:else if category === 'troops'}
      <!-- Banner -->
      <path
        d="M5 2v20"
        fill="none"
        stroke="currentColor"
        stroke-width="2.4"
        stroke-linecap="round"
      />
      <path d="M6.2 3H20l-3.4 4.8L20 12.6H6.2z" fill="currentColor" />
    {:else}
      <!-- Resources: gem -->
      <path d="M7 3h10l5 6-10 13L2 9z" fill="currentColor" />
      <path
        d="M2.5 9h19M9.5 3.4 7.6 9 12 21l4.4-12-1.9-5.6"
        fill="none"
        stroke-width="1.3"
        class="cut-stroke"
      />
    {/if}
  </Badge>
{/if}

<style>
  .cut {
    fill: var(--badge);
  }

  .cut-stroke {
    stroke: var(--badge);
  }
</style>
