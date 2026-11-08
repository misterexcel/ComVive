# ADR 0006 · Usuarios de plataforma y excepción acotada al aislamiento

- **Estado:** **Aprobado** (aprobado por el líder del proyecto el 2026-11-08, cierre de la Etapa 1). Puntos ya decididos por el líder el 2026-11-07: D9 (Operaciones ComVive no puede revocar al último administrador de una comunidad), D10 (código `LAST_ADMIN`, su texto y que cuenta el administrador sin primer ingreso), D12 (los rechazos no se guardan con la clave de idempotencia; la auditoría de plataforma sí los registra) y D13 (`resolve_without_charge` desde `reversal_pending` cuando el reembolso responde 292). Revisión 4 aplicada: B-3, M-2 y M-5. Hallazgos de QA H-35, H-41 y H-42 aplicados con las resoluciones del coordinador, aprobados por el líder el 2026-11-08.
- **Fecha:** 2026-11-07
- **Propone:** arquitecto de software
- **Decide:** líder del proyecto
- **Relacionados:** ADR 0002 (aislamiento), ADR 0003 (vistas previas e idempotencia), ADR 0005 (segundo factor y auditoría), ADR 0007 (estados Webpay)

## Contexto

El líder del proyecto decidió (2026-11-07) que los intentos Webpay "en revisión" los resuelve Soporte ComVive, y que el rol de administrador de una comunidad solo lo otorga ComVive (Operaciones ComVive, que en el MVP también crea las comunidades). Eso exige personas del equipo ComVive que **no son miembros de ninguna comunidad** y que, en el caso de Soporte, leen datos de cualquier comunidad. Es una excepción a la regla 4 de `CLAUDE.md`, y la spec la acota como EX-1: solo intentos en `in_review` o `reversal_pending`, con una lista cerrada de campos, sin nombres, RUT ni deudas, y con cada acceso auditado. La spec deja a este ADR el detalle técnico (P-16 cerrada).

## Decisión

1. **Roles de plataforma fuera de `MEMBERSHIP`:** tabla global `PLATFORM_ROLE_GRANT` (persona, rol, vigencia, quién otorgó, motivo). No habilita ninguna ruta `/communities/...` ni aparece en "Mis comunidades". Dos roles con mínimo privilegio:
   - `platform_support` (Soporte ComVive): listar, ver y resolver intentos en `in_review` o `reversal_pending`. Tiene tres resoluciones de fondo (`register_authorized`, `mark_for_reversal` y `resolve_without_charge`) más la confirmación del reverso (`confirm_reversal`); el detalle y las transiciones están en ADR 0007 (decisiones 5 y 8).
   - `platform_operations` (Operaciones ComVive): crear comunidades y otorgar o revocar la membresía `admin`. No ve datos de negocio.
   - Cada rol recibe 404 en los endpoints del otro.
   - **Último administrador (decisión del líder D9, 2026-11-07):** Operaciones no puede revocar la última membresía `admin` vigente de una comunidad. Responde 409 `LAST_ADMIN` con "No se puede revocar al único administrador de la comunidad. Otorga primero el rol a quien lo reemplazará" (código y texto aprobados por el líder, D10), en el orden `REASON_REQUIRED` → `ROLE_ALREADY_REVOKED` → `LAST_ADMIN` (spec S-68). No cambia la membresía ni las suscripciones (ninguna revocación toca sesiones, ADR 0005 decisión 3), ni guarda la respuesta con la clave de idempotencia (D12, ADR 0003 decisión 6); la petición sí queda en la auditoría de plataforma (decisión 8). Cuenta como administrador vigente toda membresía `admin` otorgada y no revocada, aunque la persona aún no haya hecho su primer ingreso (D10). Para cambiar al único administrador, primero se otorga el nuevo y después se revoca el anterior; el reintento de la revocación con la misma clave se reevalúa y se acepta.
   - **Bloqueo:** toda transacción que otorga o termina una membresía `admin` toma primero la fila de la comunidad (`SELECT ... FROM community WHERE id = $1 FOR UPDATE`) y, con el bloqueo tomado, cuenta las membresías `admin` vigentes distintas de la que se revoca; si son cero, 409. Así, dos revocaciones concurrentes de los dos únicos administradores se ordenan: la segunda espera, cuenta después de la primera y recibe 409. Es un bloqueo corto y separado del bloqueo único del libro (ADR 0003), para no frenar pagos ni emisiones. Aplica a toda vía que termine una membresía `admin`; hoy solo la revocación de Operaciones (la ruta de comunidad responde 403).
   - **Membresía que Operaciones no ve (H-41, resolución del coordinador):** Operaciones no tiene membresía en la comunidad; en las rutas `/platform/communities/{communityId}/admin-memberships/{membershipId}/...` solo ve las membresías `admin` de la comunidad de la ruta. Un `membershipId` inexistente, de otra comunidad o de una membresía que no es `admin` (comité, conserjería, residente) responde **404 `NOT_FOUND`**, con el mismo cuerpo en todos los casos, en el paso de aislamiento del orden de ADR 0003 (decisión 9): antes de la forma, de la clave y de `REASON_REQUIRED`, `ROLE_ALREADY_REVOKED` y `LAST_ADMIN`. No toma el bloqueo de la comunidad ni cuenta administradores. Una membresía `admin` ya revocada de esa comunidad sí es visible (409 `ROLE_ALREADY_REVOKED`). Queda en la auditoría de plataforma (decisión 8) con la comunidad de la ruta y el código `NOT_FOUND`.
