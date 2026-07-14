import { BUSINESS_CONFIG } from '../core/business-config.js';
import { appState, setCurrentMaterial, setCurrentTab } from '../core/state.js';
import { $all, $id } from '../utils/dom.js';
import { calculatePrice } from './pricing.js';

let confirmResolver = null;
let activeDialog = null;
let cartFocusOrigin = null;
const dialogFocusOrigins = new WeakMap();

const DEFAULT_TAB = 'inicio';

const TAB_METADATA = {
    inicio: {
        title: 'MADE ACRÍLICO | Taller gráfico en Santo Domingo',
        description: 'DTF Textil, DTF UV, stickers, acrílicos y servicios gráficos en Santo Domingo.'
    },
    dtf: {
        title: 'DTF Textil y DTF UV en Santo Domingo | MADE ACRÍLICO',
        description: 'Impresión DTF Textil y DTF UV adhesivo con revisión de archivo y producción local.'
    },
    planilla: {
        title: 'Calculador Express de DTF y Stickers | MADE ACRÍLICO',
        description: 'Calcula DTF Textil, DTF UV y stickers por medida, material y cantidad.'
    },
    guia: {
        title: 'Guía para preparar archivos de impresión | MADE ACRÍLICO',
        description: 'Requisitos de resolución, tamaño, transparencia y formato para archivos de impresión.'
    },
    contacto: {
        title: 'Contacto y cotizaciones | MADE ACRÍLICO',
        description: 'Contacta a MADE ACRÍLICO en Santo Domingo para cotizaciones y asesoría de archivos.'
    },
    tienda: {
        title: 'Tienda de artículos personalizados | MADE ACRÍLICO',
        description: 'Artículos para sublimación, acrílicos, DTF, stickers, reconocimientos y letreros.'
    }
};

const MOBILE_FLOATING_ACTIONS = {
    inicio: {
        label: 'Cotizar ahora',
        icon: 'fa-solid fa-calculator',
        tab: 'planilla',
        className: 'bg-logoMagenta'
    },
    dtf: {
        label: 'Calcular DTF',
        icon: 'fa-solid fa-calculator',
        tab: 'planilla',
        className: 'bg-logoCyan'
    },
    planilla: {
        label: 'Agregar al carrito',
        icon: 'fa-solid fa-basket-shopping',
        action: 'add-to-cart',
        className: 'bg-logoDark'
    },
    guia: {
        label: 'Calcular material',
        icon: 'fa-solid fa-calculator',
        tab: 'planilla',
        className: 'bg-logoMagenta'
    },
    contacto: {
        label: 'WhatsApp directo',
        icon: 'fa-brands fa-whatsapp',
        action: 'whatsapp',
        className: 'bg-emerald-500'
    },
    tienda: {
        label: 'Ver productos',
        icon: 'fa-solid fa-bag-shopping',
        tab: 'tienda',
        className: 'bg-logoMagenta'
    }
};

