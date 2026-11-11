# Revisión crítica: spec "Comunidades, unidades y membresías" (rev. 1)

- **Fecha:** 2026-11-11
- **Revisor:** agente `revisor-critico`. El coordinador guarda el informe.
- **Entregable:** `docs/specs/comunidades-y-membresias.md`, rev. 1, borrador del analista-producto, rama `docs/spec-comunidades-y-membresias`.
- **Base revisada:** el archivo completo (667 líneas): alcance, matriz de recursos, acciones, errores, órdenes de validación, reglas A a G, CA-CM-1 a CA-CM-23, casos borde, supuestos S-CM-1 a S-CM-20, preguntas P-CM-1 a P-CM-15 y "Contradicciones y vacíos".
- **Veredicto:** **Rechazado** (un crítico, C-1; nueve mayores). La estructura es sólida y la mayoría de las citas son exactas; las correcciones son acotadas y no obligan a rehacer la spec.
- **Estado de la resolución:** rev. 3 incorporada; tercera pasada: Aprobado con cambios (R3-M-1 a R3-M-3); pendiente de las respuestas del líder a sus preguntas 1 a 5.

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

## Segunda pasada (rev. 2)

### Base revisada

- **Fecha:** 2026-11-11. **Revisor:** agente `revisor-critico`.
- **Entregable:** `docs/specs/comunidades-y-membresias.md` rev. 2 (854 líneas, completa), la prueba de oro GOLD-ACM7 de `docs/qa/comunidades-simuladas.md` y la tabla "Resolución" de este informe.
- **Contrastado con:** `CLAUDE.md`; GC rev. 9 ("Respuestas de error", S-53, tabla de errores, "Validaciones de la consola de Operaciones ComVive" con S-63, S-72 y D27, CA-33 y CA-43); `docs/arquitectura.md` §2, §3, §4 (modelo `MEMBERSHIP`) y "Cuando haga falta"; ADR 0002 (decisión 3), ADR 0003 (decisiones 3, 6 y 9), ADR 0005 (decisiones 1 y 3) y ADR 0009 (decisiones 2 a 4, 6 y 7); `docs/design/wireframes/consola-plataforma.md` (CON-11) y los flujos de `docs/design/flujos/`.

### Veredicto

**Rechazado.** Hay un crítico: R2-C-1, un camino que sigue abierto hacia la fuga de C-1 por el contacto del administrador. Además hay cuatro mayores. Casi toda la rev. 2 resuelve bien la primera pasada; las correcciones son acotadas.

### Verificación de la primera pasada

| Hallazgo | ¿Resuelto en el texto? | Observación |
| --- | --- | --- |
| C-1 | **Parcial** | La ficha por (persona, comunidad), CM-C4, CM-F3 y CA-CM-24 están en el texto. Quedan abiertos dos caminos: el contacto del administrador (R2-C-1) y la corrección o el reemplazo del contacto junto con las acciones de identidad (R2-M-1) |
| M-1 | Sí | CA-CM-8 tiene los tres escenarios y CM-B7 está corregido; coherente con ADR 0003, decisión 9, paso 5 |
| M-2 | Sí | CM-A4, "Fuera de alcance", el punto 6 y CA-CM-1 |
| M-3 | Sí | CM-C4, CA-CM-12, CA-CM-25 y el punto 11 |
| M-4 | Sí | CM-B6, CM-D2, CA-CM-11 y CA-CM-23. Falta el orden dentro del paso 4 al otorgar (R2-m-2) |
| M-5 | Sí, con reparos | Todas las rutas tienen `resource`, `pathResources` y un único `permission`, coherentes con ADR 0009. Hay dos inconsistencias en E-CM-1 (R2-m-1 y R2-m-2) |
| M-6 | Sí | CM-B8 trae la lista completa. Faltan las referencias sin clave foránea (R2-m-6) |
| M-7 | Sí | CM-E6, CA-CM-14 y CA-CM-26. Falta definir el mecanismo del flag (R2-M-3) |
| M-8 | Sí | (a) CM-D5 y CA-CM-15; (b) CA-CM-25; (c) la ficha |
| M-9 | Sí en la spec, no en la lista de alineación | El formulario de CON-11 no pide el nombre (R2-M-2) |
| Menores 1 a 14 y 17 | Sí | Verificados uno a uno contra el texto de la rev. 2 |
| Menor 15 | Parcial | No define la normalización Unicode y "código normalizado" es ambiguo (R2-m-5) |
| Menor 16 | Parcial | CM-A5 cambia desde cuándo corre el plazo de GC S-72, aprobada, y no aparece en "Contradicciones" (R2-M-2) |
| Observaciones 1 a 3 | Sí | — |

**M-5, ruta por ruta.**

- **Rutas de plataforma:** `POST /platform/communities` no tiene parámetros y es uno de los usos de `runInCommunity` de la lista cerrada de ADR 0009; la revocación declara `{ membershipId: 'admin-membership' }`, que está en `PlatformPathResource`; otorgar administrador no tiene más parámetros que `communityId`, verificado en el paso 3b.
- **Rutas de comunidad:** cada parámetro está declarado (verificación 7) y todo `POST`, `PATCH` y `DELETE` lleva permiso (verificación 6).
- **Lectura con permiso:** el `GET` del historial de ocupaciones con `owner_roster.read` está permitido y coincide con `docs/arquitectura.md` §4.
- **Tareas:** `admin-task` con `committee_role.grant` coincide con §4.
- **Coherencia con GC S-53:** `role-grant` da 403 al comité (GC CA-43); `membership` da 404 al comité; `unit-config` da 404 al residente y 403 al comité.

**GOLD-ACM7, recalculado a mano.**

