import { StatusValidations, ValidationRule } from './types';
import { saveValidations, loadValidations } from './storage';
import { DEFAULT_CONFIG } from '../../constants/defaultConfig';

const API_BASE_URL = 'https://fleet-staging.milesxp.com/api/driver-config';

let cachedValidations: StatusValidations | null = null;

export const fetchStatusValidations = async (): Promise<StatusValidations> => {
    try {
        const response = await fetch(`${API_BASE_URL}/status-validations`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: StatusValidations = await response.json();

        await saveValidations(data);
        cachedValidations = data;

        return data;
    } catch (error) {
        console.error('Error fetching status validations:', error);
        throw error;
    }
};

export const getStatusValidations = async (): Promise<StatusValidations> => {
    if (cachedValidations) {
        return cachedValidations;
    }

    const stored = await loadValidations();
    if (stored) {
        cachedValidations = stored;
        return stored;
    }

    return DEFAULT_CONFIG.validations;
};

export const getValidationRulesForStatus = async (statusId: number): Promise<ValidationRule[]> => {
    const validations = await getStatusValidations();
    return validations.rules.filter((rule) => rule.status_id === statusId);
};

export const isLeftMessageStatus = async (statusId: number): Promise<boolean> => {
    const validations = await getStatusValidations();
    return validations.left_message_statuses.includes(statusId);
};

export const getLeftMessageStatuses = async (): Promise<number[]> => {
    const validations = await getStatusValidations();
    return validations.left_message_statuses;
};

export const getBlockingRule = async (statusId: number): Promise<ValidationRule | null> => {
    const rules = await getValidationRulesForStatus(statusId);
    return rules.find((rule) => rule.rule_type === 'blocks_if_exists') || null;
};

export const getRequiresPreviousRule = async (statusId: number): Promise<ValidationRule | null> => {
    const rules = await getValidationRulesForStatus(statusId);
    return rules.find((rule) => rule.rule_type === 'requires_previous') || null;
};

export const getDailyLimitRule = async (statusId: number): Promise<ValidationRule | null> => {
    const rules = await getValidationRulesForStatus(statusId);
    return rules.find((rule) => rule.rule_type === 'daily_limit') || null;
};

export const clearValidationsCache = (): void => {
    cachedValidations = null;
};