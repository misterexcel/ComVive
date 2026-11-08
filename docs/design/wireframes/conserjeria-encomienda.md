# Wireframes de referencia: encomiendas en conserjería (Posterior)

Estado: Borrador · **Posterior** (no entra al MVP)
Responsable: disenador-ux
Aprobación: líder del proyecto

Flujo: `../flujos/conserje-encomienda.md`. Superficie: tablet horizontal en portería (1024 px), botones de 56 px y texto base de 20 px (design system, sección 2). Es una referencia de diseño: no define reglas de negocio y se revisará cuando exista la especificación de conserjería.

El conserje no ve nada del gasto común: ni deudas, ni RUT, ni montos (spec CA-24; arquitectura §3). Escenario: Juan Castro, conserje de la Comunidad A.

## CNJ-01 · Inicio de portería

```text
+-- Portería · Edificio Los Aromos ------------------------------------------- Juan Castro ---
|
|   +--------------------------------------+    +--------------------------------------+
|   |                                      |    |                                      |
|   |      (package)                       |    |      (package-check)                 |
|   |      Registrar encomienda            |    |      Entregar encomienda             |
|   |                                      |    |                                      |
|   +--------------------------------------+    +--------------------------------------+
|
+---------------------------------------------------------------------------------------------
```

## CNJ-02 · Registrar en 3 pasos

```text
Paso 1: unidad                         Paso 2: destinatario              Paso 3: tipo
+----------------------------------    +-----------------------------    +-----------------------------
| Unidad                               | Depto 101                        | Depto 101 · Ana Pérez
| [ 101                       ]        |                                  |
| > Depto 101                          | [  Ana Pérez              ]      | [ Paquete ] [ Sobre ] [ Otro ]
|                                      | [  Para la unidad         ]      | Nota (opcional) [          ]
| [ 1 ][ 2 ][ 3 ]                      |                                  |
| [ 4 ][ 5 ][ 6 ]                      |                                  | [[        Guardar         ]]
| [ 7 ][ 8 ][ 9 ]                      |                                  |
| [ ← ][ 0 ][ ✓ ]                      |                                  |
+----------------------------------    +-----------------------------    +-----------------------------
```

- Destinatarios: solo el nombre. Resultado: "Encomienda registrada para Depto 101" durante 3 segundos y vuelta al inicio (única excepción a los avisos que no desaparecen, design system 5.11).
- Unidad inexistente: "No hay una unidad 1010. Revisa el número." Guardar: "Guardando…" con bloqueo del doble toque.

## CNJ-03 · Entregar

```text
+-- Entregar encomienda · Depto 101 ----------------------------------------------------------
| [x] Paquete · 20-11-2026 09:12 · Para Ana Pérez
| [ ] Sobre · 21-11-2026 15:40 · Para la unidad
|
| Nombre de quien retira (obligatorio)  [                              ]
|
|                                                          [[ Confirmar entrega ]]
+---------------------------------------------------------------------------------------------
```

- Sin pendientes: "No hay encomiendas por entregar." Fechas ilustrativas.
- Quien retira se registra sin RUT (supuesto del flujo). Pendientes del flujo: ingreso en tablet compartida, retención (Ley 21.719), notificación "Para la unidad", fotos y modo sin conexión.
