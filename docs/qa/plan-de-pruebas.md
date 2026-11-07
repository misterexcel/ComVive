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
| 1 | Gasto común y prorrateo | Cobro incorrecto a una unidad | Unitarias, propiedades, pruebas de oro | Obligatorio |
| 1 | Redondeo | Suma de cargos distinta del total emitido | Propiedades, pruebas de oro (Comunidades B y C) | Obligatorio |
| 1 | Saldos | Saldo que no cuadra con los movimientos | Unitarias, propiedades, integración (no existe campo de saldo editable) | Obligatorio |
| 1 | Periodos cerrados | Modificación de un periodo cerrado | Integración: toda escritura sobre periodo cerrado se rechaza; corrección solo como ajuste en el periodo siguiente | Obligatorio |
| 1 | Conciliación | Pago asignado a la unidad equivocada o duplicado | Unitarias, integración, pruebas de oro con cartolas simuladas | Obligatorio |
| 2 | Aislamiento entre comunidades | Un usuario ve o modifica datos de otra comunidad | Integración con el patrón de la sección 4, en cada endpoint | Recomendado |
| 3 | Permisos por rol | Un rol ejecuta acciones que no le corresponden | Integración con matriz rol × acción por endpoint | Obligatorio |
| 4 | Datos personales (Ley 21.719) | Exposición de RUT, deudas o visitas | Integración: respuestas sin campos innecesarios por rol; registro de auditoría en cada acceso a datos sensibles | Recomendado |

Reglas de TDD: en gasto común, conciliación y permisos la prueba se escribe y se ve fallar antes de escribir el código. La revisión cruzada verifica en el historial que la prueba precede a la implementación.

## 3. Pruebas de oro

### 3.1 Relación con las comunidades simuladas

- La fuente de verdad es `docs/qa/comunidades-simuladas.md`. Cada comunidad trae sus datos, el cálculo paso a paso y el resultado esperado.
- Un monto esperado solo es válido si muestra su cálculo y fue validado por un contador y aprobado por el líder del proyecto.
- Cobertura actual: Comunidad A (alícuota sin redondeo y pago parcial), Comunidad B (redondeo con empate), Comunidad C (redondeo con varios pesos a repartir).
- Pendiente: comunidades para conciliación, multas e intereses, ajustes en periodo siguiente y fondo de reserva según reglamento.

### 3.2 Conversión a pruebas automáticas

1. Cada comunidad se transcribe a un archivo de datos versionado (fixture) en `packages/shared/test/golden/`, con montos en CLP como enteros.
2. Cada fila de resultado esperado se convierte en una aserción exacta (`toBe`, nunca comparación aproximada).
3. El nombre de la prueba referencia la comunidad y la fila: `GOLD-B-02 Casa 2 = 33333`.
4. Si el documento y el fixture difieren, manda el documento aprobado. Una prueba automática de consistencia compara ambos.
5. Los resultados esperados no se cambian para que una prueba pase. Si el código y la prueba de oro difieren, se reporta al líder del proyecto y el cambio queda bloqueado.

### 3.3 Propiedades (fast-check)

Para cualquier total entero no negativo y cualquier conjunto de participaciones que sume 100 %:

1. La suma de los cargos es exactamente el total emitido.
2. Cada cargo difiere de su cargo exacto en menos de un peso.
3. Ningún cargo es negativo y todos son enteros.
4. El resultado no depende del orden en que se procesen las unidades.
5. Una unidad con participación 0 % tiene cargo $0.
6. El saldo de una unidad es siempre la suma de sus cargos menos la suma de sus abonos.
7. Un pago conciliado se asigna a una sola unidad; la suma de lo asignado no supera el monto del movimiento de la cartola.

### 3.4 Regla de bloqueo

Cualquier PR que toque un cálculo de dinero y falle una prueba de oro o de propiedades **no se puede fusionar**. La verificación es obligatoria en la protección de la rama `main` y no admite excepciones manuales.