const LEGAL_CONTENT = {
    privacy: {
        eyebrow: 'Política de privacidad',
        title: 'Tratamiento de datos personales',
        html: `
            <p>En MADE ACRÍLICO respetamos la privacidad de nuestros clientes y tratamos los datos personales con fines específicos, legítimos y relacionados con la prestación de nuestros servicios gráficos. Esta política explica qué información recopilamos, para qué la usamos, cómo la protegemos y qué opciones tiene el cliente sobre sus datos.</p>
            <p>Esta política toma como referencia los principios de protección de datos personales aplicables en República Dominicana, incluyendo la Ley núm. 172-13 sobre protección integral de datos personales, sin sustituir una asesoría legal personalizada.</p>
            <div>
                <h4 class="font-extrabold text-logoDark mb-2">Datos que podemos recopilar</h4>
                <ul class="list-disc pl-5 space-y-1">
                    <li>Nombre, teléfono, correo electrónico y mensajes enviados por formularios, WhatsApp u otros canales de contacto.</li>
                    <li>Datos del pedido: material solicitado, medidas, cantidades, terminaciones, instrucciones de producción, forma de entrega y dirección cuando aplique.</li>
                    <li>Archivos, artes, diseños, imágenes, logos o referencias enviados por el cliente para cotización, revisión o producción.</li>
                    <li>Información técnica básica del uso del sitio, como datos guardados localmente en el navegador para conservar el carrito o la cotización durante la visita.</li>
                </ul>
            </div>
            <div>
                <h4 class="font-extrabold text-logoDark mb-2">Finalidad del uso de la información</h4>
                <ul class="list-disc pl-5 space-y-1">
                    <li>Responder consultas, preparar cotizaciones y dar seguimiento a solicitudes de servicio.</li>
                    <li>Revisar archivos antes de producir para validar medidas, resolución, transparencia, formato y compatibilidad con el material solicitado.</li>
                    <li>Coordinar producción, pago, retiro, envío, entrega, cambios, aclaraciones y soporte posterior al pedido.</li>
                    <li>Conservar evidencia operativa de una orden para control interno, atención al cliente y resolución de dudas o reclamaciones.</li>
                    <li>Mejorar el funcionamiento del sitio, el calculador y la experiencia de cotización.</li>
                </ul>
            </div>
            <div>
                <h4 class="font-extrabold text-logoDark mb-2">Archivos, propiedad intelectual y confidencialidad</h4>
                <p>Los archivos enviados por el cliente se utilizan únicamente para revisión, cotización, preparación y producción del pedido solicitado. El cliente declara que cuenta con autorización para usar los diseños, marcas, logos, imágenes, frases o materiales enviados. MADE ACRÍLICO no vende ni cede archivos de clientes a terceros para fines comerciales ajenos al pedido.</p>
            </div>
            <div>
                <h4 class="font-extrabold text-logoDark mb-2">Servicios externos necesarios</h4>
                <p>Para operar el sitio podemos utilizar herramientas de terceros, por ejemplo servicios de formularios, almacenamiento de archivos, mensajería, correo, mapas o analítica básica. Estos proveedores pueden procesar datos necesarios para completar la cotización, recibir archivos o enviar comunicaciones. Procuramos utilizar proveedores razonables para la operación del servicio, pero cada proveedor puede tener sus propias políticas.</p>
            </div>
            <div>
                <h4 class="font-extrabold text-logoDark mb-2">Conservación de datos</h4>
                <p>Conservamos los datos durante el tiempo necesario para atender la solicitud, ejecutar el pedido, cumplir obligaciones administrativas, responder reclamaciones o mantener historial operativo razonable. Cuando la información ya no sea necesaria, podrá eliminarse, anonimizarse o archivarse según corresponda.</p>
            </div>
            <div>
                <h4 class="font-extrabold text-logoDark mb-2">Seguridad</h4>
                <p>Aplicamos medidas razonables para proteger la información contra accesos no autorizados, pérdida, uso indebido o divulgación no autorizada. Aun así, ningún sistema de transmisión o almacenamiento en internet puede garantizar seguridad absoluta; por eso recomendamos no enviar información innecesaria, contraseñas, datos bancarios completos ni documentos sensibles si no son requeridos para el pedido.</p>
            </div>
            <div>
                <h4 class="font-extrabold text-logoDark mb-2">Derechos del cliente</h4>
                <p>El cliente puede solicitar acceso, corrección, actualización, oposición al uso o eliminación razonable de sus datos personales, sujeto a los límites operativos, legales o administrativos aplicables. Para ejercer estos derechos, puede contactarnos por WhatsApp o por el correo indicado en la sección de contacto.</p>
            </div>
            <div>
                <h4 class="font-extrabold text-logoDark mb-2">Menores de edad</h4>
                <p>Nuestros servicios están dirigidos a clientes con capacidad para contratar o a personas que actúan con autorización de un adulto responsable. Si recibimos información de una persona menor de edad sin autorización, podremos eliminarla o solicitar confirmación de un tutor.</p>
            </div>
            <p>Al usar el sitio, enviar un formulario, subir archivos o comunicarse con MADE ACRÍLICO, el cliente reconoce haber leído esta política y autoriza el uso de sus datos para los fines descritos.</p>
        `
    },
    terms: {
        eyebrow: 'Términos del servicio',
        title: 'Condiciones de pedidos y cotizaciones',
        html: `
            <p>Estos términos regulan el uso del sitio web, el calculador express, los formularios de contacto, la recepción de archivos y la contratación de servicios de impresión, rotulación, stickers, DTF, acrílico, gran formato, CNC, exhibidores y otros acabados gráficos ofrecidos por MADE ACRÍLICO.</p>
            <p>Al solicitar una cotización, subir un archivo, enviar una orden o aprobar una producción, el cliente acepta estas condiciones.</p>
            <div>
                <h4 class="font-extrabold text-logoDark mb-2">Cotizaciones y precios</h4>
                <ul class="list-disc pl-5 space-y-1">
                    <li>Las cotizaciones generadas por el sitio son estimadas y dependen de los datos ingresados por el cliente.</li>
                    <li>El precio final puede variar después de revisar el archivo, medida real, material, cantidad, acabado, urgencia, instalación, envío o complejidad del trabajo.</li>
                    <li>Los impuestos, cargos de entrega, instalación, diseño, preparación de archivo o servicios adicionales se confirman antes de producir cuando apliquen.</li>
                    <li>Una cotización no garantiza disponibilidad inmediata de material ni turno de producción hasta que la orden sea confirmada.</li>
                </ul>
            </div>
            <div>
                <h4 class="font-extrabold text-logoDark mb-2">Archivos y responsabilidad del cliente</h4>
                <ul class="list-disc pl-5 space-y-1">
                    <li>El cliente debe enviar archivos correctos, legibles, en buena resolución y a tamaño real cuando sea necesario.</li>
                    <li>El cliente es responsable de revisar nombres, teléfonos, textos, ortografía, logos, colores, cantidades y medidas antes de aprobar la producción.</li>
                    <li>Si el archivo requiere ajustes, conversión, limpieza, vectorización, fondo transparente, textos a curvas o preparación adicional, esto puede implicar costo extra o tiempo adicional.</li>
                    <li>MADE ACRÍLICO puede rechazar archivos de baja calidad, incompletos, corruptos, confusos o no aptos para el material solicitado.</li>
                    <li>El cliente declara tener derecho o autorización para reproducir los diseños, marcas, imágenes, personajes, logos o contenidos enviados.</li>
                </ul>
            </div>
            <div>
                <h4 class="font-extrabold text-logoDark mb-2">Color, acabados y tolerancias</h4>
                <p>Los colores pueden variar entre pantalla, muestras digitales, equipos, materiales y lotes de producción. Pueden existir variaciones normales de corte, margen, posición, textura, brillo, adhesión, temperatura, presión, curado o terminación según el tipo de material y proceso. Cuando el color exacto sea crítico, el cliente debe solicitar prueba o muestra previa, si está disponible.</p>
            </div>
            <div>
                <h4 class="font-extrabold text-logoDark mb-2">Aprobación y producción</h4>
                <ul class="list-disc pl-5 space-y-1">
                    <li>La producción inicia cuando el archivo, material, cantidad, precio, forma de pago y condiciones de entrega estén confirmados.</li>
                    <li>Una vez aprobada una orden, los cambios quedan sujetos al estado de producción y pueden generar costos adicionales.</li>
                    <li>Los tiempos de producción son estimados y pueden variar por volumen, disponibilidad, fallas técnicas, ajustes de archivo, feriados, clima, logística o causas fuera de control razonable.</li>
                    <li>Los pedidos urgentes deben confirmarse expresamente antes de producir y pueden tener recargo.</li>
                </ul>
            </div>
            <div>
                <h4 class="font-extrabold text-logoDark mb-2">Pagos</h4>
                <p>Los pagos se coordinan por los medios informados por MADE ACRÍLICO. En algunos casos puede requerirse anticipo o pago total antes de producir. Una orden no se considera confirmada hasta validar el pago requerido y los datos del pedido.</p>
            </div>
            <div>
                <h4 class="font-extrabold text-logoDark mb-2">Entregas, retiros e instalaciones</h4>
                <ul class="list-disc pl-5 space-y-1">
                    <li>El retiro, envío o instalación se coordina según disponibilidad, ubicación, volumen y tipo de producto.</li>
                    <li>Los tiempos de envío o entrega pueden depender de terceros o condiciones logísticas externas.</li>
                    <li>El cliente debe revisar el pedido al recibirlo e informar cualquier observación en el menor tiempo posible.</li>
                    <li>Productos personalizados, impresos o cortados a medida pueden no ser reutilizables para otro cliente.</li>
                </ul>
            </div>
            <div>
                <h4 class="font-extrabold text-logoDark mb-2">Cambios, cancelaciones y devoluciones</h4>
                <p>Los cambios o cancelaciones dependen del estado del pedido. Una orden en preparación, impresión, corte, instalación o producción puede no ser cancelable. Por tratarse de productos personalizados, las devoluciones solo aplican cuando exista un error atribuible a MADE ACRÍLICO y el caso sea reportado con evidencia razonable.</p>
            </div>
            <div>
                <h4 class="font-extrabold text-logoDark mb-2">Uso del sitio y calculadores</h4>
                <p>El sitio y sus calculadores se ofrecen como herramientas de referencia para facilitar cotizaciones. MADE ACRÍLICO puede actualizar precios, materiales, mínimos, descuentos, disponibilidad, textos o funcionalidades sin previo aviso. Si ocurre un error técnico, tipográfico o de cálculo evidente, el precio podrá corregirse antes de confirmar la orden.</p>
            </div>
            <div>
                <h4 class="font-extrabold text-logoDark mb-2">Límites de responsabilidad</h4>
                <p>MADE ACRÍLICO no será responsable por errores aprobados por el cliente, archivos mal preparados, baja resolución, derechos de uso no autorizados, datos incorrectos, demoras causadas por falta de respuesta del cliente, mal uso posterior del producto, instalación realizada por terceros o condiciones de superficie no informadas previamente.</p>
            </div>
            <div>
                <h4 class="font-extrabold text-logoDark mb-2">Comunicación oficial</h4>
                <p>La comunicación de pedidos puede realizarse por WhatsApp, correo electrónico, formularios del sitio u otros medios habilitados. El cliente debe proporcionar datos correctos y mantenerse disponible para confirmar detalles importantes de producción.</p>
            </div>
            <p>Estos términos pueden actualizarse cuando sea necesario. La versión publicada en el sitio será la referencia vigente para nuevas solicitudes.</p>
        `
    }
};

