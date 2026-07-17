import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const htmlFiles = [
    'index.html',
    'dtf-textil.html',
    'dtf-uv.html',
    'stickers.html',
    'tienda.html',
    'admin.html'
];

const errors = [];
const cssFiles = [
    'css/styles.css',
    'css/admin.css'
];

async function fileExists(filePath) {
    try {
        await access(filePath);
        return true;
    } catch {
        return false;
    }
}

function isLocalReference(reference) {
    return !(
        !reference ||
        reference.startsWith('#') ||
        reference.startsWith('data:') ||
        reference.startsWith('mailto:') ||
        reference.startsWith('tel:') ||
        reference.startsWith('http://') ||
        reference.startsWith('https://')
    );
}

function validateCssBraces(filePath, source) {
    const withoutCommentsAndStrings =
        source
            .replace(/\/\*[\s\S]*?\*\//g, match => match.replace(/[^\n]/g, ' '))
            .replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g, match => match.replace(/[^\n]/g, ' '));

    const openings = [];

    for (let index = 0; index < withoutCommentsAndStrings.length; index += 1) {
        const character = withoutCommentsAndStrings[index];

        if (character === '{') {
            openings.push(index);
            continue;
        }

        if (character === '}') {
            if (openings.length === 0) {
                errors.push(`${filePath}: llave de cierre sin apertura.`);
                return;
            }

            openings.pop();
        }
    }

    if (openings.length > 0) {
        errors.push(`${filePath}: bloque CSS sin cerrar.`);
    }
}

for (const htmlFile of htmlFiles) {
    const source =
        await readFile(htmlFile, 'utf8');

    const ids =
        Array.from(
            source.matchAll(/\bid="([^"]+)"/g),
            match => match[1]
        );

    const duplicateIds =
        ids.filter((id, index) => ids.indexOf(id) !== index);

    for (const id of new Set(duplicateIds)) {
        errors.push(`${htmlFile}: ID duplicado "${id}".`);
    }

    const references =
        Array.from(
            source.matchAll(/\b(?:href|src)="([^"]+)"/g),
            match => match[1]
        )
            .filter(isLocalReference);

    for (const reference of references) {
        const cleanReference =
            decodeURIComponent(reference.split(/[?#]/, 1)[0]);

        const resolvedReference =
            resolve(dirname(htmlFile), cleanReference);

        if (!await fileExists(resolvedReference)) {
            errors.push(`${htmlFile}: referencia local inexistente "${reference}".`);
        }
    }
}

for (const cssFile of cssFiles) {
    validateCssBraces(cssFile, await readFile(cssFile, 'utf8'));
}

const indexSource =
    await readFile('index.html', 'utf8');

const headersSource =
    await readFile('_headers', 'utf8');

const metaCsp =
    indexSource.match(
        /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)">/
    )?.[1] || '';

const inlineScripts =
    Array.from(
        indexSource.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)
    )
        .filter(match => !/\bsrc=/.test(match[1]));

for (const [, , scriptContent] of inlineScripts) {
    const hash =
        `sha256-${createHash('sha256').update(scriptContent).digest('base64')}`;

    if (!metaCsp.includes(`'${hash}'`)) {
        errors.push(`index.html: la CSP meta no contiene ${hash}.`);
    }

    if (!headersSource.includes(`'${hash}'`)) {
        errors.push(`_headers: la CSP no contiene ${hash}.`);
    }
}

if (errors.length > 0) {
    errors.forEach(error => process.stderr.write(`${error}\n`));
    process.exit(1);
}

process.stdout.write(
    `Proyecto válido: ${htmlFiles.length} HTML, ${cssFiles.length} CSS, ${inlineScripts.length} scripts inline y todas las rutas locales verificadas.\n`
);
