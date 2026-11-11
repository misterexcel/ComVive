# Revisión crítica: spec "Comunidades, unidades y membresías" (rev. 1)

- **Fecha:** 2026-11-11
- **Revisor:** agente `revisor-critico`. El coordinador guarda el informe.
- **Entregable:** `docs/specs/comunidades-y-membresias.md`, rev. 1, borrador del analista-producto, rama `docs/spec-comunidades-y-membresias`.
- **Base revisada:** el archivo completo (667 líneas): alcance, matriz de recursos, acciones, errores, órdenes de validación, reglas A a G, CA-CM-1 a CA-CM-23, casos borde, supuestos S-CM-1 a S-CM-20, preguntas P-CM-1 a P-CM-15 y "Contradicciones y vacíos".
- **Veredicto:** **Rechazado** (un crítico, C-1; nueve mayores). La estructura es sólida y la mayoría de las citas son exactas; las correcciones son acotadas y no obligan a rehacer la spec.
- **Estado de la resolución:** rev. 2 incorporada; pendiente de segunda pasada.

## Documentos con que se contrastó

- `CLAUDE.md` (reglas 1 a 10, metodología y TDD).
- `docs/specs/gasto-comun.md` rev. 9:
  - "Definiciones", "Usuarios y permisos" y "Respuestas de error" (S-70, S-77).
  - "Qué recursos ve cada rol" (S-53) y la tabla de errores.
  - "Orden entre reglas de negocio".
  - "Otorgamiento de roles" (S-34, S-43, S-81) y "Validaciones de la consola de Operaciones ComVive" (S-63, S-68, S-72, S-79, S-85, S-86).
  - M-7, S-44, S-33 y EX-1.
  - Reglas A-2, A-3, A-7, C-2 a C-5, F-9, F-13, F-14, F-15, G-1 a G-5 y H.
  - CA-18, CA-19, CA-43, supuestos S-14 a S-86 y preguntas P-1, P-10, P-25, P-49 y P-60.
- `docs/arquitectura.md` §2, §3, §4 y §5.
- ADR 0002 (decisiones 3 a 5), ADR 0003 (decisiones 1 a 9), ADR 0004 (decisiones 1 a 13), ADR 0005 (decisiones 1 a 6), ADR 0006 (decisiones 1 a 10) y ADR 0009 completo (decisiones 1 a 7, pruebas 1 a 16, D36 a D46).
- `docs/design/`:
  - `flujos/admin-alta-comunidad.md`, `flujos/admin-usuarios-y-roles.md`, `flujos/admin-ocupaciones.md` y `flujos/residente-primer-ingreso.md`.
  - `arquitectura-de-informacion.md` y `mapa-de-usuarios.md` (UX-8, UX-15, UX-16, UX-30, UX-35, UX-40).
  - `wireframes/web-alta-comunidad.md` (WEB-ALT-04) y `wireframes/consola-plataforma.md` (CON-11).
- `docs/qa/`: `plan-de-pruebas.md` (sección 4, ISO-1 a ISO-9), `comunidades-simuladas.md` (Comunidades A a C, personas, ocupaciones O-1 a O-6, GOLD-A, GOLD-C, GOLD-CE y GOLD-A33) y `casos/gasto-comun.md` (TC-GC-CA19).

## Crítico

### C-1 · El contacto de ingreso "primero registrado" permite tomar una identidad y ver datos de otra comunidad

- **Ubicación:**
  - CM-C4, tercer punto ("El contacto de ingreso de una persona nueva es el primero que se registra para ella, sin verificar, hasta que lo verifique en su primer ingreso").
  - S-CM-17.
  - El caso borde "Dos comunidades registran contactos distintos…".
  - S-CM-16 (persona jurídica que ingresa con el RUT de la entidad).
- **Problema:**
  - La persona es global y la sesión también: un ingreso habilita todas sus membresías vigentes (ADR 0005, decisión 3; `docs/arquitectura.md` §3).
  - Si el administrador de la Comunidad A registra primero el RUT X con un contacto propio (por malicia o por error de digitación), todo código de ingreso de X va a ese contacto, aunque después la Comunidad B registre el contacto correcto.
  - Quien controle ese contacto verifica la cuenta y entra como X a la Comunidad B: ve la unidad y la deuda de X en B y, si X integra el comité de B, el registro de copropietarios y las deudas de terceros de B. Es una fuga entre comunidades (regla 4) y de datos personales (regla 7).
  - La protección de UX-30 y de `residente-primer-ingreso.md` solo cubre a quien ya tiene un contacto verificado. En la puesta en marcha nadie lo tiene, así que la ventana de riesgo abarca a toda la población inicial.
  - Con S-CM-16 el riesgo crece: una empresa propietaria en varias comunidades tiene representantes distintos en cada una, y el primero que verifica controla la identidad de la empresa en todas.