2. **Otorgamiento sin endpoint en el MVP:** los roles de plataforma se otorgan por un procedimiento de operación aprobado por el líder del proyecto y auditado.
3. **Sesión separada:** audiencia `platform`, distinta de `community`. Cada guard rechaza la audiencia ajena con 404. Segundo factor obligatorio (ADR 0005).
4. **Módulo `platform` separado en la API, con rutas `/platform/...`** (lista en `docs/arquitectura.md` §3).
5. **Lectura solo a través de la vista `platform_webpay_review`:** columnas de EX-1 filtradas a `in_review` y `reversal_pending`, más `draft_year_month` y `final_scope_type` para la vista previa, calculados por la vista. Del reembolso expone su resultado (`refund_outcome`, `refund_response_code`) y su monto (`refund_amount_clp`, de `WEBPAY_REFUND.amount_clp`), y calcula `without_charge_available` (verdadero solo si el intento está en `reversal_pending` con un `WEBPAY_REFUND` creado pasados los 7 días sin respuesta concluyente, `source_gateway_call_id` nulo, y rechazado con 292; ADR 0007, D13), que el detalle y la vista previa devuelven como `withoutChargeAvailable`. La consulta un rol de base de datos propio (`comvive_platform`) con `SELECT` solo sobre esa vista y ningún permiso sobre tablas base. Si RLS se pospone (ADR 0002), una regla de lint limita el módulo `platform` al modelo de la vista.
6. **Huella de plataforma, por resolución (M-5 de la rev. 4):** SHA-256 de la serialización canónica de los campos de la tabla, más la versión del módulo de cálculo. Cubre todo lo que la vista previa muestra a Soporte y nada de lo que no ve: no cubre deuda ni imputación (M-5 de la rev. 2). Los campos comunes a toda resolución son `attemptStatus` (estado del intento), `resolution` y `paymentToCreate` (`{ amountClp, finalScopeType, draftPeriod }` o `null`).

   | Resolución | Campos propios, además de los comunes | Qué produce 409 `PREVIEW_OUTDATED` entre la vista previa y la ejecución |
   | --- | --- | --- |
   | `register_authorized` | Ninguno (el monto autorizado ya está en `paymentToCreate.amountClp`) | Cambia el periodo del borrador, el tipo de ámbito final (CA-54) o el monto autorizado guardado |
   | `mark_for_reversal` | `transbankStatus` y `transbankStatusSource` (resultado de la consulta previa a Transbank, abajo) y `refundToRequest` (`{ amountClp }` o `null`; el monto lo fija ADR 0007, decisión 8, "Monto") | Cambia el estado de Transbank de modo que cambie si se pide reembolso o por cuánto (p. ej. `AUTHORIZED` → `REVERSED`, o una anulación parcial que baja el saldo anulable) |
   | `confirm_reversal` | `refundOutcome` (`reversed`, `nullified`, `failed` o `null` sin `WEBPAY_REFUND`; con `pending` no hay vista previa válida: 409 `REFUND_PENDING`, H-35 y ADR 0007 decisión 8) | Cambia el resultado del reembolso, que decide la advertencia de la consola (D7, solo con `failed`) |
   | `resolve_without_charge` | `transbankStatus`, `transbankStatusSource` y `withoutChargeAvailable` | Cambia el estado que respalda la resolución o su origen (p. ej. de `query` a `none`, que agrega la advertencia de D5), o deja de cumplirse `withoutChargeAvailable` |

   - **`transbankStatus`:** el estado de Transbank que usó la API para decidir (`INITIALIZED`, `AUTHORIZED`, `REVERSED`, etc.), o `null` si no hay ninguno concluyente.
   - **`transbankStatusSource`:** de dónde salió: `query` (consulta hecha en esta petición, dentro de los 7 días consultables), `last_stored` (última respuesta guardada, pasados los 7 días), `refund_292` (respuesta 292 del reembolso de `mark_for_reversal`; solo en `resolve_without_charge` desde `reversal_pending` con `withoutChargeAvailable = true`, D13, sin consulta a Transbank) o `none` (sin respaldo; declaración de Soporte con advertencia, D5).
   - El estado consultado en esta petición no sale de la vista `platform_webpay_review` (decisión 5), que expone solo lo guardado: lo obtiene la API con el comercio del intento (ADR 0007, decisión 8) y lo devuelve en la vista previa como parte de "estado y códigos de Transbank" (EX-1).
   - Las advertencias que dependen de estos campos (D5, D7) son parte de lo que Soporte confirma, por eso entran en la huella. Fuera de la vista: 404; dentro de la vista con una resolución que no corresponde al estado, o con huella distinta: 409 `PREVIEW_OUTDATED` con los dos textos de la spec (F-16).
