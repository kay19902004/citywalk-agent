import { readFileSync } from "node:fs";

const cssImportPattern = /^@import\s+"([^"]+)";\s*$/gm;

export function readCssWithImports(entryUrl: URL, seen = new Set<string>()): string {
  const key = entryUrl.href;
  if (seen.has(key)) return "";
  seen.add(key);

  const source = readFileSync(entryUrl, "utf8");
  return source.replace(cssImportPattern, (_match, importPath: string) => {
    return readCssWithImports(new URL(importPath, entryUrl), seen);
  });
}
