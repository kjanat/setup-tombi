import { defineConfig } from 'tsdown';

export default defineConfig(
	[
		['index', 'src/index.ts'],
		['post', 'src/post.ts'],
	].map(([name, entry]) => ({
		entry: { [name]: entry },
		format: 'esm' as const,
		fixedExtension: true,
		dts: false,
		clean: true,
		outputOptions: { codeSplitting: false },
	})),
);
