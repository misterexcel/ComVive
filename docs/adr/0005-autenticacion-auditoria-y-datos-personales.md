# ADR 0005 · Autenticación, auditoría y datos personales

- **Estado:** Propuesto (requiere aprobación del líder del proyecto)
- **Fecha:** 2026-11-07
- **Propone:** arquitecto de software
- **Decide:** líder del proyecto
- **Relacionados:** ADR 0002 (identidad global, membresía por comunidad), ADR 0006 (sesión de plataforma), ADR 0007 (aviso al pagador sin membresía)

## Contexto

ComVive trata RUT, deudas y datos de visitas (regla 7 de `CLAUDE.md`, Ley 21.719): solo lo mínimo necesario, acceso por rol y registro de auditoría. Los usuarios son muy distintos: residentes que entran desde la app con poca frecuencia, administradores que operan varias comunidades desde la web y el equipo de ComVive con acceso transversal acotado (ADR 0006). La persona se reconoce por su RUT, nunca por su correo ni su teléfono (`docs/design/flujos/residente-primer-ingreso.md`), y el diseño supone ingreso sin contraseña: RUT más un código de un solo uso (UX-7).

`docs/arquitectura.md` §7 deja abierto si la identidad es propia o se delega en Google Identity Platform, y §5 pide evaluar el cifrado de columna del RUT.

## Decisión

1. **Identidad propia en la API (NestJS), sin proveedor externo de identidad:**
   - Ingreso con RUT y un código de un solo uso enviado al **contacto de ingreso verificado** de `PERSON` (único por persona). Respuesta neutra: "Si el RUT está registrado, te enviamos un código".
   - Canales del código en el MVP: SMS y correo, a través del proveedor de correo y SMS (su elección es un ADR posterior, `docs/arquitectura.md` §7). WhatsApp como canal de ingreso queda para el ADR del proveedor de WhatsApp, que está fuera del stack y requiere aprobación.
2. **Segundo factor:** obligatorio en la audiencia `platform` y opcional para administradores en el MVP (decisión del líder). Método propuesto: TOTP de una app autenticadora, con códigos de recuperación de un solo uso; el secreto TOTP se guarda cifrado en la aplicación con una clave del gestor de secretos.
3. **Sesiones y revocación:** `SESSION` con audiencia (`community` o `platform`), vencimiento y revocación. Token de acceso firmado de corta vida y renovación ligada a una `SESSION` vigente. El guard lee la membresía en cada petición (ADR 0002), así que revocar un rol corta el acceso de inmediato; además, la revocación cierra todas las sesiones de la persona y desvincula sus suscripciones push de esa comunidad, en la misma transacción.
4. **Límites de ingreso separados (`LOGIN_THROTTLE`, RUT guardado como HMAC):** por (RUT, dispositivo), por IP (primera barrera en Cloud Armor y segunda en la API) y por envíos de códigos (por RUT e IP y por RUT al día), con alerta en Sentry. Nadie puede bloquear el ingreso de otra persona escribiendo su RUT en otro dispositivo.
5. **Auditoría (`AUDIT_LOG`) de solo inserción, en la misma transacción que la operación:** toda escritura sobre dinero, periodos, ocupaciones, membresías, alícuotas y datos personales; otorgamientos y revocaciones; tareas del administrador; toda petición de plataforma (incluidas las lecturas); avisos a personas sin membresía; y las lecturas de datos de terceros (RUT completo, deudas de terceros, intentos de terceros, visitas), incluida la lectura del propietario sobre el ámbito del arrendatario (`owner.tenant_scope.read`, uno por petición, sin montos ni datos del arrendatario). **Sin registro no hay respuesta** en las lecturas auditadas obligatorias.
6. **RUT:** normalizado y enmascarado en la API salvo para los roles autorizados (el filtro lo aplica la API; el campo no viaja). En el MVP **no se cifra la columna del RUT** a nivel de aplicación: se confía en el cifrado en reposo de Cloud SQL, el acceso por rol, el enmascarado y la auditoría de lecturas con RUT completo. El RUT solo se guarda como HMAC en `LOGIN_THROTTLE`.
7. **Residencia y terceros:** datos en Google Cloud, región Santiago (`southamerica-west1`). Sentry recibe errores sin datos personales (depuración antes del envío).
8. **App:** copia local por comunidad cifrada con una clave en el almacenamiento seguro del sistema (`expo-secure-store`), borrada al perder acceso, al cerrar sesión o tras 30 días sin sincronizar. Los push se envían solo tras verificar en ese momento que la membresía esté vigente, sin excepciones.
9. **Aviso a quien inició un pago y ya no tiene membresía:** no es un push; es un correo (o SMS si no hay correo verificado) con plantilla fija, sin montos, deudas, unidad ni enlaces, ligado al intento Webpay y auditado (`notification.sent_without_membership`).
10. **Supresión:** anonimiza a la persona sin borrar movimientos del libro (reglas 5 y 6).

## Alternativas consideradas

