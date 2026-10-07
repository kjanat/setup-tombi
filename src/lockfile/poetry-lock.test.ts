import { describe, expect, it } from 'vitest';
import { extractVersionFromPythonLock } from '#lockfile/python-lock';

describe('poetry.lock parser', () => {
	it('resolves version from tombi package block', () => {
		expect(extractVersionFromPythonLock(`
[[package]]
name = "tombi"
version = "0.8.7"
`)).toBe('0.8.7');
	});

	it('does not resolve TypeScript alias package name', () => {
		expect(extractVersionFromPythonLock(`
[[package]]
name = "@tombi-toml/tombi"
version = "0.8.8"
`)).toBeUndefined();
	});

	it('returns undefined when package is missing', () => {
		expect(extractVersionFromPythonLock(`
[[package]]
name = "not-tombi"
version = "1.0.0"
`)).toBeUndefined();
	});
});
