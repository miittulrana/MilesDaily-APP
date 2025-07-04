export type AccidentType = 'front-to-rear' | 'general';
export type GeneralSubType = 'injury' | 'govt-property' | 'private-property';
export type AccidentStatus = 'pending' | 'viewed' | 'submitted' | 'processed' | 'on-hold' | 'cancelled';
export type ImageType = 'form1' | 'form2' | 'accident_photo';

export interface AccidentReport {
  id: string;
  report_number?: string;
  claim_number?: string;
  driver_id: string;
  vehicle_id: string;
  accident_type: AccidentType;
  general_sub_type?: GeneralSubType;
  status: AccidentStatus;
  location_address?: string;
  location_latitude?: number;
  location_longitude?: number;
  lesa_report_no?: string;
  police_report_no?: string;
  submitted_at: string;
  created_at: string;
  vehicle?: {
    license_plate: string;
    brand: string;
    model?: string;
  };
  images?: AccidentImage[];
}

export interface AccidentImage {
  id: string;
  accident_report_id: string;
  image_type: ImageType;
  image_order: number;
  image_url: string;
  image_name?: string;
  uploaded_at: string;
}

export interface CreateAccidentRequest {
  vehicle_id: string;
  accident_type: AccidentType;
  general_sub_type?: GeneralSubType;
  location_address: string;
  location_latitude?: number;
  location_longitude?: number;
  accident_date: string;
  accident_time: string;
  lesa_report_no?: string;
  police_report_no?: string;
}

export interface UploadImageRequest {
  file: File | Blob;
  imageType: ImageType;
  imageOrder: number;
}

export const ACCIDENT_TYPES = [
  {
    id: 'front-to-rear' as AccidentType,
    title: 'Front-to-Rear',
    description: 'Collision where one vehicle strikes the rear of another',
    icon: '🚗',
    color: '#3b82f6'
  },
  {
    id: 'general' as AccidentType,
    title: 'General',
    description: 'Other types of accidents requiring detailed reporting',
    icon: '⚠️',
    color: '#f59e0b'
  }
];

export const GENERAL_SUB_TYPES = [
  {
    id: 'injury' as GeneralSubType,
    title: 'Injury',
    description: 'Accident involving personal injury',
    reportType: 'police',
    color: '#ef4444'
  },
  {
    id: 'govt-property' as GeneralSubType,
    title: 'Govt. Property',
    description: 'Damage to government property',
    reportType: 'police',
    color: '#3b82f6'
  },
  {
    id: 'private-property' as GeneralSubType,
    title: 'Private Property',
    description: 'Damage to private property',
    reportType: 'lesa',
    color: '#10b981'
  }
];

export const getRequiredReportType = (subType: GeneralSubType): 'police' | 'lesa' => {
  const subTypeConfig = GENERAL_SUB_TYPES.find(st => st.id === subType);
  return subTypeConfig?.reportType || 'police';
};

export const IMAGE_TYPES = [
  {
    id: 'form1' as ImageType,
    title: 'Form 1',
    description: 'First accident form',
    maxCount: 1
  },
  {
    id: 'form2' as ImageType,
    title: 'Form 2',
    description: 'Second accident form',
    maxCount: 1
  },
  {
    id: 'accident_photo' as ImageType,
    title: 'Accident Photos',
    description: 'Photos of accident scene',
    maxCount: 10
  }
];

export const CONTACT_NUMBERS = {
  LESA: '21320202',
  POLICE: '112'
};