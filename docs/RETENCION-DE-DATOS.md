# Política operativa de retención de datos

## Estado

Pendiente de aprobación del responsable de MADE ACRÍLICO antes de automatizar eliminaciones. Este documento evita que se implante un borrado irreversible sin validar necesidades fiscales, contables, contractuales y de atención al cliente.

## Propuesta

| Dato | Plazo propuesto | Acción al vencer |
|---|---:|---|
| Órdenes completadas o canceladas | 24 meses | Exportar respaldo requerido y eliminar de D1 |
| Solicitudes que nunca avanzaron | 12 meses | Eliminar de D1 |
| Eventos vinculados a una orden | Igual que la orden | Eliminación en cascada |
| Archivos de producción en Cloudinary | 90 días después de completar o cancelar | Eliminar del proveedor |
| Sesiones administrativas | 30 minutos de inactividad | Ya se invalidan automáticamente |
| Configuración comercial | Mientras esté vigente | Mantener historial mínimo de cambios |

## Requisitos antes de automatizar

1. Confirmar los plazos con asesoría legal y contable de República Dominicana.
2. Definir quién autoriza excepciones por garantía, reclamación o facturación.
3. Configurar credenciales de eliminación de Cloudinary únicamente como secreto del Worker.
4. Crear una tarea programada con modo simulación y reporte de conteos.
5. Probar restauración desde un respaldo cifrado.
6. Actualizar la política de privacidad pública con los plazos aprobados.

Hasta completar estos pasos, la eliminación será manual, registrada y aprobada. No deben borrarse datos reales desde desarrollo.
