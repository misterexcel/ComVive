# Especificación: Motor de gasto común

Estado: Borrador
Responsable: analista-producto
Aprobación: líder del proyecto

> **Revisión crítica 1: Rechazado → cambios aplicados.** Cambios principales:
>
> - **Intereses (C-1):**
>   - Ahora se calculan con tasas anuales en base 365 y tope diario.
>   - Quedan detrás de un feature flag, como rebanada posterior del MVP.
>   - La tasa CMF pasa a ser un dato global.
>   - Los días no cobrados no se pierden.
> - **Grupos y fondo (M-1, M-2):** la clave de grupo es (cuenta, base de pesos) y hay un fondo por cada grupo ordinario. El prorrateo por consumo sale del MVP.
> - **Movimientos posteriores a la emisión (M-3, M-11):** regla única: van al borrador vigente.
> - **Acceso (M-4, M-5):** el arrendatario ve solo sus propios cargos (en la revisión 2 esto pasó a ser su ámbito) y los ex residentes pierden acceso.
> - **Ajustes (M-6):** acumulan las correcciones previas y usan la foto de participaciones del periodo original.
> - **Imputación (M-7, M-8):** el invariante impide que coexistan deuda y saldo a favor, y el orden de imputación se reescribió.
> - **Participación y desempate (M-9, M-10):** `aliquot_e6`, `sort_order` y la Comunidad D.
> - **Apertura (M-12):** se reserva el movimiento de apertura.
> - **Otros:** cargos $0 sin movimiento, códigos HTTP exactos, casos borde nuevos y simplificaciones de alcance.
>
> **Revisión crítica 2: Aprobado con cambios → cambios aplicados.** No se renumeró ninguna regla ni ningún CA existente; las reglas y los CA nuevos van al final de su serie. Cambios:
>
> - **Ámbito de cada cargo (M-A):** se fija al crearlo. Los saldos se calculan por ámbito, el interés se calcula por ámbito y el ámbito del arrendatario pasa al de la unidad cuando termina su ocupación. Reglas F-9 y E-6, permisos, CA-22 y CA-26 nuevo.
> - **Débito de ajuste (M-B):** pertenece al borrador donde se registra y vence con ese aviso (CA-14).
> - **Fecha efectiva de imputación (M-C):** máx(`paid_on`, vencimiento del cargo). Regla F-11 y CA-27 nuevos.
> - **Recálculo de intereses ya cobrados (M-D):** se hace en ambos sentidos. Regla E-10 y CA-28 nuevos; P-12 queda cerrada.
> - **Fondo de reserva (m-D):** se redondea hacia arriba (techo). Cambia la Comunidad D (CA-4, GOLD-D-04).
> - **Intereses (m-A, m-B, m-C, m-E, m-K):**
>   - Base actual/actual (días del año calendario).
>   - Tasa del reglamento versionada por fecha.
>   - Categoría CMF por defecto.
>   - Flag activo con fecha explícita en CA-6 y CA-8.
> - **Otros (m-F a m-J):** criterios simples para el débito nuevo, la reclasificación, el cierre y la fecha de emisión. El movimiento de apertura usa el código `opening`. CA-9 queda coherente con la Comunidad A.
>
> **Revisión 3 (revisión crítica 2 del diseño, `docs/revisiones/2026-11-07-diseno-rev2.md`, y decisiones del líder del proyecto del 2026-11-07): cambios aplicados.** No se renumeró ninguna regla ni ningún CA existente; las reglas nuevas van al final de su serie y los CA nuevos son CA-29 a CA-47. Cambios:
>
> - **Pago por ámbito desde la app (decisión 1, M1, M2, M3):** el propietario elige pagar su ámbito `owner`, el del arrendatario vigente o ambos; el arrendatario paga solo el suyo. Un cobro que cubre ambos ámbitos genera un pago por ámbito, agrupados por el intento Webpay o por el registro manual (modelo de `docs/arquitectura.md` §4). Bloqueo de Webpay por (unidad, ámbito). Regla F-12, cambios en F-9 y CA-29, CA-30 y CA-32.
> - **Roles (decisión 2, M9):** el administrador otorga el rol de comité; el rol de administrador solo lo otorga el equipo de ComVive. Sección "Otorgamiento de roles" y CA-43.
> - **Webpay en revisión (decisión 3, M4):** lo resuelve el rol de plataforma Soporte ComVive, con mínimo privilegio y como excepción acotada al aislamiento (EX-1). Regla F-16 y CA-41 y CA-42.
> - **Comité (decisión 4, menor 2):** ve nombre, unidad, alícuota y deuda de los copropietarios, con RUT enmascarado y sin teléfonos ni correos. CA-44.
> - **Idempotencia de pagos (M5):** la unicidad (`origin`, `external_ref`, ámbito) aplica solo a Webpay e importaciones; en el pago manual manda la clave del envío. Reglas F-2 y F-3 y CA-31.
> - **Anular gasto (M6):** excepción explícita a B-5 con monto correcto $0. Regla H-6 y CA-33 y CA-34.
> - **Ocupaciones (M7):** ámbito de ocupación terminada, ingresos y términos retroactivos, unidad sin propietario registrado y capital traspasado. Reglas F-13, F-14, F-15 y E-11 y CA-35 a CA-38.
> - **Versión confirmada (M8):** la emisión, la anulación de pagos y la corrección de gastos se confirman contra la versión mostrada en la vista previa. Regla A-7 y CA-39 y CA-40.
> - **Aviso de cobro (menores 3, 6 y 11):** notificación automática al emitir, RUT siempre enmascarado en el PDF, contenido de la vista del arrendatario y del resumen para residentes. Reglas G-6 a G-8 y CA-45 a CA-47.
> - **Alineación con `docs/arquitectura.md`:** identificadores de ámbito `owner` y `occupancy` (tabla en "Definiciones"), `previewHash` y 409 `PREVIEW_OUTDATED` (A-7), estados de `WEBPAY_ATTEMPT` (F-16), roles `platform_support` y `platform_operations`, un código de comercio Transbank por comunidad (decisión del líder, 2026-11-07; F-12) y P-16 cerrada con el ADR 0006.
> - **Hallazgos de QA sobre la spec (H-1 a H-19, `docs/qa/casos/gasto-comun.md`):**
>   - Fecha en que se evalúa "vencido" y orden total de imputación (F-5).
>   - Intereses: ventana sin capital en mora y recálculo sin cargo original (E-10), y ventana del capital traspasado (E-11).
>   - Códigos HTTP y mensajes de las validaciones (sección "Códigos y mensajes de error").
>   - Cierre del periodo (CA-48).
>   - Total de la unidad en el aviso legal (F-9).
>   - Orden de la transacción de emisión (A-3.3).
>   - Diferencia ±1 por cuenta (C-6) y cierre de P-15.
>   - Monto máximo y aritmética `bigint` (B-6).
>   - Porcentaje máximo del fondo (D-2).
>   - Alcance de la clave de idempotencia (A-3.4).
>   - Precisiones en CA-8, CA-11, CA-20, CA-26 y CA-28, y supuesto de ámbito del Depto 102 en CA-1 a CA-21.
>   - CA nuevos CA-48 a CA-52.

## Objetivo

Calcular, emitir y cobrar el gasto común mensual de cada unidad de una comunidad. Los montos son enteros en CLP, trazables y reproducibles desde el libro de movimientos. Así el administrador cierra el mes rápido y con confianza, y el residente sabe exactamente qué debe y por qué.

La especificación cubre el MVP. Donde la ley o la práctica contable no son claras, se toma un **supuesto (a validar)** con el código `S-n` (ver la sección de supuestos). Los supuestos permiten avanzar en la fase de prueba. Ninguno es definitivo sin la validación del líder del proyecto y, cuando corresponda, de un abogado o un contador.

> **Citas legales.** Los artículos de la Ley 21.442 se citan según el texto de LeyChile (BCN) y la reproducción de modulor.cl. La numeración exacta se debe verificar contra el texto oficial (P-1).

## Definiciones

- **Periodo:** mes calendario de gastos (`2026-10` = gastos de octubre).
- **Borrador vigente:** el único periodo en estado `borrador` de la comunidad. Siempre existe exactamente uno (regla A-2).
- **Gasto:** egreso de la comunidad registrado en un periodo. Tiene concepto, subcategoría, monto CLP entero, cuenta y base de pesos.
- **Cuenta:** clasificación de cargos y abonos:
  - **Cuentas de cargo:** `ordinario`, `fondo_reserva`, `extraordinario`, `intereses`, `multas`.
  - **Cuenta técnica de pagos:** `pago`.
  - **Movimiento reservado:** apertura, con código `opening` (regla F-10).
- **Base de pesos:** de dónde salen los pesos de prorrateo. En el MVP hay tres:
  - `alicuota`: `aliquot_e6` de todas las unidades de la comunidad.
  - `partes_iguales`: peso 1 para cada unidad de un conjunto explícito de unidades.
  - `monto_directo`: un monto fijo para una unidad, sin prorrateo.
- **Grupo:** conjunto de gastos de un periodo con la misma **clave (cuenta, base de pesos)**. En `partes_iguales`, el conjunto de unidades forma parte de la clave.
- **Cargo:** monto cobrado a una unidad en un periodo y una cuenta. Cada cargo distinto de $0 tiene exactamente un movimiento de débito en el libro.
- **Pago:** dinero recibido para una unidad. Genera un crédito en el libro (cuenta `pago`) y se reparte en **imputaciones** a cargos pendientes.
- **Saldo de una unidad:** Σ débitos − Σ créditos del libro. Si es positivo, la unidad debe. Si es negativo, tiene saldo a favor.
- **`aliquot_e6`:** alícuota legal como entero en escala 10^-6 (18,50 % = 185000; 100 % = 1000000), según `docs/arquitectura.md` §4.
- **`sort_order`:** entero único por comunidad que fija el orden de desempate de las unidades.
- **Foto de participaciones:** copia, guardada al emitir, de las unidades que participaron en el periodo, con su `aliquot_e6`, su `sort_order`, los conjuntos de partes iguales y el porcentaje del fondo.
- **Ámbito:** responsable de un débito dentro de la unidad. Es un atributo fijo que se asigna al crear el movimiento y nunca cambia, salvo el traspaso de la regla F-9. Los identificadores son los del código (`docs/arquitectura.md` §4, `scope` y `occupancy_id`):

  | En el texto | Identificador en el código | Responsable |
  | --- | --- | --- |
  | Ámbito de la unidad o del propietario | `owner` | El propietario |
  | Ámbito de la ocupación (del arrendatario) | `occupancy`, con su `occupancy_id` | Un arrendatario concreto, durante su ocupación |

  - En los CA, "`occupancy` O-1" es el ámbito de la ocupación O-1 (`scope = occupancy`, `occupancy_id` = O-1). Hasta la revisión 3 la spec usaba `unidad` y `ocupacion:<id>`; son lo mismo que `owner` y `occupancy`.
- **Saldo por ámbito:** Σ débitos del ámbito − Σ créditos imputados o disponibles en ese ámbito. La suma de los saldos de todos los ámbitos es el saldo de la unidad.
- **Ocupación:** registro de que una persona es propietaria o arrendataria de una unidad desde una fecha de ingreso y, si terminó, hasta una fecha de término. La lleva el administrador (`occupancy.write`).
- **Ocupación vigente / terminada:** una ocupación de arrendatario está vigente desde su ingreso hasta su término registrado. Está terminada desde que se registra su término; en ese momento se hace el traspaso de la regla F-9.
- **Traspaso:** par de movimientos enlazados (crédito en el ámbito de la ocupación y débito en el ámbito `owner`, o al revés para un saldo a favor) que mueve lo pendiente de una ocupación terminada al ámbito `owner`. Nada se edita (`docs/arquitectura.md` §4, movimientos `transfer`).
- **Versión de la vista previa (`previewHash`):** huella del resultado que mostró una vista previa. Cambia cada vez que cambia algo que altera lo que se va a escribir (regla A-7; `docs/arquitectura.md` §4).
- **Intento Webpay (`WEBPAY_ATTEMPT`):** una transacción Transbank, con un número de orden (`buy_order`), un monto total y uno o más ámbitos pagados (`WEBPAY_ATTEMPT_SCOPE`, uno por ámbito, con su monto). Estados: `initiated` (en curso), `confirmed`, `rejected`, `abandoned`, `in_review` (en revisión), `resolved_paid`, `reversal_pending` y `reversed` (regla F-16).
- **Pago (`PAYMENT`):** cada pago pertenece a un solo ámbito y tiene un origen (`PAYMENT.origin`): `manual`, `webpay` o `import`. Un cobro que cubre dos ámbitos genera **un pago por ámbito**, agrupados por el intento Webpay o por el registro manual (regla F-12).

## Usuarios y permisos

| Rol | Puede ver | Puede hacer |
| --- | --- | --- |
| Administrador | Todo el gasto común de las comunidades donde tiene membresía vigente, incluidos los intentos Webpay de su comunidad (`webpay_attempt.read`) y el registro de copropietarios y ocupantes completo (`owner_roster.read`) | Configurar porcentaje del fondo, plazo de vencimiento, tasa del reglamento y `sort_order` (`community.billing.configure`). Crear, editar y eliminar gastos y cargos directos en el borrador vigente (`expense.write`). Emitir (`period.issue`) y cerrar (`period.close`). Registrar y anular pagos manuales (`payment.register`, `payment.void`). Registrar ajustes, correcciones y anulaciones de gastos (`adjustment.create`). Registrar ocupaciones: ingreso y término de arrendatarios y cambios de propietario (`occupancy.write`). Otorgar y revocar el rol de comité (`committee_role.grant`). **No** otorga el rol de administrador ni resuelve intentos Webpay en revisión |
| Comité | Lo mismo que el administrador, solo de su comunidad y solo lectura, con datos personales limitados (regla "Datos de copropietarios que ve el comité") | Descargar avisos y reportes. Nada más (ver P-4) |
| Residente propietario | Avisos de cobro, cargos, pagos, imputaciones y saldo de **sus** unidades, por ámbito: el ámbito `owner` y el del arrendatario vigente, cada uno por separado (regla F-9). Resumen de gastos y saldo de caja de la comunidad (regla G-8) | Pagar en línea (Webpay) su ámbito `owner`, el del arrendatario vigente o ambos (`payment.pay_online`, regla F-12). Descargar sus avisos |
| Residente arrendatario | Solo los movimientos de **su ámbito** (`occupancy`, con su `occupancy_id`), es decir, los cargos emitidos mientras era el ocupante responsable y sus intereses y ajustes (regla F-9), con el contenido de la regla G-7. Resumen de gastos de la comunidad (regla G-8) | Pagar en línea solo su ámbito (`payment.pay_online`, regla F-12). Descargar el comprobante de su cobro, no el aviso legal (regla G-7) |
| Conserje | Nada de este módulo | Nada |
| Ex propietario o ex residente | Nada: pierde el acceso al vencer su membresía (S-14) | Pedir su historial al administrador |
| Soporte ComVive (rol de plataforma `platform_support`) | Solo los intentos Webpay en `in_review` o `reversal_pending`, de cualquier comunidad, con los campos de la excepción EX-1 (`platform.webpay_review.read`). Ningún otro dato de ninguna comunidad (excepción EX-1) | Resolver intentos Webpay en revisión (`platform.webpay_review.resolve`, regla F-16) |
| Operaciones ComVive (rol de plataforma `platform_operations`; "Cuentas ComVive" en `docs/arquitectura.md` §3) | Ningún dato de negocio de las comunidades | Otorgar y revocar el rol de administrador de una comunidad (`platform.admin_role.grant`) |

Respuestas de error:

- **403:** un rol con membresía vigente en la comunidad intenta una acción que su rol no permite. Por ejemplo, el comité intenta emitir, o el conserje intenta leer un aviso.
- **404:** el recurso pertenece a otra comunidad, la membresía está vencida, o un residente pide una unidad que no es suya o un movimiento fuera de su ámbito. Se devuelve 404 para no revelar que el recurso existe (`docs/qa/plan-de-pruebas.md`, ISO-8). Para Soporte ComVive, todo recurso fuera de la excepción EX-1 responde 404.
- **409:** conflicto de estado: el periodo ya fue emitido (A-3.4), la versión confirmada cambió (A-7), el pago ya fue anulado o el intento Webpay ya fue resuelto (F-16).
- **422:** la petición es válida en forma pero una regla de negocio la impide; por ejemplo, registrar por el monto autorizado un intento que cubre dos ámbitos (F-16). Los mensajes de validación de cada regla se muestran tal como están escritos en esta especificación.

### Códigos y mensajes de error (H-5)

Los códigos en mayúsculas son el campo `code` del cuerpo de la respuesta. El texto es el que ve el usuario. La convención es 409 para un conflicto con el estado actual y 422 para una entrada que una regla no permite. Los que ya fija `docs/arquitectura.md` se usan con el mismo nombre.

| Caso | Regla | HTTP | Código | Mensaje |
| --- | --- | --- | --- | --- |
| Escritura en un periodo emitido o cerrado | A-4, A-5 | 409 | `PERIOD_NOT_EDITABLE` | "El periodo <AAAA-MM> está <emitido\|cerrado>. Registra el movimiento en el borrador vigente" |
| Emitir un periodo ya emitido (otra clave) | A-3.4 | 409 | `PERIOD_ALREADY_ISSUED` | "El periodo ya fue emitido" |
| Cerrar un periodo en borrador | A-5 | 409 | `PERIOD_NOT_ISSUED` | "Solo se puede cerrar un periodo emitido" |
| Cerrar un periodo ya cerrado (otra clave) | A-5 | 409 | `PERIOD_ALREADY_CLOSED` | "El periodo ya está cerrado" |
| Vista previa desactualizada | A-7 | 409 | `PREVIEW_OUTDATED` | Según la acción (tabla de A-7) |
| Misma clave de idempotencia con otro cuerpo | A-3.4 | 422 | `IDEMPOTENCY_KEY_REUSED` | "Esta operación ya se envió con otros datos. Vuelve a abrir el formulario" |
| Comunidad sin unidades | A-3.8 | 422 | `COMMUNITY_WITHOUT_UNITS` | "La comunidad no tiene unidades. Crea las unidades antes de emitir" |
| Alícuotas que no suman 100 % | A-3.1 | 422 | `ALIQUOTS_NOT_100` | "Las alícuotas suman 99,9900 %; deben sumar 100,0000 %" (con la suma real) |
| Grupo con total > 0 y pesos en 0 | A-3.2 | 422 | `GROUP_WITHOUT_WEIGHTS` | "El grupo <cuenta> / <base> no tiene unidades con participación para repartir $<total>" |
| Monto 0, negativo o con decimales | B-5 | 422 | `INVALID_AMOUNT` | "El monto debe ser un número entero de pesos mayor que $0" |
| Monto sobre el máximo | B-6 | 422 | `AMOUNT_TOO_LARGE` | "El monto supera el máximo permitido de $9.999.999.999" |
| Fondo bajo 500 pb | D-2 | 422 | `RESERVE_RATE_BELOW_MINIMUM` | "El fondo de reserva no puede ser menor que 5,00 % (Ley 21.442, art. 39)" |
| Fondo sobre 5000 pb | D-2 | 422 | `RESERVE_RATE_ABOVE_MAXIMUM` | "El fondo de reserva no puede superar 50,00 %. Si el reglamento fija más, contacta a soporte" |
| `paid_on` futuro | F-1 | 422 | `PAID_ON_IN_FUTURE` | "La fecha de pago no puede ser futura" |
| Pago manual sin ámbito con arrendatario vigente | F-9 | 422 | `SCOPE_REQUIRED` | "Elige a qué deuda aplicar el pago" |
| Anular un pago que no es manual | F-4 | 422 | `PAYMENT_NOT_VOIDABLE` | "Este pago no se puede anular desde ComVive" |
| Anular gasto sin motivo | H-6 | 422 | `REASON_REQUIRED` | "Indica el motivo de la anulación" |
| Pago en línea sin código de comercio | F-12 | 422 | `ONLINE_PAYMENT_NOT_AVAILABLE` | "Esta comunidad aún no recibe pagos en línea. Paga por transferencia con los datos de tu aviso" |
| Pago en línea de un ámbito sin deuda | F-12 | 422 | `SCOPE_WITHOUT_DEBT` | "Esta deuda no tiene saldo pendiente" |
| Monto distinto del que vio el residente | F-12 | 409 | `AMOUNT_CHANGED` | "El monto a pagar cambió. Revisa el nuevo monto" |
| Pago en curso sobre el mismo ámbito | F-12 | 409 | `PAYMENT_IN_PROGRESS` | "Hay un pago en proceso para esta deuda" |
| Registrar un intento de dos ámbitos en revisión | F-16 | 422 | `MULTI_SCOPE_REVIEW_REVERSAL_ONLY` | "Un pago que cubre dos deudas solo se puede marcar para reverso" |
| Comité a quien no es propietario | Otorgamiento de roles | 422 | `COMMITTEE_REQUIRES_OWNER` | "El rol de comité solo se otorga a propietarios registrados de la comunidad" |

La alerta de periodo sin gastos (CA-20) no es un error. La vista previa la devuelve como advertencia y el administrador confirma.

Auditoría:

- Toda escritura (gasto, emisión, cierre, pago, anulación, ajuste, configuración) queda en el registro de auditoría.
- También queda toda lectura de deudas de terceros por el administrador o el comité (regla 7 de `CLAUDE.md`).
- También queda **toda** lectura y toda resolución de Soporte ComVive (excepción EX-1).
- También queda todo otorgamiento y toda revocación de roles.

### Otorgamiento de roles (decisión del líder del proyecto, 2026-11-07)

El flujo completo va en `docs/design/flujos/admin-usuarios-y-roles.md`. Este módulo fija solo quién puede otorgar qué:

