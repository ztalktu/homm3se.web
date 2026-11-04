/** Whether the user has already agreed to the first-launch fair-play warning. */

import { readJson, writeJson } from '../storage/localStore';

const KEY = 'welcome';

interface WelcomeState {
  version: 1;
  agreed: boolean;
}

function isWelcomeState(value: unknown): value is WelcomeState {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Record<string, unknown>)['version'] === 1 &&
    typeof (value as Record<string, unknown>)['agreed'] === 'boolean'
  );
}

export function hasAgreedToWelcome(): boolean {
  return readJson(KEY, { version: 1, agreed: false }, isWelcomeState).agreed;
}

export function agreeToWelcome(): void {
  writeJson(KEY, { version: 1, agreed: true } satisfies WelcomeState);
}
