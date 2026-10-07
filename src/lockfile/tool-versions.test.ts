import { describe, expect, it } from 'vitest';
import { extractVersionFromToolVersions } from '#lockfile/tool-versions';

describe('.tool-versions parser', () => {
	it('resolves version from padded asdf entries', () => {
		expect(extractVersionFromToolVersions(`
golang        1.27.1
golangci-lint 2.13.2
tombi         1.5.5
`)).toBe('1.5.5');
	});

	it('resolves version with normal spacing', () => {
		expect(extractVersionFromToolVersions('tombi 1.5.5\n')).toBe('1.5.5');
	});

	it('ignores comments, blank lines, and Windows line endings', () => {
		expect(extractVersionFromToolVersions('# tools\r\n\r\ntombi 1.5.5 # TOML formatter\r\n')).toBe('1.5.5');
	});

	it('selects the first version when multiple are listed', () => {
		expect(extractVersionFromToolVersions('tombi 1.5.5 1.4.0 latest\n')).toBe('1.5.5');
	});

	it('passes through non-semver values', () => {
		expect(extractVersionFromToolVersions('tombi latest\n')).toBe('latest');
	});

	it('does not match similar tool names', () => {
		expect(extractVersionFromToolVersions('tombi-extra 1.5.5\nmytombi 1.5.5\n')).toBeUndefined();
	});

	it('returns undefined when Tombi is absent', () => {
		expect(extractVersionFromToolVersions('golang 1.27.1\n')).toBeUndefined();
	});

	it('returns undefined when the Tombi line has no version', () => {
		expect(extractVersionFromToolVersions('tombi\n')).toBeUndefined();
	});
});
