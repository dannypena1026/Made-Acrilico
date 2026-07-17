import test from 'node:test';
import assert from 'node:assert/strict';

import { getTrustedURL } from '../js/utils/helpers.js';

test('getTrustedURL acepta HTTPS del host permitido', () => {
    assert.equal(
        getTrustedURL(
            'https://madeacrilico.com/api/files/temporal',
            ['madeacrilico.com']
        ),
        'https://madeacrilico.com/api/files/temporal'
    );
});

test('getTrustedURL rechaza protocolos ejecutables y datos embebidos', () => {
    assert.equal(
        getTrustedURL('javascript:alert(1)', ['madeacrilico.com']),
        ''
    );

    assert.equal(
        getTrustedURL('data:text/html,<script>alert(1)</script>', ['madeacrilico.com']),
        ''
    );
});

test('getTrustedURL rechaza dominios parecidos o no autorizados', () => {
    assert.equal(
        getTrustedURL(
            'https://madeacrilico.com.evil.example/file.png',
            ['madeacrilico.com']
        ),
        ''
    );

    assert.equal(
        getTrustedURL(
            'https://example.com/file.png',
            ['madeacrilico.com']
        ),
        ''
    );
});
