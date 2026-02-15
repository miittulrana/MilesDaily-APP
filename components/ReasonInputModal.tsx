import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    ScrollView,
    TouchableWithoutFeedback,
    Keyboard,
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

    useEffect(() => {
        if (!visible) {
            setReason('');
            setPiecesMissing('');
        }
    }, [visible]);

    const handleSubmit = () => {
        if (!reason.trim()) {
            return;
        }

        if (isPartialDelivery && !piecesMissing.trim()) {
            return;
        }

        if (isPartialDelivery) {
            const pieces = parseInt(piecesMissing, 10);
            onSubmit(reason.trim(), isNaN(pieces) ? undefined : pieces);
        } else {
            onSubmit(reason.trim());
        }
    };

    const handleClose = () => {
        setReason('');
        setPiecesMissing('');
        onCancel();
    };

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    const getIcon = (): any => {
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

    const getIconColor = () => {
        switch (statusId) {
            case RESCHEDULED_DELIVERY_STATUS_ID:
                return '#f59e0b';
            case PARTIAL_DELIVERY_STATUS_ID:
                return '#f97316';
            case SHIPMENT_REFUSED_STATUS_ID:
                return '#ef4444';
            default:
                return colors.primary;
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
            transparent={false}
            onRequestClose={handleClose}
        >
            <SafeAreaView style={styles.container}>
                <TouchableWithoutFeedback onPress={dismissKeyboard}>
                    <View style={styles.innerContainer}>
                        <View style={styles.header}>
                            <TouchableOpacity onPress={handleClose} style={styles.headerCloseButton}>
                                <Ionicons name="close" size={28} color={colors.text} />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>{statusName}</Text>
                            <View style={{ width: 40 }} />
                        </View>

                        <ScrollView 
                            style={styles.scrollContent}
                            contentContainerStyle={styles.scrollContentContainer}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={[styles.iconContainer, { backgroundColor: `${getIconColor()}20` }]}>
                                <Ionicons name={getIcon()} size={48} color={getIconColor()} />
                            </View>

                            <View style={styles.mandatoryBadge}>
                                <Ionicons name="warning" size={16} color="#dc2626" />
                                <Text style={styles.mandatoryText}>Reason is MANDATORY</Text>
                            </View>

                            {isPartialDelivery && (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>How many pieces are missing? *</Text>
                                    <TextInput
                                        style={styles.numberInput}
                                        value={piecesMissing}
                                        onChangeText={setPiecesMissing}
                                        placeholder="Enter number"
                                        placeholderTextColor={colors.gray400}
                                        keyboardType="number-pad"
                                        returnKeyType="done"
                                        onSubmitEditing={dismissKeyboard}
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
                                    returnKeyType="done"
                                    blurOnSubmit={true}
                                    onSubmitEditing={dismissKeyboard}
                                />
                            </View>

                            <View style={styles.examplesSection}>
                                <Text style={styles.examplesTitle}>EXAMPLES:</Text>
                                {getExamples().map((example, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.exampleItem}
                                        onPress={() => {
                                            setReason(example);
                                            dismissKeyboard();
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                                        <Text style={styles.exampleText}>{example}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={handleClose}
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
                                <Ionicons name="checkmark-circle" size={22} color={colors.background} />
                                <Text style={styles.submitButtonText}>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    innerContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: layouts.spacing.md,
        paddingVertical: layouts.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
        backgroundColor: colors.background,
    },
    headerCloseButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
        flex: 1,
    },
    scrollContent: {
        flex: 1,
    },
    scrollContentContainer: {
        padding: layouts.spacing.lg,
        paddingBottom: layouts.spacing.xl * 2,
    },
    iconContainer: {
        width: 88,
        height: 88,
        borderRadius: 44,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: layouts.spacing.md,
    },
    mandatoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fef2f2',
        paddingVertical: layouts.spacing.sm,
        paddingHorizontal: layouts.spacing.md,
        borderRadius: layouts.borderRadius.full,
        alignSelf: 'center',
        marginBottom: layouts.spacing.xl,
        gap: layouts.spacing.xs,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    mandatoryText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#dc2626',
    },
    inputGroup: {
        marginBottom: layouts.spacing.lg,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: layouts.spacing.sm,
    },
    numberInput: {
        borderWidth: 2,
        borderColor: colors.gray300,
        borderRadius: layouts.borderRadius.lg,
        paddingHorizontal: layouts.spacing.lg,
        paddingVertical: layouts.spacing.md,
        fontSize: 24,
        color: colors.text,
        fontWeight: '700',
        textAlign: 'center',
        backgroundColor: colors.background,
    },
    textInput: {
        borderWidth: 2,
        borderColor: colors.gray300,
        borderRadius: layouts.borderRadius.lg,
        padding: layouts.spacing.md,
        fontSize: 16,
        color: colors.text,
        minHeight: 120,
        backgroundColor: colors.background,
        lineHeight: 24,
    },
    examplesSection: {
        backgroundColor: colors.gray100,
        borderRadius: layouts.borderRadius.lg,
        padding: layouts.spacing.md,
    },
    examplesTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textLight,
        marginBottom: layouts.spacing.sm,
        letterSpacing: 0.5,
    },
    exampleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: layouts.spacing.sm,
        gap: layouts.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    exampleText: {
        fontSize: 15,
        color: colors.text,
        flex: 1,
    },
    footer: {
        flexDirection: 'row',
        padding: layouts.spacing.lg,
        gap: layouts.spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.gray200,
        backgroundColor: colors.background,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: layouts.spacing.md,
        borderRadius: layouts.borderRadius.lg,
        backgroundColor: colors.gray200,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: colors.text,
    },
    submitButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: layouts.spacing.md,
        borderRadius: layouts.borderRadius.lg,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        gap: layouts.spacing.xs,
    },
    submitButtonDisabled: {
        backgroundColor: colors.gray400,
    },
    submitButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.background,
    },
});