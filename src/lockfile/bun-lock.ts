import { cleanResolvedVersion, escapeRegex, TYPESCRIPT_PACKAGE_ALIASES } from '#lockfile/common';

export const extractVersionFromBunLock = (content: string) => {
	for (const packageName of TYPESCRIPT_PACKAGE_ALIASES) {
		const pattern = new RegExp(`${escapeRegex(packageName)}@([0-9][0-9A-Za-z.+-]*)`);
		const version = content.match(pattern)?.[1];
		if (version) return cleanResolvedVersion(version);
	}
	return undefined;
};
