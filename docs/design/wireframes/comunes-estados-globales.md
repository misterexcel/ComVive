# Wireframes: estados globales y patrones comunes

Estado: Borrador
Responsable: disenador-ux
Aprobación: líder del proyecto

Estados que se repiten en todas las superficies: 404, 403, sin conexión, error inesperado, conflicto 409 con vista previa, corte de conexión, clave de idempotencia reutilizada, sesión vencida y carga. Cada wireframe de flujo remite aquí en vez de repetirlos. Convenciones de dibujo en `README.md`. Componentes en `../design-system.md` (5.10, 5.11, 5.14, 5.15 y 6.1 a 6.3).

Fuentes: `docs/specs/gasto-comun.md` ("Respuestas de error" y "Códigos y mensajes de error"), `docs/arquitectura.md` §2 (respuestas neutras) y §3 (sesiones).

## Marco de la web de administración

Se usa en todas las pantallas `WEB-`. El comité ve el mismo marco, sin las entradas "Solo admin" del menú (Configuración e Invitaciones) y sin botones de acción.

```text
+-- Barra superior (64 px) -------------------------------------------------------------------
| ComVive    Comunidad: [ Edificio Los Aromos       v ]               Mi cuenta   Cerrar sesión
+-- Menú (240 px) --------+-- Área de trabajo -------------------------------------------------
| > Inicio                |
| > Gasto común           |   (contenido de la pantalla)
| > Pagos                 |
| > Cuentas por unidad    |
| > Unidades y residentes |
| > Reportes              |
| > Configuración         |   <- solo administrador
+-------------------------+---------------------------------------------------------------------
```

- El nombre de la comunidad activa se ve siempre (IA, "Comunidad activa").
- El selector solo lista comunidades con membresía vigente ("Mis comunidades", arquitectura §2).

## Marco de la app residente

Se usa en todas las pantallas `APP-`. Ancho de diseño 360 px.

```text
+-- Encabezado -------------------------
| Edificio Los Aromos
| Depto 101  [ Cambiar unidad v ]        <- solo si tiene varias (UX-13)
+---------------------------------------
|
| (contenido)
|
+-- Barra inferior (48 px) -------------
| Inicio   Pagos   Cobros   Más
+---------------------------------------
```

## GLB-01 · 404 neutro (web y consola)

Cuándo: el actor no puede ver el recurso (otra comunidad, membresía vencida, pantalla "Solo admin" pedida por el comité, ruta `/platform/...` desde una sesión de comunidad, intento fuera de la vista de Soporte). Mismo cuerpo exista o no el recurso.

```text
+-- Área de trabajo ------------------------------------------------
|
|                        (icono search-x, 48 px)
|
|          No encontramos lo que buscas o no tienes acceso
|
|                       [[ Volver al inicio ]]
|
+------------------------------------------------------------------
```

- Texto: spec, 404 `NOT_FOUND`. Botón: texto del diseño (UX-64).
- No muestra el identificador pedido, el nombre de la comunidad ni el tipo de recurso.
- El menú lateral sigue visible; "Volver al inicio" lleva a Inicio de la comunidad activa o, si no hay ninguna, a "Mis comunidades".

## GLB-02 · 404 neutro (app)

```text
+---------------------------------------
|
|        (icono search-x, 48 px)
|
|  No encontramos lo que buscas o no
|  tienes acceso
|
| [[        Volver al inicio        ]]
|
+---------------------------------------
| Inicio   Pagos   Cobros   Más
+---------------------------------------
```

- Casos típicos: el arrendatario abre el enlace de un aviso PDF (G-7), el comprobante completo de un pago de otro, el detalle de un intento que no inició él, o una unidad que ya no es suya (CA-23, CA-47, CA-60).
- Si la respuesta 404 es de **toda la unidad** (pérdida de acceso), se usa APP-09 de `app-inicio.md`, no esta pantalla.
- El **retorno inválido de Webpay** (H-32, CA-75) **no** usa esta pantalla: va a la pantalla genérica APP-PAG-10 de `app-hoja-de-pago.md`, con el texto de F-17 "No pudimos mostrar el resultado del pago. Revisa tu estado de cuenta en Inicio antes de pagar de nuevo" y "Volver al inicio" (S-83; pendiente de aprobación, P-59).

## GLB-03 · 403 en la misma pantalla (web)

Cuándo: el rol ve el recurso pero no puede hacer la acción y, aun así, la acción llegó a la API (por ejemplo, una pestaña antigua del comité o una llamada directa). El botón normalmente no existe para ese rol (design system 6.2).

```text
+-- Periodo octubre 2026 · <Emitido> --------------------------------
| {x} Tu rol no permite esta acción
|
| Gastos del periodo
| ...
+------------------------------------------------------------------
```

- Texto: spec, 403 `FORBIDDEN`. Banner `danger`, sin botón de cerrar mientras la pantalla siga abierta; no cambia de pantalla ni borra lo que se estaba viendo.

## GLB-04 · Sin conexión (app)

```text
+---------------------------------------
| {i} Sin conexión. Mostramos tus datos
|     del 20-11 a las 09:42.
+---------------------------------------
| Tu deuda                  <Vencida>
| $110.000
| Vencido desde 11-11-2026: $110.000
|
| [        Pagar gasto común         ]  <- desactivado
| Necesitas conexión para pagar
+---------------------------------------
```

- Primer texto: flujo `residente-estado-de-cuenta-y-pago.md`. "Necesitas conexión para pagar": texto del diseño (UX-63).
- Si la copia local tiene más de 7 días, se agrega "Estos datos tienen más de 7 días" (flujo `residente-primer-ingreso.md`, supuesto de diseño).
- Sin copia local (primer uso sin red): GLB-05 con "Reintentar".

