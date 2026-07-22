import { build } from 'esbuild';

await build({
    entryPoints: {
        app: 'js/app.js',
        admin: 'js/admin.js',
        'static-site-config': 'js/static-site-config.js'
    },
    outdir: 'js/dist',
    entryNames: '[name].min',
    bundle: true,
    minify: true,
    format: 'esm',
    target: ['es2022'],
    legalComments: 'none',
    sourcemap: false
});
