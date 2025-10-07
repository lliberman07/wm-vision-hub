export interface IdentificationType {
  value: string;
  labelEn: string;
  labelEs: string;
}

export interface ARCAResponsibility {
  value: string;
  labelEn: string;
  labelEs: string;
}

export const IDENTIFICATION_TYPES: IdentificationType[] = [
  { value: 'CUIT', labelEn: 'CUIT', labelEs: 'CUIT' },
  { value: 'DNI', labelEn: 'DNI', labelEs: 'DNI' },
  { value: 'CUIL', labelEn: 'CUIL', labelEs: 'CUIL' },
  { value: 'IVA', labelEn: 'VAT', labelEs: 'IVA' },
  { value: 'Passport', labelEn: 'Passport', labelEs: 'Passport' },
  { value: 'ID_Extranjera', labelEn: 'Foreign ID', labelEs: 'ID Extranjera' },
  { value: 'SIGD', labelEn: 'SIGD', labelEs: 'SIGD' },
];

export const ARCA_RESPONSIBILITIES: ARCAResponsibility[] = [
  { value: 'IVA_Responsable_Inscripto', labelEn: 'VAT Registered Responsible', labelEs: 'IVA Responsable Inscripto' },
  { value: 'IVA_Sujeto_Exento', labelEn: 'VAT Exempt Subject', labelEs: 'IVA Sujeto Exento' },
  { value: 'Consumidor_Final', labelEn: 'Final Consumer', labelEs: 'Consumidor Final' },
  { value: 'Responsable_Monotributo', labelEn: 'Monotribute Responsible', labelEs: 'Responsable Monotributo' },
  { value: 'Sujeto_no_Categorizado', labelEn: 'Uncategorized Subject', labelEs: 'Sujeto no Categorizado' },
  { value: 'Proveedor_del_Exterior', labelEn: 'Foreign Supplier', labelEs: 'Proveedor del Exterior' },
  { value: 'Cliente_del_Exterior', labelEn: 'Foreign Client', labelEs: 'Cliente del Exterior' },
  { value: 'IVA_Liberado_Ley_19640', labelEn: 'VAT Exempt Law 19.640', labelEs: 'IVA Liberado – Ley Nº 19.640' },
];
