import { cleanResolvedVersion } from '#lockfile/common';

// uv and Poetry both store packages in TOML [[package]] blocks.
export const extractVersionFromPythonLock = (content: string) => {
	for (const block of content.split(/^\s*\[\[package\]\]\s*$/m).slice(1)) {
		const name = block.match(/^\s*name\s*=\s*["']([^"']+)["']/m)?.[1];
		if (name !== 'tombi') continue;
		const version = block.match(/^\s*version\s*=\s*["']([^"']+)["']/m)?.[1];
		if (version) {
			const resolved = cleanResolvedVersion(version);
			if (resolved) return resolved;
		}
	}
	return undefined;
};
