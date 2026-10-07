import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import { restoreTombiCache, shouldEnableCache } from '#cache';
import { resolveVersionFromLockfile, resolveVersionFromVersionFile } from '#lockfile/index';

const getDefaultTombiVersion = (actionDir: string) => {
	// Resolve at runtime so release version updates do not require rebuilding.
	const packageJsonPath = path.resolve(actionDir, '..', 'package.json');
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as { version?: unknown };

	if (typeof packageJson.version !== 'string' || !packageJson.version.trim()) {
		throw new Error(`Unable to determine the default Tombi version from ${packageJsonPath}`);
	}

	return packageJson.version;
};

export async function run() {
	try {
		const versionInput = core.getInput('version').trim();
		const lockfileInput = core.getInput('lockfile').trim();
		const versionFileInput = core.getInput('version-file').trim();
		const binaryChecksum = (core.getInput('binary-checksum').trim() || core.getInput('checksum').trim())
			.replace(/^sha256:/i, '').toLowerCase();
		const archiveChecksum = core.getInput('archive-checksum').trim();

		if ([versionInput, lockfileInput, versionFileInput].filter(Boolean).length > 1) {
			throw new Error('Inputs `version`, `lockfile`, and `version-file` are mutually exclusive.');
		}

		let version = versionInput;
		if (lockfileInput || versionFileInput) {
			version = lockfileInput
				? await resolveVersionFromLockfile(lockfileInput)
				: await resolveVersionFromVersionFile(versionFileInput);
			core.info(`Resolved Tombi version ${version} from ${lockfileInput || versionFileInput}`);
		} else if (!version) {
			version = getDefaultTombiVersion(import.meta.dirname);
		}

		const enableCache = shouldEnableCache(core.getInput('enable-cache'));

		if (enableCache) await restoreTombiCache(version);
		else core.info('Tombi cache is disabled.');

		const installDir = path.join(os.homedir(), '.local', 'bin');
		core.addPath(installDir);

		const installScriptUrl = 'https://tombi-toml.github.io/tombi/install.sh';
		core.info('Downloading Tombi install script...');
		const scriptPath = await tc.downloadTool(installScriptUrl);

		const args = ['--version', version, '--install-dir', installDir];
		if (archiveChecksum) args.push('--checksum', archiveChecksum);

		core.info(`Installing Tombi version ${version}...`);
		core.info(`Execute: bash "${scriptPath}" ${args.join(' ')}`);
		execFileSync('bash', [scriptPath, ...args], { stdio: 'inherit' });

		const binaryPath = path.join(installDir, os.platform() === 'win32' ? 'tombi.exe' : 'tombi');

		if (!fs.existsSync(binaryPath)) throw new Error(`Binary not found at ${binaryPath}`);

		if (binaryChecksum) {
			const fileBuffer = await fs.promises.readFile(binaryPath);
			const hex = createHash('sha256').update(fileBuffer).digest('hex');

			if (hex !== binaryChecksum) {
				throw new Error(`Checksum verification failed. Expected: ${binaryChecksum}, Got: ${hex}`);
			}
			core.info('Checksum verification passed');
		}

		const versionOutput = execFileSync(binaryPath, ['--version'], { encoding: 'utf8' });
		if (!versionOutput) throw new Error('Failed to verify installation: no version output');
		core.info(`Tombi installed successfully: ${versionOutput.trim()}`);
	} catch (error) {
		if (error instanceof Error) core.setFailed(error.message);
		else core.setFailed('An unexpected error occurred');
	}
}

if (process.env.NODE_ENV !== 'test') void run();
