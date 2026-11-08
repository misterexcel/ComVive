# Wireframes: configuración inicial de la comunidad (web)

Estado: Borrador
Responsable: disenador-ux
Aprobación: líder del proyecto

Flujo: `../flujos/admin-alta-comunidad.md`. Superficie: web de administración (1280 px). La creación de la comunidad la hace Operaciones ComVive (`consola-plataforma.md`, CON-11). Asistente de 4 pasos que se puede pausar (**Supuesto (a validar)** del flujo).

Criterios de aceptación: CA-7 (tasa sobre el tope), CA-18 (alícuota 0 %), CA-19 (alícuotas que no suman 100 %) y D-2 (fondo de reserva).

## WEB-ALT-01 · Lista de puesta en marcha (Inicio)

Escenario: Comunidad A recién creada, antes de completar la configuración.

```text
+-- Inicio · Edificio Los Aromos -------------------------------------------------------------
| Puesta en marcha
| (circle-check) Datos y medios de pago                           Listo
| (circle-check) Cobro y primer mes                               Listo
| (triangle-alert) Unidades con alícuotas que suman 100 %         Con advertencia   > Revisar
| (clock) Ocupantes registrados                                   1 unidad sin propietario
| (clock) Residentes invitados                                    3 de 4 aceptaron
| (clock) Pago en línea (Webpay)                                  Pendiente: ComVive lo activa
|                                                                 cuando Transbank entregue el
|                                                                 código de comercio de la comunidad
+---------------------------------------------------------------------------------------------
```

- Textos del flujo ("Lista de puesta en marcha"). Estado con ícono y texto. El último paso no depende del administrador: lo activa Operaciones ComVive por procedimiento auditado, sin pantalla en el MVP (ADR 0007; UX-33 cerrada).
- "1 unidad sin propietario" y "3 de 4 aceptaron": ilustrativos. El flujo escribe "{n} unidades sin propietario"; en singular, "1 unidad sin propietario" (texto del diseño, UX-69).
- La lista desaparece cuando todos los pasos están listos.

## WEB-ALT-02 · Paso 1: datos y medios de pago

```text
+-- Configurar Edificio Los Aromos · Paso 1 de 4 ---------------------------------------------
| Nombre (obligatorio)         [ Edificio Los Aromos       ]
| Dirección (obligatorio)      [                           ]   Comuna (obligatorio) [        v ]
| Tipo (obligatorio)           (o) Edificio  ( ) Condominio
| RUT de la comunidad          {RUT cargado por ComVive}   > Revisar
|
| Medios de pago (aparecen en el aviso y en "Cómo pagar")
| Banco [          v ]  Tipo de cuenta [        v ]  Número [            ]
| Titular [                    ]  RUT del titular [            ]  Correo para comprobantes [     ]
|
| ( Guardar y salir )                                             [[ Guardar y continuar ]]
+---------------------------------------------------------------------------------------------
```

- Cada paso guarda antes de avanzar; el botón pasa a "Guardando…".

## WEB-ALT-03 · Paso 2: cobro y primer mes

```text
+-- Paso 2 de 4 · Cobro ----------------------------------------------------------------------
| Fondo de reserva (obligatorio)           [ 5,00 ] %
| Plazo de vencimiento (obligatorio)       [ 10 ] días corridos
| Primer mes a cobrar (obligatorio)        [ Octubre 2026  v ]
| Se cobra mes vencido: los gastos de octubre se emiten a comienzos de noviembre
|
| Intereses por mora (opcional ahora)
| Tasa del reglamento [ 1,00 ] % mensual   Vigente desde [ 01-11-2026 ]   Referencia [       ]
| Intereses por mora: desactivados. Se activan después en Configuración > Cobro > Intereses.
|
| ( Atrás )                                                       [[ Guardar y continuar ]]
+---------------------------------------------------------------------------------------------
```

- Errores del fondo (spec, D-2): "El fondo de reserva no puede ser menor que 5,00 % (Ley 21.442, art. 39)" (`RESERVE_RATE_BELOW_MINIMUM`) y "El fondo de reserva no puede superar 50,00 %. Si el reglamento fija más, contacta a soporte" (`RESERVE_RATE_ABOVE_MAXIMUM`).
- Tasa sobre el tope: advertencia de CA-7, "La tasa configurada supera el tope legal vigente (15,00 % anual). Se aplicará el tope". La tasa mensual se guarda como anual (× 12, S-10); la conversión la hace la API.
- Con el primer mes se crea el primer borrador vigente (A-2). Ayuda del mes: flujo.

## WEB-ALT-04 · Paso 3: unidades

Escenario: Comunidad C con el error de CA-19 (Depto 31 con 20,9900 %).

