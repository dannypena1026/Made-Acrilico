import { getSecureApiUrl } from './core/secure-api.js';
import { escapeHTML, formatCurrency, getTrustedURL } from './utils/helpers.js';

const STATUS_LABELS = {
    pending_review: 'Pendiente de revisión',
    pending_notification: 'Aviso pendiente',
    in_review: 'Revisando archivo',
    approved: 'Aprobada',
    in_production: 'En producción',
    ready: 'Lista',
    completed: 'Entregada',
    cancelled: 'Cancelada'
};

const PAYMENT_LABELS = {
    pending: 'Pendiente de pago',
    deposit_received: 'Anticipo recibido',
    paid: 'Pagada',
    refunded: 'Reembolsada'
};

const SITE_IMAGE_SLOTS = [
    { key: 'brand-logo', label: 'Logo principal', defaultUrl: 'assets/img/madeacrilico-horizontal.webp', alt: 'MADE ACRÍLICO' },
    { key: 'home-textil', label: 'DTF Textil', defaultUrl: 'assets/img/etiquetas.webp', alt: 'Impresión DTF Textil' },
    { key: 'home-uv', label: 'DTF UV', defaultUrl: 'assets/img/test_uv.webp', alt: 'DTF UV adhesivo' },
    { key: 'home-stickers', label: 'Stickers', defaultUrl: 'assets/img/stickers-optimized.webp', alt: 'Stickers personalizados' },
    { key: 'store-badge', label: 'Logo Made Acrílico Store', defaultUrl: 'assets/img/lgo-madeacrilico-store.webp', alt: 'Made Acrílico Store' },
    { key: 'store-sublimation', label: 'Tienda: sublimación', defaultUrl: 'assets/img/inicio.webp', alt: 'Artículos para sublimación' },
    { key: 'store-uv', label: 'Tienda: servicio UV', defaultUrl: 'assets/img/test_uv.webp', alt: 'Servicio DTF UV' },
    { key: 'store-textil', label: 'Tienda: servicio Textil', defaultUrl: 'assets/img/test_textil.webp', alt: 'Servicio DTF Textil' }
];

const ADMIN_IDLE_TIMEOUT_MS = 10 * 60 * 1000;

const state = {
    page: 1,
    limit: 25,
    total: 0,
    selectedOrderId: '',
    searchTimer: null,
    toastTimer: null,
    idleTimer: null,
    lastActivityAt: 0,
    isAuthenticated: false,
    activeView: 'orders',
    siteConfiguration: null
};

function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
    return new Intl.DateTimeFormat('es-DO', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date);
}

function getStatusClass(status) {
    return `admin-status admin-status-${String(status || '').replace(/[^a-z_]/g, '')}`;
}

function setSessionStatus(message, isError = false) {
    const element = document.getElementById('admin-session-status');
    if (!element) return;
    element.textContent = message;
    element.classList.toggle('is-error', isError);
    element.classList.toggle('is-connected', !isError && message !== 'Sesión cerrada');
}

function showLogin(message = '') {
    clearSessionIdleTimer();
    state.isAuthenticated = false;
    document.getElementById('admin-login-view').hidden = false;
    document.getElementById('admin-main').hidden = true;
    document.getElementById('admin-logout').hidden = true;
    setSessionStatus('Sesión cerrada');
    document.getElementById('admin-login-message').textContent = message;
}

