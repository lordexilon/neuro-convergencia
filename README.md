# Neuro Convergencia

Bitácora personal en español para observar un detonante, reconocer una reacción y explorar una respuesta consciente.

## Estado del prototipo

- Wizard de tres pasos con energía percibida, reactividad, sesgo y focos seleccionables.
- Regulación guiada y revisión final.
- Acceso por enlace de correo y registros privados en Supabase mediante RLS.
- Guardado con confirmación real e historial de los últimos 20 registros, recuperable después de recargar.
- El borrador sin guardar se conserva en localStorage del navegador; salir o cambiar de cuenta lo limpia. Evitar perfiles de navegador compartidos.
- Introducción guiada, hábitos e hitos disponibles. Edición, borrado y exportación de registros no están implementados.

La energía es una autoevaluación. La aplicación no ofrece diagnóstico ni acredita resultados clínicos.

## Desarrollo

Requiere Node.js compatible con Next.js 16. Dentro de `app/`:

```sh
npm ci
npm run dev
```

Abrir http://127.0.0.1:3108. Para compilar: `npm run build`. Validación de entradas: `npm test`.

## Supabase

Docker local: ejecutar `supabase start` dentro de `app/`. La configuración usa un stack `neuro_convergencia` en puertos 565xx, separado de SCA Matrix. Studio local está en http://127.0.0.1:56523 y el correo de prueba en http://127.0.0.1:56524.

Copiar `.env.example` a `.env.local` y completar únicamente la URL y clave pública del proyecto. La migración en `app/supabase/migrations/` es del producto; no aplicarla a SCA Matrix ni a una base ajena.

Cloud: aplicar la misma migración al proyecto de producto, configurar Site URL y redirects permitidos para el frontend, y mantener confirmación de correo. La entrega de correos a usuarios externos requiere verificar el proveedor SMTP y sus límites; el correo local de Docker no envía a internet.

Las pruebas de integración `node tests/integration.cjs local` y `node tests/integration.cjs cloud` requieren los entornos locales explícitos de prueba y credencial administrativa privada. Crean dos usuarios ficticios, validan aislamiento y retiran sus datos al terminar. No usar con proyectos ajenos ni con usuarios reales.

## Vercel

Configurar `app` como Root Directory y `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` con los datos públicos de Supabase Cloud. Nunca usar una clave service role en variables `NEXT_PUBLIC_`. Producción: https://neuro-convergencia.vercel.app.

El contexto SCA, Studio administrativo, entornos y evidencias locales quedan fuera del repositorio público. No introducir secretos en código o commits.

## Postulación al piloto (N31, preparada para activación)

El formulario envía nombre, correo, rol y consentimiento de contacto a `POST /api/pilot/applications`. Solo confirma el registro cuando Supabase devuelve el identificador de esa solicitud. No envía correos, no reserva cupos y no guarda nuevos prospectos en localStorage.

La migración `app/supabase/migrations/20261015_pilot_applications.sql` está preparada y **no aplicada**. Crea una tabla sin permisos de lectura para clientes y una función de inserción con reintentos por UUID. Usa la configuración pública del Supabase de producto, sin clave administrativa. Mientras falte la migración o el servicio no confirme la escritura, el formulario muestra error y permite reintentar sin borrar los campos.

Antes de activar: aprobar y aplicar la migración exclusivamente al proyecto de producto, verificar inserción/reintento/aislamiento con datos ficticios autorizados y probar el formulario en navegador. Definir además protección contra postulaciones automatizadas, responsable de atención y plazo de conservación. Las pruebas unitarias simulan Supabase y no prueban persistencia ni permisos reales. Los prospectos guardados por versiones anteriores en `nc_pilot_leads` no se migran automáticamente.

## Privacidad del espejo (N32, cambio local)

La guía local se calcula en el navegador sin solicitar IA externa. La consulta a Grok requiere una casilla inicialmente desmarcada y un clic explícito. El endpoint también exige `externalAiConsent: true` antes de llamar al proveedor. El payload incluye solo los campos de reflexión descritos en la interfaz, sin identificadores de cuenta ni aprendizaje final. El contenido libre puede contener datos personales introducidos por el usuario.