| Rol que se otorga | Quién lo otorga y revoca | Permiso |
| --- | --- | --- |
| Administrador | Solo Operaciones ComVive. Ningún administrador crea, otorga ni revoca administradores, ni siquiera en sus propias comunidades | `platform.admin_role.grant` |
| Comité | El administrador de la comunidad | `committee_role.grant` |
| Soporte ComVive y Operaciones ComVive | Solo el equipo de ComVive, fuera de la aplicación de las comunidades (P-24) | Fuera de este módulo |

- **Comité, a quién (Supuesto (a validar), S-34):** solo a una persona registrada como propietaria de una unidad de la comunidad, con una referencia obligatoria a la asamblea que la eligió (fecha y texto libre). Si no cumple, se rechaza con "El rol de comité solo se otorga a propietarios registrados de la comunidad". Fuente: el comité de administración lo integran copropietarios elegidos por la asamblea (glosario de `CLAUDE.md`; Ley 21.442, artículo por verificar en P-1). Los casos de cónyuge, conviviente civil o representante de una persona jurídica quedan en P-25.
- **Revocación:** tiene efecto inmediato. La persona conserva sus otros roles (por ejemplo, residente propietario) y desde la revocación recibe 403 en las acciones y pantallas del comité.
- Todo otorgamiento y toda revocación quedan en auditoría, con quién, a quién, cuándo y la referencia.

### Datos de copropietarios que ve el comité (decisión del líder del proyecto, 2026-11-07)

`owner_roster.read` entrega campos distintos según el rol. El filtro lo aplica la API: los campos excluidos no viajan en la respuesta, no basta con ocultarlos en la pantalla.

| Campo | Administrador | Comité |
| --- | --- | --- |
| Nombre del propietario | Sí | Sí |
| Unidad y alícuota | Sí | Sí |
| Deuda por ámbito (deuda bruta y saldo a favor) | Sí | Sí |
| RUT | Completo | Enmascarado (`12.345.***-*`) |
| Teléfono y correo | Sí | No |
| Nombre y RUT del arrendatario | Sí | No: el ámbito del arrendatario se muestra como "Arrendatario", con su deuda, sin nombre ni RUT (Supuesto (a validar), S-33) |

Cada lectura del comité queda en auditoría (regla 7 de `CLAUDE.md`).

### Excepción de aislamiento EX-1: Soporte ComVive (decisión del líder del proyecto, 2026-11-07)

La regla 4 de `CLAUDE.md` exige que toda consulta a datos de negocio filtre por comunidad. **EX-1 es la única excepción de este módulo**, explícita y acotada:

- **Quién:** personas del equipo de ComVive con el rol de plataforma `platform_support`. No tienen membresía en ninguna comunidad.
- **Qué ven:** solo los intentos Webpay en estado `in_review` o `reversal_pending` (regla F-16), de cualquier comunidad, y solo estos campos (`docs/arquitectura.md` §3, vista `platform_webpay_review`): id del intento, número de orden (`buy_order`), comunidad (id y nombre), código de la unidad, tipo de ámbito (`owner` u `occupancy`, sin nombre de la persona), monto iniciado por ámbito, monto autorizado, estado y códigos de Transbank, y fechas. Un intento en otro estado les responde 404.
- **Qué no ven:** nombres, RUT, teléfonos, correos, cargos, pagos, saldos, deudas, avisos ni ningún otro dato de la comunidad. Todo otro endpoint de negocio les responde 404.
- **Qué hacen:** solo las dos resoluciones de la regla F-16.
- **Auditoría:** toda lectura y toda resolución queda en auditoría, con persona, intento, fecha y hora, y motivo en las resoluciones.
- **Pruebas:** cada endpoint de EX-1 lleva su prueba de aislamiento que verifica los campos permitidos y el 404 en todo lo demás (CA-42).
- **ADR:** EX-1 se documenta en el ADR 0006 "Usuarios de plataforma y excepción acotada al aislamiento", que propone `docs/arquitectura.md` (P-16 cerrada). El ADR fija el detalle técnico: vista `platform_webpay_review` con rol de base de datos propio, sesión separada con segundo factor y pruebas de aislamiento específicas.

## Reglas de negocio

### A. Ciclo del periodo

1. **Estados:** `borrador` → `emitido` → `cerrado`. No hay transiciones hacia atrás.
2. **Borrador vigente:**
   - Siempre existe exactamente uno por comunidad.
   - El primero se crea al configurar la comunidad.
   - Al emitir el periodo M se crea automáticamente, en la misma transacción, el borrador M+1.
   - En el borrador, el administrador agrega, edita o elimina gastos y cargos directos. Esos gastos aún no generan cargos.
3. **Emisión** (`period.issue`, solo administrador):
   1. **Validación de alícuotas:** si algún grupo del periodo usa la base `alicuota`, la suma de `aliquot_e6` de las unidades de la comunidad debe ser exactamente 1.000.000. Si no, la emisión se bloquea con el mensaje: "Las alícuotas suman 99,9900 %; deben sumar 100,0000 %" (con la suma real, en 4 decimales). Si ningún grupo usa alícuota, esta validación no aplica.
   2. **Validación de grupos:** si un grupo tiene total mayor que $0 y todos sus pesos son 0, la emisión se bloquea con el mensaje: "El grupo <cuenta> / <base> no tiene unidades con participación para repartir $<total>".
   3. **Transacción única.** En una sola transacción y **en este orden** (H-9):
      1. Se fijan la fecha de emisión y la de vencimiento. La fecha de emisión la fija el servidor (fecha actual en hora de Chile); el cliente no la envía.
      2. Se guarda la foto de participaciones.
      3. Se calculan los cargos (secciones B, C y D) y, si el flag está activo, los intereses (sección E).
      4. Se verifica que cada grupo cuadre con su total.
      5. Se asigna el ámbito de cada cargo (regla F-9). Los intereses toman el ámbito de su capital (E-6).
      6. Se crean los cargos y sus débitos, ya con su ámbito.
      7. Se imputan los saldos a favor existentes, ámbito por ámbito (regla F-6).
      8. Se crea el borrador M+1.

      Si algo falla, no queda nada escrito.
   4. **Idempotencia:** la petición de emisión lleva una clave de idempotencia (`Idempotency-Key`). Si llega una petición repetida con la misma clave (por ejemplo, un doble clic), se devuelve el mismo resultado y no se crean cargos nuevos. Si llega otra petición distinta sobre un periodo ya emitido, la respuesta es 409 `PERIOD_ALREADY_ISSUED` con el mensaje "El periodo ya fue emitido".
      - **Alcance de la clave (H-18; Supuesto (a validar), S-36):** la clave es única por persona, endpoint y clave, y en las rutas de comunidad queda ligada a esa comunidad (`docs/arquitectura.md` §4, `IDEMPOTENCY_KEY`). Se conserva 30 días, como fija la arquitectura. Esto vale para toda escritura de dinero de esta spec: emisión, corrección y anulación de gastos, registro y anulación de pagos manuales, inicio de Webpay y resoluciones de plataforma.
      - **Misma clave con otro cuerpo** (por ejemplo, otro periodo u otro monto): 422 `IDEMPOTENCY_KEY_REUSED` con el mensaje "Esta operación ya se envió con otros datos. Vuelve a abrir el formulario". No se escribe nada.
   5. **Inmutabilidad:** desde la emisión, los gastos y cargos del periodo no cambian.
   6. **Vista previa confirmada:** la petición de emisión lleva el `previewHash` de la vista previa que el administrador confirmó. Si el resultado cambió, la emisión se rechaza con 409 `PREVIEW_OUTDATED` (regla A-7).
   7. **Notificación:** al terminar la emisión se envía automáticamente la notificación del aviso (regla G-6).
   8. **Comunidad sin unidades (H-5):** la emisión y su vista previa responden 422 `COMMUNITY_WITHOUT_UNITS` con "La comunidad no tiene unidades. Crea las unidades antes de emitir".
4. **Regla única de movimientos posteriores (S-17):** todo pago, anulación, nota de crédito, ajuste o reverso se registra en el **borrador vigente** al momento de registrarlo. Esto incluye los pagos con fecha de un mes cuyo periodo ya se emitió o cerró, los pagos con fecha de un mes que aún no tiene periodo y las confirmaciones Webpay que llegan después de un cierre.
   - Cada movimiento conserva `paid_on` (fecha real del pago) y `recorded_at` (fecha y hora de registro).
   - Un periodo emitido o cerrado no recibe movimientos nuevos. Una escritura dirigida a un periodo emitido o cerrado responde 409 `PERIOD_NOT_EDITABLE` con "El periodo <AAAA-MM> está <emitido|cerrado>. Registra el movimiento en el borrador vigente" (H-5).
5. **Cierre** (`period.close`, solo administrador; S-1):
   1. Requisito: el periodo está emitido. Cerrar un periodo en borrador responde 409 `PERIOD_NOT_ISSUED` con "Solo se puede cerrar un periodo emitido"; cerrar uno ya cerrado responde 409 `PERIOD_ALREADY_CLOSED` con "El periodo ya está cerrado" (H-5). Un reintento con la misma clave de idempotencia devuelve el resultado original.
   2. El cierre no hace verificaciones de conciliación, porque la conciliación queda fuera del alcance de esta spec. Nota: la advertencia de pagos sin conciliar se agregará cuando exista la spec de conciliación.
   3. Al cerrar se guarda una foto de saldos por unidad, ámbito y cuenta, verificable contra el libro.
      - La foto considera solo las imputaciones con `recorded_at` ≤ momento del cierre.
      - Las reimputaciones posteriores no la cambian.
   4. Un periodo cerrado es inmutable y rechaza cualquier movimiento con su identificador (regla 6 de `CLAUDE.md`).
6. **Calendario (S-2):** se cobra "mes vencido": los gastos del mes M se emiten a comienzos de M+1. El sistema no fuerza la fecha de emisión.
7. **Confirmación contra la vista previa (M8).** Las acciones que se confirman después de ver una vista previa se ejecutan solo si **lo que se va a escribir** es igual a lo que mostró la vista previa. La vista previa no persiste nada y devuelve un `previewHash` (huella del resultado: cada movimiento a crear con unidad, ámbito, cuenta, tipo, monto y vencimiento, los totales, las reimputaciones y los ajustes de intereses derivados). La ejecución envía ese `previewHash`; si el resultado recalculado ya no coincide, la API responde 409 `PREVIEW_OUTDATED`, no escribe nada y el usuario debe pedir una vista previa nueva. El cálculo del hash lo define `docs/arquitectura.md` §4.

   | Acción | Ejemplos de cambios que producen 409 `PREVIEW_OUTDATED` | Mensaje |
   | --- | --- | --- |
   | Emisión (`period.issue`) | Otro administrador edita gastos o cargos directos del borrador; cambian unidades, `aliquot_e6`, `sort_order`, conjuntos, porcentaje del fondo, plazo, tasa o el flag; cambia una ocupación o un propietario; cambia la fecha de emisión (cambio de día en hora de Chile); con el flag activo, un pago que cambia el capital y por lo tanto los intereses; un pago que cambia la imputación de saldos a favor al emitir | "El borrador cambió desde la vista previa. Revisa la nueva vista previa antes de emitir" |
   | Anulación de un pago manual (`payment.void`) | El pago ya fue anulado, o hay movimientos o imputaciones nuevos en los ámbitos del grupo de pagos | "El pago ya fue anulado" si ya estaba anulado; si no, "La cuenta de la unidad cambió desde la vista previa. Revisa la nueva vista previa antes de anular" |
   | Corrección o anulación de un gasto (`adjustment.create`, reglas H-2 y H-6) | Otra corrección o anulación del mismo gasto o de su grupo, o movimientos nuevos en los ámbitos afectados | "El gasto cambió desde la vista previa. Revisa la nueva vista previa antes de confirmar" |
   | Resolución de un intento Webpay en revisión (regla F-16) | Otro miembro de Soporte ya lo resolvió, o cambió el ámbito o la deuda que se imputaría | "El intento cambió desde la vista previa. Revisa la nueva vista previa antes de resolver" |

   - Un cambio que no altera el resultado no produce 409. Con el flag apagado, un pago que solo cambia el saldo anterior o el total a pagar de un aviso, sin cambiar los movimientos que crea la emisión, no invalida la vista previa.
   - Un reintento con la misma clave de idempotencia de una acción ya ejecutada devuelve el resultado original, aunque el `previewHash` ya no coincida (regla A-3.4). Una clave nueva con un `previewHash` viejo responde 409.
   - La anulación de pagos tiene su propia vista previa: el reverso de cada pago del grupo, los cargos que vuelven a quedar pendientes, las reimputaciones y los ajustes de intereses (regla E-10), por unidad y ámbito, sin persistir nada.

### B. Tipos de gasto y cargos

1. **Gastos comunes ordinarios** (Ley 21.442, art. 2 N° 9). Van a la cuenta `ordinario` con una de estas subcategorías:
   - **Administración:** remuneraciones y honorarios del personal, del administrador y del conserje, más leyes sociales.
   - **Mantención:** ascensores, aseo, luminarias, seguros, equipos de emergencia.
   - **Reparación:** desperfectos o reemplazo de piezas de bienes comunes.
   - **Uso o consumo:** agua, gas, electricidad y telecomunicaciones de uso común.
2. **Gastos comunes extraordinarios** (Ley 21.442, art. 2 N° 10): todo gasto distinto de los ordinarios, incluidas las obras nuevas. Van a la cuenta `extraordinario` y no generan recargo de fondo (S-4).
3. **Egresos pagados con el fondo de reserva:**
   - Se registran como egreso del fondo, con una referencia de texto libre a la autorización.
   - No se reparten entre las unidades.
   - El aviso los muestra como egresos del fondo.
4. **Cargos directos** (base `monto_directo`):
   - **Consumo individual** (por ejemplo, agua por remarcador): cuenta `ordinario`, subcategoría uso o consumo. El administrador ingresa el monto de cada unidad, calculado fuera de ComVive.
   - **Multa:** cuenta `multas`, con motivo y referencia al reglamento o al acuerdo que la respalda. En el MVP las multas son siempre manuales (S-8).
   - **Otros:** cuenta `ordinario` o `extraordinario`, a elección del administrador.
5. **Montos:** todo monto ingresado es un entero CLP mayor que 0. Un monto 0, negativo o con decimales se rechaza con 422 `INVALID_AMOUNT` y el mensaje "El monto debe ser un número entero de pesos mayor que $0" (H-5). Las rebajas se hacen como notas de crédito (sección H).
   - **Excepción explícita (M6):** la acción "Anular gasto" (regla H-6) usa $0 como monto correcto de un gasto de un periodo emitido o cerrado. Es el único caso en que se acepta $0, y solo como monto correcto de esa acción. Un gasto nuevo, un cargo directo nuevo o una corrección común con $0 se siguen rechazando.
6. **Monto máximo y aritmética (H-11; Supuesto (a validar), S-37):**
   - Ningún monto ingresado (gasto, cargo directo, pago o saldo de caja) puede superar **$9.999.999.999** (diez mil millones menos un peso). Tampoco la suma de los gastos de un periodo. Si se supera, la respuesta es 422 `AMOUNT_TOO_LARGE` con "El monto supera el máximo permitido de $9.999.999.999".
   - El tope es una protección contra errores de digitación y desbordes, no una regla legal. Supera con holgura el gasto anual de un condominio grande.
   - **Aritmética:** el motor calcula todo con enteros `bigint` de punta a punta (`docs/arquitectura.md` §1 y §4; ADR 0004). Nunca usa `number` de JavaScript para productos intermedios: `T × aliquot_e6` supera 2^53 − 1 desde T > $9.007.199.254, y la suma del interés (capital × tasa × 366 × días) también puede superarlo. Ese límite no fija el tope; el tope de arriba es independiente.

### C. Prorrateo y redondeo

1. **Agrupación:** los gastos del periodo se agrupan por la clave (cuenta, base de pesos). Cada grupo se suma y su total se reparte **una sola vez**. Nunca se reparte gasto por gasto.
2. **Pesos por base:**
   - `alicuota`: el peso de cada unidad es su `aliquot_e6`. Es la base por defecto, porque cada unidad contribuye en proporción a su derecho en los bienes comunes, salvo que el reglamento diga otra cosa (Ley 21.442, art. 6).
   - `partes_iguales`: peso 1 para cada unidad del conjunto y 0 para las demás.
   - `monto_directo`: no se reparte. El cargo es el monto ingresado.
3. **Método del resto mayor** (`docs/qa/comunidades-simuladas.md`), con enteros:
   - `W` = suma de los pesos y `T` = total del grupo.
   - Parte entera de la unidad u: `(T × w_u) div W`. Resto: `(T × w_u) mod W`.
   - Los `T − Σ partes enteras` pesos que faltan se asignan de a uno a los mayores restos.
   - **Desempate:** en un empate de restos gana el menor `sort_order` (S-3).
4. **`sort_order`:**
   - Es un entero único por comunidad.
   - Al crear las unidades, el sistema propone un valor inicial en orden natural del código ("Depto 9" antes que "Depto 10") y el administrador lo puede cambiar.
   - El desempate nunca usa el código como texto.
5. **Cargos de $0:** una unidad con peso 0, o cuya parte resulte $0, no genera cargo ni movimiento en el libro. En el aviso aparece con $0.
6. **Redondeo por cuenta:** cada grupo cuadra por sí solo. El total de una unidad puede diferir en ±1 peso del que resultaría de repartir la suma de todas las cuentas de una vez. Es intencional: el fondo se mantiene y se rinde por separado (Ley 21.442, art. 39). El ejemplo es la Comunidad C emitida por cuenta: CA-3 y la prueba de oro **GOLD-CE** (aprobada por el líder del proyecto el 2026-11-07, `docs/qa/comunidades-simuladas.md`), donde los Deptos 21 y 31 difieren en ±1 peso del reparto en un solo monto (prueba de oro C). La Comunidad D ya no sirve de ejemplo: con el techo del fondo (S-6), repartir $920.371 de una vez da los mismos cargos que por cuenta (H-10).

### D. Fondo común de reserva

1. **Destino:** gastos urgentes, extraordinarios o imprevistos, incluidas las indemnizaciones del personal (Ley 21.442, art. 2 N° 11 y art. 39).
2. **Porcentaje:** recargo sobre los gastos comunes ordinarios, fijado por el reglamento o la asamblea, nunca inferior a 5 % (Ley 21.442, art. 8 letra d y art. 39; S-5).
   - Se configura por comunidad en puntos base (500 = 5,00 %).
   - El sistema rechaza valores bajo 500 con 422 `RESERVE_RATE_BELOW_MINIMUM` y el mensaje "El fondo de reserva no puede ser menor que 5,00 % (Ley 21.442, art. 39)" (H-5).
   - **Máximo (H-17; Supuesto (a validar), S-38):** el sistema rechaza valores sobre 5000 pb (50,00 %) con 422 `RESERVE_RATE_ABOVE_MAXIMUM` y el mensaje "El fondo de reserva no puede superar 50,00 %. Si el reglamento fija más, contacta a soporte". La ley no fija un máximo; el tope es una protección contra errores de digitación (por ejemplo, 5000 en vez de 500) y está en P-28.
3. **Un fondo por cada grupo ordinario (S-4):**
   - Por cada grupo `ordinario` con base `alicuota` o `partes_iguales` y total `O_g`, se forma un grupo `fondo_reserva` con la misma base de pesos.
   - Su total es `F_g = (O_g × pb + 9.999) div 10.000`, es decir, redondeado hacia arriba al peso (techo; S-6). Así el fondo nunca queda bajo el porcentaje mínimo.
   - **Grupos pequeños (H-16):** el techo nunca agrega más de $1 por grupo, pero en un grupo muy chico ese peso pesa mucho (O = $1 da F = $1, el 100 %; O = $19 da F = $1, el 5,26 %). Se acepta como está: la diferencia máxima es $1 por grupo y periodo y nunca deja el fondo bajo el mínimo legal. Si el contador prefiere aplicar el techo sobre el total ordinario del periodo, queda en P-29.
   - `F_g` se reparte con el método del resto mayor y los mismos pesos de su grupo ordinario.
   - Los cargos directos ordinarios, los extraordinarios, los intereses, las multas y los egresos del fondo no generan recargo.
4. **Otros ingresos del fondo:** lo recaudado por multas e intereses va al fondo (Ley 21.442, art. 39). El reporte del fondo suma como ingreso lo imputado a cargos de las cuentas `intereses` y `multas`.
5. **Saldo del fondo:** recargos imputados + intereses imputados + multas imputadas − egresos del fondo. Se muestra en el aviso. ComVive no administra inversiones.

### E. Vencimiento, intereses y multas

**Feature flag:** los intereses (reglas E-3 a E-8 y E-10) quedan detrás del flag `billing.interest`, desactivado por defecto. Son una rebanada posterior dentro del MVP. Con el flag apagado, la emisión no calcula intereses.

1. **Vencimiento:** el plazo de pago es de 10 días desde el aviso de cobro, salvo que el reglamento fije otro (Ley 21.442, art. 7).
   - El plazo es configurable. Por defecto son 10 días corridos (S-7).
   - `fecha_vencimiento = fecha_emisión + plazo`. No se corre si cae en día inhábil.
   - **Supuesto (a validar), S-29:** la fecha del aviso de cobro es la fecha de emisión, porque la notificación se envía automáticamente al emitir (regla G-6). Si la notificación de una unidad falla, su vencimiento no cambia; el administrador ve la alerta "Avisos sin notificar". Si el plazo legal corre desde la notificación efectiva y no desde la emisión queda en P-18.
   - Desde el día siguiente al vencimiento, el capital impago de los cargos de ese aviso está en mora.
