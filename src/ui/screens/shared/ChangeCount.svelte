<script lang="ts">
  /** "Learned 12 of 70 · +2 · −1": a count and how many items were added and removed. */
  interface Props {
    text: string;
    added: number;
    removed: number;
  }

  let { text, added, removed }: Props = $props();
</script>

<span class="count">
  {text}
  {#if added > 0}· <span class="added">+{added}</span>{/if}
  {#if removed > 0}· <span class="removed">−{removed}</span>{/if}
</span>

<style>
  .count {
    color: var(--color-text-muted);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
  }

  .added {
    color: var(--color-spell-added);
    font-weight: 600;
  }

  .removed {
    color: var(--color-spell-removed);
    font-weight: 600;
  }
</style>
