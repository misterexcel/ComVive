# Plan de pruebas

Estado: **Para revisión del líder del proyecto**
Responsable: ingeniero-qa
Aprobación: líder del proyecto

Define cómo se prueba ComVive, qué se prueba primero y qué debe cumplirse para cerrar cada etapa. Se prioriza por riesgo: dinero, aislamiento de datos y permisos van primero.

## 1. Pirámide de pruebas

| Nivel | Qué cubre | Herramienta | Dónde corre |
| --- | --- | --- | --- |
| Unitarias | Reglas de negocio puras: prorrateo, redondeo, cálculo de saldos desde el libro de movimientos, validación de RUT | Vitest | `packages/shared`, `apps/api` |
| Propiedades | Invariantes que deben cumplirse con cualquier dato de entrada (ver sección 3.3) | fast-check sobre Vitest | `packages/shared` |
| Integración | API NestJS contra PostgreSQL real (Prisma), incluye aislamiento y permisos por endpoint | Vitest + base de datos efímera | `apps/api` |
| Pruebas de oro | Montos esperados de cada comunidad simulada, calculados a mano | Vitest | `packages/shared`, `apps/api` |
| E2E web | Flujos críticos del administrador y comité | Playwright | `apps/web` |
| E2E app | Flujos críticos del residente y conserjería | Maestro | `apps/mobile` |

Proporción orientativa: muchas unitarias y de propiedades, integración para cada endpoint, pocas E2E solo en flujos críticos (emitir gasto común, pagar, conciliar, consultar estado de cuenta).

## 2. Áreas por riesgo

| Prioridad | Área | Riesgo | Pruebas exigidas | TDD |
| --- | --- | --- | --- | --- |
| 1 | Gasto común y prorrateo | Cobro incorrecto a una unidad | Unitarias, propiedades, pruebas de oro (A, D) | Obligatorio |
| 1 | Redondeo (por cuenta) | Suma de cargos distinta del total emitido | Propiedades, pruebas de oro (B, C, D) | Obligatorio |
| 1 | Saldos | Saldo que no cuadra con los movimientos | Unitarias, propiedades, integración (no existe campo de saldo editable) | Obligatorio |
| 1 | Periodos cerrados | Modificación de un periodo cerrado | Integración: toda escritura sobre periodo cerrado se rechaza; corrección solo como ajuste en el periodo siguiente | Obligatorio |
| 1 | Conciliación | Pago asignado a la unidad equivocada, duplicado o cartola importada dos veces | Unitarias, propiedades, integración, pruebas de oro con cartolas simuladas | Obligatorio |
| 1 | Imputación de pagos y Webpay | Pago aplicado a la deuda o al ámbito equivocado, pago duplicado, grupo anulado a medias, intento en revisión mal resuelto | Unitarias, propiedades, integración, pruebas de oro de escenarios (GOLD-A29, GOLD-A32) | Obligatorio |
| 1 | Intereses por mora | Interés sobre el tope legal, días cobrados dos veces o perdidos | Unitarias, propiedades, integración | Obligatorio |
| 1 | Aislamiento entre comunidades | Un usuario ve o modifica datos de otra comunidad | Integración con el patrón de la sección 4, en cada endpoint | Obligatorio |
| 1 | Aislamiento por ámbito (propietario y arrendatario) | Un arrendatario ve la deuda del propietario, o un residente ve más de lo que define la spec | Integración (sección 4.1) | Obligatorio |
| 1 | Aislamiento de plataforma (Soporte y Operaciones ComVive, EX-1) | El equipo ComVive ve o escribe datos de negocio fuera de la vista mínima, o una comunidad queda sin administrador | Integración, concurrencia y base de datos (sección 4.2) | Obligatorio |
| 1 | Integración Webpay (Transbank) | Cobro, consulta o reembolso con el comercio de otra comunidad; reembolso por un monto distinto del que queda cobrado; intento en un estado imposible; retorno de Transbank que escribe en otra comunidad | Integración contra un doble de Transbank, propiedades (máquina de estados y monto del reembolso), aislamiento de la ruta de retorno (sección 4.3) y prueba de contrato contra el ambiente de integración de Transbank (sección 7) | Obligatorio |
| 1 | Idempotencia y rechazos | Un doble envío duplica dinero; un rechazo deja datos de negocio o queda guardado con la clave e impide corregir | Integración y propiedades (sección 4.4) | Obligatorio |
| 2 | Permisos por rol | Un rol ejecuta acciones que no le corresponden | Integración con matriz rol × acción por endpoint (sección 5) | Obligatorio |
| 3 | Datos personales (Ley 21.719) | Exposición de RUT, deudas o visitas | Integración: respuestas sin campos innecesarios por rol; auditoría de lecturas y escrituras (sección 5.1) | Recomendado |

