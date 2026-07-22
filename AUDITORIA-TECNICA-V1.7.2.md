# Auditoría técnica, operativa y comercial de Made Acrílico

**Fecha:** 22 de julio de 2026
**Versión auditada:** Made Acrílico Web V1.7.2
**Commit:** `ab36b2523df3b79731183d83ce0f17c5bea7afca`
**Rama:** `main`
**Sitio:** https://www.madeacrilico.com/
**Alcance:** repositorio completo, sitio local, sitio publicado, Worker, D1, páginas públicas, panel interno, API, configuración, pruebas, seguridad, rendimiento, SEO, accesibilidad, UX e infraestructura.

> **Estado posterior a la remediación (22 de julio de 2026):** este documento conserva los hallazgos de la línea base para trazabilidad. La matriz siguiente indica cuáles ya fueron corregidos localmente. Estos cambios todavía no se consideran publicados hasta completar despliegue y verificación productiva.

## 0. Resultado de la remediación

### Corregido localmente

| Hallazgo | Corrección aplicada | Evidencia |
|---|---|---|
| H-01 autoridad de precios | El Worker carga la configuración validada desde D1 y la pasa explícitamente al motor de precios. Ignora totales enviados por el navegador. | Prueba con tarifa administrativa distinta al respaldo del repositorio. |
| H-02 menú móvil | Panel posicionado debajo del header, cierre interno accesible, foco restaurado y comportamiento estable con scroll profundo. | Playwright móvil. |
| M-01 soft 404 | `404.html` y servidor local con estado HTTP 404 real. | Prueba de rutas limpias y ruta inexistente. |
| M-02 canonical/sitemap | Canonical, Open Graph, sitemap y enlaces internos usan URLs limpias sin `.html`. | Validación estructural y E2E. |
| M-03 datos rastreables | Datos estáticos sincronizados y JSON-LD actualizado en tiempo de ejecución cuando carga configuración válida. | Revisión de HTML y `site-config.js`. |
| M-04 CSP Cloudflare | Se autorizaron únicamente los orígenes necesarios de Cloudflare Insights. Fuentes e iconos de terceros se autoalojaron. | CSP validada por hashes y navegación sin errores. |
| M-05 observabilidad | Logs JSON sin PII, `X-Request-ID`, Workers Logs y traces con muestreo. | Worker dry-run válido. |
| M-08 CI/E2E | GitHub Actions, build reproducible, checks, 40 pruebas unitarias y Playwright en escritorio/móvil. | 9 E2E pasan y 1 se omite por ser exclusiva de móvil. |
| M-10 rendimiento | Imágenes responsivas, carga diferida, bundles minificados, gzip local, fuente autoalojada y reemplazo de fuentes de iconos por SVG usados. | Lighthouse móvil: 97/100, 219 KiB, FCP 1.5 s, LCP 2.1 s, TBT 140 ms, CLS 0.002. |
| M-11 WCAG/semántica | Contrastes y jerarquía corregidos; `html-validate` queda en cero errores. | Lighthouse accesibilidad 100/100. |
| L-01 comparación temporal | Uso de `crypto.subtle.timingSafeEqual` cuando está disponible, con fallback de tiempo fijo. | Pruebas de sesión y firma. |
| L-02 CSP de estilos | Bloque de estilo inicial autorizado por hash; `unsafe-inline` queda restringido a atributos requeridos por carrusel y menú. | Hash comprobado automáticamente por `check-project`. |
| L-03 recursos externos | Google Fonts y Font Awesome se sirven localmente; logos sociales usan SVG locales. | Prueba E2E de estilos computados y red sin fuente Brands. |
| L-04 CSS desalineado | CSS recompilado desde su fuente y validado en CI. | `npm run build:css`. |
| L-05 caché inconsistente | HTML usa bundles comunes y assets actuales; CI impide artefactos generados desactualizados. | Comparación de build en workflow. |
| L-06 instalación inconsistente | `package-lock.json` y `npm ci` reproducible. | Instalación limpia con 0 vulnerabilidades. |
| L-08 errores API | JSON malformado devuelve 400 específico y carga con tipo incorrecto devuelve 415. | Pruebas HTTP locales. |
| L-09 URL local malformada | El servidor captura errores de decodificación y responde sin terminar el proceso. | Revisión de `dev-server.mjs`. |
| L-10 documentación | Licencia propietaria, runbook operativo, respaldo/restauración D1 y borrador de retención. | `LICENSE.md` y `docs/`. |

También se añadió idempotencia del intento de checkout: un reintento de la misma orden reutiliza el identificador mientras el contenido no cambie y solo limpia el marcador después de éxito.

### Pendiente de acción externa o decisión del negocio

- Ejecutar una orden productiva controlada y comprobar Cloudinary, D1, correo y seguimiento; no se generaron datos reales durante esta auditoría.
- Aprobar los plazos propuestos en `docs/RETENCION-DE-DATOS.md` antes de automatizar una eliminación irreversible.
- Configurar alertas y revisar logs/traces después del despliegue.
- Verificar límites del preset Cloudinary y añadir protección adicional de carga si el volumen o abuso lo requiere.
- Migrar a identidades administrativas individuales con Cloudflare Access/MFA cuando haya más de un operador.
- Dividir gradualmente `cart.js`, `ui.js` y el Worker; se evitó una reescritura riesgosa sin necesidad funcional inmediata.

### Estado técnico actual local

- **Compila:** sí.
- **Inicia:** sí, web en `4190` y Worker local en `8787`.
- **Pruebas:** 40/40 unitarias y 9 E2E aprobadas; 1 E2E omitida intencionalmente en escritorio.
- **HTML:** 0 errores de validación.
- **Consola/recursos:** sin errores ni solicitudes fallidas en las cinco páginas públicas probadas en escritorio y móvil.
- **Dependencias:** 0 vulnerabilidades conocidas por `npm audit`.
- **Worker:** dry-run correcto, 59.61 KiB / 14.76 KiB gzip.
- **Lighthouse móvil local:** rendimiento 97, accesibilidad 100, buenas prácticas 100 y SEO 100.
- **Producción:** requiere desplegar y completar la prueba controlada antes de declarar cerrada la verificación productiva.

