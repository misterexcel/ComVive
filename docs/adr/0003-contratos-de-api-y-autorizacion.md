# ADR 0003 · Contratos de API y autorización

- **Estado:** **Aprobado** (aprobado por el líder del proyecto el 2026-11-08, cierre de la Etapa 1). Punto ya decidido por el líder el 2026-11-07: D12 (la clave de idempotencia guarda solo los éxitos; los rechazos se reevalúan). Revisión 4 aplicada: M-1 (campos con signo) y M-2 (qué escribe un rechazo). Hallazgo de QA H-34 aplicado (orden de evaluación, decisión 9). Hallazgo de QA H-46 (b) (varias fallas en el paso de forma: prevalece 400 `BAD_REQUEST`; decisión 9 y ADR-0003-S1) aplicado con la resolución del coordinador del 2026-11-08, aprobado por el líder el 2026-11-08. Enmendado el 2026-11-12 para alinearlo con la spec aprobada de comunidades y membresías (decisiones 3, 6 y 9; ver "Enmiendas de la rebanada 1").
- **Fecha:** 2026-11-07
- **Propone:** arquitecto de software
- **Decide:** líder del proyecto
- **Relacionados:** ADR 0001 (generación en `packages/shared`), ADR 0002 (orden de validación, 404/403), ADR 0004 (libro de movimientos), ADR 0006 (rutas de plataforma), ADR 0007 (Webpay)

## Contexto

La metodología de `CLAUDE.md` es desarrollo guiado por especificaciones: ningún endpoint se implementa sin contrato. Web y app no tocan la base de datos y solo muestran lo que entrega la API (`docs/arquitectura.md` §1). Varias operaciones mueven dinero o cambian quién responde por una deuda (emisión, correcciones, pagos, anulaciones, ocupaciones, resoluciones de Soporte), y en todas el usuario confirma algo que vio en una vista previa: si entre la vista previa y la ejecución el resultado cambió, escribir lo que el usuario no vio rompe la auditabilidad. Además, las redes móviles reintentan peticiones, y un doble envío no puede crear dos pagos.

## Decisión

1. **OpenAPI primero (diseño antes que código):**
   - El contrato vive en un archivo OpenAPI 3.1 versionado en el monorepo (ubicación exacta al crear el repositorio). Cada endpoint se agrega al contrato, se revisa y se aprueba como parte de la tarjeta "Lista para desarrollo" antes de implementarse.
   - De ese archivo se generan tipos y un cliente delgado en `packages/shared` (tarea `generate` de Turborepo, ADR 0001). La herramienta concreta de generación se elige en el prototipo de la Etapa 2, con preferencia por generadores que solo producen tipos y un cliente `fetch` mínimo.
   - Una prueba de contrato verifica que cada respuesta de la API cumple el esquema, incluida la lista cerrada de campos donde la spec la exige (por ejemplo, EX-1 y el DTO del propietario sobre el arrendatario).
2. **Montos CLP en JSON:** enteros. Por defecto, en el rango `0..Number.MAX_SAFE_INTEGER`. El tope de negocio ($9.999.999.999) lo valida la regla con 422 `AMOUNT_TOO_LARGE`, no el contrato. La API calcula con `bigint` y convierte a número solo en el borde JSON; si un valor quedara fuera del rango seguro, la conversión falla con error interno (nunca pierde precisión en silencio).
   - **Campos con signo (lista cerrada, M-1 de la rev. 4):** en el contrato son enteros en `-Number.MAX_SAFE_INTEGER..Number.MAX_SAFE_INTEGER`. Ningún otro campo de monto admite negativos; agregar uno exige actualizar esta lista, la de `docs/arquitectura.md` §1 y la prueba de contrato.

     | Campo | Dónde | Qué significa el signo | Tope del valor absoluto |
     | --- | --- | --- | --- |
     | `cashBalanceClp` | Cuerpo de `issue-preview` e `issue`; periodo y aviso | Saldo de caja declarado; negativo = sobregiro (spec G-4) | Lo valida la regla: 422 `AMOUNT_TOO_LARGE` sobre $9.999.999.999 (es el único campo con signo que se recibe) |
     | `reserveFundBalanceClp` | Aviso, vista previa de emisión, respuesta y advertencia de un egreso del fondo o de su corrección | Saldo del fondo registrado en ComVive; negativo permitido con advertencia (spec D-5, S-50) | Solo respuesta: se calcula desde el libro y `RESERVE_FUND_OUTFLOW` |
     | `differenceClp` | Vista previa, respuesta y lectura de una corrección de egreso del fondo (`kind = correction`) | Diferencia acumulada; negativa aumenta el saldo del fondo, positiva lo disminuye; nunca $0 (ADR 0004, decisión 11) | Solo respuesta: el monto correcto que la origina está topado por la regla (B-3, B-6) |
     | `balanceClp` | Saldos de unidad y de ámbito (estado de cuenta, aviso, saldos anteriores de la vista previa de emisión y de las ocupaciones) | Σ débitos − Σ créditos; negativo = saldo a favor (spec, Definiciones) | Solo respuesta: se calcula desde el libro |

   - Los ajustes y notas de crédito (H-2, E-10), las imputaciones y los pagos no llevan signo: el tipo de movimiento (`debit` o `credit`) dice la dirección y el monto siempre es mayor que $0.
