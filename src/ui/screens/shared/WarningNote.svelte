<script lang="ts">
  /** A warning in a line of its own: the sign and the text on the warning colour. */
  import Icon from '../../components/Icon.svelte';

  interface Props {
    text: string;
  }

  let { text }: Props = $props();
</script>

<p class="note" role="note">
  <Icon name="warning" />
  <span>{text}</span>
</p>

<style>
  .note {
    display: flex;
    gap: var(--space-2);
    align-items: flex-start;
    margin: 0 0 var(--space-3);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-small);
    background: var(--color-warning);
    color: var(--color-warning-text);
    font-size: 13px;
  }
</style>
