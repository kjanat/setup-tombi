import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractVersionFromBunLock } from '#lockfile/bun-lock';
import { MISE_TOOL_ALIASES, TYPESCRIPT_PACKAGE_ALIASES } from '#lockfile/common';
import { extractVersionFromMiseLock } from '#lockfile/mise-lock';
import { extractVersionFromPackageLock } from '#lockfile/package-lock';
import { extractVersionFromPnpmLock } from '#lockfile/pnpm-lock';
import { extractVersionFromPythonLock } from '#lockfile/python-lock';
import { extractVersionFromToolVersions } from '#lockfile/tool-versions';
import { extractVersionFromYarnLock } from '#lockfile/yarn-lock';

interface VersionParser {
	extract: (content: string) => string | undefined;
	packages: readonly string[];
}

const LOCKFILES = {
	'uv.lock': { extract: extractVersionFromPythonLock, packages: ['tombi'] },
	'poetry.lock': { extract: extractVersionFromPythonLock, packages: ['tombi'] },
	'pnpm-lock.yaml': { extract: extractVersionFromPnpmLock, packages: TYPESCRIPT_PACKAGE_ALIASES },
	'package-lock.json': { extract: extractVersionFromPackageLock, packages: TYPESCRIPT_PACKAGE_ALIASES },
	'yarn.lock': { extract: extractVersionFromYarnLock, packages: TYPESCRIPT_PACKAGE_ALIASES },
	'bun.lock': { extract: extractVersionFromBunLock, packages: TYPESCRIPT_PACKAGE_ALIASES },
	'mise.lock': { extract: extractVersionFromMiseLock, packages: MISE_TOOL_ALIASES },
};

const VERSION_FILES = { '.tool-versions': { extract: extractVersionFromToolVersions, packages: ['tombi'] } };

export const resolveVersionFromLockfile = (input: string) => readVersion(input, LOCKFILES, 'lock file');
export const resolveVersionFromVersionFile = (input: string) => readVersion(input, VERSION_FILES, 'version file');

const readVersion = async (
	input: string,
	parsers: Record<string, VersionParser>,
	fileKind: string,
) => {
	const name = path.basename(input);
	if (!Object.hasOwn(parsers, name)) {
		throw new Error(`Unsupported ${fileKind}: ${input}. Supported: ${Object.keys(parsers).join(', ')}`);
	}

	const parser = parsers[name];
	const content = await fs.promises.readFile(path.resolve(input), 'utf8');
	const version = parser.extract(content);
	if (!version) {
		const packages = parser.packages.map((name) => `\`${name}\``).join(' or ');
		throw new Error(`Package ${packages} was not found in ${fileKind}: ${input}`);
	}
	return version;
};
