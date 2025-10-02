import { useMemo } from 'react';
import { UVAProjection } from '@/types/credit';

export const useUVAProjection = (
  cuotaInicial: number,
  inflacionAnual: number,
  plazoMeses: number,
  ingreso: number
) => {
  const projection = useMemo((): UVAProjection[] => {
    const result: UVAProjection[] = [];
    const inflacionMensual = inflacionAnual / 100 / 12;

    for (let mes = 1; mes <= plazoMeses; mes++) {
      const cuota = cuotaInicial * Math.pow(1 + inflacionMensual, mes - 1);
      const porcentajeIngreso = (cuota / ingreso) * 100;

      result.push({
        mes,
        cuota,
        porcentajeIngreso
      });
    }

    return result;
  }, [cuotaInicial, inflacionAnual, plazoMeses, ingreso]);

  return projection;
};