## 4. Pruebas de aislamiento

Todo endpoint nuevo que exponga datos de negocio lleva este patrón estándar, como prueba de integración:

**Preparación:** Comunidad A y Comunidad B, cada una con datos propios (unidades, cargos, pagos). Usuario `admin-A` con acceso solo a A.

| Caso | Acción | Resultado esperado |
| --- | --- | --- |
| ISO-1 | `admin-A` lee un recurso de B por su identificador | 404 (no revela que el recurso existe) |
| ISO-2 | `admin-A` lista recursos | Solo aparecen recursos de A |
| ISO-3 | `admin-A` crea un recurso indicando la comunidad B | 403 o 404; no se crea nada en B |
| ISO-4 | `admin-A` modifica o elimina un recurso de B | 404; el recurso de B queda intacto |
| ISO-5 | `admin-A` usa un recurso de B como referencia dentro de A (p. ej. asignar un pago de A a una unidad de B) | Rechazo; sin cambios en A ni en B |
| ISO-6 | Administrador multi-comunidad con acceso a A y B, operando en el contexto de A | Solo ve y modifica datos de A |

Después de cada caso se verifica en base de datos que B no cambió. La revisión de seguridad rechaza endpoints sin estas pruebas.

## 5. Permisos por rol

Para cada endpoint se prueba la matriz completa rol × acción tomada de la tabla "Usuarios y permisos" de su especificación: Administrador, Comité, Residente, Conserje y usuario sin sesión. Cada celda permitida tiene una prueba de éxito y cada celda denegada una prueba de rechazo (401 sin sesión, 403 con sesión sin permiso). Un residente solo accede a las unidades de las que es propietario u ocupante.

## 6. Criterios de salida por etapa

| Etapa | Criterio de salida |
| --- | --- |
| 0 · Cimientos | Plan de pruebas y comunidades simuladas aprobados por el líder del proyecto; regla de redondeo validada por un contador; CI con lint de Markdown y detección de secretos activa en cada PR. |
| 1 · Diseño | Cada especificación del MVP tiene casos de prueba derivados (uno por CA y por caso borde) revisados; pruebas de oro cubren gasto común, pagos y conciliación; matriz de permisos definida por módulo. |
| 2 · MVP | Suite completa en verde en CI; pruebas de oro y propiedades automatizadas y bloqueantes; cada endpoint con pruebas de aislamiento y permisos; E2E de flujos críticos en web y app; cobertura de líneas mayor o igual a 90 % en módulos de dinero y permisos. |
| 3 · Piloto | Datos reales de la comunidad piloto migrados y cuadrados contra su contabilidad anterior; al menos un cierre de mes completo validado por el administrador; cero defectos abiertos de dinero, aislamiento o permisos. |
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

- [ ] ¿Se aprueba el método del resto mayor como regla de redondeo, o un contador indica otra práctica? (Líder del proyecto y contador)
- [ ] ¿Quién es el contador que validará las pruebas de oro y en qué momento de cada etapa? (Líder del proyecto)
- [ ] Ante un intento de acceso a otra comunidad, ¿se responde 404 (no revela existencia) o 403? Este plan propone 404. (Arquitecto)
- [ ] ¿El umbral de 90 % de cobertura en módulos de dinero y permisos es adecuado o se prefiere medir cobertura de mutación? (Líder del proyecto)
- [ ] La CI de la Etapa 0 usa `gitleaks` para detectar secretos. ¿Se confirma con un ADR? (Arquitecto)
- [ ] ¿Se registran en auditoría también las lecturas de deudas y RUT, o solo las modificaciones? Afecta las pruebas de datos personales según Ley 21.719. (Líder del proyecto)
- [ ] ¿Las pruebas E2E de la app (Maestro) corren en cada PR o solo antes de publicar con EAS? (Arquitecto)