const MATERIAL_INFO_CONTENT = {
    textil: {
        eyebrow: 'DTF Textil',
        title: 'Transfers para ropa y marcas',
        calculateTab: 'planilla',
        material: 'textil',
        html: `
            <p>El DTF Textil es ideal para camisetas, hoodies, gorras, uniformes y colecciones de marca. Permite imprimir diseños a color, degradados y detalles finos sobre prendas de algodón, poliéster y mezclas.</p>
            <div>
                <h4 class="font-extrabold text-logoDark mb-2">Cuándo usarlo</h4>
                <ul class="list-disc pl-5 space-y-1">
                    <li>Ropa personalizada, merchandising, uniformes y piezas por encargo.</li>
                    <li>Diseños con muchos colores donde el vinil tradicional no conviene.</li>
                    <li>Producciones pequeñas o medianas sin mínimo alto por diseño.</li>
                </ul>
            </div>
            <div>
                <h4 class="font-extrabold text-logoDark mb-2">Archivo recomendado</h4>
                <p>Envía PNG transparente, PDF, AI o PSD en buena resolución. Si el arte tiene textos, conviene convertirlos a curvas antes de enviar.</p>
            </div>
        `
    },
    uv: {
        eyebrow: 'DTF UV',
        title: 'Adhesivos premium para objetos rígidos',
        calculateTab: 'planilla',
        material: 'uv',
        html: `
            <p>El DTF UV es un adhesivo con acabado brillante y relieve ligero, pensado para superficies rígidas como acrílico, vidrio, metal, frascos, vasos, empaques y productos promocionales.</p>
            <div>
                <h4 class="font-extrabold text-logoDark mb-2">Cuándo usarlo</h4>
                <ul class="list-disc pl-5 space-y-1">
                    <li>Branding de vasos, botellas, empaques y productos de venta.</li>
                    <li>Logos o etiquetas que necesitan verse premium sin impresión directa.</li>
                    <li>Superficies lisas donde se busca buena adherencia y acabado llamativo.</li>
                </ul>
            </div>
            <div>
                <h4 class="font-extrabold text-logoDark mb-2">Antes de producir</h4>
                <p>La superficie debe estar limpia, lisa y seca. Algunas texturas, siliconas o superficies porosas pueden afectar la adhesión.</p>
            </div>
        `
    },
    stickers: {
        eyebrow: 'Stickers',
        title: 'Etiquetas y stickers para productos',
        calculateTab: 'planilla',
        material: 'stickers',
        html: `
            <p>Los stickers funcionan para empaques, etiquetas de producto, sellos, promociones y detalles de marca. Se calculan por tamaño, cantidad y material.</p>
            <div>
                <h4 class="font-extrabold text-logoDark mb-2">Cuándo usarlos</h4>
                <ul class="list-disc pl-5 space-y-1">
                    <li>Etiquetas para frascos, fundas, cajas, bolsas y productos terminados.</li>
                    <li>Stickers promocionales para eventos, entregas y branding.</li>
                    <li>Sellos de empaque y piezas pequeñas por cantidad.</li>
                </ul>
            </div>
            <div>
                <h4 class="font-extrabold text-logoDark mb-2">Regla de mínimos</h4>
                <p>Para medidas pequeñas puede aplicar cantidad mínima. Si el sticker supera 3 pulgadas, el calculador permite cantidades menores y ajusta el precio automáticamente.</p>
            </div>
        `
    }
};

export function showToast(message, type = 'info') {
    const container =
        $id('toast-container');

    if (!container) return;

    const toast =
        document.createElement('div');

    const toneClass =
        type === 'error'
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-gray-200 bg-white text-logoDark';

    toast.className =
        `rounded-2xl border ${toneClass} shadow-xl px-4 py-3 text-sm font-bold max-w-xs transition-all`;

    toast.setAttribute(
        'role',
        type === 'error' ? 'alert' : 'status'
    );
    toast.setAttribute('aria-atomic', 'true');

    toast.innerText =
        message;

    container.appendChild(toast);

    window.setTimeout(
        () => {
            toast.classList.add('opacity-0', 'translate-y-2');
            window.setTimeout(
                () => toast.remove(),
                250
            );
        },
        3500
    );
}