## 1. Resumen ejecutivo

Made Acrílico es un sistema comercial personalizado de nivel **intermedio alto / producción supervisada**. No es una plantilla ni una página informativa básica: contiene un motor de precios real para DTF Textil, DTF UV y stickers, carga de archivos, carrito persistente, recepción de órdenes, base D1, un Worker como autoridad del servidor y un panel interno para administrar pedidos, precios, disponibilidad, datos del negocio e imágenes.

El proyecto tiene buenas bases: 38 pruebas pasan, no hay secretos en el historial Git, `npm audit` no detecta vulnerabilidades conocidas, la base usa consultas preparadas, el panel tiene sesiones seguras, existe rate limiting y la configuración HTTP publicada es superior a la de muchos proyectos pequeños. En escritorio el rendimiento es excelente y el SEO técnico básico está bien trabajado.

Sin embargo, **no debe considerarse completamente listo para automatización financiera desatendida**. El principal hallazgo es que los precios configurados desde el panel se muestran en el navegador, pero el Worker recalcula las órdenes usando los precios predeterminados del código. Esto puede causar diferencias entre lo que el cliente vio y lo que se guarda o envía. También existe un fallo serio del menú móvil, URLs inexistentes devuelven la página principal con estado `200`, no hay todavía una orden real registrada en producción y faltan pruebas E2E, observabilidad y política de retención de datos.

**Calificación general: 75/100.**
**Madurez:** producción supervisada, todavía no Enterprise.
**Riesgo técnico:** medio, con un hallazgo alto de integridad comercial.
**Recomendación de entrega:** corregir primero P0/P1, ejecutar una orden controlada en producción y añadir pruebas de regresión antes de declarar la versión plenamente estable.

## 2. Metodología y evidencia

La auditoría no se limitó a lectura estática. Se realizaron:

- Inventario de los 65 archivos versionados y revisión del historial Git.
- Lectura de HTML, CSS, JavaScript, Worker, SQL, configuración, scripts, pruebas y documentación.
- Ejecución local de la web en `4190` y del Worker en `8787`.
- Navegación real a 375 px y 1440 px por las seis páginas HTML.
- Pruebas de calculadoras, modales, menú, contacto, carrito, carga y autenticación inválida.
- Revisión de consola, errores de recursos, desbordamiento horizontal, imágenes, botones, enlaces y encabezados.
- Lighthouse local móvil/escritorio y Lighthouse móvil de producción.
- Pruebas HTTP en producción: redirecciones, cabeceras, CORS, métodos y rutas inexistentes.
- Inspección de D1 de producción y migración completa sobre una base local vacía.
- Búsqueda de secretos tanto en el árbol actual como en todo el historial Git.
- `npm audit`, árbol de dependencias, compilación CSS, validación HTML, sintaxis JS, pruebas y dry-run del Worker.

### Limitaciones controladas

- No se envió una orden real ni se subió un archivo real a las cuentas productivas para no crear datos o consumir cuota sin autorización explícita por operación.
- No se accedió al panel productivo con contraseña ni se intentó evadir Cloudflare Access.
- No se inspeccionaron directamente los paneles de Cloudinary, Web3Forms o Zero Trust.
- No se hicieron ataques destructivos, carga sostenida ni pruebas de denegación de servicio.
- D1 bloqueó `PRAGMA integrity_check` con `SQLITE_AUTH`; sí se verificaron migraciones, tablas, índices y claves foráneas.
- No existe una línea base histórica de Lighthouse, por lo que las métricas son una fotografía del 22 de julio de 2026.

## 3. Arquitectura

### Componentes

| Capa | Tecnología | Responsabilidad |
|---|---|---|
| Frontend | HTML multipágina, Tailwind compilado, CSS propio, JavaScript ES Modules | Navegación, calculadoras, tienda, contacto, carrito y panel |
| API | Cloudflare Worker | Órdenes, configuración, cargas, autenticación y administración |
| Datos | Cloudflare D1 | Órdenes, eventos, configuración, credenciales y sesiones |
| Rate limiting | Durable Object | Límites por IP y operación |
| Archivos | Cloudinary | Almacenamiento de diseños subidos |
| Notificación | Web3Forms y WhatsApp | Correo de orden y continuación comercial |
| Hosting | Cloudflare Pages/edge | Sitio estático, caché, TLS y cabeceras |

### Evaluación

La arquitectura es adecuada para una pequeña empresa y mantiene bajos los costes operativos. El motor de precios está separado del DOM y se reutiliza en el cliente y Worker, lo cual es una decisión acertada. El principal defecto arquitectónico es que la configuración dinámica no cruza correctamente el límite de confianza: el navegador usa D1, pero la autoridad del servidor usa constantes del código.

No existe GraphQL, ORM, servidor tradicional, autenticación de clientes, pagos, inventario ni suscripciones. Eso es parte del alcance actual y no se considera un error.

## 4. Inventario funcional

### Público

- Inicio comercial con carruseles, servicios, quiénes somos, reseñas y llamadas a acción.
- Páginas SEO de DTF Textil, DTF UV, Stickers y Tienda.
- Calculador Express con selección de material y reglas de disponibilidad.
- Cotización de Textil por tamaño y cantidad.
- Cotización UV por ancho y longitud.
- Cotización de stickers por dimensiones, material, orientación, cantidad, mínimos y descuentos.
- Carga de archivos con formatos diferenciados; stickers acepta JPEG/JPG/JPE y excluye PSD.
- Carrito persistente en `localStorage` y revisión previa de pedido.
- Formulario de contacto por motivo y continuación por WhatsApp.
- Guía de archivos, términos y privacidad.

