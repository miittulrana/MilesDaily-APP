import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import LoadingIndicator from '../LoadingIndicator';
import SignatureModal from '../SignatureModal';

interface AcknowledgementModalProps {
    visible: boolean;
    runsheetId: string;
    staffName: string;
    dateFrom: string;
    dateTo: string;
    totalBookings: number;
    totalPieces: number;
    onAcknowledge: (signature: string) => Promise<void>;
    onCancel: () => void;
}

export default function AcknowledgementModal({
    visible,
    runsheetId,
    staffName,
    dateFrom,
    dateTo,
    totalBookings,
    totalPieces,
    onAcknowledge,
    onCancel
}: AcknowledgementModalProps) {
    const [signature, setSignature] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [signatureModalVisible, setSignatureModalVisible] = useState(false);

    const handleOpenSignature = () => {
        setSignatureModalVisible(true);
    };

    const handleSignatureSave = (sig: string) => {
        setSignature(sig);
        setSignatureModalVisible(false);
    };

    const handleSignatureCancel = () => {
        setSignatureModalVisible(false);
    };

    const handleClearSignature = () => {
        setSignature(null);
    };

    const handleAcknowledge = async () => {
        if (!signature) {
            Alert.alert('Signature Required', 'Please sign before acknowledging.');
            return;
        }

        try {
            setLoading(true);
            await onAcknowledge(signature);
        } catch (error) {
            Alert.alert('Error', 'Failed to save acknowledgement. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingIndicator fullScreen message="Saving acknowledgement..." />;
    }

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Run-Sheet Acknowledgement</Text>
                    <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content}>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoTitle}>Run-Sheet Details</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Assigned To:</Text>
                            <Text style={styles.infoValue}>{staffName}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Date Range:</Text>
                            <Text style={styles.infoValue}>{dateFrom} to {dateTo}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Total Bookings:</Text>
                            <Text style={styles.infoValue}>{totalBookings}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Total Pieces:</Text>
                            <Text style={styles.infoValue}>{totalPieces}</Text>
                        </View>
                    </View>

                    <View style={styles.statementCard}>
                        <View style={styles.statementHeader}>
                            <Ionicons name="document-text" size={24} color={colors.primary} />
                            <Text style={styles.statementTitle}>Acknowledgement Statement</Text>
                        </View>
                        <Text style={styles.statementText}>
                            I understand and agree that I have the exact amount of pieces physically as described
                            in the digital Run-Sheet, and that this Acknowledgement will be used as the reference
                            going forward.
                        </Text>
                    </View>

                    <View style={styles.signatureSection}>
                        <Text style={styles.sectionTitle}>Driver Signature *</Text>
                        
                        {signature ? (
                            <View style={styles.signaturePreview}>
                                <Image
                                    source={{ uri: signature }}
                                    style={styles.signatureImage}
                                    resizeMode="contain"
                                />
                                <View style={styles.signatureActions}>
                                    <TouchableOpacity style={styles.clearButton} onPress={handleClearSignature}>
                                        <Ionicons name="trash-outline" size={18} color={colors.error} />
                                        <Text style={styles.clearButtonText}>Clear</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.editButton} onPress={handleOpenSignature}>
                                        <Ionicons name="create-outline" size={18} color={colors.primary} />
                                        <Text style={styles.editButtonText}>Re-sign</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.savedBadge}>
                                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                                    <Text style={styles.savedBadgeText}>Signature Saved</Text>
                                </View>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.signatureButton} onPress={handleOpenSignature}>
                                <View style={styles.signatureButtonContent}>
                                    <Ionicons name="pencil" size={32} color={colors.primary} />
                                    <Text style={styles.signatureButtonText}>Tap to Sign</Text>
                                    <Text style={styles.signatureButtonHint}>Opens full screen signature pad</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={onCancel}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.acknowledgeButton, !signature && styles.acknowledgeButtonDisabled]}
                        onPress={handleAcknowledge}
                        disabled={!signature}
                    >
                        <Ionicons name="checkmark-circle" size={20} color={colors.background} />
                        <Text style={styles.acknowledgeButtonText}>Acknowledge</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <SignatureModal
                visible={signatureModalVisible}
                onSave={handleSignatureSave}
                onCancel={handleSignatureCancel}
            />
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: layouts.spacing.lg,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    closeButton: {
        padding: layouts.spacing.sm,
    },
    content: {
        flex: 1,
        padding: layouts.spacing.lg,
    },
    infoCard: {
        backgroundColor: colors.card,
        borderRadius: layouts.borderRadius.lg,
        padding: layouts.spacing.lg,
        marginBottom: layouts.spacing.lg,
        borderWidth: 1,
        borderColor: colors.gray200,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: layouts.spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: layouts.spacing.sm,
    },
    infoLabel: {
        fontSize: 14,
        color: colors.textLight,
        fontWeight: '600',
    },
    infoValue: {
        fontSize: 14,
        color: colors.text,
    },
    statementCard: {
        backgroundColor: colors.primaryLight + '15',
        borderRadius: layouts.borderRadius.lg,
        padding: layouts.spacing.lg,
        marginBottom: layouts.spacing.lg,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
    },
    statementHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: layouts.spacing.sm,
        marginBottom: layouts.spacing.md,
    },
    statementTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    statementText: {
        fontSize: 14,
        color: colors.text,
        lineHeight: 22,
    },
    signatureSection: {
        marginBottom: layouts.spacing.lg,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: layouts.spacing.sm,
    },
    signatureButton: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.gray100,
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: colors.gray300,
        borderRadius: layouts.borderRadius.md,
    },
    signatureButtonContent: {
        alignItems: 'center',
        gap: layouts.spacing.sm,
    },
    signatureButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.primary,
    },
    signatureButtonHint: {
        fontSize: 12,
        color: colors.textLight,
    },
    signaturePreview: {
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: layouts.borderRadius.md,
        overflow: 'hidden',
        position: 'relative',
    },
    signatureImage: {
        height: 150,
        width: '100%',
        backgroundColor: colors.background,
    },
    signatureActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: layouts.spacing.sm,
        backgroundColor: colors.gray100,
        borderTopWidth: 1,
        borderTopColor: colors.gray200,
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: layouts.spacing.sm,
        gap: 4,
    },
    clearButtonText: {
        fontSize: 14,
        color: colors.error,
        fontWeight: '600',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: layouts.spacing.sm,
        gap: 4,
    },
    editButtonText: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
    },
    savedBadge: {
        position: 'absolute',
        top: layouts.spacing.sm,
        right: layouts.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.success + '20',
        paddingHorizontal: layouts.spacing.sm,
        paddingVertical: 4,
        borderRadius: layouts.borderRadius.full,
        gap: 4,
    },
    savedBadgeText: {
        fontSize: 12,
        color: colors.success,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        padding: layouts.spacing.lg,
        gap: layouts.spacing.md,
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.gray200,
    },
    cancelButton: {
        flex: 1,
        padding: layouts.spacing.md,
        borderRadius: layouts.borderRadius.md,
        backgroundColor: colors.gray200,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    acknowledgeButton: {
        flex: 1,
        flexDirection: 'row',
        padding: layouts.spacing.md,
        borderRadius: layouts.borderRadius.md,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        gap: layouts.spacing.xs,
    },
    acknowledgeButtonDisabled: {
        backgroundColor: colors.gray400,
    },
    acknowledgeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.background,
    },
});