export function confirmAction({
    title = 'Confirmar acción',
    message = '¿Deseas continuar?',
    confirmLabel = 'Confirmar'
} = {}) {
    const modal =
        $id('confirm-modal');

    if (!modal) {
        showToast(
            message,
            'error'
        );

        return Promise.resolve(false);
    }

    $id('confirm-modal-title').innerText =
        title;

    $id('confirm-modal-message').innerText =
        message;

    $id('confirm-modal-confirm').innerText =
        confirmLabel;

    openAccessibleDialog(modal, '#confirm-modal-cancel');

    return new Promise(resolve => {
        confirmResolver = resolve;
    });
}

function resolveConfirmModal(value) {
    const modal =
        $id('confirm-modal');

    closeAccessibleDialog(modal);

    if (confirmResolver) {
        confirmResolver(value);
        confirmResolver = null;
    }
}

function getValidTabId(tabId) {
    return $id(`tab-${tabId}`)
        ? tabId
        : DEFAULT_TAB;
}

function getTabIdFromLocation() {
    return getValidTabId(
        window.location.hash.replace('#', '')
    );
}

function getTabURL(tabId) {
    const url =
        new URL(window.location.href);

    if (tabId === 'planilla') {
        url.searchParams.set(
            'material',
            appState.currentMaterial
        );
    } else {
        url.searchParams.delete('material');
    }

    const baseURL =
        `${url.pathname}${url.search}`;

    return tabId === DEFAULT_TAB
        ? baseURL
        : `${baseURL}#${tabId}`;
}

