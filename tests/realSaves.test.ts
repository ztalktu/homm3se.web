/**
 * Smoke test on real saves from the local saves/ folder (not in the repository: the files
 * belong to other people). Skipped when the folder is missing.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { requiredEdition } from '../src/core/editionDetection';
import { readHero, writeHero } from '../src/core/hero';
import { findHero, findHeroNames, findNextHero } from '../src/core/heroSearch';
import { decompressGzip } from '../src/core/gzip';
import { SaveBuffer } from '../src/core/saveBuffer';
import { SaveGame } from '../src/core/saveGame';
import { isEditingTested } from '../src/core/saveFormat';
import { layoutFor } from '../src/core/layouts';
import { EDITIONS, type Edition } from '../src/data/editions';
import { KNOWN_HERO_NAMES } from '../src/data/heroNames';
import { SPELLS } from '../src/data/spells';

const SAVES_DIR = join(__dirname, '..', 'saves');

function saveFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return saveFiles(path);
    }
    return /\.(cgm|gm\d)$/i.test(name) ? [path] : [];
  });
}

const files = existsSync(SAVES_DIR) ? saveFiles(SAVES_DIR) : [];
const names = KNOWN_HERO_NAMES;

describe.skipIf(files.length === 0)('real saves', () => {
  it.each(files.map((file) => [relative(SAVES_DIR, file), file]))(
    '%s',
    async (_label, file) => {
      const packed = new Uint8Array(readFileSync(file));
      const save = await SaveGame.open(file, packed);
      const unpacked = await decompressGzip(packed);
      expect(unpacked.length).toBeGreaterThan(1000);

      const header = String.fromCharCode(...unpacked.subarray(0, 5));
      const view = new DataView(unpacked.buffer, unpacked.byteOffset);
      const version = [view.getUint32(8, true), view.getUint32(12, true)];

      // The header picks the layout: HD Edition its own, The Shadow of Death the newer one.
      const expectedLayout = file.includes(`${SAVES_DIR}/H2HD/`)
        ? 'hdEdition'
        : file.includes(`${SAVES_DIR}/SoD/`)
          ? 'shadowOfDeath'
          : null;
      if (expectedLayout) {
        expect(layoutFor(save.format, 'restorationOfErathia').id).toBe(expectedLayout);
      }

      // Every known hero name that the search accepts as a hero record.
      const buffer = save.buffer;
      const found: string[] = [];
      const foundNames = new Set<string>();
      let edition: Edition = 'shadowOfDeath';
      for (const name of names) {
        let match = findHero(buffer, name);
        let guard = 0;
        while (match && guard < 20) {
          const hero = readHero(
            buffer,
            match.position,
            layoutFor(save.format, edition).hero,
            match.codePage,
          );
          const needed = requiredEdition(hero, edition);
          if (needed) {
            edition = needed;
          }
          foundNames.add(name);
          found.push(
            `${name}@${match.position}: lvl ${hero.level} exp ${hero.experience} ` +
              `${hero.attack}/${hero.defense}/${hero.spellPower}/${hero.knowledge} ` +
              `troops ${hero.troops.filter(Boolean).length} skills ${hero.secondarySkills.length} ` +
              `spells ${hero.spells.length} bag ${hero.backpack.length}`,
          );
          match = findNextHero(buffer, name, match);
          guard += 1;
        }
      }

      // The one-pass name list agrees with searching every name on its own (the loop above).
      expect([...findHeroNames(buffer, names).keys()].sort()).toEqual([...foundNames].sort());

      // Other/ holds service files (for example the list of completed campaigns) without heroes.
      if (!file.includes(`${SAVES_DIR}/Other/`)) {
        expect(found.length, 'heroes found').toBeGreaterThan(0);
      }

      // Writing every hero back unchanged must not change a single byte (supported formats).
      const first = names.map((name) => findHero(buffer, name)).find(Boolean);
      if (first && isEditingTested(save.format)) {
        const copy = new SaveBuffer(buffer.bytes.slice());
        const layout = layoutFor(save.format, edition).hero;
        for (const name of names) {
          let match = findHero(buffer, name);
          while (match) {
            const hero = readHero(copy, match.position, layout, match.codePage);
            writeHero(copy, match.position, layout, match.codePage, hero);
            match = findNextHero(buffer, name, match);
          }
        }
        const changed = copy.bytes.findIndex((byte, index) => byte !== buffer.bytes[index]);
        expect(changed, 'first changed byte after rewriting every hero unchanged').toBe(-1);

        // Real edits, applied twice like two "Apply" clicks, survive packing and reopening and
        // touch only the edited bytes. The bytes as opened stay as they were throughout.
        const hero = readHero(buffer, first.position, layout, first.codePage);
        const firstEdit = {
          ...hero,
          attack: hero.attack === 99 ? 98 : 99,
          experience: hero.experience + 1000,
        };
        save.edit((target) => writeHero(target, first.position, layout, first.codePage, firstEdit));
        // Second edit: learn one spell the hero lacks and forget one it knows.
        const missing = SPELLS.find((spell) => !hero.spells.includes(spell.id))!.id;
        const forgotten = hero.spells[0];
        const edited = {
          ...firstEdit,
          spells: [...firstEdit.spells.filter((id) => id !== forgotten), missing].sort(
            (a, b) => a - b,
          ),
        };
        save.edit((target) => writeHero(target, first.position, layout, first.codePage, edited));
        expect(readHero(save.originalBuffer, first.position, layout, first.codePage)).toEqual(hero);

        const editCount = save.editCount;
        const reopened = await SaveGame.open(file, await save.pack());
        save.markSaved(editCount);
        expect(save.hasUnsavedChanges).toBe(false);
        expect(save.originalBuffer.bytes).toEqual(unpacked);

        const reread = readHero(reopened.buffer, first.position, layout, first.codePage);
        expect(reread).toEqual(edited);
        const differences = reopened.buffer.bytes.filter(
          (byte, index) => byte !== unpacked[index],
        ).length;
        expect(reopened.buffer.length).toBe(unpacked.length);
        // attack (1) + experience (up to 4) + two flags for each changed spell
        const spellFlags = 2 * (forgotten === undefined ? 1 : 2);
        expect(differences).toBeLessThanOrEqual(1 + 4 + spellFlags);
      }

      if (process.env['SHOW_SAVES']) {
        console.log(
          `${relative(SAVES_DIR, file)}: ${header} v${version.join('.')} ${save.format.kind} ` +
            `${unpacked.length} bytes, edition ${edition} (${EDITIONS.indexOf(edition)}), ` +
            `${found.length} heroes\n  ${found.slice(0, 6).join('\n  ')}`,
        );
      }
    },
    60_000,
  );
});