3. **Autorización por acciones:** permisos con nombre (`period.issue`, `payment.register`, `committee_role.grant`, `platform.webpay_review.resolve`, etc.) mapeados a roles en una tabla de código versionada. La tabla de visibilidad (ADR 0002) se aplica antes que la de permisos. Ambas matrices se publican en `docs/specs/` y generan pruebas automáticas. **Enmienda del 2026-11-12:** la tabla de permisos de la rebanada 1, con los cuatro nuevos, está en "Enmiendas de la rebanada 1", punto 1.
4. **Quién otorga cada rol:** `admin` solo Operaciones ComVive por rutas `/platform/...`; `committee` y `concierge` el administrador por las rutas de membresías; `resident` nace y termina con la ocupación. El administrador recibe 403 al otorgar o revocar `admin`. Detalle y errores en `docs/arquitectura.md` §3.
5. **Vistas previas atadas a la ejecución:** toda operación que mueve dinero o cambia el responsable de una deuda (incluidas alta, término, venta y la resolución de Soporte) tiene un endpoint de vista previa que no persiste y devuelve un `previewHash` (SHA-256 de la serialización canónica del **resultado** mostrado más la versión del módulo de cálculo). La ejecución recalcula el resultado dentro de su transacción y, si la huella no coincide, responde **409 `PREVIEW_OUTDATED`** sin escribir. La huella de plataforma es la única que cubre un subconjunto (ADR 0006). Las advertencias que cambian con cada pago (saldo del fondo negativo) no entran en la huella.
6. **Idempotencia:** toda escritura de dinero o de responsable de deuda exige `Idempotency-Key` (UUID del cliente). `IDEMPOTENCY_KEY` es única por **(persona, `community_id`, endpoint, clave)**, con `NULLS NOT DISTINCT` para las rutas de plataforma. La clave se revisa después de sesión, membresía, visibilidad, permiso y forma (400), y antes de las reglas de negocio y de la huella (decisión 9). Ninguna regla de negocio depende de la clave. **Enmienda del 2026-11-12:** el módulo de comunidades y membresías la exige en **toda** escritura (Supuesto (a validar) ADR-0003-S3; "Enmiendas de la rebanada 1", punto 2).
   - **Qué se guarda (decisión del líder D12, 2026-11-07; M-2 de la rev. 4):** solo las respuestas **exitosas** (2xx). La fila de `IDEMPOTENCY_KEY` (con el hash del cuerpo y la respuesta) se inserta en la **misma transacción** que la escritura de negocio, así que existe solo si la escritura se confirmó.
   - **Qué se reevalúa:** todo rechazo, 4xx o 5xx (400 `BAD_REQUEST`, 409 de estado o `PREVIEW_OUTDATED`, 422 de reglas de entrada, 503 `PAYMENT_GATEWAY_UNAVAILABLE`, también en el inicio de Webpay, spec S-57), se deshace con su transacción y **no** se guarda con la clave. Un reenvío con la misma clave, con el mismo cuerpo o corregido, se evalúa de nuevo como una petición nueva. Ejemplos: un pago manual rechazado con 422 `PAYMENT_REFERENCE_REQUIRED` se corrige y se reenvía con la misma clave y se registra (CA-67); una revocación rechazada con 409 `LAST_ADMIN` se reintenta con la misma clave después de otorgar el rol al nuevo administrador y se acepta (CA-69).
   - **Conflicto definitivo (lista cerrada):** 422 `IDEMPOTENCY_KEY_REUSED`, cuando la clave ya tiene una respuesta exitosa guardada y el cuerpo es distinto. No se guarda como respuesta propia: se deriva siempre de la fila existente, así que se repite igual mientras la clave viva (30 días, S-36). Con el mismo cuerpo, se devuelve la respuesta exitosa guardada, aunque la huella ya no coincida o el estado haya cambiado. Ningún otro rechazo es definitivo: un 409 de estado final (p. ej. `PAYMENT_ALREADY_VOIDED`, `ROLE_ALREADY_REVOKED`) se vuelve a obtener al reevaluar, sin necesidad de guardarlo.
   - **Envíos paralelos con la misma clave:** el segundo espera en el índice único hasta que el primero confirma o se deshace. Si el primero confirmó, la transacción del segundo se deshace y responde la respuesta guardada (o `IDEMPOTENCY_KEY_REUSED` si el cuerpo difiere); si se deshizo, el segundo se evalúa normalmente.
   - **Ningún rechazo escribe datos de negocio.** La auditoría que exige ADR 0005 y ADR 0006 sí registra cada petición rechazada de las rutas `/platform/...`: se escribe en una transacción propia, después de deshacer la de negocio, y si falla, la petición falla. `AUDIT_LOG` no es un dato de negocio ni se usa para responder reintentos.
   - **Excepción en dos fases, inicio de Webpay (ADR 0007, decisión 3):** el inicio confirma el intento antes de llamar a Transbank, así que la clave se inserta en esa primera transacción, sin respuesta, y la respuesta se guarda cuando Transbank entrega el token. Si la creación en Transbank falla, la misma transacción que deja el intento en `abandoned` borra la fila de la clave: el 503 no queda guardado y un reenvío con la misma clave crea un intento nuevo. Un reenvío que llega mientras la fila no tiene respuesta recibe 409 `IDEMPOTENCY_KEY_IN_PROGRESS` (**ADR-0003-S2**).