- **Corrección propuesta:**
  - Quitar la regla "el primero registrado es el contacto de ingreso" (CM-C4 y S-CM-17) y dejar el contacto sin verificar **por membresía**.
  - Fijar como requisito heredado para la rebanada "Ingreso e invitaciones" (CM-F3): mientras la persona no tenga un contacto verificado, solo ingresa con la invitación de una membresía; el código va al contacto registrado en **esa** membresía; esa verificación habilita solo las membresías cuyo contacto registrado coincide con el verificado, y las demás exigen su propia invitación o confirmación.
  - Para S-CM-16, agregar el riesgo a P-CM-10 y no aceptar personas jurídicas con ingreso compartido hasta que el líder y el abogado decidan.
  - Agregar un CA de aislamiento: X registrado en A con el contacto c1 y en B con c2; al verificar c1 por la invitación de A, la sesión no ve B.

## Mayor

### M-1 · CA-CM-8 espera 409 `PREVIEW_OUTDATED` donde corresponde 422 `ALIQUOTS_NOT_100`

- **Ubicación:** CA-CM-8, segundo "Cuando/Entonces"; CM-B7, tercer punto.
- **Problema:** después de editar solo el Depto 101 a 190000, la suma es 990.000 (99,0000 %). Al confirmar la emisión con la huella vieja, ADR 0003, decisión 9, paso 5 resuelve "estado (409) antes que reglas de entrada (422), y `PREVIEW_OUTDATED` al final, solo en la ejecución". La respuesta es 422 `ALIQUOTS_NOT_100`, no 409; QA derivaría una prueba que contradice el orden aprobado.
- **Corrección:** opción 1, hacer un cambio que mantenga la suma (la edición en bloque de CA-CM-7: Depto 101 a 190000 y Depto 202 a 310000) y esperar 409 `PREVIEW_OUTDATED`; opción 2, mantener el 99 % y esperar 422 `ALIQUOTS_NOT_100`. En los dos casos, ajustar CM-B7: el 409 aplica solo si cambia el resultado (GC A-7); cambiar el nombre de una unidad o agregar una unidad con 0 % no lo cambian.

### M-2 · Las lecturas transversales de Operaciones no tienen ADR que las autorice

- **Ubicación:** "Acciones de la rebanada" (`GET /platform/communities` y `GET /platform/communities/{communityId}/admin-memberships`); CM-A4; "Contradicciones y vacíos", punto 6.
- **Problema:**
  - ADR 0002, decisión 3 nombra `platform_webpay_review` como la "única lectura transversal" y exige actualizar ese ADR para agregar otra. ADR 0006, decisión 5 limita el módulo `platform` a esa vista, con el rol `comvive_platform` sin permiso sobre tablas base.
  - La lista de comunidades lee `COMMUNITY`, cuenta `MEMBERSHIP` y deriva el estado de `COMMUNITY_WEBPAY_MERCHANT` en todas las comunidades: es una segunda excepción a la regla 4. La spec la presenta solo como "faltan rutas en §3" y no dice que se audita con `community_id` nulo, como el listado de D46.
  - El diseño CON-11 (aprobado) muestra esas pantallas: la contradicción está entre el diseño y los ADR, y la spec no la identifica.
- **Corrección:** recomendado, sacar los dos `GET` de plataforma de la rebanada 1 (que no tiene web ni consola) y llevarlos a la tarjeta de la consola, con una actualización de ADR 0002 (decisión 3) y ADR 0006 (decisión 5): una vista propia, por ejemplo `platform_community_directory`, con columnas mínimas y su rol de base de datos. Si se mantienen, declararlos como excepción pendiente de ADR, sin pasar a "Lista para desarrollo" sin él. Agregarlo a "Contradicciones y vacíos".

### M-3 · El aviso "Esta persona ya tiene cuenta en ComVive" contradice la prueba ISO-7

- **Ubicación:** CM-C4, primer punto; CA-CM-12; caso borde "Persona que ya existe en otra comunidad".
- **Problema:**
  - `docs/qa/plan-de-pruebas.md`, ISO-7 (aprobado): "Actor de A busca personas por RUT, con un RUT que existe solo en B → Respuesta idéntica a la de un RUT inexistente; no revela la persona ni su comunidad". CA-CM-12 exige lo contrario.
  - `docs/arquitectura.md` §2 y §4 y `admin-ocupaciones.md` sí admiten el aviso: la contradicción ya estaba entre documentos aprobados y la spec toma partido sin registrarla.
  - En la práctica, cualquier administrador puede consultar RUT al azar y saber si una persona vive en un condominio o administra uno que usa ComVive. Bajo la Ley 21.719 eso es un dato personal.
- **Corrección:** registrar la contradicción y llevarla al líder (pregunta 2). Recomendación: respuesta idéntica, como pide ISO-7; la membresía se crea igual con el nombre y el contacto que registra la comunidad, y con C-1 corregido el aviso no hace falta. Si se mantiene el aviso, auditar cada vista previa con un RUT existente y limitar las consultas por administrador.

