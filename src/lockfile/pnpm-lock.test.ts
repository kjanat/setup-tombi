import { describe, expect, it } from 'vitest';
import { extractVersionFromPnpmLock } from '#lockfile/pnpm-lock';

describe('pnpm-lock.yaml parser', () => {
	it('resolves version from packages key entry', () => {
		expect(extractVersionFromPnpmLock(`
packages:
  tombi@0.9.3:
    resolution: {integrity: sha512-abc}
`)).toBe('0.9.3');
	});

	it('resolves version from alias package entry', () => {
		expect(extractVersionFromPnpmLock(`
packages:
  '@tombi-toml/tombi@0.9.4':
    resolution: {integrity: sha512-abc}
`)).toBe('0.9.4');
	});

	it('resolves version from importer dependency metadata', () => {
		expect(extractVersionFromPnpmLock(`
importers:
  .:
    dependencies:
      tombi:
        version: 0.9.5
        specifier: ^0.9.0
`)).toBe('0.9.5');
	});

	it('returns undefined when package is missing', () => {
		expect(extractVersionFromPnpmLock(`
packages:
  foo@1.0.0:
    resolution: {integrity: sha512-abc}
`)).toBeUndefined();
	});
});
