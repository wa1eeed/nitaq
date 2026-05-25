#!/usr/bin/env ts-node
/**
 * Translation completeness checker.
 *
 * Walks `messages/ar/*.json` and `messages/en/*.json` and verifies that:
 *  1. Both locales have the same set of files
 *  2. Both files have the same nested key tree (no missing keys in either)
 *  3. No empty/blank string values
 *
 * Exits with code 1 (CI-friendly) if any issue is found.
 *
 * Usage:   pnpm run check:i18n
 *          pnpm exec ts-node scripts/check-translations.ts
 */
import { readFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(__dirname, '..', 'messages');
const LOCALES = ['ar', 'en'] as const;

interface Issue {
  file: string;
  type: 'missing-key' | 'missing-file' | 'empty-value' | 'extra-key';
  detail: string;
}

function flatten(obj: unknown, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof obj !== 'object' || obj === null) return out;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null) Object.assign(out, flatten(v, key));
    else out[key] = String(v ?? '');
  }
  return out;
}

function listJson(dir: string) {
  return readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
}

function loadJson(path: string): unknown {
  try { return JSON.parse(readFileSync(path, 'utf-8')); }
  catch (e) { throw new Error(`Invalid JSON: ${path}\n${(e as Error).message}`); }
}

function main() {
  const issues: Issue[] = [];

  const filesByLocale: Record<string, string[]> = {};
  for (const locale of LOCALES) {
    const dir = join(ROOT, locale);
    filesByLocale[locale] = listJson(dir);
  }

  // 1) symmetric file sets
  const arFiles = new Set(filesByLocale.ar);
  const enFiles = new Set(filesByLocale.en);
  for (const f of arFiles) if (!enFiles.has(f)) {
    issues.push({ file: f, type: 'missing-file', detail: `Missing in en/` });
  }
  for (const f of enFiles) if (!arFiles.has(f)) {
    issues.push({ file: f, type: 'missing-file', detail: `Missing in ar/` });
  }

  // 2) symmetric key sets + non-empty values
  const sharedFiles = [...arFiles].filter((f) => enFiles.has(f));
  for (const file of sharedFiles) {
    const ar = flatten(loadJson(join(ROOT, 'ar', file)));
    const en = flatten(loadJson(join(ROOT, 'en', file)));
    const arKeys = Object.keys(ar);
    const enKeys = Object.keys(en);

    for (const k of arKeys) if (!(k in en)) {
      issues.push({ file, type: 'missing-key', detail: `Missing in en: ${k}` });
    }
    for (const k of enKeys) if (!(k in ar)) {
      issues.push({ file, type: 'missing-key', detail: `Missing in ar: ${k}` });
    }
    for (const [k, v] of Object.entries(ar)) {
      if (!v.trim()) issues.push({ file, type: 'empty-value', detail: `Empty in ar: ${k}` });
    }
    for (const [k, v] of Object.entries(en)) {
      if (!v.trim()) issues.push({ file, type: 'empty-value', detail: `Empty in en: ${k}` });
    }
  }

  // Report
  if (issues.length === 0) {
    const totalKeys = sharedFiles.reduce((sum, f) => {
      return sum + Object.keys(flatten(loadJson(join(ROOT, 'ar', f)))).length;
    }, 0);
    console.log(`✅ Translations OK — ${sharedFiles.length} file(s), ${totalKeys} key(s), 2 locales.`);
    process.exit(0);
  }

  console.error(`\n❌ Found ${issues.length} translation issue(s):\n`);
  const grouped: Record<string, Issue[]> = {};
  for (const i of issues) (grouped[i.file] ||= []).push(i);
  for (const [file, list] of Object.entries(grouped)) {
    console.error(`  ${file}:`);
    for (const i of list) console.error(`    [${i.type}] ${i.detail}`);
  }
  process.exit(1);
}

main();