Reglas de TDD: es obligatorio en gasto común (incluidos redondeo, saldos y periodos cerrados), intereses por mora, imputación de pagos (incluido Webpay), conciliación, permisos y aislamiento (entre comunidades, por ámbito y de plataforma), como fija `CLAUDE.md`. La prueba se escribe y se ve fallar antes de escribir el código; la revisión cruzada verifica en el historial que la prueba precede a la implementación.

### 2.1 Supuestos de cálculo (a validar)

- **Supuesto (a validar):** la participación es un entero (alícuota legal en escala 10^-6 o peso relativo). Si el criterio es por alícuota y no suman 100 %, la emisión se bloquea (spec de gasto común, CA-19); el motor de cálculo reparte siempre por `peso ÷ suma de pesos`.
- **Supuesto (a validar):** resto mayor con desempate por `sort_order` entero de la unidad, nunca por su nombre como texto.
- **Supuesto (a validar):** el redondeo se hace por cuenta: gasto ordinario y fondo de reserva por separado.
- **Supuesto (a validar):** el total del fondo de cada grupo ordinario se redondea hacia arriba al peso: `F = (O × pb + 9.999) div 10.000` (spec de gasto común, regla D-3 y S-6).
- **Supuesto (a validar):** un total en UF se convierte a CLP una sola vez y luego se prorratea.
- Casos borde con resultado fijo: comunidad sin unidades y todos los pesos en 0 → error de validación sin cargos creados; total $0 → cargo $0 para todas las unidades.

## 3. Pruebas de oro

### 3.1 Relación con las comunidades simuladas

- La fuente de verdad es `docs/qa/comunidades-simuladas.md`. Cada comunidad trae sus datos, el cálculo paso a paso y el resultado esperado.
- Un monto esperado solo es válido si muestra su cálculo y fue aprobado por el líder del proyecto. La validación por un contador se exige **antes del Piloto**; hasta entonces los montos se basan en los supuestos documentados.
- Cobertura actual: Comunidad A (alícuota sin redondeo y pago parcial), B (redondeo con empate por `sort_order`), C (redondeo con varios pesos a repartir), C por cuenta (`GOLD-CE`, detecta el redondeo del total combinado; aprobada el 2026-11-07), D (alícuotas en escala 10^-6, fondo con techo y redondeo por cuenta).
- Escenarios de la spec rev. 4, aprobados por el líder del proyecto (2026-11-07): pago "Ambas" por Webpay e interés siguiente (`GOLD-A29`), pago manual "Ambos" (`GOLD-A32`), anular gasto (`GOLD-A33` y `GOLD-B34`), emisión con la versión nueva del borrador (`GOLD-A39`) y saldo del fondo con egresos y correcciones (`GOLD-A62`).
- Spec rev. 7 (CA-65 a CA-72): no cambia ninguna prueba de oro. Las resoluciones de Soporte, los reversos y los reembolsos no escriben movimientos; los montos que sí cambian (pagos manuales de CA-66 y CA-67, montos de reembolso de CA-70 y CA-71) están calculados en `comunidades-simuladas.md`, "CA-65 a CA-72 (spec rev. 7): sin pruebas de oro nuevas", para revisión del líder.
- Spec rev. 8 (CA-73 a CA-75): tampoco cambia ninguna prueba de oro. Los montos de reembolso de CA-73, el pago confirmado por una expiración con `AUTHORIZED` (D18) y el caso borde del 284 están en `comunidades-simuladas.md`, "CA-73 a CA-75 (spec rev. 8): sin pruebas de oro nuevas".
- Casos de prueba derivados de cada especificación: `docs/qa/casos/`. Gasto común: [`docs/qa/casos/gasto-comun.md`](casos/gasto-comun.md).
- Pendiente de datos: prueba de oro en UF (total UF convertido una vez a CLP y luego prorrateado).
- Pendiente: comunidades para conciliación (incluida una línea de cartola que cubre varias unidades), multas e intereses y ajustes en periodo siguiente.

