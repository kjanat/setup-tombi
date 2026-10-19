import { cleanResolvedVersion, MISE_TOOL_ALIASES } from '#lockfile/common';

export const extractVersionFromToolVersions = (content: string) => {
	for (const line of content.split(/\r?\n/)) {
		const [name, version] = line.split('#', 1)[0].trim().split(/\s+/);
		if (MISE_TOOL_ALIASES.some((alias) => alias === name) && version) {
			const resolved = cleanResolvedVersion(version);
			if (resolved) return resolved;
		}
	}

	return undefined;
};