| Concepto | Cálculo | Resultado |
| --- | --- | --- |
| Fondo | (1.000.000 × 500 + 9.999) div 10.000 = 500.009.999 div 10.000 | $50.000 |
| Depto 101 | 1.000.000 × 0,19 = 190.000; 50.000 × 0,19 = 9.500 | $199.500 |
| Deptos 102 y 201 | 250.000 + 12.500 | $262.500 cada uno |
| Depto 202 | 310.000 + 15.500 | $325.500 |
| Suma | 199.500 + 262.500 + 262.500 + 325.500 | $1.050.000 (regla 3) |
| Notas de crédito del Depto 101, con la foto del 20 % | O corregido 950.000; F = 475.009.999 div 10.000 = 47.500. Ordinario 190.000 − 200.000 = −10.000; fondo 9.500 − 10.000 = −500 | −$10.500, igual a GOLD-A33-01 y GC CA-33 |
| Contraste con el 19 % | 180.500 − 200.000 = −19.500; 9.025 − 10.000 = −975 | −$20.475 |

Todos los montos son correctos y todos los productos son exactos. Falta precisar en qué periodo caen las notas (R2-M-4).

### R2 · Crítico

#### R2-C-1 · El contacto del administrador se toma del "contacto verificado" de otra comunidad

- **Ubicación:** CM-C1, fila Administrador, columna "Celular o correo" ("Obligatorio si la persona no tiene cuenta en ComVive (GC S-63)"); "Orden de validación por acción", Otorgar administrador ("`INVALID_CONTACT` (solo si la persona no tiene cuenta en ComVive, GC S-63)"). Lo heredan GC "Validaciones de la consola…", segundo punto ("Si la persona ya tiene cuenta en ComVive … se usa su contacto verificado y no se pide de nuevo") y CON-11, línea 469 y fila "Otorgar administrador: 2".
- **Problema:**
  - D47 prohíbe que un contacto registrado o verificado por una comunidad sirva para otra (CM-C4, último punto; CM-F3). La regla que se mantiene hace justo eso con el rol de mayor privilegio:
    1. El administrador malicioso de A registra a X con el contacto c_att.
    2. El atacante verifica c_att con la invitación de A; c_att queda como contacto verificado de `PERSON` X.
    3. Operaciones otorga a X el rol `admin` en C sin pedir contacto, porque "ya tiene cuenta".
    4. La ficha o la invitación de C usan c_att, y el atacante entra como administrador de C: ve RUT, deudas y el registro completo de otra comunidad (reglas 4 y 7).
  - En la rebanada 1, donde nadie tiene contacto verificado, "tiene cuenta" equivale a "existe `PERSON`": la ficha de C nace sin contacto (su administrador nunca podría ser invitado) o con el contacto copiado de la ficha de A, que es exactamente C-1.
  - Que el campo sea opcional según la persona revela a Operaciones si el RUT ya existe en ComVive.
- **Corrección:** en el alta y en cada otorgamiento de `admin`, el celular o correo es **siempre obligatorio** y se guarda solo en la ficha de esa comunidad; nunca se copia de `PERSON` ni de otra ficha. `INVALID_CONTACT` queda sin la condición en los dos órdenes y en CM-C1. Agregar a CA-CM-27: Felipe Rojas, administrador de B con contacto verificado, recibe `admin` en A sin contacto y la respuesta es 422 `INVALID_CONTACT`. Registrar en "Contradicciones y vacíos" el cambio a GC S-63 (coordinador) y a CON-11 (diseñador). Con esto, S-CM-22 queda sin ambigüedad.

### R2 · Mayor

#### R2-M-1 · CM-F3 no cierra la corrección del contacto ni las acciones de identidad desde una sesión limitada

- **Ubicación:** CM-C6, último punto; CM-A2 / S-CM-22; CM-F3; CA-CM-24; P-CM-18.
- **Problema:**
  - **(a) La habilitación no tiene momento de evaluación.** Si se fija al verificar, corregir un contacto mal digitado (el remedio de C-1 dentro de A) no saca a quien ya lo verificó: el intruso conserva acceso a la unidad y la deuda de X. Si se evalúa en cada petición, el reemplazo que hace Operaciones (S-CM-22) corta en silencio el acceso de una propietaria a su comunidad.
  - **(b) La sesión limitada sigue siendo de identidad.** Nada impide que, desde las rutas `/me/` ("Mi cuenta", "Mis comunidades", segundo factor, otras sesiones), se agreguen o cambien contactos verificados, se active un segundo factor o se cierren sesiones, lo que afecta a las demás comunidades de X: toma de la cuenta o denegación de servicio entre comunidades.
  - **(c)** No se dice a qué contacto va el código en un ingreso normal de una persona con varios contactos verificados; ADR 0005 dice "único por persona".
- **Corrección:** fijar en CM-F3 como requisitos heredados: (1) la habilitación se evalúa en cada petición, como la membresía (ADR 0005, decisión 3); (2) corregir o reemplazar el contacto de una ficha deshabilita esa comunidad para las sesiones obtenidas con el contacto anterior desde la petición siguiente, con auditoría (CA-CM-19 lo verifica en la rebanada de ingreso); (3) una sesión limitada no modifica datos de identidad que afecten a comunidades no habilitadas, y "Mis comunidades" lista solo las habilitadas; (4) el ingreso normal envía el código a cada contacto verificado y la sesión queda limitada al contacto con que se ingresó, u otra regla equivalente que elija el arquitecto. Sumar estos puntos a P-CM-18 y a CA-CM-24.

#### R2-M-2 · La lista "Contradicciones y vacíos" está incompleta

Faltan, con su responsable:

1. GC S-63 y CON-11, por el contacto del administrador (R2-C-1).
2. CON-11, formulario "Crear comunidad" (líneas 448 a 457) y "Otorgar administrador": no tienen el campo nombre ni `PERSON_NAME_REQUIRED` (D52). El punto 3 dice "CON-11 lo muestra", pero solo lo muestra en la tabla, no lo pide.
3. ADR 0005, decisión 1 y su supuesto ("contacto de ingreso verificado de `PERSON` (único por persona)"); el punto 12 solo cita la decisión 3.
4. ADR 0009, decisión 3, paso 2 (el guard deberá considerar la habilitación por contacto además de la membresía vigente) y `docs/arquitectura.md` §2, fila "Mis comunidades".
5. GC S-72 y D27: CM-A5 cambia desde cuándo cuenta el plazo de 7 días (extensión de una regla aprobada que registra el coordinador).
6. `docs/arquitectura.md` §3, lista de permisos (línea 134); el punto 16 solo cita ADR 0003 y ADR 0009.
7. Diseño: no existe la acción "Corregir datos" que cita la vista previa de CM-C4, ni una pantalla para corregir la ficha (`admin-usuarios-y-roles.md` y `admin-ocupaciones.md`).
8. El mecanismo de feature flags (R2-M-3).