### 3.2 Conversión a pruebas automáticas

1. Cada comunidad se transcribe a un archivo de datos versionado (fixture) en `packages/shared/test/golden/`, con montos en CLP y participaciones como enteros.
2. Cada fila de resultado esperado se convierte en una aserción exacta (`toBe`, nunca comparación aproximada).
3. El nombre de la prueba lleva el ID de la fila: `GOLD-D-03 Depto 3 = 236341`. El mismo ID figura en `comunidades-simuladas.md`.
4. La trazabilidad entre documento y fixture se asegura por el ID `GOLD-*` y la revisión cruzada de cada PR que toque cualquiera de los dos. No se automatiza el parseo del Markdown.
5. Los resultados esperados no se cambian para que una prueba pase. Si el código y la prueba de oro difieren, se reporta al líder del proyecto y el cambio queda bloqueado.

### 3.3 Propiedades (fast-check)

Generadores: total entero no negativo y lista no vacía de **pesos enteros no negativos arbitrarios** (al menos uno mayor que 0), con `sort_order` únicos. No se generan "porcentajes que suman 100", porque eso esconde el caso de alícuotas que no suman 100 %. Los rangos siguen la spec vigente: montos de $0 a $9.999.999.999 (regla B-6), como `bigint`; porcentaje del fondo de 500 a 5000 pb (regla D-2). Los valores fuera de rango se generan aparte, solo para probar el rechazo. El detalle por módulo está en los casos (gasto común: PROP-GC-01 a PROP-GC-40).

1. La suma de los cargos es exactamente el total emitido.
2. Cada cargo difiere de su cargo exacto en menos de un peso.
3. Ningún cargo es negativo y todos son enteros.
4. El resultado no depende del orden de entrada de las unidades (el desempate depende solo de `sort_order`).
5. Una unidad con peso 0 tiene cargo $0.
6. Con redondeo por cuenta, la suma de cada cuenta iguala su propio total, y el cargo de la unidad es la suma de sus cargos por cuenta.
7. El saldo de una unidad es siempre la suma de sus cargos menos la suma de sus abonos.
8. Conciliación N:M: para cada línea de cartola, la suma de lo asignado a pagos es menor o igual al monto de la línea; una línea puede cubrir pagos de varias unidades y un pago puede cubrirse con varias líneas.
9. Idempotencia de importación: importar dos veces la misma cartola no crea líneas duplicadas ni cambia ningún saldo.
10. Imputación por ámbito: un crédito solo se imputa a débitos de su mismo ámbito y su remanente queda a favor en ese ámbito; un cobro de varios ámbitos crea exactamente un pago por ámbito y la suma de esos pagos es el monto cobrado.
11. Traspaso: al terminar una ocupación, su ámbito queda en $0 y el ámbito `owner` recibe exactamente su saldo; el saldo de la unidad no cambia.
12. Escritura acotada: ninguna operación de un actor (incluido Soporte ComVive) inserta filas fuera de su comunidad, ni fuera de la unidad y los ámbitos que la regla permite.
13. Rechazos sin efecto: ninguna respuesta 4xx o 5xx escribe datos de negocio ni queda guardada con la clave de idempotencia; solo los éxitos se guardan (decisión del líder D12). Única excepción: el intento `abandoned` del 503 al iniciar un pago en línea.
14. Reembolso acotado: lo pedido a Transbank más lo ya anulado nunca supera lo autorizado, y hay a lo más una solicitud de reembolso por intento.
15. Siempre un administrador: ningún intercalado concurrente de otorgamientos y revocaciones deja a una comunidad sin administrador vigente, y una comunidad nunca espera ni cuenta los administradores de otra.

### 3.4 Regla de bloqueo

Las pruebas de oro y de propiedades corren en **todo PR**, toque o no un cálculo de dinero. Si fallan, el PR **no se puede fusionar**. La verificación es obligatoria en la protección de la rama `main` y no admite excepciones manuales.

## 4. Pruebas de aislamiento

