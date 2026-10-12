# Neuro Convergencia

Bitácora personal en español para observar un detonante, reconocer una reacción y explorar una respuesta consciente.

## Estado del prototipo

- Wizard de tres pasos con energía percibida, reactividad, sesgo y focos seleccionables.
- Regulación guiada y revisión final.
- Acceso por enlace de correo y registros privados en Supabase mediante RLS.
- Guardado con confirmación real e historial de los últimos 20 registros, recuperable después de recargar.
- El borrador sin guardar se mantiene únicamente en memoria: recargar lo elimina.
- Onboarding y gamificación están pendientes. Edición, borrado y exportación de registros no están implementados.

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
