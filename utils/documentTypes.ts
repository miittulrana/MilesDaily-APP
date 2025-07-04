export interface DriverDocument {
  id: string;
  driver_id: string;
  document_type: 'id' | 'license';
  document_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  expiry_date?: string;
  notes?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleDocument {
  id: string;
  vehicle_id: string;
  document_type: 'logbook' | 'vrt' | 'insurance' | 'fire_extinguisher' | 'first_aid';
  document_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  expiry_date?: string;
  notes?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export const DRIVER_DOCUMENT_TYPES = {
  id: 'ID Document',
  license: 'Driver License'
};

export const VEHICLE_DOCUMENT_TYPES = {
  logbook: 'Logbook',
  vrt: 'VRT Certificate',
  insurance: 'Insurance Certificate',
  fire_extinguisher: 'Fire Extinguisher Certificate',
  first_aid: 'First Aid Kit Certificate'
};

export const getDocumentTypeLabel = (type: string, documentType: 'driver' | 'vehicle'): string => {
  if (documentType === 'driver') {
    return DRIVER_DOCUMENT_TYPES[type as keyof typeof DRIVER_DOCUMENT_TYPES] || type;
  } else {
    return VEHICLE_DOCUMENT_TYPES[type as keyof typeof VEHICLE_DOCUMENT_TYPES] || type;
  }
};

export const getDocumentIcon = (type: string): any => {
  const iconMap: { [key: string]: any } = {
    id: 'card-outline',
    license: 'car-outline',
    logbook: 'book-outline',
    vrt: 'shield-checkmark-outline',
    insurance: 'shield-outline',
    fire_extinguisher: 'flame-outline',
    first_aid: 'medical-outline'
  };
  
  return iconMap[type] || 'document-outline';
};