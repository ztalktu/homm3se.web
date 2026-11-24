<script lang="ts">
  /**
   * Saving the "New" column of the Resources tab as a preset, or loading one into it, resource by
   * resource. The save gets the values only with "Apply changes".
   */
  import { presetsOf, savePreset, type Preset } from '../../../app/presets.svelte';
  import { session } from '../../../app/session.svelte';
  import { showToast } from '../../../app/toasts.svelte';
  import type { PlayerColor } from '../../../data/players';
  import { RESOURCES, RESOURCES_GOLD_FIRST, type Resource } from '../../../core/layouts';
  import type { ResourceAmounts } from '../../../core/resources';
  import { playerLabel } from '../../../i18n/game.svelte';
  import { t, type MessageKey } from '../../../i18n/index.svelte';
  import ResourceIcon from '../../components/ResourceIcon.svelte';
  import { formatDate, formatNumber } from '../../format';
  import { hint, valueRow } from './hints';
  import PresetDialog from './PresetDialog.svelte';
  import PresetValues from './PresetValues.svelte';

  interface Props {
    mode: 'save' | 'load';
    /** The "New" column. */
    amounts: ResourceAmounts;
    /** Whose treasury it is, when it is a player's. */
    owner: PlayerColor | undefined;
    onload: (amounts: Partial<ResourceAmounts>) => void;
    onclose: () => void;
  }

  let { mode, amounts, owner, onload, onclose }: Props = $props();

  let open = $state(true);
  $effect(() => {
    if (!open) {
      onclose();
    }
  });

  const presets = $derived(presetsOf('resources'));
  // svelte-ignore state_referenced_locally
  let name = $state(
    mode === 'save'
      ? t('preset.defaultName', {
          name: owner ? playerLabel(owner) : t('preset.resourcesName'),
          date: formatDate(Date.now()),
        })
      : (presetsOf('resources')[0]?.name ?? ''),
  );
  let checked: Record<Resource, boolean> = $state(
    Object.fromEntries(RESOURCES.map((resource) => [resource, true])) as Record<Resource, boolean>,
  );

  const preset: Preset<'resources'> | undefined = $derived(
    mode === 'load' ? presets.find((known) => known.name === name) : undefined,
  );
  const shown: Partial<ResourceAmounts> = $derived(preset?.data ?? amounts);
  const chosen = $derived(
    RESOURCES.filter((resource) => checked[resource] && shown[resource] !== undefined),
  );

  const rows = $derived(
    RESOURCES_GOLD_FIRST.map((resource) => {
      const label = t(`resource.${resource}` as MessageKey);
      const value = shown[resource];
      return {
        key: resource,
        label,
        value: value === undefined ? '—' : formatNumber(value),
        available: value !== undefined,
        hint:
          value === undefined
            ? undefined
            : hint(label, [
                {
                  rows: [
                    valueRow(
                      formatNumber(value),
                      preset ? formatNumber(amounts[resource]) : undefined,
                    ),
                  ],
                },
              ]),
      };
    }),
  );

  const canApply = $derived(
    (mode === 'save' ? name.trim() !== '' : preset !== undefined) && chosen.length > 0,
  );

  function apply(): void {
    const picked = Object.fromEntries(chosen.map((resource) => [resource, shown[resource]]));
    if (mode === 'save') {
      const presetName = name.trim();
      savePreset('resources', {
        name: presetName,
        savedAt: Date.now(),
        edition: session.edition,
        data: picked,
      });
      showToast(t('preset.saved', { name: presetName }), { kind: 'success' });
    } else {
      onload(picked);
    }
    open = false;
  }
</script>

<PresetDialog bind:open kind="resources" {mode} bind:name {canApply} onapply={apply}>
  <PresetValues
    legend={t(mode === 'save' ? 'preset.whatToSave' : 'preset.whatToLoad')}
    {rows}
    bind:checked
  >
    {#snippet icon(resource)}<ResourceIcon {resource} />{/snippet}
  </PresetValues>
</PresetDialog>