7. **Escritura con el contexto de la comunidad del intento:** la resolución no escribe directo. Invoca el mismo servicio de pagos de la comunidad, en una transacción con el `TenantContext` de la comunidad **tomada del registro del intento** (nunca de la petición), `SET LOCAL app.community_id` y actor `platform`. Solo escribe filas de esa comunidad, de esa unidad, en los ámbitos del intento y, únicamente para el traspaso de F-13, en el ámbito `owner` de esa unidad; y solo por el monto autorizado.
8. **Auditoría de cada acceso:** toda petición a `/platform/...`, incluidas las lecturas y las rechazadas (404, 409, 422, 503), escribe en `AUDIT_LOG` con `actor_type = platform`, rol, comunidad, ids devueltos y, en un rechazo, el código de error. Si la auditoría falla, la petición falla. **Ningún rechazo escribe datos de negocio** (D12): la transacción de negocio se deshace y el registro del rechazo se escribe en una transacción propia, sin fila en `IDEMPOTENCY_KEY` (ADR 0003, decisión 6). Las resoluciones exigen motivo. El administrador ve en su auditoría las acciones de Soporte en su comunidad.
9. **Pruebas de aislamiento específicas:** las de `docs/arquitectura.md` §3 (audiencias cruzadas, estados fuera de la vista, filas insertadas por la resolución con ocupación vigente y terminada, rol `comvive_platform` sin acceso a tablas base, auditoría obligatoria, separación entre roles, revocación, lista cerrada de campos de la vista previa, 409 por estado, resolución sin cobro, último administrador, huella por resolución, membresía que Operaciones no ve (prueba 14, H-41) y revocación sin efecto entre comunidades (prueba 15, H-42)).
10. **Prueba del último administrador (D9, D10 y D12; prueba 12 de §3, TDD):** revocar al único administrador responde 409 `LAST_ADMIN`, no cambia la membresía, las sesiones ni las suscripciones (las sesiones tampoco cambian en una revocación aceptada, H-42), no deja fila en `IDEMPOTENCY_KEY` y sí deja su registro en `AUDIT_LOG`; con dos administradores, dos revocaciones concurrentes (transacciones paralelas sincronizadas con una barrera, repetidas muchas veces) terminan con exactamente una aceptada y otra 409, y la comunidad conserva un administrador vigente; revocar uno de dos se acepta; un reintento con la misma clave **se reevalúa**: sin cambios responde otra vez 409 `LAST_ADMIN`, y después de otorgar `admin` a otra persona (aunque no haya hecho su primer ingreso) se acepta; los administradores de otra comunidad no cuentan ni quedan bloqueados.
11. **Prueba de la huella por resolución (decisión 6, TDD):** para cada resolución, cambiar entre la vista previa y la ejecución cada campo de su fila de la tabla responde 409 `PREVIEW_OUTDATED` sin escribir nada (con el doble de Transbank para `transbankStatus`, `transbankStatusSource` y `refundToRequest`, y con el resultado del reembolso para `refundOutcome`); un cambio de la deuda del ámbito que no altera esos campos no produce 409.