2. **Multas:** son obligaciones económicas (Ley 21.442, art. 2 N° 8) que regula el reglamento (art. 8 letra e). En el MVP solo existen como cargo directo manual (regla B-4).
3. **Tasa del reglamento:** la mora devenga el interés que fije el reglamento o, en su defecto, el reglamento tipo, y ese interés no puede superar el 50 % del interés corriente bancario (Ley 21.442, art. 7).
   - La comunidad configura la tasa como **tasa anual** en puntos base.
   - Si el reglamento la expresa mensual, se convierte multiplicando por 12 (S-10).
   - Ejemplo: 1,00 % mensual = 1200 pb anuales.
   - **Versiones:** la tasa del reglamento se guarda con fecha de inicio de vigencia. Cada cambio crea una versión nueva y nunca edita las anteriores. `tasa_reglamento_d` es la versión vigente el día d.
   - El flag no se puede activar en una comunidad sin una tasa del reglamento vigente a la fecha de activación. El mensaje es: "Configura la tasa de interés del reglamento antes de activar los intereses".
4. **Tasa de referencia CMF (S-11):**
   - Es un dato **global**, no de cada comunidad, igual que `UF_VALUE`.
   - Cada registro tiene fecha de inicio de vigencia, categoría de operación, tasa anual en puntos base y fuente (certificado CMF en el Diario Oficial).
   - Lo carga el equipo de ComVive, no el administrador.
   - **Categoría por defecto (S-21):** interés corriente para operaciones no reajustables en moneda nacional de menos de 90 días. P-5 sigue abierta para validarla.
   - Tope diario: `tope_d = (tasa_corriente_vigente_el_día_d × 50) div 100`, en pb anuales.
5. **Base del interés (S-9):**
   - Devenga interés solo el capital: la parte impaga de los cargos vencidos de las cuentas `ordinario`, `fondo_reserva` y `extraordinario`.
   - Los intereses y las multas no devengan interés.
   - El capital de cada día se mide al cierre del día, según la fecha efectiva de las imputaciones (regla F-11).
6. **Cálculo (S-10):** interés simple diario con base actual/actual, es decir, con los días del año calendario de cada día (365 o 366). Se calcula al emitir, **una vez por cada ámbito** de la unidad que tenga capital en mora en la ventana.

   ```text
   interés_ámbito = piso( Σ_d capital_ámbito_d × min(tasa_reglamento_d, tope_d) × k_d / (10.000 × 133.590) )
   ```

   - `k_d = 366` si el año de d tiene 365 días, y `k_d = 365` si tiene 366. El número 133.590 es 365 × 366. Con esto, cada día pesa `1 / días_del_año(d)` y el cálculo es entero y exacto.
   - En un año de 365 días, la fórmula equivale a `piso( Σ_d capital_d × tasa_d / 3.650.000 )`.
   - `d` recorre los días desde el inicio de la ventana de intereses hasta el día anterior a la fecha de emisión, ambos incluidos.
   - La ventana empieza el día siguiente al último día ya cobrado. Si nunca se ha cobrado, empieza el día siguiente al vencimiento o en la fecha de activación del flag, lo que sea posterior (S-20).
   - El resultado se trunca al peso, a favor del deudor.
   - Si el resultado es mayor que $0, se crea un cargo de cuenta `intereses`, con el ámbito del capital que lo generó, en el periodo que se emite.
   - **Avance de la ventana (H-4):** en cada emisión con el flag activo y con tasa CMF disponible para todos los días, la ventana de **cada** ámbito de la unidad avanza hasta el día anterior a la fecha de emisión, aunque ese ámbito no haya tenido capital en mora o el interés haya resultado $0. Esos días quedan cobrados (con $0). La única excepción es E-7: si falta la tasa CMF, la ventana no avanza.
7. **Días sin tope:** si al emitir falta la tasa CMF de algún día de la ventana, el sistema advierte: "Falta la tasa de referencia CMF desde <dd-mm-aaaa>. Se emitirá sin intereses y se cobrarán en la próxima emisión" (fecha en formato dd-mm-aaaa, como en F-3 y G-6; H-15). La emisión sigue sin intereses y lo deja en auditoría. **Los días no se pierden:** la ventana no avanza y esos días se cobran en el siguiente cálculo con tope disponible.
8. **Aviso al pagar:** si el flag está activo y la unidad tiene deuda vencida, la pantalla de pago muestra: "Tu deuda está vencida. Se pueden generar intereses hasta la fecha de tu pago, que se cobrarán en el próximo aviso".
9. **Suspensión de servicios:** la ley la permite con 3 o más cuotas impagas (Ley 21.442, art. 36). El MVP no suspende servicios; solo muestra el número de cuotas impagas (regla F-8).
10. **Recálculo de días ya cobrados (S-22).** Aplica cuando un evento cambia el capital de días ya cobrados. Los eventos son:
    - Un crédito con fecha efectiva dentro de esos días: pago manual tardío, confirmación Webpay tardía, nota de crédito o reimputación.
    - La anulación de un pago.

    En ese caso, al registrar el evento el sistema recalcula, con la fórmula E-6, el interés de cada cargo de intereses afectado del ámbito, sobre su misma ventana y con el capital corregido. La diferencia se registra con la fórmula H-2 (`correcto − (original + ajustes previos)`):
    - Si la diferencia es negativa, es una **nota de crédito** en la cuenta `intereses`.
    - Si es positiva, es un **débito de ajuste** en la cuenta `intereses`.

    Ambos se registran en el borrador vigente, con `adjusts_entry_id` apuntando al cargo de intereses original y con su ámbito. Así P-12 queda resuelta: los intereses se corrigen hacia atrás en ambos sentidos.

    **Tramos sin cargo original (H-4):** si el interés original de un tramo ya cobrado fue $0 (no se creó cargo, por ejemplo porque el ámbito no tenía capital en mora o un pago lo había saldado) y el recálculo da más de $0 (por ejemplo, al anular ese pago), se crea un **cargo de intereses nuevo** sin `adjusts_entry_id`. El cargo:
    - Va en el borrador vigente y en el ámbito del capital.
    - Lleva como referencia las fechas de inicio y fin del tramo recalculado.
    - Vence con el aviso de ese borrador, como un débito de ajuste (regla H-5).

    Si el recálculo de un tramo sin cargo da $0, no se registra nada. Un recálculo nunca puede dar menos de $0.
11. **Capital traspasado (S-26).** Al terminar una ocupación, sus débitos pendientes pasan al ámbito `owner` (reglas F-9 y F-13):
    - Cada débito de traspaso conserva la cuenta, el periodo y la fecha de vencimiento del débito original. Para el orden de imputación (F-5) cuenta como deuda de ese periodo.
    - **Ventana del capital traspasado (H-3):** el interés del capital traspasado se cobra en el ámbito `owner`, pero con **la ventana de la ocupación**: desde el día siguiente al último día cobrado en el ámbito de la ocupación hasta el día anterior a la emisión, incluidos los días en mora anteriores al traspaso que aún no se cobraban. El capital propio del ámbito `owner` sigue con su propia ventana. En la emisión siguiente, el interés del ámbito `owner` es:

      ```text
      interés_owner = piso( [Σ_d∈ventana_owner capital_propio_d × tasa_d × k_d
                            + Σ_d∈ventana_ocupación capital_traspasado_d × tasa_d × k_d] / (10.000 × 133.590) )
      ```

      con `tasa_d = min(tasa_reglamento_d, tope_d)` y `k_d` como en E-6. Así ningún día se cobra dos veces y ninguno se pierde, aunque las ventanas de los dos ámbitos difieran. Normalmente coinciden, porque ambos ámbitos se cobran en las mismas emisiones y la tasa CMF faltante (E-7) afecta a toda la comunidad.
    - Desde esa emisión, el capital traspasado se mide con la ventana del ámbito `owner`.
    - Los cargos de intereses ya emitidos en el ámbito de la ocupación no se recalculan con créditos registrados después del traspaso en el ámbito `owner` (limitación aceptada, P-26).

### F. Pagos, imputación y saldos

1. **Registro de pagos:**
   - Por Webpay (`origin = webpay`): se registra automáticamente al confirmarse. `paid_on` es la fecha de confirmación de Transbank.
   - Manual (`origin = manual`): lo registra el administrador. Medios: transferencia, depósito, efectivo, cheque u otro.
   - Por importación (`origin = import`): reservado para las specs de conciliación y migración.
   - Todo pago (`PAYMENT`) tiene unidad, **un solo ámbito**, origen, monto CLP entero > 0, `paid_on`, `recorded_at`, medio y referencia. Un `paid_on` posterior a la fecha actual (hora de Chile) se rechaza con 422 `PAID_ON_IN_FUTURE` y el mensaje "La fecha de pago no puede ser futura".
   - El libro registra un crédito en la cuenta `pago`, en el ámbito del pago. El reparto por cuenta sale de las imputaciones.
   - **Grupo de pagos:** cuando un mismo cobro cubre dos ámbitos se registra **un pago por ámbito**, y esos pagos quedan agrupados (regla F-12):
     - En Webpay, el grupo es el intento (`WEBPAY_ATTEMPT`, con un `WEBPAY_ATTEMPT_SCOPE` por ámbito).
     - En el pago manual "Ambos", el grupo es el registro, identificado por su clave de idempotencia.
2. **Idempotencia (M5):** depende del origen del pago.
   - **Webpay e importaciones:** la combinación (`origin`, `external_ref`, ámbito) es única por comunidad (`docs/arquitectura.md` §4). En Webpay, `external_ref` es el número de orden (`buy_order`) de Transbank. Como los dos pagos de un intento de dos ámbitos comparten `buy_order` pero no ámbito, no chocan. En una importación, `external_ref` es la referencia del movimiento importado (la definirán las specs de conciliación y migración). Un reintento o una reimportación devuelve los pagos existentes y no crea otros.
   - **Pago manual:** la idempotencia es la **clave de idempotencia del envío** (`Idempotency-Key`), que el formulario genera al abrirse. Un envío repetido con la misma clave (doble clic, reintento por red) devuelve el mismo pago o el mismo grupo de pagos. La referencia que escribe el administrador (número de comprobante, "transferencia", etc.) **no es única**: dos pagos manuales con la misma referencia son dos pagos distintos. La referencia solo alimenta la advertencia de la regla F-3.
3. **Posible duplicado manual (solo advertencia):** el formulario advierte en dos casos, y en ninguno bloquea el registro:
   - Si ya existe un pago con la misma unidad, monto, fecha y medio: "Ya existe un pago de $<monto> para <unidad> con fecha <dd-mm-aaaa> por <medio>. Revisa que no sea un duplicado".
   - Si ya existe en la comunidad un pago con la misma referencia (sin distinguir mayúsculas ni espacios), el mismo medio y el mismo monto: "Ya existe un pago de $<monto> por <medio> con la referencia "<referencia>" (<unidad>, <dd-mm-aaaa>). Revisa que no sea un duplicado".
4. **Anulación:**
   - Un pago no se borra ni se edita. Se anula con un débito de reverso en la cuenta `pago`, que apunta al pago y lleva motivo.
   - El reverso se registra en el borrador vigente (regla A-4) y deshace las imputaciones del pago.
   - Si el pago pertenece a un grupo (regla F-12), la anulación anula **todos los pagos del grupo juntos**, cada uno con su reverso en su ámbito, en una sola transacción. No se anula un solo pago de un grupo.
   - Solo el administrador anula pagos, solo los de `origin = manual`, y se confirma contra el `previewHash` de su vista previa (regla A-7). Un pago de otro origen responde 422 `PAYMENT_NOT_VOIDABLE` con "Este pago no se puede anular desde ComVive".
   - La anulación de pagos Webpay registrados queda fuera de alcance. Marcar un intento en revisión para reverso (regla F-16) no es una anulación: ese intento nunca se registró como pago.
5. **Orden de imputación (S-12).** ComVive imputa como lo haría el acreedor en la carta de pago (Código Civil, art. 1596). En el MVP el pagador no elige a qué deuda se aplica su pago. El orden es:
   1. Intereses vencidos, del más antiguo al más reciente.
   2. Capital vencido, del periodo más antiguo al más reciente. Dentro de un periodo: `ordinario` → `fondo_reserva` → `extraordinario`.
   3. Multas vencidas, de la más antigua a la más reciente.
   4. Lo no vencido, con el mismo orden: intereses, capital y multas.
   5. El remanente queda como saldo a favor.

   **Cuándo un débito está "vencido" (H-1; Supuesto (a validar), S-39):**
   - Se evalúa en una fecha de referencia: `fecha_referencia = máx(paid_on del crédito, fecha de creación del débito)`.
   - Un débito está vencido si su fecha de vencimiento es anterior a la fecha de referencia.
   - No se usa `recorded_at` del pago. Así, un pago registrado tarde se imputa igual que si se hubiera registrado el día en que se pagó, y el resultado no depende de cuándo lo digitó el administrador.
   - En una reimputación, el `paid_on` es el del crédito original (F-6), así que la clasificación no cambia por reimputar más tarde.
   - Para una nota de crédito, el `paid_on` es el de la regla F-11.
   - Un débito creado después del `paid_on` se clasifica a su fecha de creación. Por ejemplo, un saldo a favor que se aplica a un cargo recién emitido lo encuentra no vencido; un débito de traspaso que conserva un vencimiento pasado lo encuentra vencido.

   **Orden total y determinista (H-7).** Dentro de cada paso, los débitos se ordenan por esta clave, de izquierda a derecha:
   1. Periodo del débito (para un traspaso, el del débito original; regla E-11), del más antiguo al más reciente.
   2. Cuenta, en el orden `ordinario` → `fondo_reserva` → `extraordinario` (solo en el paso de capital).
   3. Fecha de vencimiento, de la más antigua a la más reciente.
   4. Tipo, en este orden: cargo prorrateado → cargo directo → débito de traspaso → débito de ajuste o de intereses por recálculo.
   5. `recorded_at` del débito.
   6. Identificador del movimiento, como último desempate.

   Con la misma entrada, la imputación siempre da el mismo resultado.
6. **Invariante (S-18):** dentro de un mismo ámbito de imputación, nunca coexisten deuda pendiente y saldo a favor. Por eso se reimputa en cada uno de estos eventos:
   - **Crédito nuevo (pago):** se imputa con el orden de F-5 y el remanente queda a favor.
   - **Nota de crédito:** se imputa primero al cargo que ajusta. Si ese cargo ya estaba pagado, la parte liberada del pago se reimputa con el orden de F-5, conservando el `paid_on` original del pago.
   - **Reverso de un pago:** sus cargos vuelven a quedar pendientes y los saldos a favor del ámbito se aplican a ellos, del crédito más antiguo al más reciente.
   - **Débito nuevo (emisión o ajuste de débito):** los saldos a favor del ámbito se aplican a todos los débitos pendientes del ámbito, incluido el nuevo, con el orden de F-5.

   Las imputaciones no son movimientos del libro: no cambian el saldo total, solo su reparto. Cada cambio queda registrado y auditado.
7. **Saldos:** siempre se calculan desde el libro (regla 5 de `CLAUDE.md`).
   - Saldo por cuenta = cargos de la cuenta − notas de crédito de la cuenta − imputaciones de pagos a la cuenta.
   - Ningún saldo es editable.
8. **Cuotas impagas:** cantidad de periodos emitidos y vencidos con capital pendiente. Se muestra por unidad.
9. **Responsable y ámbito (S-14, S-19):**
   - **Deuda y aviso legal:** la deuda es de la unidad y sigue al dueño, incluidas las deudas anteriores a su adquisición (Ley 21.442, art. 6). El aviso legal se dirige al propietario registrado a la fecha de emisión.
   - **Ámbito de cada débito.** Se asigna al crearlo y es fijo:
     - **Cargos del periodo:** van al ámbito del ocupante responsable a la fecha de emisión. Si hay un arrendatario con ocupación vigente ese día, el ámbito es `occupancy` con el `occupancy_id` de esa ocupación; si no, es `owner`.
     - **Intereses:** van al ámbito del capital que los genera (regla E-6).
     - **Ajustes y notas de crédito:** van al ámbito del movimiento al que apuntan (`adjusts_entry_id`).
     - **Cargo nuevo por reclasificación** (regla H-3): va al ámbito de los cargos originales de la unidad en ese periodo.
   - **Ámbito de los créditos (decisión del líder del proyecto, 2026-11-07; regla F-12):**
     - Los pagos del arrendatario van solo a su ámbito.
     - Los pagos del propietario van al ámbito que él elige: `owner`, el del arrendatario vigente o ambos.
     - En un pago manual, el administrador elige el ámbito de forma explícita: "Aplicar a la deuda de: Propietario / Arrendatario {nombre} / Ambos". Si la unidad no tiene arrendatario vigente, el único ámbito es `owner` y no se pregunta. Si tiene arrendatario vigente, no hay valor por defecto y sin elección el registro se rechaza con "Elige a qué deuda aplicar el pago". Con "Ambos", el administrador ingresa el monto de cada ámbito.
     - Un pago manual nuevo o un intento Webpay nuevo solo se puede dirigir al ámbito `owner` o al de una ocupación vigente, nunca a una ocupación terminada. La confirmación de un intento iniciado antes del término sigue la regla F-13.
     - Cada crédito se imputa solo a débitos de su ámbito, y su remanente queda a favor en ese mismo ámbito.
   - **Visibilidad:**
     - El arrendatario ve solo su ámbito. Su vista del aviso muestra como saldo anterior solo el de su ámbito (regla G-7).
     - El propietario ve cada ámbito de su unidad por separado: "Tu deuda" (ámbito `owner`) y "Deuda del arrendatario {nombre}" (ámbito de la ocupación vigente), cada uno con su deuda bruta y su saldo a favor. Nunca se le muestra como "Total a pagar" un saldo neto que compense ámbitos (M1). El total a pagar de cada opción de pago es el de la regla F-12.
     - El administrador y el comité ven por unidad la deuda bruta y el saldo a favor de cada ámbito, no un saldo neto.
   - **Aviso legal:** muestra, por cada ámbito, la deuda bruta y el saldo a favor, **sin compensarlos entre ámbitos**, y además el total de la unidad.
     - **Total de la unidad (H-8):** es la **suma de las deudas brutas** de los ámbitos, rotulada "Total adeudado de la unidad". El saldo a favor de un ámbito no la rebaja. La suma de los saldos a favor va en una línea aparte, "Saldo a favor (no compensado)".
     - Ejemplo: `occupancy` O-1 con $37.500 a favor y `owner` con $262.500 de deuda. El total adeudado de la unidad es $262.500, no $225.000, y el saldo a favor no compensado es $37.500 (CA-49).
     - El saldo contable neto de la unidad (Σ débitos − Σ créditos = $225.000) no se muestra en el aviso.
   - **Fin de la ocupación:** al terminar la ocupación de un arrendatario, la deuda y el saldo a favor de su ámbito pasan al ámbito `owner`. El traspaso queda registrado en auditoría y se reimputa según la regla F-6.
10. **Saldos de apertura (reservado):**
    - Se reserva el tipo de movimiento apertura, con código `opening`: un débito o crédito por unidad, ámbito y cuenta, con referencia de origen (sistema anterior, documento, fecha de corte).
    - Su carga, validación y conciliación se definen en una especificación propia de migración, que aún no existe.
11. **Fecha efectiva de imputación (S-23):** toda imputación o reimputación tiene una fecha efectiva:

    ```text
    fecha_efectiva = máx(paid_on del crédito, fecha de vencimiento del cargo imputado)
    ```

    - Para una nota de crédito, `paid_on` es la fecha de vencimiento del cargo que ajusta.
    - El capital de un cargo deja de contar para el interés desde el cierre del día de la fecha efectiva (regla E-5).
12. **Pago en línea por ámbito (decisiones del líder del proyecto, 2026-11-07; S-24, S-25).**
    - **Disponibilidad (decisión del líder, 2026-11-07):** cada comunidad tiene su propio código de comercio Transbank, y el abono de Transbank llega directo a la cuenta bancaria de la comunidad (ComVive no recauda fondos de terceros). Mientras una comunidad no tenga su código de comercio, opera solo con pagos manuales: la app no ofrece pagar en línea y muestra "Esta comunidad aún no recibe pagos en línea. Paga por transferencia con los datos de tu aviso". Si se intenta iniciar un pago por la API, la respuesta es 422 `ONLINE_PAYMENT_NOT_AVAILABLE`.
    - **Opciones de pago (`payment.pay_online`):**

      | Quién paga | Puede elegir |
      | --- | --- |
      | Propietario | "Mi deuda" (ámbito `owner`), "Deuda del arrendatario" (ámbito de la ocupación vigente) o "Ambas" |
      | Arrendatario | Solo su ámbito. Un intento sobre otro ámbito responde 404 |

    - Solo se ofrecen los ámbitos con deuda mayor que $0. "Ambas" se ofrece solo si los dos ámbitos tienen deuda. Un ámbito sin deuda pedido por la API responde 422 `SCOPE_WITHOUT_DEBT`.
    - **Monto:** la app no envía montos por ámbito. Al iniciar, la API calcula la deuda de cada ámbito elegido (vencida y no vencida); ese es el monto de cada `WEBPAY_ATTEMPT_SCOPE`, y el monto del intento es su suma. El reparto queda fijo en el intento. Si la suma no coincide con la que vio el residente, la respuesta es 409 `AMOUNT_CHANGED` con los montos nuevos.
    - **Un pago por ámbito (modelo de `docs/arquitectura.md` §4, ADR 0007):**
      - Un intento que cubre dos ámbitos es **una sola transacción Webpay**: un `WEBPAY_ATTEMPT`, un `buy_order`, un cobro con tarjeta y un abono en la cartola.
      - Tiene un `WEBPAY_ATTEMPT_SCOPE` por ámbito.
      - Al confirmarse, en una sola transacción se crea **un `PAYMENT` por ámbito**. Cada uno lleva `origin = webpay`, el mismo `buy_order` como `external_ref`, el mismo `paid_on` y el monto de su ámbito, y queda agrupado por el intento.
      - Cada pago genera su crédito en su ámbito, se imputa allí con el orden de F-5 y su remanente queda a favor en ese ámbito.
      - Si la deuda de un ámbito bajó entre el inicio y la confirmación, la diferencia queda como saldo a favor de ese ámbito; nunca se pasa al otro.
    - **Bloqueo por (unidad, ámbito) (M3):** un intento en curso (`initiated`) bloquea nuevos intentos solo en los ámbitos que cubre. Mientras el propietario paga su ámbito `owner`, el arrendatario puede pagar el suyo. Si hay un intento en curso sobre la deuda del arrendatario, nadie puede iniciar otro sobre ese ámbito y el propietario no puede elegir "Ambas". El mensaje es "Hay un pago en proceso para esta deuda" (409 `PAYMENT_IN_PROGRESS`), sin decir quién paga.
    - **Lo que ve el arrendatario cuando otro paga su ámbito (decisión del líder del proyecto, 2026-11-07; S-25):**
      - Ve el pago de su ámbito con su monto, fecha y medio, y con la etiqueta de quién pagó:

        | Quién pagó | Etiqueta |
        | --- | --- |
        | El propio arrendatario | "Pagado por ti" |
        | El propietario | "Pagado por el propietario" |
        | Pago manual del administrador | "Registrado por la administración" (Supuesto (a validar), S-25) |

      - No ve el pago del otro ámbito del mismo grupo, ni el monto total del intento, ni nada del ámbito `owner` (la deuda propia del propietario). El otro pago del grupo y el detalle del intento le responden 404.
    - **Lo que ve el propietario:** el grupo completo: el total del intento y cada pago por ámbito ("Tu deuda $…", "Deuda del arrendatario $…").
    - **Pago manual con "Ambos":** sigue la misma estructura. Se crean dos `PAYMENT` con `origin = manual`, uno por ámbito, con los montos que ingresa el administrador, agrupados por la clave de idempotencia del registro. Se anulan juntos (F-4).
