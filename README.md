# MADE ACRÍLICO

Página web oficial de MADE ACRÍLICO para presentar servicios gráficos, cotizar DTF Textil, DTF UV y stickers, recibir archivos de clientes, armar carrito y enviar órdenes a revisión.

## Funcionalidades principales

- Inicio comercial con carrusel, acceso a tienda, resumen de servicios y sección "Quiénes somos".
- Sección DTF independiente con servicios, tarifas, galería, checklist y preguntas frecuentes.
- Sección Tienda para productos y artículos personalizados.
- Calculador Express para DTF Textil, DTF UV y stickers.
- Cálculo de stickers con mínimo, precio unitario y descuento automático interno.
- Subida de archivos a Cloudinary para adjuntar referencia o arte final.
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
7. Envía la solicitud por correo mediante Web3Forms.
8. Puede avisar por WhatsApp usando el número de orden.

WhatsApp se usa para atención rápida, asesoría de archivo y seguimiento. La orden formal se envía por correo mediante Web3Forms.

## Configuración del negocio

Los datos principales viven en:

```text
js/core/business-config.js
```

Desde ese archivo se modifican:

- Nombre del negocio.
- WhatsApp, teléfono visible y enlace telefónico.
- Correo.
- Dirección y enlace de Google Maps.
- Tiempo de entrega.
- Métodos de pago.
- Aviso de cotización estimada.
- Formatos permitidos para archivo.
- Web3Forms Access Key.
- Cloudinary Cloud Name y Upload Preset.
- Precios por material.
- Reglas de mínimos y descuentos.

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

### Web3Forms

Se usa para enviar la orden al correo configurado en la cuenta de Web3Forms.

```js
web3FormsAccessKey: 'TU_ACCESS_KEY'
```

Si Web3Forms falla, el carrito se conserva para que el cliente pueda intentar otra vez.

La Access Key se utiliza desde el navegador y, por diseño, no funciona como un secreto de servidor. Restringe el dominio autorizado, activa protección contra abuso en el panel y rota la clave si detectas tráfico inesperado.

### Cloudinary

Se usa para subir el archivo del cliente y colocar el link en la orden.

```js
cloudinaryCloudName: 'TU_CLOUD_NAME',
cloudinaryUploadPreset: 'madeacrilico_uploads'
```

Si Cloudinary falla, el cliente debe intentar nuevamente o pedir ayuda por WhatsApp.

El preset es unsigned porque la aplicación no tiene backend. Debe limitar formatos, peso, carpeta y transformaciones desde Cloudinary. Para una protección más fuerte, reemplaza este flujo por firmas generadas en un backend o Worker y añade rate limiting o Turnstile.

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

## Checklist antes de publicar

- Ejecutar `npm run build:css`.
- Ejecutar `npm run check:js`.
- Ejecutar `npm run check:project`.
- Ejecutar `npm test`.
- Probar navegación por hash: `#inicio`, `#dtf`, `#planilla`, `#guia`, `#contacto`, `#tienda`.
- Probar que al recargar no aparezcan secciones o datos antiguos.
- Probar subida de archivo.
- Probar carrito con y sin envío.
- Probar cálculo de Textil, UV y Stickers.
- Probar formulario de contacto y envío de orden.
- Confirmar que los enlaces de WhatsApp, teléfono, correo y mapa abren correctamente.
- Confirmar que favicon y preview social se ven con los assets actuales.

## Notas de mantenimiento

- Si cambian precios, actualiza `business-config.js` y ejecuta `npm test`.
- Si cambian clases Tailwind en HTML o JS, ejecuta `npm run build:css`.
- Si cambia el correo receptor, revisa la configuración en Web3Forms.
- Si cambian logos o previews, elimina assets antiguos no usados para evitar referencias fantasma.
- No reutilices la Access Key de Web3Forms ni el preset unsigned de Cloudinary fuera de este dominio; aplica las restricciones disponibles en ambos paneles.

## Límites de la arquitectura actual

El proyecto es una aplicación estática: no incluye backend propio, base de datos, autenticación ni roles. Los precios y validaciones del navegador mejoran la experiencia, pero la revisión humana antes de producir sigue siendo la autoridad final. No uses el total del frontend como comprobante de pago ni como autorización automática de producción.

## Autor

- Danny Peña Adames - Desarrollador Web