function updateTabHistory(tabId, replace = false) {
    if (!window.history?.pushState) return;

    const nextURL =
        getTabURL(tabId);

    const currentURL =
        `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (!replace && currentURL === nextURL) return;

    const method =
        replace
            ? 'replaceState'
            : 'pushState';

    window.history[method](
        { tabId },
        '',
        nextURL
    );
}

function updateMobileFloatingAction(tabId) {
    const button =
        $id('mobile-floating-action');

    const label =
        $id('mobile-floating-action-label');

    const icon =
        $id('mobile-floating-action-icon');

    if (!button || !label || !icon) return;

    const config =
        MOBILE_FLOATING_ACTIONS[tabId] ||
        MOBILE_FLOATING_ACTIONS.inicio;

    label.innerText =
        config.label;

    icon.className =
        `${config.icon} shrink-0`;

    button.dataset.goTab =
        config.tab || '';

    button.dataset.mobileAction =
        config.action || 'tab';

    button.classList.remove(
        'bg-logoMagenta',
        'bg-logoCyan',
        'bg-logoDark',
        'bg-emerald-500'
    );

    button.classList.add(
        config.className
    );
}

function updateTabMetadata(tabId) {
    const metadata =
        TAB_METADATA[tabId] || TAB_METADATA.inicio;

    document.title = metadata.title;
    document.querySelector('meta[name="description"]')
        ?.setAttribute('content', metadata.description);
}

export function switchTab(tabId, {
    updateHistory = true,
    replaceHistory = false,
    scroll = true
} = {}) {
    const nextTabId =
        getValidTabId(tabId);

    $all('.tab-content')
        .forEach(tab => {
            tab.classList.add('hidden');
            tab.classList.remove('block');
        });

    const activeTab =
        $id(`tab-${nextTabId}`);

    if (activeTab) {
        activeTab.classList.remove('hidden');
        activeTab.classList.add('block');
        setCurrentTab(nextTabId);
        document.body.dataset.activeTab = nextTabId;
    }

    $all('.nav-btn')
        .forEach(button => {
            button.removeAttribute('aria-current');
            button.classList.remove(
                'text-logoMagenta',
                'bg-pink-50',
                'font-bold'
            );

            button.classList.add(
                'text-gray-600',
                'font-semibold'
            );
        });

    const activeButton =
        $id(`nav-${nextTabId}`);

    if (activeButton) {
        activeButton.setAttribute('aria-current', 'page');
        activeButton.classList.add(
            'text-logoMagenta',
            'bg-pink-50',
            'font-bold'
        );

        activeButton.classList.remove(
            'text-gray-600',
            'font-semibold'
        );
    }

    updateMobileFloatingAction(nextTabId);
    updateTabMetadata(nextTabId);

    $all('.nav-btn-mobile')
        .forEach(button => {
            const isActive = button.dataset.tab === nextTabId;

            if (isActive) {
                button.setAttribute('aria-current', 'page');
            } else {
                button.removeAttribute('aria-current');
            }
        });

    if (nextTabId === 'planilla') {
        calculatePrice();
    }

    if (updateHistory) {
        updateTabHistory(
            nextTabId,
            replaceHistory
        );
    }

    if (scroll) {
        const reduceMotion =
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        window.scrollTo({
            top: 0,
            behavior: reduceMotion ? 'auto' : 'smooth'
        });
    }
}

function applyBusinessConfig() {
    $all('[data-business-whatsapp]')
        .forEach(link => {
            const message =
                link.dataset.whatsappMessage;

            link.href =
                `https://wa.me/${BUSINESS_CONFIG.whatsappNumber}${
                    message
                        ? `?text=${encodeURIComponent(message)}`
                        : ''
                }`;
        });

    $all('[data-business-phone]')
        .forEach(link => {
            link.href =
                `tel:${BUSINESS_CONFIG.phoneHref}`;
        });

    $all('[data-business-phone-text]')
        .forEach(element => {
            element.innerText =
                BUSINESS_CONFIG.phoneDisplay;
        });

    $all('[data-business-email]')
        .forEach(link => {
            link.href =
                `mailto:${BUSINESS_CONFIG.email}`;
            link.innerText =
                BUSINESS_CONFIG.email;
        });

    $all('[data-business-address]')
        .forEach(element => {
            element.innerText =
                BUSINESS_CONFIG.address;
        });

    $all('[data-business-maps]')
        .forEach(link => {
            link.href =
                BUSINESS_CONFIG.mapsUrl;
        });
}

function openLegalModal(type) {
    const content =
        LEGAL_CONTENT[type];

    const modal =
        $id('legal-modal');

    if (!content || !modal) return;

    $id('legal-modal-eyebrow').innerText =
        content.eyebrow;

    $id('legal-modal-title').innerText =
        content.title;

    $id('legal-modal-content').innerHTML =
        content.html;

    openAccessibleDialog(modal, '#legal-modal-close');
}

function closeLegalModal() {
    const modal =
        $id('legal-modal');

    closeAccessibleDialog(modal);
}

function openMaterialInfoModal(materialId) {
    const content =
        MATERIAL_INFO_CONTENT[materialId];

    const modal =
        $id('material-info-modal');

    if (!content || !modal) return;

    $id('material-info-eyebrow').innerText =
        content.eyebrow;

    $id('material-info-title').innerText =
        content.title;

    $id('material-info-content').innerHTML =
        content.html;

    const calculateButton =
        $id('material-info-calculate');

    if (calculateButton) {
        calculateButton.dataset.goTab =
            content.calculateTab || 'planilla';

        calculateButton.dataset.calculatorMaterial =
            content.material || '';
    }

    openAccessibleDialog(modal, '#material-info-close');
}

function closeMaterialInfoModal() {
    const modal =
        $id('material-info-modal');

    closeAccessibleDialog(modal);
}

function getFocusableElements(container) {
    return Array.from(
        container.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
    ).filter(element => element.getClientRects().length > 0);
}

function handleGlobalKeydown(event) {
    const visibleDialogs =
        Array.from(document.querySelectorAll('[role="dialog"]'))
            .filter(modal =>
                !modal.classList.contains('hidden') &&
                !modal.inert
            );

    const topDialog =
        visibleDialogs[visibleDialogs.length - 1];

    const mobileMenu =
        $id('mobile-menu');

    const openMobileMenu =
        mobileMenu && !mobileMenu.classList.contains('hidden')
            ? mobileMenu
            : null;

    if (event.key === 'Escape') {
        if (topDialog) {
            event.preventDefault();

            if (topDialog.id === 'confirm-modal') resolveConfirmModal(false);
            if (topDialog.id === 'legal-modal') closeLegalModal();
            if (topDialog.id === 'material-info-modal') closeMaterialInfoModal();
            if (topDialog.id === 'order-review-modal') $id('order-review-cancel')?.click();
            if (topDialog.id === 'order-success-modal') $id('order-success-close')?.click();
            if (topDialog.id === 'cart-sidebar') closeCart();
            return;
        }

        if (openMobileMenu) {
            closeMobileMenu({ restoreFocus: true });
            return;
        }

        if (!$id('cart-sidebar')?.classList.contains('translate-x-full')) {
            closeCart();
            $id('cart-toggle-btn')?.focus();
        }
        return;
    }

    const focusScope =
        topDialog || openMobileMenu;

    if (event.key !== 'Tab' || !focusScope) return;

    const focusable = getFocusableElements(focusScope);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

function openAccessibleDialog(modal, initialFocusSelector) {
    if (!modal) return;

    dialogFocusOrigins.set(modal, document.activeElement);
    activeDialog = modal;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    lockPageScroll();

    window.requestAnimationFrame(() => {
        const initialFocus =
            modal.querySelector(initialFocusSelector) ||
            getFocusableElements(modal)[0];
        initialFocus?.focus();
    });
}

function closeAccessibleDialog(modal) {
    if (!modal) return;

    modal.classList.add('hidden');
    modal.classList.remove('flex');

    if (activeDialog === modal) {
        activeDialog = null;
    }

    unlockPageScroll();
    dialogFocusOrigins.get(modal)?.focus?.();
    dialogFocusOrigins.delete(modal);
}

function toggleMobileMenu() {
    const menu =
        $id('mobile-menu');

    const header =
        document.querySelector('header');

    if (!menu) return;

    const willOpen =
        menu.classList.contains('hidden');

    const toggle =
        $id('mobile-menu-toggle');

    if (willOpen && header) {
        const headerRect =
            header.getBoundingClientRect();

        const top =
            Math.max(0, headerRect.bottom);

        menu.style.top =
            `${top}px`;

        menu.style.maxHeight =
            `calc(100vh - ${top}px)`;
    }

    menu.classList.toggle('hidden');
    toggle?.setAttribute('aria-expanded', String(willOpen));
    toggle?.setAttribute('aria-label', willOpen ? 'Cerrar menú' : 'Abrir menú');

    if (willOpen) {
        lockPageScroll();
        menu.querySelector('button')?.focus();
    } else {
        unlockPageScroll();
        toggle?.focus();
    }
}

function closeMobileMenu({ restoreFocus = false } = {}) {
    const menu = $id('mobile-menu');
    const toggle = $id('mobile-menu-toggle');

    if (!menu || menu.classList.contains('hidden')) return;

    menu.classList.add('hidden');
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-label', 'Abrir menú');
    unlockPageScroll();

    if (restoreFocus) toggle?.focus();
}

function lockPageScroll() {
    document.documentElement.classList.add('overflow-hidden');
    document.body.classList.add('overflow-hidden');
}

function unlockPageScroll() {
    const dialogOpen =
        Array.from($all('[role="dialog"]'))
            .some(modal =>
                !modal.classList.contains('hidden') &&
                !modal.inert
            );

    const cartOpen =
        !$id('cart-sidebar')?.classList.contains('translate-x-full');

    const menuOpen =
        !$id('mobile-menu')?.classList.contains('hidden');

    if (dialogOpen || cartOpen || menuOpen) return;

    document.documentElement.classList.remove('overflow-hidden');
    document.body.classList.remove('overflow-hidden');
}

export function toggleCart() {
    const cartSidebar =
        $id('cart-sidebar');

    const cartOverlay =
        $id('cart-overlay');

    if (!cartSidebar || !cartOverlay) return;

    const willOpen =
        cartSidebar.classList.contains('translate-x-full');

    cartSidebar.classList.toggle(
        'translate-x-full'
    );

    cartOverlay.classList.toggle(
        'hidden'
    );

    if (willOpen) {
        cartFocusOrigin = document.activeElement;
        cartSidebar.inert = false;
        $id('cart-toggle-btn')?.setAttribute('aria-expanded', 'true');
        lockPageScroll();
        window.requestAnimationFrame(
            () => $id('cart-close-btn')?.focus()
        );
        return;
    }

    cartSidebar.inert = true;
    $id('cart-toggle-btn')?.setAttribute('aria-expanded', 'false');
    unlockPageScroll();
    cartFocusOrigin?.focus?.();
    cartFocusOrigin = null;
}

export function openCart() {
    const cartSidebar =
        $id('cart-sidebar');

    const cartOverlay =
        $id('cart-overlay');

    if (!cartSidebar || !cartOverlay) return;

    if (!cartSidebar.classList.contains('translate-x-full')) return;

    cartFocusOrigin = document.activeElement;

    cartSidebar.classList.remove(
        'translate-x-full'
    );

    cartOverlay.classList.remove(
        'hidden'
    );

    cartSidebar.inert = false;
    $id('cart-toggle-btn')?.setAttribute('aria-expanded', 'true');
    lockPageScroll();
    window.requestAnimationFrame(
        () => $id('cart-close-btn')?.focus()
    );
}

export function closeCart() {
    const cartSidebar =
        $id('cart-sidebar');

    const cartOverlay =
        $id('cart-overlay');

    if (!cartSidebar || !cartOverlay) return;

    const wasOpen =
        !cartSidebar.classList.contains('translate-x-full');

    cartSidebar.classList.add(
        'translate-x-full'
    );

    cartOverlay.classList.add(
        'hidden'
    );

    cartSidebar.inert = true;
    $id('cart-toggle-btn')?.setAttribute('aria-expanded', 'false');
    unlockPageScroll();

    if (wasOpen) {
        cartFocusOrigin?.focus?.();
        cartFocusOrigin = null;
    }
}

function handleFormSubmit(event) {
    event.preventDefault();

    const formData =
        new FormData(event.target);

    const reason =
        formData.get('reason') || 'Consulta';

    const name =
        formData.get('name') || 'No indicado';

    const phone =
        formData.get('phone') || 'No indicado';

    const email =
        formData.get('email') || 'No indicado';

    const message =
        formData.get('message') || 'Sin mensaje';

    const whatsappMessage =
`Hola ${BUSINESS_CONFIG.name}