function showToast(message) {
    const toast = document.getElementById('admin-toast');
    if (!toast) return;
    window.clearTimeout(state.toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    state.toastTimer = window.setTimeout(() => {
        toast.hidden = true;
    }, 2600);
}

function showPanel(announce = false) {
    state.isAuthenticated = true;
    resetSessionIdleTimer();
    document.getElementById('admin-login-view').hidden = true;
    document.getElementById('admin-main').hidden = false;
    document.getElementById('admin-logout').hidden = false;
    setSessionStatus('Panel protegido conectado');
    if (announce) showToast('Sesión iniciada');
}

function clearSessionIdleTimer() {
    window.clearTimeout(state.idleTimer);
    state.idleTimer = null;
}

function resetSessionIdleTimer() {
    if (!state.isAuthenticated) return;

    clearSessionIdleTimer();
    state.lastActivityAt = Date.now();
    state.idleTimer = window.setTimeout(
        () => logout({
            message: 'Sesión cerrada por inactividad. Inicia sesión nuevamente.'
        }),
        ADMIN_IDLE_TIMEOUT_MS
    );
}

function registerSessionActivity() {
    if (state.isAuthenticated) resetSessionIdleTimer();
}

function getUserMessage(error) {
    if (error instanceof TypeError) {
        return 'No se puede conectar con el servicio interno.';
    }
    return error?.message || 'No se pudo completar la operación interna.';
}

async function request(path, options = {}) {
    const response = await fetch(getSecureApiUrl(path), {
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            ...options.headers
        },
        ...options
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.success) {
        if (response.status === 401 && state.isAuthenticated) {
            showLogin('Tu sesión expiró. Inicia sesión nuevamente.');
            showToast('La sesión se cerró por seguridad.');
        }
        throw new Error(payload.message || 'No se pudo completar la operación interna.');
    }
    return payload;
}

function getFilters() {
    return {
        search: document.getElementById('admin-search')?.value.trim() || '',
        status: document.getElementById('admin-status-filter')?.value || ''
    };
}

function renderMetrics(metrics) {
    const totals = metrics.totals || {};
    const byStatus = metrics.byStatus || [];
    const byMaterial = metrics.byMaterial || [];
    document.getElementById('metric-total-orders').textContent = totals.total_orders || 0;
    document.getElementById('metric-last-30-days').textContent = totals.last_30_days || 0;
    document.getElementById('metric-total-estimated').textContent = formatCurrency(totals.total_estimated || 0);
    const pending = byStatus.find(item => item.status === 'pending_review');
    document.getElementById('metric-pending-review').textContent = pending?.total || 0;
    document.getElementById('metric-top-material').textContent = byMaterial[0]?.material || '-';
}

function renderOrderList(orders) {
    const container = document.getElementById('admin-orders-list');
    if (!container) return;

    if (orders.length === 0) {
        container.innerHTML = '<div class="admin-empty-state"><strong>No hay órdenes</strong><span>Prueba con otro filtro o vuelve a actualizar.</span></div>';
        return;
    }

    container.innerHTML = orders.map(order => `
        <button class="admin-order-row ${order.id === state.selectedOrderId ? 'is-selected' : ''}" type="button" data-order-id="${escapeHTML(order.id)}">
            <span class="admin-order-row-top"><strong>${escapeHTML(order.id)}</strong><time>${escapeHTML(formatDate(order.createdAt))}</time></span>
            <span class="admin-order-row-name">${escapeHTML(order.customer.name)}</span>
            <span class="admin-order-row-bottom"><span class="${getStatusClass(order.status)}">${escapeHTML(STATUS_LABELS[order.status] || order.status)}</span><strong>${escapeHTML(formatCurrency(order.subtotal))}</strong></span>
        </button>
    `).join('');

    container.querySelectorAll('[data-order-id]').forEach(button => {
        button.addEventListener('click', () => loadOrderDetail(button.dataset.orderId));
    });
}

function getWhatsappLink(order) {
    const phone = String(order.customer.phone || '').replace(/\D/g, '');
    const message = [
        `Hola ${order.customer.name}, te escribimos de MADE ACRÍLICO sobre tu orden ${order.id}.`,
        `Estado actual: ${STATUS_LABELS[order.status] || order.status}.`,
        order.status === 'ready' ? 'Tu pedido está listo para entrega.' : 'Cualquier actualización te la confirmaremos por este medio.'
    ].join('\n');
    return phone ? `https://wa.me/1${phone}?text=${encodeURIComponent(message)}` : '';
}

function statusOptions(selected) {
    return Object.entries(STATUS_LABELS)
        .map(([value, label]) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${label}</option>`)
        .join('');
}

function paymentOptions(selected) {
    return Object.entries(PAYMENT_LABELS)
        .map(([value, label]) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${label}</option>`)
        .join('');
}

function renderOrderDetail(order, events) {
    const panel = document.getElementById('admin-order-detail');
    if (!panel) return;
    const whatsappLink = getWhatsappLink(order);
    const items = order.items.map(item => {
        const fileUrl = getTrustedURL(item.fileUrl, ['res.cloudinary.com']);
        return `
            <li class="admin-item">
                <strong>${escapeHTML(item.material || 'Producto')}</strong>
                <span>${escapeHTML(item.size || '')} · ${escapeHTML(String(item.quantity || 0))} · ${escapeHTML(formatCurrency(item.total || 0))}</span>
                ${fileUrl ? `<a href="${escapeHTML(fileUrl)}" target="_blank" rel="noopener noreferrer">Abrir archivo</a>` : '<span class="admin-muted">Archivo no disponible</span>'}
            </li>`;
    }).join('');
    const history = events.map(event => `
        <li><time>${escapeHTML(formatDate(event.created_at))}</time><strong>${escapeHTML(event.event_type)}</strong><span>${escapeHTML(event.detail || 'Sin detalle')}</span></li>
    `).join('');

    panel.innerHTML = `
        <div class="admin-detail-header">
            <div><p class="admin-eyebrow">Orden</p><h2>${escapeHTML(order.id)}</h2></div>
            <span class="${getStatusClass(order.status)}">${escapeHTML(STATUS_LABELS[order.status] || order.status)}</span>
        </div>
        <div class="admin-detail-grid">
            <section><h3>Cliente</h3><p><strong>${escapeHTML(order.customer.name)}</strong><br>${escapeHTML(order.customer.phone)}<br>${escapeHTML(order.fulfillment === 'shipping' ? 'Envío' : 'Retiro en tienda')}</p>${order.customer.address ? `<p>${escapeHTML(order.customer.address)}</p>` : ''}${order.customer.notes ? `<p class="admin-note">${escapeHTML(order.customer.notes)}</p>` : ''}</section>
            <section><h3>Resumen</h3><p><strong>${escapeHTML(formatCurrency(order.subtotal))}</strong><br>Creada: ${escapeHTML(formatDate(order.createdAt))}<br>Correo: ${escapeHTML(order.emailStatus)}</p></section>
        </div>
        <section><h3>Productos y archivos</h3><ul class="admin-items">${items || '<li class="admin-muted">Sin productos.</li>'}</ul></section>
        <form id="admin-order-form" class="admin-order-form">
            <h3>Seguimiento interno</h3>
            <label>Estado de producción<select name="status">${statusOptions(order.status)}</select></label>
            <label>Estado de pago<select name="paymentStatus">${paymentOptions(order.paymentStatus)}</select></label>
            <label class="admin-form-full">Nota de pago<textarea name="paymentNote" rows="3" maxlength="300" placeholder="Ej.: Anticipo recibido por transferencia.">${escapeHTML(order.paymentNote || '')}</textarea></label>
            <div class="admin-actions"><button type="submit">Guardar cambios</button>${whatsappLink ? `<a class="admin-whatsapp" href="${escapeHTML(whatsappLink)}" target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a>` : ''}</div>
        </form>
        <section><h3>Historial</h3><ol class="admin-history">${history || '<li class="admin-muted">Aún no hay eventos.</li>'}</ol></section>
    `;

    panel.querySelector('#admin-order-form')?.addEventListener('submit', event => saveOrder(event, order.id));
}

async function loadOrderDetail(orderId) {
    state.selectedOrderId = orderId;
    const panel = document.getElementById('admin-order-detail');
    panel.innerHTML = '<div class="admin-empty-state"><strong>Cargando orden...</strong></div>';
    renderOrderListCache();
    try {
        const response = await request(`/api/admin/orders/${encodeURIComponent(orderId)}`);
        renderOrderDetail(response.order, response.events);
        setSessionStatus('Panel protegido conectado');
    } catch (error) {
        panel.innerHTML = `<div class="admin-empty-state is-error"><strong>No se pudo abrir la orden</strong><span>${escapeHTML(getUserMessage(error))}</span></div>`;
        setSessionStatus('Acceso o datos no disponibles', true);
    }
}

let lastOrders = [];

function renderOrderListCache() {
    renderOrderList(lastOrders);
}

async function loadOrders() {
    const { search, status } = getFilters();
    const params = new URLSearchParams({ page: String(state.page), limit: String(state.limit) });
    if (search) params.set('q', search);
    if (status) params.set('status', status);
    const container = document.getElementById('admin-orders-list');
    container.innerHTML = '<div class="admin-empty-state"><strong>Cargando órdenes...</strong></div>';
    try {
        const response = await request(`/api/admin/orders?${params}`);
        state.total = response.total;
        lastOrders = response.orders;
        renderOrderList(lastOrders);
        document.getElementById('admin-orders-count').textContent = `${response.total} orden${response.total === 1 ? '' : 'es'} encontradas`;
        document.getElementById('admin-page-label').textContent = `Página ${state.page}`;
        document.getElementById('admin-prev-page').disabled = state.page <= 1;
        document.getElementById('admin-next-page').disabled = state.page * state.limit >= response.total;
        setSessionStatus('Panel protegido conectado');
    } catch (error) {
        container.innerHTML = `<div class="admin-empty-state is-error"><strong>No se pudieron cargar las órdenes</strong><span>${escapeHTML(getUserMessage(error))}</span></div>`;
        setSessionStatus('Acceso interno no disponible', true);
    }
}

async function loadMetrics() {
    try {
        renderMetrics(await request('/api/admin/metrics'));
    } catch {
        renderMetrics({ totals: {}, byStatus: [] });
    }
}

async function saveOrder(event, orderId) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Guardando...';
    try {
        const formData = new FormData(form);
        await request(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: formData.get('status'),
                paymentStatus: formData.get('paymentStatus'),
                paymentNote: formData.get('paymentNote')
            })
        });
        await Promise.all([loadOrders(), loadMetrics(), loadOrderDetail(orderId)]);
    } catch (error) {
        setSessionStatus(getUserMessage(error), true);
    } finally {
        button.disabled = false;
        button.textContent = 'Guardar cambios';
    }
}