#### R2-M-3 · Dos feature flags sin mecanismo ni dueño

- **Ubicación:** CM-E6, CM-A5, S-CM-27 y S-CM-30; `docs/arquitectura.md`, "Cuando haga falta: … ambientes y feature flags".
- **Problema:** la protección de dinero de D51 depende de que `occupancy.end_and_transfer` siga apagado. No hay ADR ni supuesto que diga dónde vive el flag (variable de entorno, tabla, por comunidad o por ambiente), quién puede encenderlo ni cómo se prueba que está apagado. La regla 10 de `CLAUDE.md` y la definición de "Hecho" de la rebanada del libro no son verificables sin eso.
- **Corrección:** supuesto (a validar): flag por ambiente, en la configuración de despliegue, no editable por API ni por comunidad; encenderlo es un cambio de configuración aprobado por el líder. Una prueba que falle si la configuración de producción lo trae encendido antes de que exista el traspaso. Pregunta al arquitecto y registro en "Contradicciones".

#### R2-M-4 · El periodo de las notas de GOLD-ACM7-05 queda indefinido

- **Ubicación:** CA-CM-7, último "Y", y GOLD-ACM7-05.
- **Problema:** GC CA-33 anula el gasto el 2026-11-20 y deja las notas en el borrador `2026-11`. En CA-CM-7 la anulación ocurre después de emitir `2026-11` (2026-12-01), así que las notas caen en el borrador `2026-12`. Una prueba que reutilice la fecha de CA-33 metería las notas en `2026-11` y cambiaría lo que emite ese periodo frente a GOLD-ACM7-01 a 04 (regla 2).
- **Corrección:** fijar la fecha (por ejemplo, 2026-12-02), decir que las notas van al borrador `2026-12` y que GOLD-ACM7-01 a 04 no las incluyen.

### R2 · Menor

1. **R2-m-1 · E-CM-1 se contradice sobre el 422 de residente.** S-CM-25 lo pone en el paso 4; "Orden de validación por acción" (Revocar) y CM-D4, en el paso 6. La diferencia se nota con una clave reutilizada (`IDEMPOTENCY_KEY_REUSED` frente a 422). **Corrección:** dejarlo en el paso 6 y corregir S-CM-25 y la introducción de E-CM-1, que solo trata los 403.
2. **R2-m-2 · Orden dentro del paso 4 al otorgar.** Con `role = admin` y un `personRecordId` ajeno a la vez, no se dice si responde 404 o 403. **Corrección:** primero el 404 del `personRecordId` y después el 403 de `role = admin` (visibilidad antes que permiso); agregar el caso a CA-CM-23.
3. **R2-m-3 · Motivo en cambios que solo tocan el código o el tipo.** CM-B7 dice que no exige motivo, pero CM-B7 ("toda … lote") y los órdenes de "Crear o editar una unidad" y "Lote" lo exigen "con algún periodo emitido". **Corrección:** "solo si es un alta, o si cambia la alícuota o el orden" en los dos órdenes y en CM-B6; agregar "sin motivo" a CA-CM-8, escenario 3.
4. **R2-m-4 · Datos de prueba que chocan.** El RUT 11.111.111-1 es "inexistente en ComVive" en CA-CM-12 y es la persona X de CA-CM-24. **Corrección:** otro RUT válido para X, registrado en `comunidades-simuladas.md`.
5. **R2-m-5 · Normalización Unicode.** CM-B2 no fija NFC ("Depto Ñ" en NFC y en NFD serían dos códigos que se ven iguales). En CM-B5, "código normalizado comparado por punto de código" no dice si conserva las tildes; si las quita, no es único. **Corrección:** normalizar a NFC al guardar y desempatar por el código guardado según CM-B2, con las tildes.
6. **R2-m-6 · Referencias sin clave foránea.** CM-B8 y S-CM-12 verifican por claves foráneas; los `payload` de `JOB` (ADR 0008) y otras referencias lógicas no se detectan. **Corrección:** un trabajo pendiente con el id de la unidad también impide eliminarla, o los trabajos toleran una unidad inexistente, con su prueba.
7. **R2-m-7 · Soporte ComVive en las rutas de plataforma.** La columna "Op" no distingue `platform_support` y ningún CA verifica que Soporte recibe 404 en las tres rutas (ADR 0009, paso 3a; ADR 0006, decisión 1). **Corrección:** agregar el caso a CA-CM-1 o CA-CM-27.
8. **R2-m-8 · El 403 de la ficha de un administrador.** "Tu rol no permite esta acción" no explica nada: el rechazo depende del estado de otra persona, no del rol de quien actúa. **Corrección:** 422 con código propio, por ejemplo `ADMIN_RECORD_MANAGED_BY_COMVIVE` ("Los datos de un administrador los corrige ComVive"); así E-CM-1 queda solo para la revocación.
9. **R2-m-9 · Efecto de S-CM-22 sobre las notificaciones del residente.** Si Operaciones reemplaza el contacto de una propietaria, cambia a dónde llegan sus notificaciones de residente y nadie de la comunidad puede corregirlo (CM-C6, P-CM-16). **Corrección:** decirlo en CM-A2 y priorizar P-CM-16 antes de la rebanada de ingreso.

### R2 · Observaciones

