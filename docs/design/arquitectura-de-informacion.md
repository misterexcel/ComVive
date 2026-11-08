# Arquitectura de información

Estado: Borrador
Responsable: disenador-ux
Aprobación: líder del proyecto

> **Revisión crítica 2 del diseño (`docs/revisiones/2026-11-07-diseno-rev2.md`): cambios aplicados.** Deuda por ámbito sin saldos netos (M1, M2), pantalla "Intentos Webpay" (M4), ocupaciones (M7), usuarios y roles (M9), consola de plataforma, marcas de permisos del comité (menor 2), 4 pestañas en la app (menor 1), exportaciones (menor 16), configuración de intereses y resumen (menor 18) y textos neutros de 404 y 403 (menor 15).
>
> **Revisión crítica 3 del diseño (`docs/revisiones/2026-11-07-diseno-rev3.md`): cambios aplicados.** La portada de la web pasa a llamarse **Inicio**, con **Tareas pendientes** ("Revisar rol de comité", M-7). Textos de pagos de F-17 en la app (M-8). Resultado de Soporte solo en la confirmación inmediata (M-5). Vista previa del término y de la venta (M-6). Texto de 403 y regla 404 o 403 de la spec (M-4, menor 5). Saldo de caja según G-4 (menor 6). "Mi cuenta" con segundo factor opcional para administradores.

Menús y pantallas de cada superficie. Cada pantalla va marcada como **[MVP]**, **[Posterior]** o **[Por definir]** (sin especificación ni decisión del líder). Los actores y las preguntas `UX-n` están en `mapa-de-usuarios.md`. "La spec" es `docs/specs/gasto-comun.md`.

## Reglas transversales

- **Comunidad activa:** toda pantalla de negocio pertenece a una comunidad, que se ve siempre (en el encabezado en la web y en el título en la app).
- **Montos:**
  - Se muestran en CLP enteros con separador de miles (`$1.050.000`), nunca con decimales.
  - Los campos de monto tienen máscara de miles y solo aceptan dígitos: no aceptan coma, punto decimal ni signo. Envían un entero en pesos. Un 0 se rechaza en el campo (B-5).
  - **Excepciones explícitas:** "Anular gasto" usa $0 como monto correcto sin campo de monto (H-6), y el saldo de caja acepta $0 y un selector de saldo negativo, con valor absoluto hasta $9.999.999.999 (G-4, S-45, CA-58).
  - **Máximo:** ningún monto ingresado supera $9.999.999.999 (B-6).
- **Deuda por ámbito (F-9, M1, M2):** ninguna pantalla muestra un saldo neto que compense ámbitos. Donde hay arrendatario vigente se muestran por separado la deuda y el saldo a favor del propietario y los del arrendatario. Siempre se dice "ámbito" en los documentos y "deuda del propietario" o "deuda del arrendatario" en la interfaz.
- **Alícuotas:**
  - Se ingresan como texto con hasta 4 decimales, con coma o punto (`18,5`, `18.5` o `18,5000`). Se convierten a `aliquot_e6` leyendo el texto, sin números de punto flotante: `18,5000 %` = `185000`.
  - La suma de control se calcula con enteros y se muestra con 4 decimales: `99,9900 %`.
- **RUT:**
  - En pantalla, completo solo para el titular y el administrador; para los demás, enmascarado (`12.345.***-*`).
  - En el PDF del aviso, **siempre enmascarado**, para todos, incluido el titular (G-2, S-30, CA-46; P-19).
  - Las vistas con RUT completo o deudas de terceros quedan en auditoría (arquitectura §5).
- **Permisos y marcas:**
  - **(A):** acción solo del administrador. El comité ve la pantalla, pero no el botón.
  - **(Solo admin):** pantalla oculta al comité. Si llega por ruta directa, ve el 404 neutro.
  - Las acciones que el rol no puede hacer no se muestran.