### Interno

- Inicio de sesión mediante contraseña y cookie de sesión.
- Listado y actualización de órdenes.
- Estados de producción y pago.
- Panel de métricas.
- Edición de datos del negocio, precios, formatos, disponibilidad e imágenes.
- Cierre por inactividad y cierre explícito.

## 5. Calidad del código

### Fortalezas

- `js/core/pricing-engine.js` desacopla la lógica comercial de la interfaz.
- `js/core/file-policy.js` concentra reglas de formato, tamaño y firmas.
- `js/core/helpers.js` ofrece escape HTML, URLs permitidas y moneda dominicana.
- El Worker usa consultas D1 preparadas con `.bind()`.
- Los scripts verifican sintaxis, rutas, IDs duplicados y hashes CSP.
- Las pruebas cubren precios, límites, orientación de stickers, archivos y URLs.
- La configuración empresarial está centralizada y el código evita dependencias innecesarias.

### Deuda técnica

| Archivo | Tamaño aproximado | Problema |
|---|---:|---|
| `index.html` | 2,654 líneas / 169 KB | Demasiadas responsabilidades, contenido y vistas en un documento |
| `js/ui.js` | 1,730 líneas / 53.6 KB | Navegación, accesibilidad, modales, legal, formularios y contenido |
| `worker/src/index.js` | 1,330 líneas / 50.5 KB | Router, autenticación, D1, cargas, configuración y órdenes |
| `js/cart.js` | 1,235 líneas / 29.9 KB | Estado, render, validación, checkout, mensajes y API |
| `js/admin.js` | 801 líneas / 42 KB | Sesión, pedidos, configuración, imágenes y renderizado |

No se recomienda reescribirlos de una vez. Deben dividirse gradualmente con pruebas de regresión.

## 6. Hallazgos críticos y altos

### H-01: la autoridad de precios no usa la configuración administrada

- **Gravedad:** Alta / P0.
- **OWASP relacionado:** A04 Insecure Design y A08 Software and Data Integrity Failures.
- **Archivos:** `worker/src/index.js:1-5`, `worker/src/index.js:394-415`, `worker/src/index.js:856-870`, `worker/src/index.js:979-991`, `js/core/site-config.js:51-81`, `js/core/business-config.js:140-158`, `js/admin.js:578`.
- **Función afectada:** normalización y creación de órdenes.
- **Impacto:** un precio cambiado en el panel puede aparecer correctamente al cliente, pero la orden puede guardarse y enviarse con el valor predeterminado del código.
- **Probabilidad:** Alta cuando se modifique cualquier tarifa desde el panel.
- **Riesgo:** diferencia de cotización, pérdida de confianza, corrección manual y posibles pérdidas.
- **Reproducción:** cambiar una tarifa en Configuración, recargar el calculador, cotizar y enviar; comparar el total del navegador con el total recalculado por el Worker.
- **Causa:** el frontend aplica la configuración D1 a `MATERIALS`, pero el Worker llama `buildQuoteFromInput` con el objeto importado por defecto.
- **Solución:** cargar y validar `site_settings` dentro de `handleOrder`, construir una configuración de precios confiable y pasarla explícitamente a `normalizeOrderItem`/`buildQuoteFromInput`.
- **Prueba obligatoria:** una prueba de integración con una tarifa D1 distinta a la del repositorio.
- **Estimación:** 6-10 horas.
- **Dificultad:** Media.

Ejemplo de dirección técnica:

```js
async function handleOrder(request, env) {
  const siteConfig = await loadValidatedSiteConfig(env.DB);
  const pricingConfig = buildServerPricingConfig(siteConfig);
  const input = await readJson(request);
  const items = input.items.map((item) =>
    normalizeOrderItem(item, pricingConfig)
  );
  // Persistir únicamente los totales recalculados aquí.
}
```

### H-02: el menú móvil tapa el encabezado y puede dejar el botón fuera de alcance

- **Gravedad:** Alta / P1 de UX.
- **Archivos:** `index.html:174-248`, `js/ui.js:796-825`.
- **Impacto:** el menú cubre parte del logo y del control de cierre; al abrirlo con scroll profundo, el botón puede quedar fuera del viewport.
- **Probabilidad:** Alta en móvil.
- **Reproducción:** abrir a 375 px, desplazarse hacia abajo y abrir el menú; intentar cerrarlo con el botón visible.
- **Evidencia:** el menú tiene `z-50`, el header `z-40`; la posición calculada observada comenzó dentro del área del header. Un clic de navegador automatizado fue interceptado.
- **Solución:** usar un header realmente `position: sticky/fixed`, calcular la altura estable mediante variable CSS, colocar el panel inmediatamente debajo y mantener un botón de cierre dentro del propio panel. Bloquear scroll del body y probar a scroll 0, medio y final.
- **Estimación:** 3-5 horas incluyendo regresión móvil.
- **Dificultad:** Baja-media.

## 7. Hallazgos medios

### M-01: rutas inexistentes generan soft 404

- **Área:** SEO, observabilidad y UX.
- **Evidencia:** `https://www.madeacrilico.com/__audit-missing-page__` devolvió `200` con la página principal.
- **Impacto:** Google puede indexar basura, diluir señales y reportar soft 404; los usuarios no reciben una explicación correcta.
- **Solución:** crear `404.html` real y configurar Pages para conservar estado 404 en rutas desconocidas.
- **Estimación:** 2-4 horas.

### M-02: canonicals y sitemap no coinciden con las URLs finales

- **Evidencia:** `/dtf-textil.html` redirige `308` a `/dtf-textil`, pero canonical, Open Graph y sitemap usan `.html`.
- **Impacto:** redirecciones innecesarias y señales SEO contradictorias.
- **Solución:** elegir URLs limpias sin extensión y actualizar canonical, OG, sitemap y enlaces internos. Actualizar `lastmod` con fechas reales.
- **Estimación:** 2-3 horas.