```text
+-- Paso 3 de 4 · Unidades -------------------------------------------------------------------
| [ Importar planilla ]  [ Agregar unidad ]                 Suma de alícuotas: 99,9900 %  (x)
|
| Código      Tipo           Alícuota          Orden (sort_order)
| Depto 11    Departamento   [ 18,5000 ] %     [ 1 ]
| Depto 12    Departamento   [ 19,5000 ] %     [ 2 ]
| Depto 21    Departamento   [ 20,0000 ] %     [ 3 ]
| Depto 22    Departamento   [ 21,0000 ] %     [ 4 ]
| Depto 31    Departamento   [ 20,9900 ] %     [ 5 ]
| Bodega B1   Bodega         [ 0 ] %  <Sin participación>   [ 6 ]
|
| {!} Las alícuotas suman 99,9900 %; deben sumar 100,0000 %
|     Puedes guardar, pero no podrás emitir gastos por alícuota hasta corregirlas.
|
| ( Atrás )                                                       [[ Guardar y continuar ]]
+---------------------------------------------------------------------------------------------
```

- La suma se calcula con enteros (`aliquot_e6`) y se muestra con 4 decimales; en rojo con ícono y texto, no solo con color. Alícuotas: CA-3 y CA-19; Bodega B1: CA-18.
- La alícuota acepta coma o punto (`20,99` o `20.99`) y se muestra con coma.
- El orden se propone en orden natural del código y se edita como número entero único.
- La segunda línea de la advertencia es del diseño, a partir del flujo ("Alerta: no se podrán emitir grupos por alícuota", UX-69).

**Errores por fila** (textos del flujo):

| Caso | Texto |
| --- | --- |
| Código repetido | "El código Depto 101 ya existe en esta comunidad" |
| Orden repetido | "El orden 3 ya lo usa Depto 201" |
| Más de 4 decimales | "La alícuota admite hasta 4 decimales" |
| Fuera de rango | "La alícuota debe estar entre 0 % y 100 %" |

## WEB-ALT-05 · Importar desde planilla

```text
+-- Importar unidades y residentes -----------------------------------------------------------
| 1. [ Descargar plantilla ]
| 2. Sube el archivo completado:  [ Elegir archivo ]  unidades.xlsx
|    Borramos el archivo después de revisarlo.
|
| Validando fila 120 de 300   [==========>               ]
|
| (con errores)
| {x} No se guardó nada. Corrige estas filas y vuelve a subir el archivo.
| Fila   Columna     Error
| 14     RUT         Ingresa un RUT válido. Revisa el dígito verificador
| 27     RUT         El RUT 12.345.678-5 aparece con nombres distintos
| 31     Alícuota    La alícuota admite hasta 4 decimales
+---------------------------------------------------------------------------------------------
```

- Se valida todo el archivo; con un solo error no se guarda nada (flujo). Formato no soportado: "Sube un archivo CSV o Excel con la plantilla de ComVive".
- Saldos de apertura: no se cargan (F-10, UX-1). Exportaciones de otros sistemas: UX-16.
- "No se guardó nada. Corrige estas filas y vuelve a subir el archivo.": texto del diseño (UX-69).

## WEB-ALT-06 · Paso 4: ocupantes y resumen

```text
+-- Paso 4 de 4 · Ocupantes ------------------------------------------------------------------
| Unidad      Propietario                     Arrendatario
| Depto 101   Ana Pérez · 12.345.678-5        —                        > Editar
| Depto 102   Luis Muñoz · 12.345.670-K       Agregar                  > Editar
| Depto 201   Rosa Díaz · 14.682.035-2        —                        > Editar
| Depto 202   <Propietario sin registrar>     —                        > Registrar propietario
|
| Puedes dejar este paso para después. Una unidad sin propietario no bloquea la emisión.
|                                                              [[ Revisar y guardar ]]
+---------------------------------------------------------------------------------------------

+-- Resumen ----------------------------------------------------------------------------------
| 4 unidades · Suma de alícuotas 100,0000 % · Fondo 5,00 % · Vencimiento 10 días corridos
| Primer mes a cobrar: octubre 2026 · Medios de pago: 1 cuenta · Ocupantes: 3 de 4 unidades
| [[ Guardar configuración ]]
|
| (después de guardar)
| {ok} Configuración guardada. Se creó el borrador de octubre 2026.
|      [[ Invitar residentes ahora ]]   [ Más tarde ]
+---------------------------------------------------------------------------------------------
```

- El formulario de cada ocupante es el de `web-ocupaciones.md`. El Depto 202 sin propietario es ilustrativo (en la Comunidad A tiene a Marco Silva).
- La frase sobre el paso 4 y el banner de resultado: textos del diseño (UX-69).
- **Estado vacío:** "Agrega unidades para poder emitir el gasto común." con "Importar planilla" y "Agregar unidad".
