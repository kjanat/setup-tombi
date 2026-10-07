import { cleanResolvedVersion, escapeRegex, getIndent, TYPESCRIPT_PACKAGE_ALIASES } from '#lockfile/common';

export const extractVersionFromPnpmLock = (content: string) => {
	for (const packageName of TYPESCRIPT_PACKAGE_ALIASES) {
		const pattern = new RegExp(String.raw`^\s*['"]?\/?${escapeRegex(packageName)}@([^:'"\s)]+)[^:]*:\s*$`, 'm');
		const version = content.match(pattern)?.[1];
		if (version) {
			const resolved = cleanResolvedVersion(version);
			if (resolved) return resolved;
		}
	}

	const lines = content.split(/\r?\n/);
	for (const packageName of TYPESCRIPT_PACKAGE_ALIASES) {
		const dependencyLinePattern = new RegExp(String.raw`^\s*['"]?${escapeRegex(packageName)}['"]?\s*:\s*$`);

		for (let i = 0; i < lines.length; i += 1) {
			if (!dependencyLinePattern.test(lines[i])) continue;

			const baseIndent = getIndent(lines[i]);
			for (let j = i + 1; j < lines.length; j += 1) {
				const nextLine = lines[j];
				if (nextLine.trim() === '') continue;

				const nextIndent = getIndent(nextLine);
				if (nextIndent <= baseIndent) break;

				const version = nextLine.match(/^\s*version\s*:\s*["']?([^"'\s#]+)["']?/)?.[1];
				if (version) {
					const resolved = cleanResolvedVersion(version);
					if (resolved) return resolved;
				}
			}
		}
	}

	return undefined;
};
