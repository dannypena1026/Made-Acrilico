# Manual de operaciones

## Servicios

- Sitio público: Cloudflare Pages en `www.madeacrilico.com`.
- API y panel: Worker `made-acrilico-secure-api`.
- Órdenes y configuración: D1 `made-acrilico-orders`.
- Archivos: Cloudinary, carpeta `made-acrilico/orders`.
- Correos de órdenes: Web3Forms.
- Acceso interno: Cloudflare Zero Trust y sesión propia del panel.

## Verificación antes de desplegar

```bash
npm ci
npm run build:css
npm run build:js
npm run check:html
npm run check:js
npm run check:project
npm test
npm run test:e2e
npm audit --audit-level=high
npx --yes wrangler@4.113.0 deploy --config worker/wrangler.jsonc --dry-run
```

GitHub Actions ejecuta la misma verificación en cada `push` y `pull_request`. No despliegues una versión con la tarea `Calidad` en rojo.

## Desarrollo local

Abre dos terminales desde la raíz:

```bash
npm run dev:worker
```

```bash
npm run dev
```

Después abre `http://localhost:4190` o `http://192.168.100.98:4190` dentro de la misma red. El servidor web reenvía `/api/*` al Worker local en `8787`.

## Migraciones

Antes de desplegar un Worker que dependa de una migración nueva:

```bash
npx --yes wrangler@4.113.0 d1 migrations list made-acrilico-orders --remote --config worker/wrangler.jsonc
npx --yes wrangler@4.113.0 d1 migrations apply made-acrilico-orders --remote --config worker/wrangler.jsonc
```

Aplica primero en local y ejecuta las pruebas. Nunca edites una migración que ya llegó a producción; crea la siguiente.

## Respaldo D1

Antes de una migración o cambio importante:

```bash
mkdir -p backups
npx --yes wrangler@4.113.0 d1 export made-acrilico-orders --remote --config worker/wrangler.jsonc --output backups/made-acrilico-orders.sql
```

La carpeta `backups/` no debe subirse a Git porque contiene datos personales. Guarda el archivo cifrado en una ubicación empresarial con acceso restringido y registra fecha, responsable y motivo.

Para restaurar, crea primero una base de recuperación y valida allí el archivo:

```bash
npx --yes wrangler@4.113.0 d1 execute NOMBRE_BASE_RECUPERACION --remote --file backups/made-acrilico-orders.sql
```

No importes directamente sobre producción sin comprobar la copia en una base separada.

## Diagnóstico

Los JSON de la API incluyen `X-Request-ID`. En producción coincide con `CF-Ray`, lo que permite correlacionar un error sin registrar nombre, teléfono, dirección ni notas del cliente.

Para observar eventos en vivo:

```bash
npx --yes wrangler@4.113.0 tail made-acrilico-secure-api
```

También puedes abrir Workers & Pages > `made-acrilico-secure-api` > Observabilidad. Los logs están habilitados y las trazas usan muestreo del 10%.

## Incidentes

1. Conserva el `X-Request-ID`, hora, ruta y acción ejecutada.
2. Comprueba el estado del Worker, D1, Cloudinary y Web3Forms.
3. Si hay exposición de una clave, revócala en el proveedor y crea una nueva; no la pegues en Git ni en conversaciones.
4. Si falla el correo, revisa D1: la orden se guarda antes de intentar la notificación y puede quedar como `pending_notification`.
5. Si una versión rompe el flujo, vuelve al último despliegue estable y conserva la base; no borres órdenes.
6. Documenta causa, alcance, corrección y verificación posterior.

## Cloudinary

Verifica en el panel del proveedor que el preset usado por el Worker:

- sea `unsigned` solo porque el Worker lo necesita;
- limite formatos a PNG, PDF, AI, PSD, JPEG/JPG/JPE, WebP y TIFF según el material;
- limite el tamaño a 10 MB;
- use la carpeta `made-acrilico/orders`;
- no permita transformaciones o sobrescrituras innecesarias;
- tenga alertas de cuota activas.

La clave del preset y los secretos se guardan con `wrangler secret`, nunca en HTML, JavaScript público o Git.
