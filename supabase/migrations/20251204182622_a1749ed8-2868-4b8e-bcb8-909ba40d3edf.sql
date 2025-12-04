-- Políticas RLS para subscription_change_history
-- Esta tabla almacena el historial de cambios de suscripciones para auditoría

-- 1. Granada admins pueden ver todo el historial
CREATE POLICY "Granada admins can view subscription change history"
  ON public.subscription_change_history
  FOR SELECT
  TO authenticated
  USING (is_granada_admin(auth.uid()));

-- 2. Service role puede insertar (usado por edge functions y triggers)
CREATE POLICY "Service role can insert change history"
  ON public.subscription_change_history
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 3. Granada admins pueden insertar manualmente si es necesario
CREATE POLICY "Granada admins can insert change history"
  ON public.subscription_change_history
  FOR INSERT
  TO authenticated
  WITH CHECK (is_granada_admin(auth.uid()));

-- 4. Granada admins pueden actualizar (raro, pero permitido para correcciones)
CREATE POLICY "Granada admins can update change history"
  ON public.subscription_change_history
  FOR UPDATE
  TO authenticated
  USING (is_granada_admin(auth.uid()))
  WITH CHECK (is_granada_admin(auth.uid()));

-- 5. Granada admins pueden eliminar (para limpieza de datos)
CREATE POLICY "Granada admins can delete change history"
  ON public.subscription_change_history
  FOR DELETE
  TO authenticated
  USING (is_granada_admin(auth.uid()));