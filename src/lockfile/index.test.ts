import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resolveVersionFromLockfile, resolveVersionFromVersionFile } from '#lockfile/index';

const lockfiles = [
	['uv.lock', '[[package]]\nname = "tombi"\nversion = "1.5.5"\n', '`tombi`'],
	['poetry.lock', '[[package]]\nname = "tombi"\nversion = "1.5.5"\n', '`tombi`'],
	['pnpm-lock.yaml', 'packages:\n  tombi@1.5.5:\n    resolution: {}\n', '`tombi` or `@tombi-toml/tombi`'],
	['package-lock.json', '{"packages":{"node_modules/tombi":{"version":"1.5.5"}}}', '`tombi` or `@tombi-toml/tombi`'],
	['yarn.lock', '"tombi@^1.5.0":\n  version "1.5.5"\n', '`tombi` or `@tombi-toml/tombi`'],
	['bun.lock', '{"packages":{"tombi":["tombi@1.5.5"]}}', '`tombi` or `@tombi-toml/tombi`'],
	[
		'mise.lock',
		'[[tools.tombi]]\nversion = "1.5.5"\n',
		'`tombi` or `aqua:tombi-toml/tombi` or `github:tombi-toml/tombi`',
	],
];

describe('version source files', () => {
	let projectDir: string;

	beforeEach(() => {
		projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-tombi-inputs-'));
	});

	afterEach(() => {
		fs.rmSync(projectDir, { recursive: true, force: true });
	});

	it.each(lockfiles)('reads %s by basename from a project directory', async (name, content) => {
		const file = path.join(projectDir, name);
		fs.writeFileSync(file, content);
		await expect(resolveVersionFromLockfile(file)).resolves.toBe('1.5.5');
	});

	it.each(lockfiles)(
		'reports the expected package names when %s has no Tombi entry',
		async (name, _content, packages) => {
			const file = path.join(projectDir, name);
			fs.writeFileSync(file, name === 'package-lock.json' ? '{}' : '');
			await expect(resolveVersionFromLockfile(file)).rejects.toThrow(
				`Package ${packages} was not found in lock file: ${file}`,
			);
		},
	);

	it.each(['unknown.lock', 'constructor', '__proto__'])(
		'rejects unsupported lock file %s before reading it',
		async (name) => {
			await expect(resolveVersionFromLockfile(name)).rejects.toThrow(
				`Unsupported lock file: ${name}. Supported: ${lockfiles.map(([name]) => name).join(', ')}`,
			);
		},
	);

	it('keeps version files separate from lock files', async () => {
		await expect(resolveVersionFromLockfile('.tool-versions')).rejects.toThrow(/Unsupported lock file/);
		await expect(resolveVersionFromVersionFile('uv.lock')).rejects.toThrow(
			'Unsupported version file: uv.lock. Supported: .tool-versions',
		);
	});

	it('reads the first version from .tool-versions', async () => {
		const file = path.join(projectDir, '.tool-versions');
		fs.writeFileSync(file, 'nodejs 24\ntombi 1.5.5 1.4.0 # fallback\n');
		await expect(resolveVersionFromVersionFile(file)).resolves.toBe('1.5.5');
	});

	it('reports a missing Tombi entry as a version file error', async () => {
		const file = path.join(projectDir, '.tool-versions');
		fs.writeFileSync(file, 'nodejs 24\n');
		await expect(resolveVersionFromVersionFile(file)).rejects.toThrow(
			`Package \`tombi\` was not found in version file: ${file}`,
		);
	});

	it('preserves file read errors', async () => {
		await expect(resolveVersionFromLockfile(path.join(projectDir, 'uv.lock'))).rejects.toThrow(/ENOENT/);
	});

	it('preserves malformed JSON errors', async () => {
		const file = path.join(projectDir, 'package-lock.json');
		fs.writeFileSync(file, '{');
		await expect(resolveVersionFromLockfile(file)).rejects.toThrow(SyntaxError);
	});
});