7. **Grupos de pagos:** todo `PAYMENT` lleva `payment_group_id` permanente (el id del intento en Webpay, uno generado por la API en el pago manual). La anulación siempre cubre el grupo completo.
8. **Bloqueo único del libro por comunidad:** toda transacción que inserta en `LEDGER_ENTRY` toma primero `SELECT ... FOR UPDATE` sobre el periodo en borrador vigente de la comunidad y después el bloqueo de su objeto (gasto, grupo de pagos, intento, ocupación), en ese orden fijo. Así no hay interbloqueos y la huella que se compara es la que se escribe.
9. **Orden de evaluación (H-34, fijado por el coordinador; aprobado por el líder el 2026-11-08):** toda petición se evalúa en este orden y responde el **primer** error:
   1. **Autenticación:** sin sesión válida, 401. Una sesión válida de la audiencia ajena pasa este paso y recibe 404 en el siguiente (ADR 0006).
   2. **Aislamiento y permiso (ADR 0002):** membresía (o rol de plataforma), visibilidad del recurso y permiso de la acción: 404 si no lo ve, 403 si lo ve sin permiso.
   3. **Forma:** JSON mal formado, campos faltantes o de tipo incorrecto, encabezado `Idempotency-Key` ausente o que no es UUID: 400 `BAD_REQUEST` (los campos de monto, 422 `INVALID_AMOUNT`, ADR-0003-S1, en este mismo paso). **Varias fallas de forma a la vez (H-46 (b), resolución del coordinador del 2026-11-08):** si alguna no tiene código propio (JSON mal formado, clave ausente o inválida, u otro campo que no es de monto), prevalece 400 `BAD_REQUEST`; 422 `INVALID_AMOUNT` solo si todas las fallas de forma son de campos de monto.
   4. **Idempotencia (decisión 6):** 422 `IDEMPOTENCY_KEY_REUSED` o, solo en el inicio de Webpay, 409 `IDEMPOTENCY_KEY_IN_PROGRESS`; con la clave de una ejecución exitosa y el mismo cuerpo, la respuesta guardada, sin evaluar el paso 5.
   5. **Reglas de negocio (409 de estado y 422):** en el orden fijado por la spec para esa operación (por ejemplo, otorgar comité, corregir un gasto, cancelar un arriendo, corregir un egreso del fondo, iniciar Webpay). Si la spec no fija un orden, rige el general: estado (409) antes que reglas de entrada (422), y `PREVIEW_OUTDATED` al final, solo en la ejecución.

   Las verificaciones del paso 2 que dependen de un dato del cuerpo (p. ej. `occupancyId` o ámbitos de otra unidad, `role = admin` al otorgar) no se pueden hacer antes de leerlo: se evalúan justo después del paso 3, con la misma regla 404/403, y siempre antes del paso 4. Así un cuerpo mal formado sobre un recurso que el actor no ve responde 404, y sobre uno que ve, 400, aunque la clave ya tenga una respuesta guardada o el recurso esté en un estado que daría 409. Las vistas previas siguen el mismo orden, sin el paso 4.

   **Enmienda del 2026-11-12 (decisión del líder D57):** en ese mismo lugar, después del paso 3 y antes del paso 4, se evalúan también las verificaciones 403 que dependen de la **instancia del recurso de la ruta**, que son una lista cerrada en ADR 0009 ("Enmiendas de la rebanada 1", punto 1); hoy, solo revocar una membresía `admin` por la ruta de membresías de la comunidad. Detalle en "Enmiendas de la rebanada 1", punto 3.

   **Prueba (TDD, generada para cada endpoint de escritura):** una petición que falla a la vez en dos o más pasos responde el error del primero. Casos mínimos (TC-GC-CB-33 (d)): sin sesión y con JSON mal formado, 401; residente con JSON mal formado sobre una unidad ajena, 404; comité con JSON mal formado al registrar un pago, 403; administrador con JSON mal formado al emitir un periodo ya emitido, con otra clave, 400 y no 409 `PERIOD_ALREADY_ISSUED`; misma clave de una emisión exitosa con cuerpo distinto sobre el periodo ya emitido, 422 `IDEMPOTENCY_KEY_REUSED` y no 409; misma clave y mismo cuerpo, la respuesta guardada; cuerpo con una fecha inválida y un monto con decimales a la vez, 400 `BAD_REQUEST` y no `INVALID_AMOUNT` (TC-GC-CB-33 (d''), H-46 (b)); con solo montos inválidos, `INVALID_AMOUNT`.

