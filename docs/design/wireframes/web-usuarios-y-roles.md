# Wireframes: usuarios y roles, auditoría y Mi cuenta (web)

Estado: Borrador
Responsable: disenador-ux
Aprobación: líder del proyecto

Flujo: `../flujos/admin-usuarios-y-roles.md`. Superficie: web de administración (1280 px). La tarea "Revisar rol de comité" está en `web-inicio-y-tareas.md` y el otorgamiento de administradores, en `consola-plataforma.md` (CON-11).

Reglas que se ven en estas pantallas (spec "Otorgamiento de roles", S-34, S-43; arquitectura §3):

- El administrador otorga y revoca el comité, solo a propietarios registrados y con referencia a la asamblea.
- Ningún administrador agrega ni quita administradores: no ve la acción.
- "Usuarios y roles" es solo del administrador: el comité recibe GLB-01 por ruta directa.

Criterios de aceptación: CA-24, CA-43, CA-44, CA-57 y CA-64.

## WEB-USR-01 · Configuración > Usuarios y roles

Escenario: Comunidad A después de CA-43 y de la venta de CA-57 (tarea abierta).

```text
+-- Configuración · Usuarios y roles ---------------------------------------------------------
| Administradores
| Nombre           RUT            Desde        Otorgado por
| Carolina Lagos   10.987.654-2   {fecha}      ComVive
| Héctor Molina    11.223.344-K   {fecha}      ComVive
| Para agregar o quitar administradores, escribe a Operaciones ComVive.
|
| Comité                                                              [[ Agregar al comité ]]
| Nombre      Unidad      Desde        Asamblea                            Ingreso
| Rosa Díaz   —           {fecha}      Asamblea ordinaria del 20-10-2026   <Activo>
|             <Ya no es propietario: decisión pendiente>  > Ir a la tarea
|                                                                       [! Quitar del comité !]
|
| Residentes
| Las membresías de residentes nacen de las ocupaciones.     > Ir a Unidades y residentes
|
| > Historial de roles
+---------------------------------------------------------------------------------------------
```

- Textos del flujo. El equipo se llama "Operaciones ComVive", como en la spec (UX-65, cerrada).
- Si se decidió mantenerla: "Sin unidad en la comunidad: mantenido el {dd-mm-aaaa}" (flujo).
- Fechas "Desde": no las fija `comunidades-simuladas.md`.
- **Estados vacíos:** "Esta comunidad no tiene comité registrado en ComVive." con "Agregar al comité"; "Registra a los propietarios para poder elegir al comité." con enlace a Unidades y residentes.

## WEB-USR-02 · Agregar al comité

```text
+-- Panel: Agregar al comité ----------------------------------------------------------------
| Propietario (obligatorio)
| [ Buscar por nombre o unidad                                       ]
|   Ana Pérez · Depto 101
|   Luis Muñoz · Depto 102
|   Marco Silva · Depto 202
|   Rosa Díaz · Depto 201 · Ya integra el comité        <- no se puede elegir
|
| Asamblea que lo eligió (obligatorio)
| Fecha  [ 20-10-2026 (calendario) ]
| Referencia [ Asamblea ordinaria del 20-10-2026                     ]
| No incluyas datos personales
|
| ( Cancelar )                                                         [ Continuar ]
+---------------------------------------------------------------------------------------------

+-- Diálogo: Agregar al comité ------------------------------------------------
| Marco Silva podrá ver la información de la comunidad en modo lectura: gastos,
| pagos, deudas por unidad y avisos. Verá los RUT enmascarados y no verá
| teléfonos ni correos. Esta acción queda registrada.
| ( Cancelar )                                      [[ Agregar al comité ]]
+-------------------------------------------------------------------------------
```

- El buscador lista solo propietarios registrados; los arrendatarios no aparecen (flujo, paso 1). "Ya integra el comité": flujo.
- Resultado: rol otorgado; la persona recibe "Te dieron acceso como comité de tu comunidad en ComVive" con el enlace a la web (flujo).

**Errores**, en el orden de la API (S-34, CA-64): `ASSEMBLY_REFERENCE_REQUIRED` → `COMMITTEE_REQUIRES_OWNER` → `ADMIN_COMMITTEE_CONFLICT` → `ALREADY_COMMITTEE_MEMBER`.

