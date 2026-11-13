<script lang="ts">
  /** Coloured badge with a glyph for what a spell is for. */
  import type { SpellPurpose } from '../../../data/spells';
  import Badge from './Badge.svelte';

  interface Props {
    purpose: SpellPurpose;
    size?: number | undefined;
    /** The glyph in another colour, e.g. for a secondary skill. */
    color?: string | undefined;
  }

  let { purpose, size = 22, color }: Props = $props();
</script>

<Badge color={color ?? `var(--color-spell-${purpose})`} {size}>
  {#if purpose === 'damage'}
    <path
      d="M4 20L18 6"
      fill="none"
      stroke="currentColor"
      stroke-width="2.6"
      stroke-linecap="round"
    />
    <path d="M21 3l-1.6 8.2-6.6-6.6z" fill="currentColor" />
    <path
      d="M4 20l-1-4M4 20l4 1M6.5 17.5l-1-4M6.5 17.5l4 1"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
    />
  {:else if purpose === 'buff'}
    <path
      d="M5 13l7-7 7 7M5 19l7-7 7 7"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
      stroke-linejoin="round"
    />
  {:else if purpose === 'protection'}
    <path d="M12 2l8 3v6c0 5-3.4 9-8 11-4.6-2-8-6-8-11V5z" fill="currentColor" />
  {:else if purpose === 'weakening'}
    <path
      d="M5 5l7 7 7-7M5 11l7 7 7-7"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
      stroke-linejoin="round"
    />
  {:else if purpose === 'control'}
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" fill="currentColor" />
    <circle cx="12" cy="12" r="3.4" class="cut" />
  {:else if purpose === 'healing'}
    <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" fill="currentColor" />
  {:else if purpose === 'battlefield'}
    <path
      d="M2 5h9v4H2zM13 5h9v4h-9zM2 11h4v4H2zM8 11h8v4H8zM18 11h4v4h-4zM2 17h9v4H2zM13 17h9v4h-9z"
      fill="currentColor"
    />
  {:else if purpose === 'special'}
    <path d="M12 1l2.4 8.6L23 12l-8.6 2.4L12 23l-2.4-8.6L1 12l8.6-2.4z" fill="currentColor" />
  {:else if purpose === 'summoning'}
    <!-- Phoenix -->
    <g fill="currentColor">
      <path d="M11 10C8 9 5 6 2 3c1 3 1.5 4 3 5.5H3c1.5 1.5 3 2.5 4.5 3L6 12c2 1 4 1 5 1z" />
      <path d="M13 10c3-1 6-4 9-7-1 3-1.5 4-3 5.5h2c-1.5 1.5-3 2.5-4.5 3L18 12c-2 1-4 1-5 1z" />
      <path d="M12 7c1.6 0 2 2.5 1.6 5-.3 2-.8 3-1.6 4-.8-1-1.3-2-1.6-4C10 9.5 10.4 7 12 7z" />
      <circle cx="12" cy="5.2" r="1.7" />
      <path d="M13.4 4.8l1.8.6-1.8.6z" />
      <path
        d="M12 15c-1.5 2-3 4-3.5 7 1.5-1.5 2.3-2.5 2.8-3.5-.1 1.5.3 3 .7 4.5.4-1.5.8-3 .7-4.5.5 1 1.3 2 2.8 3.5-.5-3-2-5-3.5-7z"
      />
    </g>
  {:else}
    <!-- Adventure: compass -->
    <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2" />
    <path d="M12 4l2.5 8L12 20l-2.5-8z" fill="currentColor" />
  {/if}
</Badge>