### M-4 · No se define qué responde un identificador ajeno en el cuerpo (ISO-5)

- **Ubicación:** "Acciones de la rebanada" ("Editar alícuotas y orden en bloque", "Otorgar comité o conserjería"); CM-B6; CA-CM-11 y CA-CM-23.
- **Problema:**
  - `POST .../units/bulk-update` lleva ids de unidad en el cuerpo. La spec no dice qué pasa con un id de otra comunidad, uno inexistente o uno repetido: podría ser 404 en el paso 4 (ADR 0003, decisión 9) o un error de fila dentro de 422 `UNITS_INVALID`, y la segunda opción revelaría si el id existe.
  - El cuerpo del otorgamiento de comité no define cómo se identifica a la persona (`personId` global, `membershipId` de residente o RUT) ni qué responde ese identificador si es de otra comunidad.
  - ISO-5 del plan exige estas pruebas en cada endpoint.
- **Corrección:** agregar a CM-B6 "Todo `unitId` del cuerpo que la persona no ve (de otra comunidad o inexistente) responde 404 `NOT_FOUND` en el paso 4, antes de la idempotencia y de validar las filas. Un `unitId` repetido en el lote responde 400." Fijar el identificador del otorgamiento de comité y su respuesta con un id ajeno. Sumar a CA-CM-11 y CA-CM-23 un caso de edición en bloque con un id de B y uno de otorgamiento de comité con una persona solo de B.

### M-5 · Permisos que no encajan en el guard de ADR 0009

- **Ubicación:** "Acciones de la rebanada" (otorgar, revocar, editar una unidad, editar en bloque, ocupaciones y tareas); CM-D2 y CM-D4; la nota "Los nombres de los tipos de recurso … los fija el arquitecto".
- **Problema:**
  - ADR 0009 fija **un** `permission` estático por ruta, verificado en el paso 3c y obligatorio en todo `POST`, `PATCH` y `DELETE` (verificación 6). La spec no lo da para `POST .../memberships` ("según el rol del cuerpo"), `POST .../memberships/{membershipId}/revoke` ("según el rol de la membresía") ni `bulk-update` ("`unit.write` y `community.billing.configure`").
  - El 403 por revocar una membresía `admin` depende del **recurso de la ruta**. Según `docs/arquitectura.md` §3 debe responder antes de la forma (JSON mal formado: 403, no 400), pero el guard no tiene un permiso por instancia y el servicio corre después del paso de forma.
  - Las rutas de ocupaciones (`unitId`, `occupancyId`) y de tareas (`taskId`) no declaran sus `pathResources`, que ADR 0009 exige (decisión 4, verificación 7).
  - ADR 0009, decisión 7, "Rebanada 1": "La spec de la rebanada define el tipo de recurso, los recursos de ruta y el permiso de cada uno". La spec dice que los fija el arquitecto.
- **Corrección:** declarar para cada ruta `resource`, `pathResources` y un único `permission`. Por ejemplo: otorgar, `role-grant` con `committee_role.grant` en el paso 3c, y `concierge_role.grant`, `admin` (403) y `resident` (422) en el paso 4; revocar, `membership` con `committee_role.grant`; ocupaciones, `{ unitId: 'unit' }` y `{ occupancyId: 'occupancy' }`; tareas, `{ taskId: 'admin-task' }`. Para el 403 de la membresía `admin`, elegir entre (a) extender ADR 0009 con un verificador de permiso por recurso de la ruta o (b) declarar como excepción explícita que ese 403 se evalúa después de la forma, actualizando §3 y su prueba. Quitar o corregir la frase sobre quién fija los nombres.

### M-6 · La eliminación de una unidad no revisa referencias del borrador vigente

- **Ubicación:** CM-B8; S-CM-12; CA-CM-9.
- **Problema:** la lista de lo que impide eliminar omite el conjunto de unidades de un gasto `partes_iguales` del borrador (GC C-2), un cargo directo del borrador (GC B-4), `INTEREST_STATE`, `ADMIN_TASK.unit_id` y `NOTIFICATION_DELIVERY.unit_id`. Eliminar una unidad que está en un conjunto de partes iguales cambia en silencio el reparto del borrador (reglas 2 y 3) o rompe una clave foránea. En la rebanada 1 no hay gastos, pero la regla la hereda la rebanada de emisión.
- **Corrección:** reescribir CM-B8 como "solo si ninguna fila de negocio la referencia", con la lista completa. Dejar en la spec de emisión un CA con TDD: un gasto de partes iguales con la unidad en su conjunto da 409 `UNIT_IN_USE`.

### M-7 · Término y venta sin traspaso, con un texto fijo que afirma algo sobre dinero

