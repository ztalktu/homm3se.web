<script lang="ts">
  /**
   * The Towns tab: the towns of the save, found in it by the shape of their records, with filters
   * on the left; the picked town's summary and its editor on the right.
   */
  import { session } from '../../app/session.svelte';
  import {
    filterTownsByFaction,
    filterTownsByOwner,
    heroesInTown,
    selectTown,
    selectedTown,
    townBuildingsData,
    townFaction,
    townFactionsInSave,
    townOwnersInSave,
    townsFullyStudied,
    townsInList,
    townsInSave,
    townTab,
  } from '../../app/towns.svelte';
  import { BUILDING } from '../../data/buildings';
  import { townBuildings } from '../../core/townBuildings';
  import { buildingName, editionName, playerLabel, townName } from '../../i18n/game.svelte';
  import { t } from '../../i18n/index.svelte';
  import { tooltip } from '../actions/tooltip';
  import Button from '../components/Button.svelte';
  import ChoicePicker from '../components/ChoicePicker.svelte';
  import Fieldset from '../components/Fieldset.svelte';
  import PlayerFlag from '../components/PlayerFlag.svelte';
  import TextField from '../components/TextField.svelte';
  import TownIcon from './hero/TownIcon.svelte';
  import EditorLayout from './shared/EditorLayout.svelte';
  import PickerRows from './shared/PickerRows.svelte';
  import SummaryPanel from './shared/SummaryPanel.svelte';
  import TroopList from './shared/TroopList.svelte';
  import WarningNote from './shared/WarningNote.svelte';
  import TownDialog from './TownDialog.svelte';
  import NotStudiedMark from './town/NotStudiedMark.svelte';

  let dialogOpen = $state(false);

  const all = $derived(townsInSave());
  const list = $derived(townsInList());
  const owners = $derived(townOwnersInSave());
  const factions = $derived(townFactionsInSave());
  const town = $derived(selectedTown());
  const faction = $derived(town ? townFaction(town) : undefined);
  const buildings = $derived(town ? townBuildingsData(town) : undefined);
  const built = $derived(town && buildings ? townBuildings(town, buildings) : new Set<number>());
  const heroes = $derived(town ? heroesInTown(town) : { garrison: [], visitors: [] });
  const studied = $derived(townsFullyStudied());

  /** The highest built building of a hall slot chain, or undefined. */
  function highest(chain: readonly number[]): number | undefined {
    return chain.filter((id) => built.has(id)).pop();
  }

  const hallLevel = $derived(
    highest([BUILDING.villageHall, BUILDING.townHall, BUILDING.cityHall, BUILDING.capitol]),
  );
  const fortLevel = $derived(highest([BUILDING.fort, BUILDING.citadel, BUILDING.castle]));
  const guildLevel = $derived([0, 1, 2, 3, 4].filter((level) => built.has(level)).length);

  type DwellingState = 'none' | 'plain' | 'upgraded';
  const dwellings: DwellingState[] = $derived(
    Array.from({ length: 7 }, (_, index) => {
      if (built.has(BUILDING.upgradedDwelling1 + index)) {
        return 'upgraded';
      }
      return built.has(BUILDING.dwelling1 + index) ? 'plain' : 'none';
    }),
  );

  const DWELLING_TEXT = {
    none: 'town.dwellingNone',
    plain: 'town.dwellingPlain',
    upgraded: 'town.dwellingUpgraded',
  } as const;
</script>