Todo endpoint nuevo que exponga datos de negocio lleva este patrón estándar, como prueba de integración:

**Preparación:** Comunidad A y Comunidad B, cada una con datos propios (unidades, personas con RUT, cargos, pagos, intentos Webpay, visitas). Actores de A: `admin-A`, `comite-A`, `propietario-A` (propietario de una unidad de A), `arrendatario-A` (ocupación vigente en una unidad de A), `conserje-A` y `ex-residente-A` (membresía vencida). Cada caso se ejecuta con todos los actores de A que tengan acceso al endpoint.

**Dos vías obligatorias** en ISO-1, ISO-4 e ISO-5:

- **Vía guard:** ruta con la comunidad ajena, `/communities/B/<recurso>/<id de B>`. Prueba el control de membresía.
- **Vía capa de datos:** ruta con la comunidad propia y un identificador ajeno, `/communities/A/<recurso>/<id de B>`. Prueba que la consulta filtra por comunidad, aunque el guard deje pasar.

| Caso | Acción | Resultado esperado |
| --- | --- | --- |
| ISO-1 | Actor de A lee un recurso de B por las dos vías | 404 en ambas; no revela que el recurso existe |
| ISO-2 | Actor de A lista recursos | Solo aparecen recursos de A |
| ISO-3 | Actor de A crea un recurso indicando la comunidad B (en la ruta o en el cuerpo) | 404; no se crea nada en B |
| ISO-4 | Actor de A modifica o elimina un recurso de B por las dos vías | 404 en ambas; el recurso de B queda intacto |
| ISO-5 | Actor de A usa un recurso de B como referencia dentro de A (p. ej. asignar un pago de A a una unidad de B) por las dos vías | 404; sin cambios en A ni en B |
| ISO-6 | Administrador con acceso a A y B, operando en el contexto de A | Solo ve y modifica datos de A |
| ISO-7 | Actor de A busca personas por RUT, con un RUT que existe solo en B | Respuesta idéntica a la de un RUT inexistente; no revela la persona ni su comunidad |
| ISO-8 | `ex-residente-A` (membresía vencida) lee o escribe recursos de A | 404, igual que un usuario sin membresía |
| ISO-9 | `residente-A` lee el estado de cuenta, pagos o visitas de otra unidad de A | 404 |

Después de cada caso se verifica en base de datos que B (y la unidad ajena de A en ISO-9) no cambió. La revisión de seguridad rechaza endpoints sin estas pruebas.

**Códigos de respuesta (decisión del líder del proyecto, 2026-11-07; M-4 de la revisión 3 del diseño):** 404 si el actor **no puede ver** el recurso; 403 **solo si lo ve** pero su rol no permite la acción. Orden de validación fijo (precisado en la spec rev. 8, S-77; ADR 0003, decisión 9): autenticación (401) → membresía (o rol de plataforma), visibilidad del recurso de la ruta (404) y permiso (403) → forma de la petición (400 `BAD_REQUEST`, y 422 `INVALID_AMOUNT` por un monto negativo, con decimales o de texto) → 404/403 que dependen de un dato del cuerpo → idempotencia (respuesta guardada, `IDEMPOTENCY_KEY_REUSED` o `IDEMPOTENCY_KEY_IN_PROGRESS`) → reglas de negocio, incluidos los 409 de estado. Así la respuesta nunca depende de si el recurso existe, y un reenvío de una acción aplicada devuelve su resultado y no un 409. Cada endpoint de escritura lleva una prueba con una petición que falla en dos o más pasos y espera el error del primero.

| Situación | Código |
| --- | --- |
| Sin sesión | 401, salvo la ruta de retorno de Transbank (302, sección 4.3) |
| Sin membresía vigente en la comunidad, o recurso de otra comunidad | 404 |
| Residente pide una unidad ajena, o un movimiento, pago o intento fuera de los ámbitos que ve | 404 |
| Rol que no ve ese tipo de recurso (p. ej. el conserje pide un aviso; el comité pide las tareas del administrador; un ex miembro del comité pide el registro de copropietarios) | 404 |
| Sesión de comunidad en una ruta `/platform/...`, o sesión de plataforma en una ruta `/communities/...` | 404 |
| El actor ve el recurso, pero su rol no permite la acción (p. ej. el comité ve el periodo e intenta emitirlo) | 403 |