- **Ubicación:** CM-E6; P-CM-4; CA-CM-14, cuarto "Entonces".
- **Problema:** la vista previa del término mostraría siempre "El arrendatario no tiene deuda ni saldo a favor. No se moverá dinero.". El término "cambia el responsable de una deuda" (ADR 0003, decisión 5) y el traspaso es materia de TDD. Con desarrollo trunk-based, si la rebanada del libro se activa sin reemplazar ese camino, o si se cargan saldos de apertura, la pantalla afirmaría algo falso y el término no movería la deuda al ámbito `owner` (GC F-9 y F-13). La huella del término (GC A-7) incluye los movimientos del traspaso, y un texto fijo la vacía.
- **Corrección:** elegir y dejar escrita una de dos: (a) implementar ya el cálculo del traspaso contra el puerto del libro, vacío en la rebanada 1, con sus pruebas, y derivar el texto del resultado; o (b) dejar término y venta detrás de un feature flag apagado hasta la rebanada del libro (alternativa de P-CM-4). En los dos casos, la rebanada del libro no se activa sin el traspaso.

### M-8 · La membresía única de residente no define cambios de fecha, nombre ni contacto

- **Ubicación:** CM-D5, primer y tercer punto; CM-C4, segundo punto; CA-CM-15.
- **Problema:**
  - (a) Una persona con solo una ocupación programada tiene su membresía con `valid_from` futuro. Si después se le registra una ocupación vigente, no se dice si se modifica `valid_from` (auditoría, `first_access_at`) o se crea otra; mientras tanto, la persona recibe 404 en la unidad que ya es suya.
  - (b) Si la segunda ocupación trae otro nombre u otro contacto, no se dice si se sobrescribe, se ignora o se rechaza. De eso dependen el nombre que ve el propietario (S-44) y el contacto de las notificaciones.
  - (c) Con varios roles, una persona puede quedar con dos nombres distintos en la misma comunidad.
- **Corrección:** fijar (a), por ejemplo "si la membresía de residente tiene `valid_from` futuro y se registra una ocupación vigente, `valid_from` pasa a la fecha efectiva de esa ocupación, con auditoría `membership.update_validity`"; fijar (b), por ejemplo "se conserva lo registrado; para cambiarlo, la corrección de CM-C6"; un CA por caso. Evaluar guardar nombre y contacto por (persona, comunidad) en vez de por membresía, lo que también evita (c).

### M-9 · El nombre del administrador es requisito del aviso legal y nadie lo pide

- **Ubicación:** CM-C1 (fila Administrador: "Obligatorio (P-CM-6)"); P-CM-6; "Contradicciones y vacíos", punto 3.
- **Problema:** la tabla dice que el nombre es obligatorio, pero ni el alta ni el otorgamiento lo piden (GC S-63), y P-CM-6 propone mostrar "Nombre pendiente". GC G-2 exige el nombre del administrador en el aviso y G-3 su identificación como firma, de la que depende el mérito ejecutivo (Ley 21.442, art. 32). Con "Nombre pendiente", la rebanada de emisión no podría generar un aviso válido.
- **Corrección:** corregir la tabla de CM-C1; agregar a P-CM-6 la dependencia con G-2 y G-3 y la condición de resolverla antes de que la rebanada de emisión pase a "Lista para desarrollo"; agregarla a "Contradicciones y vacíos".

## Menor

1. **Citas inexactas.**
   - "Sin participación" se cita como GC C-5, pero C-5 trata de los cargos de $0; la etiqueta viene de `admin-alta-comunidad.md`, paso 4.
   - GC no define los tipos de recurso `owner-roster` ni `admin-task` (solo el permiso y quién ve): "Ya definido en GC" sobra.
   - GC S-36 y ADR 0003, decisión 6 exigen idempotencia en escrituras de dinero o de responsable de deuda; extenderla a toda escritura es una decisión nueva y debe decirse así.
   - `docs/arquitectura.md` §4 asigna `owner_roster.read` al historial de ocupaciones; la spec lo deja como lectura de `occupancy`. Alinear.
   - `docs/arquitectura.md` §3 dice que el administrador "otorga y revoca … residentes": agregar ese desajuste a "Contradicciones y vacíos".
