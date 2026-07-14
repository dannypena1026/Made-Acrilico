import test from 'node:test';
import assert from 'node:assert/strict';

import { getTrustedURL } from '../js/utils/helpers.js';

test('getTrustedURL acepta HTTPS del host permitido', () => {
    assert.equal(
        getTrustedURL(
            'https://res.cloudinary.com/demo/image/upload/file.png',
            ['res.cloudinary.com']
        ),
        'https://res.cloudinary.com/demo/image/upload/file.png'
    );
});

test('getTrustedURL rechaza protocolos ejecutables y datos embebidos', () => {
    assert.equal(
        getTrustedURL('javascript:alert(1)', ['res.cloudinary.com']),
        ''
    );

    assert.equal(
        getTrustedURL('data:text/html,<script>alert(1)</script>', ['res.cloudinary.com']),
        ''
    );
});

test('getTrustedURL rechaza dominios parecidos o no autorizados', () => {
    assert.equal(
        getTrustedURL(
            'https://res.cloudinary.com.evil.example/file.png',
            ['res.cloudinary.com']
        ),
        ''
    );

    assert.equal(
        getTrustedURL(
            'https://example.com/file.png',
            ['res.cloudinary.com']
        ),
        ''
    );
});
