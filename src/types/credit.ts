export type CreditType = 'hipotecario' | 'personal' | 'prendario';

export interface CreditFormData {
  tipo: CreditType;
  monto: number;
  ingreso: number;
  edad: number;
  antiguedad: number;
  plazo: number;
  tasacion?: number;
  inflacionEsperada?: number;
}

export interface CreditProductBase {
  id: string;
  codigo_de_entidad: number;
  descripcion_de_entidad: string;
  denominacion: string;
  ingreso_minimo_mensual_solicitado: number;
  antiguedad_laboral_minima_meses: number;
  relacion_cuota_ingreso: number;
  tasa_efectiva_anual_maxima: number;
  costo_financiero_efectivo_total_maximo: number;
}

export interface CreditHipotecario extends CreditProductBase {
  nombre_corto_del_prestamo_hipotecario: string;
  monto_maximo_otorgable_del_prestamo: number;
  plazo_maximo_otorgable: number;
  edad_maxima_solicitada_anos: number;
  relacion_monto_tasacion: number;
  cuota_inicial_a_plazo_maximo_cada_100_000: number;
}

export interface CreditPersonal extends CreditProductBase {
  nombre_corto_del_prestamo_personal: string;
  monto_maximo_otorgable: number;
  monto_minimo_otorgable: number;
  plazo_maximo_otorgable_anos: number;
  edad_maxima_solicitada: number;
  cuota_inicial_a_plazo_maximo_cada_10_000: number;
}

export interface CreditPrendario extends CreditProductBase {
  nombre_corto_del_prestamo_prendario: string;
  monto_maximo_otorgable: number;
  monto_minimo_otorgable: number;
  plazo_maximo_otorgable_meses: number;
  edad_maxima_solicitada_anos: number;
  relacion_monto_tasacion: number;
  cuota_inicial_a_plazo_maximo_cada_10_000: number;
}

export type CreditProduct = CreditHipotecario | CreditPersonal | CreditPrendario;

export interface CreditResult {
  id: string;
  entidad: string;
  producto: string;
  cuota: number;
  porcentajeIngreso: number;
  tasa: number;
  cft: number;
  plazoMaximo: number;
  ltv?: number;
  observaciones: string[];
  esUVA: boolean;
  productData: CreditProduct;
}

export interface ComparisonItem extends CreditResult {
  addedAt: Date;
}

export interface UVAProjection {
  mes: number;
  cuota: number;
  porcentajeIngreso: number;
}
