import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  detectLockfileKind,
  detectVersionFileKind,
  resolveVersionFromLockfile,
  resolveVersionFromVersionFile,
} from "../../src/lockfile";

describe("lockfile index helpers", () => {
  it("detects supported lockfile kinds by basename", () => {
    expect(detectLockfileKind("/tmp/uv.lock")).toBe("uv.lock");
    expect(detectLockfileKind("/tmp/poetry.lock")).toBe("poetry.lock");
    expect(detectLockfileKind("/tmp/pnpm-lock.yaml")).toBe("pnpm-lock.yaml");
    expect(detectLockfileKind("/tmp/package-lock.json")).toBe(
      "package-lock.json",
    );
    expect(detectLockfileKind("/tmp/yarn.lock")).toBe("yarn.lock");
    expect(detectLockfileKind("/tmp/bun.lock")).toBe("bun.lock");
    expect(detectLockfileKind("/tmp/mise.lock")).toBe("mise.lock");
  });

  it("throws for unsupported lockfile", () => {
    expect(() => detectLockfileKind("/tmp/unknown.lock")).toThrow(
      /Unsupported lock file/,
    );
  });

  it("detects version files separately from lock files", () => {
    expect(detectVersionFileKind("/tmp/.tool-versions")).toBe(".tool-versions");
    expect(detectVersionFileKind("config/.tool-versions")).toBe(
      ".tool-versions",
    );
    expect(() => detectLockfileKind(".tool-versions")).toThrow(
      /Unsupported lock file/,
    );
    expect(() => detectVersionFileKind("uv.lock")).toThrow(
      /Unsupported version file/,
    );
  });

  it("reads version files and reports missing entries with the correct file kind", async () => {
    const projectDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "setup-tombi-inputs-"),
    );
    const versionFile = path.join(projectDir, ".tool-versions");
    const lockFile = path.join(projectDir, "uv.lock");
    try {
      fs.writeFileSync(
        versionFile,
        "nodejs 24\ntombi 1.5.5 1.4.0 # fallback\n",
      );
      await expect(resolveVersionFromVersionFile(versionFile)).resolves.toBe(
        "1.5.5",
      );
      await expect(resolveVersionFromLockfile(versionFile)).rejects.toThrow(
        /Unsupported lock file/,
      );
      fs.writeFileSync(versionFile, "nodejs 24\n");
      await expect(resolveVersionFromVersionFile(versionFile)).rejects.toThrow(
        `Package \`tombi\` was not found in version file: ${versionFile}`,
      );
      fs.writeFileSync(lockFile, "version = 1\n");
      await expect(resolveVersionFromLockfile(lockFile)).rejects.toThrow(
        `Package \`tombi\` was not found in lock file: ${lockFile}`,
      );
    } finally {
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
  });
});