## Alternativas consideradas

| Opción | Por qué se descarta |
| --- | --- |
| Código primero (contrato generado desde decoradores de NestJS) | El contrato existiría solo después de implementar; contradice "contrato antes de desarrollo" y deja a web y app esperando a la API. Se puede usar para verificar que la implementación coincide con el archivo, no como fuente. |
| GraphQL | Agrega un modelo de autorización por campo más difícil de probar contra la matriz 404/403 y la regla de aislamiento. Fuera del alcance del MVP (`docs/arquitectura.md` §1). |
| Montos como texto decimal o `number` con decimales | Viola la regla 1 de `CLAUDE.md` (CLP enteros, nunca decimales). |
| Montos como texto entero para soportar más de 2^53 − 1 | Innecesario con el tope de $9.999.999.999 y más difícil de validar y mostrar. |
| Confirmar sin vista previa, o con un token de versión del borrador en lugar del resultado | Sin vista previa el usuario confirma a ciegas. Una versión del borrador produce 409 por cambios que no alteran el resultado y no cubre cambios que vienen de otros objetos (pagos, término de ocupación). |
| Idempotencia por (persona, endpoint, clave), sin comunidad | Una clave repetida en otra comunidad devolvería la respuesta de la primera (menor 10 de la rev. 3). |
| Agrupar pagos por la clave de idempotencia | La clave se borra a los 30 días; después se podría anular un solo pago del grupo (M-1). |
| Guardar también las respuestas 4xx con la clave (M-2 de la rev. 4) | Corregir y reenviar con la misma clave respondería `IDEMPOTENCY_KEY_REUSED` (CA-67), y un 409 `LAST_ADMIN` seguiría saliendo después de otorgar al nuevo administrador. Obliga al cliente a generar una clave nueva por cada corrección, que es justo lo que la clave debe evitar. Descartado por el líder (D12). |
| Guardar los 4xx salvo una lista de "reevaluables" | Lista larga y frágil: cada código nuevo exige decidir. La regla inversa (solo éxitos, más un conflicto derivado) es más corta y no tiene casos sin decidir. |
| Insertar la clave en una transacción aparte, antes de la escritura | Si la escritura falla, la clave queda guardada sin respuesta o con un rechazo; habría que limpiarla. En la misma transacción, el rechazo la deshace sola. |
| Registrar la auditoría de un rechazo de plataforma en la transacción de negocio | Se desharía con el rechazo y la petición quedaría sin registro, contra ADR 0006 (decisión 8). |
| Forma (400) antes que aislamiento y permiso (orden habitual de un validador) | Quien no ve el recurso recibiría 400 en vez de 404, contra la regla "404 si no lo ve" (ADR 0002), y quien lo ve sin permiso recibiría 400 en vez del 403 que le explica que no puede hacer la acción (H-34). |
| Idempotencia antes que la forma | Un cuerpo mal formado con una clave ya usada respondería `IDEMPOTENCY_KEY_REUSED`, que esconde el error real; y comparar el hash de un cuerpo que no es JSON válido no tiene sentido. |
| Reglas de negocio (409) antes que la idempotencia | Un reintento legítimo de una emisión exitosa recibiría 409 `PERIOD_ALREADY_ISSUED` en vez de su respuesta original, y la idempotencia dejaría de proteger contra reintentos. |
| Bloqueos por unidad en lugar de uno por comunidad | Más concurrencia, pero exige un orden de bloqueos más complejo y abre interbloqueos entre emisión y ocupaciones. Se reconsidera con datos del piloto. |

