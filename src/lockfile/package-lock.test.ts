import { describe, expect, it } from 'vitest';
import { extractVersionFromPackageLock } from '#lockfile/package-lock';

describe('package-lock.json parser', () => {
	it('resolves version from lockfileVersion 3 packages map', () => {
		expect(extractVersionFromPackageLock(JSON.stringify({
			lockfileVersion: 3,
			packages: {
				'node_modules/tombi': { version: '0.9.6' },
			},
		}))).toBe('0.9.6');
	});

	it('resolves alias package from packages map', () => {
		expect(extractVersionFromPackageLock(JSON.stringify({
			lockfileVersion: 3,
			packages: {
				'node_modules/@tombi-toml/tombi': { version: '0.9.7' },
			},
		}))).toBe('0.9.7');
	});

	it('resolves version from lockfileVersion 1 dependencies map', () => {
		expect(extractVersionFromPackageLock(JSON.stringify({
			lockfileVersion: 1,
			dependencies: {
				tombi: { version: '0.9.8' },
			},
		}))).toBe('0.9.8');
	});

	it('returns undefined when package is missing', () => {
		expect(extractVersionFromPackageLock(JSON.stringify({
			lockfileVersion: 3,
			packages: {
				'node_modules/foo': { version: '1.0.0' },
			},
		}))).toBeUndefined();
	});
});
