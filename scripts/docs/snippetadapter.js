/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* eslint-env node */

const path = require( 'path' );
const fs = require( 'fs' );
const minimatch = require( 'minimatch' );
const webpack = require( 'webpack' );
const { bundler, styles } = require( '@ckeditor/ckeditor5-dev-utils' );
const CKEditorWebpackPlugin = require( '@ckeditor/ckeditor5-dev-webpack-plugin' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const UglifyJsWebpackPlugin = require( 'uglifyjs-webpack-plugin' );
const ProgressBarPlugin = require( 'progress-bar-webpack-plugin' );

const DEFAULT_LANGUAGE = 'en';
const MULTI_LANGUAGE = 'multi-language';

/**
 * @param {Set.<Snippet>} snippets Snippet collection extracted from documentation files.
 * @param {Object} options
 * @param {Boolean} options.production Whether to build snippets in production mode.
 * @param {Array.<String>|undefined} options.whitelistedSnippets An array that contains glob patterns.
 * @param {Object.<String, Function>} umbertoHelpers
 * @returns {Promise}
 */
module.exports = function snippetAdapter( snippets, options, umbertoHelpers ) {
	const { getSnippetPlaceholder, getSnippetSourcePaths } = umbertoHelpers;
	const snippetsDependencies = new Map();

	// For each snippet, load its config. If the snippet has defined dependencies, load those as well.
	for ( const snippetData of snippets ) {
		if ( !snippetData.snippetSources.js ) {
			throw new Error( `Missing snippet source for "${ snippetData.snippetName }".` );
		}

		snippetData.snippetConfig = readSnippetConfig( snippetData.snippetSources.js );
		snippetData.snippetConfig.language = snippetData.snippetConfig.language || DEFAULT_LANGUAGE;

		// If, in order to work, a snippet requires another snippet to be built, and the other snippet
		// isn't included in any guide via `{@snippet ...}`, then that other snippet need to be marked
		// as a dependency of the first one. Example – bootstrap UI uses an iframe, and inside that iframe we
		// need a JS file. That JS file needs to be built, even though it's not a real snippet (and it's not used
		// via {@snippet}).
		if ( snippetData.snippetConfig.dependencies ) {
			for ( const dependencyName of snippetData.snippetConfig.dependencies ) {
				// Do not load the same dependency more than once.
				if ( snippetsDependencies.has( dependencyName ) ) {
					continue;
				}

				// Find a root path where to look for the snippet's sources. We just want to pass it through Webpack.
				const snippetBasePathRegExp = new RegExp( snippetData.snippetName.replace( /\//g, '\\/' ) + '.*$' );
				const snippetBasePath = snippetData.snippetSources.js.replace( snippetBasePathRegExp, '' );

				const dependencySnippet = {
					snippetSources: getSnippetSourcePaths( snippetBasePath, dependencyName ),
					snippetName: dependencyName,
					outputPath: snippetData.outputPath,
					destinationPath: snippetData.destinationPath,
					requiredFor: snippetData
				};

				if ( !dependencySnippet.snippetSources.js ) {
					throw new Error( `Missing snippet source for "${ dependencySnippet.snippetName }".` );
				}

				dependencySnippet.snippetConfig = readSnippetConfig( dependencySnippet.snippetSources.js );
				dependencySnippet.snippetConfig.language = dependencySnippet.snippetConfig.language || DEFAULT_LANGUAGE;

				snippetsDependencies.set( dependencyName, dependencySnippet );
			}
		}
	}

	// Add all dependencies to the snippet collection.
	for ( const snippetData of snippetsDependencies.values() ) {
		snippets.add( snippetData );
	}

	// Remove snippets that do not match to patterns specified in `options.whitelistedSnippets`.
	if ( options.whitelistedSnippets ) {
		filterWhitelistedSnippets( snippets, options.whitelistedSnippets );
	}

	console.log( `Building ${ snippets.size } snippets...` );

	const groupedSnippetsByLanguage = {};

	// Group snippets by language. There is no way to build different languages in a single Webpack process.
	// Webpack must be called as many times as different languages are being used in snippets.
	for ( const snippetData of snippets ) {
		// Multi-languages editors must be built separately.
		if ( snippetData.snippetConfig.additionalLanguages ) {
			snippetData.snippetConfig.additionalLanguages.push( snippetData.snippetConfig.language );
			snippetData.snippetConfig.language = MULTI_LANGUAGE;
		}

		if ( !groupedSnippetsByLanguage[ snippetData.snippetConfig.language ] ) {
			groupedSnippetsByLanguage[ snippetData.snippetConfig.language ] = new Set();
		}

		groupedSnippetsByLanguage[ snippetData.snippetConfig.language ].add( snippetData );
	}

	// For each language prepare own Webpack configuration.
	const webpackConfigs = Object.keys( groupedSnippetsByLanguage )
		.map( language => {
			return getWebpackConfig( groupedSnippetsByLanguage[ language ], {
				language,
				production: options.production,
				definitions: options.definitions || {}
			} );
		} );

	let promise = Promise.resolve();

	// Nothing to build.
	if ( !webpackConfigs.length ) {
		return promise;
	}

	for ( const config of webpackConfigs ) {
		promise = promise.then( () => runWebpack( config ) );
	}

	return promise
		.then( () => {
			// Group snippets by destination path in order to attach required HTML code and assets (CSS and JS).
			const groupedSnippetsByDestinationPath = {};

			for ( const snippetData of snippets ) {
				if ( !groupedSnippetsByDestinationPath[ snippetData.destinationPath ] ) {
					groupedSnippetsByDestinationPath[ snippetData.destinationPath ] = new Set();
				}

				groupedSnippetsByDestinationPath[ snippetData.destinationPath ].add( snippetData );
			}

			// For every page that contains at least one snippet, we need to replace Umberto comments with HTML code.
			for ( const destinationPath of Object.keys( groupedSnippetsByDestinationPath ) ) {
				const snippetsOnPage = groupedSnippetsByDestinationPath[ destinationPath ];

				// Assets required for the all snippets.
				const cssFiles = [];
				const jsFiles = [];

				let content = fs.readFileSync( destinationPath ).toString();

				for ( const snippetData of snippetsOnPage ) {
					// CSS may not be generated by Webpack if a snippet's JS file didn't import any CSS files.
					const wasCSSGenerated = fs.existsSync( path.join( snippetData.outputPath, snippetData.snippetName, 'snippet.css' ) );

					// If the snippet is a dependency, append JS and CSS to HTML, save to disk and continue.
					if ( snippetData.requiredFor ) {
						let htmlFile = fs.readFileSync( snippetData.snippetSources.html ).toString();

						if ( wasCSSGenerated ) {
							htmlFile += '<link rel="stylesheet" href="snippet.css" type="text/css">';
						}

						htmlFile += '<script src="snippet.js"></script>';

						fs.writeFileSync( path.join( snippetData.outputPath, snippetData.snippetName, 'snippet.html' ), htmlFile );

						continue;
					}

					let snippetHTML = fs.readFileSync( snippetData.snippetSources.html ).toString();

					if ( snippetHTML.trim() ) {
						snippetHTML = snippetHTML.replace( /%BASE_PATH%/g, snippetData.basePath );
						snippetHTML = `<div class="live-snippet">${ snippetHTML }</div>`;
					}

					content = content.replace( getSnippetPlaceholder( snippetData.snippetName ), snippetHTML );

					jsFiles.push( path.join( snippetData.basePath, 'assets', 'snippet.js' ) );
					jsFiles.push( path.join( snippetData.relativeOutputPath, snippetData.snippetName, 'snippet.js' ) );

					cssFiles.push( path.join( snippetData.basePath, 'assets', 'snippet-styles.css' ) );

					if ( wasCSSGenerated ) {
						cssFiles.unshift( path.join( snippetData.relativeOutputPath, snippetData.snippetName, 'snippet.css' ) );
					}

					// Additional languages must be imported by the HTML code.
					if ( snippetData.snippetConfig.additionalLanguages ) {
						snippetData.snippetConfig.additionalLanguages.forEach( language => {
							jsFiles.push( path.join( snippetData.relativeOutputPath, 'translations', `${ language }.js` ) );
						} );
					}
				}

				const cssImportsHTML = getHTMLImports( cssFiles, importPath => {
					return `    <link rel="stylesheet" href="${ importPath }" type="text/css">`;
				} );

				const jsImportsHTML = getHTMLImports( jsFiles, importPath => {
					return `    <script src="${ importPath }"></script>`;
				} );

				content = content.replace( '<!--UMBERTO: SNIPPET: CSS-->', cssImportsHTML );
				content = content.replace( '<!--UMBERTO: SNIPPET: JS-->', jsImportsHTML );

				fs.writeFileSync( destinationPath, content );
			}
		} )
		.then( () => {
			console.log( `Finished building ${ snippets.size } snippets.` );
		} );
};

/**
 * Removes snippets that names do not match to patterns specified in `whitelistedSnippets` array.
 *
 * @param {Set.<Snippet>} snippets Snippet collection extracted from documentation files.
 * @param {Array.<String>|undefined} whitelistedSnippets Snippet patterns that should be built.
 */
function filterWhitelistedSnippets( snippets, whitelistedSnippets ) {
	if ( !whitelistedSnippets.length ) {
		return;
	}

	const snippetsToBuild = new Set();

	// Find all snippets that matched to specified criteria.
	for ( const snippetData of snippets ) {
		const shouldBeBuilt = whitelistedSnippets.some( pattern => {
			return minimatch( snippetData.snippetName, pattern ) || snippetData.snippetName.includes( pattern );
		} );

		if ( shouldBeBuilt ) {
			snippetsToBuild.add( snippetData );
		}
	}

	// Find all dependencies that are required for whitelisted snippets.
	for ( const snippetData of snippets ) {
		if ( snippetsToBuild.has( snippetData ) ) {
			continue;
		}

		if ( snippetData.requiredFor && snippetsToBuild.has( snippetData.requiredFor ) ) {
			snippetsToBuild.add( snippetData );
		}
	}

	// Remove snippets that won't be built and aren't dependencies of other snippets.
	for ( const snippetData of snippets ) {
		if ( !snippetsToBuild.has( snippetData ) ) {
			snippets.delete( snippetData );
		}
	}
}

/**
 * Prepares configuration for Webpack.
 *
 * @param {Set.<Snippet>} snippets Snippet collection extracted from documentation files.
 * @param {Object} config
 * @param {String} config.language Language for the build.
 * @param {Boolean} config.production Whether to build for production.
 * @param {Object} config.definitions
 * @returns {Object}
 */
function getWebpackConfig( snippets, config ) {
	// Stringify all definitions values. The `DefinePlugin` injects definition values as they are so we need to stringify them,
	// so they will become real strings in the generated code. See https://webpack.js.org/plugins/define-plugin/ for more information.
	const definitions = {};

	for ( const definitionKey in config.definitions ) {
		definitions[ definitionKey ] = JSON.stringify( config.definitions[ definitionKey ] );
	}

	const ckeditorWebpackPluginOptions = {};

	if ( config.language === MULTI_LANGUAGE ) {
		const additionalLanguages = new Set();

		// Find all additional languages that must be built.
		for ( const snippetData of snippets ) {
			for ( const language of snippetData.snippetConfig.additionalLanguages ) {
				additionalLanguages.add( language );
			}
		}

		// Pass unique values of `additionalLanguages` to `CKEditorWebpackPlugin`.
		ckeditorWebpackPluginOptions.additionalLanguages = [ ...additionalLanguages ];

		// Also, set the default language because of the warning that comes from the plugin.
		ckeditorWebpackPluginOptions.language = DEFAULT_LANGUAGE;
	} else {
		ckeditorWebpackPluginOptions.language = config.language;
	}

	const webpackConfig = {
		mode: config.production ? 'production' : 'development',

		devtool: 'source-map',

		entry: {},

		output: {
			filename: '[name]/snippet.js'
		},

		optimization: {
			minimizer: [
				new UglifyJsWebpackPlugin( {
					sourceMap: true,
					uglifyOptions: {
						output: {
							// Preserve license comments starting with an exclamation mark.
							comments: /^!/
						}
					}
				} )
			]
		},

		plugins: [
			new MiniCssExtractPlugin( { filename: '[name]/snippet.css' } ),
			new CKEditorWebpackPlugin( ckeditorWebpackPluginOptions ),
			new webpack.BannerPlugin( {
				banner: bundler.getLicenseBanner(),
				raw: true
			} ),
			new webpack.DefinePlugin( definitions ),
			new ProgressBarPlugin( {
				format: `Building snippets for language "${ config.language }": :percent (:msg)`,
			} )
		],

		// Configure the paths so building CKEditor 5 snippets work even if the script
		// is triggered from a directory outside ckeditor5 (e.g. multi-project case).
		resolve: {
			modules: getModuleResolvePaths()
		},

		resolveLoader: {
			modules: getModuleResolvePaths()
		},

		module: {
			rules: [
				{
					test: /\.svg$/,
					use: [ 'raw-loader' ]
				},
				{
					test: /\.css$/,
					use: [
						MiniCssExtractPlugin.loader,
						'css-loader',
						{
							loader: 'postcss-loader',
							options: styles.getPostCssConfig( {
								themeImporter: {
									themePath: require.resolve( '@ckeditor/ckeditor5-theme-lark' )
								},
								minify: config.production
							} )
						}
					]
				}
			]
		}
	};

	for ( const snippetData of snippets ) {
		if ( !webpackConfig.output.path ) {
			webpackConfig.output.path = snippetData.outputPath;
		}

		if ( webpackConfig.entry[ snippetData.snippetName ] ) {
			continue;
		}

		webpackConfig.entry[ snippetData.snippetName ] = snippetData.snippetSources.js;
	}

	return webpackConfig;
}

/**
 * Builds snippets.
 *
 * @param {Object} webpackConfig
 * @returns {Promise}
 */
function runWebpack( webpackConfig ) {
	return new Promise( ( resolve, reject ) => {
		webpack( webpackConfig, ( err, stats ) => {
			if ( err ) {
				reject( err );
			} else if ( stats.hasErrors() ) {
				reject( new Error( stats.toString() ) );
			} else {
				resolve();
			}
		} );
	} );
}

/**
 * @returns {Array.<String>}
 */
function getModuleResolvePaths() {
	return [
		path.resolve( __dirname, '..', '..', 'node_modules' ),
		'node_modules'
	];
}

/**
 * Reads the snippet's configuration.
 *
 * @param {String} snippetSourcePath An absolute path to the file.
 * @returns {Object}
 */
function readSnippetConfig( snippetSourcePath ) {
	const snippetSource = fs.readFileSync( snippetSourcePath ).toString();

	const configSourceMatch = snippetSource.match( /\n\/\* config ([\s\S]+?)\*\// );

	if ( !configSourceMatch ) {
		return {};
	}

	return JSON.parse( configSourceMatch[ 1 ] );
}

/**
 * Removes duplicated entries specified in `files` array and map those entires using `mapFunction`.
 *
 * @param {Array.<String>} files Paths collection.
 * @param {Function} mapFunction Function that should return a string.
 * @returns {String}
 */
function getHTMLImports( files, mapFunction ) {
	return [ ...new Set( files ) ]
		.map( mapFunction )
		.join( '\n' )
		.replace( /^\s+/, '' );
}

/**
 * @typedef {Object} Snippet
 *
 * @property {SnippetSource} snippetSources Sources of the snippet.
 *
 * @property {String} snippetName Name of the snippet. Defined directly after `@snippet` tag.
 *
 * @property {String} outputPath An absolute path where to write file produced by the `snippetAdapter`.
 *
 * @property {String} destinationPath An absolute path to the file where the snippet is being used.
 *
 * @property {SnippetConfiguration} snippetConfig={} Additional configuration of the snippet. It's being read from the snippet's source.
 *
 * @property {String} [basePath] Relative path from the processed file to the root of the documentation.
 *
 * @property {String} [relativeOutputPath] The same like `basePath` but for the output path (where processed file will be saved).
 *
 * @property {Snippet|undefined} [requiredFor] If the value is instance of `Snippet`, current snippet requires
 * the snippet defined as `requiredFor` to work.
 */

/**
 * @typedef {Object} SnippetSource
 *
 * @property {String} html An absolute path to the HTML sample.
 *
 * @property {String} css An absolute path to the CSS sample.
 *
 * @property {String} js An absolute path to the JS sample.
 */

/**
 * @typedef {Object} SnippetConfiguration
 *
 * @property {String} [language] A language that will be used for building the editor.
 *
 * @property {Array.<String>} [dependencies] Names of samples that are required to working.
 *
 * @property {Array.<String>} [additionalLanguages] Additional languages that are required by the snippet.
 */
