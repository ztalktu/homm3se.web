/**
 * Smoke test on real saves from the local saves/ folder (not in the repository: the files
 * belong to other people). Skipped when the folder is missing.
 *
 * Every .cgm and .gm1–.gm8 file under saves/ is opened, searched for heroes and resources,
 * and edited back. The first-level folder names what wrote the save, and the test checks the
 * layout (and, where the header tells, the editions) that the header picks for it:
 * - RoE-Original/ — Restoration of Erathia itself: its own layout, Restoration of Erathia;
 * - H3HD/ — HD Edition: its own layout;
 * - RoE-Complete/ — Restoration of Erathia campaigns written by Complete: The Shadow of
 *   Death's layout, Restoration of Erathia;
 * - AB-Complete/ — Armageddon's Blade campaigns written by Complete: Armageddon's Blade's
 *   layout and edition, hero backpacks where The Shadow of Death keeps them;
 * - SoD/ — The Shadow of Death or Complete, which write the same format: The Shadow of
 *   Death's layout;
 * - HotA/ — Horn of the Abyss: the early or the current layout by the header minor.
 * Saves in any other folder get only the common checks.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { requiredEdition } from '../src/core/editionDetection';
import { readHero, writeHero } from '../src/core/hero';
import { findHero, findHeroNames, findNextHero } from '../src/core/heroSearch';
import { decompressGzip } from '../src/core/gzip';
import { findPlayerTreasuries, readResources } from '../src/core/resources';
import { findTowns, readTown, writeTown } from '../src/core/town';
import { SaveBuffer } from '../src/core/saveBuffer';
import { SaveGame } from '../src/core/saveGame';
import { editionsForHeader, isEditingTested } from '../src/core/saveFormat';
import { heroLayoutAt, layoutFor, playerBlockFor } from '../src/core/layouts';
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

      // The header picks the layout: Restoration of Erathia and HD Edition their own, The Shadow
      // of Death the newer one (also for Restoration of Erathia campaigns written by Complete),
      // Armageddon's Blade its own, Horn of the Abyss one of its two by the header minor.
      const inFolder = (folder: string): boolean => file.includes(`${SAVES_DIR}/${folder}/`);
      const expectedLayout = inFolder('RoE-Original')
        ? 'restorationOfErathia'
        : inFolder('H3HD')
          ? 'hdEdition'
          : inFolder('SoD') || inFolder('RoE-Complete')
            ? 'shadowOfDeath'
            : inFolder('AB-Complete')
              ? 'armageddonsBlade'
              : inFolder('HotA')
                ? version[1]! >= 10
                  ? 'hornOfTheAbyss'
                  : 'hornOfTheAbyssEarly'
                : null;
      if (expectedLayout) {
        expect(layoutFor(save.format, 'restorationOfErathia').id).toBe(expectedLayout);
      }
      // The folders hold saves of these editions' content, which the header names.
      const expectedEditions =
        inFolder('RoE-Original') || inFolder('RoE-Complete')
          ? ['restorationOfErathia']
          : inFolder('AB-Complete')
            ? ['armageddonsBlade']
            : null;
      if (expectedEditions) {
        expect(editionsForHeader(save.format)).toEqual(expectedEditions);
      }
      // Complete writes Armageddon's Blade campaigns with The Shadow of Death's hero records.
      if (inFolder('AB-Complete')) {
        for (const name of names) {
          const match = findHero(save.buffer, name);
          if (match) {
            const layout = heroLayoutAt(
              save.format,
              'armageddonsBlade',
              save.buffer,
              match.position,
            );
            expect(layout.backpack, name).toBe(365);
          }
        }
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
            heroLayoutAt(save.format, edition, buffer, match.position),
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

      expect(found.length, 'heroes found').toBeGreaterThan(0);

      // Writing every hero back unchanged must not change a single byte (supported formats).
      const first = names.map((name) => findHero(buffer, name)).find(Boolean);
      if (first && isEditingTested(save.format)) {
        const copy = new SaveBuffer(buffer.bytes.slice());
        // Each hero with its own layout, as the editor reads it (Armageddon's Blade has two).
        const layoutAt = (position: number) => heroLayoutAt(save.format, edition, buffer, position);
        for (const name of names) {
          let match = findHero(buffer, name);
          while (match) {
            const layout = layoutAt(match.position);
            const hero = readHero(copy, match.position, layout, match.codePage);
            writeHero(copy, match.position, layout, match.codePage, hero, edition);
            match = findNextHero(buffer, name, match);
          }
        }
        const changed = copy.bytes.findIndex((byte, index) => byte !== buffer.bytes[index]);
        expect(changed, 'first changed byte after rewriting every hero unchanged').toBe(-1);

        // Real edits, applied twice like two "Apply" clicks, survive packing and reopening and
        // touch only the edited bytes. The bytes as opened stay as they were throughout.
        const layout = layoutAt(first.position);
        const hero = readHero(buffer, first.position, layout, first.codePage);
        const firstEdit = {
          ...hero,
          attack: hero.attack === 99 ? 98 : 99,
          experience: hero.experience + 1000,
        };
        save.edit((target) =>
          writeHero(target, first.position, layout, first.codePage, firstEdit, edition),
        );
        // Second edit: learn one spell the hero lacks and forget one it knows.
        const missing = SPELLS.find((spell) => !hero.spells.includes(spell.id))!.id;
        const forgotten = hero.spells[0];
        const edited = {
          ...firstEdit,
          spells: [...firstEdit.spells.filter((id) => id !== forgotten), missing].sort(
            (a, b) => a - b,
          ),
        };
        save.edit((target) =>
          writeHero(target, first.position, layout, first.codePage, edited, edition),
        );
        expect(readHero(save.originalBuffer, first.position, layout, first.codePage)).toEqual(hero);

        const packed = await save.pack();
        const reopened = await SaveGame.open(file, packed.file);
        save.markSaved(packed);
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

      // Every save of a game with a known player record has the block of eight treasuries.
      const playerBlock = playerBlockFor(save.format);
      expect(playerBlock, 'player block layout').not.toBeNull();
      const treasuries = findPlayerTreasuries(buffer, playerBlock!);
      expect(treasuries, 'player treasuries').not.toBeNull();
      // Some players have gold, unless the scenario starts everyone with nothing at all (the
      // first Horn of the Abyss campaign scenario does).
      const amounts = treasuries!.map((gold) => readResources(buffer, gold)!);
      const empty = amounts.every((treasury) => Object.values(treasury).every((v) => v === 0));
      expect(empty || amounts.some((treasury) => treasury.gold > 0)).toBe(true);

      // Towns: a numbered run of records, read and written back unchanged byte for byte; a
      // garrison edit touches only that slot.
      const townLayout = layoutFor(save.format, edition).town;
      const towns = findTowns(buffer, townLayout);
      expect(towns.length, 'towns').toBeGreaterThan(0);
      towns.forEach((town, index) => {
        expect(town.number).toBe(index);
        expect(town.faction).toBeLessThanOrEqual(11);
        expect(town.guildSlots.every((slots) => slots <= 6)).toBe(true);
      });
      const townCopy = new SaveBuffer(buffer.bytes.slice());
      for (const town of towns) {
        writeTown(townCopy, readTown(townCopy, town.position, townLayout));
      }
      expect(townCopy.bytes.findIndex((byte, index) => byte !== buffer.bytes[index])).toBe(-1);
      const target = towns[0]!;
      const slot = target.garrison.findIndex((troop) => troop === null);
      if (slot >= 0) {
        writeTown(townCopy, {
          ...target,
          garrison: target.garrison.map((troop, i) =>
            i === slot ? { creatureId: 1, count: 5 } : troop,
          ),
        });
        expect(readTown(townCopy, target.position, townLayout).garrison[slot]).toEqual({
          creatureId: 1,
          count: 5,
        });
        const touched = townCopy.bytes.filter((byte, index) => byte !== buffer.bytes[index]).length;
        expect(touched).toBeLessThanOrEqual(8);
      }

      if (process.env['SHOW_SAVES']) {
        console.log(
          `${relative(SAVES_DIR, file)}: ${header} v${version.join('.')} ${save.format.kind} ` +
            `${unpacked.length} bytes, edition ${edition} (${EDITIONS.indexOf(edition)}), ` +
            `${found.length} heroes, ${towns.length} towns: ${towns.map((t) => t.name).join(', ')}\n  ${found.slice(0, 6).join('\n  ')}`,
        );
      }
    },
    60_000,
  );
});
