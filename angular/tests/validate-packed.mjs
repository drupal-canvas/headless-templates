// Validate unpublished packages without changing this project's dependencies or
// lockfile. Only copies of caller-supplied tarballs are installed, in OS temp.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cp,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  writeFile,
  access,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

assert(
  process.argv[2],
  'Usage: node tests/validate-packed.mjs "$ARTIFACT_DIR"',
);
const source = fileURLToPath(new URL("../", import.meta.url));
const artifacts = resolve(process.argv[2]);
const work = await mkdtemp(join(tmpdir(), "canvas-angular-validation-"));
await mkdir(join(work, "artifacts"));
const packages = {};
for (const name of ["headless", "headless-angular", "headless-host"]) {
  const candidates = (await readdir(artifacts)).filter((file) =>
    new RegExp(`^drupal-canvas-${name}-[0-9].*\\.tgz$`).test(file),
  );
  assert.equal(candidates.length, 1, `Supply exactly one ${name} tarball`);
  const file = candidates[0];
  await cp(join(artifacts, file), join(work, "artifacts", file));
  packages[`@drupal-canvas/${name}`] = {
    file,
    sha256: createHash("sha256")
      .update(await readFile(join(work, "artifacts", file)))
      .digest("hex"),
  };
}
const run = (cwd, ...args) => {
  const result = spawnSync("npm", args, { cwd, stdio: "inherit" });
  assert.equal(result.status, 0, `npm ${args.join(" ")} failed in ${cwd}`);
};
console.log(`Independent validation projects: ${work}`);
for (const major of [22, 21]) {
  const project = join(work, `angular${major}`);
  await cp(source, project, {
    recursive: true,
    filter: (path) =>
      ![
        "node_modules",
        ".angular",
        "dist",
        ".git",
        ".env",
        "package-lock.json",
        "canvas-components.generated.ts",
        "canvas-manifest.generated.ts",
      ].includes(basename(path)),
  });
  const manifest = JSON.parse(
    await readFile(join(project, "package.json"), "utf8"),
  );
  for (const [name, { file }] of Object.entries(packages))
    manifest.dependencies[name] = `file:../artifacts/${file}`;
  if (major === 21) {
    for (const group of ["dependencies", "devDependencies"])
      for (const name of Object.keys(manifest[group])) {
        if (name.startsWith("@angular/"))
          manifest[group][name] = [
            "@angular/build",
            "@angular/cli",
            "@angular/ssr",
          ].includes(name)
            ? "21.2.24"
            : "21.2.23";
      }
    manifest.devDependencies.typescript = "5.9.3";
  }
  await writeFile(
    join(project, "package.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  run(project, "install");
  run(project, "run", "check");
  // A successful CLI exit without concrete generation is not a successful check.
  await access(join(project, "src/canvas-components.generated.ts"));
  await access(join(project, "src/canvas-manifest.generated.ts"));
  run(project, "run", "build");
  await access(join(project, "dist/angular/server/server.mjs"));
  run(project, "run", "canvas", "--", "validate");
}
await writeFile(
  join(work, "matrix.json"),
  JSON.stringify(
    {
      node: process.version,
      packages,
      majors: [22, 21],
      checks: ["check", "build", "canvas validate"],
    },
    null,
    2,
  ),
);
console.log(
  `Passed both majors with identical copied artifacts: ${work}/matrix.json`,
);