Todo 404 trae el mismo cuerpo (`NOT_FOUND`, "No encontramos lo que buscas o no tienes acceso") y todo 403 el mismo (`FORBIDDEN`, "Tu rol no permite esta acción"). Cada prueba de rechazo verifica además que un id inexistente da la misma respuesta que un id ajeno.

### 4.1 Aislamiento por ámbito (propietario y arrendatario)

Dentro de una misma unidad, lo que ve un residente se decide por el **ámbito** de cada movimiento (`owner` o la ocupación del arrendatario), nunca comparando fechas. Todo endpoint de residente sobre cargos, movimientos, pagos, imputaciones, intentos, avisos o comprobantes lleva estos casos:

| Caso | Acción | Resultado esperado |
| --- | --- | --- |
| ISO-10 | El arrendatario lee un movimiento, pago, cargo o saldo del ámbito `owner` de su unidad | 404; listas y saldos solo con su ámbito |
| ISO-11 | El arrendatario lee el pago del otro ámbito de un grupo, el grupo de pagos o un intento que no inició | 404; ninguna respuesta trae montos del otro ámbito ni el total del grupo |
| ISO-12 | Ingreso retroactivo: el arrendatario lee un cargo `owner` emitido después de su fecha de ingreso declarada | 404 |
| ISO-13 | Ocupación programada, terminada o venta: el arrendatario antes de su inicio efectivo, el ex arrendatario o el ex propietario después del registro, leen o pagan en la unidad | 404 |
| ISO-14 | El propietario lee el ámbito del arrendatario vigente | Solo nombre, deuda, cargos y pagos de ese ámbito; sin RUT, teléfono ni correo; un registro de auditoría por petición |
| ISO-15 | El propietario lee datos de una ocupación terminada o un intento del arrendatario | 404 |
| ISO-16 | Un residente consulta el pago en curso de su unidad (`webpay-attempts/current`) mientras otra persona paga un ámbito que él ve | Solo sus propios intentos; la respuesta es idéntica a la de una unidad sin intentos ajenos (spec S-74) |

### 4.2 Aislamiento de plataforma (Soporte ComVive, excepción EX-1)

Soporte ComVive (`platform_support`) es la única excepción a la regla 4 de `CLAUDE.md` en el módulo de gasto común: ve solo los intentos Webpay en revisión, con una vista mínima. Además de las pruebas de cada endpoint de `/platform/...`:

| Caso | Acción | Resultado esperado |
| --- | --- | --- |
| ISO-P1 | Soporte lee un intento en `in_review` o `reversal_pending` | Solo los campos de EX-1 (prueba de contrato contra una lista cerrada); sin nombres, RUT, contactos, deudas, saldos ni imputaciones |
| ISO-P2 | Soporte pide cualquier ruta `/communities/...` o un intento en otro estado | 404 |
| ISO-P3 | La vista previa de una resolución | Solo campos de EX-1 más el pago a crear (monto, tipo de ámbito y periodo) |
| ISO-P4 | Una resolución que registra un pago | Solo inserta filas de la comunidad, la unidad y el ámbito del intento; si la ocupación terminó, también el ámbito `owner` de esa unidad; ninguna otra (se verifica en todas las tablas escritas) |
| ISO-P5 | Sesión de comunidad (incluido un administrador) en `/platform/...`; cada rol de plataforma en los endpoints del otro | 404 |
| ISO-P6 | Grant de plataforma revocado o vencido | Sin acceso en la petición siguiente |
| ISO-P7 | El rol de base de datos de plataforma consulta tablas base | Rechazado por PostgreSQL; solo lee su vista |
| ISO-P8 | Cualquier petición de plataforma, lecturas y rechazos incluidos | Exactamente un registro de auditoría, con el código si es un rechazo; si la auditoría falla, la petición falla |
| ISO-P9 | Toda llamada a Transbank de un intento (inicio, retorno, consulta, reembolso, resolución sin cobro) | Usa siempre el comercio guardado en el intento, aunque la petición anterior fuera de otra comunidad o el comercio vigente haya cambiado; ningún registro contiene la clave ni el token |
| ISO-P10 | Operaciones ComVive revoca con el identificador de una membresía de otra comunidad, de una que no es de administrador o inexistente | 404 con el mismo cuerpo, antes del 400 y de las reglas, sin tomar bloqueos; nada cambia en ninguna comunidad (spec S-79) |
| ISO-P11 | Revocación del último administrador y revocaciones concurrentes | Cuenta solo los administradores de la misma comunidad; el bloqueo es por comunidad y no detiene a otra |
| ISO-P12 | Se revoca la membresía de una persona en B mientras trabaja en A | Su sesión no cambia; B le responde 404 desde la petición siguiente y A, 2xx; solo se eliminan las suscripciones push de la membresía revocada (spec S-81) |

