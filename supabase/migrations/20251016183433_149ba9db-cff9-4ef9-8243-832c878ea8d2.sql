-- Agregar nuevos campos al formulario de propiedades
ALTER TABLE pms_properties 
ADD COLUMN IF NOT EXISTS habitaciones INTEGER,
ADD COLUMN IF NOT EXISTS balcon BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS patio BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS baulera BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cocheras INTEGER,
ADD COLUMN IF NOT EXISTS tiene_amenidades BOOLEAN DEFAULT FALSE;

-- Agregar comentarios para documentar los nuevos campos
COMMENT ON COLUMN pms_properties.habitaciones IS 'Número total de habitaciones de la propiedad';
COMMENT ON COLUMN pms_properties.balcon IS 'Indica si la propiedad tiene balcón';
COMMENT ON COLUMN pms_properties.patio IS 'Indica si la propiedad tiene patio';
COMMENT ON COLUMN pms_properties.baulera IS 'Indica si la propiedad tiene baulera';
COMMENT ON COLUMN pms_properties.cocheras IS 'Número de cocheras/garajes de la propiedad';
COMMENT ON COLUMN pms_properties.tiene_amenidades IS 'Indica si la propiedad tiene amenidades (ej: piscina, gimnasio, SUM)';