import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(projectRoot, "src");
const publicRoot = path.join(projectRoot, "public");
const sourceExtensions = new Set([".css", ".ts", ".tsx"]);
const assetPattern = /["'(]((?:\/assets\/)[^"')?]+)(?:\?[^"')]+)?/g;

function walkFiles(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
  });
}

const sourceFiles = walkFiles(sourceRoot).filter((filePath) => sourceExtensions.has(path.extname(filePath)));
const references = new Map();

for (const filePath of sourceFiles) {
  const source = readFileSync(filePath, "utf8");
  let match;
  while ((match = assetPattern.exec(source))) {
    const assetPath = match[1];
    const relativeSource = path.relative(projectRoot, filePath);
    const sources = references.get(assetPath) ?? new Set();
    sources.add(relativeSource);
    references.set(assetPath, sources);
  }
}

const missing = [];

for (const [assetPath, sources] of references) {
  const publicPath = path.join(publicRoot, assetPath);
  if (!existsSync(publicPath)) {
    missing.push({
      assetPath,
      sources: [...sources].sort()
    });
  }
}

if (missing.length > 0) {
  console.error(`Missing ${missing.length} referenced asset(s):`);
  for (const item of missing) {
    console.error(`- ${item.assetPath}`);
    for (const source of item.sources) {
      console.error(`  referenced by ${source}`);
    }
  }
  process.exitCode = 1;
} else {
  console.log(`Asset audit passed: ${references.size} referenced asset(s) all exist under public/.`);
}