- **Errores neutros (spec, "Respuestas de error"; decisión del líder, M-4):**
  - **404 `NOT_FOUND`**, cuando la persona no puede ver el recurso: "No encontramos lo que buscas o no tienes acceso", igual en web, app y consola, exista o no el recurso.
  - **403 `FORBIDDEN`**, solo cuando la persona ve el recurso pero su rol no permite la acción: "Tu rol no permite esta acción".
- **Textos de la spec:** todo mensaje con código de error y todo texto de pagos se copia tal cual desde la tabla "Códigos y mensajes de error" y la regla F-17 de la spec. El diseño no usa variantes.
- **Estados del periodo:** siempre las mismas etiquetas: **Borrador**, **Emitido**, **Cerrado**. Siempre existe un único borrador vigente (A-2).
- **Montos calculados:** ninguna pantalla calcula montos. Totales, vistas previas, imputaciones, traspasos y ajustes vienen de la API.
- **Vistas previas con versión (A-7):** emitir, corregir o anular un gasto, anular un pago, registrar un arrendatario, terminar un arriendo, registrar una venta y resolver un intento Webpay se confirman contra la versión de su vista previa. Si cambió, la pantalla muestra el mensaje de la spec y pide una vista previa nueva.
- **Textos libres que aparecen en avisos** (motivos de corrección, anulación y multa; conceptos de gasto): llevan la ayuda "No incluyas datos personales".
- **Pantallas de intereses:** con el flag `billing.interest` apagado no se muestra ninguna pantalla de cálculo ni aviso de intereses. La única excepción es "Configuración > Cobro > Intereses", que permite cargar la tasa antes de activar (E-3; menor 18).

## 1. Web de administración (administrador y comité)

La pantalla tiene una barra superior con el selector de comunidad, un menú lateral y el área de trabajo. El comité ve el mismo árbol en modo lectura, sin los botones (A) ni las pantallas (Solo admin).

