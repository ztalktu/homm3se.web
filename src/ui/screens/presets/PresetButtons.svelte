<script lang="ts">
  /** "Save preset…" and "Load preset…" of an editor; loading waits for a preset of the kind. */
  import { presetsOf, type PresetKind } from '../../../app/presets.svelte';
  import { t } from '../../../i18n/index.svelte';
  import Button from '../../components/Button.svelte';

  interface Props {
    kind: PresetKind;
    onsave: () => void;
    onload: () => void;
  }

  let { kind, onsave, onload }: Props = $props();

  const none = $derived(presetsOf(kind).length === 0);
</script>

<Button icon="save" onclick={onsave}>{t('preset.saveOpen')}</Button>
<Button
  icon="open"
  disabled={none}
  hint={none ? t('preset.noPresets') : undefined}
  onclick={onload}
>
  {t('preset.loadOpen')}
</Button>