- **E-CM-1 y P-CM-17: recomendación (b)**, reducida a la revocación de una membresía `admin` si se acepta R2-m-8. A favor: no revela nada (el administrador ya pasó el paso 3b y ve esa membresía), toca una sola ruta y no obliga a crear un puerto ni un paso nuevos en un ADR recién aceptado. Costo: (b) también contradice ADR 0009, decisión 2 ("Todo lo que se sabe por la ruta … lo decide el guard"), así que hay que enmendarlo: agregar a "Lo que sigue en el servicio" una lista cerrada de verificaciones 403 por la instancia de la ruta, citada a esta spec, que van antes de la idempotencia, y alinear `docs/arquitectura.md` §3. Conviene (a) si aparecen más rutas con 403 según la instancia en otras rebanadas.
- **Complejidad:** la ficha por (persona, comunidad) es más simple que el contacto por membresía y resuelve M-8 (c). El lote único y la salida de la conserjería y de las lecturas de plataforma reducen la superficie. No sobra nada.
- **Lo que se verificó y cuadra:** encaje de la ficha con ADR 0002, decisión 3 (no amplía los datos globales; `PERSON` sigue "solo identidad"); D48 frente a ISO-7; D49 frente a ADR 0002 y 0006; D50 y D53 sin efectos colaterales; D51 con el flag apagado (CA-CM-26); orden de `PERSON_NAME_REQUIRED` respecto de GC S-63 (D52); pasos 1 a 6 coherentes con GC "Respuestas de error"; ids retirados sin reutilizar; fechas de CA-CM-14, CA-CM-15 y CA-CM-21 coherentes con O-1, O-4 y O-5; tope de 500 filas razonable.

### R2 · Preguntas para el líder del proyecto

1. **(R2-C-1)** ¿Acepta que el celular o correo del administrador sea siempre obligatorio en el alta y al otorgar `admin`, sin usar nunca un contacto verificado en otra comunidad? Esto cambia GC S-63 y CON-11.
2. **(R2-M-1)** ¿Acepta como requisitos de la rebanada de ingreso que la habilitación por contacto se evalúe en cada petición, que corregir un contacto deshabilite las sesiones obtenidas con el anterior y que una sesión limitada no pueda cambiar datos de identidad?
3. **(R2-M-3)** ¿Los feature flags se manejan por ambiente en la configuración de despliegue, encendidos solo con su aprobación? ¿O pide un ADR de feature flags antes de la rebanada 1?
4. **(P-CM-17 y R2-m-8)** ¿Opción (b), limitada a la revocación de `admin`, con la corrección de la ficha de un administrador como 422 con código propio? ¿O prefiere (a)?
5. **(R2-M-4)** ¿Confirma que en GOLD-ACM7-05 la anulación es posterior a la emisión de `2026-11` y que las notas van al borrador `2026-12`?

### R2 · Resolución

El líder del proyecto respondió las cinco preguntas de la segunda pasada el 2026-11-11 (D54 a D58, registradas en la spec, sección "Decisiones del líder del proyecto"). El analista-producto incorporó los cambios en la rev. 3 de `docs/specs/comunidades-y-membresias.md`, que queda en "Para revisión del líder del proyecto" y pendiente de la tercera pasada del revisor crítico, y actualizó `docs/qa/comunidades-simuladas.md` (periodo de las notas de GOLD-ACM7-05 y personas de la spec con sus RUT). Los documentos aprobados que deben alinearse no se editaron: quedan en "Contradicciones y vacíos en documentos aprobados" de la spec, puntos 15 y 17 a 24, cada uno con su responsable. Las referencias de la tabla son de la spec rev. 3.

