import { describe, expect, it } from 'vitest';
import { extractVersionFromPythonLock } from '#lockfile/python-lock';

describe('uv.lock parser', () => {
	it('resolves version from tombi package block', () => {
		expect(extractVersionFromPythonLock(`
[[package]]
name = "tombi"
version = "0.9.1"
`)).toBe('0.9.1');
	});

	it('does not resolve TypeScript alias package name', () => {
		expect(extractVersionFromPythonLock(`
[[package]]
name = "@tombi-toml/tombi"
version = "0.9.2"
`)).toBeUndefined();
	});

	it('returns undefined when package is missing', () => {
		expect(extractVersionFromPythonLock(`
[[package]]
name = "other"
version = "1.0.0"
`)).toBeUndefined();
	});
});
