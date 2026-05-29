import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const roots = [
    'js',
    'test'
];

async function collectJavaScriptFiles(directory) {
    let files = [];

    try {
        const entries =
            await readdir(
                directory,
                {
                    withFileTypes: true
                }
            );

        for (const entry of entries) {
            const fullPath =
                join(directory, entry.name);

            if (entry.isDirectory()) {
                files =
                    files.concat(
                        await collectJavaScriptFiles(fullPath)
                    );
                continue;
            }

            if (
                entry.name.endsWith('.js') ||
                entry.name.endsWith('.mjs')
            ) {
                files.push(fullPath);
            }
        }
    } catch {
        return files;
    }

    return files;
}

const files =
    (
        await Promise.all(
            roots.map(collectJavaScriptFiles)
        )
    ).flat();

let failed = false;

for (const file of files) {
    const result =
        spawnSync(
            process.execPath,
            [
                '--check',
                file
            ],
            {
                stdio: 'inherit'
            }
        );

    if (result.status !== 0) {
        failed = true;
    }
}

if (failed) {
    process.exit(1);
}
