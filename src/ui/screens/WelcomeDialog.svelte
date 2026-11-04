<script lang="ts">
  /**
   * First-launch greeting with the fair-play warning. It closes only through the agree
   * button, and the agreement is remembered so the greeting shows once.
   */
  import { preferences, setLocale } from '../../app/preferences.svelte';
  import { APP_VERSION } from '../../app/version';
  import { t } from '../../i18n/index.svelte';
  import Button from '../components/Button.svelte';
  import Dialog from '../components/Dialog.svelte';
  import SelectField from '../components/SelectField.svelte';
  import { languageOptions } from '../format';

  interface Props {
    open: boolean;
    onagree: () => void;
  }

  let { open = $bindable(), onagree }: Props = $props();
</script>

<Dialog bind:open title={t('welcome.title', { version: APP_VERSION })} dismissible={false}>
  <div class="text">
    <p class="greeting">{t('welcome.greeting')}</p>
    <p>{t('welcome.warning')}</p>
    <p>{t('welcome.reminder')}</p>
    <p class="closing">{t('welcome.closing')}</p>
  </div>

  {#snippet footer()}
    <!-- The modal makes the header unreachable, so the language switch comes along. -->
    <div class="language">
      <SelectField
        label={t('toolbar.language')}
        hideLabel
        value={preferences.locale}
        options={languageOptions()}
        onchange={setLocale}
      />
    </div>
    <Button variant="primary" autofocus onclick={onagree}>{t('welcome.agree')}</Button>
  {/snippet}
</Dialog>

<style>
  .text {
    display: grid;
    gap: var(--space-3);
  }

  p {
    margin: 0;
  }

  .language {
    margin-right: auto;
  }

  .greeting,
  .closing {
    font-family: var(--font-heading);
    font-size: 17px;
    color: var(--color-heading);
  }
</style>