## Consecuencias

### Positivas

- Web, app y API trabajan en paralelo contra un contrato aprobado; los tipos generados evitan divergencias.
- El usuario nunca ejecuta algo distinto de lo que vio; todo 409 se explica con un texto de la spec.
- Los reintentos de red no duplican dinero.
- Las pruebas de permisos y de contrato se generan, no se escriben a mano endpoint por endpoint.

### Negativas

- Cada operación de dinero tiene dos endpoints (vista previa y ejecución) y calcula dos veces.
- El bloqueo único serializa las escrituras del libro de una comunidad.
- `IDEMPOTENCY_KEY` guarda respuestas durante 30 días: es una tabla más que purgar.

### Riesgos

- **Serialización canónica inestable** (orden de campos, versión del módulo): produciría 409 falsos. Mitigación: una sola función de serialización en el módulo de cálculo, con pruebas de propiedades (fast-check) de estabilidad.
- **Contención del bloqueo único** en comunidades grandes: mitigación con medición en el piloto y, si hace falta, un ADR que lo afine por unidad.
- **Validación de forma frente a la spec:** un monto con decimales o negativo no debe terminar en un 400 genérico del validador cuando la spec pide 422 `INVALID_AMOUNT`. Mitigación: el validador de la API traduce los errores de los campos de monto al código de la regla B-5 (ver "Supuestos").

## Supuestos (a validar) y preguntas abiertas

- **ADR-0003-S1 · Supuesto (a validar):** un error de forma en un campo de monto (decimales, negativo, texto) responde 422 `INVALID_AMOUNT` con el texto de la regla B-5 (o el de la corrección, donde $0 anula); un error de forma en cualquier otro campo, o un JSON mal formado, responde 400 `BAD_REQUEST`; si conviven ambos tipos de error, 400 (H-46 (b)). La spec no define el 400; se propone agregarlo a la tabla de errores (H-5).
- **ADR-0003-S2 · Supuesto (a validar):** un reenvío del inicio de Webpay con la misma clave, mientras el primero espera la respuesta de Transbank (segundos), responde 409 `IDEMPOTENCY_KEY_IN_PROGRESS` con "Tu pago anterior aún se está procesando. Espera unos segundos e intenta de nuevo", sin escribir nada. Es el único endpoint en dos fases; los demás escriben la clave en una sola transacción y el envío paralelo espera en el índice único. El código y el texto los fija el analista en la tabla de errores de la spec.
- **Supuesto (a validar) S-36 de la spec:** la clave de idempotencia se conserva 30 días.
- **Supuesto (a validar) de la arquitectura §4:** la contención del bloqueo único es aceptable para comunidades pequeñas (pregunta 1 de §8).
- **Supuesto (a validar) de la arquitectura §3:** el nombre `concierge_role.grant` se confirma en la spec de conserjería.
- Spec: P-4 (si el comité debe aprobar emisión o cierre, lo que cambiaría la matriz de permisos), P-24 (roles de plataforma), P-25 (quién puede integrar el comité), P-32 (tope de $9.999.999.999).
- Preguntas de `docs/arquitectura.md` §8: 1, 3, 10 y 12.