### M-03: información rastreable queda desactualizada respecto al panel

- **Archivos:** `index.html:30-55`, `index.html:1931`, `js/core/business-config.js:6`.
- **Evidencia:** el HTML/JSON-LD contiene `info@madeacrilico.com`, mientras D1 publica `contacto@madeacrilico.com`.
- **Impacto:** Google y redes pueden leer información antigua antes de que JavaScript aplique la configuración.
- **Solución:** generar metadata y JSON-LD durante despliegue desde una fuente canónica, o mantener los datos críticos de SEO en el repositorio y restringir el panel a contenido no rastreable.
- **Estimación:** 4-8 horas.

### M-04: scripts de Cloudflare son bloqueados por la propia CSP

- **Área:** seguridad y consola.
- **Evidencia:** en producción se bloquearon Email Address Obfuscation y `static.cloudflareinsights.com/beacon.min.js`.
- **Impacto:** errores de consola, analítica incompleta y transformación temporal del correo.
- **Solución preferida:** desactivar inyecciones no necesarias para esta zona. Alternativa: permitir exclusivamente los orígenes y hashes indispensables, sin añadir `unsafe-inline` a scripts.
- **Estimación:** 1-3 horas.

### M-05: observabilidad insuficiente del Worker

- **Archivos:** `worker/wrangler.jsonc`, `worker/src/index.js:1278-1279`, `worker/src/index.js:1311-1312`.
- **Impacto:** errores silenciosos y poca capacidad para investigar órdenes fallidas.
- **Solución:** habilitar Workers Logs/traces con muestreo, logs JSON sin PII, identificador de solicitud, métricas por endpoint y alertas de error.
- **Estimación:** 4-7 horas.

### M-06: el cuerpo de carga puede consumirse antes de validar su tamaño real

- **Archivo:** `worker/src/index.js:780-805`.
- **Impacto:** un cliente no navegador puede falsificar `Origin`, omitir `Content-Length` y forzar parseo de multipart antes de comprobar `file.size`.
- **Mitigación existente:** límite de plataforma, rate limit de 12 solicitudes/10 min/IP y validación posterior.
- **Solución:** límite de tamaño en gateway/Worker, token de carga de un solo uso o Turnstile, y preset Cloudinary estricto. No considerar `Origin` como autenticación.
- **Estimación:** 6-12 horas.

### M-07: no existe política ejecutable de retención y eliminación

- **Datos afectados:** nombre, teléfono, dirección, notas, archivos y eventos de orden.
- **Impacto:** acumulación indefinida de PII y archivos; mayor exposición ante incidentes.
- **Solución:** definir plazos, tarea programada de purga, borrado de archivos huérfanos, exportación/rectificación y procedimiento de respaldo/restauración.
- **Estimación:** 8-14 horas.

### M-08: faltan CI y pruebas de navegador

- **Evidencia:** no existe `.github/workflows`; las 38 pruebas son unitarias/estructurales.
- **Faltan:** checkout completo, configuración-precio-servidor, admin, menú móvil, carga simulada, 404 y cabeceras.
- **Solución:** GitHub Actions con `npm ci`, checks, pruebas, build, Worker dry-run y Playwright en Chromium móvil/escritorio.
- **Estimación:** 10-18 horas.

### M-09: producción todavía no ha demostrado el flujo completo de órdenes

- **Evidencia D1:** 0 órdenes, 0 eventos y 0 credenciales administrativas persistidas.
- **Impacto:** el flujo real Cloudinary → Worker → D1 → Web3Forms no está probado de extremo a extremo en producción.
- **Solución:** después de H-01, ejecutar una orden controlada de bajo riesgo, verificar correo, D1, archivo, estado, WhatsApp y eliminación posterior si corresponde.
- **Estimación:** 2-4 horas.

### M-10: rendimiento móvil por debajo del objetivo comercial

- **Producción móvil:** rendimiento 73, FCP 3.6 s, LCP 4.9 s, TBT 90 ms, CLS 0.002.
- **Causas:** CSS y fuentes bloqueantes, Font Awesome completo, imágenes sobredimensionadas, CSS no usado y JavaScript sin minificar.
- **Objetivo:** LCP <2.5 s en conexión móvil razonable y Lighthouse >85.
- **Estimación:** 10-18 horas.

### M-11: problemas WCAG de contraste y semántica

- **Contrastes:** blanco sobre `#e52d7f` 4.18:1; magenta sobre rosa claro 3.83:1; cyan `#00a5df` sobre cyan claro 2.71:1.
- **HTML validate:** 12 errores; landmarks no únicos en admin y `aria-label` aplicado a elementos genéricos sin rol.
- **Estructura:** un salto de encabezado H2 → H4 en Inicio; admin conserva dos H1 en vistas ocultas.
- **Solución:** ajustar colores o peso/tamaño, usar elementos semánticos, `aria-labelledby`, títulos únicos y jerarquía continua.
- **Estimación:** 5-9 horas.

## 8. Hallazgos bajos e informativos

### L-01: comparación temporal casera

`worker/src/index.js:110-117` retorna inmediatamente si las longitudes difieren. Para valores secretos de tamaño fijo el riesgo práctico es bajo por TLS, latencia y rate limit, pero conviene usar `crypto.subtle.timingSafeEqual` donde esté disponible.

### L-02: `style-src 'unsafe-inline'`

La CSP es fuerte para scripts, pero permite estilos inline. Endurecerlo exige inventariar estilos dinámicos y migrarlos a clases o hashes; no debe eliminarse a ciegas.

### L-03: recursos externos sin SRI

Font Awesome se carga desde cdnjs sin Subresource Integrity y Google Fonts es externo. Autoalojar subconjuntos reduce cadena de suministro, latencia y transferencia.

