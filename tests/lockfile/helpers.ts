import { expect } from "vitest";
import type { VersionSourceKind } from "../../src/lockfile";
import { extractVersionByKind } from "../../src/lockfile";

export function expectResolvedVersion(
  kind: VersionSourceKind,
  content: string,
  expectedVersion: string,
): void {
  expect(extractVersionByKind(kind, content)).toBe(expectedVersion);
}

export function expectVersionNotFound(
  kind: VersionSourceKind,
  content: string,
): void {
  expect(extractVersionByKind(kind, content)).toBeUndefined();
}