13. **Ámbito de una ocupación terminada (M7; S-26).** Después del traspaso, el ámbito de una ocupación terminada siempre queda con deuda $0 y saldo a favor $0.
    - Los movimientos que, por las reglas de ámbito (F-9), caen en una ocupación terminada se registran igual en ese ámbito, para no perder la trazabilidad: notas de crédito y débitos de ajuste que apuntan a sus movimientos, ajustes de intereses (E-10), cargos nuevos por reclasificación (H-3), reversos de sus pagos y confirmaciones de intentos Webpay iniciados antes del término.
    - En la misma transacción, la deuda o el saldo a favor que resulte en ese ámbito se traspasa al ámbito `owner` con un traspaso nuevo, y allí se reimputa con la regla F-6.
    - Una nota de crédito sobre un cargo que ya había sido traspasado libera parte del crédito de traspaso. Esa parte queda a favor en la ocupación, se traspasa al ámbito `owner` y ahí se imputa con el orden de F-5, no necesariamente al débito de traspaso de ese mismo cargo.
    - **Webpay iniciado antes del término y confirmado después:** el crédito se registra en el ámbito con que se inició, queda a favor (porque la deuda ya se traspasó) y se traspasa de inmediato al ámbito `owner`. El pago no se pierde ni queda en un ámbito que nadie ve. Al registrar el término, si hay un intento en curso del arrendatario, el administrador ve la advertencia "Hay un pago en línea en curso del arrendatario. Si se confirma, se aplicará a la deuda de la unidad".
    - El saldo a favor que se genera así beneficia al ámbito `owner`. Cualquier devolución entre propietario y ex arrendatario queda fuera de ComVive (P-21).
14. **Ingresos y términos retroactivos (M7; S-27).** Una ocupación se puede registrar con fecha de ingreso o de término anterior a hoy, pero produce efecto desde su registro:
    - **Ingreso retroactivo (decisión del líder del proyecto, 2026-11-07; P-27 cerrada):** rige desde que se registra. Los cargos ya emitidos quedan en el ámbito `owner` (o en el que tenían) y el administrador no los puede reasignar (S-19). La nueva ocupación recibe solo los cargos que se emitan desde su registro. Al guardar, el administrador ve: "La fecha de ingreso es anterior a hoy. Los cargos ya emitidos no cambian de responsable".
    - **Término retroactivo (término no registrado a tiempo):** el traspaso se hace al registrar el término, con lo que ese día tenga pendiente la ocupación, incluidos los cargos emitidos entre la fecha de término declarada y el registro. Para el interés aplica la regla E-11 y no se recalculan días ya cobrados. El ex arrendatario pierde el acceso al registrarse el término.
    - Ambas fechas quedan en el registro de ocupaciones y en auditoría.
15. **Unidad sin propietario registrado (M7; S-28).** La emisión no se bloquea por una unidad sin propietario registrado (por ejemplo, durante una migración):
    - La vista previa de emisión advierte: "Unidades sin propietario registrado: <lista>. Su aviso se emitirá a nombre de 'Propietario sin registrar'".
    - Los cargos siguen la regla F-9: si hay un arrendatario vigente, van a su ámbito; si no, al ámbito `owner`.
    - El aviso legal de esas unidades muestra "Propietario: sin registrar" y no se notifica a nadie como propietario. El arrendatario recibe su notificación normal (regla G-6).
    - El ámbito `owner` de esa unidad solo se puede pagar con un pago manual del administrador.
    - Si ese aviso sirve para el cobro legal queda en P-20.
16. **Intento Webpay en revisión (decisión del líder del proyecto, 2026-11-07; M4; S-32).**
    - **Cuándo:** si Transbank autoriza un monto distinto del iniciado, o si Transbank no entrega un estado concluyente, la API no registra ningún pago y el intento pasa a `in_review` (`docs/arquitectura.md` §4).
    - **Qué ve el pagador:** "Tu pago está en revisión. Te avisaremos cuando se resuelva", con el número de orden. Su deuda no cambia mientras tanto.
    - **Bloqueo:** `in_review` libera el bloqueo del ámbito para no impedir pagar (Supuesto (a validar) de la arquitectura). Si el pagador vuelve a pagar, la app advierte: "Tienes un pago en revisión por $<monto>; si pagas de nuevo podría quedar saldo a favor".
    - **Quién lo resuelve:** solo Soporte ComVive (`platform_support`, permiso `platform.webpay_review.resolve`, excepción EX-1). El administrador y el comité de la comunidad ven los intentos en revisión de su comunidad, solo lectura (`webpay_attempt.read`); si intentan resolver, reciben 403.
    - **Resoluciones, siempre con vista previa (`previewHash`, regla A-7), clave de idempotencia y motivo obligatorio:**

      | Resolución (código) | Desde → hasta | Efecto |
      | --- | --- | --- |
      | Registrar el pago por el monto autorizado (`register_authorized`) | `in_review` → `resolved_paid` | Se registra un `PAYMENT` con `origin = webpay` por el monto autorizado, con `paid_on` = fecha de autorización de Transbank y `external_ref` = `buy_order`, en el borrador vigente (regla A-4) y en el ámbito del intento. Se imputa con F-5; un exceso queda a favor. Si la fecha efectiva cae en días con intereses cobrados, aplica E-10. **Solo para intentos de un ámbito** |
      | Marcar para reverso (`mark_for_reversal`) | `in_review` → `reversal_pending` | No se registra ningún pago. El pagador ve "Tu pago no se registró. Se solicitará la devolución del monto a Transbank" |
      | Confirmar el reverso (`confirm_reversal`) | `reversal_pending` → `reversed` | Soporte registra la referencia de la anulación en Transbank. El pagador ve "La devolución de tu pago fue solicitada a Transbank" |

    - **Intento de dos ámbitos:** solo se puede marcar para reverso. Si se intenta registrar, la respuesta es 422 `MULTI_SCOPE_REVIEW_REVERSAL_ONLY` con "Un pago que cubre dos deudas solo se puede marcar para reverso". Así no hay que repartir un monto autorizado distinto entre ámbitos. Esto reemplaza el supuesto de reparto por `position` que la arquitectura dejó para que lo confirmara el analista.
    - **Doble resolución:** un intento que ya llegó a `resolved_paid` o `reversed` deja de ser visible para Soporte, y cualquier lectura o resolución responde 404 (EX-1). Si dos personas de Soporte resuelven a la vez, la segunda recibe 409 `PREVIEW_OUTDATED` con "El intento ya fue resuelto". Lo mismo pasa con una resolución que no corresponde al estado actual, por ejemplo marcar para reverso un intento que ya está en `reversal_pending`.
    - **Plazo (decisión del líder del proyecto, 2026-11-07):** Soporte ComVive resuelve cada intento en `in_review` dentro de **5 días hábiles** desde que entra a revisión. Al vencer el plazo sin resolución, se envía una alerta automática al equipo de Soporte ComVive y el intento se marca "Plazo vencido" en su lista.
    - **Devolución en Transbank:** cómo se ejecuta la anulación en Transbank y en qué plazo sigue abierto (P-31; supuesto de la arquitectura: API de anulación de Webpay Plus, ADR 0007). El abono reversado sale de la cuenta de la comunidad, porque el abono llega directo a ella (F-12).

### G. Aviso de cobro

1. **Contenido mínimo legal** (Ley 21.442, art. 31):
   - La proporción en que la unidad contribuye a los gastos comunes y al fondo de reserva.
   - Los intereses y multas adeudados a la fecha.
   - El total de ingresos y egresos del mes.
   - El saldo de caja de la comunidad.
2. **Contenido adicional (S-15):**
   - Comunidad, unidad y propietario. **En el PDF el RUT va siempre enmascarado** (`12.345.***-*`), para todos los que lo descarguen, incluido el titular, porque el PDF se genera una sola vez y se comparte (Supuesto (a validar), S-30; P-19). En las pantallas, el titular y el administrador ven el RUT completo y los demás lo ven enmascarado.
   - Periodo, fecha de emisión, fecha de vencimiento y número correlativo.
   - Gastos del periodo por subcategoría. Las remuneraciones se muestran **agregadas** como "Remuneraciones del personal", sin detalle por persona.
   - Cargos de la unidad por cuenta (las unidades con $0 aparecen con $0), ajustes con su motivo, saldo anterior, pagos recibidos, total a pagar, saldo del fondo, medios de pago y nombre del administrador.
3. **Firma:** el aviso firmado por el administrador, en forma presencial o electrónica, tiene mérito ejecutivo (Ley 21.442, art. 32). En el MVP lleva la identificación del administrador como firma electrónica simple (P-6).
4. **Saldo de caja:** en el MVP lo ingresa el administrador al emitir, con monto y fecha de corte (S-16). Los ingresos y egresos del mes salen de los pagos y los gastos registrados.
5. **Documento:** el aviso se guarda como PDF al emitir. Se puede reenviar, nunca regenerar con otros montos.
6. **Notificación al emitir (menor 6; S-29).** Al terminar la emisión, y fuera de su transacción, ComVive envía automáticamente:
   - Al propietario registrado de cada unidad: "Ya está disponible tu aviso de cobro de <periodo>. Vence el <dd-mm-aaaa>", con acceso al aviso.
   - Al arrendatario con ocupación vigente: "Tienes un nuevo cobro de gasto común de <periodo>. Vence el <dd-mm-aaaa>" (el arrendatario no recibe el aviso legal).
   - Canales del MVP: notificación en la app y correo. WhatsApp se agrega cuando exista su integración.
   - Si en una unidad ningún canal se entrega, la unidad aparece en la alerta "Avisos sin notificar" del administrador, que puede reenviar. El vencimiento no cambia (regla E-1).
   - Un error al notificar no revierte la emisión. El envío queda en auditoría.
7. **Vista del cobro del arrendatario (menor 11, H-12).** No es el aviso legal. Contiene:
   - Comunidad, unidad, periodo, fecha de emisión y fecha de vencimiento.
   - La alícuota de la unidad (proporción con que contribuye a los gastos y al fondo).
   - Sus cargos del periodo por cuenta; sus intereses y ajustes con su motivo; el saldo anterior de su ámbito; los pagos de su ámbito con la etiqueta de quién pagó (regla F-12) y el total a pagar de su ámbito; sus cuotas impagas.
   - El resumen de gastos de la comunidad (regla G-8), el saldo del fondo y el saldo de caja.
   - **No contiene:** nombre ni RUT del propietario, deuda ni saldo del ámbito `owner`, el total de la unidad, ni el número correlativo del aviso legal.
   - **Descarga (H-12; Supuesto (a validar), S-40):** el arrendatario puede descargar un **comprobante de cobro** en PDF con este mismo contenido, titulado "Comprobante de cobro (no es el aviso de cobro legal)". Se genera al emitir, igual que el aviso (G-5), y no se regenera con otros montos. El aviso legal de su unidad le responde 404.
   - El arrendatario ve además el resumen de gastos (G-8), el saldo del fondo y el saldo de caja de la comunidad, igual que el propietario.
8. **Resumen de gastos para residentes (menor 11; S-31).** Lo ven el propietario y el arrendatario en la app, y es el mismo detalle de gastos del aviso legal:
   - Gastos del periodo por subcategoría con su total, y dentro de cada subcategoría cada gasto con su concepto y monto.
   - **Excepción, remuneraciones agregadas:** las remuneraciones, los honorarios del personal contratado por la comunidad y las leyes sociales se muestran en una sola línea, "Remuneraciones del personal", sin detalle por persona ni por cargo. Los honorarios del administrador van en su propia línea, "Honorarios de administración", porque son un contrato de la comunidad y no el sueldo de un trabajador.
   - Extraordinarios, egresos del fondo, saldo del fondo, total de ingresos y egresos del mes y saldo de caja.
   - **No contiene:** deudas por unidad, nombres de residentes ni listas de morosos.
   - El administrador y el comité ven el detalle completo de cada gasto.
   - Si la comunidad tiene un solo trabajador, la línea agregada igual revela su remuneración; queda en P-23.

### H. Ajustes y corrección de periodos

1. **Dónde se corrige:** un error en un periodo emitido o cerrado se corrige solo con ajustes en el borrador vigente.
   - Cada ajuste es un débito (si la diferencia es positiva) o una nota de crédito (si es negativa).
   - Va por unidad y cuenta, con motivo obligatorio y `adjusts_entry_id` apuntando al cargo original.
2. **Fórmula del ajuste (por unidad y cuenta del grupo corregido):**

   ```text
   ajuste = cargo_correcto − (cargo_original + Σ ajustes previos del mismo grupo y unidad)
   ```

   - `cargo_correcto` se recalcula con la **foto de participaciones del periodo original** (unidades, `aliquot_e6`, `sort_order`, conjuntos y porcentaje del fondo) y con el total corregido del grupo.
   - Si cambia `O_g`, el fondo del grupo se recalcula igual.
   - Así, el cargo original más todos sus ajustes es siempre igual a la última distribución correcta, por muchas correcciones que se hagan.
3. **Reclasificación:**
   - Si un gasto cambia de cuenta o de base de pesos, se generan dos ajustes: la reversión de su efecto en el grupo de origen y su aplicación en el grupo de destino, ambos con la fórmula H-2.
   - Si solo cambia la subcategoría (misma cuenta y base), no hay movimiento. Queda como nota en el aviso del borrador vigente.
   - Si en el grupo de destino la unidad no tenía un cargo original, el ajuste es un **cargo nuevo** en el borrador vigente que apunta al gasto corregido (no a un movimiento). Su ámbito sigue la regla F-9.
4. **Avisos anteriores:** los ajustes no modifican ningún cargo ni aviso anterior. Aparecen en el aviso siguiente como "Ajuste periodo AAAA-MM: motivo".
5. **Periodo y vencimiento de un débito de ajuste:**
   - El débito pertenece al periodo del borrador donde se registra y vence con el aviso de ese borrador: `fecha_emisión del borrador + plazo`.
   - Devenga interés desde el día siguiente a ese vencimiento, nunca desde el vencimiento del cargo original.
   - Las notas de crédito también se registran en el borrador vigente, pero se imputan al cargo que ajustan (regla F-6).
6. **Anular gasto (M6; S-35).** Para un gasto o cargo directo que no debió existir (por ejemplo, un duplicado) en un periodo emitido o cerrado:
   - Es una corrección con **monto correcto $0** (excepción explícita a B-5) y **motivo obligatorio**. Sin motivo se rechaza con "Indica el motivo de la anulación".
   - Se calcula con la fórmula H-2: el total corregido del grupo es su total sin ese gasto, con la foto de participaciones del periodo original. Si cambia `O_g`, el fondo del grupo se recalcula igual. Si el grupo queda en $0, el cargo correcto de cada unidad es $0 y el fondo del grupo también.
   - En un cargo directo, la nota de crédito de la unidad es −(cargo original + Σ ajustes previos).
   - El resultado son notas de crédito en el borrador vigente, en el ámbito del cargo que ajustan (reglas F-9 y F-13), que se imputan con la regla F-6.
   - Tiene vista previa y se confirma contra su versión (regla A-7), con clave de idempotencia.
   - El gasto no se borra: queda con el estado "Anulado", su motivo y su monto original visibles. Una corrección posterior a un monto mayor que $0 lo reactiva y se calcula con la misma fórmula H-2.
   - En un borrador no se usa esta acción: el gasto simplemente se elimina (regla A-2).

## Criterios de aceptación

Las comunidades A, B, C y D vienen de `docs/qa/comunidades-simuladas.md`.

- Las fechas, tasas, consumos y gastos adicionales son **datos de prueba**.
- `sort_order` de cada comunidad:
  - A: 101 = 1, 102 = 2, 201 = 3, 202 = 4.
  - B: Casa 1 = 1, Casa 2 = 2, Casa 3 = 3.
  - C: 11 = 1, 12 = 2, 21 = 3, 22 = 4, 31 = 5.
  - D: Depto 1 a 4 = 1 a 4.
- Salvo indicación, el fondo es 5 % (500 pb), el plazo de vencimiento es de 10 días corridos y el flag `billing.interest` está apagado.
- **Ámbito del Depto 102 en CA-1 a CA-21 (H-19; supuesto de los casos):** la Comunidad A dice que el Depto 102 tiene arrendatario, pero sin fechas. Salvo que el CA diga otra cosa, en CA-1 a CA-21 el Depto 102 no tiene una ocupación de arrendatario registrada en las fechas del caso, así que todos sus cargos están en el ámbito `owner`. Desde CA-22, las ocupaciones del Depto 102 (O-1, O-2, O-3) se indican con fechas en cada CA. QA ajustará `docs/qa/comunidades-simuladas.md`.
- **Decimales intermedios (H-14):** los cocientes intermedios se muestran con 4 decimales **truncados** y "…" (por ejemplo, piso(1.639,7260…)). El resultado es siempre el piso del cociente exacto; los decimales mostrados no se redondean.
- **Ámbitos:** "`occupancy` O-1" es el ámbito de la ocupación O-1 (ver "Definiciones").

**CA-1 · Emisión base por cuenta (Comunidad A)**

- Dado que la Comunidad A tiene el borrador `2026-10` con un grupo (ordinario, alícuota) de $1.000.000 (conserje $650.000, electricidad $180.000, ascensor $120.000, aseo $50.000)
- Cuando el administrador lo emite el 2026-11-01
- Entonces se crea el grupo de fondo (fondo de reserva, alícuota) con F = (1.000.000 × 500 + 9.999) div 10.000 = 500.009.999 div 10.000 = $50.000.
- Y los cargos son:

  | Unidad | Ordinario | Fondo | Total |
  | --- | --- | --- | --- |
  | Depto 101 | $200.000 | $10.000 | $210.000 |
  | Depto 102 | $250.000 | $12.500 | $262.500 |
  | Depto 201 | $250.000 | $12.500 | $262.500 |
  | Depto 202 | $300.000 | $15.000 | $315.000 |
  | **Suma** | **$1.000.000** | **$50.000** | **$1.050.000** |

- Y el vencimiento es el 2026-11-11.
- Y `2026-10` queda emitido y `2026-11` queda creado como borrador vigente.

**CA-2 · Partes iguales con desempate (Comunidad B)**

- Dado un grupo (ordinario, partes iguales {Casa 1, Casa 2, Casa 3}) de $95.238 y alícuotas no cargadas
- Cuando se emite
- Entonces la emisión no exige que las alícuotas sumen 100 %, porque no hay grupos por alícuota.
- Y el fondo es (95.238 × 500 + 9.999) div 10.000 = 47.628.999 div 10.000 = $4.762 (techo de 4.761,9).
- Y el ordinario es 95.238 / 3 = $31.746 exacto para cada casa.
- Y el fondo de cada casa es 4.762 div 3 = 1.587, con resto 1 para cada una. El peso que falta va a la Casa 1 por su `sort_order` menor.
- Y los totales son Casa 1 $33.334, Casa 2 $33.333 y Casa 3 $33.333, que suman $100.000.

**CA-3 · Resto mayor con varios pesos y empate (Comunidad C)**

- Dado un grupo (ordinario, alícuota) de $1.175.778 con `aliquot_e6` 185000, 195000, 200000, 210000 y 210000
- Cuando se emite
- Entonces el fondo es (1.175.778 × 500 + 9.999) div 10.000 = 587.898.999 div 10.000 = $58.789 (techo de 58.788,9).
- Y en el ordinario los productos 217.518.930.000, 229.276.710.000, 235.155.600.000, 246.913.380.000 y 246.913.380.000 (÷ 1.000.000) dan partes enteras que suman 1.175.775. Los 3 pesos que faltan van a los restos 930.000 (Depto 11), 710.000 (Depto 12) y 600.000 (Depto 21).
- Y en el fondo los productos 10.875.965.000, 11.463.855.000, 11.757.800.000, 12.345.690.000 y 12.345.690.000 dan partes enteras que suman 58.785. Los 4 pesos que faltan van a los restos 965.000, 855.000 y 800.000, y en el empate de 690.000 gana el Depto 22 (`sort_order` 4) sobre el Depto 31 (`sort_order` 5).
- Y los cargos son:

  | Unidad | Ordinario | Fondo | Total |
  | --- | --- | --- | --- |
  | Depto 11 | $217.519 | $10.876 | $228.395 |
  | Depto 12 | $229.277 | $11.464 | $240.741 |
  | Depto 21 | $235.156 | $11.758 | $246.914 |
  | Depto 22 | $246.913 | $12.346 | $259.259 |
  | Depto 31 | $246.913 | $12.345 | $259.258 |
  | **Suma** | **$1.175.778** | **$58.789** | **$1.234.567** |