function field(name, label, value, { type = 'text', step = '', min = '', max = '', help = '' } = {}) {
    return `<label class="admin-setting-field"><span>${escapeHTML(label)}</span><input name="${escapeHTML(name)}" type="${escapeHTML(type)}" value="${escapeHTML(String(value ?? ''))}" ${step ? `step="${escapeHTML(step)}"` : ''} ${min !== '' ? `min="${escapeHTML(String(min))}"` : ''} ${max !== '' ? `max="${escapeHTML(String(max))}"` : ''} required>${help ? `<small>${escapeHTML(help)}</small>` : ''}</label>`;
}

function toggleField(name, label, checked, help = '') {
    return `<label class="admin-setting-toggle"><input name="${escapeHTML(name)}" type="checkbox" ${checked ? 'checked' : ''}><span><strong>${escapeHTML(label)}</strong>${help ? `<small>${escapeHTML(help)}</small>` : ''}</span></label>`;
}

function textareaField(name, label, value, help = '') {
    return `<label class="admin-setting-field admin-setting-field-wide"><span>${escapeHTML(label)}</span><textarea name="${escapeHTML(name)}" rows="3" required>${escapeHTML(String(value ?? ''))}</textarea>${help ? `<small>${escapeHTML(help)}</small>` : ''}</label>`;
}

