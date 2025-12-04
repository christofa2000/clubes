# Configuración de Invitación de Usuarios

Este documento explica cómo configurar el flujo de invitación de usuarios usando Supabase Auth.

## 📋 Variables de Entorno Requeridas

### Backend (`apps/api/.env`)

```env
# Supabase (Backend - para operaciones admin)
SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key-aqui"

# URL del frontend (para construir redirectTo en invitaciones)
FRONTEND_URL="http://localhost:3000"
# En producción: FRONTEND_URL="https://tu-dominio.com"
```

### Frontend (`apps/web/.env.local`)

```env
# Supabase (Frontend - cliente público)
NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-anon-key-aqui"

# Backend API
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

## 🔧 Configuración en Supabase Dashboard

### 1. Configurar Redirect URLs

**IMPORTANTE**: Debes agregar la URL `/auth/set-password` a las URLs de redirección permitidas en Supabase.

1. Ve a tu proyecto en Supabase: https://app.supabase.com
2. Navega a **Authentication → URL Configuration**
3. En **Redirect URLs**, agrega:
   - `http://localhost:3000/auth/set-password` (para desarrollo)
   - `https://tu-dominio.com/auth/set-password` (para producción)

Sin esta configuración, Supabase rechazará las redirecciones y el flujo de invitación no funcionará.

### 2. Verificar Email Templates (Opcional)

Los emails de invitación usan el template por defecto de Supabase. Puedes personalizarlos en:
- **Authentication → Email Templates → Invite user**

## 🔐 Seguridad

### ⚠️ IMPORTANTE: Service Role Key

- **NUNCA** expongas `SUPABASE_SERVICE_ROLE_KEY` en el frontend
- **Solo** se usa en el backend (NestJS) para operaciones administrativas
- El frontend usa `NEXT_PUBLIC_SUPABASE_ANON_KEY` (clave pública segura)

### Ubicación del Service Role Key

El `SupabaseAdminService` en `apps/api/src/auth/supabase-admin.service.ts` es el único lugar donde se usa la SERVICE ROLE KEY. Está protegido porque:

1. Solo se ejecuta en el servidor (backend NestJS)
2. Solo se puede acceder mediante endpoints protegidos con `@Roles(UserRole.SUPER_ADMIN)`
3. Nunca se expone al cliente

## 📝 Flujo Completo de Invitación

### 1. SUPER_ADMIN invita usuario

- **Frontend**: `/superadmin/users` → Formulario de invitación
- **Backend**: `POST /users/invite` → Valida permisos y datos
- **Supabase**: `auth.admin.inviteUserByEmail()` → Envía email con magic link

### 2. Usuario recibe email

- Supabase envía email automáticamente
- Email contiene magic link con tokens temporales
- Link apunta a: `{FRONTEND_URL}/auth/set-password?code=...&type=invite`

### 3. Usuario hace clic en el link

- **Frontend**: `/auth/set-password` → Detecta tokens en URL
- Intercambia código por sesión temporal con `exchangeCodeForSession()`
- Muestra formulario para establecer contraseña

### 4. Usuario establece contraseña

- Usuario ingresa nueva contraseña (mínimo 6 caracteres)
- **Frontend**: Llama a `supabase.auth.updateUser({ password })`
- Supabase actualiza la contraseña del usuario

### 5. Usuario puede hacer login

- Redirige a `/login`
- Usuario puede hacer login con email y contraseña normalmente

## 🧪 Testing

### Probar el flujo completo:

1. **Como SUPER_ADMIN**, ve a `/superadmin/users`
2. Completa el formulario con:
   - Email válido
   - Rol (ADMIN, TEACHER, STUDENT, etc.)
   - Nombre y datos básicos
   - Club (si el rol lo requiere)
3. Haz clic en "Enviar invitación"
4. Verifica que aparezca mensaje de éxito
5. Revisa el email del usuario invitado
6. Haz clic en el link del email
7. Deberías ser redirigido a `/auth/set-password`
8. Establece una contraseña
9. Verifica que puedas hacer login con email y contraseña

## 🐛 Troubleshooting

### Error: "Redirect URL not allowed"

**Solución**: Agrega `http://localhost:3000/auth/set-password` a las Redirect URLs en Supabase Dashboard.

### Error: "El enlace ya fue utilizado o es inválido"

**Causas posibles**:
- El link ya fue usado (solo se puede usar una vez)
- El link expiró (los links de invitación tienen tiempo de expiración)
- El código en la URL es inválido

**Solución**: Solicita una nueva invitación desde el panel de SUPER_ADMIN.

### Error: "SUPABASE_USER_ALREADY_EXISTS"

**Causa**: El email ya está registrado en Supabase.

**Solución**: Usa un email diferente o elimina el usuario existente primero.

### El email no llega

**Verificaciones**:
1. Revisa la carpeta de spam
2. Verifica que el email esté correcto
3. Revisa los logs de Supabase Dashboard → Logs → Auth
4. Verifica que el SMTP esté configurado en Supabase (si usas email personalizado)

## 📚 Referencias

- [Supabase Auth Admin API](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail)
- [Supabase URL Configuration](https://supabase.com/docs/guides/auth/auth-deep-linking)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)