- Y los Deptos 21 y 31 difieren en ±1 peso de la prueba de oro C, que reparte un solo monto (regla C-6).

**CA-4 · Alícuotas en escala 10^-6 (Comunidad D, GOLD-D-01 a GOLD-D-04)**

- Dado un grupo (ordinario, alícuota) de $876.543 con `aliquot_e6` 187345, 243218, 256789 y 312648
- Cuando se emite
- Entonces el fondo es (876.543 × 500 + 9.999) div 10.000 = 438.281.499 div 10.000 = $43.828. Es el techo de 43.827,15; con el redondeo anterior (mitad hacia arriba) era $43.827.
- Y en el fondo los productos 43.828 × `aliquot_e6` son 8.210.956.660, 10.659.758.504, 11.254.548.292 y 13.702.736.544. Las partes enteras suman 8.210 + 10.659 + 11.254 + 13.702 = 43.825, y los 3 pesos que faltan van a los restos 956.660 (Depto 1), 758.504 (Depto 2) y 736.544 (Depto 4).
- Y los cargos son:

  | Prueba | Unidad | Ordinario | Fondo | Total |
  | --- | --- | --- | --- | --- |
  | GOLD-D-01 | Depto 1 | $164.216 | $8.211 | $172.427 |
  | GOLD-D-02 | Depto 2 | $213.191 | $10.660 | $223.851 |
  | GOLD-D-03 | Depto 3 | $225.087 | $11.254 | $236.341 |
  | GOLD-D-04 | Depto 4 | $274.049 | $13.703 | $287.752 |
  | | **Suma** | **$876.543** | **$43.828** | **$920.371** |

- **Diferencia con la prueba de oro D:** `docs/qa/comunidades-simuladas.md` usa un fondo fijo de $43.827 y espera $287.751 en GOLD-D-04. Con el techo de la regla D-3, la emisión da un fondo de $43.828 y $287.752 en GOLD-D-04. GOLD-D-01 a 03 no cambian. La prueba de oro D se actualiza al techo (P-15 cerrada). La diferencia de ±1 peso por cuenta ya no se prueba con la Comunidad D sino con GOLD-CE (regla C-6).

**CA-5 · Pago parcial e imputación (Comunidad A)**

- Dado `2026-10` emitido como en CA-1
- Cuando el Depto 101 paga $100.000 por transferencia, con `paid_on` 2026-11-05
- Entonces el crédito se registra en el periodo `2026-11` (borrador vigente).
- Y el pago se imputa al ordinario de `2026-10`. Queda pendiente un ordinario de $100.000 y un fondo de $10.000, con saldo de $110.000.

**CA-6 · Interés por mora y pago posterior (Comunidad A, flag activo)**

- Dado que la Comunidad A tiene el flag `billing.interest` activo desde el 2026-11-01, una tasa del reglamento de 1200 pb anuales (1,00 % mensual × 12) vigente desde el 2026-11-01 y una tasa CMF de referencia de 3000 pb (dato de prueba) vigente desde antes del 2026-11-01, con tope diario de 1500 pb
- Y el Depto 101 no tiene arrendatario, así que todo está en el ámbito `owner`
- Y el Depto 101 tiene $110.000 de capital vencido desde el 2026-11-12, como en CA-5
- Cuando se emite `2026-11` el 2026-12-01, con los mismos gastos de CA-1
- Entonces la ventana va del 2026-11-12 al 2026-11-30 (19 días) y el interés es piso(110.000 × 19 × 1200 / 3.650.000) = piso(2.508.000.000 / 3.650.000) = piso(687,1232…) = $687.
- Y el saldo es 110.000 + 687 + 210.000 = $320.687.
- Cuando el Depto 101 paga $150.000 con `paid_on` 2026-12-05
- Entonces la imputación es:
  - Capital vencido: ordinario `2026-10` $100.000 y fondo `2026-10` $10.000.
  - Lo no vencido (vence el 2026-12-11): interés $687 y ordinario `2026-11` $39.313.
- Y queda pendiente un ordinario `2026-11` de $160.687 y un fondo `2026-11` de $10.000, con saldo de $170.687.
- Y si no hay más pagos, en la emisión del 2027-01-01 el interés suma dos tramos:
  - Del 2026-12-01 al 2026-12-04, sobre los $110.000 de `2026-10`: 4 × 110.000 = 440.000 peso-días. Los días no se pierden por haber emitido el 2026-12-01.
  - Del 2026-12-12 al 2026-12-31, sobre los $170.687 de capital de `2026-11`: 20 × 170.687 = 3.413.740 peso-días.
- Y el interés total es piso(3.853.740 × 1200 / 3.650.000) = piso(1.266,9830…) = $1.266.

**CA-7 · Tasa del reglamento sobre el tope**

- Dado que el tope vigente es 1500 pb anuales
- Cuando el administrador configura una tasa del reglamento de 1,50 % mensual (1800 pb anuales)
- Entonces se guarda la tasa, el sistema advierte "La tasa configurada supera el tope legal vigente (15,00 % anual). Se aplicará el tope" y el cálculo usa min(1800, 1500) = 1500 pb.

**CA-8 · Mes de 31 días con tasa igual al tope (flag activo)**

- Dado que la Comunidad A tiene el flag activo desde el 2026-11-01, una tasa del reglamento de 1500 pb vigente desde el 2026-11-01 y una tasa CMF de 3000 pb, con tope de 1500 pb, igual a la tasa del reglamento
- Y el Depto 202 tiene $315.000 impagos de `2026-10` (vencido el 2026-11-11) y ningún pago
- Y `2026-11` se emitió el 2026-12-01 sin gastos (como en CA-20), así que no hubo cargos de gastos del periodo. Con el flag activo, esa emisión sí creó para el Depto 202 un cargo de intereses de piso(315.000 × 19 × 1500 / 3.650.000) = piso(8.977.500.000 / 3.650.000) = piso(2.459,5890…) = $2.459, por los días del 2026-11-12 al 2026-11-30. El último día cobrado es el **2026-11-30**. Ese interés no devenga interés (S-9), así que el capital vencido de diciembre se mantiene en $315.000
- Cuando se emite `2026-12` el 2027-01-01
- Entonces la ventana va del 2026-12-01 al 2026-12-31 (31 días) en un año de 365 días, y el interés es piso(315.000 × 31 × 1500 / 3.650.000) = piso(14.647.500.000 / 3.650.000) = piso(4.013,0136…) = $4.013.
- Y no supera el tope legal proporcional a los días: 315.000 × 15 % × 31 / 365 = 4.013,0136…. La tasa efectiva anualizada es exactamente 15 %.
- Y no da el resultado de la convención de 30 días de la versión anterior, que cobraba 315.000 × 1,25 % × 31 / 30 = 4.068,75 y superaba el tope.

**CA-9 · Pago mayor a la deuda (Comunidad A)**

- Dado que el Depto 201, ocupado por su propietario según la Comunidad A, debe $262.500 de `2026-10`
- Cuando su propietario paga $300.000 el 2026-11-08
- Entonces se imputan $250.000 al ordinario y $12.500 al fondo, y quedan $37.500 a favor (saldo −$37.500).
- Cuando se emite `2026-11` con cargos de $250.000 de ordinario y $12.500 de fondo
- Entonces los $37.500 se imputan al ordinario de `2026-11` y la unidad debe $225.000.

**CA-10 · Webpay duplicado**

- Dado un pago Webpay de $315.000 del Depto 202 con la orden `OC-2026-0001`
- Cuando la confirmación llega dos veces
- Entonces hay un solo pago y un solo crédito, y el saldo del Depto 202 es $0.

**CA-11 · Posible duplicado manual**

- Dado `2026-10` emitido como en CA-1, con el Depto 201 debiendo $262.500 (ordinario $250.000 y fondo $12.500) y sin otros pagos (H-13)
- Y un pago manual de $262.500 del Depto 201 por transferencia con fecha 2026-11-09, que deja su saldo en $0
- Cuando el administrador ingresa otro pago con esos mismos datos
- Entonces el formulario muestra "Ya existe un pago de $262.500 para Depto 201 con fecha 09-11-2026 por transferencia. Revisa que no sea un duplicado" y permite guardar.
- Cuando lo guarda y después lo anula por duplicado
- Entonces se registra un débito de reverso de $262.500 en la cuenta `pago`, con motivo, en el borrador vigente. El duplicado estaba entero como saldo a favor, así que el saldo vuelve a $0. Ningún pago se borra.

**CA-12 · Anulación con reimputación del saldo a favor (Comunidad A)**

- Dado que el Depto 202 debe $315.000 de `2026-10` y paga $315.000 con cheque el 2026-11-05 (pago P1) y $100.000 por transferencia el 2026-11-06 (pago P2, que queda a favor)
- Cuando el 2026-11-20 el administrador anula P1 porque el cheque fue protestado
- Entonces se registra un débito de reverso de $315.000 en `2026-11`.
- Y los $100.000 de P2 se reimputan al ordinario de `2026-10`.
- Y queda pendiente un ordinario de $200.000 y un fondo de $15.000, con saldo de $215.000 y sin saldo a favor.

**CA-13 · Corrección de un periodo cerrado (Comunidad A)**

- Dado que `2026-10` está cerrado, que la electricidad se registró en $180.000 cuando la factura era de $170.000, y que el Depto 101 tiene `2026-10` pagado completo y `2026-11` ($210.000, vencido el 2026-12-11) sin pagar
- Cuando el 2026-12-15 el administrador registra la corrección en el borrador vigente `2026-12`
- Entonces el sistema recalcula con la foto de `2026-10`: O = $990.000 y F = $49.500.
- Y se generan estas notas de crédito:

  | Unidad | Ordinario | Fondo |
  | --- | --- | --- |
  | Depto 101 | −$2.000 | −$100 |
  | Depto 102 | −$2.500 | −$125 |
  | Depto 201 | −$2.500 | −$125 |
  | Depto 202 | −$3.000 | −$150 |
  | **Suma** | **−$10.000** | **−$500** |

- Y en el Depto 101 se liberan $2.100 del pago de `2026-10`, que se reimputan al ordinario vencido de `2026-11`. Ese ordinario queda en $197.900 pendiente, más el fondo de $10.000: saldo $207.900.
- Y ningún movimiento de `2026-10` cambia.

**CA-14 · Dos correcciones sucesivas del mismo grupo (Comunidad A)**

- Dado CA-13 aplicado, y que el Depto 101 no tiene deuda ni saldo a favor al registrar esta segunda corrección
- Cuando en el borrador vigente `2027-01` se registra que la factura real era de $175.000
- Entonces el cargo correcto se calcula con O = $995.000 y F = (995.000 × 500 + 9.999) div 10.000 = 497.509.999 div 10.000 = $49.750.
- Y el fondo exacto es 9.950; 12.437,5; 12.437,5 y 14.925. Las partes enteras suman 49.749 y el peso que falta se lo lleva el Depto 102 en el empate con el Depto 201, por su menor `sort_order`.
- Y con ajuste = correcto − (original + ajustes previos), los débitos son:

  | Unidad | Ordinario correcto | Ajuste ordinario | Fondo correcto | Ajuste fondo |
  | --- | --- | --- | --- | --- |
  | Depto 101 | $199.000 | 199.000 − 198.000 = +$1.000 | $9.950 | 9.950 − 9.900 = +$50 |
  | Depto 102 | $248.750 | +$1.250 | $12.438 | 12.438 − 12.375 = +$63 |
  | Depto 201 | $248.750 | +$1.250 | $12.437 | +$62 |
  | Depto 202 | $298.500 | +$1.500 | $14.925 | +$75 |
  | **Suma** | **$995.000** | **+$5.000** | **$49.750** | **+$250** |

- Y para cada unidad, original + ajuste 1 + ajuste 2 es igual al cargo correcto.
- Y los débitos de ajuste pertenecen al periodo `2027-01`, donde se registran (regla H-5), no a `2026-10`. Si `2027-01` se emite el 2027-02-01, vencen el 2027-02-11.
- Y el Depto 101 queda con $1.050 pendientes no vencidos ($1.000 de ordinario y $50 de fondo de `2027-01`, ámbito `owner`), que aparecen en su aviso de `2027-01` como "Ajuste periodo 2026-10: corrección factura electricidad".
- Y con el flag activo, ese monto devengaría interés solo desde el 2027-02-12.

**CA-15 · Pago tardío después del cierre: periodo exacto**

- Dado que `2026-10` está cerrado, `2026-11` emitido el 2026-12-01 y `2026-12` es el borrador vigente
- Cuando el 2026-12-03 el administrador registra un pago con `paid_on` 2026-10-31
- Entonces el crédito queda en el periodo `2026-12`, con `paid_on` 2026-10-31 y `recorded_at` 2026-12-03.
- Y todo intento de registrar un gasto, cargo o movimiento con periodo `2026-10` se rechaza.
- Y un pago con `paid_on` posterior a la fecha actual se rechaza con "La fecha de pago no puede ser futura".

**CA-16 · Extraordinario sin recargo (Comunidad B)**

- Dado un grupo (extraordinario, partes iguales) de $300.000 y un grupo (ordinario, partes iguales) de $95.238
- Cuando se emite
- Entonces cada casa recibe un extraordinario de $100.000 y el fondo sigue siendo $4.762.

**CA-17 · Consumo de agua como monto directo (Comunidad A)**

- Dado que el administrador ingresa cargos directos ordinarios de agua de $24.000 (101), $36.000 (102), $30.000 (201) y $30.000 (202)
- Cuando se emite
- Entonces esos cargos se crean tal cual, suman $120.000 y no generan recargo de fondo.

**CA-18 · Unidad con participación 0 (Comunidad C más Bodega B1)**

- Dada la unidad Bodega B1 con `aliquot_e6` 0 y `sort_order` 6, con las demás alícuotas sumando 1.000.000
- Cuando se emite el periodo de CA-3
- Entonces la Bodega B1 no tiene cargos ni movimientos, su aviso muestra $0 y los demás cargos son idénticos a CA-3.
- Cuando se le carga una multa de $30.000 en el periodo siguiente
- Entonces se crea un cargo de cuenta `multas` por $30.000.

**CA-19 · Alícuotas que no suman 100 %**

- Dado que en la Comunidad C el Depto 31 queda con `aliquot_e6` 209900 (suma 999.900) y hay un grupo por alícuota
- Cuando se intenta emitir
- Entonces la emisión se bloquea con "Las alícuotas suman 99,9900 %; deben sumar 100,0000 %" y no se crea nada.

**CA-20 · Periodo sin gastos (Comunidad B)**

- Dado un borrador sin gastos ni cargos, con el flag `billing.interest` apagado
- Cuando se intenta emitir
- Entonces el sistema pide confirmación con el mensaje "El periodo no tiene gastos. Se emitirán avisos sin cargos de gastos del periodo".
- Y al confirmar no se crean cargos ni movimientos, cada casa recibe su aviso con $0 en los gastos del periodo, el saldo anterior y el saldo de caja, y se crea el borrador siguiente.
- Y con el flag activo y capital vencido, el mensaje es el mismo, pero la emisión sí crea los cargos de intereses que correspondan (ejemplo: $2.459 al Depto 202 en CA-8) (H-2).

**CA-21 · Cambio de propietario (Comunidad A)**

- Dado que el Depto 201 debe $262.500 de `2026-10` y se vende el 2026-11-15
- Cuando el administrador registra al nuevo propietario desde esa fecha y emite `2026-11` el 2026-12-01
- Entonces el cargo de `2026-11` es completo ($262.500), sin prorrateo por días.
- Y el aviso va al nuevo propietario con un saldo de $525.000, que incluye la deuda anterior (Ley 21.442, art. 6).
- Y el propietario anterior, con la membresía vencida, recibe 404 al consultar la unidad. Su historial lo obtiene pidiéndolo al administrador.

**CA-22 · Arrendatario que paga con deuda anterior en la unidad (Comunidad A)**

- Dado que la ocupación del arrendatario anterior del Depto 102 terminó el 2026-10-31
- Y que `2026-10` se emitió el 2026-11-01 sin arrendatario vigente, así que su cargo de $262.500 quedó en el ámbito `owner` y está impago
- Y que un nuevo arrendatario (ocupación O-1) ingresa el 2026-11-15
- Cuando se emite `2026-11` el 2026-12-01 con $262.500 para el Depto 102
- Entonces ese cargo queda en el ámbito `occupancy` O-1, porque O-1 es el ocupante responsable a la fecha de emisión.
- Y el arrendatario ve solo su ámbito: total $262.500 y saldo anterior $0.
- Cuando el arrendatario paga $262.500 por Webpay el 2026-12-05
- Entonces el pago se imputa solo a su ámbito: ordinario `2026-11` $250.000 y fondo `2026-11` $12.500. No se aplica a `2026-10`, aunque sea más antiguo.
- Y el saldo del ámbito `occupancy` O-1 es $0 y el del ámbito `owner` es $262.500.
- Y el aviso legal al propietario muestra las dos líneas por separado, sin compensarlas: ámbito `owner` con deuda $262.500 y saldo a favor $0; ámbito arrendatario con deuda $0 y saldo a favor $0. El total de la unidad es $262.500.
- Y si el arrendatario pide un cargo de `2026-10`, recibe 404.

**CA-23 · Aislamiento entre comunidades y unidades**

- Dado un administrador con membresía solo en la Comunidad A
- Cuando lee los cargos de una unidad de la Comunidad B, o registra un pago en ella
- Entonces en ambos casos recibe 404 y no se escribe nada.
- Dado el residente propietario del Depto 101
- Cuando lee o paga cargos del Depto 102
- Entonces en ambos casos recibe 404.

**CA-24 · Permisos por rol**

- Dado un miembro del comité de la Comunidad A
- Cuando intenta emitir, cerrar, registrar un pago o crear un gasto
- Entonces recibe 403 y nada cambia.
- Dado un conserje de la Comunidad A
- Cuando intenta leer un aviso o un saldo
- Entonces recibe 403.

**CA-25 · Emisión idempotente**

- Dado el borrador `2026-10` de la Comunidad A
- Cuando llegan dos peticiones de emisión con la misma clave de idempotencia
- Entonces existe una sola emisión, con los cargos de CA-1 una sola vez, y ambas respuestas son iguales.
- Cuando llega una petición con otra clave
- Entonces la respuesta es 409 con el mensaje "El periodo ya fue emitido".

**CA-26 · Intereses por ámbito con arrendatario y deuda anterior del propietario (Comunidad A, flag activo)**

- Dado el escenario de CA-22, con el flag activo desde el 2026-11-01, una tasa del reglamento de 1200 pb vigente desde el 2026-11-01 y una tasa CMF de 3000 pb (tope 1500 pb)
- Cuando se emite `2026-11` el 2026-12-01
- Entonces el ámbito `owner` genera un interés de piso(262.500 × 19 × 1200 / 3.650.000) = piso(5.985.000.000 / 3.650.000) = piso(1.639,7260…) = $1.639, por los días del 2026-11-12 al 2026-11-30.
- Y el ámbito `occupancy` O-1 no genera interés, porque aún no tiene capital vencido.
- Cuando el arrendatario paga $262.500 por Webpay con `paid_on` 2026-12-20, después del vencimiento del 2026-12-11
- Entonces se imputa al ordinario ($250.000) y al fondo ($12.500) de `2026-11` de su ámbito, con fecha efectiva máx(2026-12-20, 2026-12-11) = 2026-12-20.
- Cuando se emite `2026-12` el 2027-01-01, con $262.500 para el Depto 102 (ámbito `occupancy` O-1)
- Entonces el interés del ámbito `owner` es piso(262.500 × 31 × 1200 / 3.650.000) = piso(9.765.000.000 / 3.650.000) = piso(2.675,3424…) = $2.675, por los días del 2026-12-01 al 2026-12-31.
- Y el interés del ámbito `occupancy` O-1 es piso(262.500 × 8 × 1200 / 3.650.000) = piso(2.520.000.000 / 3.650.000) = piso(690,4109…) = $690, por los días del 2026-12-12 al 2026-12-19.
- Y el aviso legal de `2026-12` al propietario muestra:

  | Ámbito | Deuda bruta | Saldo a favor |
  | --- | --- | --- |
  | `owner` | 262.500 + 1.639 + 2.675 = $266.814 | $0 |
  | `occupancy` O-1 | 262.500 + 690 = $263.190 | $0 |
  | **Total de la unidad** | **$530.004** | **$0** |

- Y el arrendatario ve solo $263.190.
- Cuando la ocupación O-1 termina el 2027-01-31 sin más pagos
- Entonces los $263.190 pasan al ámbito `owner`, que queda con $530.004.

**CA-27 · Fecha efectiva al reimputar después de anular un pago (Comunidad A, flag activo)**

- Dado el escenario de CA-12, con el flag activo desde el 2026-11-01, una tasa del reglamento de 1200 pb y un tope de 1500 pb
- Cuando el 2026-11-20 se anula P1 y los $100.000 de P2 (`paid_on` 2026-11-06) se reimputan al ordinario de `2026-10`
- Entonces la fecha efectiva de esa reimputación es máx(2026-11-06, 2026-11-11) = 2026-11-11, no el 2026-11-20.
- Y al emitir `2026-11` el 2026-12-01, el capital es $215.000 en todos los días del 2026-11-12 al 2026-11-30 (19 días). El interés es piso(215.000 × 19 × 1200 / 3.650.000) = piso(4.902.000.000 / 3.650.000) = piso(1.343,0136…) = $1.343.
- Y no es $1.606, que es lo que daría tomar el 2026-11-20 como fecha efectiva: 315.000 × 8 días + 215.000 × 11 días.
- Y el saldo tras emitir es 215.000 + 1.343 + 315.000 = $531.343.

