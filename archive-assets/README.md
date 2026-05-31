# Archived Assets

This directory keeps source or retired asset packs out of the runtime `public/assets`
tree while preserving them for future design reference.

- `source/`: original source packages that have matching runtime copies under
  `public/assets`.
- `public-unused/`: older public asset packs that are not referenced by current
  source files. Run `npm run audit:assets` after moving assets back into use.
