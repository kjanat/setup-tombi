import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveInstallVersion } from './version';

const release = (tag_name: string, overrides = {}) => ({ tag_name, draft: false, prerelease: false, ...overrides });
const response = (body: unknown, next = false) =>
	new Response(JSON.stringify(body), {
		status: 200,
		headers: next ? { link: '<https://api.github.com/repos/tombi-toml/tombi/releases?page=2>; rel="next"' } : {},
	});

afterEach(() => vi.unstubAllGlobals());

describe('partial Tombi versions', () => {
	it.each(['1.9', 'v1.9', '1', 'v1'])('resolves %s numerically, not lexically or by API order', async (pin) => {
		const fetcher = vi.fn().mockResolvedValue(response([
			release('v1.9.9'),
			release('v1.9.10'),
			release('v1.8.99'),
			release('v2.0.0'),
			release('v1.9.20-rc.1', { prerelease: true }),
			release('v1.9.99', { draft: true }),
			release('garbage'),
			release('v1.9.100', { prerelease: true }),
			null,
		]));
		vi.stubGlobal('fetch', fetcher);
		expect(await resolveInstallVersion(pin)).toBe('1.9.10');
	});

	it('selects the highest major match, including later pages', async () => {
		const fetcher = vi.fn()
			.mockResolvedValueOnce(response([release('v1.9.10')], true))
			.mockResolvedValueOnce(response([release('v1.10.0'), release('v2.0.0')]));
		vi.stubGlobal('fetch', fetcher);
		expect(await resolveInstallVersion('1', 'test-token')).toBe('1.10.0');
		expect(fetcher.mock.calls[1][0]).toContain('page=2');
		expect(fetcher.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token');
	});

	it.each(['1.9.0', '1.9.1-rc.1', 'latest'])('keeps %s offline and unchanged', async (version) => {
		const fetcher = vi.fn();
		vi.stubGlobal('fetch', fetcher);
		expect(await resolveInstallVersion(version)).toBe(version);
		expect(fetcher).not.toHaveBeenCalled();
	});

	it('fails clearly when no stable release matches', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response([release('v2.0.0')])));
		await expect(resolveInstallVersion('1.9')).rejects.toThrow('No published stable Tombi release matches 1.9');
	});

	it.each([403, 404, 429, 503])('does not fall back to an invalid literal pin on HTTP %s', async (status) => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status })));
		await expect(resolveInstallVersion('1.9')).rejects.toThrow(`HTTP ${status}`);
	});

	it('rejects malformed release metadata', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ message: 'unexpected' })));
		await expect(resolveInstallVersion('1.9')).rejects.toThrow('expected an array');
	});

	it('bounds pagination instead of choosing from incomplete metadata', async () => {
		const fetcher = vi.fn().mockImplementation(async () => response([release('v1.9.0')], true));
		vi.stubGlobal('fetch', fetcher);
		await expect(resolveInstallVersion('1.9')).rejects.toThrow('pagination exceeded 20 pages');
		expect(fetcher).toHaveBeenCalledTimes(20);
	});
});