| Hallazgo | Estado | Cómo se resolvió |
| --- | --- | --- |
| R2-C-1 Contacto del administrador tomado de otra comunidad | Resuelto (D54) | Celular o correo siempre obligatorio en el alta y en cada otorgamiento de `admin`, guardado solo en la ficha de esa comunidad; nunca se usa ni se copia el de `PERSON` ni el de otra ficha (CM-A2, CM-C1, CM-C4). `INVALID_CONTACT` sin condición en los dos órdenes, con el texto de GC. CA-CM-27 con Felipe Rojas (422 `INVALID_CONTACT`; con correo, su ficha y su contacto de B no cambian y la respuesta es la de una persona nueva). Cambio a GC S-63 (coordinador) y CON-11 (diseñador) en el punto 17. S-CM-22 sin ambigüedad |
| R2-M-1 CM-F3 sin corrección de contacto ni acciones de identidad | Resuelto (D55) | CM-F3 con D55-1 (habilitación evaluada en cada petición), D55-2 (corregir o reemplazar el contacto de una ficha deshabilita la comunidad para las sesiones del contacto anterior desde la petición siguiente, con auditoría), D55-3 (una sesión limitada no cambia la identidad de comunidades no habilitadas; "Mis comunidades" solo lista las habilitadas) y D55-4 (código a cada contacto verificado y sesión limitada al usado, o regla equivalente del arquitecto). CM-C6 y CM-A2 enlazan D55-2. P-CM-18 con los cuatro puntos; CA-CM-24 y CA-CM-19 con sus casos para la rebanada de ingreso |
| R2-M-2 "Contradicciones y vacíos" incompleta | Resuelto | Puntos nuevos 17 (GC S-63 y CON-11, contacto; coordinador y diseñador), 18 (formularios de CON-11 sin nombre; diseñador), 19 (ADR 0005, decisión 1, contacto único por persona; arquitecto), 20 (ADR 0009, decisión 3, paso 2, y `docs/arquitectura.md` §2, "Mis comunidades"; arquitecto), 21 (GC S-72 y D27, plazo de la alerta; coordinador), 22 (`docs/arquitectura.md` §3, lista de permisos; arquitecto), 23 (acción "Corregir datos" sin diseño; diseñador) y 24 (mecanismo de feature flags; arquitecto). El punto 3 aclara que CON-11 muestra el nombre pero no lo pide; CM-A5 cita el punto 21 |
| R2-M-3 Feature flags sin mecanismo ni dueño | Resuelto (D56) | Regla nueva CM-H1: por ambiente en la configuración de despliegue, no editables por API ni por comunidad, encendido aprobado por el líder, apagado si falta, doble de configuración en las pruebas y una prueba del CI que falla si producción trae `occupancy.end_and_transfer` encendido antes del traspaso. S-CM-31, P-CM-20 (arquitecto), punto 24 y CA-CM-26 ampliado. CM-E6 y CM-A5 citan CM-H1 |
| R2-M-4 Periodo de las notas de GOLD-ACM7-05 | Resuelto (D58) | CA-CM-7: anulación el 2026-12-02, después de emitir `2026-11`; las notas van al borrador `2026-12` y GOLD-ACM7-01 a 04 no las incluyen. `comunidades-simuladas.md`: el texto de GOLD-ACM7 fija la fecha y la tabla agrega la columna "Periodo de las notas". Montos sin cambios |
| R2-m-1 422 de residente en el paso 4 o 6 | Resuelto | Paso 6 en todos los lugares: introducción de E-CM-1 (ahora solo trata el 403 de revocar `admin`), S-CM-25, CM-D4 y el orden de "Revocar", que explica que `IDEMPOTENCY_KEY_REUSED` sale antes que ese 422 |
| R2-m-2 Orden dentro del paso 4 al otorgar | Resuelto | Primero el 404 del `personRecordId` y después el 403 de `role = admin` (CM-D2, orden "Otorgar por la ruta de membresías", S-CM-2). CA-CM-23 con `role = admin` y un `personRecordId` de B (404), y con uno de A (403) |
| R2-m-3 Motivo en cambios de solo código o tipo | Resuelto | El motivo se exige solo si es un alta o si cambia la alícuota o el orden (un valor igual al actual no cuenta), en CM-B6, CM-B7 y los órdenes de "Crear o editar una unidad" y "Lote". CA-CM-8, tercer escenario, cambia el código sin motivo y se guarda |
| R2-m-4 RUT 11.111.111-1 en dos papeles | Resuelto | La persona X de CA-CM-24 es Sofía Navarro, RUT 17.654.321-3 (módulo 11 verificado). 11.111.111-1 queda solo como RUT de control inexistente de CA-CM-12. Los dos registrados en `comunidades-simuladas.md` con el cálculo del dígito |
| R2-m-5 Normalización Unicode | Resuelto | CM-B2: el código se guarda en NFC, con tildes y ñ. CM-B5: el último desempate es el código guardado (NFC, con tildes y mayúsculas) por punto de código, que nunca empata. S-CM-5, S-CM-24 y un caso borde |
| R2-m-6 Referencias sin clave foránea | Resuelto, con pregunta | Opción "los trabajos toleran": todo trabajo de `JOB` que lea una unidad por id termina sin efecto si ya no existe, con una prueba por tipo de trabajo; toda referencia lógica nueva entra en la lista de CM-B8 o en esta tolerancia. CM-B8, S-CM-12, caso borde y P-CM-20 para que el arquitecto lo confirme |
| R2-m-7 Soporte ComVive en las rutas de plataforma | Resuelto | CA-CM-1: `soporte-1` recibe 404 en las tres rutas de plataforma (paso 3a), también con un JSON mal formado, y las peticiones quedan en la auditoría de plataforma. Fila de Soporte en "Usuarios y permisos" y nota en "Acciones de la rebanada" |
| R2-m-8 403 de la ficha de un administrador | Resuelto (D57) | 422 `ADMIN_RECORD_MANAGED_BY_COMVIVE` ("Los datos de un administrador los corrige ComVive") como primera regla del paso 6 de "Corregir una ficha" (CM-C6, tabla de errores, matriz de recursos, CA-CM-19 y CA-CM-27) |
| R2-m-9 Efecto de S-CM-22 en las notificaciones del residente | Resuelto | CM-A2 dice que el contacto que ingresa Operaciones pasa a ser también el de sus notificaciones de residente y, con la rebanada de ingreso, deshabilita las sesiones del contacto anterior (D55-2), sin que nadie de la comunidad pueda corregirlo. P-CM-16 marcada prioritaria, antes de que la rebanada de ingreso pase a "Lista para desarrollo". S-CM-22, caso borde y CA-CM-27 |
| Observación 1 E-CM-1 y P-CM-17 | Resuelto (D57) | Opción (b) limitada a la revocación de `admin`; P-CM-17 cerrada. La enmienda de ADR 0009, decisión 2 (lista cerrada de verificaciones 403 por la instancia de la ruta, citada a esta spec, antes de la idempotencia) y la alineación de `docs/arquitectura.md` §3 quedan en el punto 15 para el arquitecto. E-CM-1 anota que conviene (a) si aparecen más rutas así |
| Observación 2 Complejidad | Anotada | Sin cambios: la rev. 3 no agrega rutas ni entidades; CM-H1 es una regla de configuración |
| Observación 3 Lo que se verificó y cuadra | Anotada | Sin cambios |

## Tercera pasada (rev. 3)

### Base revisada

- **Fecha:** 2026-11-11. **Revisor:** agente `revisor-critico`.
- **Entregable:** `docs/specs/comunidades-y-membresias.md` rev. 3 (926 líneas, leída completa, commit 70021bb); `docs/qa/comunidades-simuladas.md` (personas de la spec y GOLD-ACM7); la sección "R2 · Resolución" de este informe.
- **Contrastado con:** `CLAUDE.md` (reglas 1 a 10, metodología); GC rev. 9 ("Respuestas de error", pasos 1 a 6; tabla de errores; "Validaciones de la consola de Operaciones ComVive" con S-63; CA-33; creación del borrador siguiente al emitir); ADR 0003, decisiones 6 y 9; ADR 0008, inventario (fila 5), decisión 4 (reglas del manejador), decisión 5 (`ENTITY_NOT_FOUND`), decisión 14 (`NOTIFICATION_DELIVERY`, de dónde sale el contacto) y prueba 8; `docs/arquitectura.md` ("Cuando haga falta"); existencia de `docs/operaciones/`.

### Veredicto

**Aprobado con cambios.** No hay hallazgos críticos. La rev. 3 resuelve en el texto los 14 hallazgos de la segunda pasada y aplica bien D54 a D58; ningún camino de la rebanada 1 permite que un contacto registrado o verificado en una comunidad dé acceso a otra. Hay tres mayores, con corrección acotada al texto, que deben corregirse antes de la aprobación del líder (el coordinador puede verificarlos sin una cuarta pasada completa): R3-M-1 (la protección de dinero del flag se puede saltar), R3-M-2 (el contacto de las notificaciones sigue saliendo de `PERSON` según ADR 0008) y R3-M-3 (la tolerancia de `JOB` contradice ADR 0008). Los menores pueden ir como tareas de alineación, salvo R3-m-1 y R3-m-2, de una línea.

