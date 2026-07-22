import { expect, test } from '@playwright/test';

async function useStaticConfiguration(page) {
    await page.route('**/api/site-config', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: false })
    }));
}

test('las rutas limpias responden y una ruta desconocida conserva 404', async ({ request }) => {
    for (const route of ['/', '/dtf-textil', '/dtf-uv', '/stickers', '/tienda']) {
        const response = await request.get(route);
        expect(response.status(), route).toBe(200);
    }

    const missing = await request.get('/pagina-que-no-existe');
    expect(missing.status()).toBe(404);
    await expect(missing.text()).resolves.toContain('Esta página no existe');
});

test('el menú móvil abre debajo del encabezado y se puede cerrar', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile'), 'Prueba exclusiva de móvil');
    await useStaticConfiguration(page);
    await page.goto('/#tienda');
    await page.locator('#tab-tienda').waitFor({ state: 'visible' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    await page.locator('#mobile-menu-toggle').click();
    const menu = page.locator('#mobile-menu');
    await expect(menu).toBeVisible();

    const [headerBox, menuBox] = await Promise.all([
        page.locator('.site-header').boundingBox(),
        menu.boundingBox()
    ]);
    expect(headerBox).not.toBeNull();
    expect(menuBox).not.toBeNull();
    expect(menuBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height - 1);

    await menu.locator('[data-mobile-menu-close]').click();
    await expect(menu).toBeHidden();
});

test('el enlace del calculador conserva la selección de stickers sin desbordar', async ({ page }) => {
    await useStaticConfiguration(page);
    await page.goto('/?material=stickers#planilla');

    const stickerButton = page.locator('#btn-stickers');
    await expect(stickerButton).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#sticker-material-box')).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalOverflow).toBe(false);
});

test('las páginas públicas cargan sin errores de navegador ni desbordamiento', async ({ page }) => {
    const browserErrors = [];
    const failedRequests = [];

    page.on('pageerror', error => browserErrors.push(error.message));
    page.on('console', message => {
        if (message.type() === 'error') {
            browserErrors.push(message.text());
        }
    });
    page.on('requestfailed', request => {
        failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText || 'falló'}`);
    });

    await useStaticConfiguration(page);

    for (const route of ['/', '/dtf-textil', '/dtf-uv', '/stickers', '/tienda']) {
        await page.goto(route);
        await page.waitForLoadState('networkidle');

        await page.locator('img').evaluateAll(images => {
            for (const image of images) {
                image.loading = 'eager';
            }
        });

        await expect.poll(async () => page.locator('img').evaluateAll(images =>
            images.every(image => image.complete)
        )).toBe(true);

        const brokenImages = await page.locator('img').evaluateAll(images =>
            images
                .filter(image => image.naturalWidth === 0)
                .map(image => image.currentSrc || image.src)
        );
        expect(brokenImages, route).toEqual([]);

        const hasHorizontalOverflow = await page.evaluate(
            () => document.documentElement.scrollWidth > document.documentElement.clientWidth
        );
        expect(hasHorizontalOverflow, route).toBe(false);
    }

    expect(browserErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
});

test('todos los iconos usan SVG locales y no las fuentes antiguas', async ({ page }) => {
    await useStaticConfiguration(page);
    await page.goto('/');

    const icons = page.locator('.brand-icon');
    expect(await icons.count()).toBeGreaterThan(0);

    const iconStyles = await icons.evaluateAll(elements => elements.map(element => {
        const styles = getComputedStyle(element);
        return {
            mask: styles.maskImage || styles.webkitMaskImage,
            fontFamily: styles.fontFamily
        };
    }));

    expect(iconStyles.length).toBeGreaterThan(0);
    for (const icon of iconStyles) {
        expect(icon.mask).toMatch(/assets\/icons\/(whatsapp|google|instagram|tiktok)\.svg/);
        expect(icon.fontFamily).not.toMatch(/Font Awesome 6 Brands/i);
    }

    const solidIcons = page.locator('.site-icon');
    expect(await solidIcons.count()).toBeGreaterThan(0);

    const solidIconStyles = await solidIcons.evaluateAll(elements => elements.map(element => {
        const styles = getComputedStyle(element);
        return {
            mask: styles.maskImage || styles.webkitMaskImage,
            fontFamily: styles.fontFamily
        };
    }));

    for (const icon of solidIconStyles) {
        expect(icon.mask).toMatch(/assets\/icons\/solid\/[a-z0-9-]+\.svg/);
        expect(icon.fontFamily).not.toMatch(/Font Awesome/i);
    }
});
