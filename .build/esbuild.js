'use strict';

const jsobfuscator = require('javascript-obfuscator');
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const productionMode = process.argv.findIndex((arg) => arg === '--mode=production') >= 0;
const watchMode = process.argv.findIndex((arg) => arg === '--watch') >= 0;

(async () => {
    /**
     * @type {(import('esbuild').BuildOptions & { label: string })[]}
     */
    const buildConfigs = [
        {
            label: 'client',
            platform: 'browser',
            entryPoints: ['./src/client/index.ts'],
            target: ['chrome93'],
            format: 'iife',
        },
        {
            label: 'shared',
            platform: 'neutral',
            entryPoints: ['./src/shared/index.ts'],
            target: ['es2020'],
            format: 'cjs',
            noMinify: true,
        },
    ];

    for (const config of buildConfigs) {
        const targetName = config.label;
        delete config.label;

        const buildOptions = { ...config };
        delete buildOptions.noMinify;
        delete buildOptions.noObfuscate;

        if (config.noMinify) {
            buildOptions.treeShaking = false;
        }

        try {
            const buildResult = await esbuild.build({
                bundle: true,
                assetNames: `[name].[ext]`,
                outdir: 'dist/' + targetName,
                minify: productionMode && !config.noMinify,
                sourcemap: !productionMode,
                metafile: true,
                watch: watchMode
                    ? {
                          onRebuild: (err, res) => {
                              if (err) {
                                  return console.error(`[${targetName}]: Rebuild failed`, err);
                              }
                              console.log(`[${targetName}]: Rebuild succeeded, warnings:`, res.warnings);
                          },
                      }
                    : false,
                ...buildOptions,
            });

                if (productionMode) {
                const analysis = await esbuild.analyzeMetafile(buildResult.metafile, {
                    color: true,
                    verbose: true,
                });

                console.log(analysis);

                const outDirectory = path.join(process.cwd(), 'dist', targetName);

                async function obfuscateDirectory(dir) {
                    const dirents = await fs.promises.readdir(dir, { withFileTypes: true });

                    for (const dirent of dirents) {
                        const filePath = path.join(dir, dirent.name);

                        if (dirent.isDirectory()) {
                            await obfuscateDirectory(filePath);
                            continue;
                        }

                        if (!dirent.isFile()) continue;

                        if (filePath.endsWith('.js')) {
                            try {
                                const sourceCode = await fs.promises.readFile(filePath, 'utf8');
                                const obfuscated = jsobfuscator.obfuscate(sourceCode, {
                                    compact: true,
                                    controlFlowFlattening: true,
                                    controlFlowFlatteningThreshold: 0.75,
                                    deadCodeInjection: true,
                                    deadCodeInjectionThreshold: 0.4,
                                    debugProtection: false,
                                    disableConsoleOutput: false,
                                    identifierNamesGenerator: 'hexadecimal',
                                    renameGlobals: false,
                                    rotateStringArray: true,
                                    stringArray: true,
                                    stringArrayEncoding: ['rc4'],
                                    stringArrayThreshold: 0.75,
                                }).getObfuscatedCode();

                                await fs.promises.writeFile(filePath, obfuscated, 'utf8');
                                console.log(`[${targetName}]: Obfuscated ${path.relative(process.cwd(), filePath)}`);
                            } catch (err) {
                                console.error(`[${targetName}]: Failed to obfuscate ${filePath}`, err);
                            }
                        }
                    }
                }

                try {
                    await obfuscateDirectory(outDirectory);
                } catch (err) {
                    console.error(`[${targetName}]: Obfuscation failed`, err);
                }
            }
        } catch (error) {
            console.error(`[${targetName}]: Build failed`, error);
        }
    }
})();