function renderTierFields(prefix, label, tiers) {
    return `<fieldset class="admin-price-group"><legend>${escapeHTML(label)}</legend>${tiers.map((tier, index) => `
        <div class="admin-tier-row">
            ${field(`${prefix}-length-${index}`, 'Largo (pulgadas)', tier.length, { type: 'number', min: 1, max: 144, step: '0.01' })}
            ${field(`${prefix}-price-${index}`, 'Precio RD$', tier.price, { type: 'number', min: 1, step: '1' })}
        </div>`).join('')}</fieldset>`;
}

function renderReviewEditor(review = {}, index = 1) {
    const rating = Number(review.rating) || 5;
    return `<article class="admin-review-editor" data-review-entry>
        <div class="admin-review-editor-heading">
            <div><span>Reseña ${index}</span><p>Publica únicamente opiniones reales y verificadas.</p></div>
            <button type="button" class="admin-review-remove" data-remove-review aria-label="Eliminar reseña ${index}">Eliminar</button>
        </div>
        <div class="admin-settings-grid admin-review-grid">
            <label class="admin-setting-field"><span>Nombre mostrado</span><input data-review-author maxlength="90" value="${escapeHTML(review.author || '')}" placeholder="Ej.: María P."></label>
            <label class="admin-setting-field"><span>Calificación</span><select data-review-rating>${[5, 4, 3, 2, 1].map(value => `<option value="${value}" ${rating === value ? 'selected' : ''}>${value} estrella${value === 1 ? '' : 's'}</option>`).join('')}</select></label>
            <label class="admin-setting-field"><span>Antigüedad o fecha</span><input data-review-published maxlength="80" value="${escapeHTML(review.published || '')}" placeholder="Ej.: hace 2 semanas"></label>
            <label class="admin-setting-field admin-setting-field-wide"><span>Reseña</span><textarea data-review-text rows="3" maxlength="700" placeholder="Escribe o pega la reseña tal como fue compartida.">${escapeHTML(review.text || '')}</textarea></label>
        </div>
    </article>`;
}

function bindReviewEditor(container) {
    const reviewList = container.querySelector('#admin-reviews-editor');
    const addButton = container.querySelector('#admin-add-review');
    if (!reviewList || !addButton) return;

    const updateRemoveButtons = () => {
        reviewList.querySelectorAll('[data-review-entry]').forEach((entry, index) => {
            const number = index + 1;
            entry.querySelector('.admin-review-editor-heading span').textContent = `Reseña ${number}`;
            entry.querySelector('[data-remove-review]').setAttribute('aria-label', `Eliminar reseña ${number}`);
        });
        addButton.disabled = reviewList.children.length >= 8;
    };

    addButton.addEventListener('click', () => {
        if (reviewList.children.length >= 8) return;
        reviewList.insertAdjacentHTML('beforeend', renderReviewEditor({}, reviewList.children.length + 1));
        updateRemoveButtons();
        reviewList.lastElementChild?.querySelector('[data-review-author]')?.focus();
    });

    reviewList.addEventListener('click', event => {
        const button = event.target.closest('[data-remove-review]');
        if (!button) return;
        button.closest('[data-review-entry]')?.remove();
        updateRemoveButtons();
    });

    updateRemoveButtons();
}