Operaciones ComVive (`platform_operations`) no ve datos de negocio: toda lectura de negocio le responde 404 (ISO-P5).

### 4.3 Ruta de retorno de Transbank (única ruta de negocio sin membresía)

`GET` y `POST /gateway/webpay/communities/{communityId}/webpay-attempts/{attemptId}/return` no exige sesión: Transbank redirige el navegador del pagador (`docs/arquitectura.md` §2; ADR 0007). Su guard propio busca el intento en la comunidad de la ruta y compara el token o, en una expiración sin token, `TBK_ID_SESION` y `TBK_ORDEN_COMPRA`. Un retorno inválido responde un 302 neutro a la pantalla genérica, sin id de intento, no escribe en la base de datos y deja un evento en el registro de eventos de seguridad (spec S-75 y S-83). Además del patrón de la sección 4:

| Caso | Acción | Resultado esperado |
| --- | --- | --- |
| ISO-G1 | Retorno con un intento de otra comunidad, en las dos direcciones | El mismo 302 neutro sin id que un intento inexistente; sin llamadas a Transbank; ninguna fila escrita en ninguna tabla; un evento de seguridad sin datos personales |
| ISO-G2 | Retorno con un token ajeno, alterado o de un pago abortado de otro intento | Igual que ISO-G1; el intento sigue en su estado |
| ISO-G3 | Retorno correcto sin sesión, o con la sesión de otra persona o de otra comunidad | El resultado sale solo de Transbank y la sesión se ignora; la redirección lleva solo el id del intento |
| ISO-G4 | Expiración sin token con los parámetros de un intento de otra comunidad; y con los del intento propio (decisión del líder D18) | Ajena: 302 neutro sin consultar a Transbank con ningún comercio. Propia: una sola consulta de estado con el comercio del intento antes de cancelar |

### 4.4 Idempotencia y rechazos (decisión del líder D12)

Toda escritura de dinero, de responsable de deuda o de roles lleva `Idempotency-Key`. Para cada endpoint se prueba: un envío repetido con la misma clave y el mismo cuerpo devuelve la respuesta original sin escribir otra vez; con otro cuerpo, 422 `IDEMPOTENCY_KEY_REUSED`; un rechazo (400, 403, 404, 409, 422 o 503) no deja fila en `IDEMPOTENCY_KEY` ni datos de negocio, y su reenvío con la misma clave, corregido o después de un cambio de estado, se evalúa de nuevo y puede aplicarse. En las rutas `/platform/...` el rechazo sí deja su registro de auditoría. Casos de gasto común: TC-GC-CB-32 y PROP-GC-35.

## 5. Permisos por rol

Para cada endpoint se prueba la matriz completa rol × acción tomada de la tabla "Usuarios y permisos" de su especificación, con estos actores:

| Actor | Alcance esperado (a confirmar en cada especificación) |
| --- | --- |
| Administrador | Toda la comunidad que administra |
| Comité | Lectura de la comunidad; acciones que defina la especificación |
| Residente propietario | Solo sus unidades |
| Residente arrendatario | Solo la unidad que ocupa; sin acciones reservadas al propietario |
| Conserje | Solo lo operativo (visitas, encomiendas); sin deudas ni RUT completos |
| Ex residente o ex miembro del comité | Nada de lo que veía con el rol perdido |
| Soporte ComVive (`platform_support`) | Solo los intentos Webpay en revisión, con la vista mínima EX-1 (sección 4.2) |
| Operaciones ComVive (`platform_operations`) | Alta de comunidades y rol de administrador; ningún dato de negocio |
| Sin sesión | Nada, salvo la ruta de retorno de Transbank, que responde 302 sin escribir nada si el intento o el token no corresponden (sección 4.3) |

