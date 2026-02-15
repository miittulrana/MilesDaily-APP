import { supabaseBizhandle } from './bizhandleClient';
import { Booking } from './bizhandleTypes';

export const LEFT_MESSAGE_NOTE_1_STATUS_ID = 17;
export const LEFT_MESSAGE_NOTE_2_STATUS_ID = 52;
export const COD_CASH_COLLECTED_STATUS_ID = 47;
export const WRONG_CASE_PACKAGING_STATUS_ID = 59;
export const CORRECT_CONTACT_DETAILS_STATUS_ID = 16;
export const RESCHEDULED_DELIVERY_STATUS_ID = 31;
export const ON_HOLD_FOR_PICKUP_STATUS_ID = 22;
export const PARTIAL_DELIVERY_STATUS_ID = 23;
export const SHIPMENT_REFUSED_STATUS_ID = 38;
export const DELIVERED_STATUS_ID = 10;

export const CALL_REQUIRED_STATUSES = [
    LEFT_MESSAGE_NOTE_1_STATUS_ID,
    LEFT_MESSAGE_NOTE_2_STATUS_ID,
    ON_HOLD_FOR_PICKUP_STATUS_ID,
];

export const PHOTO_REQUIRED_STATUSES = [
    LEFT_MESSAGE_NOTE_1_STATUS_ID,
    LEFT_MESSAGE_NOTE_2_STATUS_ID,
    WRONG_CASE_PACKAGING_STATUS_ID,
    CORRECT_CONTACT_DETAILS_STATUS_ID,
];

export const REASON_REQUIRED_STATUSES = [
    RESCHEDULED_DELIVERY_STATUS_ID,
    PARTIAL_DELIVERY_STATUS_ID,
    SHIPMENT_REFUSED_STATUS_ID,
];

export const TWO_STEP_STATUSES = [
    COD_CASH_COLLECTED_STATUS_ID,
];

export interface CODInfo {
    hasCOD: boolean;
    amount: number | null;
    currency: string;
    rawText: string | null;
}

export interface StatusHistoryItem {
    booking_status_id: number;
    booking_id: number;
    status_id: number;
    status_name: string;
    delivered_date: string;
    delivered_time: string;
    created_at: string;
}

export interface StatusValidationResult {
    allowed: boolean;
    error?: string;
    warning?: string;
    suggestedStatusId?: number;
}

export const parseCODFromSpecialInstruction = (specialInstruction: string | null | undefined): CODInfo => {
    if (!specialInstruction) {
        return { hasCOD: false, amount: null, currency: 'EUR', rawText: null };
    }

    const codPatterns = [
        /COD\s*[-:]\s*(?:EUR|€)?\s*(\d+(?:[.,]\d{1,2})?)/i,
        /COD\s+Amount\s*[:=]?\s*(?:EUR|€)?\s*(\d+(?:[.,]\d{1,2})?)/i,
        /Cash\s+on\s+Delivery\s*[:=]?\s*(?:EUR|€)?\s*(\d+(?:[.,]\d{1,2})?)/i,
        /(?:EUR|€)\s*(\d+(?:[.,]\d{1,2})?)\s*COD/i,
    ];

    for (const pattern of codPatterns) {
        const match = specialInstruction.match(pattern);
        if (match && match[1]) {
            const amountStr = match[1].replace(',', '.');
            const amount = parseFloat(amountStr);
            if (!isNaN(amount) && amount > 0) {
                let currency = 'EUR';
                if (specialInstruction.toUpperCase().includes('USD')) {
                    currency = 'USD';
                } else if (specialInstruction.toUpperCase().includes('GBP')) {
                    currency = 'GBP';
                }
                return {
                    hasCOD: true,
                    amount,
                    currency,
                    rawText: specialInstruction,
                };
            }
        }
    }

    const hasCODMention = /\bCOD\b|cash\s+on\s+delivery/i.test(specialInstruction);
    
    return {
        hasCOD: hasCODMention,
        amount: null,
        currency: 'EUR',
        rawText: hasCODMention ? specialInstruction : null,
    };
};