2. **`sort_order` cae en dos recursos y dos permisos.** GC S-53 lo pone en "Configuración de cobro" y la spec en `unit-config`, con un 403 que depende del cuerpo. Hoy solo el administrador tiene cualquiera de los dos permisos. Propuesta: `unit.write` cubre el orden y la fila de GC S-53 se actualiza en el mismo cambio.
3. **Tope de 1.000 filas frente al límite de 100 kB (ADR-0009-S3).** 1.000 filas con `unitId` superan los 100 kB y responden 413 antes del guard, no el 400 que dice CM-B6. Bajar el tope (por ejemplo, 500) o pedir la excepción de tamaño en ADR 0009.
4. **`UNITS_INVALID` incompleto.** No dice qué fila se marca cuando dos filas chocan entre sí; el cuerpo con la lista de filas es un esquema de error nuevo para el contrato OpenAPI (ADR 0003, decisión 1); en el lote el motivo va antes que las filas y en la unidad suelta después de los datos (explicar o igualar); un 409 de fila queda dentro de un 422 (decirlo).
5. **Semántica del `PATCH` de la comunidad.** Tras el alta, dirección, comuna y tipo quedan nulos. Falta decir si cada `PATCH` trae todos los obligatorios o si "obligatorio" significa "no se puede vaciar", y el código para un tipo ausente o vacío. CA-CM-2 depende de esa definición.
6. **Largos máximos.** Un código de más de 30 caracteres y un nombre de más de 120 responden 400 con "Actualiza la aplicación", pero GC S-70 dice que las pantallas no deberían producir un 400. Fijar `maxLength` en el contrato y en la interfaz, o dar un 422 con texto.
7. **Corrección de contacto (CM-C6) incompleta.** No dice qué responde `PATCH .../contact` sobre una membresía `admin` ni si se puede rectificar una membresía revocada (derecho de la Ley 21.719). Faltan los CA.
8. **Vigencia de comité y conserjería.** No se dice si `POST .../memberships` acepta `valid_from` o `valid_to`. `docs/arquitectura.md` §5 afirma que en el MVP ninguna membresía termina por `valid_to`. Fijar: "no se aceptan; 400".
9. **`aliquotSumE6` y la advertencia para residentes.** CM-B4 los devuelve en el listado de unidades, que también consume el residente. Fijar que solo los reciben el administrador y el comité.
10. **Precisión de los CA.** CA-CM-14 no dice qué día es "hoy" (si es anterior a 2026-12-01, responde `END_DATE_IN_FUTURE` antes que `BUYER_IS_CURRENT_TENANT`); CA-CM-18 debe fijar la fecha del otorgamiento de comité de Rosa Díaz; CA-CM-19 ("Deuda del arrendatario Pedro Soto") no es verificable sin libro: verificar el nombre en otra respuesta.
11. **Prueba de oro de CA-CM-7.** Los montos nuevos (199.500, 262.500, 262.500 y 325.500) son correctos, pero no están en `docs/qa/comunidades-simuladas.md` como prueba de oro (regla 2). Registrarlos, por ejemplo como `GOLD-ACM7`, y precisar que lo del Depto 101 son dos notas de crédito (−$10.000 ordinario y −$500 fondo), como GOLD-A33-01.
12. **Historial de roles.** En los otorgamientos de Operaciones, "Quién" debe ser "Operaciones ComVive" y no la persona del equipo (CON-11; `admin-usuarios-y-roles.md`).
13. **Residentes sin RUT.** UX-40 incluye residentes sin RUT (extranjeros con pasaporte) y S-CM-15 hace obligatorio el RUT del arrendatario. Agregar el caso borde, su supuesto y su pregunta.
14. **Conserjería en la rebanada 1.** Se pide el RUT de un trabajador para un rol que en esta rebanada no hace nada, contra la minimización (regla 7) y el diseño ("Posterior"). Faltan reglas (¿un administrador puede ser conserje? ¿un conserje es residente?). Recomendación: posponerla (P-CM-8).
15. **Orden natural del código.** No define desempates entre "Depto 09" y "Depto 9" ni el trato de tildes y "ñ". Fijar un desempate final por el texto normalizado.
16. **Alerta S-72 en la rebanada 1.** Como nadie puede ingresar (D37), la alerta de "administrador sin primer ingreso" se dispararía para todo administrador del ambiente de pruebas. Decir si `membership.admin_first_access_alert` se encola en la rebanada 1 y si queda tras un flag.
17. **Auditoría visible.** CM-G4 no incluye los cambios de unidades y alícuotas ni dice si el comité ve la auditoría. Precisar.

## Observaciones

- **`role-grant` como recurso que el comité "ve" sin poder leerlo:** construcción formal para cumplir GC CA-43 (403) y el diseño (404 en "Usuarios y roles"). Aceptable y bien justificada; conviene escribir en la matriz que no tiene lectura.
- **CM-F1 (F4 en una rebanada propia):** la justificación es correcta y coherente con D37 y ADR 0005. Con C-1, CM-F3 debe sumar el requisito del contacto por membresía.
- **Complejidad:** `units/batch` y `units/bulk-update` podrían ser un solo endpoint de lote. Los dos `GET` de plataforma y la conserjería no son necesarios en una rebanada sin web ni consola; sacarlos reduce superficie, pruebas y dependencias de ADR.

## Lo que se verificó y cuadra

