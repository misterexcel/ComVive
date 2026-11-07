# Arquitectura de información

Estado: Borrador
Responsable: disenador-ux
Aprobación: líder del proyecto

Menús y pantallas de cada superficie. Marcas: **[MVP]**, **[Posterior]** y **[Por definir]** (sin especificación ni decisión del líder). Los actores y las preguntas `UX-n` están en `mapa-de-usuarios.md`.

## Reglas transversales

- Toda pantalla de negocio pertenece a **una** comunidad. La comunidad activa se ve siempre (encabezado en web, título en app).
- Los montos se muestran en CLP enteros con separador de miles: `$1.050.000`. Nunca decimales.
- Los porcentajes de alícuota se muestran con coma decimal: `18,50 %`.
- El RUT se muestra enmascarado (`12.345.***-*`) salvo al titular y a roles autorizados (spec, G-2).
- Las acciones que el rol no puede hacer **no se muestran** (no se dejan deshabilitadas), salvo cuando explicar el porqué ayuda (p. ej. "Los pagos Webpay no se anulan desde ComVive").
- Los estados del periodo usan siempre las mismas etiquetas: **Borrador**, **Emitido**, **Cerrado**.

## 1. Web de administración (administrador y comité)

Estructura: barra superior con selector de comunidad, menú lateral y área de trabajo. El comité ve el mismo árbol en modo lectura, sin los elementos marcados con (A).

```text
Inicio de sesión                                   [MVP]
Mis comunidades (lista, sin cifras agregadas)      [MVP]
  + Nueva comunidad (A)                            [MVP]
Panel consolidado multi-comunidad                  [Posterior] (UX-18)

Comunidad activa
├── Resumen                                        [MVP]
│   ├── Periodo actual y su estado
│   ├── Recaudación del periodo vs. emitido
│   ├── Unidades con cuotas impagas (contador F-8)
│   └── Tareas pendientes (p. ej. "Registrar tope CMF del mes")
├── Gasto común
│   ├── Periodos (lista con estado)                [MVP]
│   └── Detalle de periodo
│       ├── Gastos (agregar, editar, eliminar en Borrador) (A)   [MVP]
│       ├── Cargos individuales: multas, consumos, otros (A)     [MVP]
│       ├── Lecturas de consumo (ingreso manual) (A)             [MVP]
│       ├── Egresos del fondo de reserva (A)                     [MVP]
│       ├── Ajustes de periodos anteriores (A)                   [MVP]
│       ├── Vista previa de cargos por unidad                    [MVP]
│       ├── Emitir periodo (A)                                   [MVP]
│       ├── Avisos de cobro (PDF, reenviar)                      [MVP]
│       └── Cerrar periodo (A)                                   [MVP]
├── Pagos
│   ├── Lista de pagos (filtros: periodo, medio, unidad, estado) [MVP]
│   ├── Registrar pago manual (A)                                [MVP]
│   ├── Detalle de pago: imputaciones, anular (A)                [MVP]
│   └── Pagos por identificar                                    [Por definir] (UX-11)
├── Cuentas por unidad
│   ├── Tabla de unidades: saldo, deuda vencida, cuotas impagas  [MVP]
│   ├── Estado de cuenta de la unidad (libro, cargos, pagos)     [MVP]
│   └── Exportar a planilla                                      [MVP]
├── Unidades y residentes
│   ├── Unidades: código, tipo, alícuota, orden de prorrateo (A) [MVP]
│   ├── Residentes y ocupaciones (propietario, arrendatario) (A) [MVP]
│   ├── Invitaciones (enviar, reenviar, estado) (A)              [MVP]
│   └── Importar desde planilla (A)                              [MVP]
├── Conciliación bancaria                                        [Por definir] (UX-20)
├── Reportes
│   ├── Ingresos y egresos del mes, fondo de reserva             [MVP]
│   └── Reportes avanzados y para asamblea                       [Posterior]
├── Comunicados                                                  [Posterior]
├── Reservas de espacios comunes                                 [Posterior]
├── Conserjería (encomiendas y visitas, consulta)                [Posterior]
└── Configuración (A)
    ├── Datos de la comunidad y cuenta bancaria                  [MVP]
    ├── Cobro: fondo de reserva, vencimiento, intereses          [MVP]
    ├── Tasa CMF de referencia del mes                           [MVP]
    ├── Usuarios y roles (administrador, comité, conserje)       [MVP]
    └── Registro de auditoría (consulta)                         [Posterior]
```

