/**
 * Module resolve hook so `node --test` understands the `@/*` tsconfig path alias
 * and extensionless imports the same way Next.js does. Used only for unit tests.
 */
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();

function isFile(p) {
  return existsSync(p) && statSync(p).isFile();
}

function withExt(base) {
  // A bare directory import (e.g. "@/lib/repositories") must resolve to its
  // index file, not the directory itself — so only accept candidates that are
  // real files (an existing directory would EISDIR when node tries to read it).
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
    `${base}.mjs`,
    `${base}.js`,
  ];
  return candidates.find(isFile) ?? base;
}

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    const resolved = withExt(join(ROOT, specifier.slice(2)));
    // JSON modules (the seed data) need an explicit import attribute under the
    // node ESM loader; the Next.js bundler adds it implicitly, so source omits it.
    const importAttributes = resolved.endsWith(".json")
      ? { ...context.importAttributes, type: "json" }
      : context.importAttributes;
    return { url: pathToFileURL(resolved).href, importAttributes, shortCircuit: true };
  }
  return next(specifier, context);
}
