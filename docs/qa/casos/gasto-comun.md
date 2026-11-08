# Casos de prueba: motor de gasto común

Estado: **Para revisión del líder del proyecto**
Responsable: ingeniero-qa
Aprobación: líder del proyecto
Especificación de origen: `docs/specs/gasto-comun.md` rev. 8 (estado Borrador; revisiones críticas 1 y 2 de la spec, revisiones 2, 3 y 4 del diseño, hallazgos de QA H-30 a H-42 y decisiones del líder D1 a D18 aplicadas). Abreviatura del módulo: `GC`. Otras fuentes: `docs/arquitectura.md` (§2 rutas de negocio sin membresía y ruta de retorno; §3 plataforma, revocación y pruebas de plataforma 1 a 15; §4 rutas, unicidad, vistas previas, idempotencia y 7 días consultables; §5 registro de eventos de seguridad y suscripciones push), `docs/adr/0002-aislamiento-multi-comunidad.md` (orden de validación), `docs/adr/0003-contratos-de-api-y-autorizacion.md` (idempotencia, D12, orden de evaluación de la decisión 9), `docs/adr/0005-autenticacion-auditoria-y-datos-personales.md` (sesiones, decisión 3), `docs/adr/0006-usuarios-de-plataforma.md` (huella por resolución, `LAST_ADMIN`, membresía que Operaciones no ve), `docs/adr/0007-integracion-webpay.md` (estados, retorno y D18, reembolso, 7 días consultables, credenciales por comunidad), `docs/design/wireframes/` y `docs/revisiones/2026-11-07-diseno-rev4.md` (B-1, B-2 y menores 5 y 6).

Casos derivados de los criterios de aceptación CA-1 a CA-75, de los casos borde de la especificación y de casos borde adicionales. Cada monto esperado muestra su cálculo. Los montos y los instantes se verificaron con un script de enteros (`bigint`: resto mayor, techo del fondo, interés con base actual/actual, días hábiles y suma de 168 horas en UTC con la zona `America/Santiago`).

**Cambios de esta versión (spec rev. 8, hallazgos de QA H-30 a H-42 resueltos, decisiones del líder D17 y D18):**

- **Casos nuevos:** TC-GC-CA73-01 a 03 (422 `TRANSBANK_STATUS_UNEXPECTED`, `balance` anómalo y 168 horas por instante), TC-GC-CA74-01 a 03 (409 `REFUND_PENDING`, advertencia de D7 solo con `failed` y referencia `REVERSED` con formato), TC-GC-CA75-01 a 04 (retorno inválido, expiración con consulta previa de D18, Operaciones con una membresía ajena y revocación sin cortar otras sesiones). Aislamiento nuevo: ISO-GC-gateway-4, ISO-GC-ambito-11, ISO-GC-operaciones-4 e ISO-GC-revocacion-1. Orden de validación: PERM-GC-orden-11 a 18. Propiedades PROP-GC-41 a 46.
- **Casos actualizados:** TC-GC-CA30-01 (`current` sin `startedByMe`, H-31); TC-GC-CA43-06, TC-GC-CA69-02 e ISO-GC-operaciones-3 (la revocación no toca sesiones, H-42); TC-GC-CA55-02, TC-GC-CA70-06 (`REFUND_PENDING`, H-35); TC-GC-CA65-03, TC-GC-CA65-06, TC-GC-CA68-02 (formatos, H-36); TC-GC-CA65-04 y TC-GC-CA70-06 (huella ya en la spec, H-30); TC-GC-CA68-01 (texto de la vista previa, H-39); TC-GC-CA68-04 y TC-GC-CA71-03 (desbloqueados por H-33); TC-GC-CA67-01 y 04, TC-GC-CB-33 y TC-GC-CB-35 (orden de validación, H-34 y H-40); ISO-GC-gateway-1 y 2 (H-32 y D18); ISO-GC-operaciones-1 (H-41); "Plazos de Transbank" y TC-GC-CB-34 (168 horas, H-37).
- **Supuestos agregados por el analista durante esta pasada:** S-83 (pantalla genérica del retorno inválido; los casos se refieren al texto canónico de F-17, P-59 abierta, sin copiar el literal), S-84 (284: TC-GC-CB-34 confirma con `TRANSFERENCIA <referencia del banco> <dd-mm-aaaa>` y la advertencia de D7) y S-85 (TC-GC-CA69-05 (e) y (f): sin segunda alerta pasado el día 14 y un otorgamiento nuevo reinicia el plazo).
- **Número de orden de TC-GC-CB-34:** pasa de `OC-2026-0014` a `OC-2026-0017`, porque la spec rev. 8 asigna `OC-2026-0014` a CA-73.
- **Hallazgos:** H-30 a H-42 quedan resueltos (tabla final, con la referencia de cada resolución). Hallazgos nuevos H-43 a H-46.

**Cambios de la versión anterior (revisión 4 del diseño, spec rev. 7):**

- **B-1:** casos nuevos de CA-65 a CA-72 y de las decisiones D12 (rechazos e idempotencia) y D13 (reembolso rechazado con 292 o 310). TC-GC-CA30-01 corregido: el arrendatario no ve ningún estado de pago en curso, solo el 409 si intenta pagar (UX-68). TC-GC-CA41-04 y TC-GC-CA55-01 a 03 fijan el estado que devuelve el doble de Transbank, el monto del reembolso (M-3), `reversalKind` y la advertencia o ayuda de la consola (D4, D7, D10 y D11). Casos borde nuevos TC-GC-CB-32 a 36: rechazos reevaluados con la misma clave, 400 `BAD_REQUEST`, reembolso rechazado con 284, 409 `IDEMPOTENCY_KEY_IN_PROGRESS` y confirmación Webpay que cruza la medianoche.
- **B-2:** aislamiento de la ruta de retorno de Transbank (ISO-GC-gateway-1 a 3), de las rutas de Operaciones ComVive (ISO-GC-operaciones-1 a 3) y de las credenciales y resoluciones con consulta a Transbank (ISO-GC-plataforma-10 a 12). Fila de la ruta de retorno en la matriz de permisos, con la columna "Sin sesión".
- **Menor 5:** dato "comunidad sin comercio vigente" (sin fila vigente en `COMMUNITY_WEBPAY_MERCHANT`) en los datos comunes y en `docs/qa/comunidades-simuladas.md`.
- **Menor 6:** convención de referencia de los pagos manuales en los datos comunes.
- Medio de pago con mayúscula inicial en la línea del pago (S-61): TC-GC-CA32-03 dice "Transferencia".
- **Pendiente del analista (ajuste en paralelo):** 409 `IDEMPOTENCY_KEY_IN_PROGRESS` en la tabla de errores y los campos de huella de Soporte (`transbankStatusSource`, `refundToRequest`, `refundOutcome`, `withoutChargeAvailable`). Los casos que los usan los toman de ADR 0003 (ADR-0003-S2), ADR 0006 (decisión 6) y ADR 0007, marcados como **Supuesto (a validar)** hasta que la spec los incluya.

**Pasada final contra la spec rev. 4 cerrada:** casos de CA-61 a CA-64; correcciones por las decisiones sobre H-20 a H-29 (CA-35, CA-36, CA-39, CB-10, CB-17, CA-33, CA-34, CA-41, CA-44, CA-60 y la tabla de permisos); corrección con $0 = anular y `CORRECTION_WITHOUT_CHANGE` en gastos (TC-GC-CA33-03 y 04); TC-GC-CB-31 y PROP-GC-33 y 34. Todos los hallazgos de QA quedan resueltos.

**Cambios de la versión anterior a esta (revisión 3 del diseño):**

- **M-3:** TC-GC-CB-17 espera 422 `SCOPE_REQUIRED` (CA-32); el arrendatario recibe 404 al descargar el aviso legal y solo descarga el comprobante de cobro (G-7, CA-47); ISO-GC-webpay-ref-1 usa la unicidad (`origin`, `external_ref`, ámbito) solo para `webpay` e `import`; TC-GC-CA20-01 usa el texto vigente de CA-20.
- **M-4:** la tabla de permisos y la de aislamiento siguen la regla del líder: 404 si el actor no puede ver el recurso; 403 solo si lo ve pero su rol no permite la acción.
- **Menor 2:** ámbitos con los identificadores vigentes (`owner` y `occupancy` con su `occupancy_id`).
- **Menor 11:** se quitaron los "bloqueado por H-n" ya resueltos en la spec rev. 3; los generadores de propiedades usan los rangos vigentes (fondo de 500 a 5000 pb, montos hasta $9.999.999.999).
- **Casos nuevos:** CA-29 a CA-60, con permisos de la tarea del comité que vende (M-7) y auditoría de la lectura del propietario sobre el ámbito del arrendatario (S-44).

## Convenciones

- IDs según `docs/qa/plan-de-pruebas.md` §8: `TC-GC-CA<n>-<nn>` (desde un CA), `TC-GC-CB-<nn>` (caso borde), `PROP-GC-<nn>` (propiedad), `ISO-GC-<acción>-<n>` (aislamiento) y `PERM-GC-<rol>-<acción>` (permiso).
- **Tipo:** unitaria (motor puro en `packages/shared`), propiedad (fast-check), integración (API + PostgreSQL), aislamiento, e2e (Playwright o Maestro).
- **Prioridad por riesgo:** 1 = dinero, aislamiento o permisos; 2 = flujo y mensajes; 3 = presentación.
- **Supuesto (a validar):** marca todo dato o resultado que la especificación no define y que este documento fija para poder probar. Cada uno se repite en los hallazgos si requiere decisión del analista.
- **Pregunta al analista (H-n):** el resultado se fijó con un supuesto porque la spec no lo define sin ambigüedad; la pregunta concreta está en la sección final. Los hallazgos H-1 a H-19 quedaron resueltos en la spec rev. 3 y ningún caso sigue bloqueado por ellos.
- Notación: `div` es división entera, `mod` es el resto, `piso` trunca. Los montos van en CLP enteros. Los cocientes intermedios se muestran con 4 decimales **truncados** y "…" (convención H-14 de la spec); el resultado es siempre el piso del cociente exacto.
- **Ámbitos:** `owner` es el ámbito del propietario; "`occupancy` O-1" es el ámbito de la ocupación O-1 (`scope = occupancy`, `occupancy_id` = O-1). No se usan los nombres anteriores a la rev. 3.
- **Códigos de error:** todo 404 trae `NOT_FOUND` y "No encontramos lo que buscas o no tienes acceso"; todo 403 trae `FORBIDDEN` y "Tu rol no permite esta acción". Los demás códigos y textos se copian tal cual de la tabla "Códigos y mensajes de error" y de la regla F-17 de la spec.
- **"Nada escrito" (decisión del líder D12, regla A-3.4):** en un rechazo se verifica por conteo que no hay filas nuevas ni cambiadas en las tablas de negocio (`PAYMENT`, `LEDGER_ENTRY`, `ALLOCATION`, `WEBPAY_ATTEMPT`, `WEBPAY_ATTEMPT_SCOPE`, `WEBPAY_REFUND`, `MEMBERSHIP`, `UNIT_OCCUPANCY`, `ADMIN_TASK`, `COMMUNITY`) ni en `IDEMPOTENCY_KEY`. Excepciones fijadas por la spec: en una ruta `/platform/...` el rechazo deja **exactamente un** registro en `AUDIT_LOG` con el código de la respuesta; cada consulta a Transbank deja su fila en `WEBPAY_GATEWAY_CALL`; y el 503 al iniciar un pago en línea deja el intento en `abandoned`.
- **Doble de Transbank:** las pruebas de integración usan un doble de la API REST de Webpay Plus v1.2 (crear, confirmar, consultar estado y reembolsar) que registra cada llamada con su código de comercio, su token y su origen. Cada caso fija qué responde el doble: estado (`INITIALIZED`, `AUTHORIZED`, `CAPTURED`, `PARTIALLY_NULLIFIED`, `REVERSED`, `NULLIFIED`, `FAILED` o un estado desconocido), monto autorizado (`amount`), saldo anulable (`balance`), `authorization_code`, "sin respuesta" (tiempo agotado) y, en el reembolso, `type` (`REVERSED` o `NULLIFIED`) o el código de error (`response_code` 16, 284, 292, 310, 311). "Sin llamadas a Transbank" se verifica con el registro del doble y con cero filas nuevas en `WEBPAY_GATEWAY_CALL`.
- **Plazos de Transbank usados en los casos:** consulta de estado posible durante los **7 días consultables**: 7 × 24 = 168 horas contadas por instante desde el envío del `create` a Transbank (`WEBPAY_GATEWAY_CALL.called_at`), guardadas en `WEBPAY_ATTEMPT.tbk_queryable_until`; "dentro de los 7 días" es `now() < tbk_queryable_until`, comparado en UTC (spec, "Definiciones", S-80; ADR 0007, decisión 7; H-37 resuelto). Reembolso como reversa dentro de 3 horas desde la autorización y como anulación después, hasta 90 días desde la venta (spec F-16; ADR 0007). Un intento cuyo `create` se envió el 2026-11-25 a las 10:00 (hora de Chile, UTC−3) es consultable hasta antes del 2026-12-02 a las 10:00; uno enviado a las 21:40, hasta antes del 2026-12-02 a las 21:40 (CA-73). Cualquier intento iniciado el 2026-11-25 ya no es consultable el 2026-12-03, a cualquier hora. Su día 90 desde la venta es el 2027-02-23 (5 días de noviembre + 31 de diciembre + 31 de enero + 23 de febrero = 90). Entre noviembre de 2026 y marzo de 2027 Chile está en UTC−3; el 2027-04-04 a las 00:00 vuelve a UTC−4 (TC-GC-CA73-03 (f)).

## Datos comunes

- Comunidades A, B, C y D de `docs/qa/comunidades-simuladas.md`, con el `sort_order` fijado en la especificación (A: 101 = 1, 102 = 2, 201 = 3, 202 = 4; B: Casa 1 a 3 = 1 a 3; C: 11 = 1, 12 = 2, 21 = 3, 22 = 4, 31 = 5; D: Depto 1 a 4 = 1 a 4).
- Por defecto: fondo 500 pb, plazo 10 días corridos, flag `billing.interest` apagado.
- Con el flag activo, salvo indicación: activo desde el 2026-11-01, tasa del reglamento 1200 pb anuales vigente desde el 2026-11-01, tasa CMF 3000 pb vigente desde antes (tope 1500 pb).
- En 2026 y 2027 (años de 365 días) el interés es `piso(Σ capital_d × tasa_d / 3.650.000)`.
- En CA-1 a CA-21, salvo que el caso diga otra cosa, el Depto 102 no tiene una ocupación de arrendatario registrada, así que todos sus cargos van al ámbito `owner` (spec, criterios de aceptación, H-19). Desde CA-22, cada caso indica la ocupación del Depto 102 (O-1 a O-4).
- Personas, RUT y ocupaciones de la Comunidad A: `docs/qa/comunidades-simuladas.md`, sección "Comunidad A · personas y ocupaciones". Actores de prueba: `admin-A`, `admin2-A` (segundo administrador), `comite-A` (Rosa Díaz, propietaria del Depto 201), `propietario-101`, `propietario-102`, `arrendatario-102` (ocupación indicada en cada caso), `conserje-A`, `ex-residente-A`, `admin-B`, `soporte-1` y `soporte-2` (`platform_support`, S1 y S2 en la spec), `operaciones-1` (OP1) y `operaciones-2` (`platform_operations`). En CA-69, AD1 es `admin-A` (Carolina Lagos) y AD2 es Valentina Ortiz (sección "Administradores de CA-69").
- **Referencia de los pagos manuales (menor 6 de la revisión 4; spec, criterios de aceptación; regla F-1, D6):** salvo que el caso diga otra cosa, todo pago manual de estos casos lleva una referencia válida (no vacía ni de solo espacios), aunque el caso no la escriba. **Dato de prueba:** si el caso no la indica, se usa "Comprobante QA-<id del caso>" (por ejemplo, "Comprobante QA-CA5-01"). Así ningún caso anterior a CA-67 responde `PAYMENT_REFERENCE_REQUIRED` por omisión. Los casos que prueban la referencia (TC-GC-CA67-*) la indican de forma explícita. La referencia distinta por caso no dispara la advertencia de F-3 por referencia repetida; los casos que prueban F-3 (TC-GC-CA11-01, TC-GC-CA31-01) fijan la suya.
- **Comercio Webpay (menor 5 de la revisión 4; regla F-12):** salvo que el caso diga otra cosa, las Comunidades A y B tienen comercio vigente: una fila vigente en `COMMUNITY_WEBPAY_MERCHANT` (A: `MC-A-1`; B: `MC-B-1`; ambiente `integration`). **"Comunidad sin comercio vigente"** es la Comunidad A **sin ninguna fila** en `COMMUNITY_WEBPAY_MERCHANT` (estado inicial de CA-66) o, como variante, con su única fila fuera de vigencia (`active_to` pasada). Detalle en `docs/qa/comunidades-simuladas.md`, "Comercio Webpay y personas de plataforma".
- **Números de orden:** cada CA de Webpay es una corrida independiente desde el estado de CA-5 (Depto 101 con $110.000 en `owner`), con los `buy_order` que fija la spec: `OC-2026-0006` (CA-65), `OC-2026-0007` y `OC-2026-0008` (CA-66), `OC-2026-0009` (CA-68), `OC-2026-0010` (CA-70), `OC-2026-0011` (CA-71), `OC-2026-0012` y `OC-2026-0013` (CA-72), `OC-2026-0014` (CA-73), `OC-2026-0015` (CA-74) y `OC-2026-0016` (CA-75). `OC-2026-0017` es un dato de prueba propio (TC-GC-CB-34; hasta la spec rev. 7 era `OC-2026-0014`). El correlativo del doble se fija al número del caso; la regla de correlativo por comunidad y año (ADR-0007-S4) se prueba aparte.

## Matriz de trazabilidad

| CA | Casos | Tipo | Prueba de oro |
| --- | --- | --- | --- |
| CA-1 | TC-GC-CA1-01, 02 | unitaria, integración | GOLD-A-01 a 04 |
| CA-2 | TC-GC-CA2-01 | unitaria | GOLD-B-01 a 03 (totales) |
| CA-3 | TC-GC-CA3-01, 02 | unitaria | GOLD-CE-01 a 05, GOLD-C-01 a 05 |
| CA-4 | TC-GC-CA4-01, 02 | unitaria | GOLD-D-01 a 04 |
| CA-5 | TC-GC-CA5-01 | integración | |
| CA-6 | TC-GC-CA6-01 a 04 | unitaria, integración | |
| CA-7 | TC-GC-CA7-01, 02 | integración, unitaria | |
| CA-8 | TC-GC-CA8-01 | unitaria | |
| CA-9 | TC-GC-CA9-01 | integración | |
| CA-10 | TC-GC-CA10-01 | integración | |
| CA-11 | TC-GC-CA11-01, 02 | integración, e2e | |
| CA-12 | TC-GC-CA12-01 | integración | |
| CA-13 | TC-GC-CA13-01, 02 | unitaria, integración | |
| CA-14 | TC-GC-CA14-01 a 03 | unitaria, integración | |
| CA-15 | TC-GC-CA15-01 a 03 | integración | |
| CA-16 | TC-GC-CA16-01 | unitaria | |
| CA-17 | TC-GC-CA17-01, 02 | unitaria | |
| CA-18 | TC-GC-CA18-01, 02 | integración | GOLD-CE-01 a 05 |
| CA-19 | TC-GC-CA19-01, 02 | integración | |
| CA-20 | TC-GC-CA20-01, 02 | integración, e2e | |
| CA-21 | TC-GC-CA21-01 | integración | |
| CA-22 | TC-GC-CA22-01 a 03 | integración, aislamiento | |
| CA-23 | ISO-GC-* (sección de aislamiento) | aislamiento | PROP-GC-19 |
| CA-24 | PERM-GC-* (sección de permisos), PERM-GC-orden-1 a 6 | integración | |
| CA-25 | TC-GC-CA25-01, 02 | integración | |
| CA-26 | TC-GC-CA26-01 a 05 | integración | |
| CA-27 | TC-GC-CA27-01 | integración | |
| CA-28 | TC-GC-CA28-01, 02 | integración | |
| CA-29 | TC-GC-CA29-01 a 05 | integración, unitaria, aislamiento | GOLD-A29-01 a 03; PROP-GC-20, 21 |
| CA-30 | TC-GC-CA30-01 a 03; ISO-GC-ambito-11 | integración, aislamiento | PROP-GC-21, 41 |
| CA-31 | TC-GC-CA31-01 a 03 | integración, e2e | PROP-GC-18 |
| CA-32 | TC-GC-CA32-01 a 05 | integración, aislamiento | GOLD-A32-01, 02; PROP-GC-22 |
| CA-33 | TC-GC-CA33-01 a 04 | unitaria, integración | GOLD-A33-01 a 04; PROP-GC-24 |
| CA-34 | TC-GC-CA34-01, 02 | unitaria, integración | GOLD-B34-01 a 03; PROP-GC-24 |
| CA-35 | TC-GC-CA35-01 a 03 | integración, aislamiento | PROP-GC-23 |
| CA-36 | TC-GC-CA36-01 | integración | PROP-GC-23 |
| CA-37 | TC-GC-CA37-01 a 03 | integración, aislamiento | PROP-GC-23 |
| CA-38 | TC-GC-CA38-01, 02 | integración | GOLD-A-01 a 04 |
| CA-39 | TC-GC-CA39-01 a 05 | integración, unitaria | GOLD-A39-01 a 04; PROP-GC-28 |
| CA-40 | TC-GC-CA40-01 a 03 | integración | PROP-GC-22, 28 |
| CA-41 | TC-GC-CA41-01 a 05 | integración, aislamiento | PROP-GC-27, 36 |
| CA-42 | ISO-GC-plataforma-1 a 12 | aislamiento | PROP-GC-31 |
| CA-43 | TC-GC-CA43-01 a 06 | integración, permisos | |
| CA-44 | TC-GC-CA44-01, 02 | integración, datos personales | |
| CA-45 | TC-GC-CA45-01, 02 | integración | |
| CA-46 | TC-GC-CA46-01 | integración | |
| CA-47 | TC-GC-CA47-01 a 03 | integración, aislamiento | |
| CA-48 | TC-GC-CA48-01 a 04 | integración | |
| CA-49 | TC-GC-CA49-01 | integración | PROP-GC-29 |
| CA-50 | TC-GC-CA50-01 | integración | PROP-GC-25 |
| CA-51 | TC-GC-CA51-01 | unitaria | PROP-GC-26 |
| CA-52 | TC-GC-CA52-01, 02 | integración | |
| CA-53 | TC-GC-CA53-01 a 04 | integración, aislamiento | |
| CA-54 | TC-GC-CA54-01 a 03 | integración, aislamiento | PROP-GC-31 |
| CA-55 | TC-GC-CA55-01 a 03 | integración, aislamiento | PROP-GC-36, 37 |
| CA-56 | TC-GC-CA56-01 a 03 | integración | PROP-GC-23, 28 |
| CA-57 | TC-GC-CA57-01 a 04 | integración, permisos | |
| CA-58 | TC-GC-CA58-01, 02 | integración | PROP-GC-30 |
| CA-59 | TC-GC-CA59-01, 02 | unitaria | PROP-GC-27 |
| CA-60 | TC-GC-CA60-01 a 03 | integración, datos personales | |
| CA-61 | TC-GC-CA61-01 a 04 | integración, permisos | PROP-GC-23 |
| CA-62 | TC-GC-CA62-01 a 05 | integración | GOLD-A62-01 a 05; PROP-GC-34 |
| CA-63 | TC-GC-CA63-01 a 03 | integración, datos personales | |
| CA-64 | TC-GC-CA64-01, 02 | integración | |
| CA-65 | TC-GC-CA65-01 a 07; ISO-GC-plataforma-11 | integración, aislamiento | PROP-GC-35, 37, 38 |
| CA-66 | TC-GC-CA66-01 a 04; TC-GC-CB-35 | integración, aislamiento | PROP-GC-35 |
| CA-67 | TC-GC-CA67-01 a 05; TC-GC-CB-32 | integración | PROP-GC-35 |
| CA-68 | TC-GC-CA68-01 a 06; ISO-GC-plataforma-10, 12 | integración, aislamiento | PROP-GC-36, 37, 38 |
| CA-69 | TC-GC-CA69-01 a 05; ISO-GC-operaciones-1 a 3 | integración, aislamiento, permisos | PROP-GC-39 |
| CA-70 | TC-GC-CA70-01 a 06; TC-GC-CB-34 | integración, aislamiento | PROP-GC-36, 37, 38 |
| CA-71 | TC-GC-CA71-01 a 03 | integración | PROP-GC-36 |
| CA-72 | TC-GC-CA72-01 a 03 | integración, e2e | PROP-GC-38 |
| CA-73 | TC-GC-CA73-01 a 03; TC-GC-CA68-04 (e); TC-GC-CA71-03 | integración, unitaria | PROP-GC-36, 42, 43 |
| CA-74 | TC-GC-CA74-01 a 03; TC-GC-CA55-02 (5); TC-GC-CA70-06 | integración | PROP-GC-37, 46 |
| CA-75 | TC-GC-CA75-01 a 04; ISO-GC-gateway-1, 2, 4; ISO-GC-operaciones-1, 3, 4; ISO-GC-revocacion-1 | integración, aislamiento, permisos | PROP-GC-37, 40, 44 |
| D12 (A-3.4, rechazos e idempotencia) | TC-GC-CB-32; TC-GC-CA67-04; TC-GC-CA68-05; TC-GC-CA69-01, 02; TC-GC-CA73-01; TC-GC-CA74-02 | integración | PROP-GC-35 |
| Orden de validación: 400 e `INVALID_AMOUNT` en la forma, 404/403 del cuerpo, idempotencia y reglas (S-70, S-77; H-34) | TC-GC-CB-33; TC-GC-CB-35; TC-GC-CA67-01, 04; PERM-GC-orden-8, 11 a 18 | integración | PROP-GC-45 |
| F-1, `paid_on` de Webpay (caso borde de la medianoche) | TC-GC-CB-36 | integración | |
| Reembolso rechazado con 284 y devolución por transferencia (caso borde; S-84, P-55) | TC-GC-CB-34 | integración | |
| Alerta única por otorgamiento sin primer ingreso (S-72, S-85, P-56) | TC-GC-CA69-05 | unitaria, integración | |
| 7 días consultables por instante ("Definiciones", S-80; H-37) | TC-GC-CA73-03; TC-GC-CA65-06; TC-GC-CA70-01; TC-GC-CB-34 | unitaria, integración | PROP-GC-42 |
| Regla 4, ruta de retorno sin membresía (arquitectura §2; ADR 0007, prueba 5; S-75, D18) | ISO-GC-gateway-1 a 4; TC-GC-CA75-01, 02 | aislamiento | PROP-GC-40 |
| Regla 4, rutas de Operaciones ComVive (arquitectura §3, pruebas 12 y 14; S-79) | ISO-GC-operaciones-1 a 4; TC-GC-CA75-03 | aislamiento | PROP-GC-39 |
| Revocación sin efecto entre comunidades ("Otorgamiento de roles", S-81; arquitectura §3, prueba 15) | ISO-GC-revocacion-1; TC-GC-CA75-04; TC-GC-CA43-06; TC-GC-CA69-02 | aislamiento, permisos | PROP-GC-44 |

## Casos derivados de criterios de aceptación

### CA-1 · Emisión base por cuenta

#### TC-GC-CA1-01 · Prorrateo y fondo de la Comunidad A

- **CA:** CA-1 · **Tipo:** unitaria · **Prioridad:** 1 · **Oro:** GOLD-A-01 a GOLD-A-04
- **Precondiciones:** grupo (ordinario, alícuota) con gastos $650.000 + $180.000 + $120.000 + $50.000 = $1.000.000; `aliquot_e6` 200000, 250000, 250000, 300000; fondo 500 pb.
- **Pasos:** ejecutar el motor de cálculo del periodo.
- **Resultado esperado:**
  - Un solo grupo ordinario de $1.000.000 (los cuatro gastos se suman antes de repartir, regla C-1).
  - Fondo F = (1.000.000 × 500 + 9.999) div 10.000 = 500.009.999 div 10.000 = $50.000.
  - Ordinario: 1.000.000 × 200000 div 1.000.000 = 200.000; × 250000 = 250.000; × 250000 = 250.000; × 300000 = 300.000. Todos los restos son 0.
  - Fondo: 50.000 × 200000 div 1.000.000 = 10.000; 12.500; 12.500; 15.000. Restos 0.
  - Totales: 101 $210.000; 102 $262.500; 201 $262.500; 202 $315.000. Suma 1.000.000 + 50.000 = $1.050.000.

#### TC-GC-CA1-02 · Emisión en la API

- **CA:** CA-1 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** Comunidad A con el borrador `2026-10` de TC-GC-CA1-01; reloj del servidor en 2026-11-01 (hora de Chile).
- **Pasos:** `period.issue` como administrador con una clave de idempotencia nueva.
- **Resultado esperado:**
  - `2026-10` en estado `emitido`, fecha de emisión 2026-11-01 (fijada por el servidor; si el cliente envía otra fecha, se ignora o se rechaza) y vencimiento 2026-11-01 + 10 = 2026-11-11.
  - 8 cargos y 8 débitos en el libro (4 ordinarios, 4 de fondo), con los montos de TC-GC-CA1-01, ámbito `owner`.
  - Σ débitos del periodo = $1.050.000; cada grupo cuadra con su total.
  - Foto de participaciones guardada: 4 unidades con `aliquot_e6`, `sort_order` y 500 pb.
  - `2026-11` creado en estado `borrador` y es el único borrador de la comunidad.
  - Un registro de auditoría de la emisión.

### CA-2 · Partes iguales con desempate

#### TC-GC-CA2-01 · Comunidad B por partes iguales

- **CA:** CA-2 · **Tipo:** unitaria · **Prioridad:** 1 · **Oro:** GOLD-B-01 a 03 (los totales coinciden)
- **Precondiciones:** grupo (ordinario, partes iguales {Casa 1, Casa 2, Casa 3}) de $95.238; las casas sin `aliquot_e6` cargado.
- **Pasos:** emitir.
- **Resultado esperado:**
  - No se valida la suma de alícuotas (no hay grupos por alícuota).
  - Fondo F = (95.238 × 500 + 9.999) div 10.000 = 47.628.999 div 10.000 = $4.762.
  - Ordinario: 95.238 × 1 div 3 = 31.746, resto 0, para cada casa.
  - Fondo: 4.762 × 1 div 3 = 1.587, resto 1 para cada casa. Falta 4.762 − 4.761 = 1 peso; empate de restos, gana la Casa 1 (`sort_order` 1): 1.588, 1.587, 1.587.
  - Totales: Casa 1 31.746 + 1.588 = $33.334; Casa 2 $33.333; Casa 3 $33.333. Suma $100.000.

### CA-3 · Resto mayor con varios pesos y empate

#### TC-GC-CA3-01 · Emisión por cuenta de la Comunidad C

- **CA:** CA-3 · **Tipo:** unitaria · **Prioridad:** 1 · **Oro:** GOLD-CE-01 a GOLD-CE-05
- **Precondiciones:** grupo (ordinario, alícuota) de $1.175.778 con `aliquot_e6` 185000, 195000, 200000, 210000, 210000.
- **Pasos:** emitir.
- **Resultado esperado:** los cálculos de `docs/qa/comunidades-simuladas.md`, Comunidad C, emisión por cuenta:
  - Fondo F = 587.898.999 div 10.000 = $58.789.
  - Ordinario: 217.519; 229.277; 235.156; 246.913; 246.913 (3 pesos a los restos 930.000, 710.000 y 600.000).
  - Fondo: 10.876; 11.464; 11.758; 12.346; 12.345 (4 pesos; en el empate de 690.000 gana el Depto 22 por `sort_order` 4 sobre 5).
  - Totales: $228.395; $240.741; $246.914; $259.259; $259.258. Suma $1.234.567.

#### TC-GC-CA3-02 · El redondeo combinado debe fallar

- **CA:** CA-3, regla C-6 · **Tipo:** unitaria · **Prioridad:** 1 · **Oro:** GOLD-C-01 a 05 y GOLD-CE-01 a 05
- **Pasos:** repartir $1.234.567 de una vez (función de reparto pura) y, por separado, emitir por cuenta.
- **Resultado esperado:** el reparto único da GOLD-C (Depto 21 $246.913 y Depto 31 $259.259). La emisión da GOLD-CE (Depto 21 $246.914 y Depto 31 $259.258). Las dos pruebas deben pasar a la vez; si la emisión devuelve GOLD-C, la implementación redondea el total combinado y falla.

### CA-4 · Alícuotas en escala 10^-6

#### TC-GC-CA4-01 · Comunidad D con fondo techo

- **CA:** CA-4 · **Tipo:** unitaria · **Prioridad:** 1 · **Oro:** GOLD-D-01 a GOLD-D-04
- **Precondiciones:** grupo (ordinario, alícuota) de $876.543 con `aliquot_e6` 187345, 243218, 256789, 312648.
- **Pasos:** emitir.
- **Resultado esperado:**
  - Fondo F = (876.543 × 500 + 9.999) div 10.000 = 438.281.499 div 10.000 = $43.828.
  - Ordinario: 164.216; 213.191; 225.087; 274.049 (2 pesos a los restos 948.335 y 600.427).
  - Fondo: productos 8.210.956.660; 10.659.758.504; 11.254.548.292; 13.702.736.544. Partes enteras 8.210 + 10.659 + 11.254 + 13.702 = 43.825; 3 pesos a los restos 956.660 (Depto 1), 758.504 (Depto 2) y 736.544 (Depto 4): 8.211; 10.660; 11.254; 13.703.
  - GOLD-D-01 $172.427; GOLD-D-02 $223.851; GOLD-D-03 $236.341; GOLD-D-04 $287.752. Suma $920.371.

#### TC-GC-CA4-02 · Regresión del redondeo del fondo

- **CA:** CA-4, regla D-3 · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** calcular el total del fondo con O = 876.543 y 500 pb.
- **Resultado esperado:** $43.828. Falla si devuelve $43.827 (mitad hacia arriba o truncado), que deja el fondo bajo el 5 % (43.827 < 43.827,15).

### CA-5 · Pago parcial e imputación

#### TC-GC-CA5-01 · Pago parcial del Depto 101

- **CA:** CA-5 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** `2026-10` emitido como en TC-GC-CA1-02; `2026-11` es el borrador vigente.
- **Pasos:** el administrador registra una transferencia de $100.000 del Depto 101, `paid_on` 2026-11-05, con una asignación al ámbito `owner` (la unidad no tiene arrendatario, así que la web no pregunta y envía `owner`; arquitectura §4, registro manual).
- **Resultado esperado:**
  - Un crédito de $100.000 en la cuenta `pago`, en el periodo `2026-11`, ámbito `owner`.
  - Una imputación de $100.000 al ordinario de `2026-10` (orden F-5: no hay intereses ni capital vencido, así que va a lo no vencido, ordinario primero).
  - Pendiente: ordinario 200.000 − 100.000 = $100.000 y fondo $10.000. Saldo 210.000 − 100.000 = $110.000. Sin saldo a favor.

### CA-6 · Interés por mora y pago posterior (flag activo)

#### TC-GC-CA6-01 · Fórmula del interés de 19 días

- **CA:** CA-6 · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** calcular el interés con capital $110.000 los días 2026-11-12 a 2026-11-30 (19 días), tasa min(1200, 1500) = 1200.
- **Resultado esperado:** piso(110.000 × 19 × 1.200 / 3.650.000) = piso(2.508.000.000 / 3.650.000) = piso(687,1232…) = **$687**. Con la fórmula general: Σ 110.000 × 1.200 × 366 durante 19 días / (10.000 × 133.590) da el mismo $687.

#### TC-GC-CA6-02 · Emisión de `2026-11` con interés

- **CA:** CA-6 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** estado de TC-GC-CA5-01, flag y tasas por defecto, Depto 101 sin arrendatario; borrador `2026-11` con los gastos de CA-1.
- **Pasos:** emitir `2026-11` el 2026-12-01.
- **Resultado esperado:**
  - Cargo de cuenta `intereses` de $687 para el Depto 101, en `2026-11`, ámbito `owner`, que vence el 2026-12-11.
  - Cargos de `2026-11` del Depto 101: ordinario $200.000 y fondo $10.000.
  - Saldo: 110.000 + 687 + 210.000 = **$320.687**.
  - Último día cobrado del ámbito: 2026-11-30.

#### TC-GC-CA6-03 · Pago de $150.000 e imputación

- **CA:** CA-6 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** registrar $150.000 del Depto 101 con `paid_on` 2026-12-05.
- **Resultado esperado:**
  - Capital vencido: ordinario `2026-10` $100.000 y fondo `2026-10` $10.000 (quedan 150.000 − 110.000 = 40.000).
  - Lo no vencido (vence el 2026-12-11): interés $687 (quedan 39.313) y ordinario `2026-11` $39.313.
  - Pendiente: ordinario `2026-11` 200.000 − 39.313 = $160.687 y fondo `2026-11` $10.000. Saldo **$170.687**.

#### TC-GC-CA6-04 · Interés de dos tramos el 2027-01-01

- **CA:** CA-6 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** estado de TC-GC-CA6-03, sin más pagos.
- **Pasos:** emitir `2026-12` el 2027-01-01.
- **Resultado esperado:**
  - Tramo 1: 2026-12-01 a 2026-12-04 sobre $110.000 = 4 × 110.000 = 440.000 peso-días. El 2026-12-05 ya no cuenta (fecha efectiva máx(2026-12-05, 2026-11-11) = 2026-12-05; el capital se mide al cierre del día).
  - Tramo 2: 2026-12-12 a 2026-12-31 sobre $170.687 = 20 × 170.687 = 3.413.740 peso-días.
  - Interés = piso((440.000 + 3.413.740) × 1.200 / 3.650.000) = piso(4.624.488.000 / 3.650.000) = piso(1.266,9830…) = **$1.266**, en un solo cargo del ámbito `owner`.
  - El interés de $687 no devenga interés (S-9).

### CA-7 · Tasa del reglamento sobre el tope

#### TC-GC-CA7-01 · Advertencia y nueva versión de tasa

- **CA:** CA-7 · **Tipo:** integración · **Prioridad:** 2
- **Precondiciones:** tope vigente 1500 pb; tasa del reglamento vigente 1200 pb desde el 2026-11-01.
- **Pasos:** el administrador configura 1,50 % mensual, que se envía como 1800 pb anuales, con vigencia desde una fecha nueva.
- **Resultado esperado:** se guarda una versión nueva (la de 1200 pb no se edita); la respuesta incluye "La tasa configurada supera el tope legal vigente (15,00 % anual). Se aplicará el tope"; queda un registro de auditoría.

#### TC-GC-CA7-02 · El cálculo usa el tope

- **CA:** CA-7 · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** calcular el interés de $110.000 durante 19 días con tasa del reglamento 1800 y tope 1500.
- **Resultado esperado:** piso(110.000 × 19 × min(1.800, 1.500) / 3.650.000) = piso(3.135.000.000 / 3.650.000) = piso(858,9041…) = **$858**. Falla si da piso(110.000 × 19 × 1.800 / 3.650.000) = $1.030.

### CA-8 · Mes de 31 días con tasa igual al tope

#### TC-GC-CA8-01 · Diciembre de 31 días

- **CA:** CA-8 · **Tipo:** unitaria · **Prioridad:** 1
- **Precondiciones:** tasa del reglamento 1500 pb, tope 1500 pb; Depto 202 con $315.000 de capital vencido; último día cobrado 2026-11-30.
- **Pasos:** emitir `2026-12` el 2027-01-01.
- **Resultado esperado:** ventana 2026-12-01 a 2026-12-31 (31 días); interés piso(315.000 × 31 × 1.500 / 3.650.000) = piso(14.647.500.000 / 3.650.000) = piso(4.013,0136…) = **$4.013**. Falla si da $4.068 (convención de 30 días).
- **Nota:** la emisión de `2026-11` del 2026-12-01 que exige la precondición genera para el Depto 202 un cargo de intereses de piso(315.000 × 19 × 1.500 / 3.650.000) = piso(2.459,5890…) = $2.459. CA-8 lo dice así desde la rev. 3 (H-2 resuelto) y TC-GC-CA20-02 lo prueba.

### CA-9 · Pago mayor a la deuda

#### TC-GC-CA9-01 · Excedente a favor y aplicación en la emisión

- **CA:** CA-9 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** `2026-10` emitido como en CA-1; Depto 201 ocupado por su propietario.
- **Pasos:** registrar $300.000 del Depto 201 el 2026-11-08 (ámbito `owner`); luego emitir `2026-11` con ordinario $250.000 y fondo $12.500 para el Depto 201.
- **Resultado esperado:**
  - Tras el pago: imputación $250.000 al ordinario y $12.500 al fondo de `2026-10`; saldo a favor 300.000 − 262.500 = $37.500 (saldo −$37.500).
  - Tras emitir: los $37.500 se imputan al ordinario de `2026-11` (regla F-6, débito nuevo). Pendiente ordinario 250.000 − 37.500 = $212.500 y fondo $12.500. Saldo **$225.000**, sin saldo a favor.

### CA-10 · Webpay duplicado

#### TC-GC-CA10-01 · Confirmación repetida

- **CA:** CA-10 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** Depto 202 debe $315.000 de `2026-10`.
- **Pasos:** procesar dos veces la confirmación Webpay de $315.000 con `external_ref` `OC-2026-0001` (en secuencia y, en otra corrida, en paralelo).
- **Resultado esperado:** un solo pago, un solo crédito y un solo juego de imputaciones; la segunda respuesta devuelve el pago existente; saldo del Depto 202 = 315.000 − 315.000 = **$0**.

### CA-11 · Posible duplicado manual

#### TC-GC-CA11-01 · Advertencia de duplicado

- **CA:** CA-11 · **Tipo:** integración y e2e (Playwright) · **Prioridad:** 2
- **Precondiciones:** Depto 201 debía $262.500 de `2026-10` y un pago manual de $262.500 por transferencia con fecha 2026-11-09 lo dejó en $0 (deuda inicial fijada en CA-11 desde la rev. 3: ordinario $250.000 y fondo $12.500, sin otros pagos).
- **Pasos:** ingresar otro pago de $262.500, Depto 201, transferencia, 2026-11-09.
- **Resultado esperado:** el formulario muestra exactamente "Ya existe un pago de $262.500 para Depto 201 con fecha 09-11-2026 por transferencia. Revisa que no sea un duplicado" y permite guardar. Al guardar: saldo −$262.500 (todo a favor).

#### TC-GC-CA11-02 · Anulación del duplicado

- **CA:** CA-11 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** anular el segundo pago con motivo "duplicado".
- **Resultado esperado:** débito de reverso de $262.500 en la cuenta `pago`, en el borrador vigente, con motivo y referencia al pago; saldo −262.500 + 262.500 = **$0**; los dos pagos siguen existiendo; auditoría de la anulación.

### CA-12 · Anulación con reimputación del saldo a favor

#### TC-GC-CA12-01 · Cheque protestado

- **CA:** CA-12 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** Depto 202 debe $315.000 de `2026-10` (ordinario $300.000, fondo $15.000); P1 cheque $315.000 `paid_on` 2026-11-05; P2 transferencia $100.000 `paid_on` 2026-11-06 (queda a favor, saldo −$100.000).
- **Pasos:** el 2026-11-20 anular P1.
- **Resultado esperado:**
  - Débito de reverso de $315.000 en `2026-11`.
  - Las imputaciones de P1 se deshacen; P2 se reimputa: $100.000 al ordinario de `2026-10`.
  - Pendiente: ordinario 300.000 − 100.000 = $200.000 y fondo $15.000. Saldo **$215.000** y saldo a favor $0.

### CA-13 · Corrección de un periodo cerrado

#### TC-GC-CA13-01 · Notas de crédito con la foto original

- **CA:** CA-13 · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** recalcular `2026-10` con la foto de participaciones y el gasto de electricidad corregido de $180.000 a $170.000.
- **Resultado esperado:**
  - O = 1.000.000 − 10.000 = $990.000; F = (990.000 × 500 + 9.999) div 10.000 = 495.009.999 div 10.000 = $49.500.
  - Ordinario correcto: 198.000; 247.500; 247.500; 297.000. Fondo correcto: 9.900; 12.375; 12.375; 14.850 (sin restos).
  - Ajustes (correcto − original): ordinario −2.000, −2.500, −2.500, −3.000 (suma −10.000); fondo −100, −125, −125, −150 (suma −500).

#### TC-GC-CA13-02 · Registro y reimputación del Depto 101

- **CA:** CA-13 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** `2026-10` cerrado; Depto 101 con `2026-10` pagado completo y `2026-11` ($200.000 + $10.000, vencido el 2026-12-11) impago; borrador vigente `2026-12`.
- **Pasos:** el 2026-12-15 registrar la corrección.
- **Resultado esperado:**
  - 8 notas de crédito en `2026-12`, cada una con `adjusts_entry_id` al cargo original de `2026-10`, motivo y ámbito del cargo ajustado.
  - Depto 101: las notas (−2.000 y −100) se imputan a sus cargos ya pagados; se liberan 2.000 + 100 = $2.100 del pago, que se reimputan al ordinario vencido de `2026-11` conservando el `paid_on` del pago.
  - Pendiente Depto 101: ordinario 200.000 − 2.100 = $197.900 y fondo $10.000. Saldo **$207.900**.
  - Ningún movimiento ni imputación con periodo `2026-10` cambia (comparar la foto de la tabla antes y después).

### CA-14 · Dos correcciones sucesivas del mismo grupo

#### TC-GC-CA14-01 · Ajuste acumulado

- **CA:** CA-14 · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** recalcular con O = $995.000 y aplicar ajuste = correcto − (original + ajustes previos).
- **Resultado esperado:**
  - F = (995.000 × 500 + 9.999) div 10.000 = 497.509.999 div 10.000 = $49.750.
  - Fondo exacto 9.950; 12.437,5; 12.437,5; 14.925. Partes enteras 9.950 + 12.437 + 12.437 + 14.925 = 49.749; el peso que falta va al Depto 102 (empate de resto 500.000 con el Depto 201, `sort_order` 2 contra 3).

  | Unidad | Ordinario: original + ajuste 1 + ajuste 2 | Fondo: original + ajuste 1 + ajuste 2 |
  | --- | --- | --- |
  | Depto 101 | 200.000 − 2.000 + 1.000 = 199.000 | 10.000 − 100 + 50 = 9.950 |
  | Depto 102 | 250.000 − 2.500 + 1.250 = 248.750 | 12.500 − 125 + 63 = 12.438 |
  | Depto 201 | 250.000 − 2.500 + 1.250 = 248.750 | 12.500 − 125 + 62 = 12.437 |
  | Depto 202 | 300.000 − 3.000 + 1.500 = 298.500 | 15.000 − 150 + 75 = 14.925 |
  | **Suma** | 1.000.000 − 10.000 + 5.000 = 995.000 | 50.000 − 500 + 250 = 49.750 |

#### TC-GC-CA14-02 · Periodo y vencimiento del débito de ajuste

- **CA:** CA-14, regla H-5 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** TC-GC-CA13-02 aplicado; Depto 101 sin deuda ni saldo a favor; borrador vigente `2027-01`.
- **Pasos:** registrar la segunda corrección; emitir `2027-01` el 2027-02-01.
- **Resultado esperado:** los 8 débitos de ajuste pertenecen a `2027-01`, vencen el 2027-02-11, ámbito `owner`; el Depto 101 tiene $1.050 pendientes no vencidos (1.000 + 50) antes de emitir; su aviso de `2027-01` muestra "Ajuste periodo 2026-10: corrección factura electricidad".

#### TC-GC-CA14-03 · Interés del débito de ajuste

- **CA:** CA-14 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** flag activo; **Supuesto (a validar, dato de prueba):** el único capital vencido del Depto 101 son los $1.050 del ajuste y nadie paga.
- **Pasos:** emitir `2027-02` el 2027-03-01.
- **Resultado esperado:** ventana del ajuste 2027-02-12 a 2027-02-28 (17 días), nunca desde el vencimiento del cargo original; interés piso(1.050 × 17 × 1.200 / 3.650.000) = piso(5,8684…) = **$5**.

### CA-15 · Pago tardío después del cierre

#### TC-GC-CA15-01 · Periodo del crédito tardío

- **CA:** CA-15 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** `2026-10` cerrado, `2026-11` emitido, borrador `2026-12`.
- **Pasos:** el 2026-12-03 registrar un pago con `paid_on` 2026-10-31.
- **Resultado esperado:** crédito en `2026-12`, `paid_on` 2026-10-31, `recorded_at` 2026-12-03.

#### TC-GC-CA15-02 · Escritura en periodo cerrado o emitido

- **CA:** CA-15, reglas A-3.5, A-4 y A-5.4 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** intentar crear, editar o eliminar un gasto, un cargo directo o un movimiento con periodo `2026-10` (cerrado) y con periodo `2026-11` (emitido).
- **Resultado esperado:** rechazo sin escritura en todos los casos (verificar conteos de filas), con 409 `PERIOD_NOT_EDITABLE`:
  - Periodo `2026-10`: "El periodo 2026-10 está cerrado. Registra el movimiento en el borrador vigente".
  - Periodo `2026-11`: "El periodo 2026-11 está emitido. Registra el movimiento en el borrador vigente".

#### TC-GC-CA15-03 · Fecha de pago futura

- **CA:** CA-15, regla F-1 · **Tipo:** integración · **Prioridad:** 2
- **Pasos:** con el reloj en 2026-12-03 22:30 hora de Chile (2026-12-04 01:30 UTC), registrar pagos con `paid_on` 2026-12-03 y 2026-12-04.
- **Resultado esperado:** 2026-12-03 se acepta; 2026-12-04 se rechaza con "La fecha de pago no puede ser futura". Prueba que "fecha actual" se toma en hora de Chile y no en UTC.

### CA-16 · Extraordinario sin recargo

#### TC-GC-CA16-01 · Extraordinario por partes iguales

- **CA:** CA-16 · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** emitir con grupo (extraordinario, partes iguales) $300.000 y grupo (ordinario, partes iguales) $95.238.
- **Resultado esperado:** extraordinario 300.000 div 3 = $100.000 por casa; fondo $4.762 (solo del ordinario); no existe grupo de fondo del extraordinario. Totales: Casa 1 31.746 + 1.588 + 100.000 = $133.334; Casa 2 y 3 $133.333. Suma 95.238 + 4.762 + 300.000 = $400.000.

### CA-17 · Consumo de agua como monto directo

#### TC-GC-CA17-01 · Solo cargos directos

- **CA:** CA-17 · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** emitir con cargos directos ordinarios de agua $24.000 (101), $36.000 (102), $30.000 (201), $30.000 (202) y sin otros gastos.
- **Resultado esperado:** 4 cargos tal cual, suma 24.000 + 36.000 + 30.000 + 30.000 = $120.000; ningún grupo de fondo; no se valida la suma de alícuotas.

#### TC-GC-CA17-02 · Directos junto al grupo por alícuota

- **CA:** CA-17 · **Tipo:** unitaria · **Prioridad:** 1 · **Dato de prueba propio**
- **Pasos:** emitir con los cargos de TC-GC-CA17-01 y el grupo de CA-1.
- **Resultado esperado:** fondo $50.000 (de O = 1.000.000), no 1.120.000 × 5 % = $56.000. Totales: 101 210.000 + 24.000 = $234.000; 102 262.500 + 36.000 = $298.500; 201 262.500 + 30.000 = $292.500; 202 315.000 + 30.000 = $345.000. Suma $1.170.000.

### CA-18 · Unidad con participación 0

#### TC-GC-CA18-01 · Bodega sin cargos

- **CA:** CA-18 · **Tipo:** integración · **Prioridad:** 1 · **Oro:** GOLD-CE-01 a 05
- **Precondiciones:** Comunidad C más Bodega B1 con `aliquot_e6` 0 y `sort_order` 6.
- **Pasos:** emitir el periodo de CA-3.
- **Resultado esperado:** B1: producto 1.175.778 × 0 = 0, sin cargo ni movimiento; su aviso muestra $0. Los demás cargos son idénticos a GOLD-CE. La foto incluye a B1 con peso 0.

#### TC-GC-CA18-02 · Multa a la bodega

- **CA:** CA-18 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** en el periodo siguiente, cargo directo de cuenta `multas` de $30.000 a B1, con motivo y referencia; emitir.
- **Resultado esperado:** un cargo de $30.000 en `multas`; sin recargo de fondo.

### CA-19 · Alícuotas que no suman 100 %

#### TC-GC-CA19-01 · Suma 999.900

- **CA:** CA-19 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** Comunidad C con Depto 31 en 209900: 185.000 + 195.000 + 200.000 + 210.000 + 209.900 = 999.900; un grupo por alícuota.
- **Pasos:** emitir.
- **Resultado esperado:** bloqueo con "Las alícuotas suman 99,9900 %; deben sumar 100,0000 %". El periodo sigue en `borrador`; no hay cargos, débitos, foto ni borrador nuevo.

#### TC-GC-CA19-02 · Suma sobre 100 %

- **CA:** CA-19 · **Tipo:** integración · **Prioridad:** 1 · **Dato de prueba propio**
- **Pasos:** Depto 31 en 210100 (suma 1.000.100) y emitir.
- **Resultado esperado:** bloqueo con "Las alícuotas suman 100,0100 %; deben sumar 100,0000 %" y nada escrito.

### CA-20 · Periodo sin gastos

#### TC-GC-CA20-01 · Emisión con confirmación

- **CA:** CA-20 · **Tipo:** integración y e2e (Playwright) · **Prioridad:** 2
- **Precondiciones:** Comunidad B, borrador sin gastos ni cargos, flag apagado.
- **Pasos:** emitir sin confirmar; luego confirmar.
- **Resultado esperado:**
  - La vista previa devuelve la advertencia (no un error) "El periodo no tiene gastos. Se emitirán avisos sin cargos de gastos del periodo". Sin confirmar no cambia nada.
  - Al confirmar: 0 cargos y 0 movimientos; cada casa recibe su aviso con $0 en los gastos del periodo, el saldo anterior y el saldo de caja; se crea el borrador siguiente.

#### TC-GC-CA20-02 · Periodo sin gastos con el flag activo

- **CA:** CA-20, CA-8 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** Comunidad A, flag activo y tasas por defecto pero tasa del reglamento 1500 pb (como CA-8); Depto 202 con $315.000 de `2026-10` impagos (vencidos el 2026-11-11); borrador `2026-11` sin gastos ni cargos.
- **Pasos:** pedir la vista previa de emisión el 2026-12-01 y confirmar.
- **Resultado esperado:**
  - La advertencia es la misma: "El periodo no tiene gastos. Se emitirán avisos sin cargos de gastos del periodo".
  - Se crea un solo cargo, de cuenta `intereses`, para el Depto 202, ámbito `owner`: piso(315.000 × 19 × 1.500 / 3.650.000) = piso(8.977.500.000 / 3.650.000) = piso(2.459,5890…) = **$2.459** (días 2026-11-12 a 2026-11-30). Ninguna otra unidad tiene cargos.
  - Total emitido del periodo = $2.459.

### CA-21 · Cambio de propietario

#### TC-GC-CA21-01 · Venta a mitad de mes

- **CA:** CA-21 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** Depto 201 debe $262.500 de `2026-10`; venta el 2026-11-15.
- **Pasos:** registrar al nuevo propietario desde el 2026-11-15; emitir `2026-11` el 2026-12-01; el propietario anterior consulta la unidad.
- **Resultado esperado:** cargo `2026-11` completo de $262.500; aviso dirigido al nuevo propietario con saldo 262.500 + 262.500 = **$525.000**; el propietario anterior recibe 404 en lectura y en pago.

### CA-22 · Arrendatario con deuda anterior en la unidad

#### TC-GC-CA22-01 · Ámbito al emitir

- **CA:** CA-22 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** ocupación anterior del Depto 102 terminada el 2026-10-31; `2026-10` emitido el 2026-11-01 con $262.500 en ámbito `owner`, impago; ocupación O-1 desde el 2026-11-15.
- **Pasos:** emitir `2026-11` el 2026-12-01 con $262.500 para el Depto 102.
- **Resultado esperado:** los cargos de `2026-11` del Depto 102 (ordinario $250.000 y fondo $12.500) en ámbito `occupancy` O-1. Vista del arrendatario: total $262.500 y saldo anterior $0.

#### TC-GC-CA22-02 · Pago del arrendatario solo a su ámbito

- **CA:** CA-22 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** el arrendatario paga $262.500 por Webpay el 2026-12-05.
- **Resultado esperado:** imputaciones ordinario `2026-11` $250.000 y fondo `2026-11` $12.500, ámbito O-1; nada a `2026-10`. Saldo O-1 $0; saldo `owner` $262.500. Aviso legal: `owner` deuda $262.500 y a favor $0; O-1 deuda $0 y a favor $0; total de la unidad $262.500.

#### TC-GC-CA22-03 · El arrendatario no ve la deuda del propietario

- **CA:** CA-22 · **Tipo:** aislamiento · **Prioridad:** 1
- **Pasos:** el arrendatario pide el cargo de `2026-10`, la lista de movimientos y el saldo del Depto 102.
- **Resultado esperado:** 404 en el cargo de `2026-10`; la lista y el saldo solo incluyen el ámbito O-1 ($0); la respuesta no contiene montos ni IDs del ámbito `owner`.

### CA-25 · Emisión idempotente

#### TC-GC-CA25-01 · Misma clave, en paralelo

- **CA:** CA-25 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** enviar dos peticiones de emisión de `2026-10` de la Comunidad A con la misma clave, en paralelo.
- **Resultado esperado:** una emisión; 8 débitos por $1.050.000 en total; un solo borrador `2026-11`; respuestas iguales.

#### TC-GC-CA25-02 · Otra clave

- **CA:** CA-25 · **Tipo:** integración · **Prioridad:** 2
- **Pasos:** tras TC-GC-CA25-01, emitir `2026-10` con otra clave.
- **Resultado esperado:** 409 con "El periodo ya fue emitido"; nada escrito.

### CA-26 · Intereses por ámbito con arrendatario (flag activo)

#### TC-GC-CA26-01 · Interés del ámbito `owner`

- **CA:** CA-26 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** escenario de CA-22 con flag y tasas por defecto.
- **Pasos:** emitir `2026-11` el 2026-12-01.
- **Resultado esperado:** ámbito `owner`: piso(262.500 × 19 × 1.200 / 3.650.000) = piso(5.985.000.000 / 3.650.000) = piso(1.639,7260…) = **$1.639** (días 2026-11-12 a 2026-11-30). Ámbito O-1: sin cargo de intereses.

#### TC-GC-CA26-02 · Pago tardío del arrendatario

- **CA:** CA-26 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** el arrendatario paga $262.500 por Webpay con `paid_on` 2026-12-20.
- **Resultado esperado:** imputaciones ordinario $250.000 y fondo $12.500 de `2026-11`, ámbito O-1, con fecha efectiva máx(2026-12-20, 2026-12-11) = 2026-12-20.

#### TC-GC-CA26-03 · Emisión de `2026-12` por ámbito

- **CA:** CA-26 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** emitir `2026-12` el 2027-01-01 con $262.500 para el Depto 102 (ámbito O-1).
- **Resultado esperado:**
  - `owner`: piso(262.500 × 31 × 1.200 / 3.650.000) = piso(9.765.000.000 / 3.650.000) = piso(2.675,3424…) = **$2.675** (2026-12-01 a 2026-12-31).
  - O-1: piso(262.500 × 8 × 1.200 / 3.650.000) = piso(2.520.000.000 / 3.650.000) = piso(690,4109…) = **$690** (2026-12-12 a 2026-12-19).
  - Aviso legal: `owner` 262.500 + 1.639 + 2.675 = $266.814, a favor $0; O-1 262.500 + 690 = $263.190, a favor $0; total de la unidad 266.814 + 263.190 = **$530.004**.
  - El arrendatario ve solo $263.190.

#### TC-GC-CA26-04 · Fin de la ocupación

- **CA:** CA-26 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** terminar la ocupación O-1 el 2027-01-31 sin más pagos.
- **Resultado esperado:** los $263.190 pasan al ámbito `owner`, que queda en 266.814 + 263.190 = **$530.004**; registro de auditoría del traspaso; el ex arrendatario recibe 404 en todo el módulo.

#### TC-GC-CA26-05 · Interés del capital traspasado con la ventana de la ocupación (E-11)

- **CA:** CA-26, regla E-11 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** estado de TC-GC-CA26-04: término de O-1 registrado el 2027-01-31 (fecha declarada 2027-01-31). Último día cobrado del ámbito `owner` y de `occupancy` O-1: 2026-12-31 (las dos ventanas avanzaron en la emisión del 2027-01-01). Capital traspasado: ordinario $250.000 y fondo $12.500 de `2026-12`, vencidos el 2027-01-11; el interés de $690 no es capital (S-9). **Dato de prueba:** borrador `2027-01` sin gastos.
- **Pasos:** emitir `2027-01` el 2027-02-01.
- **Resultado esperado:**
  - Capital propio del ámbito `owner`: $262.500 de `2026-10` del 2027-01-01 al 2027-01-31 = 31 días.
  - Capital traspasado, con la ventana de la ocupación: $262.500 en mora del 2027-01-12 al 2027-01-31 = 20 días (incluye los días 2027-01-12 a 2027-01-30, anteriores al traspaso y aún no cobrados).
  - Un solo cargo de intereses en el ámbito `owner`: piso((262.500 × 31 + 262.500 × 20) × 1.200 / 3.650.000) = piso((8.137.500 + 5.250.000) × 1.200 / 3.650.000) = piso(16.065.000.000 / 3.650.000) = piso(4.401,3698…) = **$4.401**.
  - `occupancy` O-1 no genera interés y sigue en $0. Saldo del ámbito `owner`: 530.004 + 4.401 = **$534.405**.
  - Falla si el interés traspasado se pierde (piso(262.500 × 31 × 1.200 / 3.650.000) = $2.675) o si se cobra dos veces.

### CA-27 · Fecha efectiva al reimputar (flag activo)

#### TC-GC-CA27-01 · Reimputación tras anular P1

- **CA:** CA-27 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** escenario de TC-GC-CA12-01 con flag y tasas por defecto.
- **Pasos:** anular P1 el 2026-11-20; emitir `2026-11` el 2026-12-01 con los gastos de CA-1.
- **Resultado esperado:**
  - Fecha efectiva de la reimputación de P2: máx(2026-11-06, 2026-11-11) = 2026-11-11.
  - Interés: piso(215.000 × 19 × 1.200 / 3.650.000) = piso(4.902.000.000 / 3.650.000) = piso(1.343,0136…) = **$1.343**.
  - Falla si da piso((315.000 × 8 + 215.000 × 11) × 1.200 / 3.650.000) = piso(5.862.000.000 / 3.650.000) = $1.606.
  - Saldo: 215.000 + 1.343 + 315.000 = **$531.343**.

### CA-28 · Pago con fecha dentro de días ya cobrados (flag activo)

#### TC-GC-CA28-01 · Nota de crédito automática de intereses

- **CA:** CA-28 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** estado de TC-GC-CA6-02 (interés $687 por 2026-11-12 a 2026-11-30, saldo $320.687); borrador `2026-12`.
- **Pasos:** el 2026-12-03 registrar una transferencia de $110.000 con `paid_on` 2026-11-20.
- **Resultado esperado:**
  - Imputación al ordinario `2026-10` $100.000 y al fondo `2026-10` $10.000, fecha efectiva 2026-11-20.
  - Interés recalculado: piso(110.000 × 8 × 1.200 / 3.650.000) = piso(1.056.000.000 / 3.650.000) = piso(289,3150…) = $289.
  - Nota de crédito automática de intereses en `2026-12`: 289 − 687 = **−$398**, con `adjusts_entry_id` al cargo de $687, imputada a él (queda $289 pendiente).
  - Saldo: 320.687 − 110.000 − 398 = **$210.289**.

#### TC-GC-CA28-02 · Anulación de esa transferencia

- **CA:** CA-28 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** el 2026-12-10 anular la transferencia.
- **Resultado esperado:** interés recalculado $687; débito de ajuste de intereses 687 − (687 − 398) = +398, es decir, $398 en `2026-12`, que vence con el aviso de `2026-12`; saldo 210.289 + 110.000 + 398 = **$320.687**; interés neto del cargo original 687 − 398 + 398 = $687.

### Casos CA-29 a CA-60 (spec rev. 3 y rev. 4)

Desde aquí los casos usan **Dado / Cuando / Entonces**, que equivalen a precondiciones, pasos y resultado esperado. Estados de partida que se repiten:

- **E22** (CA-22 después de emitir `2026-11` el 2026-12-01, flag apagado): ámbito `owner` del Depto 102 con ordinario $250.000 y fondo $12.500 de `2026-10`, vencidos el 2026-11-11 (deuda $262.500); `occupancy` O-1 (Pedro Soto) con ordinario $250.000 y fondo $12.500 de `2026-11`, que vencen el 2026-12-11 (deuda $262.500). Borrador vigente `2026-12`.
- **E29** (CA-26 después de emitir `2026-12` el 2027-01-01, flag activo, sin término de O-1). Borrador vigente `2027-01`:

  | Ámbito | Débito | Periodo | Monto | Vence |
  | --- | --- | --- | --- | --- |
  | `owner` | Interés (tramo 2026-11-12 a 2026-11-30) | `2026-11` | $1.639 | 2026-12-11 |
  | `owner` | Ordinario | `2026-10` | $250.000 | 2026-11-11 |
  | `owner` | Fondo | `2026-10` | $12.500 | 2026-11-11 |
  | `owner` | Interés (tramo 2026-12-01 a 2026-12-31) | `2026-12` | $2.675 | 2027-01-11 |
  | **`owner`** | **Deuda** | | **1.639 + 250.000 + 12.500 + 2.675 = $266.814** | |
  | `occupancy` O-1 | Interés (tramo 2026-12-12 a 2026-12-19) | `2026-12` | $690 | 2027-01-11 |
  | `occupancy` O-1 | Ordinario | `2026-12` | $250.000 | 2027-01-11 |
  | `occupancy` O-1 | Fondo | `2026-12` | $12.500 | 2027-01-11 |
  | **`occupancy` O-1** | **Deuda** | | **690 + 250.000 + 12.500 = $263.190** | |

  El último día cobrado de los dos ámbitos es el 2026-12-31.

### CA-29 · El propietario paga ambos ámbitos por Webpay (flag activo)

#### TC-GC-CA29-01 · Inicio de un intento "Ambas"

- **CA:** CA-29, regla F-12 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** E29; la Comunidad A tiene código de comercio Transbank.
- **Cuando:** el 2027-01-05 `propietario-102` inicia `POST /communities/A/units/{Depto 102}/webpay-attempts` con los ámbitos `owner` y `occupancy` O-1 y `expectedTotalClp` 530.004; en otra corrida, con `expectedTotalClp` 530.000.
- **Entonces:**
  - Con 530.004: un `WEBPAY_ATTEMPT` en `initiated`, `buy_order` `OC-2027-0001`, monto 266.814 + 263.190 = **$530.004**, y dos `WEBPAY_ATTEMPT_SCOPE`: `owner` $266.814 y `occupancy` O-1 $263.190, ambos con `lock_active` verdadero. La app no envía montos por ámbito: los calcula la API. No se crea ningún `PAYMENT` ni movimiento.
  - Con 530.000: 409 `AMOUNT_CHANGED` con "El monto a pagar cambió. Revisa el nuevo monto" y los montos nuevos ($266.814 y $263.190); no se crea intento ni bloqueo.

#### TC-GC-CA29-02 · Confirmación: un pago por ámbito e imputación

- **CA:** CA-29, reglas F-1, F-5 y F-12 · **Tipo:** integración · **Prioridad:** 1 · **Oro:** GOLD-A29-01, GOLD-A29-02
- **Dado:** el intento de TC-GC-CA29-01 con $530.004.
- **Cuando:** Transbank confirma $530.004 el 2027-01-05.
- **Entonces:**
  - Dos `PAYMENT` con `origin = webpay`, `external_ref` `OC-2027-0001`, `paid_on` 2027-01-05 y el mismo `payment_group_id` (= id del intento): $266.814 en `owner` y $263.190 en `occupancy` O-1. Σ = 266.814 + 263.190 = 530.004 = monto del intento. Cada uno genera su crédito en su ámbito.
  - Imputación en `owner` (fecha de referencia 2027-01-05): paso 1, interés vencido $1.639 (quedan 266.814 − 1.639 = 265.175); paso 2, capital vencido `2026-10` ordinario $250.000 (quedan 15.175) y fondo $12.500 (quedan 2.675); paso 4, interés no vencido $2.675 (quedan 0).
  - Imputación en `occupancy` O-1, todo no vencido (vence el 2027-01-11): interés $690 (quedan 262.500), ordinario `2026-12` $250.000 (quedan 12.500) y fondo `2026-12` $12.500 (quedan 0).
  - Fechas efectivas: `owner` máx(2027-01-05, 2026-12-11) = 2027-01-05 para el interés de $1.639, máx(2027-01-05, 2026-11-11) = 2027-01-05 para `2026-10` y máx(2027-01-05, 2027-01-11) = 2027-01-11 para el interés de $2.675; `occupancy` O-1, 2027-01-11 en todo.
  - Los dos ámbitos quedan con deuda $0 y saldo a favor $0. El intento pasa a `confirmed` y `lock_active` queda falso.

#### TC-GC-CA29-03 · Confirmación duplicada de un intento de dos ámbitos

- **CA:** CA-29, regla F-2 · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** la confirmación de `OC-2027-0001` llega dos veces, en secuencia y, en otra corrida, en paralelo.
- **Entonces:** siguen existiendo dos `PAYMENT`, dos créditos y un solo juego de imputaciones. El índice único (`community_id`, `origin`, `external_ref`, ámbito) para `webpay` impide el tercer pago y la segunda confirmación devuelve los dos pagos existentes. Los dos ámbitos siguen en $0.

#### TC-GC-CA29-04 · Lo que ve cada residente del grupo

- **CA:** CA-29, reglas F-12 y F-17, S-44 · **Tipo:** aislamiento · **Prioridad:** 1
- **Cuando:** el propietario y el arrendatario leen su historial; el arrendatario pide además el pago de $266.814, el grupo de pagos y el detalle del intento.
- **Entonces:**
  - El propietario ve un pago en línea de $530.004 "Pagado por ti", con el detalle "Tu deuda $266.814" y "Deuda del arrendatario $263.190". Su lectura del ámbito O-1 deja un registro de auditoría (S-44); la de su ámbito `owner`, ninguno.
  - El arrendatario ve "Pagado por el propietario · $263.190 · 05-01-2027 · Webpay".
  - El pago de $266.814, el grupo y el detalle del intento le responden 404 `NOT_FOUND` al arrendatario. Ninguna respuesta suya contiene 266.814 ni 530.004.

#### TC-GC-CA29-05 · Interés de la emisión siguiente

- **CA:** CA-29, reglas E-6 y F-11 · **Tipo:** integración · **Prioridad:** 1 · **Oro:** GOLD-A29-03
- **Cuando:** se emite `2027-01` el 2027-02-01, sin otros pagos ni gastos.
- **Entonces:**
  - `owner`: el capital de `2026-10` ($262.500) está en mora desde el 2027-01-01 (día siguiente al último cobrado) hasta el 2027-01-04. El 2027-01-05 ya no cuenta, porque la fecha efectiva es el 2027-01-05 y el capital se mide al cierre del día. Interés = piso(262.500 × 4 × 1.200 / 3.650.000) = piso(1.260.000.000 / 3.650.000) = piso(345,2054…) = **$345**.
  - `occupancy` O-1: sin capital en mora (pagó antes del vencimiento del 2027-01-11). Interés $0, sin cargo, y su ventana avanza hasta el 2027-01-31.
  - Falla si cuenta 5 días: piso(262.500 × 5 × 1.200 / 3.650.000) = piso(431,5068…) = $431.

### CA-30 · El propietario paga solo la deuda del arrendatario, con bloqueo por ámbito (flag activo)

#### TC-GC-CA30-01 · Bloqueo del ámbito del arrendatario

- **CA:** CA-30, reglas F-12 y F-17 (UX-46, UX-68; S-74, H-31 resuelto) · **Tipo:** integración y e2e (Maestro) · **Prioridad:** 1
- **Dado:** E29.
- **Cuando:** el 2027-01-05 el propietario inicia "Deuda del arrendatario" (ámbito `occupancy` O-1, `expectedTotalClp` 263.190) y el intento queda en `initiated`.
- **Entonces:**
  - El propietario, que inició el intento, ve en su deuda "Tienes un pago en proceso" y debajo "Número de orden {buy_order}. Te avisaremos el resultado".
  - **El arrendatario no ve ningún estado de pago en curso** (CA-30 rev. 6; UX-68): en su Inicio y en su deuda no aparece ninguna franja, chip, banner ni texto, ni "Tienes un pago en proceso" ni "Ya hay un pago en proceso para esta deuda"; su pantalla es igual a la de un ámbito sin intento (APP-03 y APP-05). La prueba e2e lo verifica buscando los dos textos y el chip de estado. Falla si la app muestra cualquier estado de pago en curso al arrendatario sin que intente pagar.
  - API (S-74): `GET /communities/A/units/{Depto 102}/webpay-attempts/current` del arrendatario responde la lista vacía, **byte a byte igual** a la de la misma consulta antes de que el propietario iniciara el intento: sin el id del intento, sin 263.190, sin el ámbito O-1 bloqueado y sin ningún indicador de que otra persona paga. La del propietario trae su intento con `attemptId`, `startedAt` y el ámbito O-1. Prueba de contrato: ninguna respuesta de `current` tiene el campo `startedByMe` (salió del contrato).
  - Solo si el arrendatario intenta iniciar un pago de su ámbito: 409 `PAYMENT_IN_PROGRESS` con "Ya hay un pago en proceso para esta deuda", sin decir quién paga, y no se crea intento (APP-PAG-04).
  - Si el propietario pide "Ambas" (`owner` y O-1): 409 `PAYMENT_IN_PROGRESS`; la app no le ofrece esa opción.
  - El propietario sí puede iniciar en paralelo "Mi deuda" (`owner`, `expectedTotalClp` 266.814): 2xx, otro intento.

#### TC-GC-CA30-02 · El arrendatario no puede pagar el ámbito `owner`

- **CA:** CA-30, reglas F-12 y "Respuestas de error" · **Tipo:** aislamiento · **Prioridad:** 1
- **Cuando:** el arrendatario envía por la API un intento con el ámbito `owner` y, en otra petición, con `owner` y O-1 mientras O-1 está bloqueado.
- **Entonces:** 404 `NOT_FOUND` en ambos casos, no 409: la visibilidad se valida antes que el estado. No se crea intento ni bloqueo.

#### TC-GC-CA30-03 · Confirmación del pago del propietario sobre el ámbito del arrendatario

- **CA:** CA-30 · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** Transbank confirma $263.190.
- **Entonces:** un `PAYMENT` `origin = webpay` de $263.190 en `occupancy` O-1, imputado a lo no vencido: interés $690, ordinario $250.000 y fondo $12.500. O-1 queda en $0 y `owner` sigue en **$266.814**. El arrendatario ve "Pagado por el propietario · $263.190 · 05-01-2027 · Webpay"; la deuda del ámbito `owner` le responde 404 y ninguna respuesta suya contiene 266.814. El bloqueo de O-1 se libera.

### CA-31 · Pagos manuales con la misma referencia y doble envío

#### TC-GC-CA31-01 · Dos pagos con la misma referencia

- **CA:** CA-31, reglas F-2 y F-3 · **Tipo:** integración y e2e (Playwright) · **Prioridad:** 1
- **Dado:** `2026-10` emitido como en CA-1; Depto 202 sin arrendatario, con ordinario $300.000 y fondo $15.000 impagos (deuda $315.000).
- **Cuando:** el administrador registra una transferencia de $100.000, referencia "transferencia", `paid_on` 2026-11-05 (clave K1), y después otra de $100.000 con la misma referencia y `paid_on` 2026-11-06 (clave K2).
- **Entonces:**
  - El segundo formulario muestra "Ya existe un pago de $100.000 por transferencia con la referencia "transferencia" (Depto 202, 05-11-2026). Revisa que no sea un duplicado" y permite guardar. La primera advertencia de F-3 no aparece, porque las fechas son distintas.
  - Quedan dos `PAYMENT` `origin = manual`, cada uno con su propio `payment_group_id`. La referencia repetida no choca con ningún índice único (la unicidad de `external_ref` es solo para `webpay` e `import`).
  - Los dos se imputan a lo no vencido (fechas de referencia 2026-11-05 y 2026-11-06, antes del vencimiento del 2026-11-11), ordinario primero: ordinario 300.000 − 100.000 − 100.000 = $100.000 y fondo $15.000. Saldo 315.000 − 200.000 = **$115.000**.

#### TC-GC-CA31-02 · Doble envío con la misma clave

- **CA:** CA-31, regla F-2 · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** el envío K2 llega otra vez con el mismo cuerpo, en secuencia y en paralelo.
- **Entonces:** la respuesta es la original (mismo `PAYMENT` y mismo `payment_group_id`), sigue habiendo 2 pagos y el saldo sigue en $115.000.

#### TC-GC-CA31-03 · Misma clave con otro cuerpo

- **CA:** CA-31, regla A-3.4 · **Tipo:** integración · **Prioridad:** 2
- **Cuando:** se envía K2 con monto $90.000.
- **Entonces:** 422 `IDEMPOTENCY_KEY_REUSED` con "Esta operación ya se envió con otros datos. Vuelve a abrir el formulario"; nada escrito.

### CA-32 · Pago manual en una unidad con arrendatario vigente

#### TC-GC-CA32-01 · Sin ámbito elegido

- **CA:** CA-32 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** E22.
- **Cuando:** el 2026-12-04 el administrador registra una transferencia de $262.500 sin asignaciones.
- **Entonces:** 422 `SCOPE_REQUIRED` con "Elige a qué deuda aplicar el pago"; nada escrito (detalle en TC-GC-CB-17).

#### TC-GC-CA32-02 · Registro "Ambos"

- **CA:** CA-32, reglas F-1 y F-12 · **Tipo:** integración · **Prioridad:** 1 · **Oro:** GOLD-A32-01, GOLD-A32-02
- **Dado:** E22.
- **Cuando:** el 2026-12-04 el administrador registra una transferencia con dos asignaciones: `owner` $100.000 y `occupancy` O-1 $162.500.
- **Entonces:**
  - Dos `PAYMENT` `origin = manual` ($100.000 en `owner` y $162.500 en O-1), con el mismo `payment_group_id` G-1 generado por el servidor (distinto de la `Idempotency-Key`), por un total de 100.000 + 162.500 = $262.500.
  - `owner` (fecha de referencia 2026-12-04): $100.000 al ordinario vencido de `2026-10`, que queda en 250.000 − 100.000 = $150.000, más el fondo de $12.500: **$162.500**.
  - `occupancy` O-1: $162.500 al ordinario no vencido de `2026-11`, que queda en 250.000 − 162.500 = $87.500, más el fondo de $12.500: **$100.000**.

#### TC-GC-CA32-03 · Lo que ve el arrendatario de un pago "Ambos"

- **CA:** CA-32, reglas F-12 y F-17 · **Tipo:** aislamiento · **Prioridad:** 1
- **Entonces:** el arrendatario ve "Registrado por la administración · $162.500 · 04-12-2026 · Transferencia" (medio con mayúscula inicial en la línea del pago, S-61). El pago de $100.000 y el grupo G-1 le responden 404; ninguna respuesta suya contiene 100.000 ni 262.500. El propietario ve los dos pagos, cada uno "Registrado por la administración" (S-48), y su lectura del ámbito O-1 queda en auditoría.

#### TC-GC-CA32-04 · Anulación del grupo completo, también después de 30 días

- **CA:** CA-32, CA-40, regla F-4 · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** el administrador pide la anulación desde el pago de $162.500 (`void-preview` y `void` sobre G-1), (a) sin motivo, (b) con motivo, y (c) en otra corrida, el 2027-01-20, 47 días después del registro (27 días de diciembre después del 2026-12-04 más 20 de enero), con la fila de `IDEMPOTENCY_KEY` del registro ya purgada y sin otros movimientos entre medio.
- **Entonces:**
  - (a): 422 `REASON_REQUIRED` con "Indica el motivo de la anulación"; nada escrito.
  - (b) y (c): la vista previa y la anulación incluyen los dos pagos de G-1. Se registran dos débitos de reverso en el borrador vigente: $100.000 en `owner` y $162.500 en O-1. Saldos: `owner` 162.500 + 100.000 = **$262.500** y O-1 100.000 + 162.500 = **$262.500**.
  - No existe una ruta para anular un solo pago del grupo.
  - Una segunda anulación de G-1 responde 409 `PAYMENT_ALREADY_VOIDED` con "El pago ya fue anulado", en la vista previa y en la anulación.

#### TC-GC-CA32-05 · Ámbito repetido

- **CA:** CA-32, regla F-1 · **Tipo:** integración · **Prioridad:** 2
- **Cuando:** el administrador registra un pago con dos asignaciones a `owner` y, en otra petición, con dos asignaciones a O-1.
- **Entonces:** 422 `DUPLICATE_SCOPE` con "Cada deuda puede aparecer una sola vez en el pago" en los dos casos; nada escrito.

### CA-33 · Anular un gasto de un periodo emitido

#### TC-GC-CA33-01 · Cálculo de las notas de crédito

- **CA:** CA-33, regla H-6 · **Tipo:** unitaria · **Prioridad:** 1 · **Oro:** GOLD-A33-01 a GOLD-A33-04
- **Cuando:** se recalcula `2026-10` con la foto de participaciones y el gasto "Aseo y artículos" ($50.000) con monto correcto $0.
- **Entonces:**
  - O = 1.000.000 − 50.000 = $950.000; F = (950.000 × 500 + 9.999) div 10.000 = 475.009.999 div 10.000 = $47.500.
  - Ordinario correcto: 950.000 × 200.000 / 1.000.000 = 190.000; × 250.000 = 237.500; 237.500; × 300.000 = 285.000 (restos 0).
  - Fondo correcto: 47.500 × 200.000 / 1.000.000 = 9.500; 11.875; 11.875; 14.250 (restos 0).
  - Notas (correcto − original): ordinario −10.000, −12.500, −12.500, −15.000 (suma −50.000); fondo −500, −625, −625, −750 (suma −2.500). Total −52.500.

#### TC-GC-CA33-02 · Registro, motivo y saldos

- **CA:** CA-33 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** `2026-10` emitido como en CA-1; Depto 101 pagado completo ($210.000); Depto 202 impago ($315.000); Deptos 102 y 201 impagos ($262.500 cada uno) y Depto 102 sin arrendatario, todo en `owner` (spec CA-33; H-26 resuelto).
- **Cuando:** el 2026-11-20 el administrador anula el gasto (a) sin motivo y (b) con el motivo "No correspondía a la comunidad".
- **Entonces:**
  - (a): 422 `REASON_REQUIRED` con "Indica el motivo de la anulación"; nada cambia.
  - (b): 8 notas de crédito en el borrador vigente `2026-11`, en el ámbito `owner` de cada cargo, con `adjusts_entry_id` al cargo original.
  - Depto 101: sus cargos estaban pagados y no tiene otra deuda, así que se liberan 10.000 + 500 = $10.500, que quedan a favor (saldo **−$10.500**).
  - Depto 202: ordinario 300.000 − 15.000 = $285.000 y fondo 15.000 − 750 = $14.250: saldo **$299.250**.
  - Deptos 102 y 201 (derivado): 262.500 − 12.500 − 625 = **$249.375** cada uno.
  - El gasto queda "Anulado", con su motivo y su monto original de $50.000. Ningún movimiento de `2026-10` cambia.

#### TC-GC-CA33-03 · $0 en la ruta de corrección es anular

- **CA:** CA-33, reglas B-5 y H-6 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** `2026-10` emitido como en CA-1; borrador vigente `2026-11`.
- **Cuando:** el administrador (a) crea un gasto nuevo de $0 y un cargo directo nuevo de $0 en `2026-11`; (b) pide en la ruta de corrección (la misma para corregir y anular) el gasto "Electricidad áreas comunes" de `2026-10` con monto correcto −$1 y, en otra petición, $100,5; (c) lo pide con $0 sin motivo.
- **Entonces:**
  - (a) 422 `INVALID_AMOUNT` con "El monto debe ser un número entero de pesos mayor que $0"; nada escrito.
  - (b) 422 `INVALID_AMOUNT` con el texto propio de las correcciones: "El monto correcto debe ser un número entero de pesos, mayor o igual que $0. Usa $0 solo para anular".
  - (c) se trata como "Anular gasto": 422 `REASON_REQUIRED` con "Indica el motivo de la anulación" (no el de la corrección). Con motivo, la vista previa trae las notas de anular $180.000: O = 1.000.000 − 180.000 = $820.000, F = (820.000 × 500 + 9.999) div 10.000 = 410.009.999 div 10.000 = $41.000; notas ordinario −36.000, −45.000, −45.000, −54.000 (suma −180.000) y fondo −1.800, −2.250, −2.250, −2.700 (suma −9.000).

#### TC-GC-CA33-04 · Corrección sin cambios y orden de validación (H-7)

- **CA:** CA-33, regla H-7, "Orden entre reglas de negocio" · **Tipo:** integración · **Prioridad:** 2
- **Dado:** el estado final de TC-GC-CA33-02 ("Aseo y artículos" anulado) y el gasto "Mantención ascensor" de `2026-10` ($120.000, ordinario, alícuota, subcategoría Mantención).
- **Cuando:** el administrador pide la vista previa de corrección de "Mantención ascensor" (a) con −$1 y sin motivo; (b) con $120.000, la misma cuenta, base, conjunto y subcategoría, y sin motivo; (c) con $110.000 y sin motivo; (d) con $120.000 y la subcategoría Reparación, con motivo; y (e) pide anular otra vez "Aseo y artículos" con motivo.
- **Entonces:**
  - (a) 422 `INVALID_AMOUNT` con el texto de las correcciones (el monto va primero).
  - (b) 422 `CORRECTION_WITHOUT_CHANGE` con "La corrección no cambia el gasto. No hay nada que corregir" (antes que el motivo); nada escrito.
  - (c) 422 `REASON_REQUIRED` con "Indica el motivo de la corrección".
  - (d) se acepta sin movimientos (solo cambia la subcategoría, H-3) y queda como nota en el aviso del borrador vigente.
  - (e) 422 `CORRECTION_WITHOUT_CHANGE` con "Este gasto ya está anulado. No hay nada que corregir".
  - Ninguna petición rechazada escribe movimientos ni auditoría de escritura. El formulario muestra bajo el motivo la ayuda "El motivo aparecerá en el aviso de cobro", que no es un error.

### CA-34 · Anular el único gasto de un grupo (Comunidad B)

#### TC-GC-CA34-01 · Grupo que queda en $0

- **CA:** CA-34, regla H-6 · **Tipo:** unitaria · **Prioridad:** 1 · **Oro:** GOLD-B34-01 a GOLD-B34-03
- **Cuando:** se anula el extraordinario de $300.000 de `2026-10` (CA-16).
- **Entonces:** el grupo (extraordinario, partes iguales) queda en $0 y el cargo correcto de cada casa es $0. Nota de crédito por casa: 0 − 100.000 = −$100.000 en la cuenta `extraordinario` (suma −$300.000). El ordinario ($31.746 por casa) y el fondo ($4.762: 1.588, 1.587 y 1.587) no cambian, porque el extraordinario no genera recargo.

#### TC-GC-CA34-02 · Saldos de las casas

- **CA:** CA-34 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** Casa 1 pagada completa (31.746 + 1.588 + 100.000 = $133.334); Casa 2 y Casa 3 impagas (31.746 + 1.587 + 100.000 = $133.333 cada una; spec CA-34, H-26 resuelto).
- **Cuando:** el administrador anula el extraordinario con el motivo "Obra aprobada dos veces".
- **Entonces:** Casa 1 con **$100.000 a favor**; Casa 2 con 133.333 − 100.000 = **$33.333** pendientes ($31.746 de ordinario y $1.587 de fondo); Casa 3 igual que la Casa 2.

### CA-35 · Webpay iniciado antes del término de la ocupación y confirmado después

#### TC-GC-CA35-01 · Término con un intento en curso

- **CA:** CA-35, reglas F-13 y F-14 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** E22.
- **Cuando:** el 2026-12-05 a las 10:00 el arrendatario inicia un pago Webpay de $262.500 de su ámbito (orden `OC-2026-0005`, dato de prueba) y a las 10:05 el administrador pide la vista previa del término de O-1 con fecha 2026-12-04 y la confirma.
- **Entonces:**
  - La vista previa muestra "Hay un pago en línea en curso del arrendatario. Si se confirma, se aplicará a la deuda de la unidad", y esa advertencia forma parte de la huella.
  - Traspaso al ámbito `owner`: ordinario $250.000 y fondo $12.500 de `2026-11`, que conservan su vencimiento del 2026-12-11. `owner` 262.500 + 262.500 = **$525.000**; O-1 **$0**.
  - La membresía del arrendatario termina a las 10:05: desde ahí recibe 404 en la unidad, en sus movimientos y en el detalle de su intento.

#### TC-GC-CA35-02 · Confirmación tardía

- **CA:** CA-35, regla F-13 · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** a las 10:08 Transbank confirma $262.500 (`paid_on` 2026-12-05).
- **Entonces:**
  - En una sola transacción: un `PAYMENT` `origin = webpay` de $262.500 en `occupancy` O-1 (el ámbito del intento), que queda a favor, y un traspaso de ese saldo a favor al ámbito `owner` (débito en O-1, crédito en `owner`).
  - En `owner` se imputa con F-5 al capital vencido de `2026-10`: ordinario $250.000 y fondo $12.500.
  - `owner` queda en 525.000 − 262.500 = **$262.500** (lo traspasado de `2026-11`) y O-1 en $0, sin deuda ni saldo a favor.
  - El ex arrendatario no recibe push. Recibe en su correo verificado el asunto "Tu pago en línea en Comunidad A" y el texto "Tu pago en línea con número de orden OC-2026-0005 en Comunidad A se registró. Si tienes dudas, contacta a la administración de tu comunidad", sin montos. El envío queda en auditoría (`notification.sent_without_membership`).

#### TC-GC-CA35-03 · Lo que ve el propietario después del término

- **CA:** CA-35, regla "Datos del arrendatario que ve el propietario" · **Tipo:** aislamiento · **Prioridad:** 1
- **Entonces:** en su ámbito `owner`, sin el nombre del ex arrendatario, el propietario ve la deuda traspasada como "Traspaso desde arriendo terminado el 05-12-2026" y el saldo a favor de la confirmación tardía como "Saldo a favor traspasado desde arriendo terminado el 05-12-2026". Las dos fechas son la de registro del término (2026-12-05), no la declarada (2026-12-04), aunque el saldo a favor llegue después (F-13, F-17; H-27). Falla si algún rótulo dice "04-12-2026" o "Pago del arrendatario anterior". Los datos de la ocupación terminada (nombre, pagos de O-1, intento) le responden 404.

### CA-36 · Nota de crédito sobre un cargo de una ocupación terminada

#### TC-GC-CA36-01 · Liberación y traspaso al ámbito `owner`

- **CA:** CA-36, regla F-13 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** el estado final de TC-GC-CA35-02: `owner` con ordinario $250.000 y fondo $12.500 traspasados de `2026-11` (vencen el 2026-12-11); O-1 en $0. Borrador vigente `2026-12`.
- **Cuando:** el 2026-12-15 el administrador corrige la electricidad de `2026-11` de $180.000 a $170.000.
- **Entonces:**
  - Recalculo con la foto de `2026-11`: O = $990.000 y F = (990.000 × 500 + 9.999) div 10.000 = 495.009.999 div 10.000 = $49.500. Depto 102: ordinario 247.500 − 250.000 = −$2.500 y fondo 12.375 − 12.500 = −$125.
  - Las dos notas se registran en `occupancy` O-1, el ámbito del cargo ajustado. Ese cargo ya estaba saldado por el traspaso, así que se liberan 2.500 + 125 = $2.625, que quedan a favor en O-1 y se traspasan en la misma transacción al ámbito `owner`, rotulados "Saldo a favor traspasado desde arriendo terminado el 05-12-2026".
  - El crédito de traspaso hereda el `paid_on` de la nota de crédito que lo generó: el vencimiento del cargo ajustado, 2026-12-11 (F-11, F-13, S-54). Fecha de referencia máx(2026-12-11, 2026-12-05) = 2026-12-11, así que el ordinario traspasado de `2026-11` (vence el 2026-12-11) **no está vencido** y se imputa en el paso "lo no vencido" de F-5, ordinario → fondo.
  - El ordinario traspasado queda en 250.000 − 2.625 = $247.375, más el fondo de $12.500: **$259.875** (montos iguales a la versión anterior). O-1 sigue en $0, sin deuda ni saldo a favor.
  - Las demás unidades reciben sus notas en su ámbito: Depto 101 −$2.000 y −$100; Depto 201 −$2.500 y −$125; Depto 202 −$3.000 y −$150. Suma total −$10.500.
  - El caso en que esa fecha cambia el resultado está en TC-GC-CB-31.

### CA-37 · Ingreso y término retroactivos de un arrendatario

#### TC-GC-CA37-01 · Ingreso retroactivo

- **CA:** CA-37, regla F-14 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** Depto 102 sin arrendatario vigente; `2026-11` emitido el 2026-12-01 con $262.500 en `owner`, impago.
- **Cuando:** el 2026-12-03 el administrador registra la ocupación O-2 (Camila Rojas) con fecha de ingreso 2026-11-15.
- **Entonces:** la vista previa muestra "La fecha de ingreso es anterior a hoy. Los cargos ya emitidos no cambian de responsable". O-2 queda con `effective_from` = máx(2026-11-15, 2026-12-03) = 2026-12-03 y su membresía nace con `valid_from` 2026-12-03. El cargo de `2026-11` sigue en `owner`.

#### TC-GC-CA37-02 · Visibilidad por ámbito, nunca por fecha

- **CA:** CA-37, regla F-9 (visibilidad) · **Tipo:** aislamiento · **Prioridad:** 1
- **Cuando:** el 2026-12-04 la arrendataria de O-2 pide su saldo y el cargo de `2026-11` del Depto 102.
- **Entonces:** su saldo es $0 y el cargo de `2026-11` le responde 404, aunque se emitió después de su fecha de ingreso declarada.

#### TC-GC-CA37-03 · Emisión con O-2 y término retroactivo

- **CA:** CA-37 · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** se emite `2026-12` el 2027-01-01 con $262.500 para el Depto 102; el 2027-01-05 la arrendataria consulta su ámbito; el 2027-01-10 el administrador registra el término de O-2 con fecha 2026-12-31, sin pagos.
- **Entonces:**
  - El cargo de `2026-12` va a `occupancy` O-2. El 2027-01-05 la arrendataria lo ve ($262.500): el término declarado del 2026-12-31 aún no está registrado.
  - El traspaso se hace el 2027-01-10: los $262.500 de `2026-12` pasan a `owner`, que queda en 262.500 + 262.500 = **$525.000**; O-2 queda en $0.
  - La ex arrendataria recibe 404 desde el 2027-01-10.

### CA-38 · Unidad con arrendatario sin propietario registrado

#### TC-GC-CA38-01 · Vista previa y emisión

- **CA:** CA-38, regla F-15 · **Tipo:** integración · **Prioridad:** 1 · **Oro:** GOLD-A-01 a GOLD-A-04
- **Dado:** el borrador `2026-10` de CA-1; Depto 102 con la ocupación vigente O-3 (Jorge Vera) y sin propietario registrado.
- **Cuando:** el administrador pide la vista previa de emisión y emite el 2026-11-01.
- **Entonces:** la vista previa muestra "Unidades sin propietario registrado: Depto 102. Su aviso se emitirá a nombre de 'Propietario sin registrar'" y no bloquea. Los cargos son GOLD-A (total $1.050.000); los del Depto 102 (ordinario $250.000 y fondo $12.500) van a `occupancy` O-3.

#### TC-GC-CA38-02 · Aviso y notificaciones

- **CA:** CA-38, reglas F-15 y G-6 · **Tipo:** integración · **Prioridad:** 2
- **Entonces:** el aviso legal del Depto 102 dice "Propietario: sin registrar" y no se notifica a ningún propietario del Depto 102. El arrendatario recibe "Tienes un nuevo cobro de gasto común de octubre de 2026. Vence el 11-11-2026" y ve $262.500 en su ámbito.

### CA-39 · Emisión confirmada contra la versión del borrador

#### TC-GC-CA39-01 · Otro administrador cambia el borrador

- **CA:** CA-39, regla A-7 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** el borrador `2026-10` de CA-1, con saldo de caja ingresado.
- **Cuando:** el 2026-11-01 `admin-A` pide la vista previa (v1, total emitido $1.050.000); `admin2-A` agrega un gasto (ordinario, alícuota) "Jardinería" de $10.000; `admin-A` confirma con v1 y una clave nueva.
- **Entonces:** 409 `PREVIEW_OUTDATED` con "El borrador cambió desde la vista previa. Revisa la nueva vista previa antes de emitir"; `2026-10` sigue en borrador; 0 cargos, 0 movimientos, sin foto ni borrador nuevo.

#### TC-GC-CA39-02 · Emisión con la versión nueva

- **CA:** CA-39 · **Tipo:** unitaria e integración · **Prioridad:** 1 · **Oro:** GOLD-A39-01 a GOLD-A39-04
- **Cuando:** pide la vista previa v2 y la confirma.
- **Entonces:**
  - O = 1.000.000 + 10.000 = $1.010.000; F = (1.010.000 × 500 + 9.999) div 10.000 = 505.009.999 div 10.000 = $50.500.
  - Ordinario: 1.010.000 × 200.000 / 1.000.000 = 202.000; × 250.000 = 252.500; 252.500; × 300.000 = 303.000. Fondo: 50.500 × 200.000 / 1.000.000 = 10.100; 12.625; 12.625; 15.150. Restos 0.
  - Totales: Depto 101 $212.100; Depto 102 $265.125; Depto 201 $265.125; Depto 202 $318.150. Suma 1.010.000 + 50.500 = **$1.060.500**.

#### TC-GC-CA39-03 · Cambio de día entre la vista previa y la confirmación

- **CA:** CA-39 · **Tipo:** integración · **Prioridad:** 2
- **Cuando:** la vista previa se pide el 2026-10-31 a las 23:50 y se confirma el 2026-11-01 a las 00:05, hora de Chile.
- **Entonces:** 409 `PREVIEW_OUTDATED`, porque cambian la fecha de emisión y el vencimiento (2026-11-10 frente a 2026-11-11); nada escrito.

#### TC-GC-CA39-04 · Pago que queda a favor: 409 también con el flag apagado

- **CA:** CA-39, regla A-7 (H-22) · **Tipo:** integración · **Prioridad:** 1
- **Dado:** la vista previa v2 de TC-GC-CA39-02 (primera emisión, sin deudas anteriores), flag apagado.
- **Cuando:** antes de confirmar v2, el administrador registra un pago manual de $10.000 del Depto 101 (`owner`), que queda a favor; luego confirma con v2.
- **Entonces:** 409 `PREVIEW_OUTDATED` con "El borrador cambió desde la vista previa. Revisa la nueva vista previa antes de emitir": al emitir, ese saldo a favor se imputaría al ordinario del Depto 101 (A-3.3.7), así que cambia lo que escribe la emisión. Nada escrito. Con una vista previa nueva (v3), el Depto 101 recibe los mismos cargos ($212.100) y la emisión imputa $10.000 a su ordinario: pendiente 202.000 − 10.000 = $192.000 más el fondo de $10.100 = $202.100.

#### TC-GC-CA39-05 · Pago que no cambia la emisión, y flag activo

- **CA:** CA-39, regla A-7 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** `2026-10` emitido como en CA-1; borrador `2026-11` con los gastos de CA-1; Depto 102 (sin arrendatario) con $262.500 de `2026-10` impagos y Depto 202 con $315.000 de `2026-10` impagos.
- **Cuando:** se pide la vista previa de `2026-11` el 2026-12-01 y, antes de confirmar, (a) con el flag apagado se registra un pago de $262.500 del Depto 102 que salda su `2026-10` sin dejar saldo a favor; (b) con el flag activo y tasas por defecto se registra un pago de $100.000 del Depto 202 con `paid_on` 2026-11-20.
- **Entonces:** (a) la emisión se hace sin 409, aunque cambien el saldo anterior y el total a pagar del aviso del Depto 102. (b) 409 `PREVIEW_OUTDATED`, porque el interés del Depto 202 pasa de piso(315.000 × 19 × 1.200 / 3.650.000) = piso(1.967,6712…) = $1.967 a piso((315.000 × 8 + 215.000 × 11) × 1.200 / 3.650.000) = piso(1.606,0273…) = $1.606 (fecha efectiva 2026-11-20, como en CA-27).

### CA-40 · Anulación de un pago confirmada contra su estado

#### TC-GC-CA40-01 · Pago nuevo entre la vista previa y la anulación

- **CA:** CA-40, reglas A-7 y F-4 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** CA-12 antes de anular: Depto 202 (`owner`) con P1 ($315.000, cheque, `origin = manual`, grupo de un pago) imputado a todo `2026-10` y P2 ($100.000) a favor.
- **Cuando:** el 2026-11-20 `admin-A` pide la vista previa de la anulación de P1 (h1, saldo resultante 315.000 − 100.000 = $215.000); `admin2-A` registra un pago en efectivo de $15.000, que queda a favor (saldo a favor 100.000 + 15.000 = $115.000); `admin-A` confirma con h1 y una clave nueva.
- **Entonces:** 409 `PREVIEW_OUTDATED` con "La cuenta de la unidad cambió desde la vista previa. Revisa la nueva vista previa antes de anular"; nada escrito.

#### TC-GC-CA40-02 · Anulación con la vista previa nueva

- **CA:** CA-40 · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** pide la vista previa h2 (saldo resultante $200.000) y la confirma.
- **Entonces:** débito de reverso de $315.000 en `2026-11`. Los saldos a favor se reimputan del crédito más antiguo al más reciente: P2 $100.000 y luego el efectivo $15.000, ambos al ordinario de `2026-10`, que queda en 300.000 − 115.000 = $185.000, más el fondo de $15.000: saldo **$200.000**, sin saldo a favor.

#### TC-GC-CA40-03 · Doble anulación y otros orígenes

- **CA:** CA-40, regla F-4 · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** (a) `admin2-A` intenta anular P1 otra vez; (b) `admin-A` reintenta su anulación con la misma clave; (c) el administrador intenta anular el pago Webpay de CA-10.
- **Entonces:** (a) 409 `PAYMENT_ALREADY_VOIDED` con "El pago ya fue anulado", en la vista previa y en la anulación; (b) el resultado original, sin escritura nueva; (c) 422 `PAYMENT_NOT_VOIDABLE` con "Este pago no se puede anular desde ComVive".

### CA-41 · Intento Webpay en revisión resuelto por Soporte ComVive

#### TC-GC-CA41-01 · El intento entra en revisión

- **CA:** CA-41, regla F-16 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** el estado de CA-5: Depto 101 con ordinario $100.000 y fondo $10.000 de `2026-10` (vencidos el 2026-11-11), deuda $110.000; borrador vigente `2026-11`.
- **Cuando:** el miércoles 2026-11-25 el propietario inicia un pago de $110.000 (`OC-2026-0002`) y Transbank autoriza $11.000.
- **Entonces:** no se registra ningún pago; el intento pasa a `in_review` con `review_due_on` 2026-12-02 y `lock_active` falso; el saldo sigue en $110.000. El propietario ve "En revisión por ComVive" y debajo "Te avisaremos cuando se resuelva. Número de orden OC-2026-0002". Si vuelve a pagar, la app advierte "Tienes un pago en revisión por $110.000; si pagas de nuevo podría quedar saldo a favor". `<monto>` es el monto iniciado, no el autorizado ($11.000) (F-16, F-17; H-23 resuelto).

#### TC-GC-CA41-02 · La comunidad ve el intento, pero no lo resuelve

- **CA:** CA-41, M-4 · **Tipo:** permisos · **Prioridad:** 1
- **Cuando:** `admin-A` y `comite-A` listan los intentos de la comunidad y llaman a `POST /platform/webpay-attempts/{id}/resolution-preview` y `.../resolution`.
- **Entonces:** el listado muestra el intento (orden, Depto 101, tipo `owner`, $110.000 iniciados, $11.000 autorizados, `in_review`, plazo 2026-12-02); la lectura del comité queda en auditoría. Las dos rutas de plataforma responden 404 `NOT_FOUND` y nada cambia.

#### TC-GC-CA41-03 · Soporte registra por el monto autorizado

- **CA:** CA-41, reglas F-16 y EX-1 · **Tipo:** integración y aislamiento · **Prioridad:** 1
- **Cuando:** el 2026-11-26 `soporte-1` pide la vista previa de `register_authorized` y la confirma (a) sin motivo y (b) con su `previewHash`, un motivo y una clave nueva.
- **Entonces:**
  - Vista previa: solo campos de EX-1 más `paymentToCreate` = {$11.000, `owner`, `2026-11`}; la respuesta no trae la deuda de $110.000 ni la imputación (prueba de contrato con lista cerrada de campos).
  - (a): 422 `REASON_REQUIRED` con "Indica el motivo de la resolución"; nada escrito.
  - (b): un `PAYMENT` `origin = webpay` de $11.000, `paid_on` 2026-11-25, `external_ref` `OC-2026-0002`, `payment_group_id` = id del intento, en `2026-11`; el intento pasa a `resolved_paid`. Se imputa al ordinario vencido de `2026-10`: 100.000 − 11.000 = $89.000, más el fondo de $10.000: saldo **$99.000**.
  - La lectura, la vista previa y la resolución quedan en auditoría con la persona de Soporte y el motivo.

#### TC-GC-CA41-04 · Fuera de la vista, reverso y dos ámbitos

- **CA:** CA-41, regla F-16 (decisiones del líder D2, D4, D7 y D8; M-3 de la revisión 4) · **Tipo:** integración y aislamiento · **Prioridad:** 1
- **Cuando:** (a) Soporte lee o resuelve otra vez `OC-2026-0002`; (b) en otra corrida, el 2026-11-26, `soporte-1` lo marca para reverso y después confirma el reverso; (c) un intento de dos ámbitos en `in_review` (dato de prueba: `OC-2027-0001` de CA-29, con $530.004 iniciados y $500.000 autorizados) se intenta registrar y después se marca para reverso.
- **Doble de Transbank:**
  - (b): la consulta de estado de la vista previa y la de la ejecución responden `AUTHORIZED`, `amount` 11.000, sin `balance` (sin anulaciones previas). El reembolso, ejecutado más de 3 horas después de la autorización del 2026-11-25, responde una anulación: `type` `NULLIFIED`, `authorization_code` 730415 (dato de prueba), `nullified_amount` 11.000, `balance` 0, `response_code` 0.
  - (c): las dos consultas responden `AUTHORIZED`, `amount` 500.000, sin `balance`.
- **Entonces:**
  - (a): 404 `NOT_FOUND` en el detalle, la vista previa y la resolución.
  - (b), vista previa de `mark_for_reversal`: campos de EX-1 con estado de Transbank `AUTHORIZED` (`transbankStatusSource = query`), "Se pedirá reembolso: sí, por $11.000" (total autorizado, porque no hay `balance`; nunca el monto iniciado de $110.000) y "pago a crear: ninguno".
  - (b), ejecución con motivo: el intento pasa a `reversal_pending`, sin `PAYMENT` ni movimiento. En la misma transacción se crea **una** `WEBPAY_REFUND` con `amount_clp` 11.000, `outcome` `pending` y `source_gateway_call_id` = la fila de `WEBPAY_GATEWAY_CALL` de la consulta de la ejecución. El detalle del intento del propietario expone `reversalKind = refund_requested` y la app muestra "Tu pago no se registró. Se solicitará la devolución del monto a Transbank". La consola muestra "Intento OC-2026-0002 marcado para reverso. ComVive ya pidió la anulación a Transbank. Cuando Transbank responda, revisa la referencia propuesta y confirma el reverso".
  - (b), reembolso: el doble recibe **una sola** llamada de reembolso, por $11.000, con el comercio `MC-A-1` y el token de `OC-2026-0002`. `WEBPAY_REFUND.outcome` pasa a `nullified`, con `authorization_code` 730415. El estado del intento no cambia (sigue en `reversal_pending`).
  - (b), `confirm_reversal`: la vista previa propone la referencia 730415 y **no** muestra la advertencia "Transbank no confirmó la devolución de este intento…" (el reembolso es `nullified`, D7). Sin referencia, 422 `REVERSAL_REFERENCE_REQUIRED`. Con 730415 y motivo, el intento pasa a `reversed`; la consola muestra "Reverso confirmado para el intento OC-2026-0002. Referencia de Transbank: 730415" y el propietario ve "Tu pago fue anulado en Transbank. El reembolso a tu medio de pago depende de tu banco".
  - (b), dinero: ningún `PAYMENT`, `LEDGER_ENTRY` ni `ALLOCATION` en todo el caso; el saldo sigue en 100.000 + 10.000 = **$110.000**.
  - (c): `register_authorized` responde 422 `MULTI_SCOPE_REVIEW_REVERSAL_ONLY` con "Un pago que cubre dos deudas solo se puede marcar para reverso"; nada escrito. `mark_for_reversal` sí se acepta: su vista previa dice "Se pedirá reembolso: sí, por $500.000" (total autorizado, no los $530.004 iniciados) y la ejecución crea una `WEBPAY_REFUND` de $500.000, con `reversalKind = refund_requested`. Los dos ámbitos siguen igual: `owner` **$266.814** y `occupancy` O-1 **$263.190** (suma 530.004).

#### TC-GC-CA41-05 · Plazo de 5 días hábiles

- **CA:** CA-41, regla F-16 · **Tipo:** integración · **Prioridad:** 2
- **Cuando:** el intento sigue en `in_review` al terminar el 2026-12-02.
- **Entonces:** el plazo cuenta jueves 26, viernes 27, lunes 30, martes 1 y miércoles 2 (sin feriados nacionales). El 2026-12-03 se marca "Plazo vencido" y se envía la alerta a Soporte con solo el id del intento y su número de orden.

### CA-42 · Aislamiento del rol Soporte ComVive

Los casos de CA-42 están en la sección de aislamiento, "De plataforma": ISO-GC-plataforma-1 a 12.

### CA-43 · Otorgamiento de roles

#### TC-GC-CA43-01 · Otorgar el rol de comité

- **CA:** CA-43 · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** `admin-A` otorga el rol de comité a Rosa Díaz (propietaria del Depto 201) con la referencia "Asamblea ordinaria del 20-10-2026".
- **Entonces:** membresía `committee` con `granted_by` = `admin-A` y `granted_via = community`; un registro de auditoría `membership.grant`.

#### TC-GC-CA43-02 · Personas que no pueden ser comité

- **CA:** CA-43, S-34 · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** `admin-A` otorga el comité (a) al arrendatario del Depto 102 y (b) al propietario del Depto 202 sin referencia a la asamblea.
- **Entonces:** (a) 422 `COMMITTEE_REQUIRES_OWNER` con "El rol de comité solo se otorga a propietarios registrados de la comunidad"; (b) 422 `ASSEMBLY_REFERENCE_REQUIRED` con "Indica la asamblea que eligió al comité: fecha y referencia". Ninguna membresía nueva.

#### TC-GC-CA43-03 · El administrador no otorga administradores

- **CA:** CA-43, M-4 · **Tipo:** permisos · **Prioridad:** 1
- **Cuando:** `admin-A` (a) envía `POST /communities/A/memberships` con `role = admin`; (b) revoca una membresía `admin` por la ruta de comunidad, incluida la propia; (c) usa `POST /platform/communities/A/admin-memberships`. `comite-A` (d) otorga el comité a otra persona.
- **Entonces:** (a), (b) y (d) 403 `FORBIDDEN` con "Tu rol no permite esta acción" (ven las membresías o el registro); (c) 404 `NOT_FOUND` (una sesión de comunidad no ve rutas de plataforma). Nada cambia.

#### TC-GC-CA43-04 · Operaciones ComVive otorga administradores

- **CA:** CA-43 · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** `operaciones-1` otorga el rol de administrador de la Comunidad A (a) a una persona sin rol en A y (b) a Rosa Díaz, que integra el comité.
- **Entonces:** (a) membresía `admin` con `granted_via = platform` y auditoría; (b) 422 `ADMIN_COMMITTEE_CONFLICT` con "Esta persona integra el comité de la comunidad. Primero se debe revocar su rol de comité"; nada cambia.

#### TC-GC-CA43-05 · Administradora que no puede ser comité

- **CA:** CA-43, S-43 · **Tipo:** integración · **Prioridad:** 2
- **Dado:** Ana Pérez, propietaria del Depto 101, es además administradora de la Comunidad A (dato de escenario).
- **Cuando:** `admin2-A` le otorga el rol de comité con referencia a la asamblea.
- **Entonces:** 422 `ADMIN_COMMITTEE_CONFLICT` con "Esta persona es administradora de la comunidad. No puede integrar también el comité".

#### TC-GC-CA43-06 · Revocación del comité

- **CA:** CA-43, M-4 · **Tipo:** permisos · **Prioridad:** 1
- **Cuando:** `admin-A` revoca el rol de comité de Rosa Díaz y, en la petición siguiente, ella pide el registro de copropietarios, la deuda del Depto 202, los reportes, los intentos Webpay de la comunidad y su propio Depto 201.
- **Entonces:** 404 `NOT_FOUND` en todo lo que solo ve el comité, desde la petición siguiente y con la misma sesión; 2xx en su Depto 201 como residente propietaria. Sus sesiones **no** se revocan (`SESSION.revoked_at` sigue nulo; S-81, H-42 resuelto): sigue usando la app sin volver a ingresar. Se eliminan, en la misma transacción, sus suscripciones push ligadas a la membresía de comité; las de su membresía de residente no cambian. La revocación y la eliminación de las suscripciones quedan en auditoría (`membership.revoke`).

### CA-44 · Datos de copropietarios que ve el comité

#### TC-GC-CA44-01 · Lectura del comité

- **CA:** CA-44 · **Tipo:** integración y datos personales · **Prioridad:** 1
- **Dado:** E22; el propietario del Depto 102 (Luis Muñoz) tiene RUT, teléfono y correo registrados. Su RUT es 12.345.670-K, distinto del de la propietaria del Depto 101 en CA-46 (spec CA-44; H-24 resuelto).
- **Cuando:** `comite-A` lee el registro de copropietarios.
- **Entonces:** para el Depto 102 recibe nombre del propietario, alícuota 25,00 %, RUT `12.345.***-*`, ámbito propietario con deuda $262.500 y saldo a favor $0, y ámbito "Arrendatario" con deuda $262.500 y saldo a favor $0. La respuesta de la API no trae teléfono, correo, RUT completo, ni nombre o RUT del arrendatario (prueba de contrato: ninguna clave ni valor con esos datos). Un registro de auditoría por petición.

#### TC-GC-CA44-02 · Lectura del administrador

- **CA:** CA-44 · **Tipo:** integración · **Prioridad:** 1
- **Entonces:** `admin-A` recibe además el RUT completo, el teléfono, el correo y el nombre y RUT del arrendatario (Pedro Soto). La lectura queda en auditoría (RUT completo y deudas de terceros).

### CA-45 · Notificación automática al emitir y avisos sin notificar

#### TC-GC-CA45-01 · Notificaciones y alerta

- **CA:** CA-45, regla G-6 · **Tipo:** integración · **Prioridad:** 2
- **Dado:** el borrador `2026-10` de CA-1; el Depto 102 con una ocupación vigente (dato de prueba: O-6, Tomás Reyes); el correo del propietario del Depto 101 rebota y no tiene la app instalada.
- **Cuando:** el administrador emite el 2026-11-01.
- **Entonces:**
  - Los propietarios de los Deptos 102, 201 y 202 reciben "Ya está disponible tu aviso de cobro de octubre de 2026. Vence el 11-11-2026".
  - El arrendatario del Depto 102 recibe "Tienes un nuevo cobro de gasto común de octubre de 2026. Vence el 11-11-2026".
  - El administrador ve "Avisos sin notificar: Depto 101" y puede reenviar el aviso. El vencimiento del Depto 101 sigue siendo el 2026-11-11.
  - Cada envío queda en auditoría.

#### TC-GC-CA45-02 · Un error al notificar no revierte la emisión

- **CA:** CA-45 · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** el servicio de notificaciones falla por completo durante la emisión.
- **Entonces:** `2026-10` queda emitido con los 8 cargos de GOLD-A (total $1.050.000) y el borrador `2026-11` creado; las cuatro unidades aparecen en "Avisos sin notificar".

### CA-46 · RUT enmascarado en el PDF del aviso

#### TC-GC-CA46-01 · Un solo PDF con el RUT enmascarado

- **CA:** CA-46, regla G-2 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** el aviso de `2026-10` del Depto 101; su propietaria (Ana Pérez) tiene RUT 12.345.678-5.
- **Cuando:** lo descargan la propietaria, `admin-A` y `comite-A`.
- **Entonces:** los tres archivos tienen el mismo SHA-256; el texto del PDF contiene `12.345.***-*` y no contiene "12.345.678-5". En la pantalla de la app, la propietaria ve su RUT completo, 12.345.678-5.

### CA-47 · Vista del cobro del arrendatario y resumen de gastos

#### TC-GC-CA47-01 · Contenido de la vista del cobro

- **CA:** CA-47, regla G-7 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** E22 (gastos de CA-1 en `2026-11`).
- **Cuando:** el arrendatario de O-1 abre el cobro de `2026-11`.
- **Entonces:** ve Comunidad A, Depto 102, periodo `2026-11`, emitido el 01-12-2026, vence el 11-12-2026, alícuota 25,00 %, ordinario $250.000, fondo $12.500, saldo anterior $0, pagos recibidos $0, total a pagar 250.000 + 12.500 = $262.500 y 0 cuotas impagas.

#### TC-GC-CA47-02 · Resumen de gastos sin datos de terceros

- **CA:** CA-47, regla G-8 · **Tipo:** integración y datos personales · **Prioridad:** 1
- **Entonces:** el resumen tiene "Remuneraciones del personal" $650.000, "Electricidad áreas comunes" $180.000, "Mantención ascensor" $120.000 y "Aseo y artículos" $50.000; gastos ordinarios 650.000 + 180.000 + 120.000 + 50.000 = $1.000.000; fondo de reserva $50.000. La respuesta no contiene "Remuneración conserje", el nombre ni el RUT del propietario, los $262.500 del ámbito `owner` ni el total de la unidad (262.500 + 262.500 = $525.000). El propietario ve el mismo resumen con la misma línea agregada.

#### TC-GC-CA47-03 · Aviso legal 404 y comprobante de cobro

- **CA:** CA-47, regla G-7, S-40 · **Tipo:** aislamiento · **Prioridad:** 1
- **Cuando:** el arrendatario pide el aviso legal del Depto 102 y su comprobante de cobro.
- **Entonces:** el aviso legal responde 404 `NOT_FOUND`. El comprobante responde 2xx: un PDF titulado "Comprobante de cobro (no es el aviso de cobro legal)" con el contenido de TC-GC-CA47-01 y el resumen de G-8, generado al emitir; dos descargas dan el mismo archivo.

### CA-48 · Cierre de un periodo

#### TC-GC-CA48-01 · Foto de saldos al cerrar

- **CA:** CA-48, regla A-5 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** `2026-10` emitido el 2026-11-01 como en CA-1; `2026-11` borrador vigente; pago de $100.000 del Depto 101 (`paid_on` y `recorded_at` 2026-11-05).
- **Cuando:** el 2026-11-30 a las 18:00 el administrador cierra `2026-10`.
- **Entonces:** `2026-10` queda `cerrado` y la foto (todo en `owner`) es: Depto 101 ordinario 200.000 − 100.000 = $100.000 y fondo $10.000 (total $110.000); Depto 102 $250.000 y $12.500 ($262.500); Depto 201 $250.000 y $12.500 ($262.500); Depto 202 $300.000 y $15.000 ($315.000). Suma ordinario $900.000, fondo $50.000, total **$950.000** = 1.050.000 emitidos − 100.000 imputados.

#### TC-GC-CA48-02 · Pago registrado después del cierre

- **CA:** CA-48 · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** el 2026-12-03 se registra un pago de $315.000 del Depto 202 con `paid_on` 2026-11-20.
- **Entonces:** el pago queda en el borrador vigente `2026-11`; el saldo del Depto 202 en el libro es $0, pero la foto de `2026-10` sigue mostrando $315.000 (solo considera imputaciones con `recorded_at` ≤ 2026-11-30 18:00).

#### TC-GC-CA48-03 · Cierres repetidos o en borrador

- **CA:** CA-48 · **Tipo:** integración · **Prioridad:** 2
- **Cuando:** se cierra `2026-10` otra vez con otra clave y con la misma clave; se cierra `2026-11` (borrador).
- **Entonces:** otra clave: 409 `PERIOD_ALREADY_CLOSED` con "El periodo ya está cerrado"; misma clave: el resultado original; `2026-11`: 409 `PERIOD_NOT_ISSUED` con "Solo se puede cerrar un periodo emitido".

#### TC-GC-CA48-04 · Escritura en el periodo cerrado

- **CA:** CA-48 · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** el administrador agrega un gasto a `2026-10`.
- **Entonces:** 409 `PERIOD_NOT_EDITABLE` con "El periodo 2026-10 está cerrado. Registra el movimiento en el borrador vigente"; nada escrito.

### CA-49 · Total de la unidad en el aviso legal con saldo a favor en un ámbito

#### TC-GC-CA49-01 · Deudas brutas sin compensar

- **CA:** CA-49, regla F-9 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** E22; el 2026-12-05 el arrendatario paga $300.000: se imputan $262.500 a `2026-11` y quedan 300.000 − 262.500 = $37.500 a favor en O-1.
- **Cuando:** se emite `2026-12` el 2027-01-01 sin gastos (flag apagado).
- **Entonces:** el aviso legal muestra `owner` deuda $262.500 y saldo a favor $0; `occupancy` O-1 deuda $0 y saldo a favor $37.500; "Total adeudado de la unidad" 262.500 + 0 = $262.500 (no 262.500 − 37.500 = $225.000); "Saldo a favor (no compensado)" $37.500. El comprobante del arrendatario muestra solo su ámbito: deuda $0 y saldo a favor $37.500.

### CA-50 · "Vencido" se evalúa a la fecha de pago

#### TC-GC-CA50-01 · Multa vencida y cargos no vencidos

- **CA:** CA-50, regla F-5, S-39 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** Depto 101 con todo `2026-10` pagado salvo una multa de $30.000 (cargo directo de `2026-10`, vencida el 2026-11-11); `2026-11` emitido el 2026-12-01 con ordinario $200.000 y fondo $10.000 (vencen el 2026-12-11). Deuda 30.000 + 200.000 + 10.000 = $240.000.
- **Cuando:** el 2026-12-15 el administrador registra una transferencia de $50.000 con `paid_on` 2026-12-05.
- **Entonces:** fecha de referencia de la multa máx(2026-12-05, 2026-11-01) = 2026-12-05, vencida; de los cargos de `2026-11` máx(2026-12-05, 2026-12-01) = 2026-12-05, no vencidos. Imputación: multa $30.000 (paso 3) y ordinario `2026-11` 50.000 − 30.000 = $20.000 (paso 4). Pendiente ordinario $180.000 y fondo $10.000: saldo 240.000 − 50.000 = **$190.000**. Falla si imputa $50.000 al ordinario de `2026-11` como capital vencido (evaluado al 2026-12-15).

### CA-51 · Orden total entre cargos del mismo periodo y cuenta

#### TC-GC-CA51-01 · Prorrateado antes que directo

- **CA:** CA-51, regla F-5 · **Tipo:** unitaria · **Prioridad:** 1
- **Dado:** Depto 101 debe solo `2026-11`: ordinario prorrateado $200.000, agua (cargo directo, ordinario) $24.000 y fondo $10.000, todo con vencimiento 2026-12-11 (deuda $234.000).
- **Cuando:** paga $210.000 con `paid_on` 2026-12-05; el motor se ejecuta 100 veces con los débitos en orden de entrada aleatorio.
- **Entonces:** siempre: ordinario prorrateado $200.000 y agua 210.000 − 200.000 = $10.000. Pendiente agua 24.000 − 10.000 = $14.000 y fondo $10.000: saldo **$24.000**.

### CA-52 · Recálculo de un tramo cobrado con $0 y avance de la ventana (flag activo)

#### TC-GC-CA52-01 · Tramo con $0 y ventana que avanza

- **CA:** CA-52, regla E-6 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** Depto 201 pagó `2026-10` ($262.500) con un cheque P, `paid_on` 2026-11-08.
- **Cuando:** se emite `2026-11` el 2026-12-01 con $262.500 para el Depto 201.
- **Entonces:** sin capital en mora del 2026-11-12 al 2026-11-30: interés $0, sin cargo. El último día cobrado del ámbito `owner` pasa a ser el 2026-11-30.

#### TC-GC-CA52-02 · Anulación del cheque y cargo de intereses nuevo

- **CA:** CA-52, regla E-10 · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** el 2026-12-10 se anula P; el 2027-01-01 se emite `2026-12` sin más pagos.
- **Entonces:**
  - Recálculo del tramo 2026-11-12 a 2026-11-30: piso(262.500 × 19 × 1.200 / 3.650.000) = piso(5.985.000.000 / 3.650.000) = piso(1.639,7260…) = **$1.639**. Se crea un cargo de intereses nuevo de $1.639, sin `adjusts_entry_id`, en `2026-12`, ámbito `owner`, con referencia al tramo. Saldo 262.500 + 262.500 + 1.639 = **$526.639**.
  - Emisión del 2027-01-01: la ventana empieza el 2026-12-01. Interés = piso((262.500 × 31 + 262.500 × 20) × 1.200 / 3.650.000) = piso(16.065.000.000 / 3.650.000) = piso(4.401,3698…) = **$4.401** ($262.500 de `2026-10` del 2026-12-01 al 2026-12-31 y $262.500 de `2026-11` del 2026-12-12 al 2026-12-31).
  - El cargo de $1.639 vence el 2027-01-11 y no devenga interés.

### CA-53 · Ingreso de arrendatario con fecha futura

#### TC-GC-CA53-01 · Ocupación programada

- **CA:** CA-53, regla F-14, S-47 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** `2026-10` emitido como en CA-1; Depto 102 sin arrendatario; borrador `2026-11` con los gastos de CA-1.
- **Cuando:** el 2026-11-25 el administrador registra la ocupación O-4 (Daniela Fuentes) con fecha de ingreso 2026-12-05.
- **Entonces:** ve "El arriendo comienza el 05-12-2026. Hasta entonces, los cargos siguen siendo del propietario y Daniela Fuentes no tiene acceso". O-4 queda programada con `effective_from` 2026-12-05. Toda pantalla del Depto 102 le responde 404 a la arrendataria y no recibe notificaciones.

#### TC-GC-CA53-02 · Otro arrendatario mientras hay uno programado

- **CA:** CA-53 · **Tipo:** integración · **Prioridad:** 2
- **Cuando:** el 2026-11-28 el administrador registra otro arrendatario para el Depto 102.
- **Entonces:** 409 `TENANT_ALREADY_ACTIVE` con "La unidad ya tiene un arrendatario vigente o programado. Registra su término o cancela el arriendo programado antes de agregar otro"; nada escrito.

#### TC-GC-CA53-03 · Emisión y pago antes del inicio

- **CA:** CA-53 · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** se emite `2026-11` el 2026-12-01; el 2026-12-02 el administrador registra un pago manual de $100.000 dirigido a O-4.
- **Entonces:** el cargo de $262.500 del Depto 102 va a `owner`, que queda en 262.500 + 262.500 = **$525.000**; la arrendataria de O-4 no recibe la notificación. El pago responde 409 `OCCUPANCY_NOT_STARTED` con "El arriendo aún no comienza. Aplica el pago a la deuda del propietario"; nada escrito.

#### TC-GC-CA53-04 · Inicio de la ocupación

- **CA:** CA-53 · **Tipo:** aislamiento · **Prioridad:** 1
- **Cuando:** la arrendataria consulta el 2026-12-04 a las 23:59 y el 2026-12-05 a las 00:01, hora de Chile; el 2027-01-01 se emite `2026-12` con $262.500 para el Depto 102.
- **Entonces:** a las 23:59 del 2026-12-04, 404; desde las 00:00 del 2026-12-05, acceso con saldo $0 en su ámbito, y los $525.000 del ámbito `owner` le responden 404. El cargo de `2026-12` va a `occupancy` O-4.

### CA-54 · Intento en revisión cuya ocupación termina antes de resolverse (flag apagado)

#### TC-GC-CA54-01 · Intento en revisión y vista previa v1

- **CA:** CA-54, regla F-16 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** E22.
- **Cuando:** el 2026-12-05 el arrendatario inicia un pago de $262.500 (`OC-2026-0003`) y Transbank autoriza $200.000; el 2026-12-06 `soporte-1` pide la vista previa de `register_authorized`.
- **Entonces:** el intento pasa a `in_review`, sin pago; el arrendatario ve "En revisión por ComVive". La vista previa (v1) trae el pago a crear {$200.000, `occupancy`, `2026-12`}.

#### TC-GC-CA54-02 · Término de O-1 durante la revisión

- **CA:** CA-54, reglas F-13 y A-7 · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** el 2026-12-07 el administrador pide la vista previa del término de O-1 con fecha 2026-12-07 y la confirma; el 2026-12-09 `soporte-1` confirma `register_authorized` con v1.
- **Entonces:** la vista previa del término muestra "Hay un pago en línea del arrendatario en revisión por ComVive. Si se registra, se aplicará a la deuda de la unidad". Al confirmar, `owner` queda en **$525.000**, O-1 en $0 y la membresía del ex arrendatario termina. La confirmación con v1 responde 409 `PREVIEW_OUTDATED` con "El intento cambió desde la vista previa. Revisa la nueva vista previa antes de resolver" (el tipo de ámbito final cambió); nada escrito.

#### TC-GC-CA54-03 · Registro con la vista previa nueva

- **CA:** CA-54, reglas F-13 y F-5 · **Tipo:** integración y aislamiento · **Prioridad:** 1
- **Cuando:** `soporte-1` pide una vista previa nueva y la confirma con un motivo.
- **Entonces:**
  - Vista previa: {$200.000, `owner`, `2026-12`}, sin deuda ni imputación.
  - En una transacción: `PAYMENT` `origin = webpay` de $200.000, `paid_on` 2026-12-05, `payment_group_id` = id del intento, en `occupancy` O-1; queda a favor y se traspasa a `owner`.
  - En `owner`, F-5: capital vencido de `2026-10` primero (periodo más antiguo): ordinario 250.000 − 200.000 = $50.000. Los débitos traspasados de `2026-11` no están vencidos (fecha de referencia máx(2026-12-05, 2026-12-07) = 2026-12-07, antes del 2026-12-11).
  - `owner` queda en 50.000 + 12.500 + 262.500 = **$325.000**; O-1 en $0, sin saldo a favor. El intento pasa a `resolved_paid`.
  - Aislamiento (arquitectura §3, prueba 4): todas las filas insertadas en `PAYMENT`, `LEDGER_ENTRY`, `ALLOCATION`, `AUDIT_LOG` e `IDEMPOTENCY_KEY` son de la Comunidad A, del Depto 102 y de los ámbitos O-1 u `owner`; ninguna otra.
  - El ex arrendatario recibe en su correo verificado el asunto "Tu pago en línea en Comunidad A" y el texto "Tu pago en línea con número de orden OC-2026-0003 en Comunidad A se registró. Si tienes dudas, contacta a la administración de tu comunidad"; el cuerpo no contiene "$" ni "200.000". Sin correo verificado, recibe el mismo texto por SMS. El envío queda en auditoría.

### CA-55 · Soporte ComVive: 404 fuera de la vista y 409 dentro de ella

#### TC-GC-CA55-01 · Resolución que no corresponde al estado

- **CA:** CA-55, regla F-16 (D4; M-3 de la revisión 4) · **Tipo:** integración · **Prioridad:** 1
- **Dado:** `OC-2026-0002` de CA-41 en `in_review` ($110.000 iniciados, $11.000 autorizados); `soporte-1` tiene la vista previa v1 de `register_authorized`.
- **Doble de Transbank:** las consultas de `mark_for_reversal` de `soporte-2` responden `AUTHORIZED`, `amount` 11.000, sin `balance`.
- **Cuando:** el 2026-11-26 `soporte-2` lo marca para reverso con motivo; `soporte-1` confirma `register_authorized` con v1 y luego pide la vista previa de `register_authorized` y la de `mark_for_reversal`.
- **Entonces:**
  - `mark_for_reversal` de `soporte-2`: vista previa con "Se pedirá reembolso: sí, por $11.000"; el intento pasa a `reversal_pending` con una `WEBPAY_REFUND` de $11.000 (`outcome` `pending`), `reversalKind = refund_requested`, y sigue en la vista de Soporte.
  - La confirmación de `register_authorized` con v1 y las dos vistas previas de `soporte-1` responden 409 `PREVIEW_OUTDATED` con "Esta resolución no corresponde al estado actual del intento. Revisa la nueva vista previa". La de `mark_for_reversal` **no consulta a Transbank** (cero llamadas nuevas en el doble y en `WEBPAY_GATEWAY_CALL`; orden de "Marcar para reverso").
  - No se registra ningún pago; sigue habiendo una sola `WEBPAY_REFUND`; el saldo sigue en $110.000. Cada 409 deja su registro en `AUDIT_LOG` con el código y ninguna fila en `IDEMPOTENCY_KEY` (D12).

#### TC-GC-CA55-02 · Confirmar el reverso según el resultado del reembolso (D7)

- **CA:** CA-55, CA-74, regla F-16, F-17 (decisiones del líder D2, D7, D10 y D17; ADR 0006, decisión 6; S-78, S-82) · **Tipo:** integración · **Prioridad:** 1
- **Dado:** el estado final de TC-GC-CA55-01 (`reversal_pending`, `WEBPAY_REFUND` de $11.000).
- **Cuando y entonces**, una corrida por resultado del reembolso que entrega el doble de Transbank. En las corridas (1) a (4), la vista previa de `confirm_reversal` trae los campos de EX-1, `paymentToCreate` nulo ("pago a crear: ninguno") y `refundOutcome` en la huella:

  | Corrida | Reembolso (doble) | `refundOutcome` | Respuesta de la vista previa | Referencia propuesta | Advertencia "Transbank no confirmó la devolución de este intento. Confirma el reverso solo con una referencia que obtuviste directamente de Transbank" |
  | --- | --- | --- | --- | --- | --- |
  | (1) | Anulación: `type` `NULLIFIED`, `authorization_code` 730415 | `nullified` | 2xx | 730415 | No |
  | (2) | Reversa: `type` `REVERSED`, resultado guardado el 2026-11-26 a las 11:07:12 (hora de Chile) | `reversed` | 2xx | `REVERSED OC-2026-0002 26-11-2026 11:07` (S-82: hora de Chile, 24 horas, sin segundos) | No |
  | (3) | Error con `response_code` 16 (dato de prueba) | `failed` | 2xx | Ninguna | Sí |
  | (4) | Error con `response_code` 311 (monto mayor que el saldo anulable) | `failed` | 2xx | Ninguna | Sí |
  | (5) | La tarea aún no ejecuta el reembolso | `pending` | 409 `REFUND_PENDING`, "Transbank aún no responde el reembolso de este intento. Intenta confirmar más tarde" (D17; H-35 resuelto) | — | — (sin vista previa) |

  - Corrida (2): el doble no aplica la regla de las 3 horas. Con la autorización del 2026-11-25 y el marcado del 2026-11-26, Transbank real respondería una anulación, no una reversa (TC-GC-CA41-04 (b); hallazgo H-44). La corrida prueba solo el formato de la referencia.

- **En la corrida (1),** `soporte-1` confirma (a) sin la referencia; (b) con la referencia y sin motivo; (c) con referencia y motivo:
  - (a) 422 `REVERSAL_REFERENCE_REQUIRED` con "Ingresa la referencia de la anulación en Transbank"; (b) 422 `REASON_REQUIRED` con "Indica el motivo de la resolución". Nada escrito y el intento sigue en `reversal_pending`.
  - (c) el intento pasa a `reversed`; la consola muestra "Reverso confirmado para el intento OC-2026-0002. Referencia de Transbank: 730415"; el propietario del Depto 101 ve "Tu pago fue anulado en Transbank. El reembolso a tu medio de pago depende de tu banco" y el saldo sigue en **$110.000** (sin `PAYMENT` ni movimientos).
- **En las corridas (3) y (4),** la advertencia no bloquea: con una referencia que Soporte obtuvo de Transbank (dato de prueba "ANUL-PORTAL-0002") y motivo, el intento pasa a `reversed`. `WEBPAY_REFUND` conserva `outcome = failed` y su `response_code`.
- **En la corrida (5),** la ejecución también responde 409 `REFUND_PENDING`, con o sin referencia y motivo, sin escribir nada (detalle en TC-GC-CA74-01). Cuando la tarea deja el reembolso en `nullified`, la vista previa nueva es la de la corrida (1).
- **Huella como resguardo (ADR 0006, prueba 11):** con la vista previa de la corrida (3) (`failed`), un fixture que cambia `WEBPAY_REFUND.outcome` a `nullified` antes de la ejecución hace que la ejecución responda 409 `PREVIEW_OUTDATED` con "El intento cambió desde la vista previa. Revisa la nueva vista previa antes de resolver"; nada escrito. En la práctica no ocurre, porque `failed`, `reversed` y `nullified` son finales (spec F-16, revisión 8).
- **Contraste con un cobro ya devuelto (D7, D10):** sin `WEBPAY_REFUND` (`refundOutcome` nulo, TC-GC-CA68-02) la advertencia nunca aparece; si la consulta no trajo la referencia, la consola muestra la ayuda "Transbank no entregó la referencia de esta anulación. Obtenla en el portal de Transbank con el número de orden {buy_order} y escríbela aquí".

#### TC-GC-CA55-03 · Fuera de la vista y concurrencia

- **CA:** CA-55 · **Tipo:** aislamiento · **Prioridad:** 1
- **Cuando:** (a) `soporte-1` y `soporte-2` piden el detalle, la vista previa o cualquier resolución del intento en `reversed`; (b) en otra corrida, con el intento en `in_review`, los dos confirman `register_authorized` a la vez; (c) en otra corrida, con el intento en `in_review` y el doble respondiendo `AUTHORIZED` por $11.000, los dos confirman `mark_for_reversal` a la vez, cada uno con su vista previa.
- **Entonces:**
  - (a) 404 `NOT_FOUND` en todo.
  - (b) Una respuesta 2xx y la otra 404; existe un solo `PAYMENT` de $11.000 y el saldo del Depto 101 es 110.000 − 11.000 = **$99.000**.
  - (c) Una respuesta 2xx y la otra 409 `PREVIEW_OUTDATED` con "Esta resolución no corresponde al estado actual del intento. Revisa la nueva vista previa" (el intento sigue en la vista, en `reversal_pending`); existe **una sola** `WEBPAY_REFUND` (índice único por `attempt_id`) y el doble recibe un solo reembolso de $11.000. El saldo sigue en $110.000.

### CA-56 · Término de arriendo confirmado contra su vista previa (flag apagado)

#### TC-GC-CA56-01 · Fechas inválidas y vista previa h1

- **CA:** CA-56, regla F-14 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** E22 (O-1 registrada el 2026-11-15 con ingreso 2026-11-15).
- **Cuando:** el 2026-12-08 el administrador pide la vista previa del término de O-1 con fecha (a) 2026-12-10, (b) 2026-11-10 y (c) 2026-12-08; (d) pide el término de la ocupación de propietario del Depto 102 por la ruta de término de arriendo.
- **Entonces:**
  - (a) 422 `END_DATE_IN_FUTURE` con "Registra el término el día que ocurra".
  - (b) 422 `END_BEFORE_START` con "La fecha de término no puede ser anterior al ingreso (15-11-2026)".
  - (c) h1: pasan a `owner` el ordinario $250.000 y el fondo $12.500 de `2026-11`, con vencimiento 2026-12-11; `owner` pasa de $262.500 a 262.500 + 262.500 = $525.000.
  - (d) 422 `USE_OWNERSHIP_TRANSFER` con "Para cambiar al propietario, registra la venta".

#### TC-GC-CA56-02 · Pago entre la vista previa y la confirmación

- **CA:** CA-56, regla A-7 · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** `admin2-A` registra un pago manual de $100.000 en O-1 con `paid_on` 2026-12-08 (ordinario de `2026-11` queda en 250.000 − 100.000 = $150.000) y `admin-A` confirma con h1.
- **Entonces:** 409 `PREVIEW_OUTDATED` con "La cuenta de la unidad cambió desde la vista previa. Revisa la nueva vista previa antes de confirmar"; nada escrito; O-1 sigue vigente y el arrendatario conserva el acceso.

#### TC-GC-CA56-03 · Término con h2 y después del término

- **CA:** CA-56, reglas F-9 y F-14 · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** `admin-A` pide h2 y la confirma; luego intenta terminar O-1 otra vez y registrar un pago manual dirigido a O-1.
- **Entonces:**
  - Traspaso: ordinario $150.000 y fondo $12.500 de `2026-11` (vencimiento 2026-12-11): `owner` 262.500 + 150.000 + 12.500 = **$425.000**; O-1 $0.
  - El propietario ve "Traspaso desde arriendo terminado el 08-12-2026", sin el nombre del ex arrendatario. El ex arrendatario recibe 404 en la unidad.
  - Terminar otra vez: 409 `OCCUPANCY_ALREADY_ENDED` con "Este arriendo ya terminó". Pago a O-1: 409 `OCCUPANCY_ALREADY_ENDED` con "El arriendo de esta persona ya terminó. Aplica el pago a la deuda del propietario". Nada escrito.

### CA-57 · Miembro del comité que vende su única unidad

#### TC-GC-CA57-01 · Venta, tarea y alerta en la misma transacción

- **CA:** CA-57, "Comité que deja de ser propietario" · **Tipo:** integración · **Prioridad:** 1
- **Dado:** Rosa Díaz, propietaria del Depto 201, integra el comité (TC-GC-CA43-01) y no es propietaria de otra unidad; el Depto 201 debe $262.500 de `2026-10`. `admin-A` y `admin2-A` son administradores vigentes.
- **Cuando:** el 2026-11-15 `admin-A` pide la vista previa de la venta del Depto 201 y la confirma.
- **Entonces:**
  - La vista previa muestra que la deuda de $262.500 sigue a la unidad y "Rosa Díaz integra el comité y dejará de ser propietario en la comunidad. Su rol de comité no se revoca automáticamente: decide si lo mantienes o lo revocas".
  - Al confirmar, no se crea ningún movimiento (conteo de `LEDGER_ENTRY` sin cambios); el ámbito `owner` del Depto 201 sigue en $262.500, ahora del nuevo propietario.
  - En la misma transacción: `ADMIN_TASK` abierta (`committee_member_not_owner`) con el título "Revisar rol de comité de Rosa Díaz", y una alerta para cada administrador: push "Tienes una tarea pendiente sobre el comité de Comunidad A" y correo con asunto "Revisa el rol de comité de Rosa Díaz" y texto "Rosa Díaz dejó de ser propietario en Comunidad A y sigue en el comité. Decide si mantienes o revocas su rol en Inicio > Tareas pendientes". Ningún texto contiene "Depto 201", "$" ni "262.500".
  - Si falla la creación de la tarea, la venta no se registra (atomicidad).
  - Auditoría: venta, alerta y tarea.

#### TC-GC-CA57-02 · Permisos sobre la tarea y acceso de Rosa Díaz (M-7)

- **CA:** CA-57, M-4 y M-7 · **Tipo:** permisos · **Prioridad:** 1
- **Cuando:** con la tarea abierta: Rosa Díaz pide el registro de copropietarios y su ex Depto 201 como residente; `comite-A`, `propietario-101`, `arrendatario-102` y `conserje-A` piden `GET /communities/A/admin-tasks?status=open` y `POST .../admin-tasks/{id}/resolve`; `admin2-A` lista las tareas.
- **Entonces:** Rosa Díaz recibe 2xx en el registro (conserva el comité) y 404 en el Depto 201. Comité, residentes y conserje reciben 404 `NOT_FOUND` en el listado y en la resolución (no ven las tareas), nunca 403. `admin2-A` recibe 2xx con la tarea.

#### TC-GC-CA57-03 · Decisión del administrador

- **CA:** CA-57 · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** `admin-A` resuelve con `keep_committee` sin motivo; luego con `revoke_committee` y el motivo "Ya no es copropietaria"; después `admin2-A` resuelve la misma tarea y `admin-A` reintenta con la misma clave.
- **Entonces:** sin motivo, 422 `REASON_REQUIRED` con "Indica el motivo de tu decisión" y la tarea sigue abierta. Con `revoke_committee`, en la misma transacción se revoca la membresía de comité y se cierra la tarea; desde la petición siguiente el registro le responde 404 a Rosa Díaz. `admin2-A`: 409 `TASK_ALREADY_RESOLVED` con "Esta tarea ya fue resuelta". Reintento con la misma clave: el resultado original. Auditoría: `admin_task.resolve` y `membership.revoke`, con quién, decisión y motivo.

#### TC-GC-CA57-04 · Sin tarea si conserva otra unidad, y cierre por otra vía

- **CA:** CA-57 · **Tipo:** integración · **Prioridad:** 2
- **Cuando:** (a) Rosa Díaz es también propietaria del Depto 202 (dato de escenario) y se vende el Depto 201; (b) con una tarea abierta, el administrador revoca el comité de Rosa Díaz por la ruta de membresías.
- **Entonces:** (a) ni tarea ni alerta, y la vista previa no muestra el texto del comité. (b) la tarea se cierra con `revoked_elsewhere`.

### CA-58 · Saldo de caja con $0, negativo y fecha de corte

#### TC-GC-CA58-01 · Validaciones y emisión con saldo negativo

- **CA:** CA-58, regla G-4 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** el borrador `2026-10` de CA-1.
- **Cuando:** el 2026-11-01 el administrador pide la vista previa (a) sin saldo de caja; (b) con −$10.000.000.000; (c) con −$350.000 y corte 2026-11-02; (d) con −$350.000 y corte 2026-10-31 (h1), cambia el saldo a $0 y confirma con h1; (e) pide una vista previa nueva con −$350.000 y corte 2026-10-31 y la confirma.
- **Entonces:**
  - (a) 422 `CASH_BALANCE_REQUIRED` con "Ingresa el saldo de caja y su fecha de corte. Puede ser $0".
  - (b) 422 `AMOUNT_TOO_LARGE` con "El monto supera el máximo permitido de $9.999.999.999" (|−10.000.000.000| > 9.999.999.999).
  - (c) 422 `CASH_BALANCE_DATE_IN_FUTURE` con "La fecha de corte no puede ser futura".
  - (d) 409 `PREVIEW_OUTDATED` con "El borrador cambió desde la vista previa. Revisa la nueva vista previa antes de emitir".
  - (e) emisión con los cargos de GOLD-A (total $1.050.000) y el aviso muestra "Saldo de caja al 31-10-2026: −$350.000".

#### TC-GC-CA58-02 · Límites del saldo de caja

- **CA:** CA-58, reglas B-6 y G-4 · **Tipo:** integración · **Prioridad:** 2
- **Cuando:** se piden vistas previas con $0, −$9.999.999.999, $9.999.999.999, $10.000.000.000, con monto y sin fecha de corte, y con corte igual a la fecha de emisión (2026-11-01).
- **Entonces:** $0, ±$9.999.999.999 y el corte 2026-11-01 se aceptan; $10.000.000.000 responde 422 `AMOUNT_TOO_LARGE`; sin fecha de corte, 422 `CASH_BALANCE_REQUIRED`.

### CA-59 · Plazo de revisión en días hábiles con un feriado

#### TC-GC-CA59-01 · Cálculo de `review_due_on`

- **CA:** CA-59, "Días hábiles" · **Tipo:** unitaria · **Prioridad:** 2
- **Dado:** `PUBLIC_HOLIDAY` con el 2026-12-08 (Inmaculada Concepción).
- **Cuando:** se calcula el plazo de 5 días hábiles de un intento que entra a `in_review` (a) el jueves 2026-12-03 y (b) el sábado 2026-12-05.
- **Entonces:** (a) viernes 4 (1), lunes 7 (2), miércoles 9 (3), jueves 10 (4) y viernes 11 (5): `review_due_on` = **2026-12-11**; falla si da 2026-12-10, que es lo que da sin descontar el feriado. (b) lunes 7 (1), miércoles 9 (2), jueves 10 (3), viernes 11 (4) y lunes 14 (5): **2026-12-14**.

#### TC-GC-CA59-02 · Alerta de plazo vencido

- **CA:** CA-59 · **Tipo:** integración · **Prioridad:** 2
- **Cuando:** el intento (a) sigue en `in_review` al terminar el 2026-12-11; (b) un feriado regional el 2026-12-10, que no está en `PUBLIC_HOLIDAY`; (c) se carga un feriado nuevo el 2026-12-09 después de que el intento entró a revisión.
- **Entonces:** (a) el 2026-12-12 se marca "Plazo vencido" y la alerta a Soporte lleva solo el id del intento y el número de orden (prueba de contrato: exactamente esos dos campos). (b) y (c) `review_due_on` sigue siendo 2026-12-11: los feriados regionales no se descuentan y el plazo se fija al entrar a revisión.

### CA-60 · Lo que ve el propietario del arrendatario

#### TC-GC-CA60-01 · Lectura del propietario y auditoría

- **CA:** CA-60, regla "Datos del arrendatario que ve el propietario", S-44 · **Tipo:** integración y datos personales · **Prioridad:** 1
- **Dado:** E22 y el arrendatario de O-1 (Pedro Soto) pagó $262.500 por Webpay el 2026-12-05; su RUT, teléfono y correo están registrados.
- **Cuando:** `propietario-102` abre la deuda del arrendatario y, por separado, su propio ámbito `owner`.
- **Entonces:** ve "Deuda del arrendatario Pedro Soto" con deuda $0 y saldo a favor $0, los cargos de `2026-11` (ordinario $250.000 y fondo $12.500) y el pago "Pagado por el arrendatario · $262.500 · 05-12-2026 · Webpay". La respuesta no trae RUT, teléfono ni correo del arrendatario. La lectura del ámbito O-1 crea exactamente un registro de auditoría (actor, comunidad, unidad, ámbito, fecha); la de su ámbito `owner`, ninguno. La spec (S-44) y la arquitectura (§5, acción `owner.tenant_scope.read`) la exigen (H-28 resuelto).

#### TC-GC-CA60-02 · Detalle del intento del arrendatario

- **CA:** CA-60 · **Tipo:** aislamiento · **Prioridad:** 1
- **Cuando:** el propietario pide `GET .../units/{Depto 102}/webpay-attempts/{id del intento del arrendatario}` y, mientras ese intento sigue en `initiated`, `GET .../units/{Depto 102}/webpay-attempts/current`.
- **Entonces:** el detalle responde 404 `NOT_FOUND`. `current` responde la lista vacía, igual a la de una unidad sin intentos: no trae el intento del arrendatario ni su ámbito O-1 (S-44, S-74; H-31 resuelto). El arrendatario, con la misma consulta, recibe su intento con `attemptId`.

#### TC-GC-CA60-03 · Historial del arrendatario y deber de información

- **CA:** CA-60 · **Tipo:** integración y e2e (Maestro) · **Prioridad:** 2
- **Entonces:** el arrendatario ve "Pagado por ti · $262.500 · 05-12-2026 · Webpay". La invitación y la pantalla de primer ingreso muestran "El propietario de la unidad puede ver tu nombre, tu deuda de gasto común y los pagos que se aplican a ella. La administración de la comunidad ve todos tus datos de cobro".

### CA-61 · Cancelación de un arriendo programado (flag apagado)

#### TC-GC-CA61-01 · Cancelar O-4 programada

- **CA:** CA-61, regla F-14 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** el estado de CA-53 el 2026-11-26: O-4 (Daniela Fuentes) programada en el Depto 102 con `effective_from` 2026-12-05; `owner` del Depto 102 con $262.500 de `2026-10`.
- **Cuando:** (a) `comite-A` pide cancelar O-4; (b) `admin-A` la cancela sin motivo; (c) la cancela con el motivo "El arrendatario desistió del contrato".
- **Entonces:**
  - (a) 403 `FORBIDDEN` con "Tu rol no permite esta acción" (el comité ve el historial de ocupaciones).
  - (b) 422 `REASON_REQUIRED` con "Indica el motivo de la cancelación"; nada escrito.
  - (c) O-4 queda cancelada, con fecha y hora, quién la canceló y el motivo, sin fecha de término. No se crea ningún movimiento ni traspaso (conteo de `LEDGER_ENTRY` sin cambios): `owner` sigue en **$262.500**. La membresía de residente que iba a nacer para O-4 termina; la persona nunca tuvo acceso (404 antes y después). El historial del Depto 102 muestra O-4 como "Cancelada" y la cancelación queda en auditoría.

#### TC-GC-CA61-02 · Orden de los errores al cancelar

- **CA:** CA-61, "Orden entre reglas de negocio" · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** `admin-A` pide, cada una sin motivo: (a) cancelar O-4 otra vez, con otra clave; (b) cancelar la ocupación de propietario del Depto 102; (c) cancelar O-1 de CA-56, ya terminada. En otra corrida, (d) cancelar O-4 otra vez con la misma clave de la cancelación original.
- **Entonces:**
  - (a) 409 `OCCUPANCY_CANCELLED` con "Este arriendo ya fue cancelado", no 422 `REASON_REQUIRED`: el estado se valida antes que el motivo.
  - (b) 422 `USE_OWNERSHIP_TRANSFER` con "Para cambiar al propietario, registra la venta" (primera regla del orden).
  - (c) 409 `OCCUPANCY_ALREADY_ENDED` con "Este arriendo ya terminó".
  - (d) el resultado original, sin escritura nueva.
  - Nada escrito en (a), (b) y (c). Un residente que pide cancelar recibe 404 (no ve el historial de ocupaciones).

#### TC-GC-CA61-03 · Después de la cancelación

- **CA:** CA-61, reglas F-9 y F-14 · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** el 2026-11-27 el administrador registra un pago manual de $100.000 dirigido a O-4; el 2026-11-28 registra la ocupación O-5 (nuevo arrendatario) con ingreso 2026-12-10; el 2026-12-01 se emite `2026-11` con los gastos de CA-1.
- **Entonces:** el pago responde 409 `OCCUPANCY_CANCELLED` con "Este arriendo fue cancelado y nunca comenzó. Aplica el pago a la deuda del propietario" y no se escribe nada. O-5 se acepta como programada (O-4 ya no cuenta para `TENANT_ALREADY_ACTIVE`). El cargo de $262.500 del Depto 102 va a `owner`, porque ni O-4 ni O-5 están vigentes: `owner` = 262.500 + 262.500 = **$525.000**.

#### TC-GC-CA61-04 · No se cancela un arriendo que ya comenzó

- **CA:** CA-61 · **Tipo:** integración · **Prioridad:** 2
- **Cuando:** el administrador cancela O-5 con un motivo (a) el 2026-12-09 a las 23:59 y, en otra corrida, (b) el 2026-12-10 a las 00:01, hora de Chile.
- **Entonces:** (a) se acepta: O-5 sigue programada hasta el fin del 2026-12-09. (b) 409 `OCCUPANCY_ALREADY_STARTED` con "Este arriendo ya comenzó. Para terminarlo, registra su término"; nada escrito.

### CA-62 · Egresos del fondo de reserva: autorización, saldo negativo y corrección (flag apagado)

Saldo del fondo (D-5) = recargos imputados + intereses imputados + multas imputadas − egresos − correcciones de egresos (con su signo). Pruebas de oro: GOLD-A62-01 a GOLD-A62-05.

#### TC-GC-CA62-01 · Egreso con y sin referencia a la autorización

- **CA:** CA-62, regla B-3, S-49 · **Tipo:** integración · **Prioridad:** 1 · **Oro:** GOLD-A62-01
- **Dado:** saldo del fondo de la Comunidad A en ComVive $37.500 (recargos de `2026-10` imputados; sin intereses, multas ni egresos); borrador vigente `2026-11`.
- **Cuando:** el 2026-11-20 el administrador registra el egreso "Reparación bomba de agua" por $30.000 (a) sin referencia y (b) con la referencia "Acta comité 18-11-2026".
- **Entonces:** (a) 422 `AUTHORIZATION_REFERENCE_REQUIRED` con "Indica quién autorizó el uso del fondo de reserva: acuerdo del comité o de la asamblea, con su fecha"; nada escrito. (b) el egreso queda registrado, sin cargos ni movimientos a las unidades, y el saldo del fondo pasa a 37.500 − 30.000 = **$7.500**, sin advertencia.

#### TC-GC-CA62-02 · Saldo del fondo negativo: se advierte, no se bloquea

- **CA:** CA-62, reglas B-3 y D-5, S-50 · **Tipo:** integración · **Prioridad:** 1 · **Oro:** GOLD-A62-02
- **Cuando:** el 2026-11-25 registra el egreso "Cambio de cerradura portón" por $20.000 con la referencia "Acta comité 24-11-2026"; el 2026-12-01 se emite `2026-11` sin pagos nuevos.
- **Entonces:** el egreso se registra y la respuesta trae la advertencia "Con este egreso, el saldo del fondo de reserva registrado en ComVive queda en −$12.500. Revisa el monto; si el fondo tenía saldo antes de usar ComVive, ese saldo aún no está cargado" (7.500 − 20.000 = −12.500). El aviso de `2026-11` muestra los dos egresos con su referencia y "Saldo del fondo de reserva: −$12.500".

#### TC-GC-CA62-03 · Corrección de un egreso

- **CA:** CA-62, regla B-3 · **Tipo:** integración · **Prioridad:** 1 · **Oro:** GOLD-A62-03
- **Cuando:** el 2026-12-03 el administrador pide la vista previa de la corrección del egreso de la cerradura con monto correcto $15.000 (a) sin motivo y (b) con el motivo "La factura final fue de $15.000", y (c) la confirma con su `previewHash`.
- **Entonces:**
  - (a) 422 `REASON_REQUIRED` con "Indica el motivo de la corrección".
  - (b) en el borrador `2026-12`, una corrección de 15.000 − (20.000 + 0) = **−$5.000**, sin cargos ni notas de crédito a las unidades, con la advertencia "Con esta corrección, el saldo del fondo de reserva registrado en ComVive queda en −$7.500. Revisa el monto; si el fondo tenía saldo antes de usar ComVive, ese saldo aún no está cargado". La advertencia no forma parte de la huella.
  - (c) saldo del fondo −12.500 − (−5.000) = **−$7.500**. El aviso de `2026-12` mostrará "Corrección egreso del fondo periodo 2026-11: La factura final fue de $15.000".

#### TC-GC-CA62-04 · Sin cambio, anulación y doble anulación

- **CA:** CA-62, regla B-3 · **Tipo:** integración · **Prioridad:** 1 · **Oro:** GOLD-A62-04
- **Cuando:** (a) pide otra corrección del mismo egreso con monto correcto $15.000; (b) pide anularlo (monto correcto $0) sin motivo; (c) lo anula con el motivo "La cerradura la pagó la constructora en garantía"; (d) pide anularlo otra vez.
- **Entonces:**
  - (a) 422 `CORRECTION_WITHOUT_CHANGE` con "El monto correcto es igual al monto vigente del egreso ($15.000). No hay nada que corregir"; nada escrito.
  - (b) 422 `REASON_REQUIRED` con "Indica el motivo de la anulación".
  - (c) corrección de 0 − (20.000 + (−5.000)) = **−$15.000**; saldo del fondo −7.500 + 15.000 = **$7.500**, sin advertencia.
  - (d) 422 `CORRECTION_WITHOUT_CHANGE` con "Este egreso ya está anulado. No hay nada que corregir". Nunca se crea una corrección de $0.
  - El egreso original de $20.000 de `2026-11` no cambia: sigue visible con su referencia y sus dos correcciones (−$5.000 y −$15.000).

#### TC-GC-CA62-05 · Montos inválidos y orden de validación

- **CA:** CA-62, reglas B-3, B-5 y B-6, "Orden entre reglas de negocio" · **Tipo:** integración · **Prioridad:** 1 · **Oro:** GOLD-A62-05
- **Cuando:** sobre el egreso de la cerradura, el administrador pide correcciones (a) con monto correcto −$1.000 y sin motivo; (b) con $100,5; (c) con $10.000.000.000; (d) con $15.000 sin motivo, antes de la anulación de TC-GC-CA62-04. Además, (e) registra un egreso nuevo de $0.
- **Entonces:**
  - (a) y (b) 422 `INVALID_AMOUNT` con "El monto correcto debe ser un número entero de pesos, mayor o igual que $0. Usa $0 solo para anular", no `REASON_REQUIRED` (el monto se valida primero).
  - (c) 422 `AMOUNT_TOO_LARGE` con "El monto supera el máximo permitido de $9.999.999.999".
  - (d) 422 `CORRECTION_WITHOUT_CHANGE` (va antes que el motivo).
  - (e) 422 `INVALID_AMOUNT` con el texto general "El monto debe ser un número entero de pesos mayor que $0".
  - Nada escrito. El saldo del fondo no cambia.
  - Permisos: `comite-A` recibe 403 al registrar o corregir un egreso (ve el borrador); un residente recibe 404 (no ve el recurso).

### CA-63 · El propietario nuevo ve los pagos del propietario anterior sin etiqueta (flag apagado)

#### TC-GC-CA63-01 · Historia del ámbito `owner` antes de la venta

- **CA:** CA-63 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** Depto 201 con ordinario $250.000 y fondo $12.500 de `2026-10` (vencen el 2026-11-11), deuda $262.500.
- **Cuando:** el 2026-11-05 la administración registra una transferencia de $150.000 en `owner`; el 2026-11-08 la propietaria de entonces (Rosa Díaz; la tarea de comité de CA-57 no se evalúa en este caso) paga por Webpay la deuda completa de su ámbito con la orden `OC-2026-0004`; el 2026-11-15 se registra la venta del Depto 201.
- **Entonces:**
  - Transferencia (fecha de referencia 2026-11-05, no vencido): ordinario 250.000 − 150.000 = $100.000, más el fondo de $12.500: deuda **$112.500**.
  - El intento Webpay se calcula por la deuda completa del ámbito: $112.500 (F-12). Al confirmarse (no vencido al 2026-11-08): ordinario $100.000 y fondo $12.500: deuda **$0**.
  - La venta no crea movimientos: `owner` queda en $0, sin deuda ni saldo a favor.

#### TC-GC-CA63-02 · Lo que ve el propietario nuevo

- **CA:** CA-63, F-12, F-17, S-51 · **Tipo:** integración y datos personales · **Prioridad:** 1
- **Cuando:** el propietario nuevo abre "Tu deuda" del Depto 201.
- **Entonces:** ve los dos pagos: "Registrado por la administración · $150.000 · 05-11-2026 · Transferencia" y "$112.500 · 08-11-2026 · Webpay", este último sin etiqueta de quién pagó. La API devuelve `payerKind` nulo en el pago Webpay (`administration` en el manual) y no trae nombre, RUT ni contacto de Rosa Díaz (prueba de contrato: el cuerpo no contiene "Rosa", "Díaz" ni "14.682.035"). El detalle del intento `OC-2026-0004` le responde 404 (no lo inició).

#### TC-GC-CA63-03 · Pago propio del propietario nuevo

- **CA:** CA-63 · **Tipo:** integración · **Prioridad:** 2
- **Cuando:** se emite `2026-11` el 2026-12-01 con $262.500 para el Depto 201 y el propietario nuevo lo paga por Webpay el 2026-12-04.
- **Entonces:** se imputa a lo no vencido (vence el 2026-12-11): ordinario $250.000 y fondo $12.500; deuda $0. Lo ve como "Pagado por ti · $262.500 · 04-12-2026 · Webpay" (`payerKind` = `self`). Rosa Díaz, sin membresía de residente en el Depto 201, recibe 404 en la unidad (CA-21).

### CA-64 · Orden de los errores al otorgar el rol de comité

#### TC-GC-CA64-01 · Una respuesta por caso, en orden

- **CA:** CA-64, S-34 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** `admin-A` (Carolina Lagos) no es propietaria de ninguna unidad; Ana Pérez, propietaria del Depto 101, es además administradora (CA-43); Rosa Díaz, propietaria del Depto 201, integra el comité.
- **Cuando y entonces:**

  | Paso | Persona | Referencia a la asamblea | Respuesta |
  | --- | --- | --- | --- |
  | (a) | Arrendatario del Depto 102 | Sin fecha ni referencia | 422 `ASSEMBLY_REFERENCE_REQUIRED` "Indica la asamblea que eligió al comité: fecha y referencia" (aunque tampoco es propietario) |
  | (b) | Arrendatario del Depto 102 | "Asamblea ordinaria del 20-10-2026" | 422 `COMMITTEE_REQUIRES_OWNER` "El rol de comité solo se otorga a propietarios registrados de la comunidad" |
  | (c) | Ana Pérez | Sin referencia | 422 `ASSEMBLY_REFERENCE_REQUIRED` |
  | (d) | Ana Pérez | Con referencia | 422 `ADMIN_COMMITTEE_CONFLICT` "Esta persona es administradora de la comunidad. No puede integrar también el comité" |
  | (e) | `admin-A` a sí misma | Con referencia | 422 `COMMITTEE_REQUIRES_OWNER` (va antes que `ADMIN_COMMITTEE_CONFLICT`) |
  | (f) | Rosa Díaz | Con referencia | 409 `ALREADY_COMMITTEE_MEMBER` "Esta persona ya integra el comité" |

  - En ningún paso cambia una membresía ni se escribe auditoría de otorgamiento. Una referencia con fecha y texto vacío se trata como faltante (a).

#### TC-GC-CA64-02 · Miembro del comité que dejó de ser propietario

- **CA:** CA-64, M-7 · **Tipo:** integración · **Prioridad:** 2
- **Dado:** la venta de TC-GC-CA57-01 ya registrada: Rosa Díaz sigue en el comité y no es propietaria de ninguna unidad.
- **Cuando:** `admin-A` le otorga otra vez el rol de comité con referencia.
- **Entonces:** 422 `COMMITTEE_REQUIRES_OWNER`, no 409 `ALREADY_COMMITTEE_MEMBER`: el 409 va al final para no esconder que ya no es propietaria.

### Casos CA-65 a CA-72 (spec rev. 5 a rev. 7)

Todos parten del estado de CA-5 salvo que digan otra cosa: Depto 101, sin arrendatario, con ordinario 200.000 − 100.000 = $100.000 y fondo $10.000 de `2026-10` en el ámbito `owner`, vencidos el 2026-11-11 (deuda 100.000 + 10.000 = **$110.000**), flag apagado y borrador vigente `2026-11`. Ninguna resolución de reverso ni sin cobro escribe movimientos: en todos esos casos el saldo final se verifica en $110.000 y con cero filas nuevas en `PAYMENT`, `LEDGER_ENTRY` y `ALLOCATION`.

### CA-65 · Soporte ComVive resuelve sin cobro un intento en revisión (decisión del líder D3)

#### TC-GC-CA65-01 · Entrada a revisión sin estado concluyente

- **CA:** CA-65, regla F-16; ADR 0007, decisiones 6 y 7 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** estado de CA-5; comercio `MC-A-1`.
- **Cuando:** el miércoles 2026-11-25 a las 10:00 `propietario-101` inicia un pago Webpay de $110.000 (`OC-2026-0006`), no vuelve del formulario y el doble de Transbank responde "sin respuesta" a las consultas de las 10:15, 10:20 y 10:30.
- **Entonces:**
  - Hasta la consulta de las 10:30 el intento sigue en `initiated` con `lock_active` verdadero y el propietario ve "Tienes un pago en proceso" y "Número de orden OC-2026-0006. Te avisaremos el resultado".
  - Tras la consulta de las 10:30: `in_review`, `lock_active` falso, `review_due_on` **2026-12-02** (jueves 26 (1), viernes 27 (2), lunes 30 (3), martes 1 (4) y miércoles 2 (5); sin feriados en `PUBLIC_HOLIDAY`). Tres filas en `WEBPAY_GATEWAY_CALL` con origen `status_job`.
  - Ningún pago; el saldo sigue en $110.000. El propietario ve "En revisión por ComVive" y "Te avisaremos cuando se resuelva. Número de orden OC-2026-0006". Si vuelve a pagar, la app advierte "Tienes un pago en revisión por $110.000; si pagas de nuevo podría quedar saldo a favor".

#### TC-GC-CA65-02 · 503, motivo con la misma clave y cierre sin cobro

- **CA:** CA-65, reglas A-3.4 (D12), F-13, F-16 y F-17 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** el intento de TC-GC-CA65-01 en `in_review`.
- **Cuando:** el 2026-11-26 `soporte-1`: (a) pide la vista previa de `resolve_without_charge` y el doble no responde; (b) la pide de nuevo y el doble informa `INITIALIZED`; (c) confirma con v1 y la clave K-65, sin motivo, con el doble en `INITIALIZED`; (d) confirma con v1, **la misma clave K-65** y el motivo "Transbank informa la transacción como no pagada", con el doble en `INITIALIZED`.
- **Entonces:**
  - (a) 503 `PAYMENT_GATEWAY_UNAVAILABLE` con "No pudimos consultar el estado en Transbank. Intenta en unos minutos"; nada escrito.
  - (b) campos de EX-1 con el estado `INITIALIZED` (`transbankStatusSource = query`), "pago a crear: ninguno" y la versión v1, sin la advertencia de D5.
  - (c) 422 `REASON_REQUIRED` con "Indica el motivo de la resolución"; nada escrito y ninguna fila en `IDEMPOTENCY_KEY` para K-65.
  - (d) se evalúa de nuevo (D12) y se acepta, sin `IDEMPOTENCY_KEY_REUSED`: el intento pasa a `rejected` con `resolution = resolve_without_charge` y el detalle del propietario expone `rejectionKind = resolved_without_charge`. Cero filas nuevas en `PAYMENT`, `LEDGER_ENTRY`, `ALLOCATION` y `WEBPAY_REFUND`; el ámbito `owner` sigue en 100.000 + 10.000 = **$110.000**.
  - La consola muestra "Intento OC-2026-0006 cerrado sin cobro. Estado en Transbank: INITIALIZED". El propietario ve "Tu pago no se completó. No se hizo ningún cargo" y deja de ver la advertencia de pago en revisión.
  - Conteos: 4 filas en `WEBPAY_GATEWAY_CALL` con origen `support_resolution` (una por cada consulta de (a) a (d); en (c) se consulta porque el estado en Transbank va antes que el motivo); 4 registros en `AUDIT_LOG` con `actor_type = platform`, uno por petición: (a) y (c) con su código de rechazo, (b) como lectura y (d) como `webpay_attempt.resolve_without_charge`, con `soporte-1`, el motivo y el estado `INITIALIZED`; una sola fila en `IDEMPOTENCY_KEY` (la de (d)).
  - `admin-A` ve el intento en "Intentos Webpay" como `rejected`, resuelto por Soporte ComVive; si llama a la ruta `/platform/...` de resolución, 404 `NOT_FOUND`.
  - Después, `soporte-1` recibe 404 `NOT_FOUND` en el detalle, la vista previa y cualquier resolución de `OC-2026-0006`.
  - El mismo día el propietario inicia un pago nuevo de $110.000: se acepta sin advertencia y el intento nuevo queda en `initiated` (el ámbito `owner` no estaba bloqueado).

#### TC-GC-CA65-03 · Resultado según el estado que informa Transbank

- **CA:** CA-65, regla F-16 (D3, D4; S-58) · **Tipo:** integración · **Prioridad:** 1
- **Dado:** un intento en `in_review` dentro de los 7 días consultables (`OC-2026-0006`, o `OC-2026-0002` de CA-41 donde se indica).
- **Cuando:** `soporte-1` pide la vista previa y la ejecución de `resolve_without_charge` con motivo, con el doble respondiendo en ambas:

  | Estado del doble | Respuesta (vista previa y ejecución) | Estado final del intento |
  | --- | --- | --- |
  | `INITIALIZED` | 2xx | `rejected` |
  | `FAILED` | 2xx | `rejected` |
  | `AUTHORIZED`, `amount` 11.000 (`OC-2026-0002`) | 422 `CHARGE_AUTHORIZED_IN_TRANSBANK` con "Transbank informa que este pago tiene un cobro vigente. Regístralo por el monto autorizado o márcalo para reverso" | `in_review`, saldo $110.000 |
  | `CAPTURED` | El mismo 422 | `in_review` |
  | `PARTIALLY_NULLIFIED`, `balance` 6.000 | El mismo 422 | `in_review` |
  | `REVERSED` | 422 `TRANSBANK_STATUS_NOT_WITHOUT_CHARGE` con "Transbank informa el estado REVERSED, que no corresponde a un pago sin cobro. Revisa el intento antes de resolver" | `in_review` |
  | `NULLIFIED` | El mismo 422, con "NULLIFIED" | `in_review` |
  | Estado desconocido `PENDING_X` (dato de prueba) | El mismo 422, con "PENDING_X" (**Supuesto (a validar):** {estado} es el valor tal como lo entrega Transbank) | `in_review` |
  | Sin respuesta | 503 `PAYMENT_GATEWAY_UNAVAILABLE` | `in_review` |

- **Entonces, además:**
  - Si el doble pasa de `INITIALIZED` (vista previa) a `AUTHORIZED` (ejecución), la ejecución responde el 422 `CHARGE_AUTHORIZED_IN_TRANSBANK` y no escribe nada.
  - Tras el 422 con `REVERSED`, el mismo intento se cierra con `mark_for_reversal` (doble en `REVERSED`; la consulta de la ejecución se guarda el 2026-11-26 a las 09:05:37, hora de Chile: `reversal_pending` sin `WEBPAY_REFUND`, `reversalKind = already_returned`) y `confirm_reversal` con la referencia propuesta `REVERSED OC-2026-0006 26-11-2026 09:05` (S-82; H-36 resuelto; **Supuesto (a validar):** los segundos se truncan, no se redondean, hallazgo H-45); termina en `reversed` y el propietario ve "Tu pago fue anulado en Transbank. El reembolso a tu medio de pago depende de tu banco" (D4).

#### TC-GC-CA65-04 · Estado del intento, orden de los errores y huella

- **CA:** CA-65, "Orden entre reglas de negocio" (resolver sin cobro); ADR 0006, decisión 6 · **Tipo:** integración · **Prioridad:** 1
- **Cuando y entonces:**
  - (a) Intento en `reversal_pending` con una `WEBPAY_REFUND` creada con estado concluyente (no cumple D13): vista previa y ejecución de `resolve_without_charge` responden 409 `PREVIEW_OUTDATED` con "Esta resolución no corresponde al estado actual del intento. Revisa la nueva vista previa", **sin consultar a Transbank** (cero llamadas en el doble).
  - (b) `in_review`, doble en `AUTHORIZED`, ejecución sin motivo: 422 `CHARGE_AUTHORIZED_IN_TRANSBANK`, no `REASON_REQUIRED`.
  - (c) `in_review`, doble sin respuesta, ejecución sin motivo: 503, no `REASON_REQUIRED`.
  - (d) Vista previa con `INITIALIZED` (v1) y ejecución con motivo cuando el doble ya informa `FAILED`: 409 `PREVIEW_OUTDATED` con "El intento cambió desde la vista previa. Revisa la nueva vista previa antes de resolver", nada escrito. La huella de `resolve_without_charge` incluye `transbankStatus`, `transbankStatusSource` y `withoutChargeAvailable` (spec A-7, "Huella de plataforma", y F-16; ADR 0006, decisión 6; H-30 resuelto).
  - (e) Un cambio de la deuda del ámbito entre la vista previa y la ejecución (pago manual de $10.000 del Depto 101) no produce 409: la resolución se aplica y el saldo queda en 110.000 − 10.000 = $100.000 por el pago manual, no por la resolución.

#### TC-GC-CA65-05 · Intento de dos ámbitos con `FAILED`

- **CA:** CA-65, regla F-16 · **Tipo:** integración y aislamiento · **Prioridad:** 1
- **Dado:** E29; `propietario-102` inició el 2027-01-05 un intento "Ambas" por $530.004 (`owner` $266.814 y `occupancy` O-1 $263.190; dato de prueba `OC-2027-0002`) que quedó en `in_review` sin estado concluyente.
- **Cuando:** el 2027-01-06 `soporte-1` lo resuelve sin cobro con motivo y el doble informa `FAILED`.
- **Entonces:** `rejected`, sin pagos ni movimientos; `owner` sigue en **$266.814** y `occupancy` O-1 en **$263.190** (suma 530.004). `propietario-102` ve "Tu pago no se completó. No se hizo ningún cargo"; `arrendatario-102` recibe 404 en el detalle del intento (no lo inició) y ningún texto nuevo. `admin-A` recibe 404 en la ruta `/platform/...` de resolución.

#### TC-GC-CA65-06 · Pasados los 7 días consultables (decisión del líder D5)

- **CA:** CA-65, regla F-16 (D5; ADR-0007-S12) · **Tipo:** integración · **Prioridad:** 1
- **Dado:** `OC-2026-0006` en `in_review` desde el 2026-11-25; su `create` se envió el 2026-11-25 a las 10:00 (hora de Chile), así que `tbk_queryable_until` = 2026-11-25 10:00 + 168 horas = 2026-12-02 10:00 (2026-12-02 13:00 UTC). El 2026-12-03 ya no es consultable (S-80).
- **Cuando y entonces**, una corrida por la última respuesta guardada:
  - (a) **Ninguna concluyente:** la vista previa no llama al doble; `transbankStatus` nulo, `transbankStatusSource = none` y la advertencia "No hay un estado de Transbank que respalde esta resolución. Confírmala solo si verificaste con Transbank que no hubo cobro". Con motivo, el intento pasa a `rejected` y la consola muestra "Intento OC-2026-0006 cerrado sin cobro. Estado en Transbank: sin respuesta de Transbank" (S-82; H-36 resuelto).
  - (a') **Solo respuestas inesperadas guardadas** (consultas diarias con `PENDING_X`): igual que (a). Una respuesta inesperada no cuenta como concluyente pasados los 7 días (S-76).
  - (b) **Última guardada `INITIALIZED`** (consulta diaria del 2026-11-30): sin llamada al doble, `transbankStatusSource = last_stored`, sin advertencia; con motivo, `rejected` y "Intento OC-2026-0006 cerrado sin cobro. Estado en Transbank: INITIALIZED".
  - (c) **Última guardada `AUTHORIZED`:** 422 `CHARGE_AUTHORIZED_IN_TRANSBANK`, sin llamada al doble y nada escrito.

#### TC-GC-CA65-07 · Aviso al pagador sin membresía

- **CA:** CA-65, regla F-13 (S-42, S-59) · **Tipo:** integración y datos personales · **Prioridad:** 2
- **Dado:** el propietario que inició `OC-2026-0006` ya no tiene membresía en la Comunidad A (dato de escenario: vendió el Depto 101 antes de la resolución).
- **Cuando:** `soporte-1` confirma `resolve_without_charge` como en TC-GC-CA65-02 (d).
- **Entonces:** sin push. Correo a su dirección verificada con el asunto "Tu pago en línea en Comunidad A" y el texto "Tu pago en línea con número de orden OC-2026-0006 en Comunidad A no se completó y no se hizo ningún cargo a tu medio de pago. Si tienes dudas, contacta a la administración de tu comunidad". El cuerpo no contiene "$", "110.000" ni "Depto 101". Sin correo verificado, el mismo texto por SMS. Un registro `notification.sent_without_membership`.

### CA-66 · Orden de las validaciones al iniciar un pago en línea y falla al conectar con Webpay

#### TC-GC-CA66-01 · Comunidad sin comercio vigente (menor 5)

- **CA:** CA-66, regla F-12 · **Tipo:** integración y e2e (Maestro) · **Prioridad:** 1
- **Dado:** estado de CA-5 y la Comunidad A (a) sin ninguna fila en `COMMUNITY_WEBPAY_MERCHANT`; (b) en otra corrida, con su única fila (`MC-A-0`) fuera de vigencia (`active_to` 2026-11-24).
- **Cuando:** el 2026-11-25 `propietario-101` pide por la API iniciar un pago sin ámbitos y, en otra petición, con el ámbito `owner` y `expectedTotalClp` 110.000.
- **Entonces:**
  - Las dos peticiones responden 422 `ONLINE_PAYMENT_NOT_AVAILABLE` con "Esta comunidad aún no recibe pagos en línea. Pide a la administración los datos para pagar por transferencia", aunque la primera tampoco tenga ámbitos (S-56).
  - Cero filas en `WEBPAY_ATTEMPT` y en `WEBPAY_GATEWAY_CALL`; cero llamadas al doble. **Supuesto (a validar):** el correlativo de `buy_order` no avanza (el siguiente intento aceptado de la Comunidad A es `OC-2026-0007`, como en CA-66).
  - La app no ofrece "Pagar en línea" y muestra el mismo texto en lugar del botón, igual al propietario y al arrendatario.
  - El contrato OpenAPI no tiene ninguna operación `/communities/...` que escriba en `COMMUNITY_WEBPAY_MERCHANT`: el administrador no activa el comercio (F-12, menor 5).

#### TC-GC-CA66-02 · Secuencia completa del orden S-56

- **CA:** CA-66, regla F-12 (S-56, S-57) · **Tipo:** integración · **Prioridad:** 1
- **Dado:** el estado (a) de TC-GC-CA66-01.
- **Cuando y entonces:**

  | Paso | Fecha | Acción | Respuesta | Estado después |
  | --- | --- | --- | --- | --- |
  | 1 | 2026-11-25 | Operaciones activa el comercio con el procedimiento auditado (la prueba inserta la fila vigente `MC-A-1` con el script del procedimiento) | — | Comunidad A con comercio vigente |
  | 2 | 2026-11-25 | Pedido sin ámbitos | 422 `SCOPE_REQUIRED`, "Elige a qué deuda aplicar el pago" | Sin intento |
  | 3 | 2026-11-25 | `owner` dos veces | 422 `DUPLICATE_SCOPE`, "Cada deuda puede aparecer una sola vez en el pago" | Sin intento |
  | 4 | 2026-11-25 | `owner`, total visto $110.000; el doble no responde a "crear" | 503 `PAYMENT_GATEWAY_UNAVAILABLE`, "No pudimos conectar con Webpay. Intenta en unos minutos" | `OC-2026-0007` en `abandoned`, `lock_active` falso, una fila `create` en `WEBPAY_GATEWAY_CALL`, sin fila en `IDEMPOTENCY_KEY` |
  | 5 | 2026-11-25 | Otra clave, mismo pedido | 2xx | `OC-2026-0008` en `initiated` por $110.000, `lock_active` verdadero |
  | 6 | 2026-11-25 | Otro dispositivo, otra clave, `owner` con total visto $100.000 | 409 `PAYMENT_IN_PROGRESS`, "Ya hay un pago en proceso para esta deuda" (no `AMOUNT_CHANGED`) | Sin intento nuevo |
  | 7 | 2026-11-25 | Cancela en el formulario de Webpay (retorno con `TBK_TOKEN`, sin `token_ws`) | 302 a la app | `OC-2026-0008` en `abandoned`, ámbito libre; la app muestra "Pago cancelado. No se hizo ningún cargo" |
  | 8 | 2026-11-26 | `admin-A` registra $10.000 en `owner`, `paid_on` 2026-11-26 | 2xx | Capital vencido, ordinario primero: 100.000 − 10.000 = $90.000; fondo $10.000; deuda **$100.000** |
  | 9 | 2026-11-26 | `owner` con total visto $110.000 | 409 `AMOUNT_CHANGED`, "El monto a pagar cambió. Revisa el nuevo monto", con el monto nuevo $100.000 | Sin intento |
  | 10 | 2026-11-26 | `admin-A` registra $100.000 en `owner` | 2xx | Ordinario 90.000 − 90.000 = 0; fondo 10.000 − 10.000 = 0; deuda **$0** |
  | 11 | 2026-11-26 | `owner` con total visto $100.000 | 422 `SCOPE_WITHOUT_DEBT`, "Esta deuda no tiene saldo pendiente" (no `AMOUNT_CHANGED`, aunque 0 ≠ 100.000) | Sin intento |

  - En los rechazos de los pasos 2, 3, 6, 9 y 11 no se crea intento ni se escribe nada; el único dato de negocio de un rechazo es `OC-2026-0007` en `abandoned` (paso 4).

#### TC-GC-CA66-03 · El 503 y la clave de idempotencia

- **CA:** CA-66, regla A-3.4 (D12, S-57); ADR 0003, decisión 6 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** el paso 4 de TC-GC-CA66-02, enviado con la clave K-66.
- **Cuando:** (a) se reenvía K-66 con el mismo cuerpo y el doble responde a "crear"; (b) se reenvía K-66 otra vez, con el mismo cuerpo; (c) se reenvía K-66 con `expectedTotalClp` 100.000.
- **Entonces:** (a) se evalúa como un inicio nuevo: intento nuevo en `initiated` con otro `buy_order` (`OC-2026-0008` en esta corrida); `OC-2026-0007` sigue en `abandoned`. (b) la respuesta original de (a) (mismo id, `buy_order` y token, aunque el token ya haya vencido), sin intento nuevo. (c) 422 `IDEMPOTENCY_KEY_REUSED` con "Esta operación ya se envió con otros datos. Vuelve a abrir el formulario". Filas de K-66 en `IDEMPOTENCY_KEY`: 0 después del 503, 1 después de (a).

#### TC-GC-CA66-04 · Visibilidad y permiso antes que la disponibilidad

- **CA:** CA-66, "Respuestas de error" (orden de validación) · **Tipo:** aislamiento y permisos · **Prioridad:** 1
- **Dado:** E22 y la Comunidad A sin comercio vigente.
- **Cuando y entonces:** `arrendatario-102` pide un pago del ámbito `owner` del Depto 102: 404 (no 422); `propietario-101` pide un pago en el Depto 102: 404; `conserje-A`: 404; `admin-A` y `comite-A`: 403 (ven la unidad, pero no tienen `payment.pay_online`); sin sesión: 401. En ningún caso `ONLINE_PAYMENT_NOT_AVAILABLE`.

### CA-67 · Referencia obligatoria del pago manual y su lugar en el orden de validación (D6, S-62)

#### TC-GC-CA67-01 · Orden de validación del registro manual

- **CA:** CA-67, regla F-1 (S-62), "Orden entre reglas de negocio" · **Tipo:** integración · **Prioridad:** 1
- **Dado:** `2026-10` emitido como en CA-1; Depto 202, sin arrendatario, con ordinario $300.000 y fondo $15.000 impagos (vencen el 2026-11-11); hoy 2026-11-05.
- **Cuando y entonces** (transferencia en `owner`; cada fila es una petición con una clave nueva):

  | Paso | Asignaciones | Monto | `paid_on` | Referencia | Respuesta |
  | --- | --- | --- | --- | --- | --- |
  | (a) | `owner` | 100.000 | 2026-11-05 | "   " (solo espacios) | 422 `PAYMENT_REFERENCE_REQUIRED`, "Ingresa la referencia del pago" |
  | (b) | `owner` | 100.000 | 2026-11-05 | Sin el campo | El mismo 422 |
  | (c) | `owner` | 100.000 | 2026-11-05 | "" (vacía) o `null` | El mismo 422 (campo con código propio: no 400, S-70) |
  | (d) | `owner` | 100.000 | 2026-11-05 | El número 1182 (tipo inválido) | El mismo 422 (S-70) |
  | (e) | `owner` | 100.000 | 2026-11-05 | Tabulación y salto de línea | El mismo 422 (**Supuesto (a validar):** "espacios" incluye todo espacio en blanco) |
  | (f) | `owner` | 0 | 2026-11-05 | Sin el campo | 422 `INVALID_AMOUNT`, "El monto debe ser un número entero de pesos mayor que $0" |
  | (g) | `owner` | 10.000.000.000 | 2026-11-05 | Sin el campo | 422 `AMOUNT_TOO_LARGE`, "El monto supera el máximo permitido de $9.999.999.999" |
  | (h) | `owner` | 100.000 | 2026-11-06 | Sin el campo | 422 `PAID_ON_IN_FUTURE`, "La fecha de pago no puede ser futura" |
  | (i) | Sin asignaciones | 100.000 | 2026-11-05 | Sin el campo | 422 `SCOPE_REQUIRED`, "Elige a qué deuda aplicar el pago" |
  | (j) | `owner` dos veces | 100.000 | 2026-11-05 | Sin el campo | 422 `DUPLICATE_SCOPE`, "Cada deuda puede aparecer una sola vez en el pago" |
  | (k) | `owner` | −100.000 | 2026-11-06 | Sin el campo | 422 `INVALID_AMOUNT` (paso de forma, antes que `PAID_ON_IN_FUTURE` y la referencia; S-77) |
  | (l) | `owner` | 100.000,5 (con decimales) | 2026-11-05 | Sin el campo | 422 `INVALID_AMOUNT` (paso de forma) |

  - Nada escrito en ninguna fila; el saldo sigue en 300.000 + 15.000 = $315.000.
  - El $0 de (f) es forma válida y se rechaza como regla de negocio, en el lugar que le da "Orden entre reglas de negocio" del registro manual (antes que la referencia, como dice CA-67) (spec, "Respuestas de error", paso 3; H-34 resuelto). El negativo y el decimal de (k) y (l) se rechazan en el paso de forma.

#### TC-GC-CA67-02 · Registro con la referencia recortada

- **CA:** CA-67, reglas F-1, F-3 y F-5 · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** se registra $100.000 en `owner`, `paid_on` 2026-11-05, con la referencia "  Comprobante 1182 "; después, otro pago de $100.000 por transferencia con la referencia "comprobante 1182" y `paid_on` 2026-11-05.
- **Entonces:**
  - Un `PAYMENT` con `origin = manual`, referencia "Comprobante 1182" (sin los espacios del inicio y del final) y su propio `payment_group_id`.
  - El 2026-11-05 nada está vencido (vence el 2026-11-11): paso "lo no vencido" de F-5, ordinario primero: 300.000 − 100.000 = $200.000, más el fondo de $15.000: saldo **$215.000**.
  - El segundo formulario advierte por F-3 (misma referencia sin distinguir mayúsculas ni espacios, mismo medio y monto) y además por fecha, monto y medio iguales; no bloquea. Texto de la referencia: "Ya existe un pago de $100.000 por transferencia con la referencia "Comprobante 1182" (Depto 202, 05-11-2026). Revisa que no sea un duplicado".

#### TC-GC-CA67-03 · El estado de la ocupación va antes que la referencia

- **CA:** CA-67, reglas F-1 y F-9 · **Tipo:** integración · **Prioridad:** 1
- **Cuando y entonces** (registros sin referencia):
  - Estado final de CA-35 (O-1 terminada), dirigido a O-1: 409 `OCCUPANCY_ALREADY_ENDED` con "El arriendo de esta persona ya terminó. Aplica el pago a la deuda del propietario".
  - Estado de CA-53 (O-4 programada), dirigido a O-4: 409 `OCCUPANCY_NOT_STARTED` con "El arriendo aún no comienza. Aplica el pago a la deuda del propietario".
  - Estado de CA-61 (O-4 cancelada), dirigido a O-4: 409 `OCCUPANCY_CANCELLED` con "Este arriendo fue cancelado y nunca comenzó. Aplica el pago a la deuda del propietario".
  - Con el `occupancyId` de una ocupación de otra unidad: 404 antes que todo lo anterior.
  - En ningún caso `PAYMENT_REFERENCE_REQUIRED`; nada escrito.

#### TC-GC-CA67-04 · Misma clave después del rechazo (decisión del líder D12)

- **CA:** CA-67, regla A-3.4 · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** con la clave K-67: (a) el envío (a) de TC-GC-CA67-01; (b) el mismo pago con la referencia "  Comprobante 1182 "; (c) el envío (b) otra vez, con el mismo cuerpo; (d) K-67 con monto $90.000.
- **Entonces:** (a) 422 y ninguna fila de K-67 en `IDEMPOTENCY_KEY`. (b) se registra el pago, sin `IDEMPOTENCY_KEY_REUSED`; saldo **$215.000**. (c) el mismo `PAYMENT` y el mismo `payment_group_id`; sigue habiendo un solo pago y el saldo sigue en $215.000. (d) 422 `IDEMPOTENCY_KEY_REUSED`; nada escrito.
- **Orden con la clave ya guardada (S-77; H-34 resuelto):** después de (b), con K-67: (e) monto 100.000,5 → 422 `INVALID_AMOUNT`, no `IDEMPOTENCY_KEY_REUSED` (paso de forma); (f) JSON mal formado → 400 `BAD_REQUEST`, no `IDEMPOTENCY_KEY_REUSED`; (g) asignación con el `occupancyId` de una ocupación de otra unidad → 404 `NOT_FOUND` (paso 4, depende del cuerpo), no `IDEMPOTENCY_KEY_REUSED`. En los tres, nada escrito y la fila de K-67 sigue igual; el reenvío (c) posterior devuelve todavía la respuesta guardada.

#### TC-GC-CA67-05 · Referencia de un registro "Ambos"

- **CA:** CA-67, reglas F-1 y F-12 · **Tipo:** integración · **Prioridad:** 2 · **Oro:** GOLD-A32-01, 02
- **Dado:** E22.
- **Cuando:** el 2026-12-04 el administrador registra "Ambos" (`owner` $100.000 y `occupancy` O-1 $162.500) (a) sin referencia; (b) con la referencia " Transferencia 5531 ".
- **Entonces:** (a) 422 `PAYMENT_REFERENCE_REQUIRED`; ningún `PAYMENT` (ni parcial). (b) dos `PAYMENT` del mismo grupo, los dos con la referencia "Transferencia 5531"; saldos de GOLD-A32: `owner` **$162.500** y O-1 **$100.000**.

### CA-68 · Marcar para reverso con consulta previa a Transbank y cobro ya devuelto (D4, D6, D7, D8, D10, D11)

#### TC-GC-CA68-01 · De `AUTHORIZED` a `NULLIFIED` entre la vista previa y la ejecución

- **CA:** CA-68, regla F-16, A-7 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** estado de CA-5; el 2026-11-25 `propietario-101` inicia `OC-2026-0009` por $110.000, el doble autoriza $11.000 y el intento pasa a `in_review`.
- **Doble de Transbank:** vista previa v1, `AUTHORIZED` con `amount` 11.000 y sin `balance`; primera ejecución, vista previa v2 y segunda ejecución, `NULLIFIED` con el `authorization_code` 908172 de la anulación (dato de prueba).
- **Cuando:** el 2026-11-26 `soporte-1` pide la vista previa, confirma con v1 y un motivo, pide una vista previa nueva y la confirma con v2 y el motivo "La comunidad anuló la venta en Transbank".
- **Entonces:**
  - v1: estado `AUTHORIZED`, "Se pedirá reembolso: sí, por $11.000" (total autorizado, sin anulaciones previas), "pago a crear: ninguno".
  - Ejecución con v1: 409 `PREVIEW_OUTDATED` con "El intento cambió desde la vista previa. Revisa la nueva vista previa antes de resolver" (cambió `refundToRequest` de $11.000 a nulo); nada escrito, sin `WEBPAY_REFUND` ni llamada de reembolso.
  - v2: estado `NULLIFIED`, "Se pedirá reembolso: no", exactamente, sin texto a continuación en la misma línea (EX-1, F-16; H-39 resuelto: el wireframe CON-06 se alineó a la spec). La prueba e2e de la consola compara la línea completa.
  - Ejecución con v2: `reversal_pending` con el estado `NULLIFIED` guardado; **cero** filas en `WEBPAY_REFUND` y **cero** llamadas de reembolso en el doble; sin `PAYMENT` ni movimiento; saldo **$110.000**.
  - El detalle del intento del propietario expone `reversalKind = already_returned` y la app muestra "Tu pago no se registró. Transbank ya devolvió el monto" (no "Se solicitará la devolución del monto a Transbank").
  - La consola muestra "Intento OC-2026-0009 marcado para reverso. Transbank ya había devuelto el cobro. Revisa la referencia y confirma el reverso" (D11).

#### TC-GC-CA68-02 · Confirmar el reverso de un cobro ya devuelto

- **CA:** CA-68, regla F-16, F-17 (D7, D10; S-65) · **Tipo:** integración · **Prioridad:** 1
- **Dado:** el estado final de TC-GC-CA68-01.
- **Cuando y entonces:**
  - (a) **Con referencia en la consulta:** la vista previa de `confirm_reversal` propone 908172, sin la advertencia "Transbank no confirmó la devolución de este intento…" y sin la ayuda. Con 908172 y motivo, `reversed`; la consola muestra "Reverso confirmado para el intento OC-2026-0009. Referencia de Transbank: 908172" y el propietario ve "Tu pago fue anulado en Transbank. El reembolso a tu medio de pago depende de tu banco". Saldo $110.000.
  - (b) **Sin referencia en la consulta** (otra corrida; `NULLIFIED` sin `authorization_code`): ninguna referencia propuesta, ninguna advertencia y, junto al campo, la ayuda "Transbank no entregó la referencia de esta anulación. Obtenla en el portal de Transbank con el número de orden OC-2026-0009 y escríbela aquí". Sin referencia: 422 `REVERSAL_REFERENCE_REQUIRED` con "Ingresa la referencia de la anulación en Transbank" y el intento sigue en `reversal_pending`. Con la referencia del portal (dato "PORTAL-908172") y motivo: `reversed`.
  - (c) **`REVERSED`** en lugar de `NULLIFIED` (otra corrida; la consulta de la ejecución que guardó `REVERSED` fue el 2026-11-26 a las 09:05:37, hora de Chile = 12:05:37 UTC): el mismo resultado que (a), con la referencia propuesta exacta `REVERSED OC-2026-0009 26-11-2026 09:05` (spec CA-68 y S-82; H-36 resuelto). Comparación de la cadena completa: hora de Chile (no UTC: "12:05" falla), 24 horas, sin segundos (**Supuesto (a validar):** truncados; "09:06" falla; hallazgo H-45) y ceros a la izquierda. Variante de ceros: consulta del 2026-12-03 a las 08:04 (dato de reloj) → `REVERSED OC-2026-0009 03-12-2026 08:04`.

#### TC-GC-CA68-03 · Cobro vigente: reembolso por el total autorizado

- **CA:** CA-68, regla F-16 (D2; M-3) · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** como TC-GC-CA68-01, pero el doble responde `AUTHORIZED` con `amount` 11.000 en la vista previa y en la ejecución; en otra corrida, `CAPTURED` con `amount` 11.000.
- **Entonces:** "Se pedirá reembolso: sí, por $11.000" en la vista previa; la ejecución crea una `WEBPAY_REFUND` de $11.000 con `source_gateway_call_id` = la consulta de la ejecución; `reversalKind = refund_requested`; el propietario ve "Tu pago no se registró. Se solicitará la devolución del monto a Transbank"; la consola muestra el texto de D2 ("Intento OC-2026-0009 marcado para reverso. ComVive ya pidió la anulación a Transbank. Cuando Transbank responda, revisa la referencia propuesta y confirma el reverso"). El resto sigue TC-GC-CA41-04 (b) y TC-GC-CA55-02.

#### TC-GC-CA68-04 · Nada que devolver, 503 y estado del intento

- **CA:** CA-68, regla F-16 (S-66, S-57), "Orden entre reglas de negocio" (marcar para reverso) · **Tipo:** integración · **Prioridad:** 1
- **Cuando y entonces:**
  - (a) Sobre `OC-2026-0006` de CA-65 en `in_review`, con el doble en `INITIALIZED`: vista previa y ejecución (con y sin motivo) responden 422 `NO_CHARGE_TO_REVERSE` con "Transbank informa el estado INITIALIZED: este pago no tiene un cobro que devolver. Si corresponde, resuélvelo sin cobro"; el intento sigue en `in_review`; la consola sugiere `resolve_without_charge`.
  - (b) Con `FAILED`: el mismo 422, con "FAILED".
  - (c) Sin respuesta dentro de los 7 días: 503 `PAYMENT_GATEWAY_UNAVAILABLE` con "No pudimos consultar el estado en Transbank. Intenta en unos minutos".
  - (d) Intento en `reversal_pending`: vista previa y ejecución responden 409 `PREVIEW_OUTDATED` con "Esta resolución no corresponde al estado actual del intento. Revisa la nueva vista previa", sin llamadas al doble.
  - (e) Estado desconocido `PENDING_X` dentro de los 7 días: 422 `TRANSBANK_STATUS_UNEXPECTED` con "Transbank informó un estado que ComVive no reconoce (PENDING_X). Gestiona este caso directamente con Transbank", no el 503 de (c) (S-76, D17; H-33 resuelto). Detalle en TC-GC-CA73-01.
  - Nada escrito en (a) a (e); ninguna `WEBPAY_REFUND`.

#### TC-GC-CA68-05 · Auditoría, consultas e idempotencia (D12)

- **CA:** CA-68, regla A-3.4; ADR 0006, decisión 8 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** la secuencia de TC-GC-CA68-01 con la clave K-68 en las dos ejecuciones.
- **Entonces:**
  - `WEBPAY_GATEWAY_CALL`: 4 filas con origen `support_resolution` y comercio `MC-A-1` (vista previa v1, ejecución con v1, vista previa v2, ejecución con v2).
  - `AUDIT_LOG`: un registro por cada petición (las dos vistas previas, el 409 con su código y la resolución con `soporte-1` y el motivo).
  - La ejecución con v2 usa **la misma K-68** que la rechazada con 409 y se acepta (D12), sin `IDEMPOTENCY_KEY_REUSED`; un reenvío de K-68 con el cuerpo de v2 devuelve la respuesta original y no consulta otra vez a Transbank. Una sola fila de K-68 en `IDEMPOTENCY_KEY`.

#### TC-GC-CA68-06 · Aviso sin membresía según `reversalKind`

- **CA:** CA-68, regla F-13 (D8; S-67) · **Tipo:** integración y datos personales · **Prioridad:** 2
- **Dado:** el propietario que inició `OC-2026-0009` ya no tiene membresía (vendió el Depto 101).
- **Entonces:** con el cobro ya devuelto (TC-GC-CA68-01), recibe por correo verificado, con el asunto "Tu pago en línea en Comunidad A", "Tu pago en línea con número de orden OC-2026-0009 en Comunidad A no se registró y Transbank ya devolvió el monto. Si tienes dudas, contacta a la administración de tu comunidad". Con el reembolso pedido (TC-GC-CA68-03), "Tu pago en línea con número de orden OC-2026-0009 en Comunidad A no se registró. Se solicitará la devolución del monto a Transbank. Si tienes dudas, contacta a la administración de tu comunidad". Ninguno contiene "$", "11.000", "110.000" ni "Depto 101"; cada envío queda en auditoría.

### CA-69 · Operaciones ComVive no puede revocar al último administrador (D9, D10, D12; S-68, S-71, S-72)

#### TC-GC-CA69-01 · 409 `LAST_ADMIN` y qué escribe el rechazo

- **CA:** CA-69, "Validaciones de la consola de Operaciones ComVive"; arquitectura §3, prueba 12 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** la Comunidad A con un solo administrador vigente, AD1 (`admin-A`), con dos sesiones abiertas y una suscripción push.
- **Cuando:** el 2026-11-10 OP1 envía `POST /platform/communities/A/admin-memberships/{membresía de AD1}/revoke` con el motivo "Cambio de administración" y la clave K1.
- **Entonces:** 409 `LAST_ADMIN` con "No se puede revocar al único administrador de la comunidad. Otorga primero el rol a quien lo reemplazará". La membresía de AD1 sigue sin `revoked_at`; sus sesiones siguen sin `revoked_at`; su suscripción push sigue vinculada; ninguna fila de K1 en `IDEMPOTENCY_KEY`; **exactamente un** registro en `AUDIT_LOG` con `actor_type = platform`, rol `platform_operations`, OP1, la acción, la Comunidad A, el código `LAST_ADMIN` y la fecha y hora. AD1 sigue recibiendo 2xx en la Comunidad A.

#### TC-GC-CA69-02 · Orden de los errores y reintento con la misma clave

- **CA:** CA-69, regla A-3.4 (D12), D10 · **Tipo:** integración · **Prioridad:** 1
- **Cuando y entonces**, en orden:

  | Paso | Acción de OP1 | Respuesta | Estado después |
  | --- | --- | --- | --- |
  | (a) | Revocar a AD1 sin motivo, clave K2 | 422 `REASON_REQUIRED`, "Indica el motivo de la revocación" (no `LAST_ADMIN`) | AD1 vigente |
  | (b) | Otorgar `admin` de A a AD2 (Valentina Ortiz, 21.345.678-4, con correo) con el motivo "Nueva administración" | 2xx | AD2 vigente, `granted_via = platform`, sin primer ingreso |
  | (c) | Revocar a AD1 con **K1** y el mismo cuerpo de TC-GC-CA69-01 | 2xx: se reevalúa y se aplica (D12) | AD1 con `revoked_at`, `revoked_by` OP1 y el motivo; sus dos sesiones siguen sin `revoked_at` (S-81, H-42 resuelto); se elimina su suscripción push de la membresía de A; con la misma sesión, desde la petición siguiente AD1 recibe 404 en la Comunidad A y "Mis comunidades" ya no la lista; AD2 es la única administradora vigente |
  | (d) | K1 otra vez, mismo cuerpo | El resultado original de (c), no `ROLE_ALREADY_REVOKED` | Sin cambios |
  | (e) | K1 con otro motivo | 422 `IDEMPOTENCY_KEY_REUSED` | Sin cambios |
  | (f) | Revocar a AD2, clave K3 | 409 `LAST_ADMIN` (AD2 cuenta aunque no haya ingresado, D10) | AD2 vigente |
  | (g) | Revocar a AD1 otra vez, clave K4, con motivo | 409 `ROLE_ALREADY_REVOKED`, "Este rol ya fue revocado" (no `LAST_ADMIN`) | Sin cambios |
  | (h) | Revocar a AD1, clave K5, sin motivo | 422 `REASON_REQUIRED` (el motivo va antes que el estado) | Sin cambios |

  - Cada rechazo deja un registro en `AUDIT_LOG` con su código y ninguna fila en `IDEMPOTENCY_KEY`. La revocación aplicada queda en auditoría con quién, a quién, cuándo y el motivo.

#### TC-GC-CA69-03 · Revocaciones simultáneas con barrera, repetidas

- **CA:** CA-69 (S-68); arquitectura §3, prueba 12 · **Tipo:** integración (concurrencia) · **Prioridad:** 1
- **Dado:** la Comunidad A con AD1 y AD2 vigentes.
- **Cuando:** OP1 revoca a AD1 y `operaciones-2` revoca a AD2 en dos transacciones paralelas, sincronizadas con una barrera justo antes del bloqueo de la fila de la comunidad; se repite 200 veces (**Supuesto (a validar):** número de repeticiones propio), alternando cuál llega primero.
- **Entonces:** en cada repetición, exactamente una respuesta 2xx y una 409 `LAST_ADMIN`, y la Comunidad A queda con exactamente un administrador vigente; nunca con cero. Variantes: (a) revocar a AD1 mientras se otorga a una tercera persona, en paralelo: ambas se aceptan y quedan dos vigentes; (b) con tres administradores, dos revocaciones simultáneas se aceptan y queda uno.

#### TC-GC-CA69-04 · Tareas abiertas al revocar a un administrador (S-71)

- **CA:** CA-69, "Validaciones de la consola de Operaciones ComVive" (S-71); CA-57 · **Tipo:** integración · **Prioridad:** 2
- **Dado:** la Comunidad A con AD1 como única administradora y la tarea abierta "Revisar rol de comité de Rosa Díaz" (CA-57), cuya alerta (push y correo) recibió AD1.
- **Cuando:** el 2026-11-10 OP1 otorga `admin` a AD2 y revoca a AD1; el 2026-11-12 AD2 hace su primer ingreso, lista `GET /communities/A/admin-tasks?status=open` y resuelve la tarea con `keep_committee` y un motivo; después se registra la venta de la única unidad de otro miembro del comité (dato de escenario).
- **Entonces:**
  - La `ADMIN_TASK` sigue abierta con el mismo id después de la revocación; AD1 recibe 404 en `admin-tasks`.
  - AD2 ve la tarea en su primer ingreso y la cierra; la web muestra "Mantuviste el rol de comité de Rosa Díaz. La tarea quedó cerrada".
  - Ningún push ni correo nuevo de esa tarea a AD2 por la revocación ni por su primer ingreso (conteo de notificaciones).
  - La alerta de la venta posterior va solo a AD2, no a AD1.

#### TC-GC-CA69-05 · Alerta a Operaciones si el nuevo administrador no ingresa (S-72)

- **CA:** CA-69 (S-72, S-85; P-56; depende del ADR 0008, D14) · **Tipo:** unitaria (regla con reloj inyectado) e integración · **Prioridad:** 2
- **Dado:** AD2 otorgada el 2026-11-10 (hora de Chile).
- **Plazo:** 7 días corridos siguientes al otorgamiento: 11 (1), 12 (2), 13 (3), 14 (4), 15 (5), 16 (6) y 17 (7). Vence al terminar el 2026-11-17, hora de Chile.
- **Cuando y entonces:**
  - (a) AD2 no ingresa: el 2026-11-18 Operaciones ComVive recibe **una** alerta con exactamente tres datos: el nombre de la Comunidad A, el id de la membresía de AD2 y la fecha del otorgamiento (2026-11-10). Prueba de contrato: sin RUT, contacto, deuda ni otro dato de negocio. Un registro en auditoría. AD2 sigue vigente y nada se revoca ni se bloquea.
  - (b) La tarea programada corre otra vez el 2026-11-19: ninguna alerta nueva para esa membresía.
  - (c) En otra corrida, AD2 ingresa el 2026-11-17 a las 23:59: ninguna alerta.
  - (d) Lo mismo vale para el primer administrador otorgado en el alta de una comunidad.
  - (e) **Sin repetición ni escalamiento (S-85, P-56 abierta):** AD2 sigue sin ingresar y la tarea corre cada día hasta el 2026-11-25. Día 14 desde el otorgamiento: 10 + 14 = 2026-11-24; la tarea del 2026-11-25 ya pasó el día 14. Ninguna alerta nueva para esa membresía en todo el periodo (conteo total de alertas = 1, la del 2026-11-18), sin escalamiento a otro canal, y AD2 sigue vigente: nada se revoca ni se bloquea por inactividad.
  - (f) **Un otorgamiento nuevo reinicia el plazo (S-85):** OP1 revoca a AD2 el 2026-11-20 (con AD1 vigente, sin `LAST_ADMIN`) y la otorga de nuevo el 2026-11-20 (membresía nueva, otro id). Plazo nuevo: 21 (1) a 27 (7); vence al terminar el 2026-11-27. El 2026-11-28 llega una alerta con el id de la **membresía nueva** y la fecha 2026-11-20; la alerta del 2026-11-18 no se repite. Total de alertas: 2, una por otorgamiento. Si AD2 ingresa el 2026-11-27, ninguna alerta para la membresía nueva.

### CA-70 · Reembolso rechazado con 292 o 310 pasados los 7 días consultables (D5, D13; S-67, S-69)

#### TC-GC-CA70-01 · Marcar para reverso sin estado concluyente: reembolso por el monto iniciado

- **CA:** CA-70, regla F-16 (S-69) · **Tipo:** integración · **Prioridad:** 1
- **Dado:** estado de CA-5; el 2026-11-25 `propietario-101` inicia `OC-2026-0010` por $110.000; el doble nunca entrega un estado concluyente (consultas de 15, 20 y 30 minutos y consultas diarias); el intento pasa a `in_review` con `review_due_on` 2026-12-02 y el 2026-12-03 se marca "Plazo vencido", con una alerta que lleva solo el id del intento y `OC-2026-0010`.
- **Cuando:** el 2026-12-03 `soporte-1` pide la vista previa de `mark_for_reversal` y la confirma con v1 y el motivo "Sin estado en Transbank; se pide el reembolso".
- **Entonces:**
  - La vista previa no llama al doble; `transbankStatus` nulo (`transbankStatusSource = none`), "Se pedirá reembolso: sí, por $110.000" (monto iniciado, S-69) y "pago a crear: ninguno".
  - La ejecución deja el intento en `reversal_pending` con una `WEBPAY_REFUND` de $110.000, `source_gateway_call_id` nulo y `outcome` `pending`; `reversalKind = refund_requested`; sin `PAYMENT` ni movimiento; saldo **$110.000**. El propietario ve "Tu pago no se registró. Se solicitará la devolución del monto a Transbank".

#### TC-GC-CA70-02 · Reembolso rechazado con 292 y cierre sin cobro desde `reversal_pending` (D13)

- **CA:** CA-70, reglas F-16 y F-17 (D13; S-67) · **Tipo:** integración · **Prioridad:** 1
- **Dado:** el estado final de TC-GC-CA70-01.
- **Cuando:** la tarea del reembolso lo ejecuta y el doble responde con el código 292; `soporte-1` lee el detalle, pide la vista previa de `confirm_reversal` (sin confirmar), pide la de `resolve_without_charge` y la confirma con v2 y el motivo "Transbank informa que nunca hubo cobro".
- **Entonces:**
  - `WEBPAY_REFUND.outcome = failed` con `response_code` 292; el intento sigue en `reversal_pending` y el propietario conserva "Tu pago no se registró. Se solicitará la devolución del monto a Transbank".
  - El detalle de Soporte trae `withoutChargeAvailable = true` (**Supuesto (a validar):** nombre de ADR 0006, decisión 5).
  - La vista previa de `confirm_reversal` no propone referencia y muestra la advertencia "Transbank no confirmó la devolución de este intento. Confirma el reverso solo con una referencia que obtuviste directamente de Transbank" (D7).
  - La vista previa de `resolve_without_charge` **no llama al doble**; trae el estado "reembolso rechazado (código 292)" (`transbankStatusSource = refund_292`), "pago a crear: ninguno" y la versión v2, **sin** la advertencia "No hay un estado de Transbank que respalde esta resolución…".
  - La ejecución deja el intento en `rejected` con `resolution = resolve_without_charge` y `rejectionKind = resolved_without_charge`. Cero filas nuevas en `PAYMENT`, `LEDGER_ENTRY`, `ALLOCATION` y `WEBPAY_REFUND`; la `WEBPAY_REFUND` existente sigue igual (`failed`, 292); ninguna llamada al doble. Ámbito `owner` en 100.000 + 10.000 = **$110.000**.
  - La consola muestra "Intento OC-2026-0010 cerrado sin cobro. Estado en Transbank: reembolso rechazado (código 292)". El propietario pasa a ver "Tu pago no se completó. No se hizo ningún cargo".
  - Después, `soporte-1` recibe 404 en cualquier lectura o resolución de `OC-2026-0010`. Sin membresía, el pagador recibe el aviso de `resolve_without_charge` de F-13 con `OC-2026-0010`.

#### TC-GC-CA70-03 · Carrera entre la vista previa y la ejecución

- **CA:** CA-70, regla F-16 ("Si al ejecutar ya no se cumple D13") · **Tipo:** integración · **Prioridad:** 1
- **Cuando y entonces:**
  - (a) Entre la vista previa v2 de `resolve_without_charge` y su ejecución, `soporte-2` confirma el reverso con una referencia y motivo: el intento queda en `reversed` y la ejecución de `soporte-1` responde 404 `NOT_FOUND`; nada más cambia.
  - (b) Si el intento sigue en `reversal_pending` pero deja de cumplir D13 (fixture que cambia el `response_code` guardado del reembolso a 310 entre la vista previa y la ejecución): 409 `PREVIEW_OUTDATED` con "Esta resolución no corresponde al estado actual del intento. Revisa la nueva vista previa"; nada escrito.

#### TC-GC-CA70-04 · Reembolso rechazado con 310: no es un cobro ya devuelto

- **CA:** CA-70, reglas F-16 y F-17 (D13, D7) · **Tipo:** integración · **Prioridad:** 1
- **Dado:** el estado final de TC-GC-CA70-01.
- **Cuando:** el doble responde al reembolso con el código 310; `soporte-1` pide `resolve_without_charge` (vista previa y ejecución) y después confirma el reverso con la referencia "ANUL-PREVIA-0010" (dato de prueba, obtenida de Transbank) y un motivo.
- **Entonces:**
  - `WEBPAY_REFUND.outcome = failed` con `response_code` 310; el intento sigue en `reversal_pending` con `reversalKind = refund_requested` y el propietario sigue viendo "Tu pago no se registró. Se solicitará la devolución del monto a Transbank".
  - `withoutChargeAvailable = false`; `resolve_without_charge` responde 409 `PREVIEW_OUTDATED` con "Esta resolución no corresponde al estado actual del intento. Revisa la nueva vista previa", sin llamadas al doble y sin escribir nada.
  - La vista previa de `confirm_reversal` no propone referencia y muestra la advertencia de D7. Con la referencia y el motivo, el intento pasa a `reversed`; el propietario ve "Tu pago fue anulado en Transbank. El reembolso a tu medio de pago depende de tu banco"; saldo $110.000.
  - Falla si el 310 se trata como cobro ya devuelto: `reversalKind = already_returned`, el texto "Transbank ya devolvió el monto" o la consola sin la advertencia.

#### TC-GC-CA70-05 · 292 sin las demás condiciones de D13

- **CA:** CA-70, regla F-16 (D13, condición 2); ADR 0007, prueba 12 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** `OC-2026-0009` marcado para reverso como en TC-GC-CA68-03, con estado concluyente (`AUTHORIZED`): `WEBPAY_REFUND` de $11.000 con `source_gateway_call_id` no nulo.
- **Cuando:** el doble responde al reembolso con 292 y `soporte-1` pide `resolve_without_charge`.
- **Entonces:** `outcome = failed` con 292, `withoutChargeAvailable = false` y 409 `PREVIEW_OUTDATED` ("Esta resolución no corresponde…"); nada escrito. `confirm_reversal` sigue disponible, con la advertencia de D7.

#### TC-GC-CA70-06 · `confirm_reversal` con el reembolso en `pending` y huella

- **CA:** CA-70, CA-74, regla A-7 y F-16 (S-78, D17); ADR 0006, decisión 6 · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** (a) `soporte-1` pide la vista previa de `confirm_reversal` con la `WEBPAY_REFUND` de $110.000 de TC-GC-CA70-01 aún en `pending`; (b) el doble responde 310 y `soporte-1` pide la vista previa otra vez; (c) un fixture cambia `refundOutcome` de `failed` a `nullified` entre esa vista previa y la ejecución.
- **Entonces:** (a) 409 `REFUND_PENDING` con "Transbank aún no responde el reembolso de este intento. Intenta confirmar más tarde", sin advertencia ni referencia propuesta; nada escrito (H-35 resuelto; antes se esperaba una vista previa con advertencia). (b) 2xx con `refundOutcome = failed` y la advertencia de D7. (c) 409 `PREVIEW_OUTDATED` con "El intento cambió desde la vista previa. Revisa la nueva vista previa antes de resolver"; nada escrito. `refundOutcome` está en la huella de `confirm_reversal` (spec A-7 y F-16; H-30 resuelto).

### CA-71 · Monto del reembolso de un cobro con anulaciones previas (M-3)

#### TC-GC-CA71-01 · Reembolso por el saldo anulable y 409 si cambia

- **CA:** CA-71, regla F-16 (M-3) · **Tipo:** integración · **Prioridad:** 1
- **Dado:** estado de CA-5; el 2026-11-25 `OC-2026-0011` por $110.000, autorizado por $11.000, en `in_review`; la comunidad anula $5.000 desde el portal de Transbank.
- **Doble de Transbank:** vista previa v1, `PARTIALLY_NULLIFIED`, `amount` 11.000, `balance` 11.000 − 5.000 = 6.000; ejecución con v1, vista previa v2 y ejecución con v2, `balance` 6.000 − 1.000 = 5.000 (la comunidad anuló otros $1.000).
- **Cuando:** el 2026-11-26 `soporte-1` pide v1, confirma con v1 y un motivo, pide v2 y la confirma con el motivo "Monto autorizado distinto del iniciado".
- **Entonces:**
  - v1: estado `PARTIALLY_NULLIFIED` y "Se pedirá reembolso: sí, por $6.000" (saldo anulable; no $11.000 ni $110.000).
  - Ejecución con v1: 409 `PREVIEW_OUTDATED` con "El intento cambió desde la vista previa. Revisa la nueva vista previa antes de resolver" (cambió `refundToRequest` de $6.000 a $5.000); nada escrito.
  - v2: "Se pedirá reembolso: sí, por $5.000". Ejecución con v2: `reversal_pending` con una `WEBPAY_REFUND` de **$5.000** (`source_gateway_call_id` = consulta de la ejecución con v2), `reversalKind = refund_requested`; saldo **$110.000**.
  - Cuadre: anulaciones previas 5.000 + 1.000 = 6.000; reembolso 11.000 − 6.000 = 5.000; total devuelto 5.000 + 1.000 + 5.000 = **$11.000** = monto autorizado.
  - Falla si se pide $11.000 (Transbank lo rechazaría con 311).

#### TC-GC-CA71-02 · Resultado del reembolso y confirmación

- **CA:** CA-71 · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** el doble responde al reembolso de $5.000 con una anulación (`type` `NULLIFIED`, `authorization_code` 615204, `nullified_amount` 5.000, `balance` 0) y `soporte-1` confirma el reverso con la referencia propuesta y un motivo.
- **Entonces:** la consola propone 615204, sin advertencia; el intento pasa a `reversed` y el saldo sigue en **$110.000**. Regresión: si el doble recibiera un pedido de $11.000, respondería 311, el reembolso quedaría `failed` y la consola mostraría la advertencia de D7.

#### TC-GC-CA71-03 · Saldo anulable anómalo

- **CA:** CA-71, CA-73, regla F-16 (S-76, D17); ADR 0007, decisión 8 ("Monto") · **Tipo:** integración · **Prioridad:** 1
- **Cuando:** dentro de los 7 días consultables, el doble responde a `mark_for_reversal` de `OC-2026-0011` `PARTIALLY_NULLIFIED` con `amount` 11.000 y (a) sin `balance`; (b) `balance` 0; (c) `balance` 12.000 (mayor que lo autorizado).
- **Entonces:** vista previa y ejecución responden 422 `TRANSBANK_STATUS_UNEXPECTED` con "Transbank informó un estado que ComVive no reconoce ({estado}). Gestiona este caso directamente con Transbank", con {estado} = (a) "PARTIALLY_NULLIFIED, saldo anulable sin dato", (b) "PARTIALLY_NULLIFIED, saldo anulable $0", (c) "PARTIALLY_NULLIFIED, saldo anulable $12.000" (12.000 > 11.000). No es 503 (H-33 resuelto). Sin `WEBPAY_REFUND`, sin llamada `refund`, intento en `in_review`, saldo $110.000. En `resolve_without_charge`, `PARTIALLY_NULLIFIED` responde siempre 422 `CHARGE_AUTHORIZED_IN_TRANSBANK`, con o sin `balance`. Detalle y bordes en TC-GC-CA73-02.

### CA-72 · Textos del pagador para un intento rechazado o cancelado (M-6, D15)

#### TC-GC-CA72-01 · Rechazo del banco

- **CA:** CA-72, regla F-17; ADR 0007, decisiones 4 y 6 · **Tipo:** integración y e2e (Maestro) · **Prioridad:** 2
- **Cuando:** el 2026-11-25 `propietario-101` inicia `OC-2026-0012` por $110.000 y (a) vuelve con `token_ws` y el doble responde a "confirmar" con `response_code` distinto de 0 y estado `FAILED`; (b) en otra corrida no vuelve y la consulta de los 15 minutos informa `FAILED`.
- **Entonces:** el intento pasa a `rejected` con `resolution` nula y `rejectionKind = transbank_rejected`; ningún pago; saldo **$110.000**; `lock_active` falso y un intento nuevo se acepta de inmediato, sin advertencia. La app muestra "Tu banco rechazó el pago. No se hizo ningún cargo".

#### TC-GC-CA72-02 · Pago cancelado

- **CA:** CA-72, regla F-17 · **Tipo:** integración y e2e (Maestro) · **Prioridad:** 2
- **Cuando:** (a) el propietario inicia `OC-2026-0013` por $110.000 y cancela en el formulario (retorno con `TBK_TOKEN` igual al token del intento y sin `token_ws`); (b) `OC-2026-0007` de CA-66 (503 al iniciar); (c) un intento sin pago cuya consulta de los 15 minutos informa `INITIALIZED`.
- **Entonces:** en (a) no hay llamada a Transbank (Transbank no exige confirmar). En los tres, el intento está en `abandoned` con `rejectionKind` y `reversalKind` nulos, la app muestra "Pago cancelado. No se hizo ningún cargo" y el saldo sigue en $110.000.

#### TC-GC-CA72-03 · Contrato del detalle del intento del pagador y texto por estado

- **CA:** CA-72, CA-65, CA-68, CA-70; regla F-17; arquitectura §4 · **Tipo:** integración (contrato) y e2e · **Prioridad:** 2
- **Entonces:** `GET .../units/{unitId}/webpay-attempts/{attemptId}`, pedido por quien inició el intento, devuelve:

  | Estado | `reversalKind` | `rejectionKind` | Texto de la app |
  | --- | --- | --- | --- |
  | `initiated` | nulo | nulo | "Tienes un pago en proceso" y "Número de orden {buy_order}. Te avisaremos el resultado" |
  | `in_review` | nulo | nulo | "En revisión por ComVive" y "Te avisaremos cuando se resuelva. Número de orden {buy_order}" |
  | `rejected` por Transbank | nulo | `transbank_rejected` | "Tu banco rechazó el pago. No se hizo ningún cargo" |
  | `rejected` por Soporte (desde `in_review`, o desde `reversal_pending` con el 292) | nulo | `resolved_without_charge` | "Tu pago no se completó. No se hizo ningún cargo" |
  | `abandoned` | nulo | nulo | "Pago cancelado. No se hizo ningún cargo" |
  | `reversal_pending` con `WEBPAY_REFUND` | `refund_requested` | nulo | "Tu pago no se registró. Se solicitará la devolución del monto a Transbank" |
  | `reversal_pending` sin `WEBPAY_REFUND` | `already_returned` | nulo | "Tu pago no se registró. Transbank ya devolvió el monto" |
  | `reversed` | nulo | nulo | "Tu pago fue anulado en Transbank. El reembolso a tu medio de pago depende de tu banco" |
  | `confirmed` o `resolved_paid` | nulo | nulo | El pago, "Pagado por ti" |

  - Ningún texto termina en punto ni tiene variantes (F-17). `OC-2026-0006` de CA-65 devuelve `resolved_without_charge`; `OC-2026-0012`, `transbank_rejected`.
  - A cualquier otra persona el detalle le responde 404 (ISO-GC-ambito-3 y 5).

### Casos CA-73 a CA-75 (spec rev. 8)

Parten del estado de CA-5 (Depto 101, sin arrendatario, ámbito `owner` con ordinario $100.000 y fondo $10.000 de `2026-10`, vencidos el 2026-11-11: deuda 100.000 + 10.000 = **$110.000**), flag apagado, borrador vigente `2026-11` y comercio `MC-A-1`. Ninguna resolución de reverso escribe movimientos: el saldo final se verifica en $110.000 con cero filas nuevas en `PAYMENT`, `LEDGER_ENTRY` y `ALLOCATION`, salvo TC-GC-CA75-02 (2), que confirma un pago. Hora de Chile en noviembre y diciembre de 2026: UTC−3.

### CA-73 · Marcar para reverso con un estado desconocido o un `balance` anómalo (H-33, H-37; S-76, S-80; D17)

#### TC-GC-CA73-01 · 422 `TRANSBANK_STATUS_UNEXPECTED` con un estado desconocido

- **CA:** CA-73, regla F-16 ("Orden entre reglas de negocio", marcar para reverso), A-3.4 (D12) · **Tipo:** integración · **Prioridad:** 1
- **Dado:** el 2026-11-25 a las 21:40:00 (hora de Chile) `propietario-101` inicia `OC-2026-0014` por $110.000. La API envía el `create` a las 21:40:00 (`WEBPAY_GATEWAY_CALL.called_at` = 2026-11-26 00:40:00 UTC) y guarda `tbk_queryable_until` = 00:40:00 UTC + 168 horas = 2026-12-03 00:40:00 UTC = **2026-12-02 21:40:00 hora de Chile**. El doble responde a "confirmar" `AUTHORIZED` con `amount` 11.000 (≠ 110.000): el intento pasa a `in_review` con `review_due_on` 2026-12-02 (26, 27, 30, 1 y 2), sin pago.
- **Doble de Transbank:** toda consulta de estado de esta prueba responde `PENDING_X` (estado que ComVive no conoce).
- **Cuando:** el 2026-11-26 a las 10:00 `soporte-1`: (a) pide la vista previa de `mark_for_reversal`; (b) ejecuta con un motivo y la clave K-73; (c) ejecuta sin motivo, con la clave K-73b; (d) el doble pasa a responder `AUTHORIZED` con `amount` 11.000, pide una vista previa nueva (v1) y la ejecuta con v1, **la misma K-73** y el motivo "Monto autorizado distinto del iniciado".
- **Entonces:**
  - (a), (b) y (c): 422 `TRANSBANK_STATUS_UNEXPECTED` con "Transbank informó un estado que ComVive no reconoce (PENDING_X). Gestiona este caso directamente con Transbank" (texto aprobado en D17). No es 503 `PAYMENT_GATEWAY_UNAVAILABLE` (Transbank sí respondió). En (c), no 422 `REASON_REQUIRED`: el estado en Transbank va antes que el motivo.
  - Después de (a) a (c): cero filas en `WEBPAY_REFUND`, cero llamadas `refund` en el doble, intento en `in_review`, saldo **$110.000**; ninguna fila de K-73 ni K-73b en `IDEMPOTENCY_KEY`. Conteos: 3 filas en `WEBPAY_GATEWAY_CALL` con origen `support_resolution` (una consulta por petición) y 3 registros en `AUDIT_LOG` con `actor_type = platform` y el código `TRANSBANK_STATUS_UNEXPECTED`. La consola no sugiere otra resolución (ADR 0007, decisión 8).
  - (d): v1 con estado `AUTHORIZED` y "Se pedirá reembolso: sí, por $11.000"; la ejecución con K-73 se evalúa de nuevo (D12) y se acepta: `reversal_pending` con una `WEBPAY_REFUND` de $11.000 (`outcome` `pending`), `reversalKind = refund_requested`; saldo $110.000. La siguiente vista previa sigue la regla del estado conocido (CA-73).
  - Contraste: `resolve_without_charge` con `PENDING_X` sigue respondiendo 422 `TRANSBANK_STATUS_NOT_WITHOUT_CHARGE` (TC-GC-CA65-03), no `TRANSBANK_STATUS_UNEXPECTED`.

#### TC-GC-CA73-02 · `balance` anómalo y sus bordes

- **CA:** CA-73, CA-71, regla F-16 (S-76; ADR 0007, decisión 8, "Monto") · **Tipo:** integración · **Prioridad:** 1
- **Dado:** `OC-2026-0014` en `in_review`, dentro de los 7 días consultables (2026-11-26), con $11.000 autorizados.
- **Cuando y entonces**, una corrida por respuesta del doble a la vista previa y a la ejecución de `mark_for_reversal`:

  | Corrida | `PARTIALLY_NULLIFIED` con | ¿Anómalo? (falta, $0 o > 11.000) | Respuesta |
  | --- | --- | --- | --- |
  | (1) | Sin `balance` | Sí, falta | 422 `TRANSBANK_STATUS_UNEXPECTED` con "Transbank informó un estado que ComVive no reconoce (PARTIALLY_NULLIFIED, saldo anulable sin dato). Gestiona este caso directamente con Transbank" |
  | (2) | `balance` 0 | Sí, $0 | El mismo 422, con "(PARTIALLY_NULLIFIED, saldo anulable $0)" |
  | (3) | `balance` 12.000 | Sí, 12.000 > 11.000 | El mismo 422, con "(PARTIALLY_NULLIFIED, saldo anulable $12.000)" |
  | (4) | `balance` 6.000 (anulados 11.000 − 6.000 = 5.000) | No | 2xx: "Se pedirá reembolso: sí, por $6.000" (como CA-71) |
  | (5) | `balance` 11.000 (borde: igual al autorizado) | No (no supera el autorizado) | 2xx: "Se pedirá reembolso: sí, por $11.000" |
  | (6) | `balance` 1 (borde inferior) | No | 2xx: "Se pedirá reembolso: sí, por $1" |

  - En (1) a (3): nada escrito, sin `WEBPAY_REFUND` ni llamada `refund`; intento en `in_review`; saldo $110.000. El monto en {estado} va con separador de miles y signo "$", como los demás montos de los textos.
  - (7) **Cambio entre la vista previa y la ejecución:** v1 con `balance` 6.000 (corrida 4) y la ejecución con el doble ya sin `balance`: la ejecución responde 422 `TRANSBANK_STATUS_UNEXPECTED` (sin dato), no 409 `PREVIEW_OUTDATED`, porque el estado en Transbank se evalúa antes que la huella (orden de "Marcar para reverso"). Nada escrito.

#### TC-GC-CA73-03 · 168 horas por instante y respuestas inesperadas pasados los 7 días

- **CA:** CA-73, "Definiciones" (7 días consultables), regla F-16 (S-76, S-80; ADR 0007, decisión 7 y prueba 15) · **Tipo:** unitaria (reloj inyectado) e integración · **Prioridad:** 1
- **Dado:** `OC-2026-0014` con `tbk_queryable_until` = 2026-12-03 00:40:00 UTC (2026-12-02 21:40:00 hora de Chile), en `in_review`. Respuestas guardadas por defecto: "confirmar" del 2026-11-25 con `AUTHORIZED` y `amount` 11.000, y consultas diarias del 2026-11-26 al 2026-12-02 con `PENDING_X`.
- **Cuando y entonces** (`soporte-1` pide la vista previa de `mark_for_reversal`; el doble responde `PENDING_X` si se le consulta):

  | Corrida | Instante de la petición (hora de Chile) | Instante UTC | ¿`now() < tbk_queryable_until`? | Resultado |
  | --- | --- | --- | --- | --- |
  | (a) | 2026-12-02 21:39:59 | 2026-12-03 00:39:59 | Sí | Consulta al doble (`transbankStatusSource = query`): 422 `TRANSBANK_STATUS_UNEXPECTED` |
  | (b) | 2026-12-02 21:40:00 | 2026-12-03 00:40:00 | No (igual, no menor) | Sin llamada al doble; usa la última respuesta **concluyente** guardada (abajo) |
  | (c) | 2026-12-02 22:00:00 | 2026-12-03 01:00:00 | No | Igual que (b). Falla si consulta: contar por día calendario daría el 2026-12-02 completo como consultable |

  - **Última concluyente pasados los 7 días** (corridas (b) y (c), una por historial guardado):
    - (b1) Historial por defecto: `PENDING_X` no cuenta (S-76); la última concluyente es el `AUTHORIZED` de "confirmar" → `transbankStatus` `AUTHORIZED`, `transbankStatusSource = last_stored`, "Se pedirá reembolso: sí, por $11.000" (total autorizado); la ejecución crea una `WEBPAY_REFUND` de $11.000 con `source_gateway_call_id` = la llamada de "confirmar" (ADR 0007, prueba 8). **Supuesto (a validar):** la respuesta de "confirmar" cuenta como respuesta guardada; la última línea de CA-73 en la spec habla de $110.000 (hallazgo H-43).
    - (b2) Historial con `PARTIALLY_NULLIFIED` `balance` 6.000 el 2026-11-27 y `PARTIALLY_NULLIFIED` sin `balance` el 2026-12-01: la última concluyente es la del 2026-11-27 → "Se pedirá reembolso: sí, por $6.000".
    - (b3) Fixture sin ninguna concluyente (el intento entró a revisión sin respuesta a "confirmar" ni a las consultas de 15, 20 y 30 minutos, como CA-70, y después solo `PENDING_X`): `transbankStatus` nulo, `transbankStatusSource = none`, "Se pedirá reembolso: sí, por $110.000" (monto iniciado, S-69); `WEBPAY_REFUND` de $110.000 con `source_gateway_call_id` nulo.
  - (d) **Inicio del plazo:** el doble demora 5 segundos en responder a `create` (envío 21:40:00, respuesta 21:40:05): `tbk_queryable_until` sigue siendo 2026-12-03 00:40:00 UTC (envío + 168 horas), no 00:40:05.
  - (e) **Huso del servidor:** la misma prueba con el proceso en `TZ=UTC` y en `TZ=America/Santiago` da los mismos resultados de (a) a (c).
  - (f) **Cambio de horario (unitaria):** envío del `create` el 2027-03-31 a las 21:40:00 (UTC−3) = 2027-04-01 00:40:00 UTC; + 168 horas = 2027-04-08 00:40:00 UTC = **2027-04-07 20:40:00** hora de Chile (UTC−4 desde el 2027-04-04). Una petición del 2027-04-07 a las 21:00 (hora de Chile) ya está fuera. Falla si suma 7 días en hora local (daría 21:40).

### CA-74 · Confirmar el reverso con el reembolso aún sin resultado (H-35; S-78; D17)

#### TC-GC-CA74-01 · 409 `REFUND_PENDING` en la vista previa y en la ejecución

- **CA:** CA-74, regla F-16 ("Orden entre reglas de negocio", confirmar el reverso), A-3.4 (D12) · **Tipo:** integración · **Prioridad:** 1
- **Dado:** el 2026-11-25 `propietario-101` inicia `OC-2026-0015` por $110.000, el doble autoriza $11.000 y el intento pasa a `in_review`. El 2026-11-26 `soporte-1` lo marca para reverso con el doble en `AUTHORIZED` (`amount` 11.000): `reversal_pending`, una `WEBPAY_REFUND` de $11.000 con `outcome` `pending`, `reversalKind = refund_requested`. La tarea de reembolsos está detenida (la prueba no la ejecuta).
- **Cuando:** `soporte-1` pide la vista previa de `confirm_reversal` y ejecuta con la clave K-74: (a) con referencia "730415" y motivo; (b) sin referencia, con motivo; (c) con referencia, sin motivo; (d) sin referencia ni motivo.
- **Entonces:**
  - Vista previa y (a) a (d): 409 `REFUND_PENDING` con "Transbank aún no responde el reembolso de este intento. Intenta confirmar más tarde" (texto aprobado en D17). Nunca `REVERSAL_REFERENCE_REQUIRED` ni `REASON_REQUIRED` (orden S-78: estado del intento → `REFUND_PENDING` → referencia → motivo → huella).
  - La consola no muestra la advertencia "Transbank no confirmó la devolución de este intento…", ni referencia propuesta, ni el botón de confirmar (ADR 0007, decisión 8).
  - Nada escrito: el intento sigue en `reversal_pending`; la `WEBPAY_REFUND` sigue en `pending` y es la única; saldo **$110.000**; ninguna fila de K-74 en `IDEMPOTENCY_KEY`; ninguna llamada al doble; 5 registros en `AUDIT_LOG` (uno por petición) con el código `REFUND_PENDING`.
  - El propietario sigue viendo "Tu pago no se registró. Se solicitará la devolución del monto a Transbank".
  - (e) Otra corrida, con el intento todavía en `in_review` (sin `WEBPAY_REFUND`): `confirm_reversal` responde 409 `PREVIEW_OUTDATED` con "Esta resolución no corresponde al estado actual del intento. Revisa la nueva vista previa", no `REFUND_PENDING` (el estado del intento va primero).
  - (f) Un `WEBPAY_REFUND` en `pending` por más de 1 hora dispara la alerta del ADR 0008 (**Supuesto (a validar):** depende del ADR 0008, D14; prioridad 2).

#### TC-GC-CA74-02 · Reembolso rechazado: advertencia de D7 y confirmación con la misma clave

- **CA:** CA-74, regla F-16, F-17 (D7, D12) · **Tipo:** integración · **Prioridad:** 1
- **Dado:** el estado final de TC-GC-CA74-01.
- **Cuando:** la tarea ejecuta el reembolso y el doble lo rechaza con `response_code` 16 (dato de prueba); `soporte-1` pide la vista previa de `confirm_reversal` y la ejecuta con **la misma K-74**, la referencia "ANUL-PORTAL-0015" (dato de prueba, obtenida de Transbank) y el motivo "Anulación gestionada en el portal de Transbank".
- **Entonces:**
  - `WEBPAY_REFUND.outcome = failed` con `response_code` 16; el intento sigue en `reversal_pending`.
  - Vista previa 2xx con los campos de EX-1, `refundOutcome = failed`, sin referencia propuesta y con la advertencia "Transbank no confirmó la devolución de este intento. Confirma el reverso solo con una referencia que obtuviste directamente de Transbank" (D7, solo con `failed`).
  - La ejecución con K-74 se evalúa de nuevo (los 409 no se guardaron, D12) y se acepta: `reversed`, `reversal_reference` "ANUL-PORTAL-0015"; la consola muestra "Reverso confirmado para el intento OC-2026-0015. Referencia de Transbank: ANUL-PORTAL-0015"; el propietario ve "Tu pago fue anulado en Transbank. El reembolso a tu medio de pago depende de tu banco"; saldo **$110.000**. Una fila de K-74 en `IDEMPOTENCY_KEY`.

#### TC-GC-CA74-03 · Reembolso exitoso como reversa: sin advertencia y referencia con formato

- **CA:** CA-74, regla F-16, F-17 (D7, S-82) · **Tipo:** integración · **Prioridad:** 1
- **Dado:** el estado final de TC-GC-CA74-01.
- **Cuando:** la tarea ejecuta el reembolso y el doble responde una reversa exitosa (`type` `REVERSED`), con el resultado guardado el 2026-11-26 a las 10:15:42 (hora de Chile; 13:15:42 UTC); `soporte-1` pide la vista previa de `confirm_reversal` y confirma con la referencia propuesta y un motivo.
- **Entonces:**
  - `refundOutcome = reversed`; vista previa 2xx **sin** la advertencia de D7 y con la referencia propuesta exacta `REVERSED OC-2026-0015 26-11-2026 10:15` (spec CA-74 y S-82: hora de Chile, 24 horas, sin segundos). Falla con "13:15" (UTC) o "10:16".
  - Con esa referencia y el motivo: `reversed`; saldo **$110.000**; el propietario ve "Tu pago fue anulado en Transbank. El reembolso a tu medio de pago depende de tu banco".
  - **Dato del doble:** con la autorización del 2026-11-25 y el reembolso del 2026-11-26, Transbank real respondería una anulación (fuera de las 3 horas), no una reversa; el doble no aplica esa regla y la corrida prueba solo el texto que fija la spec (hallazgo H-44).

### CA-75 · Retorno inválido de Webpay, Operaciones con una membresía ajena y revocación sin cortar otras sesiones (H-32, H-41, H-42; S-75, S-79, S-81, S-83; D18)

#### TC-GC-CA75-01 · Retorno inválido: 302 neutro a la pantalla genérica, sin id

- **CA:** CA-75, regla F-12 ("Retorno desde Webpay"), F-17 (S-75, S-83; P-59 abierta); ADR 0007, decisión 4 y prueba 5; arquitectura §5 ("Registro de eventos de seguridad") · **Tipo:** integración, aislamiento y e2e (Maestro) · **Prioridad:** 1
- **Dado:** `propietario-101` inició `OC-2026-0016` por $110.000 en la Comunidad A: `initiated`, `lock_active` verdadero, token guardado (dato del doble). La Comunidad B tiene su comercio `MC-B-1`.
- **Cuando:** llegan, sin sesión, por `GET` y por `POST`:
  - (a) `/gateway/webpay/communities/B/webpay-attempts/{id de OC-2026-0016}/return` con el `token_ws` correcto del intento;
  - (b) `/gateway/webpay/communities/A/webpay-attempts/{id de OC-2026-0016}/return` con un `token_ws` que no coincide;
  - (c) la ruta de A con un `attemptId` que no existe (UUID aleatorio) y un `token_ws` cualquiera;
  - (d) la ruta de A con un pago abortado (`TBK_TOKEN`, `TBK_ORDEN_COMPRA` y `TBK_ID_SESION`) cuyo `TBK_TOKEN` no coincide;
  - (e) la ruta de A con una expiración sin token cuyo `TBK_ORDEN_COMPRA` es `OC-2026-0015` (otro intento) o cuyo `TBK_ID_SESION` es el id de otro intento;
  - (f) la ruta de A sin `token_ws` ni parámetros `TBK_*` (combinación que no corresponde a ningún flujo de Transbank).
- **Entonces:**
  - Las doce respuestas (seis casos por dos métodos) son un 302 con el **mismo** `Location` byte a byte: el enlace de la pantalla genérica de la app, sin `attemptId`. La búsqueda literal del id de `OC-2026-0016`, de "OC-2026-0016", de "110000" y de "110.000" en el `Location` y en el cuerpo no encuentra nada.
  - La app (e2e) muestra en esa pantalla el texto canónico de F-17 (P-59; S-83) con el botón "Volver al inicio": el mismo texto en (a), (b) y (c), sin número de orden, monto, estado ni datos de la unidad, y no consulta ningún intento (cero peticiones a `webpay-attempts` en el registro de red de la prueba). La prueba busca en la pantalla "OC-2026-0016", "OC-", "$110.000", "$", "Depto 101" y los textos de estado de F-17 ("Tienes un pago en proceso", "En revisión por ComVive", "Pago cancelado…", "Pagado por ti"): ninguno aparece. Se repite con la sesión del pagador, con la de otro residente y sin sesión (GLB-09): el texto es el mismo. No es el 404 neutro "No encontramos lo que buscas o no tienes acceso".
  - Cero llamadas al doble (ni `MC-A-1` ni `MC-B-1`). Cero filas nuevas o cambiadas en **todas** las tablas, incluidas `AUDIT_LOG` y `WEBPAY_GATEWAY_CALL`: `OC-2026-0016` sigue en `initiated` con `lock_active` verdadero, sin `PAYMENT` ni movimiento; saldo **$110.000**.
  - Exactamente un evento `webpay_return.rejected` por petición en el registro de eventos de seguridad, con el motivo `attempt_not_found` en (a) y (c), `token_mismatch` en (b) y (d) y `expiration_mismatch` en (e). El evento no contiene IP, token, `TBK_ORDEN_COMPRA`, `TBK_ID_SESION`, cookies ni encabezados (búsqueda literal de los valores enviados). Motivo de (f): **Supuesto (a validar)**, la arquitectura no lo fija (hallazgo H-46).
  - Después, el retorno correcto por la ruta de A (token correcto) procesa el intento normalmente y responde 302 **con** el id del intento.

#### TC-GC-CA75-02 · Expiración del formulario: consulta previa a Transbank (D18)

- **CA:** CA-75, regla F-12 (D18; S-75); ADR 0007, decisión 4 (fila de expiración) y prueba 5; arquitectura §4 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** `OC-2026-0016` en `initiated` (TC-GC-CA75-01), iniciado el 2026-11-25.
- **Cuando:** llega a la ruta de retorno de la Comunidad A una expiración sin token, con `TBK_ORDEN_COMPRA` = `OC-2026-0016` y `TBK_ID_SESION` = id del intento. Una corrida por respuesta del doble a la consulta de estado:

  | Corrida | Doble (consulta de estado) | Estado final | Pago y saldo del ámbito `owner` | Texto de la app |
  | --- | --- | --- | --- | --- |
  | (1) | `INITIALIZED` | `abandoned`, `lock_active` falso | Ninguno; saldo **$110.000** | "Pago cancelado. No se hizo ningún cargo" |
  | (2) | `AUTHORIZED`, `amount` 110.000 (= monto iniciado), `transaction_date` 2026-11-25 | "Confirmar" y `confirmed` | Un `PAYMENT` `webpay` de $110.000, `paid_on` 2026-11-25, imputado al capital vencido: ordinario 100.000 − 100.000 = 0 y fondo 10.000 − 10.000 = 0; saldo 110.000 − 110.000 = **$0** | El pago, "Pagado por ti" |
  | (3) | `AUTHORIZED`, `amount` 11.000 (≠ 110.000) | "Confirmar" y `in_review` | Ninguno; saldo **$110.000** | "En revisión por ComVive" |
  | (4) | Sin respuesta (tiempo agotado) | `initiated`, `lock_active` verdadero | Ninguno; saldo $110.000 | "Tienes un pago en proceso" |
  | (5) | Error de la API de Transbank | Igual que (4) | Igual que (4) | Igual que (4) |
  | (6) | `FAILED` | Igual que (4): no pasa a `rejected` en el retorno (D18: "cualquier otro estado") | Igual que (4) | Igual que (4) |
  | (7) | `PENDING_X` | Igual que (4) | Igual que (4) | Igual que (4) |

  - En todas: **una sola** consulta de estado, con el token guardado de `OC-2026-0016`, el comercio `MC-A-1` y una fila en `WEBPAY_GATEWAY_CALL` con origen `return` (más la fila de "confirmar" en (2) y (3)); respuesta 302 **con** el id del intento (retorno válido).
  - En (4) a (7), la consulta de los 15 minutos resuelve después con la tabla de la decisión 6 (por ejemplo, con `INITIALIZED` pasa a `abandoned`; con `FAILED`, a `rejected` con `rejectionKind = transbank_rejected`).
  - (8) Una segunda expiración idéntica después de (1), con el intento ya en `abandoned`: no consulta a Transbank, no cambia nada y responde 302 con el id.
  - En (4) a (7), un pago nuevo del ámbito `owner` mientras el intento sigue en `initiated` responde 409 `PAYMENT_IN_PROGRESS` con "Ya hay un pago en proceso para esta deuda" (spec CA-75).
  - Riesgo de D18: la corrida (2) es la de una expiración falsificada durante un pago real; el cobro se registra y no se pierde.

#### TC-GC-CA75-03 · Operaciones ComVive con una membresía que no ve: 404

- **CA:** CA-75, "Validaciones de la consola de Operaciones ComVive" (S-79; H-41 resuelto); arquitectura §3, prueba 14; ADR 0006, decisión 1 · **Tipo:** integración, aislamiento y permisos · **Prioridad:** 1
- **Dado:** AD1 (Carolina Lagos) es administradora vigente de A y de B; AD2 (Valentina Ortiz) es administradora vigente de B (datos de CA-75 en `docs/qa/comunidades-simuladas.md`). Fixture aparte: una membresía `admin` de A ya revocada ("Admin revocado QA").
- **Cuando:** `operaciones-1` envía `POST /platform/communities/A/admin-memberships/{membershipId}/revoke` con el motivo "Revisión de accesos" y una clave nueva por petición, con `membershipId` = (a) la membresía `admin` de AD1 en **B**; (b) la membresía de residente de `propietario-101` en A; (c) la de comité de Rosa Díaz en A; (d) la de `conserje-A`; (e) un UUID inexistente; (f) la de (a) con un cuerpo JSON mal formado; (g) la de (a) sin motivo; (h) la membresía `admin` revocada de A.
- **Entonces:**
  - (a) a (g): 404 `NOT_FOUND` con "No encontramos lo que buscas o no tienes acceso", con el mismo cuerpo en todos (no 422, no 400, no `REASON_REQUIRED`, no `LAST_ADMIN`). Ninguna membresía, sesión ni suscripción cambia en A ni en B; ninguna fila en `IDEMPOTENCY_KEY`; exactamente un registro en `AUDIT_LOG` por petición, con la comunidad A (la de la ruta), `actor_type = platform` y el código `NOT_FOUND`.
  - No se toma el bloqueo de la fila de A ni de B: con la fila de B bloqueada por otra transacción abierta, la petición (a) responde en menos de 2 s (**Supuesto (a validar):** umbral propio, como ISO-GC-operaciones-3).
  - (h): 409 `ROLE_ALREADY_REVOKED` con "Este rol ya fue revocado" (la membresía `admin` revocada de la comunidad de la ruta sí es visible).

#### TC-GC-CA75-04 · Revocar en B no corta el trabajo en A

- **CA:** CA-75, "Otorgamiento de roles" (S-81; H-42 resuelto); ADR 0005, decisión 3; arquitectura §3, prueba 15, y §5 (suscripciones push) · **Tipo:** integración y aislamiento · **Prioridad:** 1
- **Dado:** los datos de TC-GC-CA75-03; AD1 tiene una sesión vigente S-AD1 (audiencia `community`) y, en el mismo dispositivo, dos filas de `PUSH_SUBSCRIPTION`: PS-A (membresía de A) y PS-B (membresía de B).
- **Cuando:** el 2026-11-10 `operaciones-1` revoca, por la ruta de B, la membresía `admin` de AD1 en B, con el motivo "Cambio de administración en B"; después AD1, con el mismo token de acceso, pide un recurso de B y uno de A, renueva el token y lista "Mis comunidades"; se emite una notificación de A y una de B a sus administradores.
- **Entonces:**
  - La revocación responde 2xx (B conserva a AD2: no hay `LAST_ADMIN`).
  - `SESSION` S-AD1 sin cambios (`revoked_at` nulo, mismo `expires_at`); la renovación del token funciona.
  - La primera petición a B después de la revocación responde 404 `NOT_FOUND`, sin esperar a que el token expire; la petición a A responde 2xx; "Mis comunidades" lista solo A.
  - En la misma transacción de la revocación se elimina PS-B; PS-A sigue igual. La notificación de A llega al dispositivo; la de B, no. La revocación y la eliminación de PS-B quedan en la auditoría de B.
  - Variantes con el mismo resultado (sesión intacta, 404 inmediato solo en lo de esa membresía, push de esa membresía eliminado): revocación del comité por la ruta de comunidad (TC-GC-CA43-06) y término de ocupación de un arrendatario que además reside en otra comunidad (dato de escenario).

## Aislamiento (CA-23, CA-42, CA-65 a CA-75 y regla 4 de `CLAUDE.md`)

Patrón de `docs/qa/plan-de-pruebas.md` §4, con las dos vías (guard y capa de datos). Después de cada caso se verifica en la base de datos que la Comunidad B, la unidad ajena o el ámbito ajeno no cambiaron (conteo y suma de movimientos, pagos, imputaciones, intentos y auditoría). Los nombres de acción son lógicos; las rutas son las de `docs/arquitectura.md` §3 y §4.

**Regla de respuesta (decisión del líder, M-4):** 404 `NOT_FOUND` si el actor no puede ver el recurso; 403 `FORBIDDEN` solo si lo ve pero su rol no permite la acción. Orden de validación fijo (spec, "Respuestas de error"; S-77; ADR 0003, decisión 9; H-34 resuelto): autenticación (401) → membresía o rol de plataforma, visibilidad del recurso de la ruta (404) y permiso (403) → forma (400 `BAD_REQUEST` y 422 `INVALID_AMOUNT` por un monto negativo, con decimales o de texto) → 404/403 que dependen de un dato del cuerpo → idempotencia (respuesta guardada, `IDEMPOTENCY_KEY_REUSED` o `IDEMPOTENCY_KEY_IN_PROGRESS`) → reglas de negocio, incluidos los 409 de estado. Todo 404 tiene el mismo cuerpo, exista o no el recurso.

### Entre comunidades

| ID | CA | Actor | Acción | Resultado esperado |
| --- | --- | --- | --- | --- |
| ISO-GC-cargos-leer-1 | CA-23 | `admin-A` | Leer los cargos de una unidad de B, por las dos vías | 404 en ambas, con el mismo cuerpo que un id inexistente |
| ISO-GC-pago-registrar-1 | CA-23 | `admin-A` | Registrar un pago de $10.000 en una unidad de B, por las dos vías (`unitId` de B en la ruta de A) | 404; B sin pagos, movimientos ni auditoría nuevos |
| ISO-GC-pago-registrar-2 | CA-32, F-9 | `admin-A` | Registrar un pago en el Depto 102 con `occupancyId` de una ocupación de otra unidad de A o de B | 404; nada escrito |
| ISO-GC-grupo-anular-1 | CA-23 | `admin-A` | `void-preview` y `void` de un grupo de pagos de B, por las dos vías | 404; los pagos de B siguen vigentes |
| ISO-GC-periodo-emitir-1 | CA-23 | `admin-A` | `issue-preview` e `issue` del borrador de B | 404; B sigue en borrador |
| ISO-GC-periodo-cerrar-1 | CA-23 | `admin-A` | Cerrar un periodo emitido de B | 404 |
| ISO-GC-gasto-escribir-1 | CA-23 | `admin-A` | Crear un gasto con `communityId` B en el cuerpo, en la ruta de A | 404; nada en B |
| ISO-GC-ajuste-crear-1 | CA-23 | `admin-A` | `correction-preview` y `corrections` de un gasto de B por la ruta de A (vía ISO-5) | 404; sin cambios en A ni en B |
| ISO-GC-ocupacion-1 | CA-56 | `admin-A` | Alta, término o venta con `unitId` u `occupancyId` de B | 404; ninguna ocupación ni membresía cambia en B |
| ISO-GC-roster-1 | CA-44 | `admin-A`, `comite-A` | Leer el registro de copropietarios y el historial de ocupaciones de B | 404 |
| ISO-GC-webpay-leer-1 | CA-42 | `admin-B` | Leer el intento `OC-2026-0002` de A por las dos vías; listar intentos | 404 en ambas vías; el listado de B no incluye intentos de A |
| ISO-GC-tareas-1 | CA-57 | `admin-A` | Leer o resolver una tarea `committee_member_not_owner` de B | 404; la tarea de B sigue abierta |
| ISO-GC-cargos-listar-1 | CA-23 | `admin-A`, `comite-A` | Listar cargos, pagos, avisos, intentos y tareas | Solo aparecen datos de A |
| ISO-GC-multi-1 | CA-23 | Administrador de A y B | Operar en el contexto de A | Solo ve y modifica A |
| ISO-GC-idempotencia-1 | A-3.4, S-36 | La misma persona, administradora de A y de B | Emitir en A y en B con la misma `Idempotency-Key` | Dos emisiones independientes; la respuesta de B no es la guardada para A. La clave es única por (persona, comunidad, endpoint, clave) (menor 10) |
| ISO-GC-webpay-ref-1 | F-2, CA-10 | Sistema | Confirmar en B un pago Webpay con el mismo `buy_order` (`external_ref`) que uno de A | Se crea el pago en B. La unicidad (`origin`, `external_ref`, ámbito) es por comunidad y solo para `origin` `webpay` e `import` |
| ISO-GC-webpay-ref-2 | F-2, CA-29, CA-31 | Sistema y `admin-A` | En A: (a) repetir una confirmación `webpay` con el mismo `buy_order` y ámbito; (b) un intento de dos ámbitos con un `buy_order`; (c) dos pagos `manual` con la misma referencia; (d) reimportar un pago `import` con el mismo `external_ref` y ámbito (prueba de base de datos sobre el índice parcial) | (a) un solo pago; (b) dos pagos, uno por ámbito; (c) dos pagos, la unicidad no aplica a `manual`; (d) un solo pago |
| ISO-GC-unidad-leer-1 | CA-23 | `propietario-101` | Leer cargos, saldo o aviso del Depto 102 | 404 |
| ISO-GC-unidad-pagar-1 | CA-23 | `propietario-101` | Iniciar Webpay en el Depto 102 | 404; no se crea intento ni bloqueo |
| ISO-GC-exresidente-1 | CA-21 | `ex-residente-A` | Leer o pagar cualquier recurso del módulo | 404 |
| ISO-GC-excomite-1 | CA-43 | Rosa Díaz tras la revocación del comité | Registro de copropietarios, deuda de otras unidades, reportes e intentos Webpay de la comunidad | 404; su Depto 201 como residente sigue en 2xx |
| ISO-GC-revocacion-1 | CA-75 (S-81; H-42) | Persona con membresía en A y en B (AD1) | Se revoca su membresía en B; sigue trabajando en A con la misma sesión (TC-GC-CA75-04) | `SESSION` sin cambios; B responde 404 desde la petición siguiente y A, 2xx; "Mis comunidades" solo con A; se eliminan solo las suscripciones push de la membresía de B; un push de A se envía y uno de B no |

### Por ámbito (propietario y arrendatario)

Lo que ve un residente se decide por el ámbito de cada movimiento, nunca por fechas (F-9; arquitectura §4, `visibleScopes`).

| ID | CA | Actor | Acción | Resultado esperado |
| --- | --- | --- | --- | --- |
| ISO-GC-ambito-1 | CA-22 | `arrendatario-102` (O-1) | Leer un cargo, movimiento, pago o saldo del ámbito `owner` del Depto 102 | 404; listas y saldos solo con el ámbito O-1; ninguna respuesta trae montos ni ids de `owner` |
| ISO-GC-ambito-2 | CA-37 | Arrendataria de O-2 (ingreso retroactivo) | Leer el cargo `owner` de `2026-11`, emitido después de su fecha de ingreso declarada | 404 |
| ISO-GC-ambito-3 | CA-29, CA-30, CA-32 | `arrendatario-102` | Leer el pago del otro ámbito de un grupo, el grupo de pagos o el detalle de un intento del propietario | 404; ninguna respuesta contiene el monto del ámbito `owner` ni el total del grupo |
| ISO-GC-ambito-4 | CA-30 | `arrendatario-102` | Iniciar Webpay sobre `owner`, o sobre `owner` y O-1 con O-1 bloqueado | 404 (no 409); no se crea intento ni bloqueo |
| ISO-GC-ambito-5 | CA-60 | `propietario-102` | Leer el detalle del intento del arrendatario; leer la deuda del arrendatario | Intento: 404. Deuda: 2xx sin RUT, teléfono ni correo del arrendatario, y un registro de auditoría por petición (S-44) |
| ISO-GC-ambito-6 | CA-53 | Arrendataria de O-4 (programada) | Cualquier recurso del Depto 102 antes de las 00:00 del 2026-12-05 | 404; desde esa hora, solo su ámbito |
| ISO-GC-ambito-7 | CA-35, CA-37, CA-56 | Ex arrendatario | Cualquier recurso de la unidad desde el registro del término, incluidos sus pagos e intentos | 404 |
| ISO-GC-ambito-8 | CA-35, CA-56 | `propietario-102` | Datos de una ocupación terminada (nombre, pagos de O-1, intentos) | 404; lo traspasado aparece en `owner` como "Traspaso desde arriendo terminado el {dd-mm-aaaa}", sin nombre |
| ISO-GC-ambito-9 | CA-47 | `arrendatario-102` | Descargar el aviso legal del Depto 102 | 404; el comprobante de cobro responde 2xx |
| ISO-GC-ambito-10 | CA-21, CA-57 | Ex propietario tras la venta | Leer o pagar en la unidad vendida | 404 |
| ISO-GC-ambito-11 | CA-30, CA-60 (S-74; H-31) | `arrendatario-102` y `propietario-102` | `GET .../units/{Depto 102}/webpay-attempts/current` mientras el otro tiene un intento en `initiated` sobre el ámbito O-1 | Lista vacía, byte a byte igual a la de una unidad sin intentos; quien inició recibe su intento con `attemptId`. Prueba de contrato: ninguna respuesta trae `startedByMe` ni datos de un intento ajeno |

### De plataforma (EX-1, CA-41, CA-42, CA-54 y CA-55)

Además de las pruebas de cada endpoint (arquitectura §3, pruebas de plataforma 1 a 13; ADR 0007, pruebas 5, 6, 11 y 12).

| ID | CA | Actor | Acción | Resultado esperado |
| --- | --- | --- | --- | --- |
| ISO-GC-plataforma-1 | CA-42 | `soporte-1` | Leer el detalle y el listado del intento `OC-2026-0002` en `in_review` | Solo los campos de EX-1 (prueba de contrato con lista cerrada): id, `buy_order`, comunidad (id y nombre), código de unidad, tipo de ámbito (`owner`), monto iniciado por ámbito ($110.000), monto autorizado ($11.000), estado y códigos de Transbank, fechas y plazo. Sin nombre, RUT, teléfono, correo, deuda ni saldo |
| ISO-GC-plataforma-2 | CA-42 | `soporte-1` | Pedir cargos, pagos, saldo o aviso del Depto 101, o la lista de residentes de A (rutas `/communities/...`) | 404 en todo; ningún dato; cada petición queda en auditoría |
| ISO-GC-plataforma-3 | CA-41, CA-55 | `soporte-1` | Listado, detalle, `resolution-preview` y `resolution` de intentos en `initiated`, `confirmed`, `rejected`, `abandoned`, `resolved_paid` y `reversed` | 404 en todo |
| ISO-GC-plataforma-4 | CA-41 | `soporte-1` | `resolution-preview` de `register_authorized` | Solo campos de EX-1 más `paymentToCreate` = {monto, tipo de ámbito, periodo}; sin deuda, cargos, imputación, saldos ni nombres |
| ISO-GC-plataforma-5 | CA-41, CA-54 | `soporte-1` | `register_authorized` con ocupación vigente y con ocupación terminada durante la revisión | Todas las filas insertadas (`PAYMENT`, `LEDGER_ENTRY`, `ALLOCATION`, `AUDIT_LOG`, `IDEMPOTENCY_KEY`) son de la comunidad, la unidad y el ámbito del intento; con la ocupación terminada, además el ámbito `owner` de esa misma unidad, y ningún otro |
| ISO-GC-plataforma-6 | CA-24, CA-41 | `admin-A`, `comite-A`, `propietario-101` | Cualquier ruta `/platform/...`, incluida la resolución del intento | 404 |
| ISO-GC-plataforma-7 | M-4 | `soporte-1` y `operaciones-1` | Una sesión de plataforma en cualquier ruta `/communities/...`; cada rol de plataforma en los endpoints del otro | 404 |
| ISO-GC-plataforma-8 | EX-1 | `soporte-1` | Petición después de revocar o vencer su `PLATFORM_ROLE_GRANT` | 404 en la petición siguiente. **Supuesto (a validar):** el mismo 404 que una membresía revocada |
| ISO-GC-plataforma-9 | EX-1 | Rol de base de datos `comvive_platform` | `SELECT` directo sobre tablas base (`PAYMENT`, `LEDGER_ENTRY`, `PERSON`) | Error de permisos de PostgreSQL; solo puede leer la vista `platform_webpay_review` |
| ISO-GC-plataforma-10 | CA-65, CA-68; ADR 0007, prueba 6 | Sistema y `soporte-1` | Con dos comercios en el doble (`MC-A-1` y `MC-B-1`), alternar operaciones de A y de B: inicio en B y luego en A; retorno de B y luego de A; una corrida de la consulta de 15 minutos con intentos de A y de B; `mark_for_reversal` (consulta y reembolso) y `resolve_without_charge` de un intento de A justo después de una operación de B. Con la rotación de A (`MC-A-1` vence el 2026-11-30, `MC-A-2` vigente desde el 2026-12-01), reembolsar el 2026-12-03 un intento de A iniciado el 2026-11-25 | Toda llamada del doble sobre un intento de A lleva `MC-A-1` y el secreto de A; nunca `MC-B-1`, y al revés. Tras la rotación, el intento iniciado con `MC-A-1` consulta y reembolsa con `MC-A-1` (`WEBPAY_ATTEMPT.merchant_id`), y los intentos nuevos usan `MC-A-2`. Ningún registro, evento de Sentry, fila de `WEBPAY_GATEWAY_CALL` ni respuesta contiene el secreto ni el token (búsqueda literal de los dos valores) |
| ISO-GC-plataforma-11 | CA-65; arquitectura §3, prueba 11 | `soporte-1` | `resolve_without_charge` de `OC-2026-0006` (A, `in_review`) con otro intento de A y uno de B también en `in_review`: (a) doble en `INITIALIZED`; (b) doble en `AUTHORIZED`; (c) camino de D13 sobre `OC-2026-0010`; (d) la petición agrega en el cuerpo un `communityId` de B | La consulta usa `MC-A-1` y el token de ese intento, y ninguna otra. (a) Solo cambia la fila del intento (estado, `resolution`, quién, cuándo) y se insertan `AUDIT_LOG` y `WEBPAY_GATEWAY_CALL` con `community_id` de A; el otro intento de A y todo B quedan iguales; cero `PAYMENT`, `LEDGER_ENTRY`, `ALLOCATION` y `WEBPAY_REFUND` en cualquier comunidad. (b) 422 y solo `AUDIT_LOG` y `WEBPAY_GATEWAY_CALL` de A. (c) Cero llamadas al doble y la misma cota de escritura. (d) La comunidad sale del registro del intento, nunca de la petición: **Supuesto (a validar):** 400 `BAD_REQUEST` porque el contrato no admite el campo; en ningún caso se escribe en B |
| ISO-GC-plataforma-12 | CA-68, CA-70, CA-71; arquitectura §3, pruebas 4 y 13 | `soporte-1` y la tarea del reembolso | `mark_for_reversal` de un intento de A en cada variante (`AUTHORIZED`, `PARTIALLY_NULLIFIED`, `NULLIFIED`, sin estado concluyente) y una corrida de la tarea de reembolsos con solicitudes de A y de B en la cola | Consulta y reembolso con el comercio y el token de cada intento. Filas insertadas o cambiadas solo de la comunidad del intento (`WEBPAY_ATTEMPT`, `WEBPAY_REFUND` si corresponde, `WEBPAY_GATEWAY_CALL`, `AUDIT_LOG`, `IDEMPOTENCY_KEY`); cero `PAYMENT`, `LEDGER_ENTRY` y `ALLOCATION`; B intacta. El monto pedido nunca supera lo autorizado de ese intento cuando hubo respuesta concluyente (PROP-GC-36) |

### Ruta de retorno de Transbank, sin membresía (arquitectura §2; ADR 0007, decisión 4 y prueba 5)

Es la única ruta de negocio sin sesión ni membresía (`GET` y `POST /gateway/webpay/communities/{communityId}/webpay-attempts/{attemptId}/return`). Su guard propio fija la comunidad de la ruta con actor `system`, busca el intento por comunidad y compara en tiempo constante el token o, en una expiración sin token, `TBK_ID_SESION` (id del intento) y `TBK_ORDEN_COMPRA` (`buy_order`) (ADR 0007, decisión 4). Un retorno inválido responde un 302 neutro sin id, no escribe en la base de datos y deja un evento en el registro de eventos de seguridad (S-75). En cada caso se verifica el registro del doble (llamadas a Transbank) y el conteo de filas de **todas** las tablas antes y después.

| ID | Origen | Actor | Acción | Resultado esperado |
| --- | --- | --- | --- | --- |
| ISO-GC-gateway-1 | ADR 0007, prueba 5; S-75, S-83 (H-32 resuelto) | Navegador sin sesión | `GET` y `POST .../communities/A/webpay-attempts/{id de un intento de B en initiated}/return` con el `token_ws` correcto de ese intento de B; y al revés, `.../communities/B/...` con un intento de A | 302 **neutro** a la pantalla genérica de la app, **sin id de intento**, idéntico (código y `Location`) al de un `attemptId` inexistente. Cero llamadas al doble (ni `MC-A-1` ni `MC-B-1`). Cero filas nuevas o cambiadas en todas las tablas, también `AUDIT_LOG` y `WEBPAY_GATEWAY_CALL`: el intento de B sigue en `initiated` con `lock_active` verdadero, sin `PAYMENT` ni `LEDGER_ENTRY`. Un evento `webpay_return.rejected` (`attempt_not_found`) en el registro de eventos de seguridad, sin token, IP ni parámetros `TBK_*`. La respuesta no trae montos, estado ni datos de la unidad; la app muestra el texto canónico de F-17 (P-59). Después, el retorno correcto por la ruta de B confirma el intento de B normalmente, con 302 con su id |
| ISO-GC-gateway-2 | ADR 0007, decisión 4 | Navegador sin sesión | Retorno de un intento A1 de A en `initiated` con (a) el token de otro intento A2 de A; (b) el token de un intento de B; (c) el token de A1 con un carácter cambiado; (d) un pago abortado con un `TBK_TOKEN` ajeno; (e) una expiración sin token (`TBK_ORDEN_COMPRA` y `TBK_ID_SESION`) | (a) a (d): el mismo 302 neutro sin id, cero llamadas al doble y cero filas; A1 sigue en `initiated` (en (d) no pasa a `abandoned`) y A2 no cambia; un evento `webpay_return.rejected` (`token_mismatch`) por petición. (e) Con `TBK_ID_SESION` = id de A1 y `TBK_ORDEN_COMPRA` = su `buy_order`: retorno válido; una consulta de estado con `MC-A-1` y el token de A1 (origen `return`) y el resultado de D18 (TC-GC-CA75-02); con cualquiera de los dos de A2 o de un intento de B: el 302 neutro, cero llamadas y `expiration_mismatch` (H-32 resuelto; D18). Prueba unitaria del guard: la comparación usa una función de tiempo constante y no corta en el primer carácter distinto |
| ISO-GC-gateway-4 | D18; ADR 0007, decisión 4 y prueba 5 | Navegador sin sesión | Expiración sin token por la ruta de **B** con `TBK_ID_SESION` y `TBK_ORDEN_COMPRA` correctos de un intento de A en `initiated`; y por la ruta de A con los de un intento de B | 302 neutro sin id; **cero** consultas de estado (ni con `MC-A-1` ni con `MC-B-1`); los dos intentos siguen en `initiated`; cero filas; un evento `attempt_not_found`. Una expiración nunca consulta con el comercio de otra comunidad |
| ISO-GC-gateway-3 | Arquitectura §2; ADR 0007, decisión 4 | Navegador sin sesión y con sesión ajena | (a) Retorno correcto de un intento de A (token correcto, el doble confirma `AUTHORIZED` por el monto iniciado), **sin** cookie ni `Authorization`; (b) el mismo retorno con la sesión de `admin-B` adjunta; (c) la app pide el detalle del intento por `/communities/A/units/{unidad}/webpay-attempts/{id}` sin sesión, con la sesión de `admin-B` y con la de quien lo inició; (d) `GET .../communities/A/webpay-attempts/{id}` sin `/return` en el módulo `webpay-gateway` | (a) `confirmed`, un `PAYMENT` por ámbito en A con auditoría `actor_type = system`, y 302 al enlace de la app solo con el id del intento. (b) Idéntico a (a): la sesión se ignora y no cambia la comunidad. (c) 401, 404 y 2xx. (d) 404 (**Supuesto (a validar):** el módulo no expone otras rutas) |

### De Operaciones ComVive (CA-69, CA-75; arquitectura §3, pruebas 12, 14 y 15)

| ID | CA | Actor | Acción | Resultado esperado |
| --- | --- | --- | --- | --- |
| ISO-GC-operaciones-1 | CA-69, CA-43 | `operaciones-1` | `POST /platform/communities/A/admin-memberships/{membresía admin de admin-B en B}/revoke` con motivo; y al revés, la ruta de B con la membresía de `admin-A` en A; además, la ruta de A con la membresía de comité de Rosa Díaz | 404 `NOT_FOUND`, con el mismo cuerpo que un `membershipId` inexistente o que una membresía de A que no es `admin` (comité, residente, conserje) (S-79; H-41 resuelto; detalle en TC-GC-CA75-03). Responde antes del 400 y de `REASON_REQUIRED`. No se toma el bloqueo de ninguna comunidad ni se evalúa `LAST_ADMIN` (la respuesta no revela cuántos administradores tiene B). Membresías, sesiones y suscripciones de B sin cambios; un registro en `AUDIT_LOG` con la comunidad de la ruta y el código `NOT_FOUND`; ninguna fila en `IDEMPOTENCY_KEY` |
| ISO-GC-operaciones-2 | CA-43 | `operaciones-1` | (a) Otorgar `admin` por la ruta de A con un `communityId` de B en el cuerpo; (b) otorgar `admin` de A a Felipe Rojas (`admin-B`); (c) otorgar `admin` de A con el RUT de una persona que solo existe en B y, en otra petición, con un RUT inexistente | (a) 404 y nada escrito en A ni en B (patrón ISO-3 del plan). (b) Una membresía `admin` nueva solo en A (`community_id` A, `granted_via = platform`); las membresías de B no cambian; la respuesta y la consola no muestran nombre ni datos de B. (c) Las dos respuestas son iguales en forma: no revelan que la persona existe ni en qué comunidad (ISO-7) |
| ISO-GC-operaciones-3 | CA-69 (S-68) | `operaciones-1` y `operaciones-2` | Carolina Lagos administra A (única) y B (con `admin-B`). (a) Revocarla en A; (b) revocarla en B; (c) con A con dos administradores, una revocación en A se detiene con una barrera **después** de tomar el bloqueo de la fila de A y, mientras tanto, se revoca o se otorga un administrador en B | (a) 409 `LAST_ADMIN`: los administradores de B no cuentan. (b) 2xx: queda `admin-B` en B y su membresía de A sigue vigente. (c) La operación en B termina sin esperar el bloqueo de A (dentro de 2 s, con la transacción de A aún abierta; **Supuesto (a validar):** umbral propio) y la de A termina después con su resultado normal. En (b), la revocación en B **no** revoca ninguna sesión (S-81; H-42 resuelto): con la misma sesión, la persona sigue con 2xx en A y recibe 404 en B; solo se eliminan sus suscripciones push de la membresía de B; su membresía y sus datos en A no cambian (ISO-GC-revocacion-1) |
| ISO-GC-operaciones-4 | CA-75 (S-79) | `operaciones-1` | Revocar por la ruta de B el `membershipId` de la membresía `admin` de `admin-A` en A, con cuerpo mal formado y, en otra petición, sin motivo | 404 en las dos, con el mismo cuerpo que un id inexistente, antes del 400 y de `REASON_REQUIRED`; nada cambia en A ni en B; un `AUDIT_LOG` por petición con la comunidad de la ruta (B) y `NOT_FOUND` |

## Permisos por rol (CA-24 y matriz de "Usuarios y permisos")

Una prueba por celda, con ID `PERM-GC-<rol>-<acción>`. Celdas: **2xx** permitido; **403** el actor ve el recurso pero su rol no permite la acción; **404** el actor no ve el recurso; **401** sin sesión; **302** redirección de la ruta de retorno de Transbank, que no usa sesión (nota (d)). En cada 403 y 404 se verifica que no hubo escritura y que el cuerpo es el neutro.

| Acción (recurso) | Admin | Comité | Propietario | Arrendatario | Conserje | Ex residente | Soporte | Operaciones | Sin sesión |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Configurar fondo, plazo, tasa, `sort_order` (`community.billing.configure`) | 2xx | 403 | 404 (a) | 404 (a) | 404 | 404 | 404 | 404 | 401 |
| Crear, editar o eliminar gasto o cargo directo del borrador (`expense.write`) | 2xx | 403 | 404 (a) | 404 (a) | 404 | 404 | 404 | 404 | 401 |
| Vista previa de emisión y emitir (`period.issue`) | 2xx | 403 | 404 (a) | 404 (a) | 404 | 404 | 404 | 404 | 401 |
| Cerrar periodo (`period.close`) | 2xx | 403 | 404 (a) | 404 (a) | 404 | 404 | 404 | 404 | 401 |
| Corregir o anular gasto (`adjustment.create`) | 2xx | 403 | 404 (a) | 404 (a) | 404 | 404 | 404 | 404 | 401 |
| Registrar, corregir o anular egreso del fondo (B-3) | 2xx | 403 | 404 (a) | 404 (a) | 404 | 404 | 404 | 404 | 401 |
| Registrar pago manual (`payment.register`) | 2xx | 403 | 403 su unidad; 404 ajena | 403 si solo asigna a su ámbito; 404 si incluye `owner` u otra unidad | 404 | 404 | 404 | 404 | 401 |
| Anular grupo de pagos manuales (`payment.void`) | 2xx | 403 | 403 grupo de su unidad (lo ve completo, F-12); 404 ajeno | 404 (no ve el grupo) | 404 | 404 | 404 | 404 | 401 |
| Alta, término, venta o cancelación de arriendo programado (`occupancy.write`) | 2xx | 403 (ve el historial) | 404 (b) | 404 (b) | 404 | 404 | 404 | 404 | 401 |
| Otorgar o revocar comité (`committee_role.grant`) | 2xx | 403 | 404 | 404 | 404 | 404 | 404 | 404 | 401 |
| Otorgar o revocar administrador por la ruta de comunidad | 403 | 403 | 404 | 404 | 404 | 404 | 404 | 404 | 401 |
| Otorgar o revocar administrador por `/platform/...` (`platform.admin_role.grant`) | 404 | 404 | 404 | 404 | 404 | 404 | 404 | 2xx (revocar al último administrador: 409 `LAST_ADMIN`, CA-69) | 401 |
| Leer o resolver tareas del administrador (`admin-tasks`, M-7) | 2xx | 404 | 404 | 404 | 404 | 404 | 404 | 404 | 401 |
| Leer cargos y saldos de cualquier unidad | 2xx + auditoría | 2xx + auditoría | 404 (ajena) | 404 (ajena) | 404 | 404 | 404 | 404 | 401 |
| Leer su ámbito `owner` (propietario) o su ámbito (arrendatario) | n/a | n/a | 2xx sin auditoría | 2xx sin auditoría | 404 | 404 | 404 | 404 | 401 |
| Leer el ámbito del arrendatario vigente de su unidad (S-44) | n/a | n/a | 2xx + auditoría | n/a | 404 | 404 | 404 | 404 | 401 |
| Leer el ámbito `owner` de la unidad que arrienda | n/a | n/a | n/a | 404 | 404 | 404 | 404 | 404 | 401 |
| Registro de copropietarios e historial de ocupaciones (`owner_roster.read`) | 2xx completo + auditoría | 2xx filtrado + auditoría | 404 | 404 | 404 | 404 | 404 | 404 | 401 |
| Intentos Webpay de la comunidad (`webpay_attempt.read`) | 2xx | 2xx + auditoría | 404 | 404 | 404 | 404 | 404 | 404 | 401 |
| Detalle de un intento por la ruta de la unidad | 404 (usa la ruta de comunidad) | 404 | 2xx si lo inició; 404 si no | 2xx si lo inició; 404 si no | 404 | 404 | 404 | 404 | 401 |
| Resolver un intento en revisión (`/platform/...`) | 404 | 404 | 404 | 404 | 404 | 404 | 2xx (c) | 404 | 401 |
| Leer resumen de gastos y saldo de caja (G-8) | 2xx | 2xx | 2xx | 2xx | 404 | 404 | 404 | 404 | 401 |
| Descargar aviso legal | 2xx | 2xx | 2xx (suyo) | 404 | 404 | 404 | 404 | 404 | 401 |
| Descargar comprobante de cobro del arrendatario (G-7) | 2xx | 2xx | 404 | 2xx (suyo) | 404 | 404 (ex arrendatario incluido) | 404 | 404 | 401 |
| Pagar por Webpay (`payment.pay_online`) | 403 | 403 | 2xx `owner`, ámbito del arrendatario vigente o ambos; 404 ajena | 2xx su ámbito; 404 `owner` | 404 | 404 | 404 | 404 | 401 |
| Retorno de Transbank (`GET` y `POST /gateway/webpay/communities/{communityId}/webpay-attempts/{attemptId}/return`) | 302 (d) | 302 (d) | 302 (d) | 302 (d) | 302 (d) | 302 (d) | 302 (d) | 302 (d) | **302 (d)** |

- **(a)** El residente no ve la configuración de cobro, el borrador, el recurso periodo ni el recurso gasto o egreso del fondo; solo su aviso o comprobante, sus movimientos y el resumen de gastos. Por eso recibe 404 y no 403 (spec, "Qué recursos ve cada rol", S-53; H-20 resuelto).
- **(b)** El historial de ocupaciones es `owner_roster.read`, que el residente no tiene.
- **(c)** Solo intentos en `in_review` o `reversal_pending`; en otro estado, 404 (ISO-GC-plataforma-3). `resolve_without_charge` sobre `reversal_pending` solo con `withoutChargeAvailable` verdadero (D13); si no, 409 (TC-GC-CA70-04).
- **(d) Ruta de retorno (fila "Sin sesión", B-2 de la revisión 4):** es la única celda de la columna "Sin sesión" que no responde 401. La ruta no usa sesión ni membresía: cualquier navegador, con o sin sesión y con la sesión de cualquier rol, recibe un 302. Con el intento de esa comunidad y su token, el resultado sale de Transbank y la redirección lleva solo el id del intento; con un intento de otra comunidad, un id inexistente o un token que no coincide, el mismo 302 neutro, sin llamar a Transbank ni escribir nada. La sesión adjunta nunca cambia el resultado (ISO-GC-gateway-1 a 3). Casos: `PERM-GC-sin-sesion-retorno` (302 y `confirmed` con el token correcto) y `PERM-GC-<rol>-retorno` (mismo resultado que sin sesión).
- **Comprobante del arrendatario (G-7, S-53):** lo descargan el arrendatario titular, el administrador y el comité; el propietario recibe 404 (ve los mismos datos en "Deuda del arrendatario") y el ex arrendatario también (S-14). Casos: TC-GC-CA47-03 y PERM-GC-propietario-comprobante (404), PERM-GC-admin-comprobante y PERM-GC-comite-comprobante (2xx).
- **Cambios respecto de la versión anterior (M-4):** el conserje recibe 404 en todo el módulo (antes 403); el propietario y el arrendatario reciben 404 en las acciones administrativas sobre recursos que no ven (antes 403); el arrendatario recibe 404 al descargar el aviso legal (antes 2xx); el administrador y el comité reciben 403 al pagar por Webpay, porque ven la unidad (antes era un supuesto).

### Orden de validación

| ID | Actor y acción | Resultado esperado | Por qué |
| --- | --- | --- | --- |
| PERM-GC-orden-1 | `comite-A` anula un grupo de pagos que existe y uno que no existe | 403 en el que existe; 404 en el que no | 403 solo si ve el recurso; un id inexistente no se ve |
| PERM-GC-orden-2 | `comite-A` emite un periodo ya emitido | 403, no 409 `PERIOD_ALREADY_ISSUED` | El permiso se valida antes que el estado |
| PERM-GC-orden-3 | `comite-A` registra un pago de $0 en el Depto 101 | 403, no 422 `INVALID_AMOUNT` | El permiso se valida antes que las reglas de negocio |
| PERM-GC-orden-4 | `arrendatario-102` inicia Webpay sobre `owner` mientras O-1 está bloqueado | 404, no 409 `PAYMENT_IN_PROGRESS` | La visibilidad se valida antes que el estado |
| PERM-GC-orden-5 | `comite-A` emite el borrador de B | 404, no 403 | Sin membresía en B no ve el recurso |
| PERM-GC-orden-6 | `admin-A` emite otra vez `2026-10` con otra clave | 409 `PERIOD_ALREADY_ISSUED` | Tiene el permiso; lo que falla es el estado |
| PERM-GC-orden-7 | `arrendatario-102` inicia Webpay sobre `owner` en una comunidad sin comercio vigente | 404, no 422 `ONLINE_PAYMENT_NOT_AVAILABLE` | La visibilidad del ámbito va antes que la disponibilidad (TC-GC-CA66-04) |
| PERM-GC-orden-8 | `comite-A` registra un pago con JSON mal formado | 403, no 400 `BAD_REQUEST` | El 400 va después del permiso (S-70; TC-GC-CB-33) |
| PERM-GC-orden-9 | `operaciones-1` revoca sin motivo al único administrador | 422 `REASON_REQUIRED`, no 409 `LAST_ADMIN` | Orden de la consola de Operaciones (S-63, CA-69) |
| PERM-GC-orden-10 | `admin-A` llama a `POST /platform/communities/A/admin-memberships/{id}/revoke` | 404, no 403 ni 409 | Una sesión de comunidad no ve rutas de plataforma |
| PERM-GC-orden-11 | `admin-A` emite `2026-10` ya emitido con JSON mal formado y otra clave | 400 `BAD_REQUEST`, no 409 `PERIOD_ALREADY_ISSUED` | La forma va antes que los 409 de estado (S-77; H-34) |
| PERM-GC-orden-12 | `admin-A` reenvía la clave de la emisión exitosa de `2026-10` con el mismo cuerpo; luego con otro cuerpo | Respuesta guardada; luego 422 `IDEMPOTENCY_KEY_REUSED`. Nunca 409 `PERIOD_ALREADY_ISSUED` | La idempotencia va antes de las reglas de negocio |
| PERM-GC-orden-13 | `admin-A` registra un pago con monto 100.000,5 o −100.000 con una clave que ya tiene un éxito guardado con otro cuerpo | 422 `INVALID_AMOUNT`, no `IDEMPOTENCY_KEY_REUSED` | `INVALID_AMOUNT` por forma va en el paso de forma (TC-GC-CA67-04 (e)) |
| PERM-GC-orden-14 | `admin-A` registra un pago con el `occupancyId` de una ocupación terminada de otra unidad, con una clave ya usada | 404, no `IDEMPOTENCY_KEY_REUSED` ni 409 `OCCUPANCY_ALREADY_ENDED` | 404 que depende del cuerpo, después de la forma y antes de la idempotencia |
| PERM-GC-orden-15 | `admin-A` otorga por la ruta de comunidad `role = admin` con una clave ya usada; en otra petición, con JSON mal formado | 403; con JSON mal formado, 400 (no se puede leer `role`) | 403 que depende del cuerpo, antes de la idempotencia |
| PERM-GC-orden-16 | `propietario-101` inicia Webpay en el Depto 101 con JSON mal formado mientras el ámbito `owner` está bloqueado; en el Depto 102, con JSON mal formado | 400, no 409 `PAYMENT_IN_PROGRESS`; en el Depto 102, 404 | ADR 0007, prueba 14 |
| PERM-GC-orden-17 | `soporte-1` envía `resolution` con JSON mal formado sobre un intento en `reversed` (fuera de la vista) | 404, no 400; un `AUDIT_LOG` con `NOT_FOUND` | La visibilidad del recurso de la ruta va antes que la forma |
| PERM-GC-orden-18 | `operaciones-1` revoca con JSON mal formado el `membershipId` de una membresía de B por la ruta de A | 404, no 400 ni `REASON_REQUIRED` | La membresía que Operaciones no ve es un 404 de la ruta (S-79; TC-GC-CA75-03) |

### Auditoría

- Cada escritura deja exactamente un registro de auditoría.
- Cada lectura de deudas de terceros o RUT completo por el administrador o el comité deja un registro por petición.
- La lectura del propietario sobre el ámbito del arrendatario deja un registro por petición (S-44; TC-GC-CA60-01). La consulta del residente sobre su propio ámbito no deja registro.
- Toda petición de Soporte ComVive y de Operaciones ComVive, lecturas y rechazos incluidos (400, 404, 409, 422 y 503), deja **exactamente un** registro con `actor_type = platform` y, en un rechazo, el código de la respuesta; si la auditoría falla, la petición falla (arquitectura §3; ADR 0006, decisión 8; D12). El registro del rechazo va en una transacción propia y no deja fila en `IDEMPOTENCY_KEY`.
- Un rechazo en una ruta `/communities/...` no escribe datos de negocio ni auditoría de escritura (D12). **Supuesto (a validar):** la spec solo exige auditar los rechazos de plataforma.
- Cada llamada a Transbank deja su fila en `WEBPAY_GATEWAY_CALL` con su origen, también si la resolución se rechaza; ninguna contiene el token, la clave del comercio ni `card_detail` (ADR 0007, decisión 9).
- La ruta de retorno con un intento ajeno, un id inexistente o parámetros que no coinciden no escribe en ninguna tabla (tampoco `AUDIT_LOG`) y deja un evento `webpay_return.rejected` en el registro de eventos de seguridad, fuera de la base de datos y sin datos personales (S-75; ISO-GC-gateway-1, 2 y 4; H-32 resuelto). El retorno válido, incluida la expiración verificada de D18, audita con `actor_type = system` y deja su consulta en `WEBPAY_GATEWAY_CALL` con origen `return`.
- La revocación de una membresía audita también la eliminación de sus suscripciones push y no cambia `SESSION` (S-81).
- La alerta a Operaciones por un administrador sin primer ingreso (S-72) y la revocación de un administrador quedan en auditoría (TC-GC-CA69-02 y 05).
- Otorgamientos y revocaciones de roles, alertas, tareas y decisiones de "Comité que deja de ser propietario", y avisos a pagadores sin membresía (`notification.sent_without_membership`) dejan su registro.

## Casos borde

### Prorrateo, redondeo y fondo

#### TC-GC-CB-01 · Gastos del mismo grupo se suman antes de repartir

- **Origen:** regla C-1 (borde propio) · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** Comunidad B, tres gastos ordinarios de $1 por partes iguales.
- **Resultado esperado:** total 3, 3 div 3 = 1 por casa. Falla si se reparte gasto por gasto (cada $1 iría a la Casa 1: $3, $0, $0). Fondo: (3 × 500 + 9.999) div 10.000 = 11.499 div 10.000 = $1, que va a la Casa 1 (empate de restos, `sort_order` 1).

#### TC-GC-CB-02 · Total menor que el número de unidades

- **Origen:** regla C-5 (borde propio) · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** repartir $2 por partes iguales entre las 3 casas.
- **Resultado esperado:** partes enteras 0, restos 2, 2, 2 (de 3); los 2 pesos van a la Casa 1 y la Casa 2. La Casa 3 queda en $0: sin cargo ni movimiento y con $0 en el aviso.

#### TC-GC-CB-03 · Un fondo por cada grupo ordinario

- **Origen:** regla D-3 (borde propio) · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** Comunidad A con (ordinario, alícuota) $1.000.000 y (ordinario, partes iguales {101, 102}) $10.001.
- **Resultado esperado:**
  - Partes iguales: 10.001 div 2 = 5.000 con resto 1 cada una; el peso va al 101: $5.001 y $5.000.
  - Fondo de ese grupo: (10.001 × 500 + 9.999) div 10.000 = 5.010.499 div 10.000 = $501 (exacto 500,05); 501 div 2 = 250 con resto 1; el peso va al 101: $251 y $250.
  - Fondo por alícuota: $50.000 como en CA-1. Total de fondo 50.000 + 501 = $50.501.
  - Totales: 101 210.000 + 5.001 + 251 = $215.252; 102 262.500 + 5.000 + 250 = $267.750; 201 $262.500; 202 $315.000. Suma $1.060.502 = 1.000.000 + 50.000 + 10.001 + 501.

#### TC-GC-CB-04 · Partes iguales con conjuntos distintos son grupos distintos

- **Origen:** definición de grupo (borde propio) · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** (ordinario, partes iguales {101, 102}) $1.001 y (ordinario, partes iguales {201, 202}) $1.001.
- **Resultado esperado:** dos grupos: 101 $501, 102 $500, 201 $501, 202 $500. Dos fondos de (1.001 × 500 + 9.999) div 10.000 = $51 cada uno: 101 $26, 102 $25, 201 $26, 202 $25.

#### TC-GC-CB-05 · Fondo de grupos muy pequeños

- **Origen:** regla D-3 (borde propio) · **Tipo:** unitaria · **Prioridad:** 2
- **Pasos:** calcular F con 500 pb para O = 1, 19, 20, 21, 200 y 201.
- **Resultado esperado:** $1, $1, $1, $2, $10 y $11. Ejemplo: O = 21 → (10.500 + 9.999) div 10.000 = 2 (exacto 1,05). Con O = 1 el fondo es el 100 % del gasto; la spec lo acepta (D-3, grupos pequeños) y lo deja en P-29 para el contador.

#### TC-GC-CB-06 · Porcentaje del fondo

- **Origen:** regla D-2 · **Tipo:** integración · **Prioridad:** 2
- **Pasos:** configurar 499, 500, 750, 5000 y 5001 pb; emitir CA-1 con 750 pb y, en otra corrida, con 5000 pb.
- **Resultado esperado:**
  - 499: 422 `RESERVE_RATE_BELOW_MINIMUM` con "El fondo de reserva no puede ser menor que 5,00 % (Ley 21.442, art. 39)"; la configuración no cambia.
  - 5001: 422 `RESERVE_RATE_ABOVE_MAXIMUM` con "El fondo de reserva no puede superar 50,00 %. Si el reglamento fija más, contacta a soporte"; la configuración no cambia.
  - 500, 750 y 5000 se aceptan. Con 750 pb, F = (1.000.000 × 750 + 9.999) div 10.000 = 750.009.999 div 10.000 = $75.000. Con 5000 pb, F = (1.000.000 × 5.000 + 9.999) div 10.000 = 5.000.009.999 div 10.000 = $500.000.

#### TC-GC-CB-07 · `sort_order` no consecutivo y orden natural

- **Origen:** reglas C-3 y C-4 · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** repartir $100.000 entre "Depto 10" (`sort_order` 20), "Depto 9" (`sort_order` 10) y "Depto 2" (`sort_order` 30), peso 1 cada uno. Por separado, crear unidades "Depto 9" y "Depto 10" sin `sort_order` y leer el valor propuesto.
- **Resultado esperado:** el peso extra va al "Depto 9" (`sort_order` 10): $33.334, y los otros $33.333. Valor propuesto: "Depto 9" antes que "Depto 10".

#### TC-GC-CB-08 · Grupo con total y sin pesos

- **Origen:** caso borde de la especificación, regla A-3.2 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** grupo (extraordinario, partes iguales {}) de $50.000 y emitir.
- **Resultado esperado:** bloqueo con "El grupo extraordinario / partes_iguales no tiene unidades con participación para repartir $50.000" y nada escrito. **Supuesto (a validar):** `<cuenta>` y `<base>` se muestran con su código interno; la especificación no dice si se traducen.

#### TC-GC-CB-09 · Comunidad sin unidades

- **Origen:** caso borde de la especificación · **Tipo:** integración · **Prioridad:** 2
- **Pasos:** pedir la vista previa de emisión y emitir en una comunidad sin unidades.
- **Resultado esperado:** ambas responden 422 `COMMUNITY_WITHOUT_UNITS` con "La comunidad no tiene unidades. Crea las unidades antes de emitir"; nada escrito.

#### TC-GC-CB-10 · Montos inválidos

- **Origen:** regla B-5 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** crear gastos, cargos directos y pagos con 0, −1, 100,5, `"1e3"`, `"100.000"` (texto) y `null`.
- **Resultado esperado:** todos rechazados sin escritura con 422 `INVALID_AMOUNT` y "El monto debe ser un número entero de pesos mayor que $0".
- **Monto máximo (B-6):** un gasto, un cargo directo o un pago de $9.999.999.999 se acepta; uno de $10.000.000.000 responde 422 `AMOUNT_TOO_LARGE` con "El monto supera el máximo permitido de $9.999.999.999". El monto individual se valida antes que la suma.
- **Tope de la suma del periodo (B-6, S-55; H-21 resuelto):** la suma es la de gastos y cargos directos del borrador, sin egresos del fondo ni recargo del fondo. Texto: 422 `AMOUNT_TOO_LARGE` con "La suma de los gastos del periodo superaría el máximo permitido de $9.999.999.999". Se prueba en sus tres momentos:
  - **Al escribir:** con un gasto de $9.999.999.999 en el borrador, crear un cargo directo de $1, o editar otro gasto de $1 a $2, responde ese 422 y no se escribe nada.
  - **En la vista previa de emisión** y **al emitir:** con un borrador cuya suma supera el tope (fixture cargado directo en la base, que simula dos escrituras concurrentes que pasaron cada una su validación), la vista previa y la emisión responden ese 422; el periodo sigue en borrador y no se crea nada.
  - **Lo que no cuenta:** con gastos ordinarios que suman exactamente $9.999.999.999, un egreso del fondo de $1 se acepta, y la emisión se hace aunque el recargo del fondo, (9.999.999.999 × 500 + 9.999) div 10.000 = $500.000.000, lleve el total emitido a 9.999.999.999 + 500.000.000 = $10.499.999.999.

#### TC-GC-CB-11 · Montos grandes sin pérdida de precisión

- **Origen:** regla 1 de `CLAUDE.md` (borde propio) · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** repartir T = 9.999.999.999 con `aliquot_e6` 999.999 y 1.
- **Resultado esperado:** productos 9.999.989.999.000.001 y 9.999.999.999 (el primero supera 2^53 − 1 = 9.007.199.254.740.991). Partes enteras 9.999.989.999 y 9.999; restos 1 y 999.999; el peso que falta va a la segunda unidad: $9.999.989.999 y $10.000. Suma 9.999.999.999. Falla si se usa `number` de JavaScript en el producto (H-11).

### Pagos, imputación y saldos

#### TC-GC-CB-12 · Orden completo de imputación

- **Origen:** regla F-5 (borde propio) · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones (dato de prueba):** el 2026-12-15, Depto 101 tiene pendiente: interés de `2026-11` $687 (vencido el 2026-12-11); `2026-10` ordinario $100.000 y fondo $10.000 (vencidos el 2026-11-11); `2026-11` ordinario $200.000, fondo $10.000, extraordinario $5.000 y multa $30.000 (vencidos el 2026-12-11).
- **Pasos:** registrar $320.000 con `paid_on` 2026-12-15 (registro el mismo día).
- **Resultado esperado:** intereses vencidos $687 (quedan 319.313); capital vencido `2026-10` ordinario $100.000 (219.313) y fondo $10.000 (209.313); `2026-11` ordinario $200.000 (9.313) y fondo $9.313 (0). Pendiente: fondo `2026-11` 10.000 − 9.313 = $687, extraordinario $5.000 y multa $30.000; saldo 687 + 5.000 + 30.000 = **$35.687**. La multa queda después de todo el capital vencido.

#### TC-GC-CB-13 · Fecha de referencia de "vencido"

- **Origen:** regla F-5 (borde propio) · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** Depto 101 debe una multa de `2026-10` de $30.000 (vencida el 2026-11-11) y el ordinario de `2026-11` de $200.000 (vence el 2026-12-11).
- **Pasos:** el 2026-12-15 registrar $30.000 con `paid_on` 2026-12-05.
- **Resultado esperado (regla F-5, S-39; mismo criterio que CA-50):** la fecha de referencia es máx(`paid_on`, creación del débito). Para la multa: máx(2026-12-05, 2026-11-01) = 2026-12-05, vencida (venció el 2026-11-11). Para el ordinario de `2026-11`: máx(2026-12-05, 2026-12-01) = 2026-12-05, no vencido (vence el 2026-12-11). Se imputan los $30.000 a la multa (paso 3) y el ordinario de `2026-11` queda intacto en $200.000. Falla si se evalúa al registrar (2026-12-15), que pagaría $30.000 del ordinario de `2026-11` como capital vencido.

#### TC-GC-CB-14 · Pago antes de la primera emisión

- **Origen:** caso borde de la especificación · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** Comunidad A recién configurada, borrador `2026-10`; Depto 101 paga $50.000 el 2026-10-20; emitir `2026-10` el 2026-11-01 como en CA-1.
- **Resultado esperado:** crédito en `2026-10` (borrador), saldo −$50.000. Al emitir se imputa al ordinario de `2026-10`: pendiente ordinario $150.000 y fondo $10.000, saldo **$160.000**.

#### TC-GC-CB-15 · Saldo a favor en un ámbito y deuda en otro

- **Origen:** caso borde de la especificación · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** escenario de CA-22, pero el arrendatario paga $300.000 en vez de $262.500; luego termina la ocupación O-1.
- **Resultado esperado:**
  - Antes del fin: O-1 deuda $0 y a favor 300.000 − 262.500 = $37.500; `owner` deuda $262.500 y a favor $0; no se compensan. En el aviso legal, "Total adeudado de la unidad" = suma de deudas brutas = 262.500 + 0 = **$262.500** (no el neto 262.500 − 37.500 = $225.000) y "Saldo a favor (no compensado)" = **$37.500** (F-9, CA-49).
  - Al terminar O-1: los $37.500 pasan a `owner` y se imputan al ordinario de `2026-10`: pendiente ordinario 250.000 − 37.500 = $212.500 y fondo $12.500; saldo **$225.000**, sin saldo a favor.

#### TC-GC-CB-16 · Cambio de arrendatario

- **Origen:** caso borde de la especificación · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** O-1 con `2026-11` impago ($262.500) termina el 2026-12-15; O-2 ingresa el 2026-12-16; emitir `2026-12` el 2027-01-01 con $262.500 para el Depto 102.
- **Resultado esperado:** los $262.500 de O-1 pasan a `owner` (auditoría); el cargo de `2026-12` va a `occupancy` O-2; O-2 ve solo $262.500 y saldo anterior $0; O-1 recibe 404. Con el flag activo, el interés del capital traspasado sigue la regla E-11 (ver TC-GC-CA26-05).

#### TC-GC-CB-17 · Pago manual con ámbito elegido por el administrador

- **Origen:** regla F-9, CA-32 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** estado de CA-22 después de emitir `2026-11` el 2026-12-01: `owner` con $262.500 de `2026-10` (vencido) y `occupancy` O-1 con $262.500 de `2026-11` (vence el 2026-12-11).
- **Pasos:** el administrador registra $262.500 el 2026-12-04 (a) sin `allocations`, (b) con una asignación sin `scope` y (c) en otra corrida, con una asignación a `occupancy` O-1.
- **Resultado esperado:**
  - (a) y (b): 422 `SCOPE_REQUIRED` con "Elige a qué deuda aplicar el pago". No se crea ningún `PAYMENT`, movimiento ni imputación, y los dos ámbitos siguen en $262.500. Ya no existe un ámbito por defecto.
  - (c): un `PAYMENT` `origin = manual` en `occupancy` O-1 que se imputa al ordinario ($250.000) y al fondo ($12.500) de `2026-11`; O-1 queda en $0 y `owner` sigue en $262.500 (nada se aplica a `2026-10`).
  - En una unidad **sin** arrendatario vigente (Depto 101), un registro sin `allocations` también responde 422 `SCOPE_REQUIRED`. La spec lo fija para toda petición sin asignaciones, con o sin arrendatario (F-9; H-29 resuelto).

#### TC-GC-CB-18 · Pago concurrente con la emisión

- **Origen:** regla A-4 (borde propio) · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** lanzar a la vez la emisión de `2026-10` y el registro de un pago de $100.000 del Depto 101.
- **Resultado esperado:** el pago queda en `2026-10` (si se registró antes de emitir) o en `2026-11` (si después), nunca en `2026-10` ya emitido; el saldo final es $110.000 en ambos casos.

#### TC-GC-CB-31 · El crédito de traspaso hereda el `paid_on` de su origen (S-54)

- **Origen:** reglas F-5, F-11 y F-13, S-54 (H-25) · **Tipo:** integración · **Prioridad:** 1
- **Dado (dato de prueba):** el escenario de CA-35 y CA-36, pero el ámbito `owner` del Depto 102 tiene además una multa de $30.000 (cargo directo de `2026-10`, vencida el 2026-11-11). Tras CA-35, el pago Webpay de $262.500 (`paid_on` 2026-12-05) se imputó en `owner` al capital vencido de `2026-10` (paso 2), antes que la multa (paso 3): `owner` = traspaso de `2026-11` $262.500 + multa $30.000 = **$292.500**.
- **Cuando:** el 2026-12-15 se corrige la electricidad de `2026-11` como en CA-36 y se liberan $2.625 en O-1, que pasan a `owner`.
- **Entonces:**
  - El crédito de traspaso lleva `paid_on` 2026-12-11 (el de la nota de crédito, F-11). Fecha de referencia 2026-12-11: el ordinario traspasado (vence el 2026-12-11) no está vencido; la multa (vence el 2026-11-11) sí.
  - Imputación: paso 3, multas vencidas: multa 30.000 − 2.625 = **$27.375**. El ordinario traspasado sigue en $250.000 y el fondo en $12.500.
  - `owner` = 292.500 − 2.625 = **$289.875** (27.375 + 250.000 + 12.500).
  - Falla si el traspaso usa la fecha del traspaso (2026-12-15): el ordinario traspasado estaría vencido, el paso 2 iría antes que la multa y quedaría ordinario $247.375 y multa $30.000 (mismo total, otra imputación).
- **Variante con el flag de intereses activo (fecha efectiva; dato de prueba):** CA-54 con el flag activo y tasas por defecto. La emisión de `2026-11` del 2026-12-01 creó en `owner` un interés de $1.639 (CA-26). El pago de $200.000 resuelto por Soporte el 2026-12-09 tiene `paid_on` 2026-12-05 y pasa a `owner` con ese `paid_on`: cubre primero el interés vencido ($1.639, paso 1) y luego el ordinario de `2026-10` con 200.000 − 1.639 = $198.361, con fecha efectiva máx(2026-12-05, 2026-11-11) = **2026-12-05**, no 2026-12-09. Esos $198.361 dejan de contar para el interés desde el cierre del 2026-12-05. Con el 2026-12-09 se cobrarían 4 días de más (2026-12-05 a 2026-12-08): piso(198.361 × 4 × 1.200 / 3.650.000) = piso(952.132.800 / 3.650.000) = piso(260,8583…) = $260 de intereses indebidos en la emisión siguiente.

### Intereses

#### TC-GC-CB-19 · Cambio de tasa del reglamento dentro de la ventana

- **Origen:** caso borde de la especificación · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** $110.000 vencido del 2026-11-12 al 2026-11-30; tasa 1200 pb hasta el 2026-11-19 y versión nueva de 600 pb desde el 2026-11-20.
- **Resultado esperado:** piso(110.000 × (8 × 1.200 + 11 × 600) / 3.650.000) = piso(110.000 × 16.200 / 3.650.000) = piso(1.782.000.000 / 3.650.000) = piso(488,2191…) = **$488**. La versión de 1200 pb sigue intacta.

#### TC-GC-CB-20 · Año bisiesto

- **Origen:** caso borde de la especificación · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** $100.000 a 1200 pb (a) en enero de 2028, 31 días; (b) del 2027-12-17 al 2028-01-15 (15 días de 2027 y 15 de 2028).
- **Resultado esperado:**
  - (a) piso(100.000 × 1.200 × 365 × 31 / (10.000 × 133.590)) = piso(1.357.800.000.000 / 1.335.900.000) = piso(1.016,3934…) = **$1.016** (con base 365 daría $1.019).
  - (b) piso(100.000 × 1.200 × (15 × 366 + 15 × 365) / 1.335.900.000) = piso(1.315.800.000.000 / 1.335.900.000) = piso(984,9539…) = **$984**.

#### TC-GC-CB-21 · Falta la tasa CMF

- **Origen:** regla E-7 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** Depto 101 con $110.000 vencido desde el 2026-11-12; sin tasa CMF desde el 2026-11-25. **Dato de prueba:** el Depto 101 paga `2026-11` antes de su vencimiento.
- **Pasos:** emitir el 2026-12-01; cargar la tasa CMF faltante; emitir el 2027-01-01.
- **Resultado esperado:** el 2026-12-01 se advierte "Falta la tasa de referencia CMF desde 25-11-2026. Se emitirá sin intereses y se cobrarán en la próxima emisión" (formato dd-mm-aaaa fijado en E-7), sin cargos de intereses, con auditoría. El 2027-01-01 la ventana va del 2026-11-12 al 2026-12-31 (50 días): piso(110.000 × 50 × 1.200 / 3.650.000) = piso(1.808,2191…) = **$1.808**.

#### TC-GC-CB-22 · Activación del flag después del vencimiento

- **Origen:** caso borde de la especificación, S-20 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** flag activado el 2026-11-20 (tasa vigente desde esa fecha); $110.000 vencido desde el 2026-11-12; emitir el 2026-12-01.
- **Resultado esperado:** ventana 2026-11-20 a 2026-11-30 (11 días): piso(110.000 × 11 × 1.200 / 3.650.000) = piso(397,8082…) = **$397**. Activar el flag sin tasa vigente se rechaza con "Configura la tasa de interés del reglamento antes de activar los intereses".

#### TC-GC-CB-23 · Interés menor a $1

- **Origen:** caso borde de la especificación · **Tipo:** integración · **Prioridad:** 2
- **Pasos (dato de prueba):** cargo directo ordinario de $150 vencido desde el 2026-11-12, impago; emitir el 2026-12-01 y el 2027-01-01.
- **Resultado esperado:** 2026-12-01: piso(150 × 19 × 1.200 / 3.650.000) = piso(0,9369…) = $0, sin cargo; días hasta el 2026-11-30 cobrados. 2027-01-01: piso(150 × 31 × 1.200 / 3.650.000) = piso(1,5287…) = **$1**. Falla si da piso(150 × 50 × 1.200 / 3.650.000) = $2 (días no consumidos).

#### TC-GC-CB-24 · Anulación con interés original $0

- **Origen:** regla E-10 (borde propio) · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** Depto 101 paga `2026-10` completo con cheque el 2026-11-05; emitir el 2026-12-01 (interés $0, sin cargo); el 2026-12-10 se anula el cheque.
- **Resultado esperado (regla E-10, tramos sin cargo original; mismo criterio que CA-52):**
  - Al emitir el 2026-12-01 el interés del ámbito `owner` es $0, no se crea cargo y la ventana avanza: último día cobrado 2026-11-30.
  - Al anular el cheque, el recálculo del tramo 2026-11-12 a 2026-11-30 da piso(210.000 × 19 × 1.200 / 3.650.000) = piso(4.788.000.000 / 3.650.000) = piso(1.311,7808…) = **$1.311**.
  - Se crea un cargo de intereses nuevo de $1.311, sin `adjusts_entry_id`, en el borrador vigente `2026-12`, ámbito `owner`, con referencia al tramo 2026-11-12 a 2026-11-30; vence con el aviso de `2026-12`.
  - Con `2026-11` emitido con los gastos de CA-1 ($210.000 para el Depto 101, impago), el saldo queda en 210.000 + 210.000 + 1.311 = **$421.311**.

#### TC-GC-CB-25 · Webpay que llega después del cierre

- **Origen:** caso borde de la especificación · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** como TC-GC-CA28-01, pero el crédito de $110.000 es una confirmación Webpay con `paid_on` 2026-11-20 que llega el 2026-12-03, con `2026-10` cerrado.
- **Resultado esperado:** crédito en `2026-12`; nota de crédito de intereses de −$398; saldo $210.289 (mismos cálculos de CA-28).

### Ciclo del periodo

#### TC-GC-CB-26 · Cierre de periodo

- **Origen:** regla A-5 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** cerrar `2026-10` en borrador; cerrarlo emitido; cerrarlo otra vez con otra clave; registrar después una reimputación con `recorded_at` posterior.
- **Resultado esperado:** cerrar un borrador responde 409 `PERIOD_NOT_ISSUED` con "Solo se puede cerrar un periodo emitido"; cerrar el emitido crea la foto de saldos por unidad, ámbito y cuenta, que cuadra con el libro a ese momento; el segundo cierre responde 409 `PERIOD_ALREADY_CLOSED` con "El periodo ya está cerrado"; la reimputación posterior no cambia la foto. Los montos de la foto están en TC-GC-CA48-01.

#### TC-GC-CB-27 · Fecha de emisión en hora de Chile

- **Origen:** regla A-3.3 (borde propio) · **Tipo:** integración · **Prioridad:** 2
- **Pasos:** emitir con el reloj en 2026-10-31 23:30 hora de Chile (2026-11-01 02:30 UTC).
- **Resultado esperado:** fecha de emisión 2026-10-31 y vencimiento 2026-11-10.

#### TC-GC-CB-28 · Vencimiento en día inhábil

- **Origen:** regla E-1, S-7 · **Tipo:** unitaria · **Prioridad:** 2
- **Pasos:** emitir el 2026-12-15.
- **Resultado esperado:** vencimiento 2026-12-25 (feriado), sin correrse.

#### TC-GC-CB-29 · Reclasificación de cuenta

- **Origen:** regla H-3 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** en `2026-10` emitido de la Comunidad A, reclasificar el gasto de aseo de $50.000 de (ordinario, alícuota) a (extraordinario, alícuota).
- **Resultado esperado:**
  - Origen: O = 950.000; F = (950.000 × 500 + 9.999) div 10.000 = $47.500. Ajustes ordinario −10.000, −12.500, −12.500, −15.000; fondo 9.500 − 10.000 = −500, 11.875 − 12.500 = −625, −625, 14.250 − 15.000 = −750.
  - Destino: no había grupo extraordinario, así que son cargos nuevos que apuntan al gasto: 10.000, 12.500, 12.500, 15.000 (sin fondo).
  - Efecto neto por unidad: 101 −10.000 − 500 + 10.000 = −$500; 102 −$625; 201 −$625; 202 −$750. Suma −$2.500 = −(50.000 × 5 %).
  - Solo cambiar la subcategoría no genera movimientos; queda una nota en el aviso del borrador vigente.

#### TC-GC-CB-30 · Unidad nueva después de emitir

- **Origen:** caso borde de la especificación · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** emitir `2026-10` de A; agregar una bodega con `aliquot_e6` 0; registrar la corrección de CA-13.
- **Resultado esperado:** las notas de crédito son las de TC-GC-CA13-01; la bodega no aparece en la corrección porque no está en la foto de `2026-10`.

### Webpay, idempotencia y errores (spec rev. 7)

#### TC-GC-CB-32 · Rechazos reevaluados con la misma clave y sin datos de negocio (decisión del líder D12)

- **Origen:** regla A-3.4 (D12), "Validaciones de la consola de Operaciones ComVive"; ADR 0003, decisión 6 · **Tipo:** integración · **Prioridad:** 1
- **Pasos y resultado esperado:** en cada fila, el primer envío con la clave K se rechaza y el reenvío con **la misma K** se vuelve a evaluar:

  | Operación | Primer envío con K | Reenvío con K | Resultado del reenvío |
  | --- | --- | --- | --- |
  | Emisión de `2026-10` (TC-GC-CA39-01) | 409 `PREVIEW_OUTDATED` con v1 | Con el `previewHash` de v2 | Se emite con GOLD-A39: 1.010.000 + 50.500 = **$1.060.500**, sin `IDEMPOTENCY_KEY_REUSED` |
  | Anulación del grupo G-1 (TC-GC-CA32-04 (a)) | 422 `REASON_REQUIRED` | Con motivo | Se anula: `owner` 162.500 + 100.000 = **$262.500** y O-1 100.000 + 162.500 = **$262.500** |
  | Pago manual (CA-67) | 422 `PAYMENT_REFERENCE_REQUIRED` | Con la referencia | Se registra; saldo **$215.000** (TC-GC-CA67-04) |
  | Cancelación de O-4 (TC-GC-CA61-01 (b)) | 422 `REASON_REQUIRED` | Con motivo | O-4 cancelada; `owner` sigue en $262.500 |
  | Tarea de comité (TC-GC-CA57-03) | 422 `REASON_REQUIRED` | Con `revoke_committee` y motivo | Tarea cerrada y comité revocado |
  | Resolución de Soporte (TC-GC-CA65-02) | 422 `REASON_REQUIRED` | Con motivo | `rejected` |
  | Revocación de administrador (TC-GC-CA69-02) | 409 `LAST_ADMIN` | Mismo cuerpo, después de otorgar a AD2 | Revocación aplicada |
  | Inicio de Webpay (TC-GC-CA66-03) | 503 `PAYMENT_GATEWAY_UNAVAILABLE` | Mismo cuerpo | Intento nuevo con otro `buy_order` |
  | Cualquiera de las anteriores sin cambiar el estado ni el cuerpo | El rechazo | Mismo cuerpo | El mismo rechazo, recalculado (no leído de la clave) |

  - Después de cada primer envío: cero filas de K en `IDEMPOTENCY_KEY` y cero filas nuevas o cambiadas en las tablas de negocio de "Nada escrito" (Convenciones), salvo el intento `abandoned` del 503. En las rutas `/platform/...`, exactamente un registro en `AUDIT_LOG` con el código del rechazo.
  - Después del reenvío aceptado: una fila de K; un tercer envío con K y el mismo cuerpo devuelve la respuesta guardada; con otro cuerpo, 422 `IDEMPOTENCY_KEY_REUSED` (TC-GC-CA31-03 sigue vigente: ahí K2 tenía un éxito guardado).

#### TC-GC-CB-33 · 400 `BAD_REQUEST` y campos con código propio (S-70)

- **Origen:** "Respuestas de error" (400; S-70; ADR-0003-S1) · **Tipo:** integración · **Prioridad:** 2
- **Pasos y resultado esperado:**
  - (a) `admin-A` registra un pago manual con un cuerpo JSON mal formado: 400 `BAD_REQUEST` con "No pudimos procesar la solicitud. Actualiza la aplicación e intenta de nuevo"; nada escrito; ninguna fila de la clave en `IDEMPOTENCY_KEY`. El reenvío con la misma clave y el cuerpo correcto se registra.
  - (b) Campos sin código propio con formato inválido: `paid_on` "2026-13-45" y medio de pago "bitcoin": 400 `BAD_REQUEST` (**Supuesto (a validar):** `paid_on` y el medio no están en la lista de campos con código propio de S-70).
  - (c) Campos con código propio, aunque falten, vengan vacíos o tengan otro tipo: monto "100.000" (texto) o 100,5, 422 `INVALID_AMOUNT`; referencia numérica, 422 `PAYMENT_REFERENCE_REQUIRED`; motivo ausente en una anulación, 422 `REASON_REQUIRED`; `allocations` nulo, 422 `SCOPE_REQUIRED`; RUT "12345678" sin dígito verificador al registrar una ocupación, 422 `INVALID_RUT`; `expectedTotalClp` "abc" al iniciar Webpay, 422 `INVALID_AMOUNT` (**Supuesto (a validar):** es un campo de monto, ADR-0003-S1).
  - (d) Orden: sin sesión, 401; `propietario-101` con JSON mal formado sobre el Depto 102, 404; `comite-A` con JSON mal formado al registrar un pago, 403 (PERM-GC-orden-8); `admin-A` con JSON mal formado al emitir `2026-10` ya emitido con otra clave, 400 y no 409 `PERIOD_ALREADY_ISSUED`; misma clave de la emisión exitosa con cuerpo distinto, 422 `IDEMPOTENCY_KEY_REUSED` y no 409; misma clave y mismo cuerpo, la respuesta guardada (S-77; ADR 0003, decisión 9; H-34 resuelto; PERM-GC-orden-11 a 18).
  - (d') Un 400 no se guarda con la clave (A-3.4): después de (a), la misma clave con cuerpo correcto se registra.
  - (d'') **Dos fallas en el paso de forma:** cuerpo JSON válido con `paid_on` "2026-13-45" y monto 100.000,5. **Supuesto (a validar):** 400 `BAD_REQUEST` (la spec pone los dos en el mismo paso y no fija cuál responde; hallazgo H-46).
  - (e) `soporte-1` con JSON mal formado en `resolution`: 400 y un registro en `AUDIT_LOG` con el código `BAD_REQUEST`.

#### TC-GC-CB-34 · Reembolso rechazado con 284 por superar los 90 días

- **Origen:** caso borde de la spec ("Intento marcado para reverso más de 90 días después de la venta"; menor 3 de la revisión 4; F-16; P-55 abierta, **Supuesto (a validar), S-84**) · **Tipo:** integración · **Prioridad:** 1
- **Dado (dato de prueba):** estado de CA-5; el 2026-11-25 a las 10:00 (hora de Chile) `propietario-101` inicia `OC-2026-0017` por $110.000 (`create` enviado a las 10:00:00, `tbk_queryable_until` 2026-12-02 10:00), el doble autoriza $11.000 y el intento pasa a `in_review` (`review_due_on` 2026-12-02); la alerta de plazo vencido del 2026-12-03 queda desatendida. Última respuesta guardada: `AUTHORIZED`, `amount` 11.000 (consulta diaria del 2026-12-02 a las 06:00, antes de `tbk_queryable_until`; hora de la tarea: dato de prueba).
- **Pasos:** el 2027-02-24 (día 91 desde la venta: 5 + 31 + 31 + 24 = 91) `soporte-1` marca el intento para reverso con motivo; el doble responde al reembolso con el código 284; la administración de la Comunidad A informa a Soporte que devolvió $11.000 al pagador por transferencia el 2027-03-02, con la referencia bancaria 88123401 (dato de prueba); `soporte-1` confirma el reverso con la referencia "TRANSFERENCIA 88123401 02-03-2027" y un motivo.
- **Resultado esperado:**
  - La vista previa no llama al doble: `transbankStatus` `AUTHORIZED`, `transbankStatusSource = last_stored`, "Se pedirá reembolso: sí, por $11.000" (total autorizado de la respuesta guardada).
  - La ejecución crea una `WEBPAY_REFUND` de $11.000 con `source_gateway_call_id` = la consulta guardada (no nulo). El reembolso queda `failed` con `response_code` 284; el intento sigue en `reversal_pending` con `reversalKind = refund_requested`; el propietario ve "Tu pago no se registró. Se solicitará la devolución del monto a Transbank".
  - `withoutChargeAvailable = false` y `resolve_without_charge` responde 409 `PREVIEW_OUTDATED` ("Esta resolución no corresponde…").
  - Entre el 284 y la confirmación (S-84): ComVive no agrega estados ni mueve dinero; el intento sigue en `reversal_pending` con `refundOutcome = failed` y `response_code` 284; el propietario conserva "Tu pago no se registró. Se solicitará la devolución del monto a Transbank". No hay una segunda `WEBPAY_REFUND` ni un reintento automático del reembolso (una sola llamada `refund` en el doble).
  - La vista previa de `confirm_reversal` responde 2xx (no 409 `REFUND_PENDING`: el resultado es `failed`), no propone referencia y muestra la advertencia "Transbank no confirmó la devolución de este intento. Confirma el reverso solo con una referencia que obtuviste directamente de Transbank" (D7). Con "TRANSFERENCIA 88123401 02-03-2027" y el motivo, `reversed`, con `reversal_reference` igual a esa cadena (formato `TRANSFERENCIA <referencia del banco> <dd-mm-aaaa>`, S-84; la fecha es la de la transferencia que informa la administración: **Supuesto (a validar)** de lectura, la spec dice solo `<dd-mm-aaaa>`); la consola muestra "Reverso confirmado para el intento OC-2026-0017. Referencia de Transbank: TRANSFERENCIA 88123401 02-03-2027" (texto vigente; S-84 lo declara inexacto en este caso, limitación conocida de P-55); el propietario ve "Tu pago fue anulado en Transbank. El reembolso a tu medio de pago depende de tu banco".
  - El formato `TRANSFERENCIA` lo arma Soporte: la API no lo valida ni lo propone (la consola no propone referencia con `failed`). La confirmación con la advertencia y sin referencia responde 422 `REVERSAL_REFERENCE_REQUIRED`.
  - Ningún `PAYMENT` ni movimiento en el libro del Depto 101; saldo **$110.000** antes y después (la transferencia de devolución sale de la cuenta de la comunidad y no se modela en el libro de la unidad, S-84). ComVive no bloquea por fecha antes de pedir el reembolso: el 284 lo decide Transbank (**Supuesto (a validar):** la spec no pide una validación previa de los 90 días).

#### TC-GC-CB-35 · Reenvío del inicio de Webpay mientras el primero espera a Transbank

- **Origen:** regla A-3.4 y F-12 (S-73, D16; H-40 resuelto); ADR 0003, decisiones 6 y 9; ADR 0007, decisión 3 · **Tipo:** integración · **Prioridad:** 2
- **Pasos:** `propietario-101` inicia un pago de $110.000 con la clave K-35 y el doble demora 5 segundos en responder a "crear"; durante la espera llega otro envío con K-35 y el mismo cuerpo; después del primero, otro envío con K-35.
- **Resultado esperado:** el envío durante la espera responde 409 `IDEMPOTENCY_KEY_IN_PROGRESS` con "Tu pago anterior aún se está procesando. Espera unos segundos e intenta de nuevo", sin intento nuevo ni segunda llamada a "crear". El envío posterior devuelve la respuesta original. Si el primero termina en 503, el envío posterior crea un intento nuevo (TC-GC-CA66-03). Código y texto de la tabla de errores de la spec, aprobados en D16. El envío durante la espera responde este 409 y no 409 `PAYMENT_IN_PROGRESS`, aunque el ámbito ya esté bloqueado por el primer envío: la idempotencia va antes de las reglas de negocio (S-77). Con JSON mal formado durante la espera, 400 (la forma va antes). En las demás escrituras, un envío paralelo con la misma clave espera y recibe la respuesta guardada, no este 409.

#### TC-GC-CB-36 · Confirmación Webpay que cruza la medianoche (flag activo)

- **Origen:** caso borde de la spec ("Confirmación Webpay que cruza la medianoche"); regla F-1 (rev. 5); ADR 0007, decisión 4 · **Tipo:** integración · **Prioridad:** 1
- **Dado:** estado de CA-5 (Depto 101, $110.000 vencidos el 2026-11-11) con el flag y las tasas por defecto; borrador vigente `2026-11`.
- **Pasos:** el 2026-11-30 a las 23:58 (hora de Chile) `propietario-101` inicia un pago de $110.000; el doble autoriza con `transaction_date` 2026-11-30 23:59:30 hora de Chile (2026-12-01 02:59:30 UTC); el retorno se procesa el 2026-12-01 a las 00:00:20; después se emite `2026-11` el 2026-12-01.
- **Resultado esperado:**
  - `paid_on` 2026-11-30 (fecha de autorización en hora de Chile), no 2026-12-01 (fecha del registro ni fecha UTC); `recorded_at` 2026-12-01 00:00:20.
  - Imputación al capital vencido: ordinario $100.000 y fondo $10.000, con fecha efectiva máx(2026-11-30, 2026-11-11) = 2026-11-30.
  - Interés de la emisión: mora del 2026-11-12 al 2026-11-29 (18 días; el 2026-11-30 ya no cuenta): piso(110.000 × 18 × 1.200 / 3.650.000) = piso(2.376.000.000 / 3.650.000) = piso(650,9589…) = **$650**. Falla si da $687 (19 días, `paid_on` 2026-12-01, como TC-GC-CA6-01).

## Propiedades (fast-check)

Generadores comunes, con los rangos vigentes de la spec rev. 7:

- Montos y totales como `bigint` de 0 a $9.999.999.999 (tope de B-6). Los montos sobre el tope se generan aparte, solo para PROP-GC-32.
- Pesos de 0 a 1.000.000 (`aliquot_e6`) o de 0 a 1.000 (partes iguales y pesos relativos), al menos uno mayor que 0; de 1 a 50 unidades con `sort_order` únicos y no consecutivos; permutaciones del orden de entrada. No se generan porcentajes que sumen 100.
- Porcentaje del fondo de 500 a 5000 pb (D-2). Antes llegaba a 10.000 pb.
- Fechas del 2026-01-01 al 2028-12-31 (incluye el año bisiesto 2028); tasas del reglamento de 0 a 3000 pb y CMF de 1000 a 6000 pb.
- Secuencias de operaciones (modelo): emisiones, pagos manuales de uno o dos ámbitos, pagos Webpay, anulaciones de grupos, notas de crédito, correcciones, ingresos y términos de ocupación, con `paid_on` ≤ fecha de registro.
- Webpay (spec rev. 7): respuestas del doble de Transbank (estado, `amount`, anulaciones previas que dejan `balance` entre $1 y `amount` − 1, sin respuesta, códigos de reembolso 0, 16, 284, 292, 310 y 311), con y sin respuesta concluyente pasados los 7 días; peticiones con y sin motivo, con claves repetidas y con cuerpos corregidos; intercalados concurrentes de resoluciones, otorgamientos y revocaciones de administradores en varias comunidades.
- Spec rev. 8: estados desconocidos de Transbank (cadenas aleatorias que no son estados conocidos) y `balance` ausente, $0, entre $1 y `amount` y mayor que `amount`; instantes de envío del `create` y de la petición en cualquier zona horaria del servidor, incluidos los cambios de horario de Chile; retornos con combinaciones de `token_ws`, `TBK_TOKEN`, `TBK_ORDEN_COMPRA` y `TBK_ID_SESION` propios, ajenos o ausentes; peticiones que fallan a la vez en varios pasos del orden de validación; personas con membresías en varias comunidades y varios dispositivos.

| ID | Propiedad | Expresión | CA |
| --- | --- | --- | --- |
| PROP-GC-01 | La suma de cargos iguala el total del grupo | Σ cargo_u = T | CA-1 a CA-4 |
| PROP-GC-02 | Nadie se aleja un peso o más de su exacto | `cargo_u × W − T × w_u` está en el intervalo (−W, W); además cargo_u ∈ {⌊T × w_u / W⌋, ⌊T × w_u / W⌋ + 1} | CA-3 |
| PROP-GC-03 | Cargos enteros no negativos y peso 0 da $0 | cargo_u ≥ 0; w_u = 0 ⇒ cargo_u = 0 y sin movimiento | CA-18 |
| PROP-GC-04 | Determinismo | dos ejecuciones con la misma entrada dan el mismo resultado | CA-51 |
| PROP-GC-05 | Invariancia al orden de entrada | cualquier permutación de las unidades da el mismo cargo por unidad | CA-3 |
| PROP-GC-06 | Desempate por `sort_order` | w_u = w_v y `sort_order`_u < `sort_order`_v ⇒ cargo_u ≥ cargo_v | CA-2, CA-3 |
| PROP-GC-07 | Invariancia a la escala de pesos | multiplicar todos los pesos por k ≥ 1 no cambia ningún cargo | CA-2 |
| PROP-GC-08 | Pesos extra acotados | T − Σ ⌊T × w_u / W⌋ < número de unidades con w_u > 0 | CA-3 |
| PROP-GC-09 | Fondo techo | O × pb ≤ F × 10.000 < O × pb + 10.000 | CA-4 |
| PROP-GC-10 | Redondeo por cuenta | cada grupo cuadra con su total; total de la unidad = Σ de sus cargos por cuenta; Σ de la emisión = Σ de los totales de grupo | CA-3 |
| PROP-GC-11 | Saldo desde el libro | para cualquier secuencia: saldo de la unidad = Σ débitos − Σ créditos = Σ saldos por ámbito | todos |
| PROP-GC-12 | Invariante S-18 | tras cualquier secuencia, ningún ámbito tiene a la vez deuda pendiente y saldo a favor | CA-9, CA-12 |
| PROP-GC-13 | Imputaciones acotadas | Σ imputaciones de un crédito ≤ su monto; Σ imputaciones a un cargo ≤ cargo − sus notas de crédito | CA-5 |
| PROP-GC-14 | Ajustes acumulados | tras cualquier secuencia de correcciones de un grupo, original + Σ ajustes = reparto correcto con la foto original | CA-14 |
| PROP-GC-15 | Interés acotado por el tope | interés ≤ piso(Σ capital_d × tope_d × k_d / (10.000 × 133.590)) e interés ≤ exacto | CA-7, CA-8 |
| PROP-GC-16 | Equivalencia en años de 365 días | si ningún día es de un año bisiesto, la fórmula general = piso(Σ capital_d × tasa_d / 3.650.000) | CA-6 |
| PROP-GC-17 | Inmutabilidad | cualquier secuencia de operaciones posteriores deja idénticos los movimientos de periodos emitidos o cerrados | CA-13, CA-48 |
| PROP-GC-18 | Idempotencia | repetir N veces una emisión, un registro manual con la misma clave o una confirmación Webpay deja el mismo estado que una vez | CA-25, CA-29, CA-31 |
| PROP-GC-19 | Aislamiento entre comunidades (basada en modelo) | cualquier secuencia de operaciones de actores de A no cambia ninguna fila de B | CA-23 |
| PROP-GC-20 | Reparto de un intento de varios ámbitos | Σ `WEBPAY_ATTEMPT_SCOPE` = monto del intento; al confirmar, Σ `PAYMENT` del grupo = monto confirmado y hay exactamente un pago por ámbito | CA-29 |
| PROP-GC-21 | Imputación dentro del ámbito | toda imputación une un crédito y un débito con la misma (unidad, `scope_key`); el remanente de un crédito queda a favor en su ámbito | CA-22, CA-29, CA-30 |
| PROP-GC-22 | Anulación de un grupo completo | anular un grupo crea un reverso por cada pago con ese `payment_group_id` y ninguno de otro grupo; sin otros eventos entre medio, registrar y anular deja el saldo de cada ámbito igual al previo | CA-32, CA-40 |
| PROP-GC-23 | Traspaso al terminar una ocupación | después del término y de cualquier movimiento posterior en esa ocupación, su saldo es $0 (deuda y a favor); saldo `owner` después = saldo `owner` antes + saldo de la ocupación antes; el saldo de la unidad no cambia por el traspaso | CA-35, CA-36, CA-37, CA-56 |
| PROP-GC-24 | Anular gasto | con monto correcto $0, cargo original + Σ ajustes = 0 en cada unidad para un grupo que queda vacío; Σ notas de crédito = −(total original + Σ ajustes previos), incluido el fondo recalculado | CA-33, CA-34 |
| PROP-GC-25 | "Vencido" no depende del registro | registrar el mismo pago con cualquier `recorded_at` ≥ `paid_on` da las mismas imputaciones | CA-50 |
| PROP-GC-26 | Orden total de imputación | con los mismos débitos (mismos ids), cualquier orden de inserción da las mismas imputaciones | CA-51 |
| PROP-GC-27 | Días hábiles | `review_due_on` es día hábil y entre la entrada a revisión y esa fecha hay exactamente 5 días hábiles; nunca sábado, domingo ni feriado de `PUBLIC_HOLIDAY` | CA-41, CA-59 |
| PROP-GC-28 | Vista previa y ejecución | sin cambios entre la vista previa y la ejecución, la ejecución escribe exactamente lo que mostró la vista previa; con un cambio que altera el resultado, 409 y ninguna fila nueva | CA-39, CA-40, CA-56 |
| PROP-GC-29 | Total del aviso legal | "Total adeudado de la unidad" = Σ deudas brutas por ámbito ≥ saldo neto de la unidad; "Saldo a favor (no compensado)" = Σ saldos a favor por ámbito | CA-49 |
| PROP-GC-30 | Saldo de caja | todo entero en [−9.999.999.999, 9.999.999.999] se acepta; fuera de ese rango, 422 `AMOUNT_TOO_LARGE` | CA-58 |
| PROP-GC-31 | Escritura de plataforma acotada (basada en modelo) | toda resolución de Soporte inserta filas solo de la comunidad y la unidad del intento, en sus ámbitos o, si la ocupación terminó, en el `owner` de esa unidad | CA-41, CA-54 |
| PROP-GC-33 | `paid_on` heredado en el traspaso | para cualquier secuencia con términos de ocupación, cada crédito de traspaso de saldo a favor tiene el `paid_on` de su crédito de origen (el del pago, o el de F-11 si es una nota de crédito), dividido por crédito de origen; sus imputaciones y fechas efectivas son las mismas que tendría el crédito de origen imputado en `owner` | CA-35, CA-36, CA-54, CB-31 |
| PROP-GC-34 | Correcciones sin efecto no escriben | una corrección de gasto o de egreso del fondo que no cambia el monto vigente (ni, en gastos, cuenta, base, conjunto o subcategoría) responde 422 `CORRECTION_WITHOUT_CHANGE` y no inserta filas; para cualquier secuencia de correcciones de un egreso, egreso original + Σ correcciones = último monto correcto, y saldo del fondo = recargos + intereses + multas imputados − egresos − correcciones | CA-33, CA-62 |
| PROP-GC-32 | Rangos de entrada | monto > $9.999.999.999, monto ≤ 0, fondo < 500 pb o > 5000 pb se rechazan con su 422 y sin escritura | CB-06, CB-10 |
| PROP-GC-35 | Los rechazos no escriben y la clave guarda solo éxitos (D12) | para cualquier secuencia de peticiones válidas e inválidas con claves repetidas: toda respuesta 4xx o 503 deja intactas las tablas de negocio (salvo el intento `abandoned` del 503 al iniciar) y no deja fila en `IDEMPOTENCY_KEY`; una clave tiene fila si y solo si su petición respondió 2xx; con fila, el mismo cuerpo devuelve la misma respuesta y otro cuerpo responde `IDEMPOTENCY_KEY_REUSED`; sin fila, la petición se evalúa como nueva | CA-66, CA-67, CA-69, CB-32 |
| PROP-GC-36 | Reembolso acotado (M-3) | con autorizado `A` y anulaciones previas que suman `N` < `A`: monto pedido = `A − N` (= `balance`) si `N` > 0 y `A` si `N` = 0; sin respuesta concluyente pasados los 7 días (un estado desconocido o un `balance` anómalo no cuentan como concluyentes, S-76), el monto iniciado; con respuesta concluyente, `N` + reembolso = `A`; a lo más una `WEBPAY_REFUND` por intento; ninguna resolución de reverso o sin cobro crea `PAYMENT`, `LEDGER_ENTRY` ni `ALLOCATION` | CA-41, CA-55, CA-68, CA-70, CA-71 |
| PROP-GC-37 | Máquina de estados de `WEBPAY_ATTEMPT` | para cualquier secuencia de retornos, consultas y resoluciones (también concurrentes): solo ocurren las transiciones de ADR 0007, decisión 5; `reversal_pending` → `rejected` solo con `WEBPAY_REFUND` `failed`, `response_code` 292 y `source_gateway_call_id` nulo; los estados finales no cambian; `lock_active` es verdadero si y solo si el intento está en `initiated`; solo `confirmed` y `resolved_paid` crean pagos; un retorno de expiración sin token lleva a `abandoned` solo si la consulta de estado respondió `INITIALIZED` (D18); `confirm_reversal` solo se aplica con `WEBPAY_REFUND` ausente o con `outcome` distinto de `pending` | CA-55, CA-65, CA-68, CA-70, CA-74, CA-75 |
| PROP-GC-38 | Texto del pagador determinado | `reversalKind` no es nulo si y solo si el estado es `reversal_pending` (`refund_requested` si y solo si existe `WEBPAY_REFUND`); `rejectionKind` no es nulo si y solo si el estado es `rejected` (`resolved_without_charge` si y solo si `resolution = resolve_without_charge`); cada combinación (estado, `reversalKind`, `rejectionKind`) tiene un solo texto de F-17 y ninguno termina en punto | CA-65, CA-68, CA-70, CA-72 |
| PROP-GC-39 | Siempre un administrador (basada en modelo, concurrente) | para cualquier intercalado de otorgamientos y revocaciones de `admin` en varias comunidades: toda comunidad que empezó con al menos un administrador vigente termina con al menos uno; un 409 `LAST_ADMIN` no cambia ninguna fila de negocio; las operaciones de una comunidad no cambian ni esperan el bloqueo de otra | CA-69 |
| PROP-GC-40 | Retorno de Transbank sin efecto ajeno | para cualquier (`communityId`, `attemptId`, parámetros de Transbank) que no verifique el guard (token, o `TBK_ID_SESION` y `TBK_ORDEN_COMPRA` en una expiración): cero llamadas a Transbank, cero filas escritas en cualquier tabla, exactamente un evento `webpay_return.rejected` sin datos personales y la misma respuesta 302, byte a byte, sin id de intento | ADR 0007, prueba 5; CA-75 |
| PROP-GC-41 | `current` solo con lo propio (S-74) | para cualquier conjunto de intentos en curso de varias personas sobre una unidad: `current` de la persona P = exactamente los intentos en `initiated` con `person_id` = P cuyos ámbitos están en sus `visibleScopes`; la respuesta de P no cambia si se agregan o quitan intentos de otras personas | CA-30, CA-60 |
| PROP-GC-42 | 7 días por instante (S-80) | para cualquier instante de envío `c` y de petición `t`, en cualquier zona horaria del servidor: `tbk_queryable_until` = `c` + 604.800 s (168 × 3.600); la API consulta a Transbank si y solo si `t` < `c` + 604.800 s | CA-73 |
| PROP-GC-43 | Respuesta inesperada sin reembolso (S-76) | dentro de los 7 días, con un estado desconocido o `PARTIALLY_NULLIFIED` con `balance` ausente, $0 o mayor que `amount`: 422 `TRANSBANK_STATUS_UNEXPECTED`, cero `WEBPAY_REFUND`, cero llamadas `refund` y el intento en `in_review`; con `balance` entre $1 y `amount`, reembolso = `balance` | CA-71, CA-73 |
| PROP-GC-44 | Revocación local (S-81) | para cualquier secuencia de revocaciones de membresías de una persona con membresías en varias comunidades: `SESSION` no cambia; cada comunidad responde 2xx o 404 según tenga o no una membresía vigente de la persona; las suscripciones push que quedan son exactamente las de sus membresías vigentes | CA-75 |
| PROP-GC-45 | Orden de validación (S-77) | para cualquier petición que falla en varios pasos (autenticación, ruta, forma, cuerpo, idempotencia, reglas): la respuesta es la del primer paso que falla | CA-67, CB-33, CB-35 |
| PROP-GC-46 | Reembolso en curso (S-78) | mientras `WEBPAY_REFUND.outcome = pending`, toda vista previa y ejecución de `confirm_reversal`, con cualquier cuerpo bien formado (con o sin referencia y motivo), responde 409 `REFUND_PENDING` y no escribe ninguna fila de negocio ni de `IDEMPOTENCY_KEY` | CA-74 |

Las semillas que encuentren un fallo se agregan como caso fijo de regresión (plan §7).

## Hallazgos para el analista

Contradicciones o vacíos de `docs/specs/gasto-comun.md` que impiden fijar un resultado sin un supuesto, o que conviene corregir. No se editó la especificación.

### Hallazgos anteriores (H-1 a H-19)

Resueltos en la spec rev. 3; los casos afectados ya no están bloqueados.

| Id | Resolución en la spec | Casos actualizados |
| --- | --- | --- |
| H-1 | F-5 y S-39: fecha de referencia máx(`paid_on`, creación del débito); CA-50 | TC-GC-CB-13 |
| H-2 | CA-8 y CA-20 con el texto vigente | TC-GC-CA8-01, TC-GC-CA20-01, 02 |
| H-3 | E-11: ventana de la ocupación para el capital traspasado | TC-GC-CA26-05, TC-GC-CB-16 |
| H-4 | E-6 y E-10: la ventana avanza y se crea un cargo nuevo sin `adjusts_entry_id`; CA-52 | TC-GC-CB-24 |
| H-5 | Tabla "Códigos y mensajes de error" | TC-GC-CA15-02, TC-GC-CB-06, 09, 10, 26 |
| H-6 | CA-48 | TC-GC-CA48-01 a 04, TC-GC-CB-26 |
| H-7 | F-5, orden total; CA-51 | TC-GC-CA51-01 |
| H-8 | F-9, total adeudado = suma de deudas brutas; CA-49 | TC-GC-CB-15, TC-GC-CA49-01 |
| H-9 | A-3.3, orden de la transacción | — |
| H-10 | C-6 y P-15 cerrada | — |
| H-11 | B-6 y `bigint` | TC-GC-CB-10, 11 |
| H-12 | G-7 y G-8; S-40 | Permisos; TC-GC-CA47-01 a 03 |
| H-13 | CA-11 con deuda inicial | TC-GC-CA11-01 |
| H-14 | 4 decimales truncados con "…" | Todos los cálculos de intereses |
| H-15 | E-7 en dd-mm-aaaa | TC-GC-CB-21 |
| H-16 | D-3, grupos pequeños; P-29 | TC-GC-CB-05 |
| H-17 | D-2, máximo 5000 pb; P-28 | TC-GC-CB-06 |
| H-18 | A-3.4 y S-36 | ISO-GC-idempotencia-1 |
| H-19 | Criterios de aceptación: Depto 102 sin arrendatario en CA-1 a CA-21 | Datos comunes |

### Hallazgos H-20 a H-29

Resueltos en la spec rev. 4 (resumen "Hallazgos de QA H-20 a H-27 y H-29") y, H-28, en `docs/arquitectura.md` §5.

| Id | Resolución | Casos actualizados |
| --- | --- | --- |
| H-20 | Sección "Qué recursos ve cada rol" (S-53): el residente no ve configuración, borrador, periodo ni gasto (404); el comprobante del arrendatario lo descargan él, el administrador y el comité, no el propietario | Tabla de permisos; TC-GC-CA47-03 |
| H-21 | B-6 y S-55: la suma de gastos y cargos directos se valida al escribir, en la vista previa y al emitir, con "La suma de los gastos del periodo superaría el máximo permitido de $9.999.999.999" | TC-GC-CB-10 |
| H-22 | CA-39: con el flag apagado, un pago que deja saldo a favor imputable al emitir sí produce 409 (ejemplo $10.000 al Depto 101) | TC-GC-CA39-04, 05 |
| H-23 | F-16 y F-17: `<monto>` es el monto iniciado | TC-GC-CA41-01 |
| H-24 | CA-44: el propietario del Depto 102 tiene RUT 12.345.670-K | TC-GC-CA44-01; comunidades simuladas |
| H-25 | F-13 y S-54: el crédito de traspaso hereda el `paid_on` del crédito que generó el saldo a favor; CA-36 dice "no vencido", con los mismos montos | TC-GC-CA36-01, TC-GC-CB-31, PROP-GC-33 |
| H-26 | CA-33 y CA-34 fijan el estado de los Deptos 102 y 201 y de la Casa 3 | TC-GC-CA33-02, TC-GC-CA34-02; GOLD-A33, GOLD-B34 |
| H-27 | F-13 y F-17: los rótulos de traspaso usan la fecha de registro del término ("…el 05-12-2026" en CA-35) | TC-GC-CA35-03, TC-GC-CA36-01 |
| H-28 | `docs/arquitectura.md` §5 audita cada lectura del propietario sobre el ámbito del arrendatario (`owner.tenant_scope.read`); la parte legal sigue en P-34 | TC-GC-CA60-01 |
| H-29 | F-9: `SCOPE_REQUIRED` para toda petición sin asignaciones, con o sin arrendatario | TC-GC-CB-17 |

### Hallazgos H-30 a H-42

Resueltos en la spec rev. 8 (bloque "Revisión 8" del registro de cambios, resoluciones del coordinador del 2026-11-07 y decisiones del líder D17 y D18) y en los ADR 0002, 0003, 0005, 0006, 0007 y `docs/arquitectura.md`. Las resoluciones que siguen como supuesto quedan marcadas **Supuesto (a validar)** en la spec.

| Id | Resolución | Casos actualizados |
| --- | --- | --- |
| H-30 | Ya en la spec rev. 7: la huella de plataforma incluye `transbankStatus`, `transbankStatusSource` y `withoutChargeAvailable` en `resolve_without_charge` y `refundOutcome` en `confirm_reversal` (A-7, "Huella de plataforma"; F-16; ADR 0006, decisión 6) | TC-GC-CA65-04 (d), TC-GC-CA55-02, TC-GC-CA70-06 |
| H-31 | `current` devuelve solo los intentos que inició quien consulta; `startedByMe` sale del contrato; el propietario tampoco ve el intento del arrendatario (F-12, F-17, S-74, S-44; CA-30; ADR 0007, decisión 10; arquitectura §4) | TC-GC-CA30-01, TC-GC-CA60-02, ISO-GC-ambito-11, PROP-GC-41 |
| H-32 | (a) Retorno inválido: 302 neutro a la pantalla genérica, sin id, igual para toda causa; el válido lleva el id. (b) Sin escritura en la base de datos (tampoco `AUDIT_LOG`) y un evento en el registro de eventos de seguridad. (c) Expiración sin token: el guard verifica `TBK_ID_SESION` y `TBK_ORDEN_COMPRA` y consulta el estado antes de cancelar (D18). F-12, F-17, S-75, S-83 (texto de la pantalla, P-59 abierta), CA-75; ADR 0007, decisión 4; arquitectura §2, §4 y §5. S-75, CA-75, el caso borde de la expiración y el ítem 23 de "Preguntas cerradas" ya reflejan D18. Queda abierto H-46 (motivo del evento) | ISO-GC-gateway-1, 2 y 4, TC-GC-CA75-01 y 02, PROP-GC-40 |
| H-33 | 422 `TRANSBANK_STATUS_UNEXPECTED` dentro de los 7 días, en la vista previa y en la ejecución; pasados los 7 días esas respuestas no cuentan como concluyentes (F-16, S-66, S-76, D17; CA-73; ADR 0007, decisión 8) | TC-GC-CA68-04 (e), TC-GC-CA71-03, TC-GC-CA73-01 a 03, PROP-GC-43 |
| H-34 | Orden: autenticación → 404/403 de la ruta → forma (400 e `INVALID_AMOUNT`) → 404/403 del cuerpo → idempotencia → reglas de negocio, incluidos los 409 de estado ("Respuestas de error", S-70, S-77; ADR 0002, decisión 4; ADR 0003, decisión 9). Queda abierto H-46 (dos fallas en el mismo paso de forma) | TC-GC-CB-33, TC-GC-CB-35, TC-GC-CA67-01 y 04, PERM-GC-orden-11 a 18, regla de respuesta de "Aislamiento", PROP-GC-45 |
| H-35 | 409 `REFUND_PENDING` en la vista previa y en la ejecución con el reembolso en `pending`; la advertencia de D7 solo con `failed` (F-16, F-17, S-78, D17; CA-74; ADR 0006 y 0007) | TC-GC-CA55-02, TC-GC-CA70-06, TC-GC-CA74-01 a 03, PROP-GC-46 |
| H-36 | {estado} sin estado concluyente = "sin respuesta de Transbank"; referencia `REVERSED <buy_order> <dd-mm-aaaa hh:mm>` en hora de Chile, 24 horas, sin segundos (F-16, F-17, S-82; CA-68). Queda abierto en H-45 si los segundos se truncan | TC-GC-CA65-03, TC-GC-CA65-06 (a), TC-GC-CA68-02 (c), TC-GC-CA55-02 (2), TC-GC-CA74-03 |
| H-37 | 168 horas por instante desde el envío del `create`, guardadas en `tbk_queryable_until` ("Definiciones", S-80; ADR 0007, decisión 7, ADR-0007-S15; arquitectura §4). Los textos de F-16 ya cuentan desde el envío del `create` | "Plazos de Transbank" (Convenciones), TC-GC-CA65-06, TC-GC-CA73-03, TC-GC-CB-34, PROP-GC-42 |
| H-38 | ADR 0006, "Supuestos", ya describe el bloqueo de la fila de la comunidad (S-68) | TC-GC-CA69-03 (sin cambios) |
| H-39 | "Se pedirá reembolso: no", sin texto adicional; el wireframe CON-06 se alineó (EX-1, F-16) | TC-GC-CA68-01 |
| H-40 | Ya en la spec rev. 7: 409 `IDEMPOTENCY_KEY_IN_PROGRESS` en la tabla de errores, solo para el inicio de Webpay, texto aprobado en D16 (A-3.4, F-12, S-73) | TC-GC-CB-35 |
| H-41 | 404 `NOT_FOUND` para un `membershipId` de otra comunidad, que no es `admin` o inexistente, antes del 400 y de las reglas, sin tomar bloqueos ("Validaciones de la consola de Operaciones ComVive", S-79; CA-75; ADR 0006, decisión 1; arquitectura §3, prueba 14) | ISO-GC-operaciones-1 y 4, TC-GC-CA75-03, PERM-GC-orden-18 |
| H-42 | La revocación no toca sesiones: la comunidad revocada responde 404 desde la petición siguiente y se eliminan las suscripciones push de esa membresía ("Otorgamiento de roles", S-81; CA-75; ADR 0002, ADR 0005, decisión 3; arquitectura §3, prueba 15, y §5) | ISO-GC-operaciones-3, ISO-GC-revocacion-1, TC-GC-CA43-06, TC-GC-CA69-02, TC-GC-CA75-04, PROP-GC-44 |

### Hallazgos H-43 a H-46 (spec rev. 8)

Abiertos. QA no los resuelve: cada caso afectado usa el resultado o el **Supuesto (a validar)** indicado hasta que el responsable decida.

| Id | Contradicción o vacío | Pregunta concreta | Responsable | Casos afectados |
| --- | --- | --- | --- | --- |
| H-43 | La última línea de CA-73 dice que, pasadas las 168 horas, se pediría el reembolso por el monto iniciado de $110.000 "si no hubo otra concluyente". En el mismo escenario el intento entró a revisión porque "confirmar" respondió `AUTHORIZED` por $11.000, y ADR 0007 (prueba 8) dice que, con una respuesta inesperada guardada y una `AUTHORIZED` anterior, se reembolsa el total autorizado de esa `AUTHORIZED`. Pedir $110.000 sobre un cobro de $11.000 lo rechazaría Transbank (311) | ¿La respuesta de "confirmar" que llevó el intento a revisión cuenta como "respuesta guardada concluyente"? Si es así, ¿se ajusta CA-73 para decir que en su escenario el reembolso sería de $11.000 (o $6.000 si la última concluyente fue el `PARTIALLY_NULLIFIED` con `balance` 6.000)? QA espera $11.000 | Analista, con el arquitecto | TC-GC-CA73-03 (b1) a (b3) |
| H-44 | CA-74 dice que el reembolso pedido el 2026-11-26 de un pago autorizado el 2026-11-25 podría terminar como reversa (`REVERSED`) a las 10:15. Según F-16 y ADR 0007, una reversa solo ocurre dentro de 3 horas desde la autorización; después Transbank anula (`NULLIFIED`), como ya fija TC-GC-CA41-04 (b). El escenario no puede ocurrir con Transbank real | ¿Se cambia el ejemplo de CA-74 a una anulación (con su código de autorización), o se mueve la reversa a un escenario donde el marcado y el reembolso ocurren dentro de las 3 horas? QA prueba el formato con el doble, que no aplica la regla | Analista | TC-GC-CA74-03, TC-GC-CA55-02 (2) |
| H-45 | Textos menores de la spec rev. 8: (a) "Huella de plataforma" (A-7) aún describe un 409 "si llega el resultado del reembolso entre la vista previa y la ejecución" de `confirm_reversal`, que desde la rev. 8 no ocurre (con `pending` responde `REFUND_PENDING`); (b) S-76 y S-78 dicen "El texto queda en P-58", que D17 ya cerró; (c) S-82 dice "sin segundos" y no si se truncan o se redondean. (La mención "desde la creación de la transacción" en F-16 ya se corrigió durante esta pasada; el texto inexacto "Referencia de Transbank: TRANSFERENCIA …" de S-84 está declarado como limitación conocida de P-55) | (a) y (b): ¿se alinean los textos? (c) ¿Se truncan los segundos? QA supone que sí | Analista | TC-GC-CA65-03, TC-GC-CA68-02 (c), TC-GC-CA74-03, TC-GC-CA55-02 (2) |
| H-46 | (a) El registro de eventos de seguridad define tres motivos (`attempt_not_found`, `token_mismatch`, `expiration_mismatch`), pero un retorno con parámetros que no corresponden a ningún flujo de Transbank (sin `token_ws` ni `TBK_*`) también es inválido y no tiene motivo. (b) El paso de forma incluye el 400 y el 422 `INVALID_AMOUNT`; si un cuerpo válido trae a la vez un campo sin código propio con formato inválido y un monto con decimales, no se fija cuál responde | (a) ¿Qué motivo lleva ese evento? (b) ¿400 o `INVALID_AMOUNT`? QA supone 400 | Arquitecto (a); analista y arquitecto (b) | TC-GC-CA75-01 (f), TC-GC-CB-33 (d'') |
