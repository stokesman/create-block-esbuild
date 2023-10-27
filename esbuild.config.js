const esbuild = require( 'esbuild' );
const path = require( 'path' );
const fs = require( 'fs' );
const json2php = require( 'json2php' );
const {
	defaultRequestToExternal,
	defaultRequestToHandle
} = require( '@wordpress/dependency-extraction-webpack-plugin/lib/util.js' );

const args = process.argv.slice( 2 );

/**
 * Based on https://github.com/evanw/esbuild/issues/337#issuecomment-706765332.
 * 
 * @type {import('esbuild').Plugin}
 */
const DependencyExtractionPlugin = {
	name: 'dependency-extraction',
	setup( build ) {
		const options = build.initialOptions
		const extractedMap = new Map;
		const handles = [];

		build.onResolve( { filter: /^[^.]/ }, ( { path } ) => {
			const global = defaultRequestToExternal( path );
			if ( ! global ) return;

			extractedMap.set( path, global );
			return { path, namespace: 'wp-globals' };
		} );

		build.onLoad( { filter: /.*/, namespace: 'wp-globals' }, ( { path } ) => {
			// Store handles for later.
			handles.push( defaultRequestToHandle( path ) );
			const global = extractedMap.get( path );

			return {
				contents: `module.exports = window.${
					Array.isArray( global ) ? global.join( '.') : global
				}`,
			}
		});

		build.onEnd( () => {
			const data = {
				dependencies: Array.from( handles ).sort(),
				version: null,
			};

			const contents = `<?php return ${ json2php(
				JSON.parse( JSON.stringify( data ) )
			) };`;

			fs.writeFileSync( path.resolve( options.outdir, 'index.asset.php' ), contents );
		});
	},
}

esbuild.build({
	entryPoints: [
		'src/index.js',
		'src/style.css',
	],
	outdir: 'build',
	bundle: true,
	format: 'iife',
	platform: 'browser',
	loader: { '.js': 'jsx' },
	minify: args.includes('--minify'),
	watch: args.includes('--watch'),
	logLevel: 'info',
	jsxFactory: 'wp.element.createElement',
	jsxFragment: 'wp.element.Fragment',
	plugins: [DependencyExtractionPlugin],
}).catch(() => process.exit(1))
