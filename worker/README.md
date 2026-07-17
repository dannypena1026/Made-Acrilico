# API protegida de MADE ACRÍLICO

Este Worker reemplaza las llamadas públicas a Cloudinary y Web3Forms. La web solo habla con `/api/uploads` y `/api/orders`; el Worker valida cada archivo antes de enviarlo a Cloudinary y las claves nunca viven en el navegador.

## Qué protege

- Valida extensión, tamaño y firma del archivo antes de enviarlo a Cloudinary.
- Envía los diseños a una carpeta restringida de Cloudinary mediante un preset unsigned que usa exclusivamente el Worker.
- No devuelve la URL del diseño al navegador; esta se conserva dentro del token firmado y se incluye solo en la solicitud de orden para revisión interna.
- Emite un token temporal firmado para cada archivo. Una orden solo acepta archivos que hayan pasado por este Worker.
- Recalcula los productos en el Worker antes de enviar el correo.
- Guarda cada orden, sus productos y un historial de eventos en Cloudflare D1 antes de contactar Web3Forms.
- Incluye una API administrativa con inicio de sesión, cookie `HttpOnly`, expiración y límite de intentos para consultar pedidos, actualizar producción, registrar pagos manuales, editar datos comerciales, precios e imágenes.
- Limita por IP a 12 subidas y 6 órdenes cada 10 minutos mediante Durable Objects.
- Acepta peticiones únicamente desde los orígenes declarados en `ALLOWED_ORIGINS`.

El total sigue siendo una cotización pendiente de revisión humana. Este Worker evita que el navegador sea la autoridad de precios, guarda solicitudes y sirve el panel de operaciones, pero no incorpora cobros en línea ni roles de usuario.

## Desarrollo local

1. Instala Wrangler una vez: `npm install --save-dev wrangler`.
2. Copia `worker/.dev.vars.example` como `worker/.dev.vars` y completa las claves.
3. En una segunda terminal inicia la web y el proxy local con `npm run dev`.
4. En otra terminal ejecuta `npm run dev:worker`.
5. Abre la web en `http://TU-IP:4190`. El servidor local reenvía internamente `/api/...` al Worker, por lo que el teléfono solo necesita acceder al puerto `4190`.

## Secretos de producción

En la carpeta del proyecto ejecuta estos comandos y pega los valores cuando Wrangler los solicite:

```bash
npx wrangler secret put ASSET_TOKEN_SECRET --config worker/wrangler.jsonc
npx wrangler secret put WEB3FORMS_ACCESS_KEY --config worker/wrangler.jsonc
npx wrangler secret put CLOUDINARY_CLOUD_NAME --config worker/wrangler.jsonc
npx wrangler secret put CLOUDINARY_UPLOAD_PRESET --config worker/wrangler.jsonc
npx wrangler secret put ALLOWED_ORIGINS --config worker/wrangler.jsonc
```

Para `ASSET_TOKEN_SECRET`, utiliza una cadena aleatoria larga. En `ALLOWED_ORIGINS` usa los dominios publicados y, solo si necesitas probar desde tu red, la IP local y puerto exactos. Por ejemplo:

```text
https://madeacrilico.com,https://www.madeacrilico.com,http://192.168.100.98:4190
```

Después ejecuta `npm run deploy:worker` y, desde Cloudflare Workers, agrega las rutas:

```text
madeacrilico.com/api/*
www.madeacrilico.com/api/*
```

La web publicada usará las rutas del mismo dominio y no requerirá CORS externo.

## Reseñas de clientes

El carrusel de Inicio se administra desde el panel interno, dentro de **Configuración comercial > Reseñas de clientes**. Copia únicamente opiniones reales y confirma que el texto, nombre mostrado y calificación sean fieles a la reseña original. No requiere API de Google, tarjeta ni secretos adicionales. El botón público sigue enlazando al perfil de Google para consultar o dejar nuevas reseñas.

## Cloudinary y base de datos de pedidos

En Cloudinary crea un upload preset unsigned llamado, por ejemplo, `made_acrilico_orders`. Restringe sus formatos a los que acepta la web, usa la carpeta `made-acrilico/orders`, desactiva transformaciones entrantes y no compartas el nombre del preset en el frontend. Luego guarda el nombre como secreto `CLOUDINARY_UPLOAD_PRESET` y el cloud name como `CLOUDINARY_CLOUD_NAME`.

Cloudinary no ofrece el mismo aislamiento que un bucket privado sin un plan adicional: los archivos se controlan por carpeta, validación previa, límites del Worker y ausencia de URL en la interfaz. Para documentos especialmente sensibles, solicita el archivo directamente por WhatsApp.

Después crea la base dentro de Cloudflare:

Primero crea la base dentro de Cloudflare:

```bash
npx wrangler d1 create made-acrilico-orders
```

Wrangler mostrará un `database_id`. Agrégalo en `worker/wrangler.jsonc`, al mismo nivel que `durable_objects`:

```json
"d1_databases": [
  {
    "binding": "ORDERS_DB",
    "database_name": "made-acrilico-orders",
    "database_id": "PEGA_AQUI_EL_DATABASE_ID",
    "migrations_dir": "migrations"
  }
],
```

Luego aplica la estructura de tablas:

```bash
npx wrangler d1 migrations apply made-acrilico-orders --remote --config worker/wrangler.jsonc
```

Las migraciones crean `orders`, `order_events`, `site_settings` y `site_events`. Cada orden recibe un estado inicial `pending_review`; si Web3Forms falla, queda `pending_notification` para que no se pierda. La configuración comercial se guarda como un documento validado en `site_settings`.

## Panel interno protegido

El panel vive en `admin.html`, no aparece en la navegación comercial y usa `noindex`. La protección real ocurre en la API: se inicia sesión contra el Worker, que limita los intentos, emite una cookie `HttpOnly` de sesión y exige esa sesión para cada consulta o actualización. Tiene tres secciones: pedidos, configuración comercial e imágenes principales.

Configura los dos secretos siguientes desde una terminal local. No pegues la contraseña en el chat ni la guardes en archivos del proyecto:

```bash
npx wrangler secret put ADMIN_PASSWORD --config worker/wrangler.jsonc
npx wrangler secret put ADMIN_SESSION_SECRET --config worker/wrangler.jsonc
```

Usa una contraseña de al menos 16 caracteres para `ADMIN_PASSWORD`. Para `ADMIN_SESSION_SECRET`, genera una cadena aleatoria larga, por ejemplo con `openssl rand -base64 32`. `workers_dev` está desactivado para impedir atajos directos al Worker.

Las sesiones del panel usan una cookie `HttpOnly` y `SameSite=Strict`, se cierran al terminar el navegador, vencen como máximo a los 30 minutos y el panel se bloquea tras 10 minutos sin actividad. Cambiar la contraseña invalida las sesiones creadas con la clave anterior.

## Migración obligatoria

Antes de publicar esta versión:

1. Crea el preset unsigned restringido de Cloudinary indicado arriba.
2. Rota la Access Key anterior de Web3Forms, porque estuvo disponible en versiones previas del frontend.
3. Crea D1, agrega su binding y aplica las migraciones.
4. Configura `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET` para el panel interno.
5. Agrega los secretos restantes al Worker, despliega el Worker y comprueba una subida y una orden de prueba.
6. Cuando la prueba funcione, elimina del Worker las claves de Cloudinary que ya no se usen y desactiva cualquier preset anterior.
7. Solo después publica la versión estática que llama a `/api`.

Publicar la web antes de activar el Worker hará que las subidas y el envío de órdenes fallen de forma intencional, ya que no existe un modo público alternativo.