### Verificación de la segunda pasada

| Hallazgo | ¿Resuelto en el texto? | Dónde se verificó |
| --- | --- | --- |
| R2-C-1 | Sí | CM-A2, CM-C1, CM-C4, los dos órdenes (`INVALID_CONTACT` "siempre"), la tabla de errores, CA-CM-27 y el punto 17. Falta el caso del **alta** con un RUT existente (R3-m-5) |
| R2-M-1 | Sí | CM-F3 con D55-1 a D55-4; CM-C6 y CM-A2 enlazan D55-2; P-CM-18; CA-CM-24 y CA-CM-19. Reparos en R3-m-2, R3-m-3 y R3-m-6 |
| R2-M-2 | Sí | Puntos 17 a 24; punto 3 corregido. Faltantes nuevos en R3-M-2, R3-M-3 y R3-m-4 |
| R2-M-3 | Parcial | CM-H1, S-CM-31, P-CM-20, punto 24 y CA-CM-26. La prueba del CI no cubre un cambio hecho directo en el despliegue (R3-M-1) |
| R2-M-4 | Sí | CA-CM-7 (anulación 2026-12-02, notas en `2026-12`) y GOLD-ACM7 con la columna "Periodo de las notas" |
| R2-m-1 | Sí | E-CM-1, S-CM-25, CM-D4 y el orden de "Revocar": 422 de residente en el paso 6 |
| R2-m-2 | Sí | CM-D2 y el orden de "Otorgar": 404 antes que 403; CA-CM-23 |
| R2-m-3 | Sí | CM-B6, CM-B7, los dos órdenes y CA-CM-8 |
| R2-m-4 | Sí | Sofía Navarro 17.654.321-3 y RUT de control 11.111.111-1 |
| R2-m-5 | Sí | CM-B2 (NFC), CM-B5, S-CM-5, S-CM-24 y el caso borde |
| R2-m-6 | Sí, pero contradice ADR 0008 | CM-B8 y S-CM-12 (R3-M-3) |
| R2-m-7 | Sí | Fila de Soporte, "Acciones de la rebanada" y CA-CM-1 |
| R2-m-8 | Sí | Tabla de errores, matriz, CM-C6, orden de "Corregir una ficha", CA-CM-19 y CA-CM-27 |
| R2-m-9 | Sí | CM-A2, S-CM-22, caso borde y P-CM-16 prioritaria. Falta el CA del corte de sesión por reemplazo (R3-m-6) |

**Caminos de un contacto entre comunidades.**

| Camino | Resultado |
| --- | --- |
| Alta | Cerrado: contacto obligatorio, solo en la ficha nueva |
| Otorgamiento de `admin` | Cerrado: contacto obligatorio, solo en la ficha nueva |
| Corrección de ficha | Cerrado: solo afecta a esa comunidad, con D55-2 |
| Reemplazo por Operaciones (S-CM-22) | Cerrado: solo afecta a esa comunidad, con D55-2 |
| Ingreso normal con varios contactos (D55-4) | Cerrado en su invariante; la redacción admite una lectura con un solo código (R3-m-2) |
| Rutas `/me/` (D55-3) | Cerradas en cuanto a cambios; el rechazo revela que existen otras comunidades (R3-m-3) |
| **Notificaciones** | **No cerrado:** ADR 0008, decisión 14 lee el contacto desde `PERSON` (R3-M-2). No ocurre en la rebanada 1 |

**GOLD-ACM7, recalculado:** fondo 500.009.999 div 10.000 = $50.000; cargos de `2026-11` 199.500 + 262.500 + 262.500 + 325.500 = $1.050.000 (regla 3); notas del Depto 101 con la foto del 20 %: 950.000 × 0,20 = 190.000 (−10.000) y 47.500 × 0,20 = 9.500 (−500), total −$10.500; contraste con el 19 %: −$20.475. Periodo de las notas: borrador `2026-12`, coherente con GC.

**RUT por módulo 11:**

| RUT | Suma ponderada | Resto mod 11 | Dígito |
| --- | --- | --- | --- |
| 17.654.321 | 129 | 8 | 3 |
| 11.111.111 | 32 | 10 | 1 |
| 21.345.678 | 139 | 7 | 4 |
| 22.456.789 | 168 | 3 | 8 |
| 15.234.567 | 117 | 7 | 4 (y −9 es inválido, como espera CA-CM-13) |
| 12.345.678 | 138 | 6 | 5 |
| 12.345.670 | 122 | 1 | K |
| 18.234.765 | 127 | 6 | 5 |
| 13.579.246 | 163 | 9 | 2 |

### R3 · Crítico

Ninguno.

### R3 · Mayor

#### R3-M-1 · La prueba del flag `occupancy.end_and_transfer` no cubre un encendido hecho directo en el despliegue

- **Ubicación:** CM-H1, tercera viñeta ("El cambio queda en el historial del repositorio **o del despliegue**") y quinta viñeta (prueba del CI); CM-E6, primera viñeta; CA-CM-26, segundo escenario.
- **Problema:** la protección de dinero de D51 depende de que el flag siga apagado en producción, y la única barrera es una prueba del CI que lee la configuración de producción. Si el valor se cambia en el despliegue (variable de entorno de Cloud Run editada desde la consola o con `gcloud`), el cambio no pasa por el CI: un término o una venta reales dejarían la deuda en el ámbito equivocado, sin traspaso (GC F-9, F-13; reglas 2 y 5), y sería un cambio a producción sin aprobación trazable (regla 10). Además, `docs/operaciones/` no existe, así que hoy no hay configuración de despliegue versionada que la prueba pueda leer.
- **Corrección:** (a) en CM-H1, la configuración de producción vive **solo** en el repositorio y el despliegue la toma de ahí; se borra "o del despliegue" y todo valor fuera del repositorio se considera apagado o hace fallar el arranque. (b) Una barrera en el código: mientras la constante que marca que el traspaso existe esté en falso, la API trata el flag como apagado en producción o se niega a arrancar si lo recibe encendido. Caso en CA-CM-26 ("con la constante del traspaso en falso, el flag encendido por configuración responde 422 `OCCUPANCY_ACTION_NOT_AVAILABLE`", o el arranque falla). Sumar a P-CM-20 que el arquitecto fije la variante.