Me gustaría contactarles.

Motivo: ${reason}
Nombre: ${name}
Teléfono: ${phone}
Correo: ${email}

Mensaje:
${message}

Gracias.`;

    const whatsappURL =
        `https://wa.me/${BUSINESS_CONFIG.whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

    const whatsappWindow =
        window.open('', '_blank');

    if (!whatsappWindow) {
        showToast(
            'El navegador bloqueó WhatsApp. Permite ventanas emergentes e intenta otra vez.',
            'error'
        );
        return;
    }

    whatsappWindow.opener = null;
    whatsappWindow.location.replace(whatsappURL);
    event.target?.reset();
}

function activateTextilMode() {
    setCurrentMaterial('textil');
    document.dispatchEvent(
        new CustomEvent('calculator:material-change')
    );
    setMaterialPressedState('textil');
    clearQuantityMinimumValidity();

    btnTextil?.classList.add(
        'border-logoMagenta',
        'bg-pink-50',
        'text-logoMagenta'
    );

    btnTextil?.classList.remove(
        'border-gray-200',
        'text-gray-600'
    );

    btnUv?.classList.remove(
        'border-logoCyan',
        'bg-cyan-50',
        'text-logoCyan'
    );

    btnUv?.classList.add(
        'border-gray-200',
        'text-gray-600'
    );

    btnStickers?.classList.remove(
        'border-logoYellow',
        'bg-yellow-50',
        'text-logoDark'
    );

    btnStickers?.classList.add(
        'border-gray-200',
        'text-gray-600'
    );

    stickerMaterialBox?.classList.add('hidden');
    textilWidthBox?.classList.remove('hidden');
    uvWidthSelector?.classList.add('hidden');
    stickerWidthBox?.classList.add('hidden');
    textilHeightBox?.classList.remove('hidden');
    uvSelector?.classList.add('hidden');
    stickerHeightBox?.classList.add('hidden');
    $id('quantity-minimum-warning')?.classList.add('hidden');

    const quantityInput =
        $id('quantity');

    if (quantityInput) {
        quantityInput.min = '1';
        if (parseInt(quantityInput.value, 10) < 1) {
            quantityInput.value = '1';
        }
    }

    calculatePrice();
}

function activateUvMode() {
    setCurrentMaterial('uv');
    document.dispatchEvent(
        new CustomEvent('calculator:material-change')
    );
    setMaterialPressedState('uv');
    clearQuantityMinimumValidity();

    btnUv?.classList.add(
        'border-logoCyan',
        'bg-cyan-50',
        'text-logoCyan'
    );

    btnUv?.classList.remove(
        'border-gray-200',
        'text-gray-600'
    );

    btnTextil?.classList.remove(
        'border-logoMagenta',
        'bg-pink-50',
        'text-logoMagenta'
    );

    btnTextil?.classList.add(
        'border-gray-200',
        'text-gray-600'
    );

    btnStickers?.classList.remove(
        'border-logoYellow',
        'bg-yellow-50',
        'text-logoDark'
    );

    btnStickers?.classList.add(
        'border-gray-200',
        'text-gray-600'
    );

    stickerMaterialBox?.classList.add('hidden');
    textilWidthBox?.classList.add('hidden');
    uvWidthSelector?.classList.remove('hidden');
    stickerWidthBox?.classList.add('hidden');
    textilHeightBox?.classList.add('hidden');
    uvSelector?.classList.remove('hidden');
    stickerHeightBox?.classList.add('hidden');
    $id('quantity-minimum-warning')?.classList.add('hidden');

    const quantityInput =
        $id('quantity');

    if (quantityInput) {
        quantityInput.min = '1';
        if (parseInt(quantityInput.value, 10) < 1) {
            quantityInput.value = '1';
        }
    }

    calculatePrice();
}