function renderConfigurationEditor(configuration) {
    const container = document.getElementById('admin-config-content');
    if (!container) return;
    const { business, materials, reviews = [] } = configuration;

    container.innerHTML = `
        <div class="admin-settings-heading admin-settings-heading-row admin-settings-hero admin-settings-hero-config">
            <div><p class="admin-eyebrow">Configuración comercial</p><h2>Controla lo que ve y cotiza tu cliente.</h2><p>Actualiza datos, precios y reglas sin abrir código. Cada cambio se valida antes de publicarse.</p></div>
            <div class="admin-settings-hero-meta"><span class="admin-settings-live">Edición en vivo</span><small>Los ajustes aplican a nuevas cotizaciones.</small></div>
        </div>
        <form id="admin-site-config-form" class="admin-site-config-form">
            <fieldset class="admin-settings-section"><legend><span>01</span> Información del negocio</legend><p class="admin-section-hint">Datos visibles en contacto, cotizaciones y enlaces directos.</p>
                <div class="admin-settings-grid">
                    ${field('business-name', 'Nombre comercial', business.name)}
                    ${field('business-whatsapp', 'WhatsApp (solo números)', business.whatsappNumber, { type: 'tel', help: 'Ej.: 18298824820' })}
                    ${field('business-phone-display', 'Teléfono visible', business.phoneDisplay)}
                    ${field('business-phone-href', 'Teléfono para enlace', business.phoneHref, { type: 'tel', help: 'Ej.: +18298824820' })}
                    ${field('business-email', 'Correo', business.email, { type: 'email' })}
                    ${field('business-maps', 'Enlace de Google Maps', business.mapsUrl, { type: 'url' })}
                    ${textareaField('business-address', 'Dirección', business.address)}
                </div>
                <div class="admin-settings-subgrid admin-settings-subgrid-operation">
                    ${field('business-delivery', 'Estimado de entrega', business.deliveryEstimate)}
                    ${field('business-payment', 'Métodos de pago', business.paymentMethods)}
                    ${field('business-upload-size', 'Máximo por archivo (MB)', business.maxUploadSizeMb, { type: 'number', min: 1, max: 10, step: '1' })}
                </div>
                ${textareaField('business-estimate-notice', 'Aviso de cotización', business.estimateNotice)}
            </fieldset>

            <fieldset class="admin-settings-section"><legend><span>02</span> DTF Textil</legend><p class="admin-section-hint">Define el producto, ancho de trabajo y los tramos que se usarán en nuevas cotizaciones.</p>
                <div class="admin-settings-grid admin-settings-grid-three">
                    ${field('textil-label', 'Nombre de producto', materials.textil.label)}
                    ${field('textil-display-name', 'Nombre corto', materials.textil.displayName)}
                    ${field('textil-width', 'Ancho (pulgadas)', materials.textil.width, { type: 'number', min: 1, max: 60, step: '0.01' })}
                </div>
                ${renderTierFields('textil', 'Tramos y precios', materials.textil.tiers)}
            </fieldset>

            <fieldset class="admin-settings-section"><legend><span>03</span> DTF UV</legend><p class="admin-section-hint">Activa cada ancho solo cuando esté disponible para producción y ajusta sus precios por tramo.</p>
                <div class="admin-settings-grid admin-settings-grid-single">
                    ${field('uv-label', 'Nombre de producto', materials.uv.label)}
                </div>
                ${Object.entries(materials.uv.widths).map(([width, option]) => `
                    <div class="admin-subsection admin-uv-width">
                        <div class="admin-subsection-heading"><span>UV ${width}\"</span><p>Disponibilidad y precio para este ancho.</p></div>
                        <div class="admin-settings-grid admin-settings-grid-uv">
                            ${field(`uv-${width}-label`, `Nombre para ${width} pulgadas`, option.label)}
                            ${toggleField(`uv-${width}-enabled`, `Disponible para cotizar (${width}\")`, option.enabled, 'Desactívalo para ocultar este ancho y bloquear su cotización pública.')}
                        </div>
                        ${renderTierFields(`uv-${width}`, `Tramos ${width} pulgadas`, option.tiers)}
                    </div>`).join('')}
            </fieldset>

            <fieldset class="admin-settings-section"><legend><span>04</span> Stickers y etiquetas</legend><p class="admin-section-hint">Controla mínimos, descuentos automáticos y el precio base de cada acabado.</p>
                <div class="admin-settings-grid admin-settings-grid-sticker-rules">
                    ${field('stickers-display-name', 'Nombre de producto', materials.stickers.displayName)}
                    ${field('stickers-roll-width', 'Ancho del rollo (pulgadas)', materials.stickers.rollWidth, { type: 'number', min: 1, max: 120, step: '0.01' })}
                    ${field('stickers-separation', 'Separación (pulgadas)', materials.stickers.separation, { type: 'number', min: 0, max: 2, step: '0.01' })}
                    ${field('stickers-min-quantity', 'Cantidad mínima', materials.stickers.minQuantity, { type: 'number', min: 1, step: '1' })}
                    ${field('stickers-min-total', 'Precio mínimo RD$', materials.stickers.minTotal, { type: 'number', min: 1, step: '1' })}
                    ${field('stickers-discount-step', 'Cada cuántos stickers aumenta el descuento', materials.stickers.autoDiscount.quantityStep, { type: 'number', min: 1, step: '1' })}
                    ${field('stickers-discount-increment', 'Incremento de descuento', materials.stickers.autoDiscount.increment, { type: 'number', min: 0, max: 0.5, step: '0.01', help: '0.03 equivale a 3%' })}
                    ${field('stickers-discount-max', 'Descuento máximo', materials.stickers.autoDiscount.maxRate, { type: 'number', min: 0, max: 0.8, step: '0.01', help: '0.20 equivale a 20%' })}
                </div>
                <div class="admin-sticker-materials">${Object.entries(materials.stickers.materials).map(([key, material]) => `
                    <div class="admin-subsection">
                        <h3>${escapeHTML(key === 'white' ? 'Vinil blanco' : key === 'transparent' ? 'Vinil transparente' : 'Vinil holográfico')}</h3>
                        <div class="admin-settings-grid">
                            ${field(`sticker-${key}-label`, 'Nombre visible', material.label)}
                            ${field(`sticker-${key}-price`, 'Precio por pie cuadrado RD$', material.pricePerSqFt, { type: 'number', min: 1, step: '1' })}
                        </div>
                    </div>`).join('')}</div>
            </fieldset>
            <fieldset class="admin-settings-section"><legend><span>05</span> Reseñas de clientes</legend><p class="admin-section-hint">Estas reseñas aparecerán en el carrusel de Inicio. Copia solo opiniones reales y conserva fielmente su calificación y texto.</p>
                <div id="admin-reviews-editor" class="admin-review-list">${reviews.map((review, index) => renderReviewEditor(review, index + 1)).join('')}</div>
                <div class="admin-review-actions"><button id="admin-add-review" type="button">Agregar reseña</button><span>Máximo 8 reseñas.</span></div>
            </fieldset>
            <div class="admin-settings-actions"><button type="submit">Guardar configuración</button><p id="admin-config-message" aria-live="polite"></p></div>
        </form>`;

    container.insertAdjacentHTML('beforeend', `
        <form id="admin-password-form" class="admin-password-form">
            <div><p class="admin-eyebrow">Seguridad</p><h3>Cambiar contraseña del panel</h3><p>Usa 16 caracteres o más. La contraseña actual deja de servir en los próximos inicios de sesión.</p></div>
            <div class="admin-settings-grid">
                ${field('current-password', 'Contraseña actual', '', { type: 'password' })}
                ${field('next-password', 'Nueva contraseña', '', { type: 'password', help: 'Mínimo 16 caracteres.' })}
                ${field('confirm-password', 'Confirmar nueva contraseña', '', { type: 'password' })}
            </div>
            <div class="admin-settings-actions"><button type="submit">Actualizar contraseña</button><p id="admin-password-message" aria-live="polite"></p></div>
        </form>`);

    container.querySelector('#admin-site-config-form')?.addEventListener('submit', saveSiteConfiguration);
    container.querySelector('#admin-password-form')?.addEventListener('submit', updateAdminPassword);
    bindReviewEditor(container);
}