| Opción | Por qué se descarta |
| --- | --- |
| Google Identity Platform | Está en Google Cloud, pero identifica por correo o teléfono, no por RUT: habría que mantener igual la tabla de personas, el mapeo con el RUT, las sesiones con audiencia, la revocación inmediata y los límites por (RUT, dispositivo). Agrega una dependencia y un segundo lugar con datos personales, cuya ubicación de procesamiento habría que validar frente a la Ley 21.719, sin quitar trabajo real. Se puede reconsiderar si se agregan métodos federados. |
| Proveedores de identidad como servicio (Auth0, Clerk u otros) | Fuera del stack de `CLAUDE.md`, datos fuera de Chile y costo por usuario activo. Mismo problema del RUT como identificador. |
| ClaveÚnica | Identifica por RUT y es conocida en Chile, pero su uso está orientado a servicios del Estado (Supuesto (a validar)); no se puede depender de ella para el MVP. |
| Contraseña | Más soporte (olvidos, reutilización) y peor experiencia para residentes que entran poco. El diseño ya supone ingreso sin contraseña (UX-7). |
| Bloqueo del ingreso solo por RUT | Permite bloquear a otra persona escribiendo su RUT (rev. 2, hallazgo 12). |
| Cifrado de columna del RUT con Cloud KMS desde el MVP | Exige un índice ciego (HMAC) para buscar y mantener la unicidad, complica migraciones y soporte, y protege poco mientras las deudas del libro no se cifran. Se reconsidera antes del Piloto con el abogado (ver "Supuestos"). |
| Segundo factor por SMS | Vulnerable a duplicado de SIM; para la audiencia `platform`, que ve datos de todas las comunidades, el riesgo no se justifica. |

## Consecuencias

### Positivas

- Un solo lugar para identidad, sesiones, límites y auditoría, con las reglas de ComVive (RUT, audiencias, revocación inmediata) como código propio y probado.
- Menos terceros que procesan datos personales.
- El aislamiento y la auditoría se verifican con pruebas automáticas en la misma API.

### Negativas

- ComVive es responsable de la seguridad del ingreso: generación y vencimiento de códigos, firma de tokens, rotación de claves y recuperación del segundo factor.
- El envío de códigos depende del proveedor de correo y SMS, que aún no está elegido.
- Las lecturas auditadas agregan una escritura por petición.

### Riesgos

- **Abuso de envío de SMS (costo):** mitigación con los límites de envío y la alerta en Sentry.
- **Pérdida del segundo factor de una persona de plataforma:** mitigación con códigos de recuperación y un procedimiento de restablecimiento aprobado por el líder y auditado.
- **Filtración de una copia de la base de datos:** expone RUT y deudas en claro (cifrado en reposo de Cloud SQL protege el disco, no la copia lógica). Mitigación: acceso a respaldos restringido y auditado; revisión del cifrado de columna antes del Piloto.
- **Contacto de ingreso desactualizado:** la persona no recibe el código. Mitigación: un flujo auditado de cambio de contacto, que se define en el diseño de usuarios y roles antes de la Etapa 2.

## Supuestos (a validar) y preguntas abiertas

- **Supuestos (a validar) de la arquitectura §3:** contacto de ingreso único por persona; TOTP con códigos de recuperación; límites de 5 códigos fallidos por (RUT, dispositivo) con bloqueo de 15 minutos, 30 intentos por IP cada 10 minutos, 5 envíos por hora por (RUT, IP) y 20 por día por RUT; token de acceso de 15 minutos; sesión de plataforma de 8 horas; revocación de todas las sesiones de la persona.
- **Supuestos (a validar) de la arquitectura §5:** auditoría de lecturas por petición; copia local de 30 días; aviso sin membresía por correo o, si no hay, por SMS.
- **ADR-0005-S1 · Supuesto (a validar):** la web cierra la sesión tras 30 minutos sin actividad, con aviso un minuto antes (supuesto de diseño de `docs/design/flujos/admin-usuarios-y-roles.md`); la app no tiene cierre por inactividad.
- **ADR-0005-S2 · Supuesto (a validar):** no cifrar la columna del RUT en el MVP es proporcional bajo la Ley 21.719, con las medidas de la decisión 6. Se valida con el abogado antes del Piloto.
- **ADR-0005-S3 · Supuesto (a validar):** ClaveÚnica no está disponible para un servicio privado como ComVive.
- **Spec:** S-30 (RUT enmascarado en el PDF), S-42 y P-37 (aviso sin membresía), S-44 y P-34 (lectura del propietario), P-19 (RUT completo en el aviso), P-23 (remuneraciones), P-36 (segundo factor de administradores).
- **Preguntas de `docs/arquitectura.md` §8:** 7 (retención), 8 (transferencia internacional a Sentry, Expo Push y proveedores de mensajería), 12 (revocación de sesiones), 13 (segundo factor de administradores), 15 y 16.
- **Diseño:** UX-7 (método de ingreso) en `docs/design/mapa-de-usuarios.md`.

## Referencias

- `docs/arquitectura.md` §3 ("Ingreso, sesiones y límites", revocación) y §5 (auditoría, minimización, push, copia local, aviso sin membresía).
- `docs/specs/gasto-comun.md`: "Usuarios y permisos" (segundo factor), "Auditoría", "Datos del arrendatario que ve el propietario" (S-44), "Datos de copropietarios que ve el comité", F-13 (aviso al pagador sin membresía); CA-44, CA-46 y CA-60.
- `docs/design/flujos/residente-primer-ingreso.md` y `docs/design/flujos/admin-usuarios-y-roles.md`.
- `CLAUDE.md`: reglas 7, 8 y 9.
