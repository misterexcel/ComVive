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
| 1 | Aislamiento entre comunidades | Un usuario ve o modifica datos de otra comunidad | Integración con el patrón de la sección 4, en cada endpoint | Obligatorio |
| 2 | Permisos por rol | Un rol ejecuta acciones que no le corresponden | Integración con matriz rol × acción por endpoint (sección 5) | Obligatorio |
| 3 | Datos personales (Ley 21.719) | Exposición de RUT, deudas o visitas | Integración: respuestas sin campos innecesarios por rol; auditoría de lecturas y escrituras (sección 5.1) | Recomendado |

Reglas de TDD: es obligatorio en gasto común (incluidos redondeo, saldos y periodos cerrados), conciliación, permisos y aislamiento. La prueba se escribe y se ve fallar antes de escribir el código; la revisión cruzada verifica en el historial que la prueba precede a la implementación.

Nota: CLAUDE.md exige TDD solo en gasto común, conciliación y permisos. Sumar aislamiento a esa lista queda **pendiente de aprobación del líder del proyecto**; este plan lo aplica desde ya.

### 2.1 Supuestos de cálculo (a validar)

- **Supuesto (a validar):** la participación es un entero (alícuota legal en escala 10^-6 o peso relativo). Si el criterio es por alícuota y no suman 100 %, la emisión se bloquea (spec de gasto común, CA-16); el motor de cálculo reparte siempre por `peso ÷ suma de pesos`.
- **Supuesto (a validar):** resto mayor con desempate por `sort_order` entero de la unidad, nunca por su nombre como texto.
- **Supuesto (a validar):** el redondeo se hace por cuenta: gasto ordinario y fondo de reserva por separado.
- **Supuesto (a validar):** un total en UF se convierte a CLP una sola vez y luego se prorratea.
- Casos borde con resultado fijo: comunidad sin unidades y todos los pesos en 0 → error de validación sin cargos creados; total $0 → cargo $0 para todas las unidades.

## 3. Pruebas de oro

### 3.1 Relación con las comunidades simuladas

- La fuente de verdad es `docs/qa/comunidades-simuladas.md`. Cada comunidad trae sus datos, el cálculo paso a paso y el resultado esperado.
- Un monto esperado solo es válido si muestra su cálculo y fue aprobado por el líder del proyecto. La validación por un contador se exige **antes del Piloto**; hasta entonces los montos se basan en los supuestos documentados.
- Cobertura actual: Comunidad A (alícuota sin redondeo y pago parcial), B (redondeo con empate por `sort_order`), C (redondeo con varios pesos a repartir), D (alícuotas en escala 10^-6, gasto ordinario y fondo de reserva redondeados por cuenta).
- Pendiente de datos: prueba de oro en UF (total UF convertido una vez a CLP y luego prorrateado).
- Pendiente: comunidades para conciliación (incluida una línea de cartola que cubre varias unidades), multas e intereses y ajustes en periodo siguiente.

### 3.2 Conversión a pruebas automáticas

1. Cada comunidad se transcribe a un archivo de datos versionado (fixture) en `packages/shared/test/golden/`, con montos en CLP y participaciones como enteros.
2. Cada fila de resultado esperado se convierte en una aserción exacta (`toBe`, nunca comparación aproximada).
3. El nombre de la prueba lleva el ID de la fila: `GOLD-D-03 Depto 3 = 236341`. El mismo ID figura en `comunidades-simuladas.md`.
4. La trazabilidad entre documento y fixture se asegura por el ID `GOLD-*` y la revisión cruzada de cada PR que toque cualquiera de los dos. No se automatiza el parseo del Markdown.
5. Los resultados esperados no se cambian para que una prueba pase. Si el código y la prueba de oro difieren, se reporta al líder del proyecto y el cambio queda bloqueado.

### 3.3 Propiedades (fast-check)

Generadores: total entero no negativo y lista no vacía de **pesos enteros no negativos arbitrarios** (al menos uno mayor que 0), con `sort_order` únicos. No se generan "porcentajes que suman 100", porque eso esconde el caso de alícuotas que no suman 100 %.

1. La suma de los cargos es exactamente el total emitido.
2. Cada cargo difiere de su cargo exacto en menos de un peso.
3. Ningún cargo es negativo y todos son enteros.
4. El resultado no depende del orden de entrada de las unidades (el desempate depende solo de `sort_order`).
5. Una unidad con peso 0 tiene cargo $0.
6. Con redondeo por cuenta, la suma de cada cuenta iguala su propio total, y el cargo de la unidad es la suma de sus cargos por cuenta.
7. El saldo de una unidad es siempre la suma de sus cargos menos la suma de sus abonos.
8. Conciliación N:M: para cada línea de cartola, la suma de lo asignado a pagos es menor o igual al monto de la línea; una línea puede cubrir pagos de varias unidades y un pago puede cubrirse con varias líneas.
9. Idempotencia de importación: importar dos veces la misma cartola no crea líneas duplicadas ni cambia ningún saldo.

