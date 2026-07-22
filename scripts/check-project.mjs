import { createHash } from 'node:crypto';
import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const htmlFiles = [
    'index.html',
    'dtf-textil.html',
    'dtf-uv.html',
    'stickers.html',
    'tienda.html',
    '404.html',
    'admin.html'
];

const errors = [];
const cssFiles = [
    'css/styles.css',
    'css/admin.css',
    'assets/icons/solid/icons.css'
];

async function fileExists(filePath) {
    try {
        await access(filePath);
        return true;
    } catch {
        return false;
    }
}

function hasValidAssetSignature(fileName, contents) {
    if (fileName.endsWith('.png')) {
        return contents.subarray(0, 8).equals(
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
        );
    }

    if (fileName.endsWith('.webp')) {
        return contents.subarray(0, 4).toString('ascii') === 'RIFF'
            && contents.subarray(8, 12).toString('ascii') === 'WEBP';
    }

    if (fileName.endsWith('.woff2')) {
        return contents.subarray(0, 4).toString('ascii') === 'wOF2';
    }

    return true;
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
        );

    const responsiveImageReferences =
        Array.from(
            source.matchAll(/\b(?:srcset|imagesrcset)="([^"]+)"/g),
            match => match[1]
        )
            .flatMap(srcset => srcset.split(','))
            .map(candidate => candidate.trim().split(/\s+/, 1)[0]);

    for (const reference of [...references, ...responsiveImageReferences].filter(isLocalReference)) {
        const cleanReference =
            decodeURIComponent(reference.split(/[?#]/, 1)[0]);

        const resolvedReference = cleanReference.startsWith('/')
            ? resolve(`.${cleanReference}`)
            : resolve(dirname(htmlFile), cleanReference);

        const cleanRouteReference = !cleanReference.endsWith('/')
            && !cleanReference.includes('.')
            ? `${resolvedReference}.html`
            : '';

        if (!await fileExists(resolvedReference) && !(cleanRouteReference && await fileExists(cleanRouteReference))) {
            errors.push(`${htmlFile}: referencia local inexistente "${reference}".`);
        }
    }
}

for (const cssFile of cssFiles) {
    const source = await readFile(cssFile, 'utf8');
    validateCssBraces(cssFile, source);

    const references =
        Array.from(
            source.matchAll(/url\((?:['"])?([^'"\)]+)(?:['"])?\)/g),
            match => match[1]
        )
            .filter(isLocalReference);

    for (const reference of references) {
        const resolvedReference = resolve(dirname(cssFile), decodeURIComponent(reference));

        if (!await fileExists(resolvedReference)) {
            errors.push(`${cssFile}: referencia CSS inexistente "${reference}".`);
        }
    }
}

for (const iconDirectory of ['assets/icons', 'assets/icons/solid']) {
    const entries = await readdir(iconDirectory, { withFileTypes: true });

    for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.svg')) {
            continue;
        }

        const iconPath = resolve(iconDirectory, entry.name);
        const iconSource = (await readFile(iconPath, 'utf8')).trimStart();

        if (!iconSource.startsWith('<svg') || !/\bviewBox="[^"]+"/.test(iconSource)) {
            errors.push(`${iconDirectory}/${entry.name}: el archivo no contiene un SVG válido con viewBox.`);
        }
    }
}

for (const assetDirectory of ['assets/img', 'assets/fonts']) {
    const entries = await readdir(assetDirectory, { withFileTypes: true });

    for (const entry of entries) {
        if (!entry.isFile() || !/\.(?:png|webp|woff2)$/.test(entry.name)) {
            continue;
        }

        const assetPath = resolve(assetDirectory, entry.name);
        const contents = await readFile(assetPath);

        if (!hasValidAssetSignature(entry.name, contents)) {
            errors.push(`${assetDirectory}/${entry.name}: la firma binaria no coincide con su extensión.`);
        }
    }
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

const inlineStyles =
    Array.from(
        indexSource.matchAll(/<style([^>]*)>([\s\S]*?)<\/style>/g)
    );

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

for (const [, , styleContent] of inlineStyles) {
    const hash =
        `sha256-${createHash('sha256').update(styleContent).digest('base64')}`;

    if (!metaCsp.includes(`'${hash}'`)) {
        errors.push(`index.html: la CSP meta no contiene el hash de estilo ${hash}.`);
    }

    if (!headersSource.includes(`'${hash}'`)) {
        errors.push(`_headers: la CSP no contiene el hash de estilo ${hash}.`);
    }
}

if (errors.length > 0) {
    errors.forEach(error => process.stderr.write(`${error}\n`));
    process.exit(1);
}

process.stdout.write(
    `Proyecto válido: ${htmlFiles.length} HTML, ${cssFiles.length} CSS, ${inlineScripts.length} scripts inline, ${inlineStyles.length} estilos inline y todas las rutas locales verificadas.\n`
);
