import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const SKIP_DIRS = new Set(["node_modules", ".git"]);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

const errors = [];

for (const file of walk(".")) {
  if (extname(file) !== ".json") continue;
  try {
    JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    errors.push(`${file}: ${err.message}`);
  }
}

if (errors.length) {
  console.error(`JSON validation failed (${errors.length} issue(s)):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log("JSON validation passed.");