export const getStatusHistory = async (bookingId: number): Promise<StatusHistoryItem[]> => {
    try {
        const query = `
            SELECT 
                booking_status_id,
                booking_id,
                status_id,
                delivered_date,
                delivered_time,
                created_at
            FROM miles_production.booking_status
            WHERE booking_id = ${bookingId}
              AND deleted_at IS NULL
            ORDER BY delivered_date ASC, delivered_time ASC
        `;

        const { data, error } = await supabaseBizhandle.rpc('execute_sql', {
            sql: query
        });

        if (error) {
            console.error('Error fetching status history:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in getStatusHistory:', error);
        return [];
    }
};

export const hasStatusInHistory = async (bookingId: number, statusId: number): Promise<boolean> => {
    try {
        const query = `
            SELECT booking_status_id
            FROM miles_production.booking_status
            WHERE booking_id = ${bookingId}
              AND status_id = ${statusId}
              AND deleted_at IS NULL
            LIMIT 1
        `;

        const { data, error } = await supabaseBizhandle.rpc('execute_sql', {
            sql: query
        });

        if (error) {
            console.error('Error checking status history:', error);
            return false;
        }

        return (data && data.length > 0);
    } catch (error) {
        console.error('Error in hasStatusInHistory:', error);
        return false;
    }
};

export const validateLeftMessageNote1 = async (bookingId: number): Promise<StatusValidationResult> => {
    const hasNote1 = await hasStatusInHistory(bookingId, LEFT_MESSAGE_NOTE_1_STATUS_ID);
    
    if (hasNote1) {
        return {
            allowed: false,
            error: 'Left Message Note 1 has already been used for this parcel. You cannot use it again.',
            warning: 'Use Left Message Note 2 instead.',
        };
    }

    return { allowed: true };
};

export const validateLeftMessageNote2 = async (bookingId: number): Promise<StatusValidationResult> => {
    const hasNote1 = await hasStatusInHistory(bookingId, LEFT_MESSAGE_NOTE_1_STATUS_ID);
    
    if (!hasNote1) {
        return {
            allowed: false,
            error: 'You must use Left Message Note 1 before using Note 2.',
        };
    }

    const hasNote2 = await hasStatusInHistory(bookingId, LEFT_MESSAGE_NOTE_2_STATUS_ID);
    
    if (hasNote2) {
        return {
            allowed: false,
            error: 'Left Message Note 2 has already been used for this parcel. You cannot use it again.',
            warning: 'Use "Shipment Refused" instead (only when agreed with PD).',
            suggestedStatusId: SHIPMENT_REFUSED_STATUS_ID,
        };
    }

    return { allowed: true };
};

export const validateStatusSelection = async (
    bookingId: number,
    statusId: number,
    booking?: Booking
): Promise<StatusValidationResult> => {
    switch (statusId) {
        case LEFT_MESSAGE_NOTE_1_STATUS_ID:
            return await validateLeftMessageNote1(bookingId);
        
        case LEFT_MESSAGE_NOTE_2_STATUS_ID:
            return await validateLeftMessageNote2(bookingId);
        
        case COD_CASH_COLLECTED_STATUS_ID:
            return { allowed: true };
        
        default:
            return { allowed: true };
    }
};

export const isCallRequired = (statusId: number): boolean => {
    return CALL_REQUIRED_STATUSES.includes(statusId);
};

export const isPhotoRequired = (statusId: number): boolean => {
    return PHOTO_REQUIRED_STATUSES.includes(statusId);
};

export const isReasonRequired = (statusId: number): boolean => {
    return REASON_REQUIRED_STATUSES.includes(statusId);
};

export const isTwoStepStatus = (statusId: number): boolean => {
    return TWO_STEP_STATUSES.includes(statusId);
};

export const getStatusRequirements = (statusId: number): {
    callRequired: boolean;
    photoRequired: boolean;
    reasonRequired: boolean;
    twoStep: boolean;
    customerConfirmation: boolean;
} => {
    return {
        callRequired: isCallRequired(statusId),
        photoRequired: isPhotoRequired(statusId),
        reasonRequired: isReasonRequired(statusId),
        twoStep: isTwoStepStatus(statusId),
        customerConfirmation: statusId === DELIVERED_STATUS_ID,
    };
};

export const getReasonPlaceholder = (statusId: number): string => {
    switch (statusId) {
        case RESCHEDULED_DELIVERY_STATUS_ID:
            return 'e.g., Customer wants delivery on Monday, Office closed try tomorrow';
        case PARTIAL_DELIVERY_STATUS_ID:
            return 'e.g., 2 pieces missing, 1 box missing';
        case SHIPMENT_REFUSED_STATUS_ID:
            return 'e.g., Customer changed mind, Customer did not order this, Customer cannot pay COD';
        default:
            return 'Enter reason...';
    }
};

export const getStatusInstructions = (statusId: number): string[] => {
    switch (statusId) {
        case LEFT_MESSAGE_NOTE_1_STATUS_ID:
            return [
                'CALL the customer first!',
                'Confirm: "I called the customer"',
                'Take PHOTO of location + Note',
            ];
        case LEFT_MESSAGE_NOTE_2_STATUS_ID:
            return [
                'CALL the customer first!',
                'Confirm: "I called the customer"',
                'Take PHOTO of location',
            ];
        case COD_CASH_COLLECTED_STATUS_ID:
            return [
                'Select "COD/Cash Collected"',
                'Confirm the amount you collected / Or Write if different',
                'Then scan again → "Delivered"',
            ];
        case WRONG_CASE_PACKAGING_STATUS_ID:
            return [
                'Take PHOTO of the parcel',
                'Show the damage or problem clearly!',
            ];
        case CORRECT_CONTACT_DETAILS_STATUS_ID:
            return [
                'Take PHOTO of parcel',
            ];
        case RESCHEDULED_DELIVERY_STATUS_ID:
            return [
                'Write the REASON (mandatory)',
            ];
        case ON_HOLD_FOR_PICKUP_STATUS_ID:
            return [
                'CALL the customer first!',
                'Confirm they will pick up',
                'Click confirmation: "I confirmed that I called the customer"',
            ];
        case PARTIAL_DELIVERY_STATUS_ID:
            return [
                'Write HOW MANY pieces are missing (mandatory)',
            ];
        case SHIPMENT_REFUSED_STATUS_ID:
            return [
                'Write the REASON (mandatory)',
            ];
        default:
            return [];
    }
};