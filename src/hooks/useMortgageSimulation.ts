import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CreditHipotecario, MortgageSimulationResult } from '@/types/credit';

interface MortgageFormData {
  valor_propiedad: number;
  ingreso_mensual: number;
  plazo_deseado: number;
  perfil_usuario: string;
  destino_credito: string;
}

export const useMortgageSimulation = () => {
  const [results, setResults] = useState<MortgageSimulationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate monthly interest rate from annual effective rate
  // tea comes as decimal (0.21 for 21%)
  const calculateMonthlyRate = (tea: number): number => {
    return Math.pow(1 + tea, 1 / 12) - 1;
  };

  // Calculate French installment (cuota francesa)
  const calculateFrenchInstallment = (
    monto: number,
    tasaMensual: number,
    plazoMeses: number
  ): number => {
    if (tasaMensual === 0) return monto / plazoMeses;
    const factor = Math.pow(1 + tasaMensual, plazoMeses);
    return (monto * tasaMensual * factor) / (factor - 1);
  };

  // Calculate recommended term using inverse formula
  const calculateRecommendedTerm = (
    monto: number,
    tasaMensual: number,
    cuotaMaxima: number
  ): number | null => {
    if (tasaMensual === 0 || cuotaMaxima <= 0 || monto <= 0) return null;
    
    const denominator = cuotaMaxima - monto * tasaMensual;
    if (denominator <= 0) return null; // Impossible to finance
    
    const numerator = cuotaMaxima / denominator;
    if (numerator <= 1) return null;
    
    const plazo = Math.log(numerator) / Math.log(1 + tasaMensual);
    return Math.ceil(plazo);
  };

  // Map user profile selections to database keywords
  const mapPerfilToKeywords = (perfil: string): string[] => {
    const mapping: Record<string, string[]> = {
      'empleado_dependencia': ['empleado', 'relación de dependencia', 'dependencia', 'clientes que acrediten sueldos'],
      'monotributista': ['monotributista', 'autónomo', 'independiente'],
      'responsable_inscripto': ['responsable inscripto', 'autónomo', 'independiente'],
      'empleado_publico': ['empleado público', 'público', 'empleado', 'clientes que acrediten sueldos']
    };
    return mapping[perfil] || [];
  };

  // Map credit destination to database keywords
  const mapDestinoToKeywords = (destino: string): string[] => {
    const mapping: Record<string, string[]> = {
      'primera_vivienda': ['primera vivienda', 'vivienda propia única', 'vivienda única', 'vivienda permanente'],
      'segunda_vivienda': ['segunda vivienda', 'vivienda'],
      'construccion': ['construcción', 'construir'],
      'refaccion': ['refacción', 'mejora', 'ampliación'],
      'otro': []
    };
    return mapping[destino] || [];
  };

  // Filter products by user profile and credit destination
  const filterProductsByProfile = (
    products: CreditHipotecario[],
    perfil: string,
    destino: string
  ): CreditHipotecario[] => {
    const perfilKeywords = mapPerfilToKeywords(perfil);
    const destinoKeywords = mapDestinoToKeywords(destino);
    
    return products.filter(product => {
      const beneficiarios = product.beneficiarios?.toLowerCase() || '';
      const destinoFondos = product.destino_de_los_fondos?.toLowerCase() || '';
      
      // Match profile: if any keyword matches or if beneficiarios is empty/generic
      const perfilMatch = perfilKeywords.length === 0 ||
                          perfilKeywords.some(keyword => beneficiarios.includes(keyword)) ||
                          beneficiarios.includes('todos') ||
                          beneficiarios === '';
      
      // Match destination: if any keyword matches or if destination is empty/generic
      const destinoMatch = destinoKeywords.length === 0 ||
                           destinoKeywords.some(keyword => destinoFondos.includes(keyword)) ||
                           destinoFondos.includes('todos') ||
                           destinoFondos === '';
      
      return perfilMatch && destinoMatch;
    });
  };

  // Group products by bank and select best option per bank
  const groupByBank = (results: MortgageSimulationResult[]): MortgageSimulationResult[] => {
    const grouped = new Map<number, MortgageSimulationResult[]>();
    
    results.forEach(result => {
      const existing = grouped.get(result.codigo_entidad) || [];
      existing.push(result);
      grouped.set(result.codigo_entidad, existing);
    });

    const bestPerBank: MortgageSimulationResult[] = [];
    
    grouped.forEach(bankProducts => {
      // Priority: 1. VIABLE, 2. NO_VIABLE_EXTENDER (lowest term), 3. NO_VIABLE (lowest installment)
      const viable = bankProducts.filter(p => p.estado === 'VIABLE');
      const extendable = bankProducts.filter(p => p.estado === 'NO_VIABLE_EXTENDER');
      const notViable = bankProducts.filter(p => p.estado === 'NO_VIABLE');
      
      let best: MortgageSimulationResult | null = null;
      
      if (viable.length > 0) {
        best = viable.reduce((prev, curr) => 
          curr.cuota_inicial < prev.cuota_inicial ? curr : prev
        );
      } else if (extendable.length > 0) {
        best = extendable.reduce((prev, curr) => 
          (curr.plazo_recomendado || 0) < (prev.plazo_recomendado || 0) ? curr : prev
        );
      } else if (notViable.length > 0) {
        best = notViable.reduce((prev, curr) => 
          curr.cuota_inicial < prev.cuota_inicial ? curr : prev
        );
      }
      
      if (best) bestPerBank.push(best);
    });
    
    return bestPerBank;
  };

  const simulateMortgage = async (formData: MortgageFormData) => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      // Fetch all mortgage products
      const { data: products, error: fetchError } = await supabase
        .from('creditos_hipotecarios')
        .select('*');

      if (fetchError) throw fetchError;
      if (!products || products.length === 0) {
        setError('No se encontraron productos hipotecarios disponibles');
        return;
      }

      // Filter by profile and destination
      const filteredProducts = filterProductsByProfile(
        products as CreditHipotecario[],
        formData.perfil_usuario,
        formData.destino_credito
      );

      if (filteredProducts.length === 0) {
        setError('No hay productos que coincidan con tu perfil y destino de crédito');
        return;
      }

      const simulationResults: MortgageSimulationResult[] = [];

      filteredProducts.forEach(product => {
        // Skip products with missing critical data
        if (!product.tasa_efectiva_anual_maxima || 
            !product.relacion_monto_tasacion || 
            !product.relacion_cuota_ingreso ||
            !product.monto_maximo_otorgable_del_prestamo ||
            !product.plazo_maximo_otorgable) {
          return;
        }

        // Calculate financeable amount
        const montoSegunTasacion = formData.valor_propiedad * (product.relacion_monto_tasacion / 100);
        const monto_a_financiar = Math.min(
          montoSegunTasacion,
          product.monto_maximo_otorgable_del_prestamo
        );

        // Calculate required down payment (what the bank won't finance)
        const pago_inicial_requerido = formData.valor_propiedad - monto_a_financiar;

        // Calculate rates
        const tasa_mensual = calculateMonthlyRate(product.tasa_efectiva_anual_maxima);
        
        // Calculate maximum allowed installment based on income
        const cuota_maxima_permitida = formData.ingreso_mensual * (product.relacion_cuota_ingreso / 100);
        
        // Calculate initial installment with desired term
        const cuota_inicial = calculateFrenchInstallment(
          monto_a_financiar,
          tasa_mensual,
          formData.plazo_deseado
        );

        let estado: 'VIABLE' | 'NO_VIABLE_EXTENDER' | 'NO_VIABLE';
        let plazo_recomendado: number | null = null;

        if (cuota_inicial <= cuota_maxima_permitida) {
          estado = 'VIABLE';
        } else {
          // Calculate recommended term
          const plazoCalculado = calculateRecommendedTerm(
            monto_a_financiar,
            tasa_mensual,
            cuota_maxima_permitida
          );

          if (plazoCalculado && plazoCalculado <= product.plazo_maximo_otorgable) {
            estado = 'NO_VIABLE_EXTENDER';
            plazo_recomendado = plazoCalculado;
          } else {
            estado = 'NO_VIABLE';
            plazo_recomendado = product.plazo_maximo_otorgable;
          }
        }

        simulationResults.push({
          banco: product.descripcion_de_entidad,
          producto: product.nombre_corto_del_prestamo_hipotecario,
          monto_a_financiar,
          pago_inicial_requerido,
          cuota_inicial,
          cuota_maxima_permitida,
          plazo_deseado: formData.plazo_deseado,
          plazo_recomendado,
          plazo_maximo: product.plazo_maximo_otorgable,
          estado,
          tasa_mensual: tasa_mensual * 100,
          tasa_anual: product.tasa_efectiva_anual_maxima * 100, // Convert to percentage for display
          cft: (product.costo_financiero_efectivo_total_maximo || 0) * 100, // Convert to percentage for display
          codigo_entidad: product.codigo_de_entidad || 0,
          productData: product
        });
      });

      // Group by bank and select best option per bank
      const bestResults = groupByBank(simulationResults);
      
      // Sort results: VIABLE first, then NO_VIABLE_EXTENDER, then NO_VIABLE
      const sorted = bestResults.sort((a, b) => {
        const stateOrder = { 'VIABLE': 0, 'NO_VIABLE_EXTENDER': 1, 'NO_VIABLE': 2 };
        const stateCompare = stateOrder[a.estado] - stateOrder[b.estado];
        if (stateCompare !== 0) return stateCompare;
        
        // Within same state, sort by installment amount
        return a.cuota_inicial - b.cuota_inicial;
      });

      setResults(sorted);
    } catch (err) {
      console.error('Error simulando crédito hipotecario:', err);
      setError('Error al procesar la simulación. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return {
    results,
    loading,
    error,
    simulateMortgage
  };
};
