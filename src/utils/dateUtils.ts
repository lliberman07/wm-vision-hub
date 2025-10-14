/**
 * Formatea un objeto Date a string YYYY-MM-DD sin conversión de timezone
 * Usa los componentes locales (año/mes/día) del Date object
 */
export const formatDateForDB = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Convierte un string YYYY-MM-DD a Date object sin conversión de timezone
 * Crea el Date usando componentes locales (año/mes/día)
 */
export const parseDateFromDB = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};
