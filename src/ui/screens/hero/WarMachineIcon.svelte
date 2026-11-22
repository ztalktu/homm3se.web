<script lang="ts">
  /** A small coloured picture of a war machine: wood, iron and canvas, like the spell book one. */

  interface Props {
    /** Artifact id: 3 Catapult, 4 Ballista, 5 Ammo Cart, 6 First Aid Tent, 146 Cannon. */
    artifactId: number;
    size?: number | undefined;
  }

  let { artifactId, size = 24 }: Props = $props();
</script>

<svg class="machine" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
  <g stroke="#3a1d0b" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round">
    {#if artifactId === 4}
      <!-- Ballista: a big crossbow on a wheeled frame -->
      <path d="M4 33 41 26.5l1 4.2L5 37.5z" fill="#b5652b" />
      <path d="M24.5 30.5 27 21l3.2.6-1.8 9z" fill="#7a3f17" />
      <path d="M12 31.5 35 10l3.2 3.2-22.5 21z" fill="#c8793a" />
      <path d="M17 28.5 39.5 7.5" fill="none" stroke="#5a2e10" stroke-width="1.6" />
      <path d="M39 8 43 4.5 41.5 9.5z" fill="#d9dde0" />
      <path d="M22.5 6C33 5 42 12 44 23" fill="none" stroke-width="4.4" />
      <path d="M22.5 6C33 5 42 12 44 23" fill="none" stroke="#a7aeb5" stroke-width="2.4" />
      <path d="M22.5 6 29.5 18 44 23" fill="none" stroke="#efe6cf" stroke-width="0.9" />
      <circle cx="12" cy="38" r="6.5" fill="#7a3f17" />
      <circle cx="12" cy="38" r="2.2" fill="#c9ced3" />
      <circle cx="35.5" cy="33.5" r="6.5" fill="#7a3f17" />
      <circle cx="35.5" cy="33.5" r="2.2" fill="#c9ced3" />
    {:else if artifactId === 5}
      <!-- Ammo Cart: a cart with a keg and a sheaf of arrows -->
      <path
        d="M13 23 9 5M18.5 23 18 3.5M24 23l3-17"
        fill="none"
        stroke="#6b3a17"
        stroke-width="1.8"
      />
      <path
        d="M7.6 6.2 9 2.5l1.8 3.6zM16.6 4.5l1.3-3.8 1.6 3.8zM25.6 5.6 27.5 2l1 4z"
        fill="#d9dde0"
      />
      <path
        d="M10 14.5 8 12.5l2.6.2zM17.7 13.5l-1.7-2 2.5.4zM25.8 14l1.4-2.2.4 2.4z"
        fill="#efe6cf"
      />
      <rect x="28" y="10" width="11" height="14" rx="3" fill="#a8642c" />
      <path d="M28 14h11M28 20h11" fill="none" stroke="#6b6f74" stroke-width="1.6" />
      <path d="M4 22h37l-2.5 11H6.5z" fill="#c07a3c" />
      <path d="M5.5 27.5h34" fill="none" stroke="#7a3f17" />
      <path d="M40 27l6-4" fill="none" stroke="#7a3f17" stroke-width="2.4" />
      <circle cx="12" cy="37" r="7" fill="#7a3f17" />
      <path d="M12 30v14M5 37h14" fill="none" stroke="#c07a3c" stroke-width="1" />
      <circle cx="12" cy="37" r="2" fill="#c9ced3" />
      <circle cx="32" cy="37" r="7" fill="#7a3f17" />
      <path d="M32 30v14M25 37h14" fill="none" stroke="#c07a3c" stroke-width="1" />
      <circle cx="32" cy="37" r="2" fill="#c9ced3" />
    {:else if artifactId === 6}
      <!-- First Aid Tent: a healer's winged staff beside a canvas tent with a pennant -->
      <path d="M9 9v30" fill="none" stroke="#a87a1c" stroke-width="2.2" />
      <path
        d="M9 9C5 7 2 8.5 1.5 11 5 10.5 7 11.5 9 13 11 11.5 13 10.5 16.5 11 16 8.5 13 7 9 9z"
        fill="#e2b543"
      />
      <path
        d="M6.5 16c5 2 5 5 0 7s-5 5 0 7M11.5 16c-5 2-5 5 0 7s5 5 0 7"
        fill="none"
        stroke="#e2b543"
        stroke-width="1.4"
      />
      <circle cx="9" cy="7.5" r="1.8" fill="#e2b543" />
      <path d="M30 12V3.5" fill="none" stroke="#6b3a17" stroke-width="1.6" />
      <path d="M30.5 3.5h9l-2.8 2.4 2.8 2.4h-9z" fill="#c8402a" />
      <path d="M30 12 46 42H14z" fill="#e9dcb8" />
      <path d="M30 12 46 42H36z" fill="#cbb98d" />
      <path d="M30 26 34.5 42h-9z" fill="#6b4a26" />
    {:else if artifactId === 3}
      <!-- Catapult: a throwing arm with a bucket on a wheeled frame -->
      <path d="M27.5 31.5 29 21h3.5L32 31.5z" fill="#7a3f17" />
      <path d="M25.5 21h10.5v3.2H25.5z" fill="#a8642c" />
      <path d="M37 30 11 10" fill="none" stroke-width="5.4" />
      <path d="M37 30 11 10" fill="none" stroke="#c8793a" stroke-width="3.2" />
      <path d="M3.5 7.5C5 13 12 14 14.5 9.5z" fill="#a7aeb5" />
      <circle cx="8.5" cy="8" r="2.6" fill="#8a8f95" />
      <path d="M3 31h38v5H3z" fill="#b5652b" />
      <path d="M18 31v5M30 31v5" fill="none" stroke="#c9ced3" stroke-width="1.4" />
      <circle cx="11" cy="38.5" r="6" fill="#7a3f17" />
      <circle cx="11" cy="38.5" r="2" fill="#c9ced3" />
      <circle cx="34" cy="38.5" r="6" fill="#7a3f17" />
      <circle cx="34" cy="38.5" r="2" fill="#c9ced3" />
    {:else}
      <!-- Cannon: an iron barrel on a wooden carriage -->
      <path d="M8 31 33 25.5l3 6.5-25 7z" fill="#b5652b" />
      <path d="M5 26.5 38 11l3.6 6.6L8.6 33z" fill="#4f555c" />
      <path d="M6.5 28 38.6 13" fill="none" stroke="#8d949b" stroke-width="1.4" />
      <path d="M37.2 9.5 40 8.2l4.6 8.6-2.8 1.3z" fill="#3d4247" />
      <circle cx="5.5" cy="30" r="3" fill="#3d4247" />
      <circle cx="21" cy="36" r="8.5" fill="#7a3f17" />
      <path
        d="M21 27.5v17M12.5 36h17M15 30l12 12M27 30 15 42"
        fill="none"
        stroke="#c07a3c"
        stroke-width="1"
      />
      <circle cx="21" cy="36" r="8.5" fill="none" stroke="#6b6f74" stroke-width="1.6" />
      <circle cx="21" cy="36" r="2.4" fill="#c9ced3" />
    {/if}
  </g>
</svg>

<style>
  .machine {
    flex: none;
    overflow: visible;
  }
</style>
