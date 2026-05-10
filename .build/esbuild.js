'use strict';

const jsobfuscator = require('javascript-obfuscator');
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const productionMode = process.argv.includes('--mode=production');
const watchMode = process.argv.includes('--watch');

/**
 * @type {(import('esbuild').BuildOptions & { label: string, noMinify?: boolean })[]}
 */
const buildConfigs = [
    {
        label: 'client',
        platform: 'browser',
        entryPoints: ['./src/client/index.ts'],
        target: ['chrome93'],
        format: 'iife',
    },
];

const sharedOptions = (config, targetName) => ({
    bundle: true,
    assetNames: '[name].[ext]',
    outdir: 'dist/' + targetName,
    minify: productionMode && !config.noMinify,
    sourcemap: !productionMode,
    platform: config.platform,
    entryPoints: config.entryPoints,
    target: config.target,
    format: config.format,
    treeShaking: config.noMinify ? false : undefined,
});

async function obfuscateDirectory(dir, targetName) {
    const dirents = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const dirent of dirents) {
        const filePath = path.join(dir, dirent.name);

        if (dirent.isDirectory()) {
            await obfuscateDirectory(filePath, targetName);
            continue;
        }

        if (!dirent.isFile() || !filePath.endsWith('.js')) continue;

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

(async () => {
    for (const config of buildConfigs) {
        const targetName = config.label;
        const options = sharedOptions(config, targetName);

        try {
            if (watchMode) {
                // esbuild 0.17+: watch requires context()
                const ctx = await esbuild.context({ ...options, metafile: false });
                await ctx.watch();
                console.log(`[${targetName}]: Watching for changes...`);
            } else {
                const buildResult = await esbuild.build({ ...options, metafile: true });

                if (productionMode) {
                    const analysis = await esbuild.analyzeMetafile(buildResult.metafile, {
                        color: true,
                        verbose: true,
                    });
                    console.log(analysis);

                    const outDirectory = path.join(process.cwd(), 'dist', targetName);
                    await obfuscateDirectory(outDirectory, targetName);
                }
            }
        } catch (error) {
            console.error(`[${targetName}]: Build failed`, error);
        }
    }
})();