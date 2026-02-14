import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import { layouts } from '../constants/layouts';
import {
    RESCHEDULED_DELIVERY_STATUS_ID,
    PARTIAL_DELIVERY_STATUS_ID,
    SHIPMENT_REFUSED_STATUS_ID,
    getReasonPlaceholder,
} from '../lib/statusHelpers';

interface ReasonInputModalProps {
    visible: boolean;
    statusId: number;
    statusName: string;
    onSubmit: (reason: string, piecesMissing?: number) => void;
    onCancel: () => void;
}

export default function ReasonInputModal({
    visible,
    statusId,
    statusName,
    onSubmit,
    onCancel,
}: ReasonInputModalProps) {
    const [reason, setReason] = useState('');
    const [piecesMissing, setPiecesMissing] = useState('');

    const isPartialDelivery = statusId === PARTIAL_DELIVERY_STATUS_ID;

    const handleSubmit = () => {
        if (!reason.trim()) {
            return;
        }

        if (isPartialDelivery) {
            const pieces = parseInt(piecesMissing, 10);
            onSubmit(reason.trim(), isNaN(pieces) ? undefined : pieces);
        } else {
            onSubmit(reason.trim());
        }

        setReason('');
        setPiecesMissing('');
    };

    const handleCancel = () => {
        setReason('');
        setPiecesMissing('');
        onCancel();
    };

    const getIcon = () => {
        switch (statusId) {
            case RESCHEDULED_DELIVERY_STATUS_ID:
                return 'calendar-outline';
            case PARTIAL_DELIVERY_STATUS_ID:
                return 'cube-outline';
            case SHIPMENT_REFUSED_STATUS_ID:
                return 'ban-outline';
            default:
                return 'document-text-outline';
        }
    };

    const getExamples = () => {
        switch (statusId) {
            case RESCHEDULED_DELIVERY_STATUS_ID:
                return [
                    'Customer wants delivery on Monday',
                    'Office closed, try tomorrow',
                    'Customer on holiday until Friday',
                ];
            case PARTIAL_DELIVERY_STATUS_ID:
                return [
                    '2 pieces missing',
                    '1 box missing',
                    '3 items not delivered',
                ];
            case SHIPMENT_REFUSED_STATUS_ID:
                return [
                    'Customer changed mind',
                    'Customer did not order this',
                    'Customer cannot pay COD',
                ];
            default:
                return [];
        }
    };

    const isValid = reason.trim().length > 0 && (!isPartialDelivery || piecesMissing.trim().length > 0);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleCancel}
        >
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.container}>
                        <View style={styles.header}>
                            <View style={styles.iconContainer}>
                                <Ionicons name={getIcon()} size={32} color={colors.primary} />
                            </View>
                            <Text style={styles.title}>{statusName}</Text>
                            <Text style={styles.subtitle}>Reason is MANDATORY</Text>
                        </View>

                        <View style={styles.content}>
                            {isPartialDelivery && (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>
                                        How many pieces are missing? *
                                    </Text>
                                    <TextInput
                                        style={styles.numberInput}
                                        value={piecesMissing}
                                        onChangeText={setPiecesMissing}
                                        placeholder="Enter number"
                                        placeholderTextColor={colors.gray400}
                                        keyboardType="number-pad"
                                    />
                                </View>
                            )}

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>
                                    {isPartialDelivery ? 'Additional details *' : 'Reason *'}
                                </Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={reason}
                                    onChangeText={setReason}
                                    placeholder={getReasonPlaceholder(statusId)}
                                    placeholderTextColor={colors.gray400}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                            </View>

                            <View style={styles.examplesSection}>
                                <Text style={styles.examplesTitle}>Examples:</Text>
                                {getExamples().map((example, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.exampleItem}
                                        onPress={() => setReason(example)}
                                    >
                                        <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                                        <Text style={styles.exampleText}>{example}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={handleCancel}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.submitButton,
                                    !isValid && styles.submitButtonDisabled,
                                ]}
                                onPress={handleSubmit}
                                disabled={!isValid}
                            >
                                <Ionicons name="checkmark-circle" size={20} color={colors.background} />
                                <Text style={styles.submitButtonText}>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    safeArea: {
        width: '100%',
    },
    container: {
        backgroundColor: colors.background,
        borderTopLeftRadius: layouts.borderRadius.xl,
        borderTopRightRadius: layouts.borderRadius.xl,
        maxHeight: '90%',
    },
    header: {
        alignItems: 'center',
        padding: layouts.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: layouts.spacing.md,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        marginBottom: layouts.spacing.xs,
    },
    subtitle: {
        fontSize: 14,
        color: colors.error,
        fontWeight: '600',
    },
    content: {
        padding: layouts.spacing.lg,
    },
    inputGroup: {
        marginBottom: layouts.spacing.lg,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: layouts.spacing.sm,
    },
    numberInput: {
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: layouts.borderRadius.md,
        padding: layouts.spacing.md,
        fontSize: 18,
        color: colors.text,
        fontWeight: '600',
        textAlign: 'center',
    },
    textInput: {
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: layouts.borderRadius.md,
        padding: layouts.spacing.md,
        fontSize: 16,
        color: colors.text,
        minHeight: 100,
    },
    examplesSection: {
        backgroundColor: colors.gray100,
        borderRadius: layouts.borderRadius.md,
        padding: layouts.spacing.md,
    },
    examplesTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textLight,
        marginBottom: layouts.spacing.sm,
        textTransform: 'uppercase',
    },
    exampleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: layouts.spacing.xs,
        gap: layouts.spacing.sm,
    },
    exampleText: {
        fontSize: 14,
        color: colors.text,
    },
    footer: {
        flexDirection: 'row',
        padding: layouts.spacing.lg,
        gap: layouts.spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.gray200,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: layouts.spacing.md,
        borderRadius: layouts.borderRadius.md,
        backgroundColor: colors.gray200,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    submitButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: layouts.spacing.md,
        borderRadius: layouts.borderRadius.md,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        gap: layouts.spacing.xs,
    },
    submitButtonDisabled: {
        backgroundColor: colors.gray400,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.background,
    },
});