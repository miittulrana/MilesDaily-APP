import { UIContentConfig, StatusUIContent, GeneralLabels } from './types';
import { saveUIContent, loadUIContent } from './storage';
import { DEFAULT_CONFIG } from '../../constants/defaultConfig';

const API_BASE_URL = 'https://fleet.milesxp.com/api/driver-config';

let cachedUIContent: UIContentConfig | null = null;

export const fetchUIContent = async (): Promise<UIContentConfig> => {
    try {
        const response = await fetch(`${API_BASE_URL}/ui-content`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: UIContentConfig = await response.json();

        await saveUIContent(data);
        cachedUIContent = data;

        return data;
    } catch (error) {
        console.error('Error fetching UI content:', error);
        throw error;
    }
};

export const getUIContent = async (): Promise<UIContentConfig> => {
    if (cachedUIContent) {
        return cachedUIContent;
    }

    const stored = await loadUIContent();
    if (stored) {
        cachedUIContent = stored;
        return stored;
    }

    return DEFAULT_CONFIG.uiContent;
};

export const getStatusUIContent = async (statusId: number): Promise<StatusUIContent | null> => {
    const content = await getUIContent();
    return content.status_content.find((item) => item.status_id === statusId) || null;
};

export const getStatusInstructions = async (statusId: number): Promise<string[]> => {
    const content = await getStatusUIContent(statusId);
    return content?.instructions || [];
};

export const getReasonPlaceholder = async (statusId: number): Promise<string> => {
    const content = await getStatusUIContent(statusId);
    return content?.reason_placeholder || 'Enter reason...';
};

export const getReasonExamples = async (statusId: number): Promise<string[]> => {
    const content = await getStatusUIContent(statusId);
    return content?.reason_examples || [];
};

export const getStatusIcon = async (statusId: number): Promise<{ name: string; color: string }> => {
    const content = await getStatusUIContent(statusId);
    return {
        name: content?.icon_name || 'ellipse-outline',
        color: content?.icon_color || '#6b7280',
    };
};

export const getGeneralLabels = async (): Promise<GeneralLabels> => {
    const content = await getUIContent();
    return content.labels;
};

export const getCallConfirmationLabels = async (): Promise<{
    title: string;
    message: string;
    question: string;
    yesButton: string;
    noButton: string;
}> => {
    const labels = await getGeneralLabels();
    return {
        title: labels.call_confirmation_title,
        message: labels.call_confirmation_message,
        question: labels.call_confirmation_question,
        yesButton: labels.call_confirmation_yes,
        noButton: labels.call_confirmation_no,
    };
};

export const clearUIContentCache = (): void => {
    cachedUIContent = null;
};