function tierValues(formData, prefix, count) {
    return Array.from({ length: count }, (_, index) => ({
        length: formData.get(`${prefix}-length-${index}`),
        price: formData.get(`${prefix}-price-${index}`)
    }));
}

function buildSiteConfigurationFromForm(form) {
    const formData = new FormData(form);
    const current = state.siteConfiguration;
    const value = name => formData.get(name);
    const uvWidths = Object.fromEntries(Object.entries(current.materials.uv.widths).map(([width, option]) => [width, {
        label: value(`uv-${width}-label`),
        enabled: formData.get(`uv-${width}-enabled`) === 'on',
        tiers: tierValues(formData, `uv-${width}`, option.tiers.length)
    }]));
    const reviews = [...form.querySelectorAll('[data-review-entry]')]
        .map(entry => ({
            author: entry.querySelector('[data-review-author]')?.value || '',
            rating: entry.querySelector('[data-review-rating]')?.value || '',
            published: entry.querySelector('[data-review-published]')?.value || '',
            text: entry.querySelector('[data-review-text]')?.value || ''
        }))
        .filter(review => review.author || review.text || review.published);

    return {
        business: {
            name: value('business-name'),
            whatsappNumber: value('business-whatsapp'),
            phoneDisplay: value('business-phone-display'),
            phoneHref: value('business-phone-href'),
            email: value('business-email'),
            address: value('business-address'),
            mapsUrl: value('business-maps'),
            deliveryEstimate: value('business-delivery'),
            paymentMethods: value('business-payment'),
            estimateNotice: value('business-estimate-notice'),
            maxUploadSizeMb: value('business-upload-size')
        },
        materials: {
            textil: {
                label: value('textil-label'),
                displayName: value('textil-display-name'),
                width: value('textil-width'),
                tiers: tierValues(formData, 'textil', current.materials.textil.tiers.length)
            },
            uv: { label: value('uv-label'), widths: uvWidths },
            stickers: {
                displayName: value('stickers-display-name'),
                rollWidth: value('stickers-roll-width'),
                separation: value('stickers-separation'),
                minQuantity: value('stickers-min-quantity'),
                minTotal: value('stickers-min-total'),
                autoDiscount: {
                    quantityStep: value('stickers-discount-step'),
                    increment: value('stickers-discount-increment'),
                    maxRate: value('stickers-discount-max')
                },
                materials: Object.fromEntries(Object.keys(current.materials.stickers.materials).map(key => [key, {
                    label: value(`sticker-${key}-label`),
                    pricePerSqFt: value(`sticker-${key}-price`)
                }]))
            }
        },
        reviews
    };
}

