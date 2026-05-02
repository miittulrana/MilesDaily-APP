import { StatusRule } from './types';
import { saveStatusRules, loadStatusRules } from './storage';
import { DEFAULT_CONFIG } from '../../constants/defaultConfig';

const API_BASE_URL = 'https://fleet-staging.milesxp.com/api/driver-config';

let cachedStatusRules: Record<number, StatusRule> | null = null;

export const fetchStatusRules = async (): Promise<Record<number, StatusRule>> => {
    try {
        const response = await fetch(`${API_BASE_URL}/status-rules`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const rulesArray: StatusRule[] = data.rules;

        const rulesMap: Record<number, StatusRule> = {};
        rulesArray.forEach((rule) => {
            rulesMap[rule.status_id] = rule;
        });

        await saveStatusRules(rulesMap);
        cachedStatusRules = rulesMap;

        return rulesMap;
    } catch (error) {
        console.error('Error fetching status rules:', error);
        throw error;
    }
};

export const getStatusRules = async (): Promise<Record<number, StatusRule>> => {
    if (cachedStatusRules) {
        return cachedStatusRules;
    }

    const stored = await loadStatusRules();
    if (stored) {
        cachedStatusRules = stored;
        return stored;
    }

    return DEFAULT_CONFIG.statusRules;
};

export const getStatusRule = async (statusId: number): Promise<StatusRule | null> => {
    const rules = await getStatusRules();
    return rules[statusId] || null;
};

export const isCallRequired = async (statusId: number): Promise<boolean> => {
    const rule = await getStatusRule(statusId);
    return rule?.call_required || false;
};

export const isPhotoRequired = async (statusId: number): Promise<boolean> => {
    const rule = await getStatusRule(statusId);
    return rule?.photo_required || false;
};

export const isReasonRequired = async (statusId: number): Promise<boolean> => {
    const rule = await getStatusRule(statusId);
    return rule?.reason_required || false;
};

export const isTwoStepStatus = async (statusId: number): Promise<boolean> => {
    const rule = await getStatusRule(statusId);
    return rule?.two_step || false;
};

export const isCustomerConfirmationRequired = async (statusId: number): Promise<boolean> => {
    const rule = await getStatusRule(statusId);
    return rule?.customer_confirmation || false;
};

export const getMaxPhotos = async (statusId: number): Promise<number> => {
    const rule = await getStatusRule(statusId);
    return rule?.max_photos || 0;
};

export const getPhotoDescription = async (statusId: number): Promise<string> => {
    const rule = await getStatusRule(statusId);
    return rule?.photo_description || '';
};

export const getStatusRequirements = async (statusId: number): Promise<{
    callRequired: boolean;
    photoRequired: boolean;
    reasonRequired: boolean;
    twoStep: boolean;
    customerConfirmation: boolean;
}> => {
    const rule = await getStatusRule(statusId);
    return {
        callRequired: rule?.call_required || false,
        photoRequired: rule?.photo_required || false,
        reasonRequired: rule?.reason_required || false,
        twoStep: rule?.two_step || false,
        customerConfirmation: rule?.customer_confirmation || false,
    };
};

export const clearStatusRulesCache = (): void => {
    cachedStatusRules = null;
};