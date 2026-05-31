# MADE ACRILICO

Pagina web oficial de MADE ACRILICO para cotizar pedidos DTF Textil y DTF UV, subir archivo de referencia, armar carrito y enviar la orden por correo al equipo.

## Funcionalidades principales

- Inicio comercial con flujo de compra, servicios, tarifas, checklist y preguntas frecuentes.
- Calculadora para DTF Textil y DTF UV con medidas fijas y personalizadas.
- Validacion de medidas no permitidas y resumen automatico de cotizacion.
- Subida de archivos a Cloudinary para enviar link descargable en la orden.
- Carrito con persistencia local, duplicado, eliminacion y vaciado completo.
- Estado del pedido dentro del carrito: archivo, datos, entrega y orden lista.
- Envio opcional por RD$250.
- Revision previa antes de enviar la orden.
- Envio real de orden por correo mediante Web3Forms.
- Confirmacion final con numero de orden y boton de seguimiento por WhatsApp.
- Contacto, politicas de privacidad, terminos del servicio, favicon y preview social.

## Flujo del cliente

1. El cliente revisa servicios o entra al Calculador Express.
2. Selecciona material, medida, cantidad y sube archivo.
3. Agrega el item al carrito.
4. Completa nombre y WhatsApp.
5. Activa envio si lo necesita y agrega direccion.
6. Revisa la orden.
7. Confirma el envio por correo.
8. Puede avisar por WhatsApp usando el numero de orden.

WhatsApp se usa como contacto rapido, asesoria de archivo y seguimiento. La orden formal se envia por correo con Web3Forms.

## Configuracion del negocio

Los datos principales viven en:

```text
js/core/business-config.js
```

Desde ese archivo se modifican:

- Nombre del negocio.
- WhatsApp y telefono visible.
- Correo.
- Direccion y enlace de Google Maps.
- Precio de envio.
- Tiempo de entrega.
- Metodos de pago.
- Aviso de cotizacion estimada.
- Formatos permitidos para archivo.
- Web3Forms Access Key.
- Cloudinary Cloud Name y Upload Preset.
- Precios por material.

## Servicios externos

### Web3Forms

Se usa para enviar la orden al correo configurado en la cuenta de Web3Forms.

```js
web3FormsAccessKey: 'TU_ACCESS_KEY'
```

Si Web3Forms falla, el carrito se conserva para que el cliente pueda intentar otra vez.

### Cloudinary

Se usa para subir el archivo del cliente y colocar el link en la orden.

```js
cloudinaryCloudName: 'TU_CLOUD_NAME',
cloudinaryUploadPreset: 'madeacrilico_uploads'
```

Si Cloudinary falla, el cliente debe intentar nuevamente o pedir ayuda por WhatsApp.

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
    pricing-engine.js
    state.js
  modules/
    canvas.js
    cart.js
    pricing.js
    ui.js
    upload.js
  utils/
    dom.js
    helpers.js
scripts/
  check-js.mjs
test/
  pricing-engine.test.js
index.html
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

Ejecutar pruebas:

```bash
npm test
```

## Checklist antes de publicar

- Ejecutar `npm run check:js`.
- Ejecutar `npm test`.
- Ejecutar `npm run build:css`.
- Probar carga de pagina sin errores de consola.
- Probar subida de archivo.
- Probar carrito con y sin envio.
- Probar validacion de telefono.
- Probar envio real de orden por correo.
- Confirmar que el correo llega a la bandeja correcta.
- Confirmar que los links de archivo abren correctamente.

## Notas de mantenimiento

- Si cambian precios, actualiza `business-config.js` y ejecuta `npm test`.
- Si cambian clases Tailwind en HTML o JS, ejecuta `npm run build:css`.
- Si cambia el correo receptor, revisa la configuracion en Web3Forms.
- No publiques una Web3Forms key o preset de Cloudinary que no correspondan al negocio.

## Autor

- Danny Pena Adames - Desarrollador Web
