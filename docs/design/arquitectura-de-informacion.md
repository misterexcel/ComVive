# Arquitectura de información

Estado: Borrador
Responsable: disenador-ux
Aprobación: líder del proyecto

Menús y pantallas de cada superficie. Cada pantalla va marcada como **[MVP]**, **[Posterior]** o **[Por definir]** (sin especificación ni decisión del líder). Los actores y las preguntas `UX-n` están en `mapa-de-usuarios.md`. "La spec" es `docs/specs/gasto-comun.md`.

## Reglas transversales

- **Comunidad activa:** toda pantalla de negocio pertenece a una comunidad, que se ve siempre (en el encabezado en la web y en el título en la app).
- **Montos:**
  - Se muestran en CLP enteros con separador de miles (`$1.050.000`), nunca con decimales.
  - Los campos de monto tienen máscara de miles y solo aceptan dígitos: no aceptan coma, punto decimal ni signo. Envían un entero en pesos. Un 0 se rechaza en el campo (B-5).
- **Alícuotas:**
  - Se ingresan como texto con hasta 4 decimales (`18,5` o `18,5000`). Se convierten a `aliquot_e6` leyendo el texto, sin números de punto flotante: `18,5000 %` = `185000`.
  - La suma de control se calcula con enteros y se muestra con 4 decimales: `99,9900 %`.
- **RUT:** se muestra completo solo al titular y al administrador. Para los demás va enmascarado (`12.345.***-*`) (G-2). Las vistas con RUT completo o deudas de terceros quedan en auditoría (arquitectura §5).
- **Permisos:** las acciones que el rol no puede hacer no se muestran.
- **Estados del periodo:** siempre las mismas etiquetas: **Borrador**, **Emitido**, **Cerrado**. Siempre existe un único borrador vigente (A-2).
- **Montos calculados:** ninguna pantalla calcula montos. Totales, vistas previas, imputaciones y ajustes vienen de la API.
- **Pantallas de intereses:** con el flag `billing.interest` apagado no se muestra ninguna (sección E de la spec).

## 1. Web de administración (administrador y comité)

La pantalla tiene una barra superior con el selector de comunidad, un menú lateral y el área de trabajo. El comité ve el mismo árbol en modo lectura, sin los elementos marcados con (A).

```text
Inicio de sesión                                   [MVP]
Mis comunidades (lista, sin cifras agregadas)      [MVP]
  + Nueva comunidad (A)                            [MVP]
Panel consolidado multi-comunidad                  [Posterior] (UX-18)

Comunidad activa
├── Resumen                                        [MVP]
│   ├── Borrador vigente y último periodo emitido
│   ├── Recaudación del último periodo emitido
│   └── Unidades con cuotas impagas (F-8)
├── Gasto común
│   ├── Periodos (lista con estado; el borrador vigente va arriba)   [MVP]
│   ├── Borrador vigente
│   │   ├── Gastos: agregar, editar, eliminar (A)                    [MVP]
│   │   ├── Cargos directos: consumo, multa, otros (A) (B-4)         [MVP]
│   │   ├── Egresos del fondo de reserva (A) (B-3)                   [MVP]
│   │   ├── Ajustes recibidos de periodos anteriores (lectura)       [MVP]
│   │   ├── Vista previa de cargos por unidad (issue-preview)        [MVP]
│   │   └── Emitir periodo (A)                                       [MVP]
│   └── Periodo emitido o cerrado
│       ├── Gastos y cargos (lectura)                                [MVP]
│       ├── Corregir gasto o cargo directo (A) (sección H)           [MVP]
│       ├── Avisos de cobro (PDF, reenviar)                          [MVP]
│       └── Cerrar periodo (A, solo si está emitido)                 [MVP]
├── Pagos
│   ├── Lista de pagos (filtros: periodo, medio, unidad, estado)     [MVP]
│   ├── Registrar pago manual (A)                                    [MVP]
│   ├── Detalle de pago: imputaciones, anular (A)                    [MVP]
│   └── Pagos por identificar                                        [Por definir] (UX-11)
├── Cuentas por unidad
│   ├── Tabla de unidades: saldo, deuda vencida, cuotas impagas      [MVP]
│   ├── Estado de cuenta de la unidad, por ámbito                    [MVP]
│   └── Exportar planilla con deudas (A, auditado)                   [MVP]
├── Unidades y residentes
│   ├── Unidades: código, tipo, alícuota, sort_order (A)             [MVP]
│   ├── Residentes y ocupaciones, con RUT (A)                        [MVP]
│   ├── Invitaciones: enviar, reenviar, estado (A)                   [MVP]
│   └── Importar desde planilla: validar y confirmar (A)             [MVP]
├── Conciliación bancaria                                            [Posterior] (fuera de alcance en la spec)
├── Reportes
│   ├── Ingresos y egresos del mes, fondo de reserva                 [MVP]
│   └── Reportes para asamblea                                       [Posterior]
├── Comunicados                                                      [Posterior]
├── Reservas de espacios comunes                                     [Posterior]
├── Conserjería (consulta de encomiendas y visitas)                  [Posterior]
└── Configuración (A)
    ├── Datos de la comunidad                                        [MVP]
    ├── Cobro: fondo de reserva y plazo de vencimiento               [MVP]
    ├── Intereses: tasa del reglamento (solo con el flag activo)     [MVP, rebanada posterior]
    ├── Usuarios y roles (administrador, comité)                     [MVP]
    └── Registro de auditoría (consulta)                             [Posterior]
```