## Enmiendas de la rebanada 1

Alineación del 2026-11-12 con `docs/specs/comunidades-y-membresias.md` (rev. 4, aprobada por el líder del proyecto el 2026-11-11), puntos 16, 26 y 27 de sus "Contradicciones y vacíos" (plazo fijado por D73). Precisan este ADR sin cambiar su enfoque.

1. **Permisos de la rebanada 1 (decisión 3; puntos 16 y 22; spec, "Acciones de la rebanada" y "Qué recursos ve cada rol").** Cada ruta lleva un único permiso (ADR 0009, decisión 2). Permisos nuevos:

   | Permiso | Rol que lo tiene | Tipo de recurso | Acciones |
   | --- | --- | --- | --- |
   | `platform.community.create` | `platform_operations` | Política `platform` | `POST /platform/communities` (alta de comunidad con su primer administrador). Antes la ruta no tenía un permiso con nombre |
   | `community.profile.write` | Administrador | `community` | `PATCH /communities/{communityId}` (nombre, dirección, comuna y tipo; nunca el RUT) |
   | `unit.write` | Administrador | `unit-config` | Crear, editar, lote y eliminar unidades (`POST …/units`, `POST …/units/batch`, `PATCH` y `DELETE …/units/{unitId}`), incluidos la alícuota y el orden (`sort_order`) |
   | `person_record.write` | Administrador | `person-record` | `PATCH /communities/{communityId}/person-records/{personRecordId}` (nombre y contacto de la ficha) |

   - **`sort_order` pasa a `unit.write`** (punto 13 de la spec): deja de editarse con `community.billing.configure`. Los dos permisos son solo del administrador, así que nadie gana ni pierde acceso.
   - **Permisos ya definidos que la rebanada usa sin cambios:** `platform.admin_role.grant` (otorgar y revocar administradores), `occupancy.write` (ocupaciones), `owner_roster.read` (registro de copropietarios e historial de ocupaciones) y `committee_role.grant` (otorgar y revocar comité, y resolver la tarea "Revisar rol de comité").
   - **Conserjería:** `concierge_role.grant` (decisión 4 y "Supuestos") queda sin uso hasta la spec de conserjería (D50); el contrato de la rebanada 1 no acepta `role = concierge`.
   - Las listas cerradas del código (`CommunityPermission`, `PlatformPermission`) están en ADR 0009, "Enmiendas de la rebanada 1", punto 2. Los códigos de error nuevos y el esquema de `UNITS_INVALID` (única respuesta del módulo con una lista, `rows`) entran al contrato OpenAPI de la rebanada (decisión 1), que se aprueba con su tarjeta.