**CA-28 · Pago registrado con fecha dentro de días ya cobrados, y su anulación (Comunidad A, flag activo)**

- Dado el estado de CA-6 inmediatamente después de emitir `2026-11` el 2026-12-01: el interés de $687 cubre del 2026-11-12 al 2026-11-30 y el saldo es $320.687
- Cuando el 2026-12-03 el administrador registra una transferencia de $110.000 con `paid_on` 2026-11-20, que el propietario había hecho y no se había registrado (en lugar del pago de $150.000 de CA-6)
- Entonces se imputa al capital vencido: ordinario `2026-10` $100.000 y fondo `2026-10` $10.000, con fecha efectiva máx(2026-11-20, 2026-11-11) = 2026-11-20.
- Y el interés recalculado de esa ventana es piso(110.000 × 8 × 1200 / 3.650.000) = piso(1.056.000.000 / 3.650.000) = piso(289,3150…) = $289, por los días del 2026-11-12 al 2026-11-19.
- Y se registra automáticamente en `2026-12` una nota de crédito de intereses por 289 − 687 = −$398, que apunta al cargo de interés de $687 y se imputa a él, que queda en $289 pendiente.
- Y el saldo es 320.687 − 110.000 − 398 = $210.289 ($210.000 de `2026-11` más $289 de interés).
- Cuando el 2026-12-10 se anula esa transferencia
- Entonces el interés recalculado vuelve a $687 y se registra un débito de ajuste de intereses por 687 − (687 − 398) = +$398.
- Y el saldo vuelve a 210.289 + 110.000 + 398 = $320.687.

**CA-29 · El propietario paga ambos ámbitos por Webpay (Comunidad A, flag activo)**

- Dado el estado de CA-26 inmediatamente después de emitir `2026-12` el 2027-01-01, sin el término de la ocupación O-1:
  - Ámbito `owner`: interés $1.639 (vencido el 2026-12-11), ordinario `2026-10` $250.000 y fondo `2026-10` $12.500 (vencidos el 2026-11-11) e interés $2.675 (vence el 2027-01-11). Deuda $266.814.
  - Ámbito `occupancy` O-1: interés $690, ordinario `2026-12` $250.000 y fondo `2026-12` $12.500, todo con vencimiento el 2027-01-11. Deuda $263.190.
- Cuando el 2027-01-05 el propietario elige "Ambas" en la app
- Entonces se crea **un** `WEBPAY_ATTEMPT` por 266.814 + 263.190 = $530.004, con un solo `buy_order` (`OC-2027-0001`) y dos `WEBPAY_ATTEMPT_SCOPE`: $266.814 para `owner` y $263.190 para `occupancy` O-1.
- Cuando Transbank confirma $530.004 el 2027-01-05
- Entonces se registran **dos** `PAYMENT` con `origin = webpay`, `external_ref` `OC-2027-0001` y `paid_on` 2027-01-05, agrupados por el intento: $266.814 en `owner` y $263.190 en `occupancy` O-1. Cada uno genera su crédito en su ámbito.
- Y si la confirmación llega dos veces, siguen existiendo solo esos dos pagos (unicidad por `origin`, `external_ref` y ámbito).
- Y en `owner` se imputa: interés vencido $1.639; capital vencido `2026-10` ordinario $250.000 y fondo $12.500; no vencido, interés $2.675.
- Y en `occupancy` O-1 se imputa, todo no vencido: interés $690, ordinario `2026-12` $250.000 y fondo `2026-12` $12.500.
- Y ambos ámbitos quedan con saldo $0.
- Y el propietario ve el pago en línea de $530.004 con el detalle "Tu deuda $266.814" y "Deuda del arrendatario $263.190".
- Y el arrendatario ve en su ámbito "Pagado por el propietario · $263.190 · 05-01-2027 · Webpay". No ve el pago de $266.814 del ámbito `owner` ni el total de $530.004. Si pide el pago del ámbito `owner` o el detalle del intento, recibe 404.
- Y en la emisión de `2027-01` el 2027-02-01, el ámbito `owner` genera un interés de piso(262.500 × 4 × 1200 / 3.650.000) = piso(1.260.000.000 / 3.650.000) = piso(345,2054…) = $345, por los días del 2027-01-01 al 2027-01-04 (fecha efectiva máx(2027-01-05, 2026-11-11) = 2027-01-05). El ámbito `occupancy` O-1 no genera interés, porque pagó antes del vencimiento.

**CA-30 · El propietario paga solo la deuda del arrendatario, con bloqueo por ámbito (Comunidad A, flag activo)**

- Dado el mismo estado inicial de CA-29
- Cuando el 2027-01-05 el propietario elige "Deuda del arrendatario" y el intento de $263.190 (un `WEBPAY_ATTEMPT_SCOPE` sobre `occupancy` O-1) queda en `initiated`
- Entonces el arrendatario ve "Hay un pago en proceso para esta deuda", sin indicar quién paga, y si intenta iniciar otro pago recibe 409 `PAYMENT_IN_PROGRESS`.
- Y el propietario puede iniciar en paralelo "Mi deuda" por $266.814, pero no se le ofrece "Ambas".
- Y si el arrendatario intenta por la API un pago del ámbito `owner`, recibe 404.
- Cuando Transbank confirma $263.190
- Entonces se registra un `PAYMENT` con `origin = webpay` de $263.190 en `occupancy` O-1, que queda en $0, y el ámbito `owner` sigue en $266.814.
- Y el arrendatario ve "Pagado por el propietario · $263.190 · 05-01-2027 · Webpay", pero no la deuda de $266.814 del ámbito `owner`.

**CA-31 · Pagos manuales con la misma referencia y doble envío (Comunidad A)**

- Dado `2026-10` emitido como en CA-1 y el Depto 202, sin arrendatario, con $315.000 impagos (ordinario $300.000 y fondo $15.000)
- Cuando el administrador registra una transferencia de $100.000 con referencia "transferencia" y `paid_on` 2026-11-05 (clave de envío K1)
- Y después registra otra transferencia de $100.000 con la misma referencia "transferencia" y `paid_on` 2026-11-06 (clave de envío K2)
- Entonces el segundo formulario muestra "Ya existe un pago de $100.000 por transferencia con la referencia "transferencia" (Depto 202, 05-11-2026). Revisa que no sea un duplicado" y permite guardar.
- Y quedan **dos** pagos, ambos imputados al ordinario de `2026-10`, que queda en $100.000 pendiente más el fondo de $15.000: saldo 315.000 − 200.000 = $115.000.
- Cuando el envío K2 llega de nuevo (doble clic)
- Entonces se devuelve el mismo pago K2, no se crea un tercero y el saldo sigue en $115.000.

**CA-32 · Pago manual en una unidad con arrendatario vigente (Comunidad A)**

- Dado el estado de CA-22 después de emitir `2026-11` el 2026-12-01: ámbito `owner` con $262.500 de `2026-10` (vencido el 2026-11-11) y ámbito `occupancy` O-1 con $262.500 de `2026-11` (vence el 2026-12-11)
- Cuando el 2026-12-04 el administrador registra una transferencia de $262.500 sin elegir a qué deuda aplicarla
- Entonces el registro se rechaza con 422 `SCOPE_REQUIRED` y "Elige a qué deuda aplicar el pago", y no se escribe nada.
- Cuando la registra con "Ambos": Propietario $100.000 y Arrendatario $162.500
- Entonces se registran **dos** `PAYMENT` con `origin = manual` ($100.000 en `owner` y $162.500 en `occupancy` O-1), agrupados por la clave de idempotencia del registro, por un total de $262.500.
- Y en `owner` se imputan $100.000 al ordinario vencido de `2026-10`, que queda en $150.000 más el fondo de $12.500: saldo del ámbito $162.500.
- Y en `occupancy` O-1 se imputan $162.500 al ordinario de `2026-11`, que queda en $87.500 más el fondo de $12.500: saldo del ámbito $100.000.
- Y el arrendatario ve "Registrado por la administración · $162.500 · 04-12-2026 · transferencia", sin el pago de $100.000 del ámbito `owner` ni el total de $262.500.
- Cuando el administrador anula el pago de $162.500
- Entonces la vista previa y la anulación incluyen los dos pagos del grupo: se registran dos reversos, uno en cada ámbito, y los saldos vuelven a $262.500 en `owner` y $262.500 en `occupancy` O-1. No se puede anular uno solo.

**CA-33 · Anular un gasto de un periodo emitido (Comunidad A)**

- Dado `2026-10` emitido como en CA-1, con el Depto 101 pagado completo ($210.000) y el Depto 202 impago ($315.000)
- Cuando el 2026-11-20 el administrador anula el gasto "Aseo y artículos" de $50.000 sin indicar motivo
- Entonces se rechaza con "Indica el motivo de la anulación" y nada cambia.
- Cuando lo anula con el motivo "No correspondía a la comunidad"
- Entonces el sistema recalcula con la foto de `2026-10`: O = $950.000 y F = (950.000 × 500 + 9.999) div 10.000 = 475.009.999 div 10.000 = $47.500.
- Y se generan en el borrador vigente `2026-11` estas notas de crédito, en el ámbito de cada cargo:

  | Unidad | Ordinario correcto | Nota ordinario | Fondo correcto | Nota fondo |
  | --- | --- | --- | --- | --- |
  | Depto 101 | $190.000 | −$10.000 | $9.500 | −$500 |
  | Depto 102 | $237.500 | −$12.500 | $11.875 | −$625 |
  | Depto 201 | $237.500 | −$12.500 | $11.875 | −$625 |
  | Depto 202 | $285.000 | −$15.000 | $14.250 | −$750 |
  | **Suma** | **$950.000** | **−$50.000** | **$47.500** | **−$2.500** |

- Y el Depto 101 queda con $10.500 a favor (saldo −$10.500), porque su cargo ya estaba pagado y no tiene otra deuda.
- Y el Depto 202 queda con ordinario $285.000 y fondo $14.250 pendientes: saldo $299.250.
- Y el gasto aparece como "Anulado", con su motivo y su monto original de $50.000. Ningún movimiento de `2026-10` cambia.

**CA-34 · Anular el único gasto de un grupo (Comunidad B)**

- Dado `2026-10` emitido como en CA-16 (extraordinario $100.000 por casa; ordinario y fondo como en CA-2), con la Casa 1 pagada completa ($133.334) y la Casa 2 impaga ($133.333)
- Cuando el administrador anula el extraordinario de $300.000, con el motivo "Obra aprobada dos veces"
- Entonces el grupo (extraordinario, partes iguales) queda en $0 y el cargo correcto de cada casa es $0.
- Y se crea una nota de crédito de −$100.000 en la cuenta `extraordinario` para cada casa. El ordinario y el fondo ($4.762) no cambian.
- Y la Casa 1 queda con $100.000 a favor y la Casa 2 queda con $33.333 pendientes ($31.746 de ordinario y $1.587 de fondo).

**CA-35 · Webpay iniciado antes del término de la ocupación y confirmado después (Comunidad A)**

- Dado el estado de CA-22 después de emitir `2026-11` el 2026-12-01: ámbito `owner` con $262.500 de `2026-10` (vencido) y ámbito `occupancy` O-1 con $262.500 de `2026-11` (vence el 2026-12-11)
- Cuando el 2026-12-05 a las 10:00 el arrendatario inicia un pago Webpay de $262.500
- Y a las 10:05 el administrador registra el término de O-1 con fecha 2026-12-04
- Entonces el administrador ve "Hay un pago en línea en curso del arrendatario. Si se confirma, se aplicará a la deuda de la unidad".
- Y se traspasan al ámbito `owner` el ordinario ($250.000) y el fondo ($12.500) de `2026-11`, que conservan su vencimiento del 2026-12-11. El ámbito `owner` queda en $525.000 y `occupancy` O-1 en $0.
- Y el arrendatario pierde el acceso desde ese momento.
- Cuando a las 10:08 Transbank confirma $262.500 (`paid_on` 2026-12-05)
- Entonces el crédito se registra en `occupancy` O-1, queda a favor y, en la misma transacción, se traspasa al ámbito `owner`.
- Y en `owner` se imputa con el orden de F-5 al capital vencido de `2026-10`: ordinario $250.000 y fondo $12.500.
- Y el ámbito `owner` queda en $262.500 (lo traspasado de `2026-11`) y `occupancy` O-1 en $0, sin deuda ni saldo a favor.

**CA-36 · Nota de crédito sobre un cargo de una ocupación terminada (Comunidad A)**

- Dado el estado final de CA-35, con `2026-11` emitido con los gastos de CA-1
- Cuando el 2026-12-15 el administrador corrige la electricidad de `2026-11` de $180.000 a $170.000
- Entonces la nota de crédito del Depto 102 es −$2.500 de ordinario y −$125 de fondo, como en CA-13, y se registra en el ámbito `occupancy` O-1, que es el del cargo ajustado.
- Y como ese cargo ya estaba saldado por el traspaso, se liberan $2.625, que quedan a favor en `occupancy` O-1 y se traspasan en la misma transacción al ámbito `owner`.
- Y en `owner` se imputan al capital vencido más antiguo: el ordinario traspasado de `2026-11` (vencido el 2026-12-11) queda en $247.375, más el fondo de $12.500: saldo $259.875.
- Y `occupancy` O-1 sigue en $0, sin deuda ni saldo a favor.

**CA-37 · Ingreso y término retroactivos de un arrendatario (Comunidad A)**

- Dado que el Depto 102 no tiene arrendatario vigente y que `2026-11` se emitió el 2026-12-01 con $262.500 en el ámbito `owner`, impago
- Cuando el 2026-12-03 el administrador registra la ocupación O-2 con fecha de ingreso 2026-11-15
- Entonces ve "La fecha de ingreso es anterior a hoy. Los cargos ya emitidos no cambian de responsable".
- Y el cargo de `2026-11` sigue en el ámbito `owner`. El arrendatario de O-2 ve saldo $0 y recibe 404 si pide ese cargo.
- Cuando se emite `2026-12` el 2027-01-01 con $262.500 para el Depto 102
- Entonces ese cargo va al ámbito `occupancy` O-2.
- Cuando el 2027-01-10 el administrador registra el término de O-2 con fecha 2026-12-31, sin pagos
- Entonces el traspaso se hace el 2027-01-10: los $262.500 de `2026-12` pasan al ámbito `owner`, que queda en $525.000, y `occupancy` O-2 queda en $0.
- Y el ex arrendatario recibe 404 desde el 2027-01-10.

**CA-38 · Unidad con arrendatario sin propietario registrado (Comunidad A)**

- Dado el borrador `2026-10` de CA-1 y que el Depto 102 tiene un arrendatario con ocupación vigente O-3 y ningún propietario registrado
- Cuando el administrador pide la vista previa de emisión
- Entonces ve "Unidades sin propietario registrado: Depto 102. Su aviso se emitirá a nombre de 'Propietario sin registrar'", y la emisión no se bloquea.
- Cuando emite el 2026-11-01
- Entonces los cargos son los de CA-1 (total emitido $1.050.000) y los $262.500 del Depto 102 van al ámbito `occupancy` O-3.
- Y el aviso legal del Depto 102 dice "Propietario: sin registrar" y no se notifica a ningún propietario.
- Y el arrendatario recibe "Tienes un nuevo cobro de gasto común de octubre de 2026. Vence el 11-11-2026" y ve $262.500 en su ámbito.

**CA-39 · Emisión confirmada contra la versión del borrador (Comunidad A)**

- Dado el borrador `2026-10` de CA-1
- Cuando un administrador pide la vista previa el 2026-11-01 y recibe la versión v1, con total emitido $1.050.000
- Y antes de confirmar, otro administrador agrega al borrador un gasto (ordinario, alícuota) "Jardinería" de $10.000, que deja el borrador en la versión v2
- Y el primer administrador confirma la emisión con v1
- Entonces la respuesta es 409 con "El borrador cambió desde la vista previa. Revisa la nueva vista previa antes de emitir", `2026-10` sigue en borrador y no se crea nada.
- Cuando pide una vista previa nueva (v2) y la confirma
- Entonces O = $1.010.000 y F = (1.010.000 × 500 + 9.999) div 10.000 = 505.009.999 div 10.000 = $50.500, y los cargos son:

  | Unidad | Ordinario | Fondo | Total |
  | --- | --- | --- | --- |
  | Depto 101 | $202.000 | $10.100 | $212.100 |
  | Depto 102 | $252.500 | $12.625 | $265.125 |
  | Depto 201 | $252.500 | $12.625 | $265.125 |
  | Depto 202 | $303.000 | $15.150 | $318.150 |
  | **Suma** | **$1.010.000** | **$50.500** | **$1.060.500** |

- Y si una vista previa pedida el 2026-10-31 se confirma el 2026-11-01, la respuesta también es 409, porque cambió la fecha de emisión.
- Y con el flag `billing.interest` activo, un pago registrado en la comunidad entre la vista previa y la confirmación también produce 409. Con el flag apagado, no.

**CA-40 · Anulación de un pago confirmada contra su estado (Comunidad A)**

- Dado el escenario de CA-12 antes de anular: el Depto 202 (ámbito `owner`) tiene P1 ($315.000, cheque, `origin = manual`, pago sin grupo) imputado a todo `2026-10` y P2 ($100.000, `origin = manual`) a favor
- Cuando el 2026-11-20 el administrador pide la vista previa de la anulación de P1 y recibe el `previewHash` h1, con un saldo resultante de $215.000
- Y antes de confirmar, otro administrador registra un pago en efectivo de $15.000 para el Depto 202, que queda a favor
- Y el primer administrador confirma con h1 y una clave de idempotencia nueva
- Entonces la respuesta es 409 `PREVIEW_OUTDATED` con "La cuenta de la unidad cambió desde la vista previa. Revisa la nueva vista previa antes de anular" y no se escribe nada.
- Cuando pide una vista previa nueva (h2) y la confirma
- Entonces se registra el reverso de $315.000 en `2026-11` y se reimputan P2 ($100.000) y el pago en efectivo ($15.000) al ordinario de `2026-10`, que queda en $185.000 más el fondo de $15.000: saldo 315.000 − 115.000 = $200.000.
- Cuando otro administrador intenta anular P1 de nuevo
- Entonces la respuesta es 409 `PREVIEW_OUTDATED` con "El pago ya fue anulado".
- Y si P1 hubiera sido parte de un grupo "Ambos" (CA-32), la vista previa y la anulación habrían incluido todos los pagos del grupo.

**CA-41 · Intento Webpay en revisión resuelto por Soporte ComVive (Comunidad A)**

- Dado el estado de CA-5: el Depto 101 debe $110.000 (ordinario $100.000 y fondo $10.000 de `2026-10`, vencidos el 2026-11-11)
- Cuando el 2026-11-25 el propietario inicia un pago Webpay de $110.000 con la orden `OC-2026-0002` y Transbank autoriza $11.000
- Entonces no se registra ningún pago, el intento pasa a `in_review` y el saldo sigue en $110.000.
- Y el propietario ve "Tu pago está en revisión. Te avisaremos cuando se resuelva", con el número de orden.
- Y el administrador de la Comunidad A ve el intento en revisión, pero si intenta resolverlo recibe 403.
- Cuando el 2026-11-26 Soporte ComVive pide la vista previa de `register_authorized` y la confirma con su `previewHash` y un motivo
- Entonces se registra un `PAYMENT` con `origin = webpay` de $11.000, con `paid_on` 2026-11-25 y `external_ref` `OC-2026-0002`, en el borrador vigente `2026-11`, y el intento pasa a `resolved_paid`.
- Y se imputa al ordinario de `2026-10`, que queda en $89.000 más el fondo de $10.000: saldo $99.000.
- Y la lectura y la resolución quedan en auditoría, con la persona de Soporte y el motivo.
- Cuando Soporte intenta leer o resolver el mismo intento otra vez
- Entonces recibe 404, porque un intento en `resolved_paid` ya no está en su vista (EX-1).
- Y si en vez de registrar lo hubiera marcado para reverso (`mark_for_reversal`), no se registraría ningún pago, el intento pasaría a `reversal_pending`, el saldo seguiría en $110.000 y el propietario vería "Tu pago no se registró. Se solicitará la devolución del monto a Transbank". Al confirmar el reverso (`confirm_reversal`, con la referencia de Transbank), el intento pasaría a `reversed`.
- Y un intento en revisión que cubre dos ámbitos responde 422 `MULTI_SCOPE_REVIEW_REVERSAL_ONLY` con "Un pago que cubre dos deudas solo se puede marcar para reverso" si Soporte intenta registrarlo.
- Y si el intento siguiera en `in_review` al terminar el 2026-12-02, que es el quinto día hábil después del 2026-11-25, el 2026-12-03 se enviaría la alerta automática de plazo vencido a Soporte ComVive y el intento quedaría marcado "Plazo vencido" (F-16).

**CA-42 · Aislamiento del rol Soporte ComVive (EX-1)**

- Dada una persona con el rol `platform_support` y el intento en revisión de CA-41
- Cuando lee el intento
- Entonces recibe solo id del intento, `buy_order`, comunidad, código de la unidad, tipo de ámbito (`owner`), monto iniciado ($110.000), monto autorizado ($11.000), estado y códigos de Transbank, y fechas. La respuesta no trae nombre, RUT, teléfono, correo, deuda ni saldo.
- Cuando pide los cargos, los pagos, el saldo o el aviso del Depto 101, o la lista de residentes de la Comunidad A
- Entonces recibe 404 en todos los casos y no se entrega ningún dato.
- Y cada una de esas lecturas queda en auditoría.
- Dado un administrador con membresía solo en la Comunidad B
- Cuando lee el intento `OC-2026-0002` de la Comunidad A
- Entonces recibe 404.