## Alternativas consideradas

| Opción | Por qué se descarta |
| --- | --- |
| Membresía `support` en cada comunidad | Multiplica membresías, mezcla al equipo ComVive con los usuarios de la comunidad y le da acceso a todo lo que exponen las rutas de comunidad. |
| Rol de superusuario o rol de base de datos con `BYPASSRLS` | Rompe la regla 4 sin límite: un error de consulta expone todas las comunidades. |
| Que el administrador de la comunidad resuelva | Decisión del líder: lo resuelve ComVive, que opera la relación con Transbank. |
| Mostrar a Soporte la imputación y la deuda en la vista previa | Excede EX-1 y obliga a dar a `comvive_platform` lectura del libro (M-5). |
| Endpoint para otorgar roles de plataforma en el MVP | Superficie de ataque nueva para pocas personas; un procedimiento aprobado y auditado basta mientras el equipo es pequeño (P-24). |
| Permitir revocar al último administrador con una advertencia (supuesto anterior, spec P-48) | La comunidad quedaría sin nadie que emita, cierre o concilie, y sin quien vea las tareas pendientes. Descartado por el líder (D9). |
| Último administrador: verificar sin bloqueo (contar y luego revocar) | Dos revocaciones concurrentes ven cada una "queda otro" y dejan la comunidad sin administrador. |
| Último administrador: usar el bloqueo único del libro (ADR 0003) | Funciona, pero detiene pagos y emisiones de la comunidad por un cambio de roles; un bloqueo propio sobre la fila de la comunidad es igual de simple. |
| Último administrador: aislamiento `SERIALIZABLE` en la transacción de revocación | También evita la carrera, pero exige reintentos por error de serialización en el código; el bloqueo explícito sigue el patrón ya usado en el resto del diseño. |
| Una sola huella de plataforma igual para todas las resoluciones (versión anterior de la decisión 6) | No cubría la consulta a Transbank ni el reembolso: un cambio de `AUTHORIZED` a `REVERSED`, o del saldo anulable, entre la vista previa y la ejecución haría algo distinto de lo que Soporte vio (CA-68; M-5 de la rev. 4). |
| Incluir en la huella la respuesta completa de Transbank | Cambiaría con datos que Soporte no usa para decidir (fechas de consulta, códigos secundarios) y produciría 409 falsos. La huella cubre solo el estado, su origen y el monto del reembolso. |
| Misma sesión para plataforma y comunidad, distinguida por rol | Un error de guard daría a una sesión de plataforma acceso a rutas de comunidad, o al revés. Las audiencias separadas lo cortan en el token. |

