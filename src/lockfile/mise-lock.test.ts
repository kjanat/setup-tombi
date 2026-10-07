import { describe, expect, it } from 'vitest';
import { extractVersionFromMiseLock } from '#lockfile/mise-lock';

describe('mise.lock parser', () => {
	it('resolves version from a tombi tool entry', () => {
		expect(extractVersionFromMiseLock(`
lockfile_version = 2

[[tools.tombi]]
version = "0.10.4"
backend = "aqua:tombi-toml/tombi"
`)).toBe('0.10.4');
	});

	it('resolves version from a quoted aqua tool entry', () => {
		expect(extractVersionFromMiseLock(`
[[tools."aqua:tombi-toml/tombi"]]
backend = "aqua:tombi-toml/tombi"
version = "0.10.5"
`)).toBe('0.10.5');
	});

	it('returns undefined when the tool is missing', () => {
		expect(extractVersionFromMiseLock(`
[[tools.node]]
version = "22.0.0"
`)).toBeUndefined();
	});

	it('resolves version from a quoted GitHub tool entry', () => {
		expect(extractVersionFromMiseLock(`
[[tools."github:tombi-toml/tombi"]]
version = "1.7.3"
`)).toBe('1.7.3');
	});
});
