-- Create table for hipotecario credits
CREATE TABLE public.creditos_hipotecarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_de_entidad numeric,
  descripcion_de_entidad text NOT NULL,
  fecha_de_informacion date,
  nombre_completo_del_prestamo_hipotecario text,
  nombre_corto_del_prestamo_hipotecario text NOT NULL,
  denominacion text,
  monto_maximo_otorgable_del_prestamo numeric,
  plazo_maximo_otorgable integer,
  ingreso_minimo_mensual_solicitado numeric,
  antiguedad_laboral_minima_meses integer,
  edad_maxima_solicitada_anos integer,
  relacion_cuota_ingreso numeric,
  relacion_monto_tasacion numeric,
  destino_de_los_fondos text,
  beneficiarios text,
  cargo_maximo_por_cancelacion_anticipada numeric,
  tasa_efectiva_anual_maxima numeric,
  tipo_de_tasa text,
  costo_financiero_efectivo_total_maximo numeric,
  cuota_inicial_a_plazo_maximo_cada_100_000 numeric,
  territorio_de_validez_de_la_oferta text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create table for personal credits
CREATE TABLE public.creditos_personales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_de_entidad numeric,
  descripcion_de_entidad text NOT NULL,
  fecha_de_informacion date,
  nombre_completo_del_prestamo_personal text,
  nombre_corto_del_prestamo_personal text NOT NULL,
  denominacion text,
  monto_maximo_otorgable numeric,
  monto_minimo_otorgable numeric,
  plazo_maximo_otorgable_anos numeric,
  ingreso_minimo_mensual_solicitado numeric,
  antiguedad_laboral_minima_meses integer,
  edad_maxima_solicitada integer,
  relacion_cuota_ingreso numeric,
  beneficiario text,
  cargo_maximo_por_cancelacion_anticipada numeric,
  tasa_efectiva_anual_maxima numeric,
  tipo_de_tasa text,
  costo_financiero_efectivo_total_maximo numeric,
  cuota_inicial_a_plazo_maximo_cada_10_000 numeric,
  territorio_de_validez_de_la_oferta text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create table for prendario credits
CREATE TABLE public.creditos_prendarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_de_entidad numeric,
  descripcion_de_entidad text NOT NULL,
  fecha_de_informacion date,
  nombre_completo_del_prestamo_prendario text,
  nombre_corto_del_prestamo_prendario text NOT NULL,
  denominacion text,
  monto_maximo_otorgable numeric,
  monto_minimo_otorgable numeric,
  plazo_maximo_otorgable_meses integer,
  ingreso_minimo_mensual_solicitado numeric,
  antiguedad_laboral_minima_meses integer,
  edad_maxima_solicitada_anos integer,
  relacion_cuota_ingreso numeric,
  relacion_monto_tasacion numeric,
  destino_de_los_fondos text,
  beneficiario text,
  cargo_maximo_por_cancelacion_anticipada numeric,
  tasa_efectiva_anual_maxima numeric,
  tipo_de_tasa text,
  costo_financiero_efectivo_total_maximo numeric,
  cuota_inicial_a_plazo_maximo_cada_10_000 numeric,
  territorio_de_validez_de_la_oferta text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creditos_hipotecarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creditos_personales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creditos_prendarios ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to hipotecarios"
ON public.creditos_hipotecarios
FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to personales"
ON public.creditos_personales
FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to prendarios"
ON public.creditos_prendarios
FOR SELECT
USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_creditos_hipotecarios_entidad ON public.creditos_hipotecarios(descripcion_de_entidad);
CREATE INDEX idx_creditos_hipotecarios_denominacion ON public.creditos_hipotecarios(denominacion);
CREATE INDEX idx_creditos_personales_entidad ON public.creditos_personales(descripcion_de_entidad);
CREATE INDEX idx_creditos_personales_denominacion ON public.creditos_personales(denominacion);
CREATE INDEX idx_creditos_prendarios_entidad ON public.creditos_prendarios(descripcion_de_entidad);
CREATE INDEX idx_creditos_prendarios_denominacion ON public.creditos_prendarios(denominacion);