### L-04: CSS generado desalineado

Una compilación temporal produjo 38,232 bytes y el archivo versionado tiene 38,010 bytes. El build pasa, pero el artefacto compilado no refleja exactamente las fuentes actuales.

### L-05: versionado de caché inconsistente

Páginas secundarias conservan parámetros `1.7.0.x`, admin `1.7.1` e Inicio `1.7.1-colors`, aunque el proyecto está en 1.7.2. Usar hashes de contenido elimina esta gestión manual.

### L-06: árbol local de dependencias inconsistente

`npm audit` y los scripts funcionan, pero `npm ls --all` reporta enlaces PNPM inválidos/ausentes en un repositorio administrado con npm. Un `npm ci` limpio en CI debe ser la autoridad de reproducibilidad.

### L-07: base de reseñas manual

Hay errores ortográficos en reseñas transcritas, fechas relativas que envejecen mal y una calificación 4.5/25 que puede quedar obsoleta. Corregir transcripción y usar fecha exacta; actualizar métricas mediante proceso manual documentado.

### L-08: diagnóstico API poco específico

JSON malformado devuelve el mismo `400` que una orden vacía. En local, la ruta de carga sin proveedor configurado devuelve `503` antes de explicar un `Content-Type` incorrecto. Mejorar códigos/mensajes sin filtrar detalles internos.

### L-09: servidor local vulnerable a URL malformada

El servidor de desarrollo usa `decodeURIComponent` sin `try/catch`; una ruta mal codificada puede terminar el proceso. Solo afecta desarrollo.

### L-10: documentación legal y operativa incompleta

No hay `LICENSE`, política de propiedad intelectual/recursos, runbook de incidentes, inventario de cuentas, recuperación de D1 ni prueba documentada de restauración.

## 9. Seguridad

### Controles comprobados

- No se encontraron tokens, claves privadas, contraseñas o secretos en el árbol ni historial Git.
- `npm audit`: 0 vulnerabilidades conocidas.
- SQL mediante consultas preparadas; no se observó concatenación insegura de entrada.
- Valores dinámicos visibles usan escape HTML y validación de URL.
- CORS restringido a orígenes configurados; origen no autorizado devolvió `403`.
- Panel sin sesión devolvió `401` localmente y está bloqueado por Cloudflare en producción.
- Cookie de sesión `HttpOnly`, `SameSite=Strict`, `Secure` en producción y expiración en servidor.
- Contraseña persistida con PBKDF2, sal aleatoria y 210,000 iteraciones después de rotación.
- Cambio de contraseña invalida sesiones existentes.
- HMAC y TTL de 24 horas para referencias de archivo.
- Extensión, tamaño y firma básica de archivo; límite de 10 MB.
- Rate limiting por Durable Object.
- Cabeceras publicadas: CSP, HSTS, DENY, nosniff, Referrer Policy, Permissions Policy, COOP y CORP.
- Método no permitido devolvió `405`; CORS inválido `403`.

### Matriz OWASP resumida

| Categoría | Estado | Observación |
|---|---|---|
| A01 Broken Access Control | Bueno con reserva | Admin protegido por sesión y edge; una credencial compartida limita trazabilidad individual |
| A02 Cryptographic Failures | Bueno | TLS/HSTS, PBKDF2, cookies seguras; mejorar comparación temporal |
| A03 Injection | Bueno | D1 preparada, escape HTML, URLs permitidas |
| A04 Insecure Design | Requiere corrección | Configuración de precios no es autoridad uniforme |
| A05 Security Misconfiguration | Medio | Scripts Cloudflare bloqueados, `unsafe-inline` en estilos, upload/preset por verificar |
| A06 Vulnerable Components | Bueno | Auditoría npm limpia; CDN externo sin SRI |
| A07 Auth Failures | Bueno para un usuario | Rate limit y expiración; falta identidad individual/MFA dentro de la app |
| A08 Integrity Failures | Requiere corrección | Divergencia de precios y CSS generado desactualizado |
| A09 Logging/Monitoring | Insuficiente | No hay observabilidad, trazas ni alertas verificables |
| A10 SSRF | Bajo | No se encontró fetch arbitrario desde URL aportada por usuario |

No se encontraron evidencias de RCE, LFI/RFI, XXE, path traversal, SQL injection, open redirect o almacenamiento de JWT inseguro. No se usa JWT.

## 10. Rendimiento

### Lighthouse

| Entorno | Perf. | Acces. | Buenas prácticas | SEO | FCP | LCP | TBT | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Local móvil | 73 | 96 | 100 | 100 | 3.6 s | 4.3 s | 250 ms | 0.008 |
| Local escritorio | 97 | 96 | 100 | 100 | 0.9 s | 1.0 s | 0 ms | 0.002 |
| Producción móvil | 73 | 96 | 92 | 100 | 3.6 s | 4.9 s | 90 ms | 0.002 |

Producción transfirió aproximadamente 719 KiB comprimidos en 34 solicitudes. El servidor respondió rápido (~50 ms); el cuello está en renderizado y recursos del cliente.

### Oportunidades medidas

- Recursos bloqueantes: ahorro estimado de 1.42 s.
- CSS no utilizado: ~52 KiB, incluyendo ~97.7% de Font Awesome.
- JavaScript sin minificar: ~29 KiB estimados.
- CSS propio sin minificar: ~6 KiB estimados.
- Imágenes: ~100 KiB de ahorro potencial inmediato.
- `test_uv.webp` puede ahorrar ~57 KiB.
- El sello Store de 647×646 se muestra cerca de 72×72 y desperdicia ~24 KiB.
- Font Awesome descarga aproximadamente 258 KiB en fuentes de iconos.
- `js/app.js:11-20` espera configuración remota antes de inicializar toda la UI; el timeout es 2.5 s en `js/core/site-config.js:51-81`.

### Plan de optimización

