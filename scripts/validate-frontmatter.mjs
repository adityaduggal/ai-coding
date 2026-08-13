import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const AGENTS_DIR = ".claude/agents";
const SKILLS_DIR = ".claude/skills";

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const fieldMatch = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (fieldMatch) fields[fieldMatch[1]] = fieldMatch[2].trim();
  }
  return fields;
}

const errors = [];

for (const file of walk(AGENTS_DIR)) {
  if (extname(file) !== ".md") continue;
  const fields = parseFrontmatter(readFileSync(file, "utf8"));
  if (!fields) {
    errors.push(`${file}: missing YAML frontmatter block`);
    continue;
  }
  if (!fields.name) errors.push(`${file}: missing required frontmatter field "name"`);
  if (!fields.description) errors.push(`${file}: missing required frontmatter field "description"`);
}

for (const file of walk(SKILLS_DIR)) {
  if (!file.endsWith("SKILL.md")) continue;
  const fields = parseFrontmatter(readFileSync(file, "utf8"));
  if (!fields) {
    errors.push(`${file}: missing YAML frontmatter block`);
    continue;
  }
  if (!fields.description) errors.push(`${file}: missing required frontmatter field "description"`);
}

if (errors.length) {
  console.error(`Frontmatter validation failed (${errors.length} issue(s)):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log("Frontmatter validation passed.");
