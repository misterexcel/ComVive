# Wireframes: invitación, primer ingreso e ingresos siguientes (app residente)

Estado: **Aprobado** (aprobado por el líder del proyecto el 2026-11-08, cierre de la Etapa 1)
Responsable: disenador-ux
Aprobación: líder del proyecto

Flujo: `../flujos/residente-primer-ingreso.md`. Superficie: app residente (360 px). Método de ingreso: **Supuesto (a validar)**, RUT más código de un solo uso (UX-7, ADR 0005).

Escenario: Ana Pérez (RUT 12.345.678-5), propietaria del Depto 101 de la Comunidad A, Edificio Los Aromos (`docs/qa/comunidades-simuladas.md`). Para el arrendatario, Pedro Soto (15.234.567-4), ocupación O-1 del Depto 102.

Criterios de aceptación: CA-23 (404 en unidades ajenas), CA-46 (RUT completo en pantalla para el titular), CA-53 (ocupación programada sin acceso) y CA-60 (aviso de privacidad del arrendatario).

## APP-ING-01 · Mensaje de invitación (fuera de la app)

```text
+-- SMS o correo -----------------------
| Te invitaron a ComVive para ver y
| pagar tu gasto común. Abre el enlace
| para continuar.
| > comvive.cl/i/...
|
| (solo arrendatario)
| El propietario de la unidad puede ver
| tu nombre, tu deuda de gasto común y
| los pagos que se aplican a ella. La
| administración de la comunidad ve
| todos tus datos de cobro
+---------------------------------------
```

- No nombra la comunidad ni la unidad, por si el contacto está equivocado (flujo, paso 1).
- Texto del arrendatario: spec, "Datos del arrendatario que ve el propietario" (S-44, CA-60), copiado tal cual, sin punto final.

## APP-ING-02 · Bienvenida e ingreso del RUT

```text
+---------------------------------------
|              ComVive
|
| Para continuar, ingresa tu RUT.
|
| RUT (obligatorio)
| [ 12.345.678-5                    ]
|
| [[           Continuar           ]]
|
| > Cómo usamos tus datos
+---------------------------------------
```

- El RUT se formatea al salir del campo (`12.345.678-5`) y acepta `K` mayúscula o minúscula (design system 4.3).
- **Error del dígito verificador:** se muestra bajo el campo, con el texto de `INVALID_RUT`, igual en todas las superficies (UX-60, cerrada).

```text
| RUT (obligatorio)
| [ 12.345.678-9                    ]   <- inválido a propósito
| (!) Ingresa un RUT válido. Revisa el
|     dígito verificador
```

- El RUT del ejemplo de error es **inválido a propósito**: el dígito verificador correcto de `12.345.678` es `5` (`12.345.678-5`, el RUT válido de los demás ejemplos). Se escribe `-9` para mostrar cuándo aparece el error.

## APP-ING-03 · Código de un solo uso

```text
+---------------------------------------
| < Atrás
|
| Si el RUT está registrado, te enviamos
| un código a +56 9 **** 1234
|
| Código de 6 dígitos (obligatorio)
| [ _  _  _  _  _  _ ]   <- teclado numérico,
|                           se puede pegar
|
| [[           Ingresar            ]]
|
| Podrás pedir otro código en 0:42
| > ¿No te llegó el código?
+---------------------------------------
```

- Respuesta neutra: si el RUT no existe, la pantalla es la misma, sin contacto ("Si el RUT está registrado, te enviamos un código").
- El código acepta pegar y autocompletar del sistema (WCAG 3.3.8).
- Botón en carga: "Enviando…" al pedir otro código; temporizador de 60 segundos (flujo, "Carga").

**Errores** (textos del flujo; ninguno dice cuál dato falló ni cuántos intentos quedan):

```text
| {x} No pudimos validar tus datos.
```

| Caso | Texto | Comportamiento |
| --- | --- | --- |
| RUT o código no coinciden | "No pudimos validar tus datos." | Limpia el código y mantiene el foco en el campo |
| Límite de fallos por (RUT, dispositivo) | "Demasiados intentos. Espera 15 minutos e intenta de nuevo." | Desactiva "Ingresar" en este dispositivo |
| Límite de envíos | "Ya te enviamos varios códigos. Espera un momento antes de pedir otro." | No envía otro código |
| Código vencido | "El código venció. Pide uno nuevo." | Botón "Enviar otro código" |
| No llega el código | "¿No te llegó el código? Pide a tu administración que revise tu teléfono o correo." | El contacto no se cambia desde la app |
| Invitación vencida | "Esta invitación venció. Pide una nueva a tu administración." | Sin acceso |
| Invitación ya usada | "Esta invitación ya fue usada. Ingresa con tu RUT." | Lleva a APP-ING-02 |

