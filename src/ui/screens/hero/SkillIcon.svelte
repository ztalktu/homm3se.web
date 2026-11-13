<script lang="ts">
  /**
   * Badge for a secondary skill, in the style of the spell purpose and artifact category ones.
   * Where one of those glyphs fits, it is reused in the skill's own colour; the colour tells
   * the kind of skill (adventure, combat, war machines, magic and so on).
   */
  import type { ArtifactCategory } from '../../../data/artifacts';
  import type { MagicSchool, SpellPurpose } from '../../../data/spells';
  import ArtifactCategoryIcon from './ArtifactCategoryIcon.svelte';
  import Badge from './Badge.svelte';
  import { SCHOOL_GLYPHS, fillBadge } from './schoolGlyphs';
  import { cannon, skull } from './SharedGlyphs.svelte';
  import SpellPurposeIcon from './SpellPurposeIcon.svelte';

  type OwnGlyph =
    | 'bow'
    | 'boot'
    | 'talk'
    | 'anchor'
    | 'catapult'
    | 'cannon'
    | 'eagle'
    | 'skull'
    | 'coins'
    | 'scroll'
    | 'orb';

  type Glyph =
    | { spell: SpellPurpose }
    | { artifact: ArtifactCategory }
    | { school: MagicSchool }
    | { own: OwnGlyph };

  const ADVENTURE = 'var(--color-spell-adventure)';
  const COMBAT = 'var(--color-spell-damage)';
  const DEFENSE = 'var(--color-spell-protection)';
  const MACHINES = 'var(--color-creature-war-machine)';
  const SPIRIT = 'var(--color-spell-healing)';
  const MAGIC = 'var(--color-artifact-magic)';

  /** By skill id, in save file order. */
  const SKILLS: readonly (readonly [Glyph, string])[] = [
    [{ spell: 'adventure' }, ADVENTURE], // Pathfinding: compass
    [{ own: 'bow' }, COMBAT], // Archery
    [{ own: 'boot' }, ADVENTURE], // Logistics
    [{ spell: 'control' }, ADVENTURE], // Scouting: eye
    [{ own: 'talk' }, ADVENTURE], // Diplomacy
    [{ own: 'anchor' }, ADVENTURE], // Navigation
    [{ artifact: 'troops' }, SPIRIT], // Leadership: banner
    [{ artifact: 'knowledge' }, MAGIC], // Wisdom: book
    [{ artifact: 'magic' }, MAGIC], // Mysticism: wand
    [{ artifact: 'luckMorale' }, SPIRIT], // Luck: clover
    [{ own: 'catapult' }, MACHINES], // Ballistics
    [{ own: 'eagle' }, MAGIC], // Eagle Eye
    [{ own: 'skull' }, 'var(--color-spell-weakening)'], // Necromancy
    [{ own: 'coins' }, 'var(--color-artifact-resources)'], // Estates
    [{ school: 'fire' }, 'var(--color-school-fire)'], // Fire Magic
    [{ school: 'air' }, 'var(--color-school-air)'], // Air Magic
    [{ school: 'water' }, 'var(--color-school-water)'], // Water Magic
    [{ school: 'earth' }, 'var(--color-school-earth)'], // Earth Magic
    [{ own: 'scroll' }, MAGIC], // Scholar
    [{ spell: 'battlefield' }, COMBAT], // Tactics
    [{ own: 'cannon' }, MACHINES], // Artillery
    [{ artifact: 'skills' }, 'var(--color-artifact-primary)'], // Learning: medal
    [{ spell: 'damage' }, COMBAT], // Offense: sword
    [{ spell: 'protection' }, DEFENSE], // Armorer: shield
    [{ own: 'orb' }, MAGIC], // Intelligence
    [{ artifact: 'spellPower' }, 'var(--color-artifact-spell-power)'], // Sorcery: lightning
    [{ artifact: 'immunity' }, 'var(--color-artifact-immunity)'], // Resistance
    [{ spell: 'healing' }, SPIRIT], // First Aid: cross
  ];

  interface Props {
    /** None draws an empty frame for a free slot. */
    skillId: number | null;
    size?: number | undefined;
  }

  let { skillId, size = 22 }: Props = $props();

  const entry = $derived(skillId === null ? undefined : SKILLS[skillId]);
</script>

