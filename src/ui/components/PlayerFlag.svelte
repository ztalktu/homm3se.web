<script lang="ts">
  /** A round flag in a player's color; nobody's (null) is an empty dashed circle. */
  import type { PlayerColor } from '../../data/players';

  interface Props {
    color: PlayerColor | null;
    size?: number | undefined;
  }

  let { color, size = 12 }: Props = $props();
</script>

<span
  class="flag"
  class:free={!color}
  style:width={`${size}px`}
  style:height={`${size}px`}
  style:background={color && `var(--color-player-${color})`}
></span>

<style>
  .flag {
    flex: none;
    border-radius: 50%;
    border: 1px solid var(--color-mark-outline);
  }

  .free {
    border: 1px dashed currentcolor;
  }
</style>