## GLB-05 · Error inesperado

```text
Web y consola                                     App
+-- (bloque o pantalla) -------------------       +---------------------------------------
| {x} No se pudo completar la acción.             | (icono circle-alert)
|     Intenta de nuevo.                           | No se pudo completar la acción.
|     [ Reintentar ]                              | Intenta de nuevo.
+------------------------------------------       | [[          Reintentar           ]]
                                                  +---------------------------------------
```

- Texto del flujo de Soporte usado en todas las superficies (UX-64). Nunca muestra códigos ni trazas.
- En acciones de dinero no se usa este texto cuando hay corte de conexión: se usa GLB-07.

## GLB-06 · Conflicto 409 `PREVIEW_OUTDATED` (patrón)

Toda acción con vista previa (design system 5.10). Ejemplo con la emisión de CA-39: otro administrador agregó "Jardinería" $10.000 entre la vista previa v1 y la confirmación.

```text
Paso 1: el diálogo de confirmación se cierra solo.
Paso 2: banner arriba y vista previa nueva, pedida sola por la pantalla:

+-- Emitir periodo octubre 2026 ------------------------------------
| {!} El borrador cambió desde la vista previa. Revisa la nueva
|     vista previa antes de emitir
|
| Vista previa (nueva)                         ~~~~ cargando ~~~~
|
| Unidad      Deuda de      Ordinario    Fondo     Total
| | Depto 101  Propietario   $202.000    $10.100   $212.100  <Cambió>
| | Depto 102  Propietario   $252.500    $12.625   $265.125  <Cambió>
| | Depto 201  Propietario   $252.500    $12.625   $265.125  <Cambió>
| | Depto 202  Propietario   $303.000    $15.150   $318.150  <Cambió>
| Total emitido             $1.010.000  $50.500  $1.060.500  <Cambió>
|
| ( Volver al borrador )                     [[ Continuar ]]
+------------------------------------------------------------------
  "| " al inicio de la fila = borde izquierdo color.warning
```

- Mensaje del 409: el de la acción, según la tabla de A-7 (design system 5.10). La pantalla nunca reintenta sola la ejecución.
- "Cambió": texto del diseño (UX-61). Qué filas cambiaron lo decide la comparación de la vista previa anterior con la nueva (UX-56).
- Montos: GOLD-A39 (`docs/qa/comunidades-simuladas.md`).

## GLB-07 · Corte de conexión durante una acción de dinero

```text
+-- Diálogo de confirmación (no se puede cerrar) -------------------
|                     (indicador de progreso)
|      Revisando si el periodo quedó emitido…
+------------------------------------------------------------------
```

| Acción | Texto (de cada flujo) |
| --- | --- |
| Emitir | "Revisando si el periodo quedó emitido…" |
| Corregir o anular un gasto o egreso | "Revisando si la corrección quedó registrada…" |
| Registrar pago manual | "No se pudo confirmar el registro. Revisando…" |
| Ocupaciones, roles y tarea de comité | "Revisando si el cambio quedó registrado…" |

- Si quedó registrado, muestra el resultado normal. Si no, vuelve a enviar con la **misma** clave de idempotencia (design system 6.1).

## GLB-08 · Clave de idempotencia con otros datos (422 `IDEMPOTENCY_KEY_REUSED`)

```text
+-- (panel o diálogo) ---------------------------------------------
| {x} Esta operación ya se envió con otros datos. Vuelve a abrir
|     el formulario
|
|                                   [[ Volver a abrir el formulario ]]
+------------------------------------------------------------------
```

- Texto: spec. El botón cierra el panel y abre uno nuevo, con clave nueva y los datos que la pantalla aún conserve (design system 9, criterio 3.3.7). Texto del botón: diseño (UX-69).

## GLB-09 · Sesión vencida o acceso cambiado

| Superficie | Cuándo | Texto | Acción |
| --- | --- | --- | --- |
| Web | Rol revocado con una pestaña abierta | No es sesión vencida: la sesión sigue activa (H-42). La comunidad revocada responde 404 desde la petición siguiente y se muestra GLB-01 | La comunidad sale del selector; las demás siguen funcionando sin volver a ingresar |
| Web | 1 minuto antes de 30 minutos sin actividad | "Tu sesión se cerrará en 1 minuto por inactividad." con "Seguir conectado" (texto del diseño, UX-69; plazo: supuesto del flujo) | Mantiene la sesión |
| Consola | Rol de plataforma revocado o sesión vencida | "Tu sesión terminó. Vuelve a ingresar." (flujo de Soporte) | Lleva al ingreso |
| App | Sesión expirada al volver de Webpay | Pide ingreso y luego muestra el resultado del pago | El pago no depende de la sesión |

## GLB-10 · Carga

```text
Web (tabla)                                       App (tarjeta)
+---------------------------------------------    +---------------------------------------
| Unidad     Deuda del propietario   Vencido      | ~~~~~~~~~~~~~~
| ~~~~~~~    ~~~~~~~~~               ~~~~~~~      | ~~~~~~~~~~~~~~~~~~~~
| ~~~~~~~    ~~~~~~~~~               ~~~~~~~      | ~~~~~~~~~~~~~~~~~~~~~~~~
| ~~~~~~~    ~~~~~~~~~               ~~~~~~~      | [~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~]
+---------------------------------------------    +---------------------------------------
```

- Esqueleto con la forma real, después de 300 ms (design system 5.14). Encabezados reales visibles; solo las celdas van en esqueleto.
- Con copia local en la app: se muestran los datos guardados con "Actualizando…" en lugar del esqueleto.
- Bloqueantes: solo "Emitiendo periodo… no cierres esta ventana" y "Confirmando tu pago…".
