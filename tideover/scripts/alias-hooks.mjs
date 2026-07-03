/**
 * Module resolve hook so `node --test` understands the `@/*` tsconfig path alias
 * and extensionless imports the same way Next.js does. Used only for unit tests.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();

function withExt(base) {
  const candidates = [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), `${base}.mjs`, `${base}.js`];
  return candidates.find((c) => existsSync(c)) ?? base;
}

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    const resolved = withExt(join(ROOT, specifier.slice(2)));
    return { url: pathToFileURL(resolved).href, shortCircuit: true };
  }
  return next(specifier, context);
}
