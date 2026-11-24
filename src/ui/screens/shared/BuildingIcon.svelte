<script lang="ts">
  /**
   * Badge for a town building by its sort: the hall, the fort, the guild and so on, a house with
   * its level for a dwelling (on the town's own colour), and the Grail with the sparkle of a
   * combination artifact.
   */
  import type { BuildingKind } from '../../../data/buildings';
  import type { Town } from '../../../data/creatures';
  import Badge from '../hero/Badge.svelte';
  import {
    anvil,
    dwelling,
    grail,
    horde,
    mageGuild,
    scales,
    ship,
    star,
    tavern,
    townHall,
    wall,
  } from '../hero/SharedGlyphs.svelte';
  import Sparkle from './Sparkle.svelte';

  interface Props {
    kind: BuildingKind;
    /** The faction, for the colour of its dwellings. */
    town: Town;
    level?: number | undefined;
    size?: number | undefined;
  }

  let { kind, town, level, size = 22 }: Props = $props();

  /** Dwellings take the colour of their town. */
  const COLORS: Record<Exclude<BuildingKind, 'dwelling'>, string> = {
    townHall: 'var(--color-artifact-primary)',
    fort: 'var(--color-spell-protection)',
    mageGuild: 'var(--color-artifact-magic)',
    tavern: 'var(--color-spell-adventure)',
    blacksmith: 'var(--color-spell-battlefield)',
    market: 'var(--color-artifact-resources)',
    shipyard: 'var(--color-town-cove)',
    special: 'var(--color-spell-special)',
    horde: 'var(--color-spell-summoning)',
    grail: 'var(--color-artifact-primary)',
  };

  const color = $derived(kind === 'dwelling' ? `var(--color-town-${town})` : COLORS[kind]);
</script>

<span class="building" style:width="{size}px" style:height="{size}px">
  <Badge {color} {size}>
    {#if kind === 'townHall'}
      {@render townHall()}
    {:else if kind === 'fort'}
      {@render wall()}
    {:else if kind === 'mageGuild'}
      {@render mageGuild()}
    {:else if kind === 'tavern'}
      {@render tavern()}
    {:else if kind === 'blacksmith'}
      {@render anvil()}
    {:else if kind === 'market'}
      {@render scales()}
    {:else if kind === 'shipyard'}
      {@render ship()}
    {:else if kind === 'horde'}
      {@render horde()}
    {:else if kind === 'grail'}
      {@render grail()}
    {:else if kind === 'dwelling'}
      {@render dwelling(level ?? 1)}
    {:else}
      {@render star()}
    {/if}
  </Badge>
  {#if kind === 'grail'}<Sparkle />{/if}
</span>

<style>
  .building {
    position: relative;
    flex: none;
    display: inline-grid;
  }
</style>
