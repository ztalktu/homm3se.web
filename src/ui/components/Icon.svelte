<script lang="ts">
  import { ICONS, type IconName } from './icons';

  interface Props {
    name: IconName;
    size?: number | undefined;
    /** Set only when the icon carries meaning on its own; decorative icons stay hidden. */
    label?: string | undefined;
  }

  let { name, size = 18, label }: Props = $props();
</script>

<svg
  class="icon"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.8"
  stroke-linecap="round"
  stroke-linejoin="round"
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
>
  <path d={ICONS[name]} />
</svg>

<style>
  .icon {
    flex: none;
    display: block;
  }
</style>