{#if all.length === 0}
  <p class="muted">{t('town.noTowns')}</p>
{:else}
  {#if !studied}
    <WarningNote text={t('town.notStudiedBanner', { game: editionName(session.edition) })} />
  {/if}
  <EditorLayout>
    <Fieldset legend={t('town.searchTitle')}>
      <div class="search">
        {#if owners.length > 1 || factions.length > 1}
          <PickerRows>
            {#if owners.length > 1}
              <ChoicePicker
                label={t('hero.playerFilter')}
                options={owners}
                selected={townTab.ownerFilter}
                optionLabel={(owner) => (owner ? playerLabel(owner) : t('town.neutral'))}
                onpick={filterTownsByOwner}
                round
                inlineLabel
              >
                {#snippet icon(color)}<PlayerFlag {color} size={14} />{/snippet}
              </ChoicePicker>
            {/if}
            {#if factions.length > 1}
              <ChoicePicker
                label={t('hero.townFilter')}
                options={factions}
                selected={townTab.factionFilter}
                optionLabel={townName}
                onpick={filterTownsByFaction}
                inlineLabel
              >
                {#snippet icon(group)}<TownIcon {group} size={18} />{/snippet}
              </ChoicePicker>
            {/if}
          </PickerRows>
        {/if}
        <TextField
          label={t('town.name')}
          bind:value={townTab.nameFilter}
          placeholder={t('town.namePlaceholder')}
        />
        {#if list.length > 0}
          <ul class="towns" role="listbox" aria-label={t('town.list')}>
            {#each list as item (item.position)}
              {@const itemFaction = townFaction(item)}
              <li role="option" aria-selected={item.position === town?.position}>
                <button type="button" onclick={() => selectTown(item.position)}>
                  <TownIcon group={itemFaction} size={18} />
                  <span class="name">
                    {item.name}
                    {#if !studied && item.position === town?.position}<NotStudiedMark />{/if}
                    <small>{itemFaction ? townName(itemFaction) : '?'}</small>
                  </span>
                  <PlayerFlag color={item.owner} />
                </button>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="muted">{t('town.nothingShown')}</p>
        {/if}
        <p class="note">{t('town.shown', { shown: list.length, total: all.length })}</p>
      </div>
    </Fieldset>

    {#if town}
      <SummaryPanel legend={t('town.summaryTitle')}>
        <dl>
          <dt>{t('town.player')}</dt>
          <dd class="with-icon">
            <PlayerFlag color={town.owner} />
            {#if town.owner}{playerLabel(town.owner)}{:else}<span class="muted"
                >{t('town.neutral')}</span
              >{/if}
          </dd>
          <dt>{t('town.town')}</dt>
          <dd class="with-icon">
            <TownIcon group={faction} size={18} />
            {town.name}
            {#if faction}<span class="muted">· {townName(faction)}</span>{/if}
            {#if !studied}<NotStudiedMark />{/if}
          </dd>
          {#if faction}
            <dt>{t('town.hall')}</dt>
            <dd>{hallLevel === undefined ? '' : buildingName(faction, hallLevel)}</dd>
            <dt>{t('town.fort')}</dt>
            <dd class:muted={fortLevel === undefined}>
              {fortLevel === undefined ? t('town.none') : buildingName(faction, fortLevel)}
            </dd>
            <dt>{t('town.guild')}</dt>
            <dd class:muted={guildLevel === 0}>
              {guildLevel === 0
                ? t('town.none')
                : t('town.guildLevel', { level: guildLevel, max: buildings?.guildMax ?? 5 })}
            </dd>
            <dt>{t('town.dwellings')}</dt>
            <dd>
              <span class="pips">
                {#each dwellings as state, index (index)}
                  <span
                    class="pip {state}"
                    use:tooltip={t('town.dwellingState', {
                      level: index + 1,
                      state: t(DWELLING_TEXT[state]),
                    })}>{index + 1}</span
                  >
                {/each}
              </span>
            </dd>
            <dt>{t('town.grail')}</dt>
            <dd class:muted={!built.has(BUILDING.grail)}>
              {built.has(BUILDING.grail) ? buildingName(faction, BUILDING.grail) : t('town.none')}
            </dd>
          {/if}
        </dl>
        <div>
          <h3>{t('town.garrison')}</h3>
          <TroopList troops={town.garrison} />
          <h3>{t('town.inTown')}</h3>
          <dl>
            <dt>{t('town.garrisonHero')}</dt>
            <dd class:muted={heroes.garrison.length === 0}>
              {heroes.garrison.join(', ') || t('town.none')}
            </dd>
            <dt>{t('town.visitor')}</dt>
            <dd class:muted={heroes.visitors.length === 0}>
              {heroes.visitors.join(', ') || t('town.none')}
            </dd>
          </dl>
        </div>
        {#snippet actions()}
          {#if town.owner === null}
            <span class="muted">{t('town.neutralNotEditable')}</span>
          {/if}
          <Button
            variant="primary"
            icon="town"
            hint={t('town.editHint')}
            disabled={town.owner === null || !buildings}
            onclick={() => (dialogOpen = true)}
          >
            {t('town.edit')}
          </Button>
        {/snippet}
      </SummaryPanel>
    {/if}
  </EditorLayout>

  {#if town && buildings && dialogOpen}
    <TownDialog bind:open={dialogOpen} original={town} {buildings} />
  {/if}
{/if}

<style>
  .muted {
    color: var(--color-text-muted);
  }

  .search {
    display: grid;
    gap: var(--space-3);
  }

  .towns {
    list-style: none;
    margin: 0;
    padding: var(--space-1);
    max-height: 330px;
    overflow-y: auto;
    border: 1px solid var(--color-field-border);
    border-radius: var(--radius-small);
    background: var(--color-field);
    color: var(--color-field-text);
  }

  .towns button {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-1) var(--space-2);
    border: 0;
    border-radius: var(--radius-small);
    background: none;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }

  .towns button:hover {
    background: var(--color-option-hover);
  }

  .towns [aria-selected='true'] button {
    background: var(--color-option-selected);
  }

  .name {
    line-height: 1.25;
  }

  .name small {
    display: block;
    font-size: 12px;
    color: var(--color-field-placeholder);
  }

  .note {
    margin: 0;
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .pips {
    display: inline-flex;
    gap: 3px;
  }

  .pip {
    display: grid;
    place-items: center;
    width: 18px;
    height: 18px;
    border: 1px dashed var(--color-frame-soft);
    border-radius: 4px;
    font-size: 11px;
    line-height: 1;
    color: var(--color-text-muted);
  }

  .pip.plain {
    border: 1px solid var(--color-frame);
    background: var(--color-unsaved-soft);
    color: var(--color-text);
  }

  .pip.upgraded {
    border: 1px solid var(--color-frame);
    background: var(--color-primary);
    color: var(--color-primary-text);
  }
</style>