La tasa CMF de referencia no aparece en la web del administrador: es un dato global que carga el equipo de ComVive (E-4).

**Patrones de la web:**

- **Tablas:** orden por columna, filtros y búsqueda por código de unidad.
- **Acciones masivas:** reenviar avisos y enviar invitaciones.
- **Acciones irreversibles:** emitir, cerrar, corregir y anular piden confirmación con un resumen que entrega la API, y envían una clave de idempotencia.
- **Exportar planilla:** solo el administrador puede hacerlo y queda en auditoría.

## 2. App residente (propietario y arrendatario)

La navegación es una barra inferior con 3 pestañas. Si la persona tiene varias unidades o comunidades, Inicio muestra un selector en el encabezado.

```text
Bienvenida e invitación                            [MVP]
Ingreso con RUT y código                           [MVP]
Selector de comunidad y unidad                     [MVP]

Pestañas
├── Inicio (estado de cuenta de mi ámbito)         [MVP]
│   ├── Total a pagar y fecha de vencimiento
│   ├── Botón "Pagar gasto común"
│   ├── Aviso de deuda vencida (E-8, solo con el flag activo)
│   ├── Desglose: periodo actual, saldo anterior de mi ámbito, multas, saldo a favor
│   ├── Resultado del pago: aprobado, rechazado, cancelado, en proceso
│   └── Comunicados recientes                      [Posterior]
├── Pagos                                          [MVP]
│   ├── Historial de pagos con estado
│   └── Comprobante de pago
├── Cobros                                         [MVP]
│   ├── Propietario: avisos de cobro por periodo, con PDF para ver y compartir
│   └── Arrendatario: detalle del periodo en pantalla, solo de su ventana, sin PDF
└── Más
    ├── Mi perfil y contacto                       [MVP]
    ├── Mis unidades y comunidades                 [MVP]
    ├── Resumen de gastos y saldo de caja de la comunidad (solo propietario)   [MVP]
    ├── Privacidad y términos                      [MVP]
    ├── Notificaciones                             [MVP]
    ├── Encomiendas                                [Posterior]
    ├── Reservas                                   [Posterior]
    ├── Visitas preautorizadas                     [Posterior]
    └── Cerrar sesión (borra la copia local)       [MVP]
```

**Patrones de la app residente:**

- **Inicio:** responde en una mirada: cuánto, hasta cuándo y el botón para pagar.
- **Botón principal:** ocupa todo el ancho, mide al menos 48 px de alto y se ve sin desplazar.
- **Arrendatario:** ve el mismo árbol limitado a su ventana (F-9). No hay textos, montos ni enlaces sobre la deuda del propietario. Si pide la ruta del PDF del aviso, la API responde 404.
- **Copia local:** se borra al cerrar sesión o al perder el acceso. Las notificaciones no muestran montos en la pantalla bloqueada.

## 3. Modo conserjería (tablet)

**[Posterior].** El MVP no tiene pantallas de conserjería. El borrador de referencia es `flujos/conserje-encomienda.md`. Cuando exista la especificación de conserjería se definirá el árbol, con botones de al menos 56 px, flujos de 3 pasos o menos, sin datos financieros, y con la copia local borrada al cerrar sesión o al perder el acceso.

## Pendiente

- `docs/design/design-system.md`: colores, tipografía, espaciado y componentes.
- `docs/design/wireframes/`: Inicio de la app residente (propietario y arrendatario), borrador vigente en la web y vista previa de emisión.
