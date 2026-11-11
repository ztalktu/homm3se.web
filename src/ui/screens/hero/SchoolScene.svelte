<script lang="ts">
  /** Muted painted header of a school column: sky, flames, waves or rocks. */
  import type { MagicSchool } from '../../../data/spells';

  interface Props {
    school: MagicSchool;
  }

  let { school }: Props = $props();
</script>

<svg class="scene" viewBox="0 0 300 92" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  {#if school === 'air'}
    <defs>
      <linearGradient id="scene-air-sa" x1="0" y1="0" x2="0" y2="1"
        ><stop offset="0" stop-color="#16407e" /><stop offset=".6" stop-color="#3d7fc4" /><stop
          offset="1"
          stop-color="#9cc8ea"
        /></linearGradient
      >
      <radialGradient id="scene-air-ca" cx=".45" cy=".35" r=".7"
        ><stop offset="0" stop-color="#ffffff" /><stop offset=".7" stop-color="#e3eef8" /><stop
          offset="1"
          stop-color="#a9c3dc"
        /></radialGradient
      >
      <radialGradient id="scene-air-sun" cx=".8" cy=".15" r=".35"
        ><stop offset="0" stop-color="#fff6d0" stop-opacity=".9" /><stop
          offset="1"
          stop-color="#fff6d0"
          stop-opacity="0"
        /></radialGradient
      >
    </defs>
    <rect width="300" height="92" fill="url(#scene-air-sa)" /><rect
      width="300"
      height="92"
      fill="url(#scene-air-sun)"
    />
    <g fill="url(#scene-air-ca)">
      <circle cx="30" cy="70" r="22" /><circle cx="62" cy="58" r="26" /><circle
        cx="98"
        cy="70"
        r="20"
      /><rect x="20" y="70" width="95" height="30" />
      <circle cx="190" cy="78" r="18" /><circle cx="222" cy="64" r="24" /><circle
        cx="256"
        cy="72"
        r="20"
      /><circle cx="285" cy="80" r="16" /><rect x="180" y="78" width="120" height="30" />
      <circle cx="140" cy="28" r="10" opacity=".8" /><circle
        cx="155"
        cy="22"
        r="13"
        opacity=".8"
      /><circle cx="172" cy="28" r="9" opacity=".8" />
    </g>
    <g fill="none" stroke="#e8f3ff" stroke-width="2" stroke-linecap="round" opacity=".75">
      <path d="M118 48c18 0 26-10 18-16s-16 4-8 8" /><path d="M128 58h40c10 0 14-8 6-10" /><path
        d="M20 22h46c8 0 10-7 4-8"
      />
    </g>
  {:else if school === 'fire'}
    <defs>
      <linearGradient id="scene-fire-sf" x1="0" y1="0" x2="0" y2="1"
        ><stop offset="0" stop-color="#2a0603" /><stop offset=".55" stop-color="#7a1608" /><stop
          offset="1"
          stop-color="#d4460f"
        /></linearGradient
      >
      <linearGradient id="scene-fire-f1" x1="0" y1="1" x2="0" y2="0"
        ><stop offset="0" stop-color="#ff8a1c" /><stop
          offset="1"
          stop-color="#c3260b"
        /></linearGradient
      >
      <linearGradient id="scene-fire-f2" x1="0" y1="1" x2="0" y2="0"
        ><stop offset="0" stop-color="#ffe680" /><stop
          offset="1"
          stop-color="#ff9a20"
        /></linearGradient
      >
    </defs>
    <rect width="300" height="92" fill="url(#scene-fire-sf)" />
    <path
      fill="url(#scene-fire-f1)"
      d="M0 92V60c12 6 14-20 26-34 2 18 14 22 18 38 6-14 4-30 16-44 4 22 18 30 20 50 8-12 6-26 18-36 2 20 16 24 18 42 6-16 10-30 24-40-2 22 12 30 12 48 8-10 10-24 22-30 0 18 12 24 12 38 6-12 8-24 20-30 0 16 10 22 10 34 8-8 12-20 24-24 0 14 10 18 10 28 6-6 10-14 20-18V92z"
    />
    <path
      fill="url(#scene-fire-f2)"
      d="M0 92V78c10 2 12-14 22-22 2 12 10 16 12 26 6-8 6-18 14-26 2 14 12 18 12 30 6-8 6-16 14-22 2 12 10 14 12 24 4-10 8-18 16-24 0 14 8 18 8 30 6-8 8-14 16-18 0 12 8 14 8 24 4-6 8-14 14-18 0 10 8 12 8 22 4-6 8-12 14-14 0 10 6 12 6 20 6-4 8-10 14-12 0 10 6 12 6 18 6-4 10-8 16-10V92z"
    />
    <g fill="#ffd27a"
      ><circle cx="40" cy="20" r="1.6" /><circle cx="96" cy="12" r="1.2" /><circle
        cx="150"
        cy="24"
        r="1.8"
      /><circle cx="205" cy="10" r="1.3" /><circle cx="262" cy="22" r="1.6" /><circle
        cx="120"
        cy="36"
        r="1"
      /><circle cx="235" cy="38" r="1.1" /></g
    >
  {:else if school === 'water'}
    <defs>
      <linearGradient id="scene-water-sw" x1="0" y1="0" x2="0" y2="1"
        ><stop offset="0" stop-color="#5ea9c9" /><stop offset=".35" stop-color="#1d6f93" /><stop
          offset="1"
          stop-color="#062c4a"
        /></linearGradient
      >
      <linearGradient id="scene-water-w1" x1="0" y1="0" x2="0" y2="1"
        ><stop offset="0" stop-color="#2f8fb0" /><stop
          offset="1"
          stop-color="#0b3f62"
        /></linearGradient
      >
      <linearGradient id="scene-water-w2" x1="0" y1="0" x2="0" y2="1"
        ><stop offset="0" stop-color="#1f7898" /><stop
          offset="1"
          stop-color="#05253f"
        /></linearGradient
      >
    </defs>
    <rect width="300" height="92" fill="url(#scene-water-sw)" />
    <path
      fill="url(#scene-water-w1)"
      d="M0 40c25-10 40 8 62 0s30-16 52-6 34 10 56 0 34-12 56-2 40 8 74-2V92H0z"
    />
    <path
      fill="none"
      stroke="#bfe9f5"
      stroke-width="2"
      opacity=".8"
      d="M0 40c25-10 40 8 62 0s30-16 52-6 34 10 56 0 34-12 56-2 40 8 74-2"
    />
    <path
      fill="url(#scene-water-w2)"
      d="M0 62c20-14 36-4 50 4 16-16 30-20 46-8 10 8 22 10 30 0 14-16 34-14 48 0 10 10 26 8 34-2 14-14 32-12 44 2 10 10 24 8 48-4V92H0z"
    />
    <path
      fill="none"
      stroke="#e6f8ff"
      stroke-width="2.2"
      stroke-linecap="round"
      d="M0 62c20-14 36-4 50 4 16-16 30-20 46-8 10 8 22 10 30 0 14-16 34-14 48 0 10 10 26 8 34-2 14-14 32-12 44 2 10 10 24 8 48-4"
    />
    <g fill="#e6f8ff"
      ><path d="M86 52c4-6 10-6 12-2-4-1-8 0-12 2z" /><path
        d="M164 50c4-6 10-6 12-2-4-1-8 0-12 2z"
      /><path d="M240 52c4-6 10-6 12-2-4-1-8 0-12 2z" /></g
    >
    <g fill="none" stroke="#7fc4dc" stroke-width="1.4" opacity=".7"
      ><path d="M20 80c10-4 18-4 26 0" /><path d="M120 84c10-4 18-4 26 0" /><path
        d="M210 80c10-4 18-4 26 0"
      /></g
    >
  {:else if school === 'earth'}
    <defs>
      <linearGradient id="scene-earth-se" x1="0" y1="0" x2="0" y2="1"
        ><stop offset="0" stop-color="#c79a52" /><stop offset=".55" stop-color="#e6c27c" /><stop
          offset="1"
          stop-color="#a77a3a"
        /></linearGradient
      >
      <linearGradient id="scene-earth-m1" x1="0" y1="0" x2="0" y2="1"
        ><stop offset="0" stop-color="#8a6a44" /><stop
          offset="1"
          stop-color="#5a4128"
        /></linearGradient
      >
      <linearGradient id="scene-earth-m2" x1="0" y1="0" x2="0" y2="1"
        ><stop offset="0" stop-color="#6e4e2c" /><stop
          offset="1"
          stop-color="#3a2614"
        /></linearGradient
      >
      <linearGradient id="scene-earth-gr" x1="0" y1="0" x2="0" y2="1"
        ><stop offset="0" stop-color="#6f8a2c" /><stop
          offset="1"
          stop-color="#3e5418"
        /></linearGradient
      >
    </defs>
    <rect width="300" height="92" fill="url(#scene-earth-se)" />
    <path
      fill="url(#scene-earth-m1)"
      d="M0 60l30-28 18 14 32-34 30 30 20-14 40 36 26-20 34 22 30-30 40 34V92H0z"
    />
    <path
      fill="#c8a978"
      opacity=".55"
      d="M80 12l-10 20 12-6 6 10 4-6 18 18-30-36zM250 30l-10 14 10-4 6 8 4-4 4 4z"
    />
    <path
      fill="url(#scene-earth-m2)"
      d="M0 74l22-16 20 10 26-22 24 18 30-12 28 22 26-16 30 18 22-14 30 16 22-10 20 8V92H0z"
    />
    <path fill="url(#scene-earth-gr)" d="M0 84c30-6 60 4 90-2s60-6 90 0 70 4 120-4V92H0z" />
    <g stroke="#2e1d0e" stroke-width="1.2" fill="none" opacity=".6"
      ><path d="M60 50l6 8-4 6" /><path d="M180 58l-5 8 6 6" /><path d="M118 42l4 10" /></g
    >
    <g fill="#9a7a50"
      ><ellipse cx="40" cy="86" rx="7" ry="4" /><ellipse cx="150" cy="88" rx="9" ry="4" /><ellipse
        cx="248"
        cy="86"
        rx="6"
        ry="3.5"
      /></g
    >
  {/if}
</svg>

<style>
  .scene {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    filter: saturate(0.5) sepia(0.35) brightness(0.72) contrast(0.92);
  }
</style>
