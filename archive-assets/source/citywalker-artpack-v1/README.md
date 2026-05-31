# citywalker-artpack-v1

This package was prepared from the 7 uploaded AI art files.

What is already done:
- Files are renamed.
- `stats-icons-sheet.png` is split into 4 transparent PNG icons.
- `badges-sheet.png` is split into 12 transparent PNG badges.
- Checkerboard-like backgrounds are automatically removed where possible.
- `manifest.json` and `citywalkerAssets.ts` are included.
- `codex-integrate-prompt.md` contains the prompt to paste into Codex.

Usage:
1. Put this folder in your project root.
2. Paste `codex-integrate-prompt.md` into Codex.
3. Ask Codex to copy the assets to your project's static asset directory and update the profile page.

Note:
The original AI images had baked checkerboard backgrounds, not real transparency. This package attempts automatic background cleanup. Please visually check the result in your app.