function activateStickersMode() {
    setCurrentMaterial('stickers');
    document.dispatchEvent(
        new CustomEvent('calculator:material-change')
    );
    setMaterialPressedState('stickers');

    btnStickers?.classList.add(
        'border-logoYellow',
        'bg-yellow-50',
        'text-logoDark'
    );

    btnStickers?.classList.remove(
        'border-gray-200',
        'text-gray-600'
    );

    btnTextil?.classList.remove(
        'border-logoMagenta',
        'bg-pink-50',
        'text-logoMagenta'
    );

    btnTextil?.classList.add(
        'border-gray-200',
        'text-gray-600'
    );

    btnUv?.classList.remove(
        'border-logoCyan',
        'bg-cyan-50',
        'text-logoCyan'
    );

    btnUv?.classList.add(
        'border-gray-200',
        'text-gray-600'
    );

    stickerMaterialBox?.classList.remove('hidden');
    textilWidthBox?.classList.add('hidden');
    uvWidthSelector?.classList.add('hidden');
    stickerWidthBox?.classList.remove('hidden');
    textilHeightBox?.classList.add('hidden');
    uvSelector?.classList.add('hidden');
    stickerHeightBox?.classList.remove('hidden');

    updateStickerQuantityMinimum();

    calculatePrice();
}

function setMaterialPressedState(material) {
    [
        ['textil', btnTextil],
        ['uv', btnUv],
        ['stickers', btnStickers]
    ].forEach(([materialId, button]) => {
        button?.setAttribute(
            'aria-pressed',
            String(materialId === material)
        );
    });
}

function activateCalculatorMaterial(material) {
    const activators = {
        textil: activateTextilMode,
        uv: activateUvMode,
        stickers: activateStickersMode
    };

    if (!activators[material]) return;

    activators[material]();

    if (appState.currentTab === 'planilla') {
        updateTabHistory('planilla', true);
    }
}

function clearQuantityMinimumValidity() {
    const quantityInput =
        $id('quantity');

    if (!quantityInput) return;

    quantityInput.removeAttribute('aria-invalid');
    quantityInput.classList.remove(
        'border-red-400',
        'bg-red-50',
        'text-red-700',
        'focus:border-red-500',
        'focus:ring-red-100'
    );
    quantityInput.classList.add(
        'border-gray-200',
        'focus:border-logoYellow',
        'focus:ring-yellow-100'
    );
}

function getStickerMinimumQuantity() {
    const width =
        parseFloat($id('sticker-width')?.value);

    const height =
        parseFloat($id('sticker-height')?.value);

    if (
        Number.isFinite(width) &&
        Number.isFinite(height) &&
        (width > 3 || height > 3)
    ) {
        return 1;
    }

    return 100;
}

function updateStickerQuantityMinimum() {
    const warning =
        $id('quantity-minimum-warning');

    if (appState.currentMaterial !== 'stickers') {
        warning?.classList.add('hidden');
        clearQuantityMinimumValidity();
        return;
    }

    const quantityInput =
        $id('quantity');

    if (!quantityInput) return;

    const minimumQuantity =
        getStickerMinimumQuantity();

    quantityInput.min =
        String(minimumQuantity);

    if (!warning) return;

    if (minimumQuantity <= 1) {
        warning.classList.add('hidden');
        clearQuantityMinimumValidity();
        return;
    }

    const enteredQuantity =
        parseInt(quantityInput.value, 10);

    const belowMinimum =
        !Number.isFinite(enteredQuantity) ||
        enteredQuantity < minimumQuantity;

    if (belowMinimum) {
        quantityInput.setAttribute('aria-invalid', 'true');
    } else {
        quantityInput.removeAttribute('aria-invalid');
    }
    quantityInput.classList.toggle('border-red-400', belowMinimum);
    quantityInput.classList.toggle('bg-red-50', belowMinimum);
    quantityInput.classList.toggle('text-red-700', belowMinimum);
    quantityInput.classList.toggle('focus:border-red-500', belowMinimum);
    quantityInput.classList.toggle('focus:ring-red-100', belowMinimum);
    quantityInput.classList.toggle('border-gray-200', !belowMinimum);
    quantityInput.classList.toggle('focus:border-logoYellow', !belowMinimum);
    quantityInput.classList.toggle('focus:ring-yellow-100', !belowMinimum);

    warning.innerText =
        `El mínimo para esta medida es ${minimumQuantity} stickers.`;

    warning.classList.remove('hidden');
    warning.classList.toggle('text-red-500', belowMinimum);
    warning.classList.toggle('text-gray-400', !belowMinimum);
}

function initializeNavigation() {
    window.addEventListener(
        'popstate',
        event => {
            switchTab(
                event.state?.tabId || getTabIdFromLocation(),
                {
                    updateHistory: false,
                    scroll: true
                }
            );
        }
    );

    window.addEventListener(
        'hashchange',
        () => {
            const nextTabId =
                getTabIdFromLocation();

            if (appState.currentTab === nextTabId) return;

            switchTab(
                nextTabId,
                {
                    updateHistory: false,
                    scroll: true
                }
            );
        }
    );

    $all('[data-tab]')
        .forEach(button => {
            button.addEventListener(
                'click',
                () => {
                    switchTab(button.dataset.tab);

                    if (
                        button.dataset.mobileClose === 'true'
                    ) {
                        closeMobileMenu();
                    }
                }
            );
        });

    $all('[data-go-tab]')
        .forEach(button => {
            button.addEventListener(
                'click',
                () => {
                    if (button.id === 'mobile-floating-action') {
                        const action =
                            button.dataset.mobileAction;

                        if (action === 'add-to-cart') {
                            $id('add-to-cart-btn')?.click();
                            return;
                        }

                        if (action === 'whatsapp') {
                            const whatsappLink =
                                document.querySelector('[data-business-whatsapp]');

                            whatsappLink?.click();
                            return;
                        }
                    }

                    switchTab(button.dataset.goTab);

                    activateCalculatorMaterial(
                        button.dataset.calculatorMaterial
                    );
                }
            );
        });

    $id('logo-trigger')?.addEventListener(
        'click',
        () => switchTab('inicio')
    );

    $id('mobile-menu-toggle')?.addEventListener(
        'click',
        toggleMobileMenu
    );
}