async function saveSiteConfiguration(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const message = document.getElementById('admin-config-message');
    button.disabled = true;
    message.textContent = 'Guardando configuración...';

    try {
        const response = await request('/api/admin/site-config', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildSiteConfigurationFromForm(form))
        });
        state.siteConfiguration = response.config;
        renderConfigurationEditor(state.siteConfiguration);
        document.getElementById('admin-config-message').textContent = 'Configuración guardada. Las nuevas cotizaciones ya usarán estos valores.';
    } catch (error) {
        message.textContent = getUserMessage(error);
    } finally {
        button.disabled = false;
    }
}

async function updateAdminPassword(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const currentPassword = String(formData.get('current-password') || '');
    const nextPassword = String(formData.get('next-password') || '');
    const confirmation = String(formData.get('confirm-password') || '');
    const message = document.getElementById('admin-password-message');
    const button = form.querySelector('button[type="submit"]');

    if (nextPassword !== confirmation) {
        message.textContent = 'La confirmación no coincide con la nueva contraseña.';
        return;
    }

    button.disabled = true;
    message.textContent = 'Actualizando contraseña...';
    try {
        await request('/api/admin/password', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, nextPassword })
        });
        form.reset();
        showLogin('Contraseña actualizada. Inicia sesión con la nueva contraseña.');
        showToast('Contraseña actualizada y sesiones cerradas.');
    } catch (error) {
        message.textContent = getUserMessage(error);
    } finally {
        button.disabled = false;
    }
}

function renderImageManager(configuration) {
    const container = document.getElementById('admin-images-content');
    if (!container) return;
    const savedImages = configuration.images || {};

    container.innerHTML = `
        <div class="admin-settings-heading admin-settings-heading-row admin-settings-hero admin-settings-hero-images"><div><p class="admin-eyebrow">Biblioteca visual</p><h2>La imagen correcta en cada espacio.</h2><p>Sube PNG, JPG o WEBP de hasta 8 MB. La biblioteca publica cada pieza en el lugar indicado del sitio.</p></div><div class="admin-settings-hero-meta"><span class="admin-settings-live">8 espacios</span><small>Vista previa antes de reemplazar.</small></div></div>
        <div class="admin-image-guide"><strong>Antes de publicar:</strong><span>usa una imagen nítida, comprueba el recorte y escribe un texto alternativo que describa lo que se ve.</span></div>
        <div class="admin-image-grid">${SITE_IMAGE_SLOTS.map(slot => {
            const current = savedImages[slot.key] || { url: slot.defaultUrl, alt: slot.alt };
            return `<form class="admin-image-card" data-image-slot="${escapeHTML(slot.key)}">
                <div class="admin-image-preview"><img src="${escapeHTML(current.url)}" alt="${escapeHTML(current.alt || slot.alt)}"><span class="admin-image-status ${savedImages[slot.key] ? 'is-custom' : ''}">${savedImages[slot.key] ? 'Personalizada' : 'Imagen actual'}</span></div>
                <div class="admin-image-card-heading"><div><p class="admin-image-slot">${escapeHTML(slot.key)}</p><h3>${escapeHTML(slot.label)}</h3><p>${savedImages[slot.key] ? 'Publicada desde la biblioteca.' : 'Usando el recurso original del sitio.'}</p></div></div>
                <label class="admin-setting-field"><span>Texto alternativo</span><input name="alt" value="${escapeHTML(current.alt || slot.alt)}" maxlength="160"></label>
                <label class="admin-setting-field admin-file-picker"><span>Reemplazar imagen</span><input name="file" type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" required><small>PNG, JPG o WEBP, hasta 8 MB.</small></label>
                <div class="admin-image-actions"><button type="submit">Subir y aplicar</button>${savedImages[slot.key] ? '<button type="button" class="admin-image-reset">Restaurar actual</button>' : ''}</div>
                <p class="admin-image-message" aria-live="polite"></p>
            </form>`;
        }).join('')}</div>`;

    container.querySelectorAll('.admin-image-card').forEach(form => {
        form.addEventListener('submit', uploadSiteImage);
        form.querySelector('.admin-image-reset')?.addEventListener('click', () => resetSiteImage(form.dataset.imageSlot));
    });
}

