import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import { layouts } from '../constants/layouts';

interface CallConfirmationModalProps {
    visible: boolean;
    statusName: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function CallConfirmationModal({
    visible,
    statusName,
    onConfirm,
    onCancel,
}: CallConfirmationModalProps) {
    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.container}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="call" size={48} color={colors.primary} />
                        </View>

                        <Text style={styles.title}>Call Required</Text>
                        
                        <Text style={styles.statusName}>{statusName}</Text>

                        <View style={styles.instructionBox}>
                            <View style={styles.instructionItem}>
                                <Ionicons name="warning" size={20} color={colors.warning} />
                                <Text style={styles.instructionText}>
                                    Before using this status, you MUST call the customer first!
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.confirmQuestion}>
                            Did you call the customer?
                        </Text>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={onCancel}
                            >
                                <Text style={styles.cancelButtonText}>No, Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={onConfirm}
                            >
                                <Ionicons name="checkmark-circle" size={20} color={colors.background} />
                                <Text style={styles.confirmButtonText}>Yes, I Called</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.monitoringNote}>
                            This confirmation is being monitored
                        </Text>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    safeArea: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: layouts.spacing.lg,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: colors.background,
        borderRadius: layouts.borderRadius.xl,
        padding: layouts.spacing.xl,
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: layouts.spacing.lg,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        marginBottom: layouts.spacing.sm,
    },
    statusName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.primary,
        marginBottom: layouts.spacing.lg,
    },
    instructionBox: {
        width: '100%',
        backgroundColor: colors.gray100,
        borderRadius: layouts.borderRadius.md,
        padding: layouts.spacing.md,
        marginBottom: layouts.spacing.lg,
        borderLeftWidth: 4,
        borderLeftColor: colors.warning,
    },
    instructionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: layouts.spacing.sm,
    },
    instructionText: {
        flex: 1,
        fontSize: 14,
        color: colors.text,
        lineHeight: 20,
    },
    confirmQuestion: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginBottom: layouts.spacing.lg,
        textAlign: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: layouts.spacing.md,
        width: '100%',
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
    confirmButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: layouts.spacing.md,
        borderRadius: layouts.borderRadius.md,
        backgroundColor: colors.success,
        alignItems: 'center',
        justifyContent: 'center',
        gap: layouts.spacing.xs,
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.background,
    },
    monitoringNote: {
        marginTop: layouts.spacing.lg,
        fontSize: 12,
        color: colors.textLight,
        fontStyle: 'italic',
    },
});