- **Montos de CA-CM-3:** alícuotas de la Comunidad C (185.000 + 195.000 + 200.000 + 210.000 + 210.000 = 1.000.000) y `sort_order` 11 = 1 a 31 = 5, iguales a GOLD-C y GOLD-CE. Fondo de $58.789 con la fórmula de techo. Bodega B1 con 0 y orden 6, igual que GC CA-18.
- **Montos de CA-CM-5:** iguales a GC CA-19 (209.900, suma 999.900).
- **Montos de CA-CM-7, recalculados a mano:** fondo (1.000.000 × 500 + 9.999) div 10.000 = $50.000; Depto 101: 190.000 + 9.500 = $199.500; Depto 102 y 201: $262.500; Depto 202: 310.000 + 15.500 = $325.500; suma $1.050.000 (regla 3); GOLD-A33-01 = −$10.500 con la foto del 20 %.
- **CA-CM-4:** suma de 2.000.000 y texto de la advertencia igual a WEB-ALT-04.
- **RUT de los CA:** módulo 11 verificado a mano para 15.234.567-4 (y que −9 es inválido), 22.456.789-8, 9.876.543-3, 18.234.765-5, 13.579.246-2 y 12.345.670-K; coinciden con `comunidades-simuladas.md`.
- **Personas y ocupaciones de los CA:** Rosa Díaz, Ana Pérez, Luis Muñoz, Marco Silva, Juan Castro, Felipe Rojas y O-1, O-4 y O-5 coinciden con los datos de prueba.
- **Coherencia con GC:** las citas de S-33, S-34, S-43, S-44, S-63, S-68, S-72, S-79, S-81, S-85, S-86, M-7, F-14, A-3.1, A-3.8, A-7, C-4 y G-5 son exactas; el orden de otorgar comité (S-34) se reproduce sin cambios; `REASON_REQUIRED` y `OCCUPANCY_CANCELLED` usan los textos existentes; ninguna regla de GC aparece duplicada con otra redacción.
- **Regla 6:** CM-B7 respeta la foto de participaciones (ADR 0004, decisión 7): sin recálculo de periodos emitidos ni cerrados.
- **Regla 1:** alícuota como entero `aliquotE6` y conversión sin punto flotante en `packages/shared`, coherentes con `docs/arquitectura.md` §4. `INVALID_ALIQUOT` como código propio es coherente con GC S-70.
- **Contradicciones 4, 5, 6 (parcial), 8 y 9 de la spec:** verificadas contra la fuente (por ejemplo, `admin-usuarios-y-roles.md` línea 81 contradice GC S-81, y `MEMBERSHIP` no tiene correo).
- **Órdenes nuevos:** término (estado antes que fecha) y eliminación (estado antes que motivo) siguen GC CA-61 y ADR 0003. `OWNER_CANNOT_BE_TENANT` antes que `TENANT_ALREADY_ACTIVE` está declarado como excepción en S-CM-2.
- **Aislamiento:** CA-CM-11 y CA-CM-23 cubren las dos vías del plan (guard y capa de datos), el 404 antes del cuerpo (ADR 0009, paso 3b), la unicidad del código por comunidad y el barrido de la prueba 10.

## Preguntas para el líder del proyecto

1. **(C-1)** ¿Acepta que, mientras una persona no tenga contacto verificado, el contacto sin verificar sea por membresía y que verificarlo habilite solo las membresías con ese mismo contacto? ¿Se posponen las personas jurídicas con ingreso compartido (S-CM-16) hasta la respuesta del abogado?
2. **(M-3)** ISO-7 del plan de pruebas y la arquitectura (§2 y §4) se contradicen sobre revelar que un RUT ya tiene cuenta en ComVive. ¿Cuál rige? La recomendación es la respuesta idéntica de ISO-7.
3. **(M-2)** ¿Se sacan de la rebanada 1 las lecturas de la consola de Operaciones y se llevan a la tarjeta de la consola con la actualización de ADR 0002 y ADR 0006, o se pide ahora esa actualización al arquitecto?
4. **(Menor 14; P-CM-8)** ¿Se incluye la conserjería en la rebanada 1, aunque el conserje no tenga ninguna función y se pida su RUT?
5. **(M-7; P-CM-4)** ¿Término y venta en la rebanada 1 con el cálculo del traspaso contra un libro vacío (opción a) o detrás de un flag apagado hasta la rebanada del libro (opción b)?
6. **(M-9; P-CM-6)** ¿Cómo se obtiene el nombre del administrador, que exigen el aviso y su firma (GC G-2 y G-3)? ¿Debe estar resuelto antes de la rebanada de emisión?
7. **(Menor 13)** ¿Cómo se registran arrendatarios o propietarios sin RUT (extranjeros con pasaporte, UX-40)?

## Resolución

El líder del proyecto respondió las siete preguntas el 2026-11-11 (D47 a D53, registradas en la spec, sección "Decisiones del líder del proyecto"). El analista-producto incorporó los cambios en la rev. 2 de `docs/specs/comunidades-y-membresias.md`, que queda en "Para revisión del líder del proyecto" y pendiente de la segunda pasada del revisor crítico, y agregó la prueba de oro GOLD-ACM7 a `docs/qa/comunidades-simuladas.md`. Los documentos aprobados que deben alinearse (`docs/arquitectura.md` §2, §3 y §4, `docs/design/flujos/admin-ocupaciones.md`, `docs/design/flujos/residente-primer-ingreso.md`, GC S-53 y S-63, ADR 0002, 0003, 0005, 0006 y 0009) no se editaron: quedan en "Contradicciones y vacíos en documentos aprobados" de la spec, con su responsable. Las referencias de la tabla son de la spec rev. 2.