**CA-43 · Otorgamiento de roles (Comunidad A)**

- Dado el administrador de la Comunidad A
- Cuando otorga el rol de comité al propietario del Depto 201, con la referencia "Asamblea ordinaria del 20-10-2026"
- Entonces el rol queda otorgado y en auditoría.
- Cuando intenta otorgar el rol de comité al arrendatario del Depto 102
- Entonces se rechaza con "El rol de comité solo se otorga a propietarios registrados de la comunidad".
- Cuando intenta otorgar el rol de administrador a cualquier persona, incluso en su propia comunidad
- Entonces recibe 403 y nada cambia.
- Dado un miembro del comité de la Comunidad A
- Cuando intenta otorgar el rol de comité a otra persona
- Entonces recibe 403.
- Dada una persona de Operaciones ComVive
- Cuando otorga el rol de administrador de la Comunidad A a una persona
- Entonces el rol queda otorgado y en auditoría.
- Cuando el administrador revoca el rol de comité del propietario del Depto 201
- Entonces desde ese momento recibe 403 en las pantallas y acciones del comité, y sigue viendo su unidad como residente propietario.

**CA-44 · Datos de copropietarios que ve el comité (Comunidad A)**

- Dado el estado de CA-22 después de emitir `2026-11`, y que el propietario del Depto 102 tiene RUT 12.345.678-5, teléfono y correo registrados
- Cuando un miembro del comité lee el registro de copropietarios
- Entonces para el Depto 102 recibe: nombre del propietario, alícuota 25,00 %, RUT `12.345.***-*`, ámbito propietario con deuda $262.500 y saldo a favor $0, y ámbito "Arrendatario" con deuda $262.500 y saldo a favor $0.
- Y la respuesta de la API no trae teléfono, correo, RUT completo ni nombre o RUT del arrendatario.
- Y la lectura queda en auditoría.
- Cuando el administrador lee el mismo registro
- Entonces recibe además el RUT completo, el teléfono, el correo y el nombre del arrendatario.

**CA-45 · Notificación automática al emitir y avisos sin notificar (Comunidad A)**

- Dado el borrador `2026-10` de CA-1, con un arrendatario con ocupación vigente en el Depto 102, y que el correo del propietario del Depto 101 rebota y no tiene la app instalada
- Cuando el administrador emite el 2026-11-01
- Entonces, al terminar la emisión, los propietarios de los Deptos 102, 201 y 202 reciben "Ya está disponible tu aviso de cobro de octubre de 2026. Vence el 11-11-2026".
- Y el arrendatario del Depto 102 recibe "Tienes un nuevo cobro de gasto común de octubre de 2026. Vence el 11-11-2026".
- Y el administrador ve la alerta "Avisos sin notificar: Depto 101" y puede reenviar el aviso.
- Y el vencimiento del Depto 101 sigue siendo el 2026-11-11.
- Y la emisión no se revierte por el error de notificación.

**CA-46 · RUT enmascarado en el PDF del aviso (Comunidad A)**

- Dado el aviso de `2026-10` del Depto 101, cuyo propietario tiene RUT 12.345.678-5
- Cuando lo descargan el propietario, el administrador o un miembro del comité
- Entonces en los tres casos el PDF muestra el RUT `12.345.***-*` y es el mismo archivo.
- Y en la pantalla de la app el propietario ve su RUT completo, 12.345.678-5.

**CA-47 · Vista del cobro del arrendatario y resumen de gastos (Comunidad A)**

- Dado el estado de CA-22 después de emitir `2026-11` el 2026-12-01, con los gastos de CA-1
- Cuando el arrendatario de O-1 abre el cobro de `2026-11`
- Entonces ve: Comunidad A, Depto 102, periodo `2026-11`, emitido el 01-12-2026, vence el 11-12-2026, alícuota 25,00 %, ordinario $250.000, fondo $12.500, saldo anterior $0, pagos recibidos $0, total a pagar $262.500 y 0 cuotas impagas.
- Y ve este resumen de gastos de la comunidad:

  | Subcategoría | Línea | Monto |
  | --- | --- | --- |
  | Administración | Remuneraciones del personal | $650.000 |
  | Uso o consumo | Electricidad áreas comunes | $180.000 |
  | Mantención | Mantención ascensor | $120.000 |
  | Mantención | Aseo y artículos | $50.000 |
  | **Gastos ordinarios** | | **$1.000.000** |
  | **Fondo de reserva** | | **$50.000** |

- Y no ve "Remuneración conserje" como línea propia, ni el nombre o el RUT del propietario, ni los $262.500 del ámbito `owner`, ni el total de la unidad ($525.000).
- Y si pide el aviso legal del Depto 102, recibe 404.
- Y el propietario ve el mismo resumen de gastos, con la misma línea agregada "Remuneraciones del personal".

**CA-48 · Cierre de un periodo (Comunidad A, H-6)**

- Dado `2026-10` emitido el 2026-11-01 como en CA-1, `2026-11` como borrador vigente, y el pago de $100.000 del Depto 101 de CA-5 (`paid_on` y `recorded_at` 2026-11-05)
- Cuando el 2026-11-30 a las 18:00 el administrador cierra `2026-10`
- Entonces `2026-10` queda `cerrado` y se guarda esta foto de saldos (todos en el ámbito `owner`, H-19):

  | Unidad | Ordinario | Fondo | Total |
  | --- | --- | --- | --- |
  | Depto 101 | $100.000 | $10.000 | $110.000 |
  | Depto 102 | $250.000 | $12.500 | $262.500 |
  | Depto 201 | $250.000 | $12.500 | $262.500 |
  | Depto 202 | $300.000 | $15.000 | $315.000 |
  | **Suma** | **$900.000** | **$50.000** | **$950.000** |

- Y la foto cuadra con el libro: $1.050.000 emitidos − $100.000 imputados = $950.000.
- Cuando el 2026-12-03 el administrador registra un pago de $315.000 del Depto 202 con `paid_on` 2026-11-20
- Entonces el pago queda en el borrador vigente y el saldo del Depto 202 pasa a $0 en el libro, pero la foto de cierre de `2026-10` sigue mostrando $315.000 para el Depto 202, porque solo considera imputaciones con `recorded_at` ≤ 2026-11-30 18:00.
- Cuando el administrador intenta cerrar `2026-10` otra vez con otra clave
- Entonces recibe 409 `PERIOD_ALREADY_CLOSED` con "El periodo ya está cerrado". Con la misma clave, recibe el resultado original.
- Cuando intenta cerrar `2026-11`, que está en borrador
- Entonces recibe 409 `PERIOD_NOT_ISSUED` con "Solo se puede cerrar un periodo emitido".
- Cuando intenta agregar un gasto a `2026-10`
- Entonces recibe 409 `PERIOD_NOT_EDITABLE` con "El periodo 2026-10 está cerrado. Registra el movimiento en el borrador vigente".

**CA-49 · Total de la unidad en el aviso legal con saldo a favor en un ámbito (Comunidad A, H-8)**

- Dado el estado de CA-22 después de emitir `2026-11` el 2026-12-01: ámbito `owner` con $262.500 de `2026-10` y ámbito `occupancy` O-1 con $262.500 de `2026-11`
- Y que el 2026-12-05 el arrendatario paga $300.000: se imputan $262.500 a `2026-11` y quedan $37.500 a favor en `occupancy` O-1
- Cuando se emite `2026-12` el 2027-01-01 sin gastos (como en CA-20, flag apagado)
- Entonces el aviso legal al propietario muestra:

  | Ámbito | Deuda bruta | Saldo a favor |
  | --- | --- | --- |
  | `owner` | $262.500 | $0 |
  | `occupancy` O-1 | $0 | $37.500 |
  | **Total adeudado de la unidad** | **$262.500** | |
  | **Saldo a favor (no compensado)** | | **$37.500** |

- Y el total adeudado de la unidad es $262.500, no $225.000.
- Y el arrendatario ve en su comprobante solo su ámbito: deuda $0 y saldo a favor $37.500.

**CA-50 · "Vencido" se evalúa a la fecha de pago, no a la de registro (Comunidad A, H-1)**

- Dado que el Depto 101 tiene pagado todo `2026-10` salvo una multa de $30.000, cargada como cargo directo en `2026-10` y vencida el 2026-11-11
- Y que `2026-11` se emitió el 2026-12-01 con ordinario $200.000 y fondo $10.000 (vencen el 2026-12-11)
- Cuando el 2026-12-15 el administrador registra una transferencia de $50.000 con `paid_on` 2026-12-05
- Entonces la fecha de referencia es máx(2026-12-05, fecha de creación del débito):
  - Para la multa: 2026-12-05. Está vencida.
  - Para los cargos de `2026-11`: 2026-12-05. No están vencidos.
- Y la imputación es: multa vencida $30.000 (paso 3), y luego ordinario `2026-11` no vencido $20.000 (paso 4).
- Y quedan pendientes ordinario $180.000 y fondo $10.000: saldo 240.000 − 50.000 = $190.000.
- Y no es la imputación que daría evaluar al 2026-12-15 (ordinario vencido `2026-11` $50.000, con la multa intacta), aunque el saldo total sea el mismo.

**CA-51 · Orden total entre cargos del mismo periodo y cuenta (Comunidad A, H-7)**

- Dado que el Depto 101 solo debe `2026-11`, emitido el 2026-12-01 con ordinario prorrateado $200.000, cargo directo de agua (ordinario) $24.000 y fondo $10.000, todo con vencimiento el 2026-12-11 (deuda $234.000)
- Cuando paga $210.000 con `paid_on` 2026-12-05
- Entonces la imputación, con la clave de F-5 (periodo → cuenta → vencimiento → tipo → `recorded_at` → identificador), es: ordinario prorrateado $200.000 y luego agua $10.000.
- Y quedan pendientes agua $14.000 y fondo $10.000: saldo $24.000.
- Y repetir el cálculo con los mismos datos da exactamente las mismas imputaciones.

**CA-52 · Recálculo de un tramo cobrado con $0 y avance de la ventana (Comunidad A, flag activo, H-4)**

- Dado el flag activo desde el 2026-11-01, una tasa del reglamento de 1200 pb y un tope de 1500 pb
- Y que el Depto 201 pagó `2026-10` completo ($262.500) con un cheque registrado con `paid_on` 2026-11-08 (pago P)
- Cuando se emite `2026-11` el 2026-12-01 con $262.500 para el Depto 201 (vence el 2026-12-11)
- Entonces el ámbito `owner` del Depto 201 no tenía capital en mora del 2026-11-12 al 2026-11-30, así que el interés es $0 y no se crea cargo.
- Y aun así la ventana avanza: el último día cobrado del ámbito pasa a ser el 2026-11-30.
- Cuando el 2026-12-10 se anula P porque el cheque fue protestado
- Entonces el capital de `2026-10` vuelve a estar en mora desde el 2026-11-12, y el recálculo del tramo del 2026-11-12 al 2026-11-30 da piso(262.500 × 19 × 1200 / 3.650.000) = piso(1.639,7260…) = $1.639.
- Y como ese tramo no tenía cargo, se crea un **cargo de intereses nuevo** de $1.639, sin `adjusts_entry_id`, en el borrador vigente `2026-12`, en el ámbito `owner`, con referencia al tramo del 2026-11-12 al 2026-11-30.
- Y el saldo del Depto 201 queda en 262.500 + 262.500 + 1.639 = $526.639.
- Cuando se emite `2026-12` el 2027-01-01 sin más pagos
- Entonces la ventana empieza el 2026-12-01 y no vuelve al 2026-11-12. El interés suma $262.500 de `2026-10` durante 31 días (del 2026-12-01 al 2026-12-31) y $262.500 de `2026-11` durante 20 días (del 2026-12-12 al 2026-12-31): piso((262.500 × 31 + 262.500 × 20) × 1200 / 3.650.000) = piso(16.065.000.000 / 3.650.000) = piso(4.401,3698…) = $4.401.
- Y el cargo de $1.639 vence con el aviso de `2026-12`, el 2027-01-11 (regla H-5).

## Casos borde

- **Unidad con peso 0:** no tiene cargo ni movimiento y su aviso muestra $0 (CA-18).
- **Grupo con total > 0 y todos los pesos en 0:** la emisión se bloquea (regla A-3.2).
- **Comunidad sin unidades:** no se puede emitir.
- **Cambio de propietario a mitad de mes:** no hay prorrateo por días. El aviso va al propietario vigente a la fecha de emisión y el anterior pierde el acceso (CA-21).
- **Cambio de arrendatario:** los cargos emitidos desde el ingreso del nuevo arrendatario van a su ámbito. La deuda y el saldo a favor del arrendatario anterior pasan al ámbito `owner`, y el arrendatario anterior pierde el acceso (regla F-9).
- **Saldo a favor en un ámbito y deuda en otro:** no se compensan automáticamente. El aviso legal los muestra por separado (regla F-9). Al terminar la ocupación, todo pasa al ámbito `owner` y ahí se compensan (regla F-6).
- **Pago duplicado:**
  - Webpay: idempotente (CA-10).
  - Manual: se advierte y se corrige con una anulación (CA-11).
- **Pago mayor a la deuda:** el excedente queda a favor y se aplica en la emisión siguiente (CA-9).
- **Pago anterior a la primera emisión:** queda a favor en el borrador vigente.
- **Pago con `paid_on` futuro:** se rechaza.
- **Confirmación Webpay que llega después de cerrar el periodo de su mes:** va al borrador vigente, con su `paid_on` real. Si su fecha efectiva cae en días con intereses ya cobrados, se genera una nota de crédito de intereses (regla E-10).
- **Anulación de un pago antiguo:** el reverso va al borrador vigente, sus cargos vuelven a quedar pendientes y se reimputan los saldos a favor (CA-12 y CA-27). Si afecta días ya cobrados, se genera un débito de ajuste de intereses (regla E-10 y CA-28).
- **Crédito con `paid_on` dentro de días ya cobrados:** se genera automáticamente una nota de crédito de intereses por la diferencia (CA-28).
- **Reimputación tardía:** la fecha efectiva es máx(`paid_on`, vencimiento del cargo), no la fecha en que se reimputa (CA-27).
- **Débito de ajuste:** vence con el aviso del borrador donde se registra (regla H-5 y CA-14).
- **Cambio de la tasa del reglamento:** se crea una versión nueva con fecha de inicio. Los días anteriores usan la versión anterior.
- **Año bisiesto:** los días de 2028 pesan 1/366 (regla E-6).
- **Periodo sin gastos:** se emite con confirmación (CA-20).
- **Corrección de un periodo emitido o cerrado:** se hace con ajustes en el borrador vigente (CA-13 y CA-14).
- **Reclasificar un gasto:**
  - Si cambia de cuenta o de base, se generan dos ajustes con la fórmula H-2.
  - Si solo cambia la subcategoría, no hay movimiento (regla H-3).
- **Doble clic en "Emitir":** la emisión es idempotente (CA-25).
- **Emisión sin tasa CMF para algunos días:** se emite sin intereses y esos días se cobran después (regla E-7).
- **Activación del flag de intereses:** solo cuentan los días desde la fecha de activación (S-20).
- **Interés menor a $1:** no se crea cargo. Los días de la ventana sí se consideran cobrados (S-10).
- **Unidad nueva o cambio de alícuotas:** la foto de periodos anteriores no cambia. Un cambio de alícuotas requiere modificar el reglamento (fuera de alcance; P-10).
- **Monto con decimales o negativo en la API o en una importación:** se rechaza.
- **Propietario que paga la deuda del arrendatario:** puede elegir ese ámbito o "Ambas". Una transacción, un pago por ámbito, agrupados (regla F-12, CA-29 y CA-30).
- **Arrendatario que intenta pagar la deuda del propietario:** 404 (regla F-12, CA-30).
- **Pago en curso del propietario y del arrendatario a la vez:** el bloqueo es por (unidad, ámbito); solo choca si cubren el mismo ámbito (CA-30).
- **Pago manual en una unidad con arrendatario vigente:** el ámbito se elige siempre de forma explícita (CA-32).
- **Dos pagos manuales con la misma referencia:** son dos pagos; solo se advierte (regla F-2 y CA-31).
- **Gasto duplicado o que no debió existir en un periodo emitido o cerrado:** "Anular gasto" con notas de crédito (regla H-6, CA-33 y CA-34).
- **Corrección o reverso que apunta a un movimiento de una ocupación terminada:** se registra en ese ámbito y su resultado se traspasa en la misma transacción al ámbito `owner` (regla F-13, CA-36).
- **Webpay iniciado antes del término de la ocupación y confirmado después:** el crédito termina en el ámbito `owner` (regla F-13, CA-35).
- **Ingreso o término de arrendatario registrado con fecha pasada:** produce efecto desde su registro (regla F-14, CA-37).
- **Unidad con arrendatario y sin propietario registrado:** se emite con advertencia y aviso a nombre de "Propietario sin registrar" (regla F-15, CA-38).
- **Unidad sin propietario ni arrendatario registrados:** sus cargos van al ámbito `owner` y aplica la misma advertencia (regla F-15).
- **Otro administrador cambia el borrador entre la vista previa y la emisión:** 409 y nueva vista previa (regla A-7, CA-39).
- **Dos administradores anulan el mismo pago:** el segundo recibe 409 (regla A-7, CA-40).
- **Monto autorizado por Transbank distinto del iniciado:** el intento queda en revisión y lo resuelve Soporte ComVive (regla F-16, CA-41).
- **Pago manual tardío de un ex arrendatario:** se registra en el ámbito `owner`, porque ningún pago nuevo se dirige a una ocupación terminada (regla F-9); los intereses ya emitidos en el ámbito de la ocupación no se recalculan (regla E-11, P-26).
- **Notificación del aviso que no llega:** el vencimiento no cambia y la unidad aparece en "Avisos sin notificar" (regla G-6, CA-45).
- **Comunidad sin código de comercio Transbank:** solo pagos manuales; la app no ofrece pagar en línea (regla F-12).
- **Pago registrado tarde:** "vencido" se evalúa al `paid_on`, no al registro (regla F-5, CA-50).
- **Varios cargos del mismo periodo y cuenta:** orden total y determinista (regla F-5, CA-51).
- **Tramo de intereses cobrado con $0 que luego pasa a tener mora:** se crea un cargo de intereses nuevo (regla E-10, CA-52).
- **Ámbito sin capital en mora:** su ventana de intereses avanza igual en cada emisión (regla E-6, CA-52).
- **Saldo a favor en un ámbito y deuda en otro, en el aviso legal:** el total adeudado de la unidad es la suma de las deudas brutas (regla F-9, CA-49).
- **Monto sobre $9.999.999.999 o fondo sobre 50 %:** se rechaza (reglas B-6 y D-2).
- **Misma clave de idempotencia con otro cuerpo:** 422 `IDEMPOTENCY_KEY_REUSED` (regla A-3.4).
- **Comunidad con un solo trabajador:** la línea agregada "Remuneraciones del personal" revela su remuneración (regla G-8, P-23).

## Fuera de alcance

- Gastos en UF (P-8).
- Prorrateo por lecturas de consumo. En el MVP el consumo se ingresa como monto directo por unidad.
- Prorrateo por sectores (Ley 21.442, art. 38).
- Multas automáticas.
- Convenios de pago (art. 6).
- Suspensión de servicios (art. 36).
- Devolución de saldos a favor.
- Extraordinarios en cuotas automáticas.
- Presupuesto anual, provisiones y fondo operacional inicial.
- Inversión del fondo.
- Cobranza judicial, certificado de deuda y documentos tributarios.
- Conciliación bancaria y saldo de caja automático.
- Elección de la imputación por parte del pagador dentro de un ámbito. El propietario sí elige el ámbito (regla F-12), pero no a qué deuda del ámbito se aplica.
- Pagos parciales en línea: el pago Webpay es siempre por la deuda completa de cada ámbito elegido.
- Anulación de pagos Webpay registrados. La resolución `mark_for_reversal` de un intento en revisión (regla F-16) no registra un pago. La anulación en Transbank la ejecuta Soporte ComVive y en ComVive solo se registra su referencia (`confirm_reversal`; P-31).
- Devoluciones entre el propietario y un ex arrendatario.
- Recaudación de fondos por ComVive y Webpay Plus Mall. Cada comunidad tiene su propio código de comercio y el abono llega a su cuenta (decisión del líder, 2026-11-07). El alta del comercio en Transbank es parte de la puesta en marcha de cada comunidad, no de este módulo.
- Carga de saldos de apertura, que irá en la especificación de migración.

## Supuestos (a validar)

