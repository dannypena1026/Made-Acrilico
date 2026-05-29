# MADE ACRILICO

Pagina web oficial de MADE ACRILICO, enfocada en cotizacion de servicios DTF Textil y DTF UV.

## Descripcion

Este proyecto ofrece una experiencia web para que los clientes puedan revisar tarifas, calcular pedidos, subir la referencia de su archivo y enviar una solicitud de orden por WhatsApp.

## Funcionalidades principales

- Calculadora para DTF Textil y DTF UV.
- Seleccion de ancho y largo segun el material.
- Soporte para medidas personalizadas.
- Validacion de medidas no permitidas.
- Resumen automatico de cotizacion.
- Carrito de produccion con persistencia local.
- Edicion, duplicado, eliminacion y vaciado completo del carrito.
- Costo opcional de envio.
- Validacion de archivo para la orden.
- Mensaje de WhatsApp generado automaticamente con detalle de orden, envio, entrega y aviso de revision.
- Secciones informativas de tarifas, guia de archivo y contacto.

## Tecnologias

- HTML
- CSS
- JavaScript con ES Modules
- Tailwind CSS
- Font Awesome
- Node.js para scripts de desarrollo y pruebas

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

## Configuracion del negocio

Los datos principales del negocio viven en:

```text
js/core/business-config.js
```

Desde ese archivo se modifican:

- WhatsApp
- telefono
- correo
- direccion
- enlace de Google Maps
- precio de envio
- tiempo de entrega
- metodos de pago
- formatos permitidos para archivo
- precios por material

## Comandos de desarrollo

Instala dependencias:

```bash
npm install
```

Genera el CSS de Tailwind:

```bash
npm run build:css
```

Revisa sintaxis JS:

```bash
npm run check:js
```

Ejecuta pruebas:

```bash
npm test
```

## Uso local

Puedes abrir `index.html` con un servidor local.

Ejemplo con Node:

```bash
npx serve .
```

## Notas

- Los archivos seleccionados por el cliente no se adjuntan automaticamente al mensaje de WhatsApp.
- El carrito se guarda localmente en el navegador del cliente.
- Si se modifican clases de Tailwind en el HTML o JavaScript, ejecuta `npm run build:css`.
- Si se modifican precios, ejecuta `npm test` para validar los calculos principales.

## Autor

- Danny Peña Adames - Desarrollador Web
