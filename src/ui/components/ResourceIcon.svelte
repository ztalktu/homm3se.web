<script lang="ts">
  /**
   * A resource picture in a round frame with a gold rim, dark or light with the theme.
   * It stands next to the resource's name, so it stays hidden from screen readers.
   */
  import type { Resource } from '../../core/layouts';
  import {
    GRADIENTS,
    RESOURCE_ART,
    RESOURCE_GRADIENTS,
    RESOURCE_SHIFT,
    type Shape,
  } from './resourceArt';

  interface Props {
    resource: Resource;
    size?: number | undefined;
  }

  let { resource, size = 24 }: Props = $props();

  // Gradient ids must be unique on the page, and the same picture shows up several times.
  const id = $props.id();

  const paint = (shape: Shape): { fill?: string } =>
    shape.gradient ? { fill: `url(#${id}-${shape.gradient})` } : {};
</script>

<svg class="resource-icon" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
  <defs>
    <radialGradient id="{id}-medallion" cx="0.4" cy="0.35" r="0.75">
      <stop offset="0" style:stop-color="var(--color-resource-frame)" />
      <stop offset="1" style:stop-color="var(--color-resource-frame-edge)" />
    </radialGradient>
    {#each RESOURCE_GRADIENTS[resource] as name (name)}
      {@const stops = GRADIENTS[name]}
      <linearGradient id="{id}-{name}" x1="0" y1="0" x2="0.35" y2="1">
        {#each stops as color, index (index)}
          <stop offset={index / (stops.length - 1)} stop-color={color} />
        {/each}
      </linearGradient>
    {/each}
  </defs>
  <circle
    cx="16"
    cy="16"
    r="15"
    fill="url(#{id}-medallion)"
    style:stroke="var(--color-resource-frame-rim)"
    stroke-width="1.6"
  />
  <circle
    cx="16"
    cy="16"
    r="13.2"
    fill="none"
    style:stroke="var(--color-resource-frame-shine)"
    stroke-width="0.6"
  />
  <!-- The picture shrinks to fit inside the rim and moves to its middle. -->
  <g transform="translate(16 16) scale(0.74) translate(-16 {RESOURCE_SHIFT[resource] - 16})">
    {#each RESOURCE_ART[resource] as shape, index (index)}
      <svelte:element
        this={shape.tag}
        xmlns="http://www.w3.org/2000/svg"
        {...shape.attrs}
        {...paint(shape)}
      />
    {/each}
  </g>
</svg>

<style>
  .resource-icon {
    flex: none;
    display: block;
  }
</style>