## APP-ING-04 · Confirmación de la unidad (solo con invitación)

```text
+---------------------------------------
| Te damos la bienvenida
|
| Edificio Los Aromos · Depto 101 ·
| Propietario
|
| Nombre
| Ana Pérez
|
| RUT
| 12.345.678-5        <- completo: es su RUT
|
| [[           Continuar           ]]
+---------------------------------------
```

- Solo aparece si el RUT y el código coinciden con la invitación (flujo, paso 6).
- Si el RUT ya tiene cuenta, no pide datos: muestra la línea de la unidad y "Se agregó esta unidad a tu cuenta" (texto del diseño, UX-69).
- El nombre lo corrige la administración, no la persona (IA, "Mi perfil y contacto (lectura)").

## APP-ING-05 · Cómo usamos tus datos

```text
+---------------------------------------
| Cómo usamos tus datos
|
| Quién los trata
| Tu comunidad, a través de su
| administración. ComVive es el
| proveedor del servicio.        (UX-31)
|
| Qué datos
| RUT, nombre, contacto, unidad, cargos
| y pagos.
|
| Para qué
| Cobrar el gasto común y avisarte de
| cobros y pagos.
|
| Quién más los ve
| La administración. El comité ve tu
| nombre, unidad, alícuota y deuda, con
| el RUT enmascarado y sin tus
| contactos.
|
| (solo arrendatario, caja info)
| {i} El propietario de la unidad puede
|     ver tu nombre, tu deuda de gasto
|     común y los pagos que se aplican a
|     ella. La administración de la
|     comunidad ve todos tus datos de
|     cobro
|
| > Ejercer mis derechos
| > Política de privacidad completa
|
| [[           Continuar           ]]
+---------------------------------------
```

- Pantalla informativa: el botón dice "Continuar", nunca "Aceptar" (flujo, paso 8).
- Para el arrendatario, la línea "Quién más los ve" del comité no aplica: el comité lo ve solo como "Arrendatario", sin nombre (S-33). **Supuesto (a validar), UX-31:** quién es el responsable del tratamiento.

## APP-ING-06 · Permisos opcionales

```text
+---------------------------------------
| Notificaciones
|
| Te avisaremos cuando llegue tu gasto
| común y cuando se confirme un pago.
| Los avisos no muestran montos en la
| pantalla bloqueada.
|
| [[            Activar            ]]
| [            Ahora no             ]
+---------------------------------------
```

- "Activar" abre el permiso del sistema. "Ahora no" no quita acceso. Se cambia en Más > Notificaciones.
- WhatsApp: **Posterior**, no se dibuja.

## APP-ING-07 · Ingresos siguientes: elegir comunidad y unidad

```text
+---------------------------------------
| ¿Qué unidad quieres ver?
|
| Edificio Los Aromos
| +-----------------------------------
| | Depto 101 · Propietario        >
| +-----------------------------------
|
| Condominio Las Brisas
| +-----------------------------------
| | Casa 2 · Propietario           >
| +-----------------------------------
+---------------------------------------
```

- Solo si tiene más de una unidad o comunidad; si no, va directo a Inicio. Filas de 56 px.
- La segunda comunidad es ilustrativa (la Comunidad B no tiene personas en `comunidades-simuladas.md`).
- La app recuerda la última unidad usada (flujo de estado de cuenta, diagrama).

**Estados vacíos y errores de acceso:**

```text
Sin membresías vigentes                   Ocupación programada (CA-53)
+--------------------------------------   +--------------------------------------
| No tienes comunidades activas en        | Tu acceso comienza el 05-12-2026.
| ComVive. Si crees que es un error,      |
| contacta a tu administración.           | [          Cerrar sesión          ]
|                                         +--------------------------------------
| [          Cerrar sesión          ]
+--------------------------------------
```

- Textos del flujo. La fecha de la ocupación programada es la de O-4 (Daniela Fuentes, CA-53).

## Carga

- Envío del código: "Enviando…" en el botón y temporizador visible.
- Validación del código: indicador en el botón "Ingresar"; no admite otro toque.