Cada celda permitida tiene una prueba de éxito y cada celda denegada una prueba de rechazo con los códigos de la sección 4: **404 si el actor no ve el recurso y 403 solo si lo ve**. La matriz incluye pruebas del orden de validación (por ejemplo, un rol sin permiso sobre un periodo ya emitido recibe 403 y no 409). Si la plantilla de especificación tiene una sola fila "Residente", la especificación debe separar propietario y arrendatario antes de pasar a "Lista para desarrollo".

### 5.1 Auditoría de lecturas (supuesto a validar)

- Se crea **un registro de auditoría por petición** que devuelva RUT completo, deuda de terceros o datos de visitas.
- No se audita al residente cuando consulta su propio ámbito.
- **Sí** se audita al propietario cuando lee el ámbito del arrendatario vigente de su unidad: es deuda de un tercero (spec de gasto común, S-44).
- Se audita **toda** petición de Soporte ComVive y de Operaciones ComVive, lecturas y rechazos incluidos (EX-1; D12), y todo aviso enviado a un pagador sin membresía.
- Cada llamada a Transbank queda registrada (`WEBPAY_GATEWAY_CALL`), sin token, clave del comercio ni datos de la tarjeta.
- Pruebas: cada endpoint de esos tipos verifica que se crea exactamente un registro por petición (con actor, comunidad, recurso y fecha) y que la consulta del residente sobre su propio ámbito no crea registro.

## 6. Criterios de salida por etapa

| Etapa | Criterio de salida |
| --- | --- |
| 0 · Cimientos | Plan de pruebas y comunidades simuladas aprobados por el líder del proyecto, con los supuestos de cálculo documentados; checks `docs` y `secrets` de la CI marcados como obligatorios en la protección de `main`. |
| 1 · Diseño | Cada especificación del MVP tiene casos de prueba derivados (uno por CA y por caso borde) revisados; pruebas de oro cubren gasto común, pagos y conciliación; matriz de permisos definida por módulo con todos los actores de la sección 5 (incluidos ex residentes y roles de plataforma) y la regla 404/403; casos de aislamiento por ámbito y de plataforma para cada endpoint que los requiera. |
| 2 · MVP | Suite completa en verde en CI; pruebas de oro y propiedades automatizadas, corriendo en todo PR y bloqueantes; cada endpoint con pruebas de aislamiento (dos vías) y permisos, incluida la ruta de retorno de Transbank; Webpay probado contra el doble de Transbank en CI y con la prueba de contrato del ambiente de integración de Transbank en verde antes de cada despliegue a pruebas; E2E de flujos críticos en web y app; cobertura de líneas mayor o igual a 90 % en módulos de dinero y permisos. |
| 3 · Piloto | **Antes de iniciar:** regla de redondeo, supuestos de cálculo y pruebas de oro validados por un contador. Durante: datos reales de la comunidad piloto migrados y cuadrados contra su contabilidad anterior; al menos un cierre de mes completo validado por el administrador; cero defectos abiertos de dinero, aislamiento o permisos. |
| 4 · Lanzamiento | Pruebas de carga y de recuperación ante fallos; revisión de seguridad externa sin hallazgos críticos; auditoría de datos personales según Ley 21.719 aprobada; regresión completa en verde. |

## 7. Integración con CI

**Hoy (Etapa 0)**, en cada PR y en cada cambio a `main` (`.github/workflows/ci.yml`):

- Lint de Markdown de todo el repositorio con `markdownlint-cli2` (reglas en `.markdownlint-cli2.jsonc`).
- Detección de secretos sobre todo el historial con `gitleaks`.

**Desde la Etapa 2**, se suman en este orden (falla rápido primero):

1. Tipado (`tsc`) y lint de código.
2. Unitarias y de propiedades (Vitest + fast-check).
3. Pruebas de oro (bloqueantes).
4. Integración con PostgreSQL efímero, incluidas aislamiento y permisos.
5. E2E web (Playwright) en PR que tocan `apps/web`; E2E app (Maestro) en compilaciones de EAS.
6. Análisis de dependencias vulnerables.

