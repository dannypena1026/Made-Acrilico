import test from 'node:test';
import assert from 'node:assert/strict';

import { BUSINESS_CONFIG } from '../js/core/business-config.js';
import {
    getAllowedExtensions,
    getFileExtension,
    matchesFileSignature,
    validateFileMetadata
} from '../js/core/file-policy.js';

test('stickers admite formatos raster comunes pero excluye PSD', () => {
    const extensions =
        getAllowedExtensions('stickers', BUSINESS_CONFIG);

    assert.ok(extensions.includes('jpg'));
    assert.ok(extensions.includes('jpeg'));
    assert.ok(extensions.includes('webp'));
    assert.ok(extensions.includes('tiff'));
    assert.ok(!extensions.includes('psd'));
});

test('DTF Textil y UV conservan PNG, PDF, AI y PSD', () => {
    assert.deepEqual(
        getAllowedExtensions('textil', BUSINESS_CONFIG),
        ['png', 'pdf', 'ai', 'psd']
    );
});

test('extrae la extensión normalizada y rechaza nombres sin extensión', () => {
    assert.equal(getFileExtension('Arte.Final.JPEG'), 'jpeg');
    assert.equal(getFileExtension('archivo'), '');
});

test('rechaza archivos vacíos y extensiones no permitidas', () => {
    const empty =
        validateFileMetadata(
            { name: 'arte.png', size: 0 },
            { material: 'textil', config: BUSINESS_CONFIG }
        );

    const executable =
        validateFileMetadata(
            { name: 'arte.exe', size: 200 },
            { material: 'stickers', config: BUSINESS_CONFIG }
        );

    assert.equal(empty.valid, false);
    assert.equal(executable.valid, false);
});

test('valida firmas PNG y JPEG reales', () => {
    assert.equal(
        matchesFileSignature(
            new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
            'png'
        ),
        true
    );

    assert.equal(
        matchesFileSignature(
            new Uint8Array([0xff, 0xd8, 0xff, 0xe0]),
            'jpeg'
        ),
        true
    );
});

test('detecta una extensión falsa aunque el nombre parezca válido', () => {
    assert.equal(
        matchesFileSignature(
            new TextEncoder().encode('<script>alert(1)</script>'),
            'png'
        ),
        false
    );
});

test('admite AI basado en PDF o PostScript', () => {
    assert.equal(
        matchesFileSignature(
            new TextEncoder().encode('%PDF-1.7'),
            'ai'
        ),
        true
    );

    assert.equal(
        matchesFileSignature(
            new TextEncoder().encode('%!PS-Adobe-3.0'),
            'ai'
        ),
        true
    );
});