**Patrones de la web:**

- Tablas con orden por columna, filtro, búsqueda por código de unidad y exportación.
- Acciones masivas donde aplican: reenviar avisos, enviar invitaciones.
- Toda acción irreversible (emitir, cerrar, anular) pide confirmación con resumen de lo que va a pasar.
- Atajo de búsqueda global de unidad (`/`).

## 2. App residente (propietario y arrendatario)

Navegación inferior con 3 pestañas. Si la persona tiene varias unidades o comunidades, un selector en el encabezado de Inicio.

```text
Bienvenida e invitación                            [MVP]
Ingreso con código                                 [MVP]
Selector de comunidad y unidad                     [MVP]

Pestañas
├── Inicio (estado de cuenta)                      [MVP]
│   ├── Total a pagar y fecha de vencimiento
│   ├── Botón "Pagar gasto común"
│   ├── Desglose: periodo actual, deuda anterior, intereses, multas, saldo a favor
│   ├── Detalle de cargos del periodo (por cuenta)
│   ├── Resultado de pago (aprobado, rechazado, en proceso)
│   ├── Mis encomiendas pendientes                 [Propuesta MVP] (UX-9)
│   └── Comunicados recientes                      [Posterior]
├── Pagos                                          [MVP]
│   ├── Historial de pagos con estado
│   └── Comprobante de pago
├── Avisos                                         [MVP]
│   ├── Lista de avisos de cobro por periodo
│   └── Aviso en PDF (ver, compartir)
└── Más
    ├── Mi perfil y contacto                       [MVP]
    ├── Mis unidades y comunidades                 [MVP]
    ├── Privacidad y términos                      [MVP]
    ├── Notificaciones                             [MVP]
    ├── Resumen de gastos de la comunidad          [MVP] (spec, permisos del propietario)
    ├── Reservas                                   [Posterior]
    ├── Visitas preautorizadas                     [Posterior]
    └── Cerrar sesión                              [MVP]
```

**Patrones de la app residente:**

- Inicio responde en una mirada: cuánto, hasta cuándo, y el botón para pagar.
- El botón principal ocupa el ancho de la pantalla, alto mínimo 48 px, siempre visible sin desplazar.
- El arrendatario ve el mismo árbol, con datos desde su fecha de ingreso (S-14).

## 3. Modo conserjería (tablet)

Pantalla de inicio con botones grandes. Sin menú lateral ni pestañas.

```text
Ingreso del conserje (usuario y PIN)               [Por definir] (UX-10)
Inicio de portería
├── Registrar encomienda                           [Propuesta MVP]
├── Entregar encomienda                            [Propuesta MVP]
├── Encomiendas pendientes (lista por unidad)      [Propuesta MVP]
├── Registrar visita                               [Posterior]
├── Bitácora del turno                             [Posterior]
└── Cambiar de conserje                            [Por definir] (UX-10)
```

**Patrones del modo conserjería:**

- Botones de al menos 56 px de alto y texto de 20 px o más.
- Búsqueda de unidad con teclado numérico grande y resultados al escribir.
- Muestra nombre y unidad del residente; nunca RUT, teléfono completo ni deudas (arquitectura §3 y §5).
- Confirmaciones visibles de 3 segundos y regreso automático al inicio.

## Pendiente

- `docs/design/design-system.md`: colores, tipografía, espaciado y componentes, en el siguiente entregable.
- `docs/design/wireframes/`: Inicio de la app residente, detalle de periodo (web) e inicio de portería, como primeras pantallas clave.
