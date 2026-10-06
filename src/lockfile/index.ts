import * as fs from "node:fs";
import * as path from "node:path";
import { extractVersionFromUvLock } from "./uv-lock";
import { extractVersionFromPoetryLock } from "./poetry-lock";
import { extractVersionFromPnpmLock } from "./pnpm-lock";
import { extractVersionFromPackageLock } from "./package-lock";
import { extractVersionFromYarnLock } from "./yarn-lock";
import { extractVersionFromBunLock } from "./bun-lock";
import { extractVersionFromToolVersions } from "./tool-versions";
import {
  PYTHON_PACKAGE_ALIASES,
  TOOL_VERSIONS_PACKAGE_ALIASES,
  TYPESCRIPT_PACKAGE_ALIASES,
} from "./common";

export const PYTHON_LOCKFILE_KINDS = ["uv.lock", "poetry.lock"] as const;
export const TYPESCRIPT_LOCKFILE_KINDS = [
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
  "bun.lock",
] as const;
export const VERSION_FILE_KINDS = [".tool-versions"] as const;
export const SUPPORTED_LOCKFILES = [
  ...PYTHON_LOCKFILE_KINDS,
  ...TYPESCRIPT_LOCKFILE_KINDS,
] as const;

export type LockfileKind = (typeof SUPPORTED_LOCKFILES)[number];
export type VersionFileKind = (typeof VERSION_FILE_KINDS)[number];
export type VersionSourceKind = LockfileKind | VersionFileKind;

const LOCKFILE_PACKAGE_ALIASES: Record<VersionSourceKind, readonly string[]> = {
  "uv.lock": PYTHON_PACKAGE_ALIASES,
  "poetry.lock": PYTHON_PACKAGE_ALIASES,
  "pnpm-lock.yaml": TYPESCRIPT_PACKAGE_ALIASES,
  "package-lock.json": TYPESCRIPT_PACKAGE_ALIASES,
  "yarn.lock": TYPESCRIPT_PACKAGE_ALIASES,
  "bun.lock": TYPESCRIPT_PACKAGE_ALIASES,
  ".tool-versions": TOOL_VERSIONS_PACKAGE_ALIASES,
};

export function detectLockfileKind(lockfilePath: string): LockfileKind {
  const lockfileName = path.basename(lockfilePath);
  if (SUPPORTED_LOCKFILES.includes(lockfileName as LockfileKind)) {
    return lockfileName as LockfileKind;
  }
  throw new Error(
    `Unsupported lock file: ${lockfilePath}. Supported: ${SUPPORTED_LOCKFILES.join(
      ", ",
    )}`,
  );
}

export function packageNotFoundError(
  lockfileInput: string,
  lockfileKind: VersionSourceKind,
): Error {
  const packageAliases = LOCKFILE_PACKAGE_ALIASES[lockfileKind];
  const fileKind = VERSION_FILE_KINDS.some((kind) => kind === lockfileKind)
    ? "version file"
    : "lock file";
  return new Error(
    `Package ${packageAliases
      .map((name) => `\`${name}\``)
      .join(" or ")} was not found in ${fileKind}: ${lockfileInput}`,
  );
}

export function extractVersionByKind(
  lockfileKind: VersionSourceKind,
  content: string,
): string | undefined {
  switch (lockfileKind) {
    case "uv.lock":
      return extractVersionFromUvLock(content);
    case "poetry.lock":
      return extractVersionFromPoetryLock(content);
    case "pnpm-lock.yaml":
      return extractVersionFromPnpmLock(content);
    case "package-lock.json":
      return extractVersionFromPackageLock(content);
    case "yarn.lock":
      return extractVersionFromYarnLock(content);
    case "bun.lock":
      return extractVersionFromBunLock(content);
    case ".tool-versions":
      return extractVersionFromToolVersions(content);
  }
}

export async function resolveVersionFromLockfile(
  lockfileInput: string,
): Promise<string> {
  return resolveVersionFromFile(
    lockfileInput,
    detectLockfileKind(lockfileInput),
  );
}

export function detectVersionFileKind(
  versionFilePath: string,
): VersionFileKind {
  const fileName = path.basename(versionFilePath);
  if (VERSION_FILE_KINDS.includes(fileName as VersionFileKind)) {
    return fileName as VersionFileKind;
  }
  throw new Error(
    `Unsupported version file: ${versionFilePath}. Supported: ${VERSION_FILE_KINDS.join(
      ", ",
    )}`,
  );
}

export async function resolveVersionFromVersionFile(
  versionFileInput: string,
): Promise<string> {
  return resolveVersionFromFile(
    versionFileInput,
    detectVersionFileKind(versionFileInput),
  );
}

async function resolveVersionFromFile(
  lockfileInput: string,
  lockfileKind: VersionSourceKind,
): Promise<string> {
  const lockfileBuffer = await fs.promises.readFile(
    path.resolve(lockfileInput),
  );
  const lockfileContent = lockfileBuffer.toString("utf8");
  const resolvedVersion = extractVersionByKind(lockfileKind, lockfileContent);
  if (!resolvedVersion) {
    throw packageNotFoundError(lockfileInput, lockfileKind);
  }

  return resolvedVersion;
}
