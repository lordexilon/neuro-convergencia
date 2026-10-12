# Neuro Convergencia

Bitácora personal en español para observar un detonante, reconocer una reacción y explorar una respuesta consciente.

## Estado del prototipo

- Wizard de tres pasos con energía percibida, reactividad, sesgo y focos seleccionables.
- Regulación guiada y revisión final.
- El borrador se mantiene únicamente en memoria: recargar lo elimina.
- Guardado, cuentas, historial persistente, onboarding y gamificación están pendientes.

La energía es una autoevaluación. La aplicación no ofrece diagnóstico ni acredita resultados clínicos.

## Desarrollo

Requiere Node.js compatible con Next.js 16. Dentro de `app/`:

```sh
npm ci
npm run dev
```

Abrir http://127.0.0.1:3108. Para compilar: `npm run build`.

## Vercel

Configurar `app` como Root Directory. Esta preparación no implica un despliegue activo. El frontend actual no necesita credenciales de Supabase.

El contexto SCA, Studio administrativo, entornos y evidencias locales quedan fuera del repositorio público. No introducir secretos en código o commits.
