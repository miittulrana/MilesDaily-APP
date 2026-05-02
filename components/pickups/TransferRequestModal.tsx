import React, { useState } from 'react';
import {
    Modal, View, Text, StyleSheet, TouchableOpacity,
    TextInput, SafeAreaView, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { DriverPickupAssignment, requestTransfer } from '../../lib/pickupAssignments';

interface TransferRequestModalProps {
    visible: boolean;
    assignment: DriverPickupAssignment | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function TransferRequestModal({
    visible, assignment, onClose, onSuccess
}: TransferRequestModalProps) {
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) {
            Alert.alert('Reason Required', 'Please explain why you need this transfer.');
            return;
        }

        if (!assignment) return;

        setSubmitting(true);
        const success = await requestTransfer(assignment.id, reason.trim());
        setSubmitting(false);

        if (success) {
            setReason('');
            onSuccess();
            onClose();
        } else {
            Alert.alert('Error', 'Failed to submit transfer request. Try again.');
        }
    };

    const handleClose = () => {
        setReason('');
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modal}>
                        <View style={styles.header}>
                            <View style={styles.headerTitle}>
                                <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
                                <Text style={styles.title}>Request Transfer</Text>
                            </View>
                            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                                <Ionicons name="close" size={22} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {assignment && (
                            <View style={styles.bookingInfo}>
                                <Text style={styles.milesRef}>{assignment.miles_ref}</Text>
                                <Text style={styles.company}>{assignment.shipper_company || 'Unknown'}</Text>
                            </View>
                        )}

                        <View style={styles.body}>
                            <Text style={styles.label}>Reason (required)</Text>
                            <TextInput
                                style={styles.textarea}
                                value={reason}
                                onChangeText={setReason}
                                placeholder="Why do you need this pickup transferred..."
                                placeholderTextColor={colors.gray400}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                editable={!submitting}
                            />
                            <Text style={styles.hint}>
                                Your request will be sent to management for approval.
                            </Text>
                        </View>

                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={handleClose}
                                disabled={submitting}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.submitBtn, (!reason.trim() || submitting) && styles.submitBtnDisabled]}
                                onPress={handleSubmit}
                                disabled={!reason.trim() || submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Ionicons name="send" size={16} color="#fff" />
                                )}
                                <Text style={styles.submitText}>Submit Request</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    modal: {
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: layouts.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    headerTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    closeBtn: {
        padding: layouts.spacing.xs,
    },
    bookingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: layouts.spacing.md,
        backgroundColor: colors.gray100,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    milesRef: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.primary,
    },
    company: {
        fontSize: 13,
        color: colors.textLight,
    },
    body: {
        padding: layouts.spacing.lg,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: layouts.spacing.sm,
    },
    textarea: {
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: layouts.borderRadius.md,
        padding: layouts.spacing.md,
        fontSize: 14,
        color: colors.text,
        minHeight: 100,
        backgroundColor: colors.gray100,
    },
    hint: {
        fontSize: 12,
        color: colors.textLight,
        marginTop: layouts.spacing.sm,
        fontStyle: 'italic',
    },
    footer: {
        flexDirection: 'row',
        gap: layouts.spacing.md,
        padding: layouts.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.gray200,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: layouts.borderRadius.md,
        borderWidth: 1,
        borderColor: colors.gray300,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textLight,
    },
    submitBtn: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 14,
        borderRadius: layouts.borderRadius.md,
        backgroundColor: colors.primary,
    },
    submitBtnDisabled: {
        opacity: 0.5,
    },
    submitText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#ffffff',
    },
});