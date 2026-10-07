import { describe, expect, it } from 'vitest';
import { extractVersionFromBunLock } from '#lockfile/bun-lock';

describe('bun.lock parser', () => {
	it('resolves version from tombi reference', () => {
		expect(extractVersionFromBunLock(`
{
  "packages": {
    "tombi": ["tombi@0.10.2", "", {}, "sha512-xyz"]
  }
}
`)).toBe('0.10.2');
	});

	it('resolves version from alias package reference', () => {
		expect(extractVersionFromBunLock(`
{
  "packages": {
    "@tombi-toml/tombi": ["@tombi-toml/tombi@0.10.3", "", {}, "sha512-xyz"]
  }
}
`)).toBe('0.10.3');
	});

	it('returns undefined when package is missing', () => {
		expect(extractVersionFromBunLock(`
{
  "packages": {
    "foo": ["foo@1.0.0", "", {}, "sha512-xyz"]
  }
}
`)).toBeUndefined();
	});
});