### 3.4 Regla de bloqueo

Las pruebas de oro y de propiedades corren en **todo PR**, toque o no un cálculo de dinero. Si fallan, el PR **no se puede fusionar**. La verificación es obligatoria en la protección de la rama `main` y no admite excepciones manuales.

## 4. Pruebas de aislamiento

Todo endpoint nuevo que exponga datos de negocio lleva este patrón estándar, como prueba de integración:

**Preparación:** Comunidad A y Comunidad B, cada una con datos propios (unidades, personas con RUT, cargos, pagos, visitas). Actores de A: `admin-A`, `residente-A` (propietario de una unidad de A), `conserje-A` y `ex-residente-A` (membresía vencida). Cada caso se ejecuta con todos los actores de A que tengan acceso al endpoint.

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

**Códigos de respuesta (cerrado como supuesto a validar):**

| Situación | Código |
| --- | --- |
| Sin sesión | 401 |
| Sin membresía vigente en la comunidad, o recurso de otra comunidad | 404 |
| Con membresía vigente, pero el rol no tiene el permiso | 403 |
| Unidad ajena dentro de la misma comunidad (residente) | 404 |

## 5. Permisos por rol

Para cada endpoint se prueba la matriz completa rol × acción tomada de la tabla "Usuarios y permisos" de su especificación, con estos actores:

| Actor | Alcance esperado (a confirmar en cada especificación) |
| --- | --- |
| Administrador | Toda la comunidad que administra |
| Comité | Lectura de la comunidad; acciones que defina la especificación |
| Residente propietario | Solo sus unidades |
| Residente arrendatario | Solo la unidad que ocupa; sin acciones reservadas al propietario |
| Conserje | Solo lo operativo (visitas, encomiendas); sin deudas ni RUT completos |
| Sin sesión | Nada |

Cada celda permitida tiene una prueba de éxito y cada celda denegada una prueba de rechazo con los códigos de la sección 4. Si la plantilla de especificación tiene una sola fila "Residente", la especificación debe separar propietario y arrendatario antes de pasar a "Lista para desarrollo".

### 5.1 Auditoría de lecturas (supuesto a validar)

- Se crea **un registro de auditoría por petición** que devuelva RUT completo, deuda de terceros o datos de visitas.
- No se audita al residente cuando consulta su propia cuenta.
- Pruebas: cada endpoint de esos tipos verifica que se crea exactamente un registro por petición (con actor, comunidad, recurso y fecha) y que la consulta del residente sobre su cuenta no crea registro.

## 6. Criterios de salida por etapa

| Etapa | Criterio de salida |
| --- | --- |
| 0 · Cimientos | Plan de pruebas y comunidades simuladas aprobados por el líder del proyecto, con los supuestos de cálculo documentados; checks `docs` y `secrets` de la CI marcados como obligatorios en la protección de `main`. |
| 1 · Diseño | Cada especificación del MVP tiene casos de prueba derivados (uno por CA y por caso borde) revisados; pruebas de oro cubren gasto común, pagos y conciliación; matriz de permisos con los cinco actores definida por módulo. |
| 2 · MVP | Suite completa en verde en CI; pruebas de oro y propiedades automatizadas, corriendo en todo PR y bloqueantes; cada endpoint con pruebas de aislamiento (dos vías) y permisos; E2E de flujos críticos en web y app; cobertura de líneas mayor o igual a 90 % en módulos de dinero y permisos. |
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
- Los casos de cada módulo viven en `docs/qa/casos/<modulo>.md`, con estado `Para revisión del líder del proyecto` hasta su aprobación.

## 9. Preguntas abiertas

- [ ] ¿Se aprueba el método del resto mayor con desempate por `sort_order` y redondeo por cuenta? Validación por contador antes del Piloto. (Líder del proyecto y contador)
- [ ] ¿Quién es el contador que validará las pruebas de oro? (Líder del proyecto)
- [ ] ¿Se amplía en CLAUDE.md la lista de TDD obligatorio para incluir aislamiento, saldos y periodos cerrados? (Líder del proyecto)
- [ ] Prueba de oro en UF: ¿qué fecha de UF se usa y cómo se redondea la conversión? (Líder del proyecto, especificación de gasto común)
- [ ] ¿El umbral de 90 % de cobertura en módulos de dinero y permisos es adecuado o se prefiere medir cobertura de mutación? (Líder del proyecto)
- [ ] La CI de la Etapa 0 usa `gitleaks` para detectar secretos. ¿Se confirma con un ADR? (Arquitecto)
- [ ] ¿Las pruebas E2E de la app (Maestro) corren en cada PR o solo antes de publicar con EAS? (Arquitecto)

Cerradas como supuesto (a validar):

- [x] Códigos de respuesta: 404 sin membresía o recurso de otra comunidad; 403 con membresía sin permiso; 404 para unidad ajena en la misma comunidad (sección 4).
- [x] Auditoría de lecturas: un registro por petición con RUT completo, deuda de terceros o visitas; no se audita al residente sobre su propia cuenta (sección 5.1).
