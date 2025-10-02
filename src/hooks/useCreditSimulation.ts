import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CreditFormData, CreditResult, CreditType, CreditProduct } from '@/types/credit';

export const useCreditSimulation = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CreditResult[]>([]);

  const calculateFrenchInstallment = (
    monto: number,
    tea: number,
    plazoMeses: number
  ): number => {
    const tem = tea / 12; // Tasa efectiva mensual
    if (tem === 0) return monto / plazoMeses;
    return (monto * tem) / (1 - Math.pow(1 + tem, -plazoMeses));
  };

  const calculateProportionalInstallment = (
    monto: number,
    cuotaBase: number,
    montoBase: number
  ): number => {
    return (monto / montoBase) * cuotaBase;
  };

  const getProductName = (product: CreditProduct): string => {
    if ('nombre_corto_del_prestamo_hipotecario' in product) {
      return product.nombre_corto_del_prestamo_hipotecario;
    }
    if ('nombre_corto_del_prestamo_personal' in product) {
      return product.nombre_corto_del_prestamo_personal;
    }
    if ('nombre_corto_del_prestamo_prendario' in product) {
      return product.nombre_corto_del_prestamo_prendario;
    }
    return '';
  };

  const getMaxAmount = (product: CreditProduct): number => {
    if ('monto_maximo_otorgable_del_prestamo' in product) {
      return product.monto_maximo_otorgable_del_prestamo;
    }
    return product.monto_maximo_otorgable;
  };

  const getMaxPlazo = (product: CreditProduct, tipo: CreditType): number => {
    if (tipo === 'hipotecario') {
      return (product as any).plazo_maximo_otorgable;
    }
    if (tipo === 'personal') {
      return (product as any).plazo_maximo_otorgable_anos * 12;
    }
    return (product as any).plazo_maximo_otorgable_meses;
  };

  const getMaxAge = (product: CreditProduct): number => {
    if ('edad_maxima_solicitada_anos' in product) {
      return product.edad_maxima_solicitada_anos;
    }
    return (product as any).edad_maxima_solicitada;
  };

  const validateProduct = (
    product: CreditProduct,
    formData: CreditFormData,
    tipo: CreditType
  ): { valid: boolean; observaciones: string[] } => {
    const observaciones: string[] = [];

    // Validar monto
    const maxAmount = getMaxAmount(product);
    if (formData.monto > maxAmount) {
      observaciones.push('Monto excede el máximo permitido');
      return { valid: false, observaciones };
    }

    // Validar ingreso mínimo
    if (formData.ingreso < product.ingreso_minimo_mensual_solicitado) {
      observaciones.push('Ingreso menor al mínimo requerido');
      return { valid: false, observaciones };
    }

    // Validar edad
    const maxAge = getMaxAge(product);
    if (formData.edad > maxAge) {
      observaciones.push('Edad excede el máximo permitido');
      return { valid: false, observaciones };
    }

    // Validar antigüedad laboral
    if (formData.antiguedad < product.antiguedad_laboral_minima_meses) {
      observaciones.push('Antigüedad laboral insuficiente');
      return { valid: false, observaciones };
    }

    // Validar plazo
    const maxPlazo = getMaxPlazo(product, tipo);
    if (formData.plazo > maxPlazo) {
      observaciones.push('Plazo excede el máximo permitido');
      return { valid: false, observaciones };
    }

    // Validar LTV para hipotecario y prendario
    if ((tipo === 'hipotecario' || tipo === 'prendario') && formData.tasacion) {
      const ltv = formData.monto / formData.tasacion;
      const maxLtv = (product as any).relacion_monto_tasacion;
      if (ltv > maxLtv) {
        observaciones.push('Relación monto/tasación excede el máximo');
        return { valid: false, observaciones };
      }
    }

    return { valid: true, observaciones };
  };

  const calculateInstallment = (
    product: CreditProduct,
    formData: CreditFormData,
    tipo: CreditType
  ): { cuota: number; observaciones: string[] } => {
    const observaciones: string[] = [];

    // Si tiene TEA, usar fórmula francesa
    if (product.tasa_efectiva_anual_maxima && product.tasa_efectiva_anual_maxima > 0) {
      const cuota = calculateFrenchInstallment(
        formData.monto,
        product.tasa_efectiva_anual_maxima,
        formData.plazo
      );
      return { cuota, observaciones };
    }

    // Si tiene cuota inicial, usar estimación proporcional
    if (tipo === 'hipotecario') {
      const cuotaBase = (product as any).cuota_inicial_a_plazo_maximo_cada_100_000;
      if (cuotaBase && cuotaBase > 0) {
        const cuota = calculateProportionalInstallment(formData.monto, cuotaBase, 100000);
        observaciones.push('Cuota aproximada basada en valores de referencia');
        return { cuota, observaciones };
      }
    } else {
      const cuotaBase = (product as any).cuota_inicial_a_plazo_maximo_cada_10_000;
      if (cuotaBase && cuotaBase > 0) {
        const cuota = calculateProportionalInstallment(formData.monto, cuotaBase, 10000);
        observaciones.push('Cuota aproximada basada en valores de referencia');
        return { cuota, observaciones };
      }
    }

    // Si no hay datos suficientes
    observaciones.push('No hay información suficiente para calcular la cuota');
    return { cuota: 0, observaciones };
  };

  const simulate = async (formData: CreditFormData) => {
    setLoading(true);
    setResults([]);

    try {
      let products: any[] | null = null;
      let error: any = null;

      // Query the appropriate table based on credit type
      switch (formData.tipo) {
        case 'hipotecario': {
          const result = await supabase
            .from('creditos_hipotecarios')
            .select('*');
          products = result.data;
          error = result.error;
          break;
        }
        case 'personal': {
          const result = await supabase
            .from('creditos_personales')
            .select('*');
          products = result.data;
          error = result.error;
          break;
        }
        case 'prendario': {
          const result = await supabase
            .from('creditos_prendarios')
            .select('*');
          products = result.data;
          error = result.error;
          break;
        }
      }

      if (error) throw error;

      const validResults: CreditResult[] = [];

      products?.forEach((product: any) => {
        const validation = validateProduct(product, formData, formData.tipo);
        
        if (validation.valid) {
          const { cuota, observaciones: cuotaObs } = calculateInstallment(
            product,
            formData,
            formData.tipo
          );

          if (cuota > 0) {
            const porcentajeIngreso = (cuota / formData.ingreso) * 100;

            // Validar relación cuota/ingreso
            if (porcentajeIngreso <= product.relacion_cuota_ingreso * 100) {
              const esUVA = product.denominacion?.toUpperCase() === 'UVA';
              const allObservaciones = [...validation.observaciones, ...cuotaObs];

              if (esUVA) {
                allObservaciones.push('Producto en UVA - cuota sujeta a variación');
              }

              let ltv: number | undefined;
              if ((formData.tipo === 'hipotecario' || formData.tipo === 'prendario') && formData.tasacion) {
                ltv = (formData.monto / formData.tasacion) * 100;
              }

              validResults.push({
                id: product.id,
                entidad: product.descripcion_de_entidad,
                producto: getProductName(product),
                cuota,
                porcentajeIngreso,
                tasa: product.tasa_efectiva_anual_maxima || 0,
                cft: product.costo_financiero_efectivo_total_maximo || 0,
                plazoMaximo: getMaxPlazo(product, formData.tipo),
                ltv,
                observaciones: allObservaciones,
                esUVA,
                productData: product
              });
            }
          }
        }
      });

      // Ordenar por cuota más baja
      validResults.sort((a, b) => a.cuota - b.cuota);
      setResults(validResults);
    } catch (error) {
      console.error('Error simulating credit:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return {
    simulate,
    loading,
    results,
    clearResults
  };
};
