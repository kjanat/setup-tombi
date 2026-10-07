import * as fs from 'node:fs';
import * as cache from '@actions/cache';
import * as core from '@actions/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const packageJsonVersion = (require('../package.json') as { version: string })
	.version;

vi.mock('@actions/cache');
vi.mock('@actions/core');
vi.mock('node:fs', async () => {
	const actual = await vi.importActual('node:fs');
	return {
		...actual,
		existsSync: vi.fn(),
	};
});

describe('setup-tombi post action', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.resetAllMocks();

		vi.mocked(core.getState).mockImplementation((name: string) => {
			switch (name) {
				case 'cache-enabled':
					return 'true';
				case 'cache-key':
					return `setup-tombi-v1-linux-x64-${packageJsonVersion}-tmp-cache`;
				case 'cache-path':
					return '/tmp/cache';
				default:
					return '';
			}
		});
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(cache.saveCache).mockResolvedValue(1);
	});

	it('saves the restored cache in the post step', async () => {
		const { runPost } = await import('./post');
		await runPost();

		expect(cache.saveCache).toHaveBeenCalledWith(
			['/tmp/cache'],
			`setup-tombi-v1-linux-x64-${packageJsonVersion}-tmp-cache`,
		);
	});

	it('does not save an exact cache hit again', async () => {
		const getState = vi.mocked(core.getState).getMockImplementation();
		vi.mocked(core.getState).mockImplementation((name) => {
			return getState?.(name === 'cache-matched-key' ? 'cache-key' : name) ?? '';
		});

		const { runPost } = await import('./post');
		await runPost();

		expect(cache.saveCache).not.toHaveBeenCalled();
	});

	it('skips saving when caching was disabled', async () => {
		vi.mocked(core.getState).mockReturnValue('');

		const { runPost } = await import('./post');
		await runPost();

		expect(cache.saveCache).not.toHaveBeenCalled();
	});

	it('warns when saving fails', async () => {
		vi.mocked(cache.saveCache).mockRejectedValue(new Error('cache backend unavailable'));

		const { runPost } = await import('./post');
		await runPost();

		expect(core.warning).toHaveBeenCalledWith('Failed to save Tombi cache: cache backend unavailable');
	});
});
