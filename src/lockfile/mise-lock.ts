import { cleanResolvedVersion, MISE_TOOL_ALIASES } from '#lockfile/common';

const lineEndRx = /\r?\n/;
const headerRx = /^\s*\[\[tools\.(?:"([^"]+)"|([^\]]+))\]\]\s*$/;
const versionRx = /^\s*version\s*=\s*["']([^"']+)["']/;
const toolsRx = /^\s*\[\[tools\./;

export const extractVersionFromMiseLock = (content: string) => {
	const lines = content.split(lineEndRx);

	for (let i = 0; i < lines.length; i += 1) {
		const headerMatch = lines[i].match(headerRx);
		if (!headerMatch) continue;

		const toolName = headerMatch[1] ?? headerMatch[2]?.trim();
		if (!MISE_TOOL_ALIASES.some((alias) => alias === toolName)) continue;

		for (let j = i + 1; j < lines.length; j += 1) {
			if (toolsRx.test(lines[j])) break;

			const versionMatch = lines[j].match(versionRx);
			if (versionMatch?.[1]) return cleanResolvedVersion(versionMatch[1]);
		}
	}

	return undefined;
};