async function uploadSiteImage(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get('file');
    const message = form.querySelector('.admin-image-message');
    const button = form.querySelector('button[type="submit"]');
    if (!(file instanceof File) || !file.size) return;

    const data = new FormData();
    data.append('slot', form.dataset.imageSlot);
    data.append('alt', new FormData(form).get('alt'));
    data.append('file', file);
    button.disabled = true;
    message.textContent = 'Subiendo imagen...';
    try {
        await request('/api/admin/site-images', { method: 'POST', body: data });
        await loadSiteConfiguration();
        renderImageManager(state.siteConfiguration);
    } catch (error) {
        message.textContent = getUserMessage(error);
    } finally {
        button.disabled = false;
    }
}

async function resetSiteImage(slot) {
    try {
        await request(`/api/admin/site-images/${encodeURIComponent(slot)}`, { method: 'DELETE' });
        await loadSiteConfiguration();
        renderImageManager(state.siteConfiguration);
    } catch (error) {
        setSessionStatus(getUserMessage(error), true);
    }
}

async function loadSiteConfiguration() {
    const response = await request('/api/admin/site-config');
    state.siteConfiguration = response.config;
    return state.siteConfiguration;
}

async function showAdminView(view) {
    state.activeView = view;
    document.querySelectorAll('[data-admin-view]').forEach(button => {
        const active = button.dataset.adminView === view;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-selected', String(active));
    });
    ['orders', 'configuration', 'images'].forEach(name => {
        document.getElementById(`admin-${name}-view`).hidden = name !== view;
    });

    if (view === 'configuration' || view === 'images') {
        const container = document.getElementById(view === 'configuration' ? 'admin-config-content' : 'admin-images-content');
        container.innerHTML = '<div class="admin-empty-state"><strong>Cargando configuración...</strong></div>';
        try {
            const configuration = await loadSiteConfiguration();
            if (view === 'configuration') renderConfigurationEditor(configuration);
            if (view === 'images') renderImageManager(configuration);
        } catch (error) {
            container.innerHTML = `<div class="admin-empty-state is-error"><strong>No se pudo cargar la configuración</strong><span>${escapeHTML(getUserMessage(error))}</span></div>`;
        }
    }
}

async function login(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const message = document.getElementById('admin-login-message');
    const password = new FormData(form).get('password');
    button.disabled = true;
    message.textContent = 'Verificando acceso...';
    try {
        await request('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        form.reset();
        showPanel(true);
        await Promise.all([loadOrders(), loadMetrics()]);
    } catch (error) {
        message.textContent = getUserMessage(error);
    } finally {
        button.disabled = false;
    }
}

async function logout({ message = '' } = {}) {
    try {
        await request('/api/admin/logout', { method: 'POST' });
    } catch {
        // The client must still lock the panel when the logout request cannot finish.
    } finally {
        showLogin(message);
        if (message) showToast('Sesión cerrada por seguridad.');
    }
}

async function restoreSession() {
    try {
        await request('/api/admin/metrics');
        showPanel();
        await Promise.all([loadOrders(), loadMetrics()]);
    } catch {
        showLogin();
    }
}

function initializeEvents() {
    document.getElementById('admin-login-form')?.addEventListener('submit', login);
    document.getElementById('admin-logout')?.addEventListener('click', logout);
    document.querySelectorAll('[data-admin-view]').forEach(button => {
        button.addEventListener('click', () => showAdminView(button.dataset.adminView));
    });
    document.getElementById('admin-refresh')?.addEventListener('click', () => Promise.all([loadOrders(), loadMetrics()]));
    document.getElementById('admin-status-filter')?.addEventListener('change', () => {
        state.page = 1;
        loadOrders();
    });
    document.getElementById('admin-search')?.addEventListener('input', () => {
        clearTimeout(state.searchTimer);
        state.searchTimer = setTimeout(() => {
            state.page = 1;
            loadOrders();
        }, 250);
    });
    document.getElementById('admin-prev-page')?.addEventListener('click', () => {
        if (state.page > 1) {
            state.page -= 1;
            loadOrders();
        }
    });
    document.getElementById('admin-next-page')?.addEventListener('click', () => {
        if (state.page * state.limit < state.total) {
            state.page += 1;
            loadOrders();
        }
    });
    ['pointerdown', 'keydown', 'input', 'touchstart'].forEach(eventName => {
        document.addEventListener(eventName, registerSessionActivity, { passive: eventName !== 'keydown' });
    });
    document.addEventListener('visibilitychange', () => {
        if (!state.isAuthenticated || document.hidden) return;
        if (Date.now() - state.lastActivityAt >= ADMIN_IDLE_TIMEOUT_MS) {
            logout({ message: 'Sesión cerrada por inactividad. Inicia sesión nuevamente.' });
            return;
        }
        resetSessionIdleTimer();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeEvents();
    restoreSession();
});