#### R3-M-2 · El contacto de las notificaciones sigue saliendo de `PERSON` según ADR 0008 (camino de C-1 no cerrado)

- **Ubicación:** CM-C4, "Identificación" (solo como intención); CM-A2, "Efecto del reemplazo"; falta en "Contradicciones y vacíos". Choca con ADR 0008, decisión 14 ("el contacto y el texto se leen al enviar, desde `PERSON`, `MEMBERSHIP` o la variable de entorno del equipo").
- **Problema:** la spec no fija a qué contacto va una notificación de una comunidad, y el ADR aceptado dice que se lee desde `PERSON`. Variante por notificación de C-1: el administrador malicioso de A registra a X con c_att; el atacante lo verifica con la invitación de A; la Comunidad B emite y `notification.send` toma el contacto de `PERSON`; el aviso de cobro de X en B (unidad, monto, deuda) llega a c_att. Fuga entre comunidades de datos de deuda (reglas 4 y 7). No es crítico porque la rebanada 1 no envía nada a residentes, pero las rebanadas de emisión y de ingreso implementarían ADR 0008 tal como está escrito.
- **Corrección:** regla explícita en CM-C4: toda notificación originada en una comunidad (correo, SMS o WhatsApp) va **solo** al contacto de la ficha de la persona en **esa** comunidad, nunca a un contacto de `PERSON` ni de otra ficha; sin contacto en la ficha, la entrega queda `skipped` o `failed` según ADR 0008; el push sigue atado a la membresía (GC S-81). Los contactos verificados de `PERSON` sirven solo para los códigos de ingreso (CM-F3). Punto 25 en "Contradicciones y vacíos" (arquitecto): ADR 0008, decisión 14 debe leer el contacto desde la ficha de `NOTIFICATION_DELIVERY.community_id`, y `docs/arquitectura.md` §5 alinearse. Requisito heredado con CA de aislamiento: con el estado de CA-CM-24, el aviso de cobro de B va a c2 y nunca a c1.

#### R3-M-3 · La tolerancia de `JOB` a unidades eliminadas contradice ADR 0008 y apaga una alarma de aislamiento

- **Ubicación:** CM-B8, viñeta "Referencias sin clave foránea (R2-m-6)" ("termina sin efecto, sin reintentos y **sin error que alerte**"); S-CM-12; caso borde "Trabajo en segundo plano con el id de una unidad eliminada"; P-CM-20.
- **Problema:** ADR 0008, decisión 5 (aceptado): si el manejador no encuentra la entidad del `payload` en esa comunidad, termina `skipped` con `ENTITY_NOT_FOUND`, no escribe nada y **envía un evento a Sentry** (prueba 8). Con RLS, una unidad eliminada y una de otra comunidad son indistinguibles: si "unidad no encontrada" deja de alertar, deja de alertar también el caso de aislamiento. La contradicción no está en "Contradicciones y vacíos", y hoy ningún tipo de trabajo lleva un id de unidad (`attemptId`, `refundId`, `membershipId`, `deliveryId`).
- **Corrección (la más simple):** mantener ADR 0008 tal cual: un trabajo que no encuentra la unidad termina `skipped` con `ENTITY_NOT_FOUND` y su evento en Sentry. Reescribir la viñeta: "Hoy ningún `payload` lleva un id de unidad (prueba 17 de ADR 0008). Si un tipo de trabajo nuevo lo agrega, su manejador sigue ADR 0008, decisión 5 y tiene una prueba con una unidad eliminada". Alternativa, si se quiere evitar el ruido: distinguir el caso con la auditoría `unit.delete` de esa comunidad y enmendar ADR 0008. En ambos casos, borrar "sin error que alerte" y corregir S-CM-12 y el caso borde.

### R3 · Menor

