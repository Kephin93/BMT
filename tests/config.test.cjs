const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { test } = require("node:test");

test("Next loads configuration from config/ and deployment variables take precedence", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bmt-config-"));
  try {
    fs.mkdirSync(path.join(root, "config"));
    fs.writeFileSync(path.join(root, ".env"),
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID=old-root-project\n");
    fs.writeFileSync(path.join(root, "config/.env.local"),
      "AUTH_SECRET=local-test-secret\nNEXT_PUBLIC_FIREBASE_PROJECT_ID=local-project\n");
    const configPath = path.resolve(__dirname, "../next.config.ts");
    const result = spawnSync(process.execPath, ["-e", `
      const fs = require('node:fs');
      const ts = require('typescript');
      const Module = require('node:module');
      const filename = ${JSON.stringify(configPath)};
      const loaded = new Module(filename, module);
      loaded.filename = filename;
      loaded.paths = Module._nodeModulePaths(require('node:path').dirname(filename));
      delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      // Next loads root env files before evaluating next.config.ts.
      require('@next/env').loadEnvConfig(${JSON.stringify(root)});
      process.chdir(${JSON.stringify(root)});
      loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true }
      }).outputText, filename);
      require('node:assert/strict').equal(process.env.AUTH_SECRET, 'deployment-test-secret');
      require('node:assert/strict').equal(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, 'local-project');
    `], {
      cwd: path.resolve(__dirname, ".."),
      env: { ...process.env, AUTH_SECRET: "deployment-test-secret" },
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
