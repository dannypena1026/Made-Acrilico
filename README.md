# MADE ACRILICO

Pagina web oficial de MADE ACRILICO, enfocada en cotizacion de servicios DTF Textil y DTF UV.

## Descripcion

Este proyecto ofrece una experiencia web para que los clientes puedan revisar tarifas, calcular pedidos, subir la referencia de su archivo y enviar una solicitud de orden por WhatsApp.

## Funcionalidades principales

- Calculadora para DTF Textil y DTF UV.
- Seleccion de ancho y largo segun el material.
- Soporte para medidas personalizadas.
- Validacion visual de medidas no permitidas.
- Resumen automatico de cotizacion.
- Carrito de produccion con persistencia local.
- Edicion de cantidades desde el carrito.
- Duplicado y eliminacion de productos.
- Vista del archivo seleccionado con nombre, tipo y tamano.
- Mensaje de WhatsApp generado automaticamente con el detalle de la orden.
- Secciones informativas de tarifas, guia de archivo y contacto.

## Tecnologias

- HTML
- CSS
- JavaScript
- Tailwind CSS
- Font Awesome

## Estructura general

```text
assets/
  img/
css/
  styles.css
  tailwind.css
  tailwind.input.css
js/
  core/
  modules/
  utils/
index.html
package.json
tailwind.config.js
```

## Uso local

Puedes abrir `index.html` directamente en el navegador o servir la carpeta con un servidor local.

Ejemplo con Node:

```bash
npx serve .
```

## Instalacion para desarrollo

Instala las dependencias:

```bash
npm install
```

Genera el CSS de Tailwind:

```bash
npm run build:css
```

## Notas

- Los archivos seleccionados por el cliente no se adjuntan automaticamente al mensaje de WhatsApp.
- El carrito se guarda localmente en el navegador del cliente.
- Si se modifican clases de Tailwind en el HTML o JavaScript, vuelve a ejecutar `npm run build:css`.

## Autor

MADE ACRILICO - Taller Grafico
Creado por Danny Peña Adames