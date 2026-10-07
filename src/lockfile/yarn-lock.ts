import { cleanResolvedVersion, escapeRegex, TYPESCRIPT_PACKAGE_ALIASES } from '#lockfile/common';

const hasYarnPackageSelector = (header: string) => {
	const headerWithoutColon = header.replace(/:\s*$/, '');
	return TYPESCRIPT_PACKAGE_ALIASES.some((packageName) => {
		return new RegExp(String.raw`(^|[\s,"'])${escapeRegex(packageName)}@`).test(headerWithoutColon);
	});
};

export const extractVersionFromYarnLock = (content: string) => {
	const lines = content.split(/\r?\n/);
	for (let i = 0; i < lines.length; i += 1) {
		const headerLine = lines[i];
		if (/^\s/.test(headerLine) || !headerLine.trimEnd().endsWith(':')) continue;
		if (!hasYarnPackageSelector(headerLine.trim())) continue;

		for (let j = i + 1; j < lines.length; j += 1) {
			const detailLine = lines[j];
			if (!/^\s/.test(detailLine) && detailLine.trimEnd().endsWith(':')) break;

			const version = detailLine.match(/^\s*version(?:\s*:\s*|\s+)["']?([^"'\s]+)/)?.[1];
			if (version) {
				const resolved = cleanResolvedVersion(version);
				if (resolved) return resolved;
			}
		}
	}

	return undefined;
};