1. Separar inicialización visual inmediata de la configuración remota.
2. Autoalojar/subconjuntar fuentes e iconos o reemplazar Font Awesome por iconos usados.
3. Minificar JS/CSS y generar nombres con hash.
4. Crear `srcset`/`sizes`, variantes AVIF/WebP y thumbnails reales.
5. Cargar solo la primera imagen crítica del carrusel; diferir las demás.
6. Reducir animaciones continuas bajo `prefers-reduced-motion` y en segundo plano.

## 11. SEO

### Correcto

- Título, descripción, canonical, Open Graph y Twitter Cards.
- JSON-LD de LocalBusiness/servicios.
- `robots.txt` y `sitemap.xml`.
- Cinco landing pages públicas especializadas.
- Una H1 en cada página pública.
- Imágenes con `alt` y enlaces internos.
- Lighthouse SEO 100.

### Pendiente

- Soft 404.
- Canonical/sitemap con `.html` frente a redirección sin extensión.
- Datos estructurados estáticos frente a configuración D1.
- Páginas secundarias aún cortas para búsquedas competitivas.
- `lastmod` desactualizado.
- Reseñas y rating manuales pueden quedar obsoletos.

Las landing pages deben sumar casos de uso reales, preguntas frecuentes específicas, materiales, limitaciones, proceso, fotos propias y enlaces hacia calculador/contacto. No conviene rellenarlas con texto genérico para “densidad de palabras”.

## 12. Accesibilidad WCAG 2.2

### Fortalezas

- Enlace para saltar al contenido.
- `focus-visible` y restauración de foco.
- Escape para cerrar diálogos y trampa de foco.
- `aria-expanded`, `aria-current` y etiquetas de formularios.
- Soporte de `prefers-reduced-motion`.
- No se encontraron imágenes sin `alt`, botones sin nombre ni enlaces vacíos.
- No existe scroll horizontal en 375 px.

### Correcciones

- Ajustar los cuatro contrastes insuficientes.
- Resolver 12 errores de `html-validate`.
- Dar nombres únicos a landmarks del admin.
- No usar `aria-label` en `div`/`p` genéricos sin rol.
- Corregir salto H2 → H4.
- Evitar dos H1 simultáneas en el DOM del admin.
- Añadir pruebas automáticas con axe y pruebas manuales de lector de pantalla.

## 13. UX y UI

La identidad visual es personalizada, consistente y notablemente superior a una plantilla genérica. La navegación, calculadoras y resumen expresan bien el negocio. Los problemas principales no son estéticos sino de robustez móvil y estados.

### Prioridad UX

- Reparar menú móvil y cierre en scroll profundo.
- Mantener skeleton/estado reservado mientras carga configuración para evitar datos “fantasma”.
- Diferenciar claramente error de validación, indisponibilidad externa y error interno.
- Mostrar confirmación estable del número de orden y ruta de seguimiento.
- Probar teclado móvil, zoom 200%, orientación horizontal y conexión lenta.
- Mantener el panel denso y operativo; evitar decorarlo como landing page.

## 14. Backend, API y manejo de errores

### Endpoints observados

| Familia | Protección | Estado |
|---|---|---|
| Configuración pública | CORS allowlist | Funcional; origen inválido `403` |
| Órdenes | Validación + rate limit | Funcional en pruebas inválidas; falta prueba real productiva |
| Cargas | Validación + rate limit + token | Correcta como primera defensa; reforzar tamaño/token/preset |
| Admin | Sesión + rate limit + protección edge | Sin sesión `401`; producción bloqueada por Cloudflare |
| Métodos desconocidos | Router | `405` verificado |

### Calidad de API

Los códigos principales son adecuados y las respuestas tienen forma consistente. Falta versionado explícito, contrato OpenAPI, identificador de correlación, logging estructurado, idempotencia para órdenes y mensajes diferenciados para JSON malformado.

Se recomienda una `Idempotency-Key` corta por intento de checkout para impedir órdenes duplicadas cuando el cliente reintenta por mala conexión.

## 15. Base de datos

### Estado verificado

- Cuatro migraciones aplicadas en producción.
- Las cuatro migraciones aplicaron correctamente sobre una base local vacía.
- Tamaño productivo: 77,824 bytes.
- Tablas e índices presentes; `foreign_key_check` sin hallazgos.
- Restricciones de estados/pagos e índices razonables para el volumen actual.
- 0 órdenes, 0 eventos, 0 credenciales administrativas persistidas y 1 configuración.

### Riesgos y mejoras

- Probar el flujo productivo real.
- Persistir una credencial rotada para dejar de depender del secreto fallback.
- Añadir política de retención y purga.
- Crear exportaciones/respaldo y simulacro de restauración.
- Vigilar crecimiento de `order_events` y archivos.
- Añadir idempotencia única a órdenes.
- No almacenar más PII que la necesaria.

## 16. Dependencias

- Dependencia directa principal: Tailwind CSS 3.4.17 para compilación.
- `npm audit`: 0 vulnerabilidades conocidas.
- Tailwind 4.3.3 es una actualización mayor; no debe aplicarse sin migración y regresión visual.
- `caniuse-lite` está desactualizado en el entorno de build.
- El árbol instalado parece tener enlaces de PNPM aunque el proyecto usa npm; normalizar con `npm ci` en CI.
- Revisar licencias de fuentes, fotografías, logos, Font Awesome y recursos de terceros.

## 17. Infraestructura y DevOps

### Bueno

- Hosting estático y Worker de bajo coste.
- D1 y Durable Objects adecuados al volumen previsto.
- TLS, redirección apex→www y cabeceras fuertes.
- `_headers`, `wrangler.jsonc`, migraciones y scripts versionados.
- Dry-run del Worker: 57.77 KiB, gzip 14.32 KiB.

### Pendiente