```text
Inicio de sesión (RUT, código y segundo factor si lo activó)   [MVP]
Mis comunidades (lista, sin cifras agregadas)      [MVP]
  (las comunidades nuevas las crea Operaciones ComVive; aparecen con "Configuración pendiente")
Mi cuenta: datos de ingreso y segundo factor (opcional para administradores)   [MVP]
Panel consolidado multi-comunidad                  [Posterior] (UX-18)

Comunidad activa
├── Inicio                                         [MVP]
│   ├── Tareas pendientes (Solo admin): "Revisar rol de comité de {nombre}"   [MVP]
│   ├── Lista de puesta en marcha (hasta completarla; incluye "Pago en línea: pendiente o activo")
│   ├── Alertas: avisos sin notificar, avisos PDF con error, intentos Webpay en revisión
│   ├── Borrador vigente y último periodo emitido
│   ├── Recaudación del último periodo emitido (ver definición abajo)
│   └── Unidades con cuotas impagas (F-8)
├── Gasto común
│   ├── Periodos (lista con estado; el borrador vigente va arriba)   [MVP]
│   ├── Borrador vigente
│   │   ├── Gastos: agregar, editar, eliminar (A)                    [MVP]
│   │   ├── Cargos directos: consumo, multa, otros (A) (B-4)         [MVP]
│   │   ├── Egresos del fondo de reserva (A) (B-3)                   [MVP]
│   │   ├── Ajustes recibidos de periodos anteriores (lectura)       [MVP]
│   │   ├── Vista previa de cargos por unidad y ámbito (issue-preview)   [MVP]
│   │   └── Emitir periodo (A)                                       [MVP]
│   └── Periodo emitido o cerrado
│       ├── Gastos y cargos (lectura; gastos anulados con su etiqueta)    [MVP]
│       ├── Corregir gasto o cargo directo (A) (H-1 a H-5)           [MVP]
│       ├── Anular gasto (A) (H-6)                                   [MVP]
│       ├── Avisos de cobro: PDF por unidad, estado de notificación, reenviar (A)   [MVP]
│       ├── Descargar todos los avisos (Solo admin, auditado)        [MVP]
│       └── Cerrar periodo (A, solo si está emitido)                 [MVP]
├── Pagos
│   ├── Lista de pagos (filtros: periodo, medio, unidad, ámbito, estado)   [MVP]
│   ├── Registrar pago manual (A)                                    [MVP]
│   ├── Detalle de pago: imputaciones por ámbito, anular (A)         [MVP]
│   ├── Intentos Webpay: en revisión y resueltos (lectura; los resuelve Soporte ComVive)   [MVP]
│   └── Pagos por identificar                                        [Por definir] (UX-11)
├── Cuentas por unidad
│   ├── Tabla de unidades: deuda y saldo a favor por ámbito, vencido, cuotas impagas   [MVP]
│   ├── Estado de cuenta de la unidad, por ámbito, con traspasos     [MVP]
│   └── Exportar planilla con deudas (Solo admin, auditado)          [MVP]
├── Unidades y residentes
│   ├── Unidades: código, tipo, alícuota, sort_order (edición: A)    [MVP]
│   ├── Registro de copropietarios (comité: nombre, unidad, alícuota, deuda, RUT enmascarado)   [MVP]
│   ├── Ocupantes de la unidad: arriendos (vigente y programado), término, venta, historial (acciones: A)   [MVP]
│   ├── Invitaciones: enviar, reenviar, estado (Solo admin)          [MVP]
│   └── Importar desde planilla: validar y confirmar (Solo admin)    [MVP]
├── Conciliación bancaria                                            [Posterior] (fuera de alcance en la spec)
├── Reportes
│   ├── Ingresos y egresos del mes, fondo de reserva                 [MVP]
│   └── Reportes para asamblea                                       [Posterior]
├── Comunicados                                                      [Posterior]
├── Reservas de espacios comunes                                     [Posterior]
├── Conserjería (consulta de encomiendas y visitas)                  [Posterior]
└── Configuración (Solo admin)
    ├── Datos de la comunidad y medios de pago                       [MVP]
    ├── Cobro: fondo de reserva y plazo de vencimiento               [MVP]
    ├── Cobro > Intereses: tasa del reglamento (versionada) y activación   [MVP, rebanada posterior]
    ├── Usuarios y roles: administradores (lectura), comité (A), historial   [MVP]
    └── Registro de auditoría: roles, tareas de comité, Soporte ComVive y exportaciones   [MVP mínimo; el resto Posterior]
```

La tasa CMF de referencia no aparece en la web del administrador: es un dato global que carga el equipo de ComVive (E-4).

**Definiciones de pantallas:**

- **Inicio > Tareas pendientes (Solo admin; M-7, CA-57):** alerta fija arriba de Inicio, que no se puede descartar. Lista las tareas abiertas de la comunidad (`GET .../admin-tasks?status=open`). En el MVP hay un solo tipo, "Revisar rol de comité de {nombre}", que se crea al registrar la venta de la última unidad de un miembro del comité. Cada tarea muestra la fecha de la venta, quién la registró y "Decidir" (revocar o mantener el rol, con motivo). Queda visible hasta que un administrador decida; no vence. Si no hay tareas, el bloque no aparece. Al comité y a los residentes les responde 404. Flujo: `flujos/admin-usuarios-y-roles.md`.
- **Tabla de unidades (Cuentas por unidad):** columnas Unidad, Propietario, Deuda del propietario, A favor del propietario, Deuda del arrendatario, A favor del arrendatario, Vencido desde, Cuotas impagas. Sin columna de saldo neto. "Vencido desde" y "Cuotas impagas" son por unidad (F-8, S-64); la celda de "Vencido desde" dice "Venció el {dd-mm-aaaa}". Para el comité, la columna Propietario muestra el nombre y el RUT enmascarado, y el arrendatario solo como "Arrendatario" (S-33, CA-44).
- **Recaudación del último periodo emitido (Inicio; menor 18):** "Recaudado de {periodo}: ${monto} de ${total emitido} ({n} %)", donde el recaudado es lo imputado a los cargos de ese periodo, y aparte "Pagos recibidos este mes: ${monto}". Ambos los entrega la API. **Supuesto (a validar)**, definición a confirmar con el analista (UX-43).
- **Cobro > Intereses (menor 18):**
  - **Tasa del reglamento:** se carga con su fecha de inicio de vigencia y su referencia; cada cambio crea una versión nueva y la lista muestra las anteriores (E-3).
  - **Estado:** "Intereses por mora: desactivados" o "activos desde {fecha}".
  - **Activar:** botón (A) que exige una tasa vigente ("Configura la tasa de interés del reglamento antes de activar los intereses", E-3) y una confirmación con la fecha de activación. **Supuesto (a validar):** lo activa el administrador de la comunidad, con auditoría (UX-44).