| Caso | Código | Texto (spec) | Dónde |
| --- | --- | --- | --- |
| Sin fecha o sin referencia | 422 `ASSEMBLY_REFERENCE_REQUIRED` | "Indica la asamblea que eligió al comité: fecha y referencia" | Bajo los campos de asamblea |
| No es propietario registrado | 422 `COMMITTEE_REQUIRES_OWNER` | "El rol de comité solo se otorga a propietarios registrados de la comunidad" | Banner |
| Es administradora de la comunidad (CA-43: Ana Pérez en ese escenario) | 422 `ADMIN_COMMITTEE_CONFLICT` | "Esta persona es administradora de la comunidad. No puede integrar también el comité" | Banner |
| Ya integra el comité | 409 `ALREADY_COMMITTEE_MEMBER` | "Esta persona ya integra el comité" | Banner; el buscador ya la marca |
| Comité que intenta otorgar | 403 `FORBIDDEN` | "Tu rol no permite esta acción" | GLB-03 |
| Corte de conexión | — | "Revisando si el cambio quedó registrado…" | GLB-07 |

- `COMMITTEE_REQUIRES_OWNER` llega por API aunque el buscador solo muestre propietarios, por ejemplo si la persona vendió mientras el panel estaba abierto.

## WEB-USR-03 · Quitar del comité

```text
+-- Diálogo: Quitar del comité -----------------------------------------------
| Rosa Díaz dejará de ver la comunidad como comité de inmediato. Seguirá viendo
| su unidad como propietario.
|
| Motivo (obligatorio)
| [ Término del periodo                                      v ]
|   Término del periodo · Renuncia · Otro
|
| ( Cancelar )                                    [! Quitar del comité !]
+-------------------------------------------------------------------------------
```

- Texto del flujo. Con "Otro" aparece un campo de texto con "No incluyas datos personales". En el caso de Rosa Díaz, que ya no es propietaria, la frase "Seguirá viendo su unidad como propietario" no aplica. **Supuesto (a validar), UX-72:** la API indica si la persona conserva una unidad y el diálogo omite esa frase si no.
- Resultado: la tarea abierta de esa persona se cierra sola (`revoked_elsewhere`) y sale de Tareas pendientes.
- Sus sesiones no se cierran (H-42): desde su petición siguiente, lo que veía como comité le responde 404 (GLB-01); su app de propietario y sus otras comunidades siguen funcionando. Se eliminan sus suscripciones push de la membresía de comité. Por eso el diálogo ya no dice "Deberá volver a ingresar en sus dispositivos".

## WEB-USR-04 · Historial de roles

```text
+-- Historial de roles -----------------------------------------------------------------------
| Fecha        Acción                   Persona          Por               Vía          Referencia o motivo
| 20-11-2026   Revocó comité            Rosa Díaz        Carolina Lagos    Comunidad    Tarea: Ya no es copropietaria
| 15-11-2026   Tarea creada: revisar    Rosa Díaz        Venta registrada  Comunidad    Venta de Depto 201
|              rol de comité                             por Héctor Molina
| {fecha}      Otorgó comité            Rosa Díaz        Carolina Lagos    Comunidad    Asamblea ordinaria del 20-10-2026
| {fecha}      Otorgó administrador     Héctor Molina    ComVive           ComVive      Contrato de administración
+---------------------------------------------------------------------------------------------
```

- Fecha de la revocación: ilustrativa. **Estado vacío:** "Aún no hay cambios de roles."

## WEB-USR-05 · Registro de auditoría (MVP mínimo)

```text
+-- Configuración · Registro de auditoría ----------------------------------------------------
| Desde [ 01-11-2026 ] Hasta [ 30-11-2026 ]  Tipo: [ Todos v ]  Persona: [ Todas v ]
|
| Fecha y hora       Persona            Acción                                    Detalle
| 26-11-2026 10:14   Soporte ComVive    Registró un pago Webpay en revisión       OC-2026-0002 · Motivo: …
| 26-11-2026 10:09   Soporte ComVive    Consultó un pago Webpay en revisión       OC-2026-0002
| 20-11-2026 16:30   Carolina Lagos     Exportó la planilla de deudas             —
+---------------------------------------------------------------------------------------------
```

- Solo lectura, sin exportación en el MVP. Las acciones de Soporte se ven sin el nombre de la persona del equipo ComVive. **Supuesto (a validar), UX-73:** el registro de la comunidad muestra "Soporte ComVive" como actor, igual que "Intentos Webpay".
- Horas y fechas ilustrativas.

## WEB-USR-06 · Mi cuenta: segundo factor

```text
+-- Mi cuenta --------------------------------------------------------------------------------
| Datos de ingreso
| RUT 10.987.654-2 · Contacto de ingreso +56 9 **** 4321
|
| Segundo factor                                                   <Desactivado>
| Agrega un código de una app autenticadora al ingresar. Es opcional para administradores.
|                                                         [[ Activar segundo factor ]]
+---------------------------------------------------------------------------------------------
```

- Opcional para administradores en el MVP (decisión del líder; P-36). Método TOTP: **Supuesto (a validar)** de la arquitectura §3. Textos del diseño (UX-69). La activación (código QR y códigos de recuperación) depende del ADR 0005 y no se dibuja.
