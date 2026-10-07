import { describe, expect, it } from 'vitest';
import { extractVersionFromYarnLock } from '#lockfile/yarn-lock';

describe('yarn.lock parser', () => {
	it('resolves version from Yarn v1 stanza', () => {
		expect(extractVersionFromYarnLock(`
"tombi@^0.9.0":
  version "0.9.9"
  resolved "https://registry.yarnpkg.com/tombi/-/tombi-0.9.9.tgz"
`)).toBe('0.9.9');
	});

	it.each(['version: 0.10.1', 'version: "0.10.1"', "version: '0.10.1'", 'version : 0.10.1'])(
		'resolves version from Yarn v2 stanza with %s',
		(versionLine) => {
			expect(extractVersionFromYarnLock(`
"@tombi-toml/tombi@npm:^0.10.0":
  ${versionLine}
  resolution: "@tombi-toml/tombi@npm:0.10.1"
`)).toBe('0.10.1');
		},
	);

	it('returns undefined when package is missing', () => {
		expect(extractVersionFromYarnLock(`
"foo@^1.0.0":
  version "1.0.1"
`)).toBeUndefined();
	});
});