Clave BYOK y resultado permanecen solo en memoria de la vista. Cambiar de reflexión/cuenta o retirar el consentimiento reinicia esos datos. Al abrir la app se intenta eliminar exclusivamente la antigua clave `neuro_byok_grok_key` y las entradas `neuro_ai_cache_*`, conservando el borrador. No se garantiza borrado retroactivo de datos ya enviados a xAI, ni se atribuyen al proveedor condiciones de retención o entrenamiento no verificadas. Adoptar un micro-paso lo incorpora al borrador local y al registro si luego se guarda.

Las pruebas de N32 verifican el bloqueo sin consentimiento, la minimización del payload y la limpieza de almacenamiento mediante simulación. No verifican condiciones contractuales del proveedor, UX de navegador ni una llamada real a xAI.

## Sesión y cuotas de IA (N33, preparadas para activación)

El navegador envía su access token al endpoint propio. El servidor verifica ese token contra Auth de Supabase y utiliza únicamente el ID devuelto por Auth, sin confiar en identidades o límites enviados en el body. Rechaza usuarios anónimos. La guía local no requiere sesión. Referencia: [validación de sesión con Supabase](https://supabase.com/docs/guides/auth/server-side/advanced-guide).

Antes de una consulta externa, una función de PostgreSQL reserva atómicamente cuota por usuario y global. Solo `service_role` puede ejecutar esa función. La migración `app/supabase/migrations/20261015_ai_quota.sql` está preparada, **sin aplicar**. Los contadores no contienen reflexiones ni claves. BYOK requiere la misma autenticación y consume las mismas cuotas. Se reserva antes de llamar al proveedor y no se devuelven cupos ante errores o timeouts.

Configuración propuesta en `app/.env.example`: `AI_EXTERNAL_ENABLED=false` por defecto, 5 consultas por ventana fija de 600 segundos, 20 por usuario/día y 100 globales/día. Los días se cuentan en UTC y las ventanas fijas permiten ráfagas al cruzar sus límites. El límite global cuenta intentos de consultas, incluyendo BYOK, y **no es un presupuesto monetario ni prueba de ahorro**. Los contadores anteriores a dos días completos se limpian durante nuevas reservas, sin prometer borrado puntual si no hay actividad.

Para activar, primero aprobar/aplicar la migración en el Supabase de producto, configurar `SUPABASE_SERVICE_ROLE_KEY` exclusivamente en el servidor con la clave del producto (nunca Matrix ni `NEXT_PUBLIC_*`), verificar permisos, concurrencia y aislamiento con datos ficticios autorizados, y luego habilitar `AI_EXTERNAL_ENABLED=true`. Sin configuración, Auth verificable o reserva confirmada, el endpoint devuelve la guía local y no llama a xAI. No hay fallback a contadores en memoria. Las pruebas unitarias simulan Auth y la reserva; no demuestran la atomicidad real de PostgreSQL, persistencia entre réplicas ni UX autenticada.

## Oferta y evaluación del piloto (N34, preparadas)

La oferta es un piloto gratuito de 21 días, sin tarjeta ni renovación automática, para hasta 20 participantes con un facilitador. La postulación no garantiza cupo ni fecha. La continuidad de pago se definirá aparte. No se prometen exportaciones, panel de facilitador ni historial ilimitado. La autorización de contacto no autoriza medir actividad: el organizador debe obtener consentimiento de evaluación adicional antes de inscribir al participante en una cohorte.

El reporte de operador `app/scripts/pilot-report.cjs` consulta solamente `id,owner_id,created_at` de registros persistidos y emite agregados de activación a 48 h, D7, D21, práctica en 14 días y actividad de semana 3. No lee reflexiones ni escribe en la base. Recorre toda la ventana de 21 días con paginación, sin el límite de 20 registros de la interfaz. Suprime métricas para grupos menores de cinco participantes y mantiene ventanas no cumplidas y pagos no instrumentados como `null`/N/D, no cero. Los umbrales de éxito son internos y no demuestran por sí solos validación comercial.

Para uso posterior autorizado, preparar un archivo privado `app/pilot-cohort.local.json` (excluido de Git) con esta estructura. El ejemplo es ficticio e incompleto; no acredita consentimiento real:

```json
{
  "id": "cohorte-1",
  "startsAt": "2026-11-01T00:00:00-03:00",
  "timeZone": "America/Asuncion",
  "members": [
    {"userId": "00000000-0000-4000-8000-000000000001", "consentedAt": "2026-10-31T12:00:00-03:00", "consentVersion": "pilot-metrics-v1"}
  ]
}
```

La lista debe contener solo participantes confirmados con autorización vigente previa al inicio, sin correos ni nombres; un facilitador no integra el denominador. Una casilla o un timestamp escrito en el archivo no reemplaza evidencia de consentimiento. Mantener el roster bajo acceso del organizador y detener la lectura si se retira la autorización. Todo cambio de denominador debe documentarse antes de comparar reportes.

El script permanece deshabilitado por defecto. Después de verificar y autorizar proyecto/lectura, configurar en un entorno privado `PILOT_REPORT_ENABLED=true`, `PILOT_REPORT_PRODUCT_URL` igual a la URL verificada del producto, y la clave de servidor del mismo proyecto. Desde `app/`: `node --env-file=.env.local scripts/pilot-report.cjs --cohort pilot-cohort.local.json`. No ejecutar contra SCA Matrix ni publicar el archivo de cohorte o reportes. La fecha de corte la toma el script al ejecutar. La lectura paginada no garantiza snapshot transaccional ante cambios administrativos simultáneos.

No se ejecutó el reporte contra usuarios reales ni se definió fecha efectiva de lanzamiento. Los resultados de pruebas usan fixtures sintéticos y no son tracción. No hay checkout, fuente de pagos ni ingresos medidos.

## Navegación al regresar (N35)

La pantalla principal recupera y observa la sesión antes de mostrar el contenido. Una sesión recuperada o un nuevo inicio abre la bitácora; renovar el token mantiene la vista elegida. Cerrar sesión vuelve a la portada y limpia el estado privado en memoria. El borrador anónimo se conserva al iniciar sesión; cambiar de cuenta o salir limpia el borrador según el comportamiento existente. AccountPanel usa la sesión compartida y no crea otra suscripción.

El usuario puede abrir el mapa voluntariamente. En ese caso se conservan video y metodología, sin repetir los botones de inicio del hero ni el bloque final de captación. La convocatoria queda como consulta secundaria porque no existe un estado de inscripción confirmada conectado. El acceso a onboarding se etiqueta “Revisar introducción” solo si el perfil confirma `onboarding_completed`; ante estado desconocido se mantiene “Introducción”.

Pruebas: recuperación de sesión, eventos posteriores frente a bootstrap atrasado, conservación de navegación al renovar token y limpieza de la suscripción. Navegador local verificado como visitante; el comportamiento con una sesión real sigue pendiente de QA. No se cambian autenticación del servidor, permisos ni migraciones con N35.

## Mejoras de UX (N36, locales)

Bitácora coloca el formulario antes del acceso y los hitos; estos comienzan minimizados. En revisión, el visitante puede enfocar el acceso mediante «Acceder para guardar», sin perder su reflexión. El menú móvil usa dos columnas y anuncia la vista actual.

Piloto y privacidad usan un diálogo modal nativo, con foco inicial, ciclo Tab/Shift+Tab, cierre Escape, devolución del foco al disparador y bloqueo del scroll del fondo. El formulario del piloto conserva nombre/correo/rol y consentimiento, con condiciones detalladas desplegables. No hay cambios en la persistencia ni el consentimiento del backend.

La introducción y Bitácora comparten el formulario de acceso por enlace enviado al correo. La ayuda del correo está contraída y no atribuye un remitente no verificado. Los pasos de introducción orientan el foco al título. Las marcas de énfasis en Hábitos y el espejo se presentan como texto/strong/em de React, sin interpretar HTML ni enlaces.