| Hallazgo | Estado | Cómo se resolvió |
| --- | --- | --- |
| C-1 Contacto de ingreso "primero registrado" | Resuelto (D47) | Se elimina la regla (CM-C4; S-CM-17 retirado). Nombre y contacto en una ficha por (persona, comunidad), que también resuelve M-8 (c) (S-CM-21). Requisito heredado en CM-F3: sin contacto verificado, solo se ingresa por invitación con el código al contacto de esa comunidad; verificarlo habilita solo las comunidades que registran ese contacto; las demás reciben el código en su propio contacto; la sesión queda limitada a lo habilitado (P-CM-18 para ADR 0005). Personas jurídicas con ingreso compartido pospuestas (S-CM-16, P-CM-10). CA-CM-24 |
| M-1 CA-CM-8 con 409 en vez de 422 | Resuelto | CA-CM-8 con tres escenarios: lote que mantiene el 100 % (409 `PREVIEW_OUTDATED`), edición suelta al 99 % (422 `ALIQUOTS_NOT_100`, porque `PREVIEW_OUTDATED` va al final) y cambio de código (la emisión procede). CM-B7: el 409 aplica solo si cambia lo que se va a escribir (GC A-7) |
| M-2 Lecturas transversales de Operaciones sin ADR | Resuelto (D49) | Los dos `GET` de plataforma salen de la rebanada y van a la tarjeta de la consola, con actualización de ADR 0002 (decisión 3) y ADR 0006 (decisión 5) y una vista propia (CM-A4; "Fuera de alcance"; "Contradicciones y vacíos", punto 6). CA-CM-1 ya no verifica la lista |
| M-3 Aviso "ya tiene cuenta" contra ISO-7 | Resuelto (D48) | Rige ISO-7: vista previa idéntica a la de un RUT inexistente, sin aviso (CM-C4; CA-CM-12 reescrito con un RUT inexistente de control). Solo dentro de la misma comunidad la vista previa dice que la persona ya está registrada (CA-CM-25). Alineación de `docs/arquitectura.md` §2 y §4 y `admin-ocupaciones.md` en "Contradicciones y vacíos", punto 11 |
| M-4 Identificador ajeno en el cuerpo | Resuelto | CM-B6: `unitId` no visible, 404 en el paso 4 antes de la idempotencia y de las filas; repetido, 400. CM-D2: el comité se otorga por `personRecordId` (ficha de la comunidad); uno ajeno o inexistente, 404 en el paso 4. CA-CM-11 y CA-CM-23 con esos casos |
| M-5 Permisos que no encajan en el guard | Resuelto, con pregunta | Tabla de acciones con `resource`, `pathResources` y un único `permission` por ruta (otorgar: `role-grant` con `committee_role.grant`; revocar: `membership` con `committee_role.grant`; lote: `unit.write`; ocupaciones `{ unitId: 'unit' }` u `{ occupancyId: 'occupancy' }`; tareas `{ taskId: 'admin-task' }`; historial con `owner_roster.read`). Se quita "los fija el arquitecto". El 403 por el recurso de la ruta queda como excepción E-CM-1, opción (b) recomendada (paso 4, después de la forma), con P-CM-17 para el arquitecto y el líder; CA-CM-16 y CA-CM-19 la usan |
| M-6 Eliminación sin revisar el borrador | Resuelto | CM-B8: "ninguna fila de negocio la referencia", con la lista completa (partes iguales y cargos directos del borrador, `INTEREST_STATE`, `ADMIN_TASK`, `NOTIFICATION_DELIVERY`, etc.), regla para tablas futuras con prueba sobre las claves foráneas y CA heredado con TDD para la rebanada de emisión. CA-CM-9 y S-CM-12 |
| M-7 Término y venta sin traspaso, con texto fijo | Resuelto (D51) | Flag `occupancy.end_and_transfer` apagado; con él apagado, 422 `OCCUPANCY_ACTION_NOT_AVAILABLE` (S-CM-30). Sin libro, la vista previa no trae sección ni texto sobre dinero. La rebanada del libro no puede activar el flag sin el traspaso con TDD (CM-E6). P-CM-4 cerrada. CA-CM-14 sin afirmación sobre la deuda y CA-CM-26 nuevo |
| M-8 Membresía única de residente | Resuelto | (a) `valid_from` se adelanta con auditoría `membership.update_validity`, nunca se atrasa (CM-D5, S-CM-26, CA-CM-15). (b) Un registro posterior conserva la ficha; la vista previa lo dice y se cambia con CM-C6 (CA-CM-25). (c) Una ficha por (persona, comunidad): un nombre por comunidad (S-CM-21) |
| M-9 Nombre del administrador | Resuelto (D52) | Obligatorio en el alta y al otorgar `admin`, con `PERSON_NAME_REQUIRED` entre `INVALID_RUT` e `INVALID_CONTACT`; reemplaza la ficha existente (S-CM-22). Extiende GC S-63 (lo registra el coordinador); implementado en esta rebanada, antes de que la de emisión pase a "Lista para desarrollo" (CM-A2, CM-C1, CA-CM-1, CA-CM-27). P-CM-6 cerrada; la corrección posterior queda en P-CM-16 |
| Menor 1 Citas inexactas | Resuelto | "Sin participación" citado a `admin-alta-comunidad.md`, paso 4, y GC CA-18; `owner-roster` y `admin-task` como tipos que fija esta spec; idempotencia en toda escritura declarada como decisión nueva (S-CM-23, P-CM-14); historial de ocupaciones con `owner_roster.read`; "otorga y revoca … residentes" de §3 en "Contradicciones y vacíos", punto 14 |
| Menor 2 `sort_order` en dos recursos | Resuelto | `unit.write` cubre el orden en `unit-config`; cambio a GC S-53 y "Usuarios y permisos" en "Contradicciones y vacíos", punto 13 |
| Menor 3 Tope de 1.000 filas y 100 kB | Resuelto | Tope de 500 filas (unos 75 kB), con 422 `UNITS_BATCH_TOO_LARGE` (CM-B6, S-CM-8) |
| Menor 4 `UNITS_INVALID` incompleto | Resuelto | Se marca la fila de mayor posición con textos propios; esquema de error nuevo para el contrato OpenAPI; el motivo del lote va después de las filas, con la razón escrita; los conflictos de fila van dentro del 422 con su propio código (CM-B6; "Orden de validación por acción") |
| Menor 5 Semántica del `PATCH` de la comunidad | Resuelto | `PATCH` parcial; "obligatorio" = no se puede vaciar; `COMMUNITY_TYPE_REQUIRED` nuevo; tipo fuera de lista, 400 (CM-A3, CA-CM-2) |
| Menor 6 Largos máximos con 400 | Resuelto | `maxLength` en el contrato y en la interfaz para cada texto, así las pantallas no producen el 400 ("Códigos y mensajes de error nuevos") |
| Menor 7 Corrección de contacto incompleta | Resuelto | Corrección sobre la ficha; administrador vigente, 403 (E-CM-1); ex residentes, se puede (S-CM-29); CA-CM-19 con esos casos |
| Menor 8 Vigencia de comité | Resuelto | `validFrom` y `validTo` no se aceptan, 400 (CM-D2, CA-CM-16) |
| Menor 9 Suma de alícuotas para residentes | Resuelto | Solo la reciben el administrador y el comité (CM-B4, CA-CM-10) |
| Menor 10 Precisión de los CA | Resuelto | CA-CM-14 fija "hoy" 2026-12-02 y fechas pasadas; CA-CM-18 fija el otorgamiento de Rosa Díaz el 2026-10-22; CA-CM-19 verifica el nombre en el historial de ocupaciones |
| Menor 11 Prueba de oro de CA-CM-7 | Resuelto | GOLD-ACM7-01 a 05 en `docs/qa/comunidades-simuladas.md`, con cálculo paso a paso, las dos notas de crédito (−$10.000 y −$500) y un contraste con la alícuota actual, marcada "Para revisión del líder del proyecto" |
| Menor 12 "Quién" en el historial de roles | Resuelto | "Operaciones ComVive" en los otorgamientos de vía `platform` (CM-D7, CA-CM-18) |
| Menor 13 Residentes sin RUT | Resuelto (D53) | Solo personas con RUT o RUN; sin RUT no hay ocupación propia y la deuda queda en `owner` (CM-C7, S-CM-15, P-CM-19, CA-CM-28) |
| Menor 14 Conserjería en la rebanada 1 | Resuelto (D50) | Pospuesta: sin roles, permisos, CA ni datos del conserje (CM-D3; CA-CM-17 y S-CM-14 retirados; P-CM-8 cerrada) |
| Menor 15 Orden natural del código | Resuelto | Desempates independientes de la configuración regional (CM-B5, S-CM-24) |
| Menor 16 Alerta S-72 en la rebanada 1 | Resuelto | Detrás del flag `platform.admin_first_access_alert`, apagado hasta la rebanada de ingreso; el plazo cuenta desde el encendido (CM-A5, S-CM-27, CA-CM-1) |
| Menor 17 Auditoría visible | Resuelto | El administrador verá también unidades, alícuotas, datos de la comunidad y fichas; el comité no ve la auditoría (CM-G4, S-CM-28) |
| Observación 1 `role-grant` sin lectura | Anotada | La matriz dice que `role-grant` no tiene lectura y existe solo para otorgar |
| Observación 2 CM-F1 y el contacto por membresía | Resuelto | CM-F3 suma el requisito de habilitación por contacto (C-1, D47) |
| Observación 3 Complejidad | Resuelto | Un solo endpoint de lote (`POST …/units/batch`) para altas y ediciones; fuera los `GET` de plataforma (D49) y la conserjería (D50) |