{#if entry}
  {@const [glyph, color] = entry}
  {#if 'spell' in glyph}
    <SpellPurposeIcon purpose={glyph.spell} {size} {color} />
  {:else if 'artifact' in glyph}
    <ArtifactCategoryIcon category={glyph.artifact} {size} {color} />
  {:else}
    <Badge {color} {size}>
      {#if 'school' in glyph}
        {@const school = SCHOOL_GLYPHS[glyph.school]}
        <g transform={fillBadge(glyph.school)}>
          {#if school.stroke}
            <path
              d={school.d}
              fill="none"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linecap="round"
            />
          {:else}
            <path d={school.d} fill="currentColor" />
          {/if}
        </g>
      {:else if glyph.own === 'bow'}
        <path
          d="M8 2.5c7 3.5 7 15.5 0 19"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
        />
        <path d="M8 2.5v19" stroke="currentColor" stroke-width="1" />
        <path d="M2.5 12H18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        <path d="M22 12l-5-3v6z" fill="currentColor" />
        <path
          d="M3 12l-1.5-2.4M3 12l-1.5 2.4"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
        />
      {:else if glyph.own === 'boot'}
        <path d="M6 2h7.5v9.3l5.3 2.2c1.6.7 2.7 2.2 2.7 4V19.5H4v-2.6l2-.6z" fill="currentColor" />
        <path d="M3 21h19" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      {:else if glyph.own === 'talk'}
        <!-- Two speech bubbles -->
        <path
          d="M3 3h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H8.5L4.5 16.5V13H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
          fill="currentColor"
        />
        <path
          d="M17.5 8.5H21a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-1.5v3.5l-4-3.5H11a2 2 0 0 1-2-2v-1"
          fill="currentColor"
        />
        <path d="M16 11a2 2 0 0 1-2 2H8.5" fill="none" stroke-width="1.6" class="cut-stroke" />
      {:else if glyph.own === 'anchor'}
        <circle cx="12" cy="4.3" r="2.2" fill="none" stroke="currentColor" stroke-width="2" />
        <path
          d="M12 6.5V21M7.5 9.5h9"
          stroke="currentColor"
          stroke-width="2.4"
          stroke-linecap="round"
        />
        <path
          d="M4 14c0 4 3.6 7 8 7s8-3 8-7"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
        />
        <path d="M4 12l-2.2 3.4h4.4zM20 12l-2.2 3.4h4.4z" fill="currentColor" />
      {:else if glyph.own === 'catapult'}
        <path d="M2.5 17.5h19V20h-19zM7 17.5 11.5 11h2.5l-1 6.5" fill="currentColor" />
        <path
          d="M8.5 15.5 19 4.5"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
        />
        <circle cx="19.8" cy="4" r="2.4" fill="currentColor" />
        <circle cx="6" cy="20.5" r="1.9" fill="currentColor" />
        <circle cx="18" cy="20.5" r="1.9" fill="currentColor" />
      {:else if glyph.own === 'cannon'}
        {@render cannon()}
      {:else if glyph.own === 'eagle'}
        <path
          d="M3.5 21c0-7.5 4.2-13.6 11.4-14.8 3-.5 5.6.9 6.6 3.1l-3.6 1.6c-.3 1.6-1.5 2.6-3.1 2.6 0 3.2-2.2 6.3-5.3 7.5z"
          fill="currentColor"
        />
        <circle cx="15.6" cy="8.8" r="1.2" class="cut" />
      {:else if glyph.own === 'skull'}
        {@render skull()}
      {:else if glyph.own === 'coins'}
        <ellipse cx="12" cy="5.5" rx="7" ry="2.6" fill="currentColor" />
        <path
          d="M5 5.5v3.3c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V5.5zM5 10.5v3.3c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-3.3zM5 15.5v3.3c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-3.3z"
          fill="currentColor"
        />
        <path
          d="M5 5.5c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6M5 10.5c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6M5 15.5c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"
          fill="none"
          stroke-width="1.2"
          class="cut-stroke"
        />
      {:else if glyph.own === 'scroll'}
        <path
          d="M6 3h11a2.5 2.5 0 0 1 0 5h-1v11a2.5 2.5 0 0 1-2.5 2.5H5a2.5 2.5 0 0 1 0-5h1z"
          fill="currentColor"
        />
        <path
          d="M9 10h4.5M9 13h4.5M16 8h1"
          fill="none"
          stroke-width="1.4"
          stroke-linecap="round"
          class="cut-stroke"
        />
      {:else}
        <!-- Intelligence: crystal ball -->
        <circle cx="12" cy="10" r="7.2" fill="currentColor" />
        <path d="M6.5 21h11l-1.8-3.6H8.3z" fill="currentColor" />
        <path
          d="M8.3 9.2a4 4 0 0 1 3.2-3.4"
          fill="none"
          stroke-width="1.6"
          stroke-linecap="round"
          class="cut-stroke"
        />
      {/if}
    </Badge>
  {/if}
{:else}
  <Badge {size} />
{/if}