- **Exportar planilla con deudas (menor 16):** solo el administrador, con confirmación "Esta planilla contiene datos personales y deudas. Quedará registrada". Contenido mínimo: unidad, nombre del propietario, RUT enmascarado, deuda y saldo a favor por ámbito, vencido desde, cuotas impagas. Sin teléfonos ni correos (supuesto, UX-45). La descarga de todos los avisos en un archivo también es solo del administrador y queda en auditoría. El comité descarga avisos y reportes de a uno.
- **Intentos Webpay:** ver `flujos/plataforma-soporte-webpay.md`, "Lo que ven el administrador y el comité".

**Patrones de la web:**

- **Tablas:** orden por columna, filtros y búsqueda por código de unidad.
- **Acciones masivas:** reenviar avisos y enviar invitaciones.
- **Acciones irreversibles:** emitir, cerrar, corregir, anular gasto, anular pago, terminar arriendo, registrar venta y decidir una tarea de comité piden confirmación con un resumen que entrega la API, se confirman contra su versión y envían una clave de idempotencia.

## 2. App residente (propietario y arrendatario)

La navegación es una barra inferior con **4 pestañas**: Inicio, Pagos, Cobros y Más. Si la persona tiene varias unidades o comunidades, Inicio muestra un selector en el encabezado.

```text
Bienvenida e invitación                            [MVP]
Ingreso con RUT y código                           [MVP]
Cómo usamos tus datos (informativa)                [MVP]
Permisos opcionales: notificaciones                [MVP]; WhatsApp [Posterior]
Selector de comunidad y unidad                     [MVP]

Pestañas
├── Inicio                                         [MVP]
│   ├── Tu deuda (propietario) o Tu gasto común (arrendatario): monto, vencido desde, por vencer el
│   ├── Deuda del arrendatario (solo propietario con arrendatario vigente), aparte, sin total combinado
│   ├── Botón "Pagar gasto común" (solo si la comunidad tiene Webpay); si no, el texto de F-17 y "Cómo pagar"
│   ├── Hoja "¿Qué quieres pagar?": Mi deuda, Deuda del arrendatario, Ambas (solo propietario)
│   ├── Aviso de deuda vencida (E-8, solo con el flag activo)
│   ├── Desglose por ámbito: periodo actual, saldo anterior, multas, ajustes, saldo a favor
│   ├── Resultado del pago (textos de F-17): Pagado por ti, rechazado, cancelado, en proceso,
│   │   "En revisión por ComVive", no registrado (devolución solicitada), anulado en Transbank
│   └── Comunicados recientes                      [Posterior]
├── Pagos                                          [MVP]
│   ├── Historial de pagos con ámbito y quién pagó (Pagado por ti, por el propietario,
│   │   por el arrendatario, Registrado por la administración) y estado de los intentos propios
│   └── Comprobante de pago (el arrendatario no ve el comprobante completo de pagos de otros)
├── Cobros                                         [MVP]
│   ├── Propietario: avisos de cobro por periodo, con PDF (RUT enmascarado) para ver y compartir
│   ├── Arrendatario: vista del cobro de su ámbito (G-7) y "Comprobante de cobro" en PDF (no es el aviso legal)
│   └── Resumen de gastos de la comunidad (G-8), para ambos
└── Más
    ├── Mi perfil y contacto (lectura; lo corrige la administración)   [MVP]
    ├── Mis unidades y comunidades                 [MVP]
    ├── Cómo pagar (medios de pago de la comunidad)   [MVP]
    ├── Privacidad: cómo usamos tus datos, ejercer mis derechos, política   [MVP]
    ├── Notificaciones: push y, después, WhatsApp  [MVP]
    ├── Encomiendas                                [Posterior]
    ├── Reservas                                   [Posterior]
    ├── Visitas preautorizadas                     [Posterior]
    └── Cerrar sesión (borra la copia local)       [MVP]
```