Fuera del CI de cada cambio y antes de cada despliegue a pruebas: prueba de contrato contra el ambiente de integración de Transbank (crear, confirmar, consultar y reembolsar; ADR 0007, prueba 10). En el CI, Webpay se prueba contra un doble de Transbank con dos comercios simulados, que registra cada llamada con su comercio y su token (ADR 0007, prueba 6).

Las semillas de fast-check que encuentren un fallo se registran en el reporte y se agregan como caso fijo de regresión.

## 8. Convención de casos de prueba

| Prefijo | Uso | Ejemplo |
| --- | --- | --- |
| `TC-<MODULO>-<CA>-<n>` | Caso derivado de un criterio de aceptación | `TC-GC-CA3-01` |
| `TC-<MODULO>-CB-<n>` | Caso derivado de un caso borde | `TC-GC-CB-02` |
| `GOLD-<comunidad>-<fila>` | Prueba de oro | `GOLD-C-04` |
| `PROP-<MODULO>-<n>` | Propiedad de fast-check | `PROP-GC-01` |
| `ISO-<MODULO>-<endpoint>-<n>` | Aislamiento | `ISO-PAG-listar-2` |
| `PERM-<MODULO>-<rol>-<acción>` | Permiso por rol | `PERM-GC-residente-emitir` |

- `<MODULO>` es una abreviatura fija por especificación (p. ej. `GC` gasto común, `PAG` pagos, `CON` conciliación), registrada en la propia especificación.
- Cada caso indica la especificación y el CA de origen. Todo CA debe tener al menos un caso; un CA sin caso bloquea el paso a "Lista para desarrollo".
- El identificador aparece en el nombre de la prueba automática para poder rastrearlo desde el reporte de CI.
- Los casos de cada módulo viven en `docs/qa/casos/<modulo>.md`, con estado `Para revisión del líder del proyecto` hasta su aprobación. Hoy: [gasto común](casos/gasto-comun.md).

## 9. Preguntas abiertas

- [ ] ¿Se aprueba el método del resto mayor con desempate por `sort_order` y redondeo por cuenta? Validación por contador antes del Piloto. (Líder del proyecto y contador)
- [ ] ¿Quién es el contador que validará las pruebas de oro? (Líder del proyecto)
- [x] ¿Se amplía en CLAUDE.md la lista de TDD obligatorio? Sí (líder del proyecto, 2026-11-07): intereses, imputación de pagos, Webpay y aislamiento, además de gasto común (con saldos y periodos cerrados), conciliación y permisos.
- [ ] Prueba de oro en UF: ¿qué fecha de UF se usa y cómo se redondea la conversión? (Líder del proyecto, especificación de gasto común)
- [ ] ¿El umbral de 90 % de cobertura en módulos de dinero y permisos es adecuado o se prefiere medir cobertura de mutación? (Líder del proyecto)
- [ ] La CI de la Etapa 0 usa `gitleaks` para detectar secretos. ¿Se confirma con un ADR? (Arquitecto)
- [ ] ¿Las pruebas E2E de la app (Maestro) corren en cada PR o solo antes de publicar con EAS? (Arquitecto)
- [ ] Hallazgos H-43 a H-46 de los casos de gasto común (reembolso pasadas las 168 horas en CA-73, reversa imposible en CA-74, textos menores de la spec rev. 8, motivo del evento de un retorno sin parámetros y dos fallas en el paso de forma): `docs/qa/casos/gasto-comun.md`, sección final. (Analista y arquitecto)

Cerradas:

- [x] Hallazgos H-30 a H-42 de los casos de gasto común: resueltos en la spec rev. 8, los ADR 0002, 0003, 0005, 0006 y 0007 y `docs/arquitectura.md`, con las decisiones del líder D17 y D18 (tabla de resolución en `docs/qa/casos/gasto-comun.md`).

- [x] Códigos de respuesta (decisión del líder del proyecto, 2026-11-07): 404 si el actor no puede ver el recurso; 403 solo si lo ve pero no puede hacer la acción (sección 4).

Cerradas como supuesto (a validar):

- [x] Auditoría de lecturas: un registro por petición con RUT completo, deuda de terceros o visitas; no se audita al residente sobre su propio ámbito, pero sí al propietario que lee el ámbito del arrendatario (sección 5.1; spec S-44 y P-34).