1. **R3-m-1 · El 422 de la ficha de un administrador no cubre un `admin` con `valid_from` futuro.** CM-C6, tabla de errores y orden de "Corregir una ficha" dicen "membresía `admin` vigente"; ADR 0008 (fila 5) y GC P-61 admiten una todavía no vigente, cuyo nombre (que firma el aviso, D52) podría reescribir un administrador de la comunidad. **Corrección:** "membresía `admin` no revocada (vigente o con `valid_from` futuro)" en los tres lugares, en "Usuarios y permisos" y en la matriz.
2. **R3-m-2 · D55-4 admite una lectura con un solo código.** Con el mismo código en todos los contactos, el sistema no sabe con qué contacto se ingresó y la sesión limitada no se puede construir; una implementación literal tendería a la unión de comunidades (C-1). **Corrección:** "un código distinto por contacto verificado (o la persona elige a qué contacto se envía), y la sesión queda limitada a las comunidades del contacto cuyo código se ingresó".
3. **R3-m-3 · El rechazo de D55-3 revela que la persona tiene membresías en otras comunidades.** Una sesión limitada recibe un rechazo en las acciones de identidad y una completa no: el atacante que controla c_att aprende que X está en otra comunidad, el dato que D48 e ISO-7 ocultan. **Corrección:** requisito para la rebanada de ingreso: la respuesta a esas acciones no depende de si la sesión está limitada (por ejemplo, toda sesión las ejecuta solo con un código enviado a **cada** contacto verificado, o ninguna las ejecuta y las resuelve Soporte). Sumarlo a P-CM-18 (3).
4. **R3-m-4 · "Contradicciones y vacíos" sigue incompleta y sin responsable en seis puntos.** Faltan, además de R3-M-2 y R3-M-3: (a) ADR 0003, decisión 9 (párrafo final) y GC "Respuestas de error", paso 4, que E-CM-1 extiende al recurso de la ruta (arquitecto y coordinador); (b) ADR 0003, decisión 6 y GC S-36, por la idempotencia en toda escritura (S-CM-23) (arquitecto y coordinador); (c) ADR 0008, fila 5 del inventario, que CM-A5 impide con el flag apagado (arquitecto). Los puntos 1, 2, 4, 6, 7 y 8 no nombran responsable; propuesta: 1, líder; 2, líder y arquitecto; 4, diseñador; 6, arquitecto; 7, coordinador; 8, diseñador.
5. **R3-m-5 · D54 no tiene CA en el alta.** **Corrección:** en CA-CM-1, un alta con el RUT de Felipe Rojas (administrador de B, con contacto verificado) sin contacto responde 422 `INVALID_CONTACT`; con contacto, la ficha de C queda con ese contacto, la de B no cambia y la respuesta es igual a la de un RUT nuevo.
6. **R3-m-6 · No hay CA del corte de sesión cuando Operaciones reemplaza el contacto.** **Corrección:** en CA-CM-27, como requisito de la rebanada de ingreso: si Ana tenía una sesión obtenida con su contacto anterior, desde la petición siguiente la Comunidad A le responde 404 y vuelve a entrar con la invitación al celular nuevo.
7. **R3-m-7 · CM-A5 "desde el encendido" no es implementable con flags de configuración.** Con D56 el encendido es un despliegue; la base de datos no guarda ese instante y nadie encola los trabajos de las membresías `admin` otorgadas con el flag apagado. **Corrección:** requisito de la rebanada de ingreso: al encender, un procedimiento único (o el barrido de vigías de ADR 0008) encola un trabajo por membresía `admin` vigente sin primer ingreso, con `run_at` = `startOfDay(fecha de encendido + 8 días)`, tomando la fecha del valor configurado o de un registro auditado. Sumarlo a P-CM-20.
8. **R3-m-8 · Contradicción sobre un contacto ya verificado que se escribe en otra ficha.** CM-F3 dice que un contacto escrito por un administrador "nunca … habilita nada sin que la persona ingrese el código"; con D55-1, escribir en la ficha de B un contacto ya verificado por A habilita B de inmediato (CA-CM-24 lo acepta). **Corrección:** "Un contacto que la persona no ha verificado nunca habilita nada. Uno ya verificado habilita, desde la petición siguiente, toda comunidad cuya ficha lo registre, también si se escribe después (D47, D55-1)".
9. **R3-m-9 · Referencias de CM-H1 que no existen o no se pueden cumplir.** CM-H1 cita `docs/operaciones/`, que no existe, y los ambientes "desarrollo, pruebas, producción", no definidos; "ninguna ruta … lee … un flag" no dice cómo sabe la web si mostrar término y venta. **Corrección:** dejar ambos vacíos explícitos en el punto 24 y en P-CM-20.
10. **R3-m-10 · Dos numeraciones de pasos en la misma sección.** "Revocar por la ruta de membresías" cita "ADR 0003, decisión 9, paso 4" (idempotencia), mientras la spec numera como GC (idempotencia en el paso 5; CM-B7). **Corrección:** citar "ADR 0003, decisión 9 (idempotencia)" sin número, o fijar una vez la equivalencia.

### R3 · Observaciones

- **Lo que bloquea la aprobación:** R3-M-1, R3-M-2 y R3-M-3; conviene incluir R3-m-1 y R3-m-2. Lo demás puede ir como tarea de alineación.
- **Alineaciones previas a "Lista para desarrollo" de la rebanada 1:** puntos 3 y 17 (GC S-63), 5 y P-CM-18 (1) (`COMMUNITY_PERSON` en el modelo), 13 (GC S-53), 15 (enmienda de ADR 0009, decisión 2), 16 y 22 (permisos en ADR 0003 y ADR 0009), 21 y R3-m-4 (c), y 24 con R3-M-1 (mecanismo del flag). Los puntos 6, 8, 11, 12, 18, 19, 20 y 23 pueden esperar a su rebanada; se recomienda marcarlo en cada punto.
- **422 `ADMIN_RECORD_MANAGED_BY_COMVIVE`:** por la definición de GC encajaría mejor en un 409, pero lo decidió el líder en D57 y no cambia la seguridad; no se levanta como hallazgo.
- **Complejidad:** CM-H1 es el mecanismo más simple posible; R3-M-1 (b) agrega una sola constante; la corrección de R3-M-3 quita complejidad.
- **Se verificó y cuadra:** los órdenes de alta y otorgamiento frente a GC S-63; E-CM-1 frente a ADR 0003, decisión 9; los ids (último S-CM-31, P-CM-20 y CA-CM-28; sin ids inexistentes ni reutilizados); las fechas de CA-CM-7 y GOLD-ACM7; los códigos de la tabla de errores frente a GC; la matriz de recursos frente a "Acciones de la rebanada".

### R3 · Preguntas para el líder del proyecto

1. **(R3-M-1)** Para el flag de término y venta, ¿acepta que la configuración de producción viva solo en el repositorio, más una barrera en el código que lo considera apagado en producción mientras no exista el traspaso? ¿O prefiere solo una de las dos?
2. **(R3-M-2)** ¿Confirma que toda notificación de una comunidad va solo al contacto de la ficha de esa comunidad, y que los contactos verificados de `PERSON` sirven solo para los códigos de ingreso? Obliga a enmendar ADR 0008, decisión 14 antes de la rebanada de emisión.
3. **(R3-M-3)** ¿Mantener ADR 0008 tal cual (un trabajo que no encuentra la unidad queda `skipped` con alerta en Sentry) en vez de la tolerancia sin alerta de la rev. 3?
4. **(R3-m-3)** Para la rebanada de ingreso, ¿acepta que las acciones de identidad respondan igual a toda sesión (por ejemplo, exigiendo un código en cada contacto verificado), para no revelar que la persona tiene membresías en otras comunidades?
5. **(Alineación)** ¿Acepta marcar en "Contradicciones y vacíos" cuáles alineaciones deben estar hechas antes de que la rebanada 1 pase a "Lista para desarrollo" (puntos 3, 5, 13, 15, 16, 17, 21, 22 y 24)?

### R3 · Resolución

Pendiente.