**Patrones de la app residente:**

- **Inicio:** responde en una mirada: cuánto debo, desde cuándo o hasta cuándo, y el botón para pagar.
- **Botón principal:** ocupa todo el ancho, mide al menos 48 px de alto y se ve sin desplazar.
- **Arrendatario:** ve el mismo árbol limitado a su ámbito (F-9). No hay textos, montos ni enlaces sobre la deuda del propietario. Sus pagos dicen "Pagado por ti"; los del propietario en su ámbito, "Pagado por el propietario", con el monto de su ámbito; los manuales, "Registrado por la administración" (F-12, F-17).
- **Propietario:** en "Deuda del arrendatario" ve los pagos del arrendatario como "Pagado por el arrendatario" y los manuales como "Registrado por la administración"; los suyos, como "Pagado por ti" (F-12, F-17, S-48).
- **Quién pagó:** la API entrega `payerKind` (`self`, `owner`, `tenant` o `administration`) y la app muestra el texto de F-17 que corresponde. Con `payerKind` nulo (pago Webpay de un propietario anterior, S-51, CA-63) no se muestra etiqueta. Un intento propio en curso se muestra como "Tienes un pago en proceso" (F-17). Detalle en `flujos/residente-estado-de-cuenta-y-pago.md`.
- **Copia local:** se borra al cerrar sesión, al perder el acceso o tras 30 días sin sincronizar. Las notificaciones no muestran montos en la pantalla bloqueada.

## 3. Modo conserjería (tablet)

**[Posterior].** El MVP no tiene pantallas de conserjería. El borrador de referencia es `flujos/conserje-encomienda.md`. Cuando exista la especificación de conserjería se definirá el árbol, con botones de al menos 56 px, flujos de 3 pasos o menos, sin datos financieros, y con la copia local borrada al cerrar sesión o al perder el acceso.

## 4. Consola de plataforma (equipo ComVive)

Web separada, con su propio ingreso (segundo factor) y sesión. No comparte menú con la web de administración. Mínima y auditada.

```text
Ingreso con RUT, código y segundo factor           [MVP]
Soporte ComVive (platform_support)
└── Pagos Webpay en revisión: lista, detalle, registrar, marcar para reverso, confirmar reverso, resolver sin cobro   [MVP]
    (el resultado se ve solo en la confirmación inmediata; después se vuelve a la lista)
Operaciones ComVive (platform_operations)
├── Crear comunidad con su primer administrador    [MVP]
├── Otorgar y revocar administradores              [MVP]
└── Estado del pago en línea de cada comunidad, solo lectura        [MVP]
```

Activar el pago en línea (código de comercio) es un procedimiento auditado de Operaciones ComVive, sin pantalla en el MVP (ADR 0007; UX-33 cerrada, Menor 5 de la revisión crítica 4). La consola solo muestra si está "Activo" o "Pendiente" (CON-11).

Flujos: `flujos/plataforma-soporte-webpay.md` y `flujos/admin-usuarios-y-roles.md`.

## Pendiente

- Design system: entregado en `docs/design/design-system.md` (Borrador).
- Wireframes: entregados en `docs/design/wireframes/` (Borrador), con el índice de pantallas y la trazabilidad a flujos y CA en su `README.md`.
- Sin wireframe todavía: Reportes y "Configuración > Cobro > Intereses" (esperan UX-43 y UX-44) y pagos por identificar (UX-11). Activar el pago en línea no lleva pantalla en el MVP (UX-33 cerrada).