## Consecuencias

### Positivas

- La excepción a la regla 4 queda reducida a una vista, un rol de base de datos y un módulo, todo probado y auditado.
- La resolución usa el mismo servicio de pagos que la comunidad: una sola implementación de imputación, intereses y traspaso.
- El administrador conserva visibilidad completa de lo que ComVive hizo en su comunidad.

### Negativas

- Una consola web adicional (dentro de `apps/web`) con su propio ingreso y segundo factor.
- Mantener la vista sincronizada con EX-1: cualquier campo nuevo exige actualizar spec, vista y prueba de contrato.
- Sin endpoint de otorgamiento, el alta de personas de plataforma es manual.

### Riesgos

- **Vista que expone una columna de más:** mitigación con la prueba de contrato de lista cerrada (prueba 9) y la revisión de seguridad de cada cambio a la vista.
- **Resolución que toma la comunidad de la petición por error:** mitigación con la prueba 4 sobre todas las filas insertadas.
- **Acceso de plataforma no revocado a tiempo:** mitigación con la vigencia en `PLATFORM_ROLE_GRANT` (prueba 8) y revisión periódica de accesos (P-24).

## Supuestos (a validar) y preguntas abiertas

- **Supuesto (a validar) de la arquitectura §3:** los roles de plataforma se otorgan solo por procedimiento de operación aprobado por el líder (spec P-24; pregunta 10 de §8).
- **Supuesto (a validar) de la arquitectura §3:** sesión de plataforma de máximo 8 horas.
- **Supuesto (a validar) S-32 de la spec:** Soporte tiene tres resoluciones de fondo (`register_authorized`, `mark_for_reversal` y, desde D3, `resolve_without_charge`) más `confirm_reversal`, y un intento de dos ámbitos no se registra: solo se reversa o, sin cobro, se resuelve sin cobro.
- **Supuesto (a validar) S-41 de la spec:** días hábiles para el plazo de Soporte.
- **Supuesto (a validar) S-68 de la spec:** bloqueo contra revocaciones concurrentes. Este ADR lo implementa con el bloqueo de la fila de la comunidad (decisión 1), igual que la spec rev. 7 (menor 2 de la rev. 4, resuelto). El efecto observable es el mismo.
- **Spec:** P-24 (otorgamiento y controles de los roles de plataforma), P-54 (si basta un administrador sin primer ingreso). P-31 quedó resuelta por D2 (ADR 0007) y P-48 por D9 y D10 (`LAST_ADMIN`, CA-69).
- **Preguntas de `docs/arquitectura.md` §8:** 8 (alertas a Soporte por canales fuera de Chile) y 10.

## Referencias

- `docs/arquitectura.md` §2 (lista de datos globales, vista `platform_webpay_review`, respuestas 404) y §3 ("Usuarios de plataforma (ComVive)", endpoints, datos que ve Soporte, cómo se preserva la regla 4, pruebas 1 a 13, alternativas descartadas).
- `docs/specs/gasto-comun.md`: "Excepción de aislamiento EX-1", "Otorgamiento de roles", "Validaciones de la consola de Operaciones ComVive", reglas A-7, F-13 y F-16; S-68; CA-41, CA-42, CA-54, CA-55, CA-59, CA-65, CA-68 y CA-69.
- `docs/revisiones/2026-11-07-diseno-rev4.md` (B-3, M-2, M-5).
- `docs/design/flujos/plataforma-soporte-webpay.md`.
- `CLAUDE.md`: reglas 4, 7 y 10.
