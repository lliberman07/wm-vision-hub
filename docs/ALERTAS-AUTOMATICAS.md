# 📧 Sistema de Alertas Automáticas - PMS

## 🎯 Descripción

El sistema envía 3 tipos de alertas automáticas por email:

1. **Recordatorios previos al vencimiento** → A inquilinos
2. **Alertas de pagos vencidos** → A inquilinos
3. **Alertas al staff** → A inmobiliarias/administradores

---

## 📋 Prerequisitos

- ✅ Edge functions implementadas en `/supabase/functions/`
- ✅ Tablas de base de datos creadas:
  - `pms_notification_settings`
  - `pms_email_templates`
  - `pms_notification_logs`
- ✅ Secret `RESEND_API_KEY` configurado
- ✅ Templates de email por defecto insertados

---

## ⚙️ Configuración de Cron Jobs

### Paso 1: Habilitar extensiones en Supabase

1. Ve al Dashboard de Supabase
2. Navega a **Database → Extensions**
3. Busca y habilita:
   - ✅ `pg_cron`
   - ✅ `pg_net`

### Paso 2: Obtener credenciales

Necesitarás:
- **Project URL**: `https://[tu-project-ref].supabase.co`
- **Anon Key**: Disponible en Settings → API

### Paso 3: Ejecutar script de configuración

1. Abre el archivo `supabase/setup-cron-jobs.sql`
2. Reemplaza los valores:
   ```sql
   YOUR_PROJECT_URL → https://abc123.supabase.co
   YOUR_ANON_KEY → eyJhbGc...tu-anon-key
   ```
3. Ve a **SQL Editor** en Supabase
4. Pega y ejecuta el script completo

---

## 🕐 Horarios de Ejecución

| Tipo de Alerta | Horario | Edge Function | Destinatarios |
|----------------|---------|---------------|---------------|
| **Alertas al staff** | 8:00 AM | `send-staff-overdue-alerts` | INMOBILIARIA, ADMINISTRADOR |
| **Recordatorios previos** | 9:00 AM | `send-payment-reminders` | INQUILINO |
| **Alertas de vencidos** | 12:00 PM | `send-overdue-alerts` | INQUILINO |

---

## 🔧 Configuración por Tenant

Cada tenant puede configurar sus preferencias en `pms_notification_settings`:

```sql
-- Ejemplo de configuración
UPDATE pms_notification_settings
SET 
  enable_payment_reminders = true,     -- Activar recordatorios
  enable_overdue_alerts = true,        -- Activar alertas de vencidos
  enable_staff_alerts = true,          -- Activar alertas al staff
  reminder_days_before = 3,            -- Recordar 3 días antes
  reminder_time = '09:00:00',          -- A las 9 AM
  notify_staff = true,                 -- Notificar al staff
  notify_tenant = true                 -- Notificar al inquilino
WHERE tenant_id = 'tu-tenant-id';
```

---

## 📝 Templates de Email

Los templates están en `pms_email_templates` con 3 tipos:

1. **payment_reminder** - Recordatorio previo
2. **payment_overdue** - Alerta de vencido
3. **staff_alert** - Resumen para staff

### Variables disponibles:

**Para inquilinos:**
- `{{tenant_name}}` - Nombre del inquilino
- `{{property_address}}` - Dirección de la propiedad
- `{{amount}}` - Monto del pago
- `{{due_date}}` - Fecha de vencimiento
- `{{contract_number}}` - Número de contrato

**Para staff:**
- `{{overdue_count}}` - Cantidad de pagos vencidos
- `{{total_overdue_amount}}` - Monto total vencido
- `{{dashboard_url}}` - Link al dashboard

---

## 📊 Monitoreo y Logs

### Ver ejecuciones de cron jobs:

```sql
-- Ver últimas 50 ejecuciones
SELECT 
  jobname,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 50;
```

### Ver emails enviados:

```sql
-- Ver últimos emails enviados
SELECT 
  notification_type,
  recipient_email,
  status,
  sent_at,
  error_message
FROM pms_notification_logs
ORDER BY created_at DESC
LIMIT 50;
```

---

## 🐛 Troubleshooting

### No se envían emails

1. Verificar que los cron jobs estén activos:
   ```sql
   SELECT jobname, schedule, active 
   FROM cron.job 
   WHERE jobname LIKE '%alert%' OR jobname LIKE '%reminder%';
   ```

2. Revisar logs de ejecución:
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE status = 'failed' 
   ORDER BY start_time DESC;
   ```

3. Verificar configuración del tenant:
   ```sql
   SELECT * FROM pms_notification_settings 
   WHERE tenant_id = 'tu-tenant-id';
   ```

### Eliminar y recrear cron jobs

```sql
-- Eliminar cron jobs
SELECT cron.unschedule('send-payment-reminders-daily');
SELECT cron.unschedule('send-overdue-alerts-daily');
SELECT cron.unschedule('send-staff-overdue-alerts-daily');

-- Luego volver a ejecutar el script setup-cron-jobs.sql
```

---

## 🧪 Probar manualmente

Puedes invocar las edge functions directamente para probar:

```bash
# Desde el terminal
curl -X POST 'https://[project].supabase.co/functions/v1/send-payment-reminders' \
  -H 'Authorization: Bearer [anon-key]' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

---

## 📈 Próximas mejoras

- [ ] Panel de configuración en el PMS
- [ ] Editor visual de templates
- [ ] Estadísticas de apertura de emails
- [ ] Alertas por WhatsApp
- [ ] Personalización de horarios por tenant