- Sin CI/CD versionado.
- Sin observabilidad del Worker.
- Sin política de respaldo/restauración.
- Sin runbook de incidentes o inventario de propietarios de cuentas.
- Sin entornos formales staging/production.
- Sin despliegue atómico documentado de Pages + Worker + migraciones.

## 18. Escalabilidad

La infraestructura edge puede soportar un crecimiento considerable, pero el límite operativo será la gestión manual de pedidos, no Cloudflare. Antes de escalar ventas deben resolverse:

- autoridad de precios;
- idempotencia;
- órdenes probadas;
- observabilidad;
- usuarios internos individuales;
- retención y respaldo;
- separación gradual de módulos monolíticos.

No se necesita microservicios, Kubernetes ni una reescritura en React. Serían complejidad prematura para el alcance actual.

## 19. Mantenibilidad y deuda técnica

**Deuda estimada para endurecer el producto actual:** 70-110 horas.
**Deuda para elevarlo a operación profesional mantenible:** 120-180 horas incluyendo CI/E2E, observabilidad, refactor incremental, backups y documentación.

Orden recomendado de refactor:

1. Extraer `worker/services/pricing-config.js` y probarlo.
2. Separar router/controladores/servicios/repositorios del Worker.
3. Separar `cart-store`, `cart-validation`, `cart-renderer` y `checkout-service`.
4. Separar navegación, modales, legal y formularios de `ui.js`.
5. Dividir admin en sesión, órdenes, configuración e imágenes.

Cada extracción debe conservar comportamiento y añadir pruebas; no hacer una reescritura total.

## 20. Testing y resultados

### Comandos y resultados

| Comando/prueba | Resultado |
|---|---|
| `npm test` | 38/38 pasan, 0 fallos |
| `npm run check:js` | Correcto |
| `npm run check:project` | 6 HTML, 2 CSS, scripts inline y rutas locales correctos |
| Worker dry-run | Correcto; 57.77 KiB / 14.32 KiB gzip |
| Migraciones D1 locales | 4/4 aplicadas |
| `npm audit` | 0 vulnerabilidades |
| `html-validate` | 12 errores semánticos/accesibilidad |
| Páginas a 375/1440 px | Sin overflow, imágenes rotas o controles sin nombre |
| Consola local | Sin errores ni advertencias durante navegación |
| API origen inválido | `403` |
| API admin sin sesión | `401` |
| Orden vacía/malformada | `400` |
| Método no permitido | `405` |
| Ruta inexistente producción | Incorrecto: `200`, soft 404 |

### Cobertura faltante

- No hay medición de cobertura de líneas/ramas.
- No hay Playwright/Cypress.
- No hay pruebas de integración D1 + Worker + configuración dinámica.
- No hay pruebas automáticas de cabeceras, 404, CORS y sesión.
- No hay carga controlada ni prueba de recuperación ante proveedor externo caído.

## 21. Calificaciones

| Área | Nota | Razón |
|---|---:|---|
| Arquitectura | 72 | Stack apropiado, pero configuración confiable inconsistente y módulos grandes |
| Backend | 74 | Worker/D1 sólidos; falta idempotencia, observabilidad y autoridad dinámica correcta |
| Frontend | 77 | Funcional y personalizado; monolitos y bloqueo por configuración |
| Base de datos | 76 | Buen esquema/migraciones; sin uso productivo probado, retención ni backups |
| Seguridad | 78 | Buenos controles, sin secretos ni CVE; reforzar upload, logs e identidad individual |
| SEO | 82 | Metadata y estructura fuertes; soft 404, canonicals y datos dinámicos pendientes |
| Rendimiento | 77 | Escritorio 97, móvil 73 y LCP 4.9 s |
| UX | 76 | Flujo comercial claro; menú móvil de alta fricción |
| UI | 84 | Identidad consistente y profesional |
| Accesibilidad | 84 | Lighthouse 96; contraste y semántica impiden nota superior |
| Escalabilidad | 70 | Infraestructura escala; operación, código y observabilidad aún no |
| Mantenibilidad | 68 | Núcleo bien separado, pero cinco módulos/documentos grandes |
| Calidad de código | 74 | Buenas utilidades y disciplina; deuda concentrada y artefactos desalineados |
| Testing | 72 | 38 pruebas valiosas; faltan integración/E2E/CI |
| DevOps | 65 | Configuración desplegable, pero manual y sin observabilidad/backup/CI |
| Documentación | 76 | README útil; faltan licencia, runbook y recuperación |
| **Estado general** | **75** | Producto valioso y desplegado, aún requiere endurecimiento P0/P1 |

## 22. Valor económico

### Supuestos explícitos

- Repositorio: ~14,400 líneas relevantes y ~25,000 líneas de churn histórico.
- Alcance: 6 páginas, 3 calculadoras, carrito, archivos, Worker, D1, panel, SEO, seguridad y 38 pruebas.
- Equipo equivalente: un desarrollador Senior full-stack con apoyo parcial de UX/QA/DevOps; un Semi Senior requeriría más supervisión y tiempo.
- Tarifa conservadora LATAM usada: USD 25-45/h. Es una estimación de mercado, no una cotización vinculante.
- Conversión de referencia: RD$58.6688 por USD, venta publicada por el Banco Central de la República Dominicana el 21 de julio de 2026.

### Estimación

| Concepto | Estimación |
|---|---:|
| Horas históricas plausibles | 220-340 h |
| Tiempo equivalente desde cero | 8-13 semanas para una persona Senior |
| Coste de reposición | USD 5,500-15,300 |
| Coste de reposición en DOP | RD$323,000-898,000 |
| Valor comercial actual, con riesgos conocidos | RD$250,000-450,000 |
| Valor después de P0/P1, E2E, observabilidad y operación probada | RD$400,000-700,000 |
| Mantenimiento técnico mensual | RD$18,000-45,000 según volumen de cambios |
| Infraestructura mensual actual | Aproximadamente USD 0-25 en bajo volumen, más cuotas de proveedores |
| Operación anual técnica mínima | RD$216,000-540,000 de mantenimiento, excluyendo personal de producción |

