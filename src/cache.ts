import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as cache from '@actions/cache';
import * as core from '@actions/core';

const STATE_CACHE_ENABLED = 'cache-enabled';
const STATE_CACHE_KEY = 'cache-key';
const STATE_CACHE_MATCHED_KEY = 'cache-matched-key';
const STATE_CACHE_PATH = 'cache-path';
const CACHE_VERSION = 'v1';

export const shouldEnableCache = (input: string) => {
	switch (input.trim().toLowerCase()) {
		case 'true':
			return true;
		case 'false':
			return false;
		case 'auto':
			return process.env.RUNNER_ENVIRONMENT !== 'self-hosted';
		default:
			throw new Error('Input `enable-cache` must be one of "true", "false", or "auto".');
	}
};

const getCacheDir = () => {
	const configured = process.env.TOMBI_CACHE_HOME?.trim();
	if (configured) return path.resolve(configured);

	if (os.platform() === 'win32') {
		const localAppData = process.env.LOCALAPPDATA?.trim();
		if (localAppData) return path.join(localAppData, 'tombi', 'cache');
	}

	if (os.platform() === 'darwin') return path.join(os.homedir(), 'Library', 'Caches', 'tombi');

	const xdgCacheHome = process.env.XDG_CACHE_HOME?.trim();
	if (xdgCacheHome) return path.join(xdgCacheHome, 'tombi');

	return path.join(os.homedir(), '.cache', 'tombi');
};

export const restoreTombiCache = async (keyPart: string) => {
	const cacheDir = getCacheDir();
	fs.mkdirSync(cacheDir, { recursive: true });
	core.exportVariable('TOMBI_CACHE_HOME', cacheDir);

	const baseKey = ['setup-tombi', CACHE_VERSION, os.platform(), os.arch()].join('-');
	const normalizedPart = keyPart.trim() || 'default';
	const normalizedPath = cacheDir.replace(/[\\/:\s]+/g, '-');
	const cacheKey = `${baseKey}-${normalizedPart}-${normalizedPath}`;
	core.saveState(STATE_CACHE_ENABLED, 'true');
	core.saveState(STATE_CACHE_KEY, cacheKey);
	core.saveState(STATE_CACHE_PATH, cacheDir);

	let restoredKey: string | undefined;
	try {
		restoredKey = await cache.restoreCache(
			[cacheDir],
			cacheKey,
			[`${baseKey}-`],
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to restore Tombi cache.';
		core.warning(message);
		core.setOutput('cache-hit', 'false');
		return;
	}

	if (!restoredKey) {
		core.info(`No GitHub Actions cache found for key: ${cacheKey}`);
		core.setOutput('cache-hit', 'false');
		return;
	}

	core.saveState(STATE_CACHE_MATCHED_KEY, restoredKey);
	core.info(`Restored Tombi cache from key: ${restoredKey}`);
	core.setOutput('cache-hit', 'true');
};

export async function saveTombiCache() {
	if (core.getState(STATE_CACHE_ENABLED) !== 'true') {
		core.info('Tombi cache was not enabled. Skipping cache save.');
		return;
	}

	const cacheKey = core.getState(STATE_CACHE_KEY);
	const matchedKey = core.getState(STATE_CACHE_MATCHED_KEY);
	const cacheDir = core.getState(STATE_CACHE_PATH);
	if (!cacheKey || !cacheDir) {
		core.info('Cache state is incomplete. Skipping cache save.');
		return;
	}

	if (matchedKey === cacheKey) {
		core.info(`Cache hit for primary key ${cacheKey}. Skipping cache save.`);
		return;
	}

	if (!fs.existsSync(cacheDir)) {
		core.info(`Cache directory does not exist: ${cacheDir}`);
		return;
	}

	await cache.saveCache([cacheDir], cacheKey);
	core.info(`Saved Tombi cache to key: ${cacheKey}`);
}