2. **Idempotencia en toda escritura del módulo de comunidades y membresías (decisión 6; punto 27; spec S-CM-23). Supuesto (a validar) ADR-0003-S3.** La decisión 6 exige `Idempotency-Key` en las escrituras de dinero o de responsable de deuda. La spec la extiende a **toda** escritura del módulo, para que un reintento por red no cree dos unidades, dos fichas ni dos membresías. La spec está aprobada, pero la extensión sigue marcada como supuesto y pendiente en su pregunta P-CM-14; por eso queda aquí como supuesto y no como decisión cerrada.
   - **Alcance:** todo `POST`, `PATCH` y `DELETE` de la tabla "Acciones de la rebanada", incluidas las tres rutas de plataforma, el lote, la edición y la eliminación de unidades, la edición de los datos de la comunidad y la corrección de una ficha. Las vistas previas no llevan clave (decisión 9).
   - **Mismo mecanismo, sin cambios:** misma tabla, misma unicidad (persona, `community_id`, endpoint, clave), mismo lugar en el orden y mismas reglas de D12 (solo se guardan los éxitos; todo rechazo se reevalúa; `IDEMPOTENCY_KEY_REUSED` es el único conflicto definitivo). El encabezado ausente o que no es UUID responde 400 `BAD_REQUEST` en el paso de forma. El "endpoint" es la ruta-plantilla con su método (ADR 0009, decisión 4).
   - **Efecto en `PATCH`:** un reintento con la misma clave y el mismo cuerpo de una edición exitosa devuelve la respuesta guardada, aunque el recurso haya cambiado después.
   - **Efecto en `DELETE` (observación para QA y para el cliente):** el reintento de una eliminación exitosa de una unidad responde **404**, no la respuesta guardada, porque el guard verifica el recurso de la ruta (paso 3b de ADR 0009) antes de la idempotencia y la unidad ya no existe. Es el orden de la decisión 9, no una excepción: el cliente trata ese 404 como "ya eliminada". La clave igual protege contra dos envíos en paralelo.
   - **Datos personales en la respuesta guardada:** algunas respuestas del módulo llevan nombre, RUT o contacto (ficha, ocupaciones). Quedan en `IDEMPOTENCY_KEY` hasta su purga a los 30 días, por comunidad y con RLS, igual que las respuestas de ocupaciones que ya cubría la decisión 6. La retención definitiva sigue la pregunta 7 de `docs/arquitectura.md` §8.
   - **Fuera de este módulo** la regla general no cambia: cada spec decide si extiende la clave a sus escrituras sin dinero.

3. **El paso posterior a la forma también cubre el recurso de la ruta (decisión 9, párrafo final; punto 26; decisión del líder D57).** El párrafo final hablaba solo de verificaciones 404/403 que dependen de un dato del **cuerpo**. Se agrega un caso: un **403** que depende de la **instancia del recurso de la ruta**. Es una lista cerrada que vive en ADR 0009 ("Enmiendas de la rebanada 1", punto 1), cada entrada citada a la spec que la define; hoy tiene una sola, revocar una membresía `admin` por `POST /communities/{communityId}/memberships/{membershipId}/revoke` (spec E-CM-1, CA-CM-16).
   - **Orden dentro de ese paso:** primero los 404 (visibilidad de un dato del cuerpo) y después los 403, como en el guard: un 403 nunca confirma que existe algo que el actor no ve (spec CM-D2, R2-m-2).
   - **Efecto:** en esa ruta, un cuerpo mal formado responde 400 antes que el 403, y el 403 sale antes que cualquier respuesta guardada con la clave.
   - **Numeración:** este ADR numera cinco pasos y evalúa estas verificaciones "justo después del paso 3"; la spec de gasto común ("Respuestas de error") y la de comunidades y membresías numeran seis y las llaman paso 4, con la idempotencia en el 5 y las reglas de negocio en el 6. Son el mismo orden.
   - Las respuestas que dependen de la instancia y no son 403 (422 `RESIDENT_ROLE_FOLLOWS_OCCUPANCY`, 422 `ADMIN_RECORD_MANAGED_BY_COMVIVE`) son reglas de negocio del último paso, en el orden que fija la spec.

**Supuesto nuevo:**

- **ADR-0003-S3 · Supuesto (a validar):** toda escritura del módulo de comunidades y membresías exige `Idempotency-Key` (spec S-CM-23). Se confirma o se corrige cuando el líder responda P-CM-14 de esa spec.

## Referencias

- `docs/arquitectura.md` §1 (contrato primero, montos en JSON), §2 (regla 404/403 y orden de validación), §3 (permisos, quién otorga cada rol) y §4 ("Vistas previas atadas a la ejecución", "Idempotencia de escrituras de dinero", "Pagos y conciliación", "Libro de movimientos": bloqueo único).
- `docs/specs/gasto-comun.md`: "Usuarios y permisos", "Códigos y mensajes de error" (H-5) y "Orden entre reglas de negocio"; reglas A-7, B-5, B-6, F-4, F-9 y G-4; S-34, S-36 y S-37; CA-25 (emisión idempotente), CA-31 (doble envío), CA-32, CA-39 y CA-40 (confirmación contra vista previa), CA-43, CA-56, CA-58 y CA-64.
- `CLAUDE.md`: reglas 1, 4 y 5; metodología "Lista para desarrollo".