### ROI potencial

El valor no depende solo de vender el software. Su ROI proviene de reducir tiempo de cotización, errores de precio, conversaciones repetitivas y pérdida de leads. Si el sistema ahorra 30-60 horas administrativas mensuales y mejora la conversión de pedidos, puede recuperar una inversión de endurecimiento en pocos meses. No es responsable prometer un porcentaje sin conocer margen por pedido, tasa de conversión, ticket promedio y volumen mensual.

### Riesgo financiero

- **Actual:** medio-alto hasta corregir la divergencia de precios.
- **Después de P0/P1:** medio-bajo para cotización supervisada.
- **Para cobro automático:** alto hasta añadir autoridad server-side probada, pagos, conciliación y auditoría; pagos no forman parte del alcance deseado actual.

Fuentes de referencia: [Banco Central de la República Dominicana](https://www.bancentral.gov.do/) y referencias de tarifas LATAM como [ProLatamWork](https://prolatamwork.com/en/blog/latam-developer-rates-2026). Los rangos finales son una inferencia basada en el alcance real auditado.

## 23. Plan prioritario de acción

### Primeros 7 días

1. **P0:** usar la configuración D1 en el recálculo server-side y añadir prueba de integración.
2. **P1:** reparar menú móvil en scroll 0/medio/final.
3. Crear 404 real y alinear URLs canónicas/sitemap.
4. Resolver inyecciones Cloudflare bloqueadas por CSP.
5. Rotar/persistir credencial administrativa y comprobar cierre de sesiones.
6. Ejecutar una orden productiva controlada y documentar evidencia.
7. Exportar D1 antes y después de la prueba.

### 30 días

1. GitHub Actions con instalación limpia, tests, checks, build y Worker dry-run.
2. Playwright para cálculo, carrito, menú, admin y API crítica.
3. Workers Logs/traces, IDs de correlación y alertas.
4. Idempotencia de órdenes.
5. Política y tarea de retención de PII/archivos.
6. Optimización de LCP, fuentes, iconos e imágenes.
7. Correcciones WCAG y `html-validate` a cero.

### 60 días

1. Refactor incremental del Worker y carrito.
2. Fuente canónica para metadata/JSON-LD/configuración.
3. Entornos de staging y producción.
4. Respaldo automático y simulacro de restauración.
5. Protección reforzada de uploads con token corto/Turnstile y preset auditado.
6. Analytics de conversión respetuoso de privacidad.

### 90 días

1. Usuarios internos individuales mediante Cloudflare Access/MFA y auditoría por identidad.
2. Dashboard operativo de errores, órdenes y proveedores.
3. Manual de operación, incidente, recuperación y entrega.
4. Revisión externa de seguridad posterior a cambios.
5. Revisión trimestral de dependencias, contenido SEO y datos empresariales.

## 24. Criterios antes de declarar “listo para producción”

- [ ] El total del navegador y Worker coincide usando una tarifa modificada desde admin.
- [ ] Menú móvil abre/cierra en cualquier posición y no tapa controles.
- [ ] Rutas inexistentes devuelven 404.
- [ ] Canonical, sitemap, OG y URL final coinciden.
- [ ] Consola productiva sin errores CSP evitables.
- [ ] Una orden controlada completa aparece en D1 y correo.
- [ ] Reintentar la orden no la duplica.
- [ ] Credencial admin rotada y sesiones antiguas invalidadas.
- [ ] Exportación D1 y restauración probadas.
- [ ] CI y pruebas E2E pasan.
- [ ] Lighthouse móvil supera 85 o existe justificación documentada.
- [ ] Contrastes y validación HTML corregidos.
- [ ] Política de retención y borrado activa.
- [ ] Logs y alertas funcionan sin guardar PII innecesaria.

## 25. Resultado final

- **¿Compila?** Sí; Tailwind y Worker dry-run pasan, aunque el CSS versionado está desactualizado respecto a una compilación fresca.
- **¿Inicia?** Sí; web en `4190` y Worker en `8787`.
- **¿Pruebas pasan?** Sí, 38/38; faltan E2E e integración crítica.
- **¿Errores de consola?** No localmente; sí hay bloqueos CSP de scripts inyectados en producción.
- **¿Solicitudes fallidas?** No durante carga pública normal; las pruebas defensivas devolvieron códigos esperados.
- **¿Rutas funcionan?** Las conocidas sí; las desconocidas responden incorrectamente `200`.
- **¿Es responsivo?** No hay overflow a 375 px, pero el menú móvil tiene un fallo funcional importante.
- **¿Vulnerabilidades conocidas de npm?** No, 0 detectadas.
- **¿Hay riesgos de seguridad?** Sí, principalmente uploads, observabilidad, retención e identidad compartida; no se hallaron secretos ni inyecciones evidentes.
- **¿Está listo para producción?** Está desplegado y sirve para cotización supervisada, pero no debe declararse totalmente endurecido hasta resolver H-01, H-02 y validar una orden real.

## Referencias técnicas

- [Cloudflare Workers: buenas prácticas](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)
- [Cloudflare Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)
- [Cloudflare Workers Traces](https://developers.cloudflare.com/workers/observability/traces/)
- [Cloudflare D1 prepared statements](https://developers.cloudflare.com/d1/worker-api/prepared-statements/)
- [Cloudflare Web Crypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Google Core Web Vitals](https://web.dev/articles/vitals)

---

**Conclusión:** Made Acrílico tiene valor comercial real y una base técnica seria. El siguiente salto de calidad no exige rehacer la página: exige corregir la autoridad de precios, cerrar los fallos móviles/SEO, demostrar el flujo productivo completo y añadir disciplina operativa mediante CI, E2E, logs, retención y backups.
