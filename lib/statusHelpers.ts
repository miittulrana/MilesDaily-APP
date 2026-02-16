import { supabaseBizhandle } from './bizhandleClient';
import { supabase } from './supabase';
import { Booking } from './bizhandleTypes';
import {
    isLeftMessageStatus as isRemoteLeftMessageStatus,
    getValidationRulesForStatus,
    getBlockingRule,
    getRequiresPreviousRule,
    getDailyLimitRule,
    getLeftMessageStatuses,
} from './remoteConfig';
import {
    getReasonPlaceholder as getRemoteReasonPlaceholder,
    getReasonExamples as getRemoteReasonExamples,
    getStatusInstructions as getRemoteStatusInstructions,
} from './remoteConfig';

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

export interface LeftMessageCheckResult {
    warning: boolean;
    count: number;
    message?: string;
}

export const parseCODFromSpecialInstruction = (
    specialInstruction: string | null | undefined
): CODInfo => {
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
            sql: query,
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
            sql: query,
        });

        if (error) {
            console.error('Error checking status history:', error);
            return false;
        }

        return data && data.length > 0;
    } catch (error) {
        console.error('Error in hasStatusInHistory:', error);
        return false;
    }
};

export const checkLeftMessageDailyCount = async (
    statusId: number,
    bookingRef?: string
): Promise<LeftMessageCheckResult> => {
    const isLeftMessage = await isRemoteLeftMessageStatus(statusId);
    if (!isLeftMessage) {
        return { warning: false, count: 0 };
    }

    try {
        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
            console.log('No auth session for left message check - skipping');
            return { warning: false, count: 0 };
        }

        const url = 'https://fleet.milesxp.com/api/drivers/left-message-warning';

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                status_id: statusId,
                booking_ref: bookingRef,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Left message warning API error:', response.status, errorText);
            return { warning: false, count: 0 };
        }

        const result = await response.json();

        return {
            warning: result.warning || false,
            count: result.count || 0,
            message: result.message,
        };
    } catch (error: any) {
        console.error('Left message check exception:', error);
        return { warning: false, count: 0 };
    }
};

export const validateLeftMessageNote1 = async (
    bookingId: number
): Promise<StatusValidationResult> => {
    const blockingRule = await getBlockingRule(LEFT_MESSAGE_NOTE_1_STATUS_ID);

    if (blockingRule) {
        const hasNote1 = await hasStatusInHistory(bookingId, LEFT_MESSAGE_NOTE_1_STATUS_ID);

        if (hasNote1) {
            return {
                allowed: false,
                error: blockingRule.error_message,
                warning: blockingRule.warning_message,
                suggestedStatusId: blockingRule.suggested_status_id,
            };
        }
    }

    return { allowed: true };
};

export const validateLeftMessageNote2 = async (
    bookingId: number
): Promise<StatusValidationResult> => {
    const requiresRule = await getRequiresPreviousRule(LEFT_MESSAGE_NOTE_2_STATUS_ID);

    if (requiresRule) {
        const hasNote1 = await hasStatusInHistory(bookingId, requiresRule.condition_status_id!);

        if (!hasNote1) {
            return {
                allowed: false,
                error: requiresRule.error_message,
            };
        }
    }

    const blockingRule = await getBlockingRule(LEFT_MESSAGE_NOTE_2_STATUS_ID);

    if (blockingRule) {
        const hasNote2 = await hasStatusInHistory(bookingId, LEFT_MESSAGE_NOTE_2_STATUS_ID);

        if (hasNote2) {
            return {
                allowed: false,
                error: blockingRule.error_message,
                warning: blockingRule.warning_message,
                suggestedStatusId: blockingRule.suggested_status_id,
            };
        }
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

export const isCallRequired = async (statusId: number): Promise<boolean> => {
    const { isCallRequired: checkCallRequired } = await import('./remoteConfig');
    return checkCallRequired(statusId);
};

export const isPhotoRequired = async (statusId: number): Promise<boolean> => {
    const { isPhotoRequired: checkPhotoRequired } = await import('./remoteConfig');
    return checkPhotoRequired(statusId);
};

export const isReasonRequired = async (statusId: number): Promise<boolean> => {
    const { isReasonRequired: checkReasonRequired } = await import('./remoteConfig');
    return checkReasonRequired(statusId);
};

export const isTwoStepStatus = async (statusId: number): Promise<boolean> => {
    const { isTwoStepStatus: checkTwoStep } = await import('./remoteConfig');
    return checkTwoStep(statusId);
};

export const isLeftMessageStatus = async (statusId: number): Promise<boolean> => {
    return isRemoteLeftMessageStatus(statusId);
};

export const getStatusRequirements = async (
    statusId: number
): Promise<{
    callRequired: boolean;
    photoRequired: boolean;
    reasonRequired: boolean;
    twoStep: boolean;
    customerConfirmation: boolean;
}> => {
    const { getStatusRequirements: getRemoteRequirements } = await import('./remoteConfig');
    return getRemoteRequirements(statusId);
};

export const getReasonPlaceholder = async (statusId: number): Promise<string> => {
    return getRemoteReasonPlaceholder(statusId);
};

export const getStatusInstructions = async (statusId: number): Promise<string[]> => {
    return getRemoteStatusInstructions(statusId);
};

export const getReasonExamples = async (statusId: number): Promise<string[]> => {
    return getRemoteReasonExamples(statusId);
};