function initializeLegalModal() {
    $all('[data-legal-open]')
        .forEach(button => {
            button.addEventListener(
                'click',
                () => openLegalModal(button.dataset.legalOpen)
            );
        });

    $id('legal-modal-close')?.addEventListener(
        'click',
        closeLegalModal
    );

    $id('legal-modal')?.addEventListener(
        'click',
        event => {
            if (event.target.id === 'legal-modal') {
                closeLegalModal();
            }
        }
    );
}

function initializeMaterialInfoModal() {
    $all('[data-material-info]')
        .forEach(button => {
            button.addEventListener(
                'click',
                () => openMaterialInfoModal(button.dataset.materialInfo)
            );
        });

    $id('material-info-close')?.addEventListener(
        'click',
        closeMaterialInfoModal
    );

    $id('material-info-modal')?.addEventListener(
        'click',
        event => {
            if (event.target.id === 'material-info-modal') {
                closeMaterialInfoModal();
            }
        }
    );

    $id('material-info-calculate')?.addEventListener(
        'click',
        () => {
            const calculateButton =
                $id('material-info-calculate');

            closeMaterialInfoModal();
            switchTab(
                calculateButton?.dataset.goTab || 'planilla'
            );
            activateCalculatorMaterial(
                calculateButton?.dataset.calculatorMaterial
            );
        }
    );
}

function initializeCartShell() {
    $id('cart-toggle-btn')?.addEventListener(
        'click',
        toggleCart
    );

    $id('cart-close-btn')?.addEventListener(
        'click',
        closeCart
    );

    $id('cart-overlay')?.addEventListener(
        'click',
        closeCart
    );
}

function initializeConfirmModal() {
    $id('confirm-modal-cancel')?.addEventListener(
        'click',
        () => resolveConfirmModal(false)
    );

    $id('confirm-modal-confirm')?.addEventListener(
        'click',
        () => resolveConfirmModal(true)
    );

    $id('confirm-modal')?.addEventListener(
        'click',
        event => {
            if (event.target.id === 'confirm-modal') {
                resolveConfirmModal(false);
            }
        }
    );
}

function initializeMaterialControls(initialMaterial = 'textil') {
    btnTextil?.addEventListener(
        'click',
        () => {
            activateTextilMode();
        }
    );

    btnUv?.addEventListener(
        'click',
        () => {
            activateUvMode();
        }
    );

    btnStickers?.addEventListener(
        'click',
        activateStickersMode
    );

    uvSize?.addEventListener(
        'change',
        () => {
            uvCustomBox?.classList.toggle(
                'hidden',
                uvSize.value !== 'custom'
            );

            calculatePrice();
        }
    );

    const textilSize =
        $id('textil-size');

    const textilCustomBox =
        $id('textil-custom-box');

    textilSize?.addEventListener(
        'change',
        () => {
            textilCustomBox?.classList.toggle(
                'hidden',
                textilSize.value !== 'custom'
            );

            calculatePrice();
        }
    );

    $id('textil-custom-height')?.addEventListener(
        'input',
        calculatePrice
    );

    $id('uv-width')?.addEventListener(
        'change',
        event => {
            calculatePrice();
        }
    );

    $id('uv-custom-height')?.addEventListener(
        'input',
        () => {
            calculatePrice();
        }
    );

    $id('quantity')?.addEventListener(
        'input',
        () => {
            updateStickerQuantityMinimum();
            calculatePrice();
        }
    );

    $id('sticker-material')?.addEventListener(
        'change',
        calculatePrice
    );

    $id('sticker-width')?.addEventListener(
        'input',
        () => {
            updateStickerQuantityMinimum();
            calculatePrice();
        }
    );

    $id('sticker-height')?.addEventListener(
        'input',
        () => {
            updateStickerQuantityMinimum();
            calculatePrice();
        }
    );

    resetCalculatorDefaults();
    activateCalculatorMaterial(initialMaterial);
}

function getRequestedMaterial() {
    const requestedMaterial =
        new URLSearchParams(window.location.search)
            .get('material');

    return getTabIdFromLocation() === 'planilla' &&
        ['textil', 'uv', 'stickers'].includes(requestedMaterial)
        ? requestedMaterial
        : 'textil';
}

function resetCalculatorDefaults() {
    const defaults = {
        'textil-size': '18',
        'textil-custom-height': '',
        'uv-width': '16',
        'uv-size': '11',
        'uv-custom-height': '',
        'sticker-material': 'white',
        'sticker-width': '3',
        'sticker-height': '4',
        quantity: '1'
    };

    Object.entries(defaults)
        .forEach(([id, value]) => {
            const control =
                $id(id);

            if (control) {
                control.value =
                    value;
            }
        });

    $id('textil-custom-box')?.classList.add('hidden');
    uvCustomBox?.classList.add('hidden');
}

export function initializeUI() {
    applyBusinessConfig();
    initializeNavigation();
    initializeLegalModal();
    initializeMaterialInfoModal();
    initializeCartShell();
    initializeConfirmModal();
    document.addEventListener('keydown', handleGlobalKeydown);

    $id('contact-form')?.addEventListener(
        'submit',
        handleFormSubmit
    );

    initializeMaterialControls(
        getRequestedMaterial()
    );

    switchTab(
        getTabIdFromLocation(),
        {
            replaceHistory: true,
            scroll: false
        }
    );

    delete document.documentElement.dataset.initialTab;
    delete document.documentElement.dataset.initialMaterial;
}

const btnTextil =
    $id('btn-textil');

const btnUv =
    $id('btn-uv');

const btnStickers =
    $id('btn-stickers');

const textilHeightBox =
    $id('textil-height-box');

const uvSelector =
    $id('uv-size-selector');

const stickerHeightBox =
    $id('sticker-height-box');

const textilWidthBox =
    $id('textil-width-box');

const uvWidthSelector =
    $id('uv-width-selector');

const stickerMaterialBox =
    $id('sticker-material-box');

const stickerWidthBox =
    $id('sticker-width-box');

const uvSize =
    $id('uv-size');

const uvCustomBox =
    $id('uv-custom-box');
