-- =====================================================
-- SISTEMA DE NOTIFICACIONES AUTOMÁTICAS DE PAGOS
-- =====================================================

-- 1. Tabla de templates de email personalizables (PRIMERO)
CREATE TABLE IF NOT EXISTS public.pms_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES pms_tenants(id) ON DELETE CASCADE,
  
  template_type TEXT NOT NULL CHECK (template_type IN ('payment_reminder', 'payment_overdue', 'staff_alert')),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  
  -- Variables disponibles (JSON para documentación)
  available_variables JSONB DEFAULT '{
    "tenant_name": "Nombre del inquilino",
    "property_address": "Dirección de la propiedad",
    "contract_number": "Número de contrato",
    "amount": "Monto a pagar",
    "currency": "Moneda",
    "due_date": "Fecha de vencimiento",
    "days_until_due": "Días hasta vencimiento",
    "days_overdue": "Días de atraso",
    "payment_url": "URL para informar pago"
  }'::jsonb,
  
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_email_templates_tenant ON pms_email_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON pms_email_templates(template_type);

-- 2. Tabla de configuración de notificaciones (SEGUNDO)
CREATE TABLE IF NOT EXISTS public.pms_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES pms_tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipos de notificación
  enable_payment_reminders BOOLEAN DEFAULT true,
  enable_overdue_alerts BOOLEAN DEFAULT true,
  enable_staff_alerts BOOLEAN DEFAULT true,
  
  -- Configuración de timing
  reminder_days_before INTEGER DEFAULT 5,
  reminder_time TIME DEFAULT '09:00:00',
  
  -- Configuración de destinatarios
  notify_email TEXT,
  notify_inquilino BOOLEAN DEFAULT true,
  notify_propietario BOOLEAN DEFAULT false,
  notify_staff BOOLEAN DEFAULT true,
  
  -- Templates personalizados (ahora pms_email_templates ya existe)
  custom_template_reminder UUID REFERENCES pms_email_templates(id),
  custom_template_overdue UUID REFERENCES pms_email_templates(id),
  custom_template_staff_alert UUID REFERENCES pms_email_templates(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notification_settings_tenant ON pms_notification_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user ON pms_notification_settings(user_id);

-- 3. Tabla de log de notificaciones enviadas
CREATE TABLE IF NOT EXISTS public.pms_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES pms_tenants(id) ON DELETE CASCADE,
  
  notification_type TEXT NOT NULL CHECK (notification_type IN ('payment_reminder', 'payment_overdue', 'staff_alert')),
  
  -- Referencias
  schedule_item_id UUID REFERENCES pms_payment_schedule_items(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES pms_contracts(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Contenido enviado
  subject TEXT NOT NULL,
  template_id UUID REFERENCES pms_email_templates(id),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas y reports
CREATE INDEX IF NOT EXISTS idx_notification_logs_tenant ON pms_notification_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_schedule_item ON pms_notification_logs(schedule_item_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON pms_notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON pms_notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON pms_notification_logs(notification_type);

-- 4. RLS Policies

ALTER TABLE pms_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_notification_logs ENABLE ROW LEVEL SECURITY;

-- Email Templates
DROP POLICY IF EXISTS "Staff can manage email templates" ON pms_email_templates;
CREATE POLICY "Staff can manage email templates"
ON pms_email_templates FOR ALL
USING (
  has_pms_role(auth.uid(), 'SUPERADMIN') OR
  has_pms_role(auth.uid(), 'INMOBILIARIA', tenant_id) OR
  has_pms_role(auth.uid(), 'ADMINISTRADOR', tenant_id)
);

-- Notification Settings
DROP POLICY IF EXISTS "Staff can manage notification settings" ON pms_notification_settings;
CREATE POLICY "Staff can manage notification settings"
ON pms_notification_settings FOR ALL
USING (
  has_pms_role(auth.uid(), 'SUPERADMIN') OR
  has_pms_role(auth.uid(), 'INMOBILIARIA', tenant_id) OR
  has_pms_role(auth.uid(), 'ADMINISTRADOR', tenant_id)
);

DROP POLICY IF EXISTS "Users can view their own notification settings" ON pms_notification_settings;
CREATE POLICY "Users can view their own notification settings"
ON pms_notification_settings FOR SELECT
USING (user_id = auth.uid());

-- Notification Logs
DROP POLICY IF EXISTS "Staff can view notification logs" ON pms_notification_logs;
CREATE POLICY "Staff can view notification logs"
ON pms_notification_logs FOR SELECT
USING (
  has_pms_role(auth.uid(), 'SUPERADMIN') OR
  has_pms_role(auth.uid(), 'INMOBILIARIA', tenant_id) OR
  has_pms_role(auth.uid(), 'ADMINISTRADOR', tenant_id)
);

DROP POLICY IF EXISTS "Users can view their own notification logs" ON pms_notification_logs;
CREATE POLICY "Users can view their own notification logs"
ON pms_notification_logs FOR SELECT
USING (recipient_user_id = auth.uid());

-- 5. Triggers para updated_at
DROP TRIGGER IF EXISTS update_notification_settings_updated_at ON pms_notification_settings;
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON pms_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_templates_updated_at ON pms_email_templates;
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON pms_email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Insertar templates por defecto
INSERT INTO pms_email_templates (
  tenant_id,
  template_type,
  name,
  subject,
  html_body,
  is_default,
  is_active
) 
SELECT
  t.id as tenant_id,
  'payment_reminder' as template_type,
  'Recordatorio de Pago (5 días antes)' as name,
  'Recordatorio: Pago de alquiler próximo a vencer - {{contract_number}}' as subject,
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .highlight { background: #fff; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
    .amount { font-size: 32px; font-weight: bold; color: #667eea; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💳 Recordatorio de Pago</h1>
    </div>
    <div class="content">
      <p>Estimado/a <strong>{{tenant_name}}</strong>,</p>
      <p>Le recordamos que su próximo pago de alquiler vence en <strong>{{days_until_due}} días</strong>.</p>
      <div class="highlight">
        <p><strong>📍 Propiedad:</strong> {{property_address}}</p>
        <p><strong>📄 Contrato:</strong> {{contract_number}}</p>
        <p><strong>📅 Fecha de vencimiento:</strong> {{due_date}}</p>
        <p><strong>💰 Monto a pagar:</strong></p>
        <div class="amount">{{currency}} {{amount}}</div>
      </div>
      <p>Para informar su pago, por favor ingrese al portal de inquilinos:</p>
      <a href="{{payment_url}}" class="button">Informar Pago</a>
      <p>Si ya realizó el pago, por favor ignore este mensaje.</p>
      <p>Saludos cordiales,<br>Equipo de Administración</p>
    </div>
    <div class="footer">
      <p>Este es un mensaje automático. Por favor no responda a este email.</p>
    </div>
  </div>
</body>
</html>' as html_body,
  true as is_default,
  true as is_active
FROM pms_tenants t
WHERE t.slug = 'wm-default'
ON CONFLICT DO NOTHING;

INSERT INTO pms_email_templates (
  tenant_id,
  template_type,
  name,
  subject,
  html_body,
  is_default,
  is_active
)
SELECT
  t.id,
  'payment_overdue',
  'Alerta de Pago Vencido',
  '⚠️ Pago de alquiler vencido - {{contract_number}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .alert { background: #fff3cd; border-left: 4px solid #f5576c; padding: 20px; margin: 20px 0; }
    .amount { font-size: 32px; font-weight: bold; color: #f5576c; }
    .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Pago Vencido</h1>
    </div>
    <div class="content">
      <p>Estimado/a <strong>{{tenant_name}}</strong>,</p>
      <div class="alert">
        <p><strong>Su pago de alquiler está vencido hace {{days_overdue}} días.</strong></p>
      </div>
      <p>Le solicitamos regularizar su situación a la brevedad posible.</p>
      <div class="highlight">
        <p><strong>📍 Propiedad:</strong> {{property_address}}</p>
        <p><strong>📄 Contrato:</strong> {{contract_number}}</p>
        <p><strong>📅 Fecha de vencimiento:</strong> {{due_date}}</p>
        <p><strong>💰 Monto adeudado:</strong></p>
        <div class="amount">{{currency}} {{amount}}</div>
      </div>
      <p>Para informar su pago inmediatamente:</p>
      <a href="{{payment_url}}" class="button">Informar Pago Ahora</a>
      <p>Si necesita asistencia o tiene consultas, por favor contáctenos.</p>
      <p>Saludos cordiales,<br>Equipo de Administración</p>
    </div>
    <div class="footer">
      <p>Este es un mensaje automático. Por favor no responda a este email.</p>
    </div>
  </div>
</body>
</html>',
  true,
  true
FROM pms_tenants t
WHERE t.slug = 'wm-default'
ON CONFLICT DO NOTHING;

INSERT INTO pms_email_templates (
  tenant_id,
  template_type,
  name,
  subject,
  html_body,
  is_default,
  is_active
)
SELECT
  t.id,
  'staff_alert',
  'Alerta Staff - Pagos Vencidos',
  '🚨 Alerta: Pagos vencidos pendientes de gestión',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .summary { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .stat { display: inline-block; margin: 10px 20px; }
    .stat-number { font-size: 28px; font-weight: bold; color: #fa709a; }
    .button { display: inline-block; padding: 12px 30px; background: #fa709a; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 Alerta de Pagos Vencidos</h1>
    </div>
    <div class="content">
      <p>Estimado equipo de administración,</p>
      <p>Se detectaron pagos vencidos que requieren su atención:</p>
      <div class="summary">
        <div class="stat">
          <div class="stat-number">{{overdue_count}}</div>
          <div>Pagos Vencidos</div>
        </div>
        <div class="stat">
          <div class="stat-number">{{total_overdue_amount}}</div>
          <div>Monto Total</div>
        </div>
      </div>
      <p><strong>Acción requerida:</strong> Revisar y gestionar los pagos vencidos en el sistema.</p>
      <a href="{{dashboard_url}}" class="button">Ver Dashboard de Pagos</a>
      <p>Este reporte se genera automáticamente cuando hay pagos vencidos pendientes.</p>
      <p>Saludos,<br>Sistema Automatizado PMS</p>
    </div>
    <div class="footer">
      <p>Este es un mensaje automático del sistema de gestión.</p>
    </div>
  </div>
</body>
</html>',
  true,
  true
FROM pms_tenants t
WHERE t.slug = 'wm-default'
ON CONFLICT DO NOTHING;

-- 7. Insertar configuración por defecto para tenant default
INSERT INTO pms_notification_settings (
  tenant_id,
  enable_payment_reminders,
  enable_overdue_alerts,
  enable_staff_alerts,
  reminder_days_before,
  reminder_time
)
SELECT
  t.id,
  true,
  true,
  true,
  5,
  '09:00:00'
FROM pms_tenants t
WHERE t.slug = 'wm-default'
ON CONFLICT DO NOTHING;