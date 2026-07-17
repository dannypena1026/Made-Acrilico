# MADE ACRÍLICO

Página web oficial de MADE ACRÍLICO para presentar servicios gráficos, cotizar DTF Textil, DTF UV y stickers, recibir archivos de clientes, armar carrito y enviar órdenes a revisión.

## Funcionalidades principales

- Inicio comercial con carrusel, acceso a tienda, resumen de servicios y sección "Quiénes somos".
- Sección DTF independiente con servicios, tarifas, galería, checklist y preguntas frecuentes.
- Sección Tienda para productos y artículos personalizados.
- Calculador Express para DTF Textil, DTF UV y stickers.
- Cálculo de stickers con mínimo, precio unitario y descuento automático interno.
- Subida validada de archivos a Cloudinary a través de un Cloudflare Worker, sin credenciales en el navegador.
- Registro durable de órdenes y eventos en Cloudflare D1 antes del envío de correo.
- Panel interno de operaciones con sesión segura para pedidos, estados, pagos manuales, datos comerciales, precios e imágenes principales.
- Carrito con persistencia local, resumen, impuestos, envío opcional y confirmación de orden.
- Contacto con motivos de consulta, WhatsApp, teléfono, correo, mapa y asesoría de archivo.
- Políticas de privacidad y términos de servicio desde modal legal.
- SEO básico con canonical, sitemap, robots, favicon, preview social y JSON-LD.
- Cabeceras de seguridad para el despliegue en Cloudflare Pages.
- Assets optimizados en WebP para reducir peso de carga.

## Flujo del cliente

1. El cliente entra al Inicio, DTF, Tienda o Calculador Express.
2. Selecciona material, medida y cantidad.
3. Sube archivo cuando aplica.
4. Agrega el producto al carrito.
5. Completa datos de contacto y entrega.
6. Revisa la orden antes de enviar.
7. Envía la solicitud al Worker, que recalcula la cotización y la entrega por correo mediante Web3Forms.
8. Puede avisar por WhatsApp usando el número de orden.

WhatsApp se usa para atención rápida, asesoría de archivo y seguimiento. La orden formal pasa por el Worker antes de enviarse por correo mediante Web3Forms.

## Configuración del negocio

Los valores de respaldo del negocio viven en:

```text
js/core/business-config.js
```

Para cambios diarios usa `admin.html`, que guarda los cambios validados en Cloudflare D1. Ese archivo queda como respaldo y permite modificar:

- Nombre del negocio.
- WhatsApp, teléfono visible y enlace telefónico.
- Correo.
- Dirección y enlace de Google Maps.
- Tiempo de entrega.
- Métodos de pago.
- Aviso de cotización estimada.
- Formatos permitidos para archivo.
- URL opcional del Worker si se publica en un subdominio, en vez de bajo `/api`.
- Precios por material.
- Reglas de mínimos y descuentos.
- Imágenes principales del inicio, tienda y páginas de servicio.

## Assets activos

Los assets que actualmente usa la página son:

```text
assets/img/favicon-made-acrilico-v170.png
assets/img/etiquetas.webp
assets/img/inicio.webp
assets/img/lgo-madeacrilico-store.webp
assets/img/MADEACRILICO ORIZONTAL.png
assets/img/madeacrilico-horizontal.webp
assets/img/social-preview-made-acrilico-v170.png
assets/img/stickers-optimized.webp
assets/img/test_textil.webp
assets/img/test_uv.webp
```

El logo visible, el favicon, la vista previa social y el dato estructurado usan las versiones optimizadas actuales.

## Servicios externos

### Worker protegido

Las claves de servicios externos y Web3Forms no viven en `business-config.js` ni se cargan en el navegador. Los diseños pasan por el Worker, que valida archivos, limita abuso por IP, recalcula la cotización y envía la solicitud. Cloudinary se usa con un preset unsigned restringido al que solo llama el Worker.

Consulta [worker/README.md](worker/README.md) para configurar desarrollo, secretos y rutas de producción.

El panel interno está en `admin.html`. No aparece en la navegación comercial y exige una sesión con contraseña configurada como secreto del Worker; consulta la sección “Panel interno protegido” del documento del Worker. Los cambios se aplican a nuevas cotizaciones; las órdenes guardadas mantienen su propio cálculo histórico.

Al migrar, rota la clave anterior de Web3Forms y elimina las credenciales o presets de Cloudinary que ya no se utilicen antes de desplegar la nueva web.

## Estructura general

```text
assets/
  img/
css/
  styles.css
  tailwind.css
  tailwind.input.css
js/
  app.js
  core/
    business-config.js
    constants.js
    file-policy.js
    pricing-engine.js
    state.js
  modules/
    cart.js
    pricing.js
    ui.js
    upload.js
  utils/
    dom.js
    helpers.js
worker/
  src/
    index.js
  wrangler.jsonc
scripts/
  check-js.mjs
  check-project.mjs
test/
  file-policy.test.js
  helpers.test.js
  pricing-engine.test.js
index.html
_headers
package.json
tailwind.config.cjs
```

## Comandos

Instalar dependencias:

```bash
npm install
```

Generar CSS:

```bash
npm run build:css
```

Revisar JavaScript:

```bash
npm run check:js
```

Validar HTML, rutas locales y hashes de CSP:

```bash
npm run check:project
```

Ejecutar pruebas:

```bash
npm test
```

Iniciar la API protegida durante desarrollo:

```bash
npm run dev:worker
```

## Checklist antes de publicar

- Ejecutar `npm run build:css`.
- Ejecutar `npm run check:js`.
- Ejecutar `npm run check:project`.
- Ejecutar `npm test`.
- Probar navegación por hash: `#inicio`, `#dtf`, `#planilla`, `#guia`, `#contacto`, `#tienda`.
- Probar que al recargar no aparezcan secciones o datos antiguos.
- Probar subida de archivo con el Worker iniciado.
- Probar carrito con y sin envío.
- Probar cálculo de Textil, UV y Stickers.
- Probar formulario de contacto y envío de orden.
- Confirmar que los enlaces de WhatsApp, teléfono, correo y mapa abren correctamente.
- Confirmar que favicon y preview social se ven con los assets actuales.

## Notas de mantenimiento

- Para cambios diarios de contactos, precios, mínimos, descuentos e imágenes usa `admin.html`. Edita `business-config.js` solo para actualizar los valores de respaldo incluidos en el repositorio y después ejecuta `npm test`.
- Si cambian clases Tailwind en HTML o JS, ejecuta `npm run build:css`.
- Si cambia el correo receptor, actualiza el secreto `WEB3FORMS_ACCESS_KEY` del Worker.
- Si cambian logos o previews, elimina assets antiguos no usados para evitar referencias fantasma.
- No compartas los secretos del Worker ni subas `worker/.dev.vars` al repositorio.

## Límites de la arquitectura actual

El sitio conserva una interfaz estática, pero usa un Cloudflare Worker y Cloudflare D1 para procesar archivos, órdenes y configuración de forma protegida. El panel cuenta con una única contraseña de operaciones, no con usuarios o roles separados. La revisión humana antes de producir sigue siendo la autoridad final; no uses el total como comprobante de pago ni como autorización automática de producción.

## Autor

- Danny Peña Adames - Desarrollador Web
