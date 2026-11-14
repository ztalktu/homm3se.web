# Heroes III SaveEditor 3.0

A free save game editor for **Heroes of Might and Magic III** (Heroes 3, HoMM3) that
runs entirely in the browser. It is the web successor of Heroes III SaveEditor 2.05
(hmm3se.exe, Windows, 2001–2005) by Ztalker, [VItonIC Group](https://vitonic.ru/).

**Live at <https://heroes3se.vitonic.ru/>**

Open a `.gm1`–`.gm8` save or a `.cgm` campaign, change it and write it back. Everything
happens on your machine: nothing is uploaded anywhere. Settings are kept in the
browser's local storage.

## What it edits

- Heroes: name and class, level and experience, attack, defense, spell power and
  knowledge, mana and movement points.
- Army of seven stacks, secondary skills, spells and the spell book, backpack artifacts.
- Player resources: gold, wood, ore, mercury, sulfur, crystals and gems.

## Supported editions

The Restoration of Erathia, Armageddon's Blade, The Shadow of Death (and Complete),
Heroes Chronicles, HD Edition, In the Wake of Gods (WoG) and Horn of the Abyss (HotA),
including 1.8. The editor tells the edition from the save header; where the header is
ambiguous, it guesses from the heroes and lets you pick.

The interface is available in English (default) and Russian, with a dark and a
light theme in the spirit of Heroes 3.

## Development

The project uses Svelte 5, TypeScript and Vite. Node.js is only needed to build
the site; the result in `dist/` is a set of static files.

Node.js does not have to be installed on the host: `scripts/node.sh` runs any
command inside the `node:22-alpine` Docker image.

```sh
scripts/node.sh npm install      # install dependencies
scripts/node.sh npm run dev      # dev server on http://localhost:5173
scripts/node.sh npm test         # unit tests
scripts/node.sh npm run check    # type checking
scripts/node.sh npm run lint     # ESLint and Prettier
scripts/node.sh npm run build    # static site in dist/
```

With a local Node.js 22.12 or newer the same commands work without the prefix.

## Project layout

| Path           | Contents                                            |
| -------------- | --------------------------------------------------- |
| `src/core/`    | save file logic, independent of the interface       |
| `src/data/`    | game reference data: ids and properties, no texts   |
| `src/i18n/`    | dictionaries (`en/`, `ru/`) and translation helpers |
| `src/storage/` | local storage helpers                               |
| `src/app/`     | application state: preferences, version             |
| `src/ui/`      | components, screens and themes                      |
| `tests/`       | unit tests                                          |

All files are UTF-8. English is the source language of the code, comments and
documentation; Russian exists only as an interface language.

## License

MIT, see [LICENSE](LICENSE). This repository is
version 3.0, the web edition.
Heroes of Might and Magic is a trademark of Ubisoft Entertainment; this project is
not affiliated with the rights holders.
