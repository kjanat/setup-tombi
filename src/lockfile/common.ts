export const TYPESCRIPT_PACKAGE_ALIASES = ['tombi', '@tombi-toml/tombi'] as const;
export const MISE_TOOL_ALIASES = ['tombi', 'aqua:tombi-toml/tombi', 'github:tombi-toml/tombi'] as const;

export const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const asRecord = (value: unknown) => {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
	return value as Record<string, unknown>;
};

export const getIndent = (line: string) => line.match(/^\s*/)?.[0].length ?? 0;

export const cleanResolvedVersion = (version: string) => {
	const withoutQuotes = version.trim().replace(/^["']|["']$/g, '');
	const withoutDelimiter = withoutQuotes.replace(/[,:]$/, '');
	const withoutPeerSuffix = withoutDelimiter.split('(')[0].trim();
	if (withoutPeerSuffix.startsWith('npm:')) return withoutPeerSuffix.slice(4);
	return withoutPeerSuffix;
};
