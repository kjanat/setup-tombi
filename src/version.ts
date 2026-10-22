import { evaluateVersions } from '@actions/tool-cache';

const releasesUrl = 'https://api.github.com/repos/tombi-toml/tombi/releases';
const maxReleasePages = 20;

// Exact pins and installer aliases retain their existing behavior. Resolve
// major/minor pins before installation and caching: install.sh requires a
// concrete release, not the literal tag v1.9 for a request such as 1.9.
export async function resolveInstallVersion(requested: string, token = ''): Promise<string> {
	if (!/^v?(0|[1-9]\d*)(?:\.(0|[1-9]\d*))?$/.test(requested)) return requested;

	const versions: string[] = [];
	for (let page = 1; page <= maxReleasePages; page++) {
		const response = await fetch(`${releasesUrl}?per_page=100&page=${page}`, {
			headers: {
				Accept: 'application/vnd.github+json',
				'User-Agent': 'setup-tombi',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			signal: AbortSignal.timeout(10_000),
		});
		if (!response.ok) {
			throw new Error(`Unable to resolve Tombi ${requested}: GitHub releases returned HTTP ${response.status}.`);
		}
		const releases: unknown = await response.json();
		if (!Array.isArray(releases)) throw new Error('Invalid Tombi release list: expected an array.');
		for (const release of releases) {
			if (release === null || typeof release !== 'object') continue;
			const { tag_name: tag, draft, prerelease } = release;
			if (draft !== false || prerelease !== false || typeof tag !== 'string') continue;
			if (/^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag)) versions.push(tag.replace(/^v/, ''));
		}
		if (!response.headers.get('link')?.includes('rel="next"')) {
			const resolved = evaluateVersions(versions, requested.replace(/^v/, ''));
			if (!resolved) throw new Error(`No published stable Tombi release matches ${requested}.`);
			return resolved;
		}
	}
	throw new Error(`Unable to resolve Tombi ${requested}: release pagination exceeded ${maxReleasePages} pages.`);
}
