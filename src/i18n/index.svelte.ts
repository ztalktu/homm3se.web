import { preferences, type Locale } from '../app/preferences.svelte';
import enMessages from './en/ui.json';
import ruMessages from './ru/ui.json';

/** English is the source dictionary: every other language must provide the same keys. */
export type MessageKey = keyof typeof enMessages;
type Messages = Record<MessageKey, string>;
type MessageParams = Record<string, string | number>;

export const dictionaries: Record<Locale, Messages> = {
  en: enMessages,
  ru: ruMessages satisfies Messages,
};

/** Replaces `{name}` placeholders with values from `params`; unknown placeholders stay as they are. */
export function formatMessage(template: string, params?: MessageParams): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = params[name];
    return value === undefined ? placeholder : String(value);
  });
}

export function translate(locale: Locale, key: MessageKey, params?: MessageParams): string {
  return formatMessage(dictionaries[locale][key], params);
}

/** Translates into the current interface language. Reactive inside Svelte templates. */
export function t(key: MessageKey, params?: MessageParams): string {
  return translate(preferences.locale, key, params);
}