| Id | Supuesto | Fuente o razonamiento |
| --- | --- | --- |
| S-1 | Solo el administrador emite y cierra. El comité tiene solo lectura. | La ley encarga el cobro al administrador (Ley 21.442, art. 31). No se encontró una norma que exija que el comité apruebe la emisión. |
| S-2 | Se cobra "mes vencido". | Práctica habitual de las administraciones en Chile. |
| S-3 | El desempate usa `sort_order` único por comunidad. El orden natural del código solo propone el valor inicial. | `docs/qa/comunidades-simuladas.md` y `docs/arquitectura.md` §4. |
| S-4 | Hay un fondo por cada grupo ordinario con base alícuota o partes iguales. No se aplica recargo a los cargos directos, a los extraordinarios, a los intereses ni a las multas. | Ley 21.442, art. 8 letra d: recargo "sobre los gastos comunes ordinarios". Excluir los consumos directos es una decisión prudente (P-3). |
| S-5 | El mínimo de 5 % aplica a toda comunidad. | Ley 21.442, art. 39. Queda P-2 para viviendas sociales. |
| S-6 | `F_g` se redondea hacia arriba al peso (techo). | Con mitad hacia arriba, el fondo podía quedar bajo el mínimo legal de 5 % (Ley 21.442, art. 39), como en la Comunidad D (43.827 < 43.827,15). |
| S-7 | Los 10 días del plazo son corridos y el vencimiento no se corre si cae en día inhábil. | Ley 21.442, art. 7, y Código Civil, art. 50. |
| S-8 | Las multas son manuales. | Ley 21.442, art. 8 letra e: la ley remite las multas al reglamento. |
| S-9 | Solo el capital devenga interés; los intereses y las multas no. El fondo de reserva sí es parte del capital. | Ley 18.010, art. 9 (anatocismo), y Ley 21.442, art. 37 (el régimen de cobro se extiende al fondo). |
| S-10 | Interés simple diario con base actual/actual y tasas anuales. Una tasa mensual del reglamento se multiplica por 12. El interés se calcula al emitir, una vez por ámbito, y se trunca al peso. | El tope legal es una tasa anual (Ley 21.442, art. 7). Los certificados de la CMF expresan las tasas en moneda chilena no reajustable "en forma lineal anual", así que un interés simple diario no supera el tope en meses de 31 días (CA-8). ComunidadFeliz también calcula el interés devengado día a día. |
| S-11 | El tope es el 50 % de la tasa de interés corriente CMF vigente cada día. Es un dato global que carga el equipo de ComVive. | Ley 21.442, art. 7. Certificados CMF publicados en el Diario Oficial. |
| S-12 | ComVive imputa los pagos como lo haría el acreedor, con este orden: intereses vencidos → capital vencido (del más antiguo al más reciente) → multas vencidas → lo no vencido. El pagador no elige. | Código Civil: art. 1595 (los intereses se pagan antes que el capital, salvo que el acreedor consienta otra cosa); art. 1596 (el deudor puede elegir la deuda, pero no preferir una no devengada a una devengada; si no elige, imputa el acreedor en la carta de pago); art. 1597 (sin imputación de ninguna de las partes, se prefiere la deuda devengada). No dejar elegir al deudor es una restricción del MVP (P-7). Poner las multas después del capital y el orden entre cuentas son convenciones propias. |
| S-14 | El arrendatario ve solo su ámbito. El ex propietario y el ex residente pierden el acceso (404) y su historial se entrega a pedido. | Ley 21.719 (minimización de datos) y `docs/qa/plan-de-pruebas.md` ISO-8. |
| S-15 | El aviso tiene contenido adicional al mínimo legal y muestra las remuneraciones agregadas. | Práctica de mercado (boleta de ComunidadFeliz) y protección de datos del personal. |
| S-16 | El administrador ingresa a mano el saldo de caja. | Ley 21.442, art. 31. El MVP no tiene integración bancaria. |
| S-17 | Todo movimiento posterior a la emisión va al borrador vigente, con `paid_on` y `recorded_at`. | Hace cumplir la inmutabilidad de periodos con una sola regla (`docs/arquitectura.md` §4). |
| S-18 | Deuda y saldo a favor nunca coexisten en un mismo ámbito, y las notas de crédito se imputan primero al cargo que ajustan. | Consistencia del estado de cuenta. Convención propia. |
| S-19 | Cada débito tiene un ámbito fijo: el del ocupante responsable a la fecha de emisión, o el del movimiento al que apunta. Los pagos del arrendatario solo se imputan a su ámbito. El aviso legal va al propietario y muestra cada ámbito por separado, sin compensarlos. Al terminar la ocupación, todo pasa al ámbito `owner`. | Ley 21.442, art. 6 (la deuda sigue al dueño) y minimización de datos (Ley 21.719). Convención propia para separar responsables (P-14). |
| S-20 | No se cobran intereses por días anteriores a la activación del flag o de la tasa en la comunidad. | Evita cobros retroactivos sorpresivos. |
| S-21 | La categoría CMF por defecto para el tope es el interés corriente de operaciones no reajustables en moneda nacional de menos de 90 días. | El gasto común es una obligación mensual en pesos, sin reajuste y de corto plazo (vence a los 10 días). La Ley 18.010, art. 6, define el interés corriente por tipo de operación, y la CMF publica esa categoría en sus certificados. No se encontró una fuente que fije la categoría para la Ley 21.442; queda por validar (P-5). |
| S-22 | Los intereses de días ya cobrados se recalculan en ambos sentidos: nota de crédito si baja el capital, débito de ajuste si sube. | Evita cobrar intereses sobre deuda pagada y no perder intereses de pagos anulados. Usa la misma fórmula de ajustes (regla H-2). |
| S-23 | La fecha efectiva de una imputación es máx(`paid_on`, vencimiento del cargo). | El dinero se recibió en `paid_on`. Antes del vencimiento no hay mora, así que adelantar la fecha no cambia el interés. |
| S-24 | Un cobro que cubre dos ámbitos es una sola transacción (un intento Webpay o un registro manual) que genera un `PAYMENT` por ámbito, agrupados, con el reparto fijado al iniciar. Lo que sobra en un ámbito queda a favor en ese ámbito. El grupo se anula entero. | Decisión del líder (2026-11-07) de que el propietario pueda pagar ambos ámbitos. Es el modelo de `docs/arquitectura.md` §4 (ADR 0007): una transacción Webpay, un `buy_order` y un abono en la cartola, y un pago por ámbito que mantiene el invariante F-6 sin compensar ámbitos. La unicidad (`origin`, `external_ref`, ámbito) permite dos pagos con el mismo `buy_order`. Convención propia. |
| S-25 | El arrendatario ve los pagos de su ámbito con monto, fecha, medio y quién pagó ("Pagado por ti", "Pagado por el propietario"), pero no la deuda del ámbito `owner` ni el total de un intento de dos ámbitos. Un pago manual se muestra como "Registrado por la administración". | "Pagado por el propietario": decisión del líder (2026-11-07, P-22 cerrada). No mostrar el total ni la deuda del propietario: minimización de datos (Ley 21.719) y S-19. La etiqueta del pago manual es un supuesto del analista: el administrador registra el ámbito, no siempre sabe quién transfirió. |
| S-26 | Un ámbito de ocupación terminada queda siempre en $0: lo que se registra en él después del término se traspasa en la misma transacción al ámbito `owner`. El capital traspasado conserva cuenta, periodo y vencimiento, y para el interés cuenta en `owner` desde el día siguiente al último día cobrado en la ocupación. | Ley 21.442, art. 6 (la deuda es de la unidad y sigue al dueño). Mantiene la trazabilidad (cada movimiento apunta a su original) sin dejar saldos en un ámbito que nadie ve. Convención propia (P-21, P-26). |
| S-27 | Los ingresos y términos de ocupación con fecha pasada producen efecto desde su registro: no cambian el ámbito de lo ya emitido ni recalculan intereses. | Hace cumplir el ámbito fijo (S-19) y la inmutabilidad de periodos (regla 6 de `CLAUDE.md`). Las diferencias entre propietario y arrendatario por el periodo no registrado son un asunto privado entre ellos. Confirmado por el líder el 2026-11-07 (P-27 cerrada). |
| S-28 | Una unidad sin propietario registrado no bloquea la emisión: se emite con advertencia y su aviso dice "Propietario sin registrar". | Bloquear toda la comunidad por una unidad atrasa el cobro de todas las demás. La ley obliga a llevar un registro de copropietarios, así que la advertencia empuja a completarlo (Ley 21.442; artículo por verificar en P-1). Validez del aviso en P-20. |
| S-29 | La notificación del aviso se envía automáticamente al emitir, así que la fecha del aviso de cobro es la fecha de emisión y el vencimiento se cuenta desde ella. | Ley 21.442, art. 7: el plazo corre desde el aviso de cobro. Notificar en la misma emisión hace coincidir ambas fechas. Si la ley exige notificación efectiva por unidad, queda en P-18. |
| S-30 | El PDF del aviso lleva siempre el RUT enmascarado (`12.345.***-*`). | El PDF se genera una sola vez (G-5) y circula, así que no puede depender de quién lo descarga. Minimización de datos (Ley 21.719) y formato de enmascarado de `docs/design/mapa-de-usuarios.md`. Si el mérito ejecutivo exige el RUT completo, queda en P-19. |
| S-31 | El resumen de gastos para residentes muestra cada gasto, salvo las remuneraciones del personal, que van en una sola línea. Los honorarios del administrador van en una línea propia. El arrendatario ve el mismo resumen. | Ley 21.442, art. 31 (el aviso informa ingresos y egresos) y protección de datos del personal (Ley 21.719). ComunidadFeliz publica el detalle de egresos en la boleta. El arrendatario paga los gastos y tiene interés en su composición. P-23. |
| S-32 | Soporte ComVive tiene solo dos resoluciones de fondo: registrar por el monto autorizado o marcar para reverso (y luego confirmar el reverso). Un intento de dos ámbitos solo se puede reversar. | Quién resuelve y el plazo de 5 días hábiles con alerta automática son decisiones del líder (2026-11-07; P-17 cerrada). Limitar las resoluciones evita decisiones contables fuera de la comunidad, y reversar los intentos de dos ámbitos evita repartir un monto distinto entre deudores distintos. Convención propia. |
| S-33 | El comité ve la deuda del ámbito del arrendatario como "Arrendatario", sin nombre ni RUT. | Decisión del líder (2026-11-07) para copropietarios; para los arrendatarios se extiende el mismo criterio de minimización (Ley 21.719): el comité supervisa la cobranza y necesita el monto, no la identidad. P-25. |
| S-34 | El administrador otorga el rol de comité solo a propietarios registrados de la comunidad, con una referencia obligatoria a la asamblea que lo eligió. | El comité lo integran copropietarios elegidos por la asamblea (glosario de `CLAUDE.md`; Ley 21.442, artículo por verificar en P-1). La referencia deja trazabilidad del origen del rol. P-25. |
| S-35 | "Anular gasto" es una corrección con monto correcto $0, calculada con la fórmula H-2, y el gasto queda visible como "Anulado". | Reutiliza la fórmula de ajustes (H-2) y la inmutabilidad de periodos (regla 6 de `CLAUDE.md`) sin crear un mecanismo nuevo. Convención propia. |
| S-36 | La clave de idempotencia es única por persona, endpoint y clave (ligada a la comunidad en las rutas de comunidad) y se conserva 30 días. Reutilizarla con otro cuerpo responde 422 `IDEMPOTENCY_KEY_REUSED`. | `docs/arquitectura.md` §4 (`IDEMPOTENCY_KEY`, ADR 0003). 30 días cubre de sobra los reintentos de red y de doble clic. |
| S-37 | Ningún monto ingresado ni la suma de gastos de un periodo supera $9.999.999.999. El motor calcula con `bigint`. | Protección contra errores de digitación. El límite de 2^53 − 1 de `number` se supera con T > $9.007.199.254 (H-11), así que el `bigint` es obligatorio aunque haya tope (`docs/arquitectura.md` §1; ADR 0004). El valor del tope es una propuesta del analista (P-32). |
| S-38 | El fondo de reserva no puede superar 5000 pb (50 %). | La ley fija solo el mínimo (Ley 21.442, art. 39). El máximo es una protección contra digitar 5000 en vez de 500 (P-28). |
| S-39 | "Vencido" se evalúa a máx(`paid_on` del crédito, fecha de creación del débito), no a la fecha de registro. | Código Civil, art. 1596: no se puede preferir una deuda no devengada a una devengada, y eso se mide cuando se paga. Así el resultado no depende de cuándo el administrador digita el pago (P-30). |
| S-40 | El arrendatario descarga un "Comprobante de cobro" en PDF con el contenido de G-7. No es el aviso legal. | El arrendatario no es el deudor legal (Ley 21.442, art. 6), pero necesita un documento para su arriendo y sus gastos. Minimización de datos (Ley 21.719): no incluye nada del ámbito `owner`. |

El supuesto S-13 de la versión anterior (autorización de egresos del fondo) se eliminó por estar fuera del alcance de este módulo.

## Preguntas abiertas

- [ ] **P-1** (líder → abogado): verificar la numeración de los artículos de la Ley 21.442 contra bcn.cl y revisar si el DS N° 7 de 2025 del MINVU agrega requisitos al aviso de cobro, al fondo o a los intereses.
- [ ] **P-2** (abogado): ¿el mínimo de 5 % del fondo aplica también a las viviendas sociales o de interés público?
- [ ] **P-3** (contador): ¿los consumos directos (agua por remarcador) deben pagar el recargo del fondo?
- [ ] **P-4** (líder): ¿el comité debe aprobar la emisión o el cierre?
- [ ] **P-5** (abogado o contador): validar la categoría CMF por defecto (S-21) y si es correcto convertir una tasa mensual del reglamento multiplicándola por 12.
- [ ] **P-6** (abogado): ¿qué tipo de firma electrónica necesita el aviso para tener mérito ejecutivo (Ley 19.799)?
- [ ] **P-7** (contador y abogado): ¿es válido el orden de imputación de S-12? ¿Hay que permitir que el pagador elija a qué deuda aplicar su pago (Código Civil, art. 1596) o que cada comunidad configure el orden?
- [ ] **P-8** (líder): ¿el MVP necesita gastos en UF? Si es así, ¿con la UF de qué fecha se convierten?
- [ ] **P-10** (líder): ¿algún reglamento real usa alícuotas con más de 4 decimales de porcentaje, que `aliquot_e6` no puede representar?
- [ ] **P-11** (líder): ¿cómo se tratan los depósitos que llegan sin unidad identificada?
- [ ] **P-14** (abogado): ¿es aceptable que el pago de un arrendatario no se impute a la deuda anterior del propietario, aunque esa deuda sea más antigua y esté vencida? Ver S-19 frente a la regla del Código Civil, art. 1597.
- [ ] **P-18** (abogado): el plazo de pago del art. 7 de la Ley 21.442 corre "desde el aviso de cobro". ¿Basta la emisión con notificación automática en la app y por correo (S-29), o corre desde la notificación efectiva de cada unidad? ¿Qué pasa con las unidades en "Avisos sin notificar"?
- [ ] **P-19** (abogado, junto con P-6): ¿el mérito ejecutivo del aviso de cobro (art. 32) exige el RUT completo del deudor en el documento, o basta el RUT enmascarado (S-30)?
- [ ] **P-20** (abogado): ¿tiene valor legal un aviso de cobro emitido a nombre de "Propietario sin registrar" (S-28)? ¿En qué artículo está la obligación del administrador de llevar el registro de copropietarios y ocupantes?
- [ ] **P-21** (abogado y contador): cuando un pago del arrendatario o una nota de crédito sobre sus cargos llega después del término de su ocupación, el monto termina en el ámbito `owner` y beneficia al propietario (S-26). ¿Es aceptable, o ComVive debe dejar constancia de un saldo a devolver al ex arrendatario?
- [ ] **P-23** (abogado): si la comunidad tiene un solo trabajador, la línea "Remuneraciones del personal" revela su remuneración. ¿Es aceptable frente a la Ley 21.719, considerando el deber de rendición de cuentas? ¿El arrendatario, que no es copropietario, debe ver el resumen de gastos (S-31)?
- [ ] **P-24** (líder y arquitecto): ¿cómo se otorgan y revocan los roles de plataforma Soporte ComVive y Operaciones ComVive, y con qué controles (por ejemplo, autenticación reforzada y revisión periódica de accesos)?
- [ ] **P-25** (abogado y líder): ¿pueden integrar el comité el cónyuge o conviviente civil de un copropietario, o el representante de una persona jurídica propietaria (S-34)? ¿El comité debe ver la deuda del ámbito del arrendatario (S-33)?
- [ ] **P-26** (líder y contador): un pago manual tardío de un ex arrendatario, con `paid_on` anterior al término, se registra en el ámbito `owner` y no recalcula los intereses ya emitidos en el ámbito de la ocupación (E-11). ¿Es aceptable esa diferencia de intereses en el MVP?
- [ ] **P-28** (líder y contador): ¿es razonable el máximo de 50 % para el fondo de reserva (S-38), o hay reglamentos que fijan más?
- [ ] **P-29** (contador): con el techo por grupo (D-3), un grupo ordinario muy chico paga un fondo proporcionalmente mayor (O = $19 da F = $1, el 5,26 %). La diferencia máxima es $1 por grupo y periodo. ¿Es aceptable, o el techo debe aplicarse sobre el total ordinario del periodo?
- [ ] **P-30** (contador y abogado): ¿es correcto evaluar si una deuda está vencida a la fecha de pago (`paid_on`) y no a la de registro (S-39)?
- [ ] **P-31** (líder y arquitecto): ¿cómo se ejecuta la devolución en Transbank de un intento en `reversal_pending` (supuesto de la arquitectura: API de anulación de Webpay Plus, ADR 0007), en qué plazo, y cómo se avisa al pagador cuando se completa?
- [ ] **P-32** (líder): ¿es adecuado el monto máximo de $9.999.999.999 por monto ingresado y por periodo (S-37)?

Preguntas cerradas:

- **Decisiones del líder del proyecto (2026-11-07):**
  1. El propietario puede pagar desde la app el ámbito del arrendatario, el suyo o ambos (regla F-12).
  2. El administrador otorga el rol de comité y solo Operaciones ComVive otorga el de administrador (sección "Otorgamiento de roles").
  3. Soporte ComVive resuelve los intentos Webpay en revisión (regla F-16 y EX-1).
  4. El comité ve nombre, unidad, alícuota y deuda de los copropietarios, con RUT enmascarado y sin teléfonos ni correos.
  5. Un código de comercio Transbank por comunidad. El abono llega directo a la cuenta de la comunidad; sin código de comercio, la comunidad opera solo con pagos manuales (regla F-12).
- **P-15 (decisión del líder, 2026-11-07):** la prueba de oro D se actualiza al techo: fondo $43.828 y GOLD-D-04 $287.752 (CA-4). GOLD-CE (Comunidad C emitida por cuenta) queda aprobada como prueba de oro de la diferencia de ±1 peso por cuenta (regla C-6).
- **P-16:** EX-1 se documenta en el ADR 0006 "Usuarios de plataforma y excepción acotada al aislamiento", propuesto en `docs/arquitectura.md`.
- **P-17 (decisión del líder, 2026-11-07):** Soporte ComVive resuelve un intento en revisión en 5 días hábiles, con alerta automática al vencer (regla F-16). El procedimiento de devolución en Transbank sigue abierto en P-31.
- **P-22 (decisión del líder, 2026-11-07):** el arrendatario sabe quién pagó: ve "Pagado por el propietario", con monto, fecha y medio. No ve la deuda del ámbito `owner` ni el total de la transacción (regla F-12, S-25).
- **P-27 (decisión del líder, 2026-11-07):** un ingreso retroactivo rige desde que se registra. Los cargos ya emitidos quedan en el ámbito `owner` (regla F-14).
- **P-12:** los intereses de días ya cobrados se recalculan en ambos sentidos (regla E-10 y S-22).
- **P-9:** `docs/qa/comunidades-simuladas.md` ya separa la prueba de oro C y agrega la Comunidad D.
- **P-13:** el ex propietario pierde el acceso y su historial se entrega a pedido (S-14).

## Referencias

- **Ley 21.442, texto en LeyChile (BCN):** <https://www.bcn.cl/leychile/navegar?idNorma=1174663> (XML: <https://www.leychile.cl/Consulta/obtxml?opt=7&idNorma=1174663>). Artículos usados: arts. 2 N° 8 a 11, 6, 7 y 8 letras d y e.
- **Ley 21.442, Capítulo VI, en modulor.cl:** <https://modulor.cl/copropiedad/titulo-1/capitulo-vi/de-las-obligaciones-economicas/>. Artículos usados: arts. 31, 32, 36, 37, 38 y 39.
- **Reglamento DS N° 7 de 2025 (MINVU):** <https://www.diarioconstitucional.cl/2025/01/17/publican-reglamento-de-la-nueva-ley-de-copropiedad-inmobiliaria-que-cambios-trae-para-los-condominios/>.
- **Código Civil:**
  - Art. 50 (cómputo de plazos).
  - Arts. 1595 a 1597 (imputación del pago): <https://leyes-cl.com/codigo_civil/1595.htm>, <https://leyes-cl.com/codigo_civil/1596.htm>, <https://leyes-cl.com/codigo_civil/1597.htm>.
- **Ley 18.010:** art. 6 (interés corriente por tipo de operación) y art. 9 (capitalización).
- **Certificados de tasas de la CMF en el Diario Oficial:** <https://www.diariooficial.interior.gob.cl/publicaciones/2026/10/15/44574/01/2885690.pdf>.
- **ComunidadFeliz:**
  - Intereses: <https://ayuda.comunidadfeliz.com/c%C3%B3mo-fijo-la-tasa-de-inter%C3%A9s-de-la-comunidad>.
  - Configuración de la boleta: <https://www.comunidadfeliz.cl/recursos/configurar-la-boleta>.
- **Documentos internos:**
  - `docs/qa/comunidades-simuladas.md`: Comunidades A a D y pruebas de oro.
  - `docs/qa/plan-de-pruebas.md`: casos de aislamiento, incluido ISO-8.
  - `docs/arquitectura.md` §4 y §5.
  - `docs/revisiones/2026-11-07-diseno-rev2.md`: revisión crítica 2 del diseño (M1 a M9 y menores), origen de la revisión 3.
  - `docs/design/mapa-de-usuarios.md`: formato del RUT enmascarado (`12.345.***-*`).
  - `docs/qa/casos/gasto-comun.md`: hallazgos H-1 a H-19 de QA sobre esta spec.
- **ADR:**
  - 0001: monorepo.
  - 0002: aislamiento.
  - 0003: API y autorización.
  - 0004: libro de movimientos, periodos y prorrateo.
  - 0005: autenticación, auditoría y datos personales.
  - 0006 (propuesto): usuarios de plataforma y excepción acotada al aislamiento (EX-1).
  - 0007 (propuesto): integración Webpay (un pago por ámbito, bloqueo por ámbito, revisión y reverso, un código de comercio por comunidad).
