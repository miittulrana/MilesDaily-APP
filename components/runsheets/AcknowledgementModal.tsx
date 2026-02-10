import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import SignatureScreen from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import LoadingIndicator from '../LoadingIndicator';

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
    const signatureRef = useRef<any>(null);
    const [signature, setSignature] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [scrollEnabled, setScrollEnabled] = useState(true);

    const handleClear = () => {
        signatureRef.current?.clearSignature();
        setSignature(null);
    };

    const handleEnd = () => {
        signatureRef.current?.readSignature();
        setScrollEnabled(true);
    };

    const handleBegin = () => {
        setScrollEnabled(false);
    };

    const handleOK = (sig: string) => {
        if (sig) {
            setSignature(sig);
        }
    };

    const handleEmpty = () => {
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

    const style = `.m-signature-pad {box-shadow: none; border: none; margin: 0; padding: 0;} 
                   .m-signature-pad--body {border: none; margin: 0; padding: 0;}
                   .m-signature-pad--footer {display: none; margin: 0; padding: 0;}
                   body,html {width: 100%; height: 100%; margin: 0; padding: 0;}
                   canvas {width: 100% !important; height: 100% !important;}`;

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

                <ScrollView style={styles.content} scrollEnabled={scrollEnabled}>
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
                        <View style={styles.signatureCanvas}>
                            <SignatureScreen
                                ref={signatureRef}
                                onEnd={handleEnd}
                                onOK={handleOK}
                                onEmpty={handleEmpty}
                                onBegin={handleBegin}
                                autoClear={false}
                                descriptionText=""
                                clearText=""
                                confirmText=""
                                webStyle={style}
                                backgroundColor="rgb(255,255,255)"
                                penColor="black"
                                dotSize={2}
                                minWidth={2}
                                maxWidth={3}
                                trimWhitespace={false}
                                imageType="image/png"
                            />
                        </View>
                        <View style={styles.signatureActions}>
                            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                                <Ionicons name="trash-outline" size={20} color={colors.error} />
                                <Text style={styles.clearButtonText}>Clear</Text>
                            </TouchableOpacity>
                            {signature && (
                                <View style={styles.savedIndicator}>
                                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                                    <Text style={styles.savedText}>Signature Saved</Text>
                                </View>
                            )}
                        </View>
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
    signatureCanvas: {
        height: 200,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: layouts.borderRadius.md,
        overflow: 'hidden',
        backgroundColor: colors.background,
    },
    signatureActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: layouts.spacing.sm,
        backgroundColor: colors.gray100,
        borderBottomLeftRadius: layouts.borderRadius.md,
        borderBottomRightRadius: layouts.borderRadius.md,
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: layouts.spacing.xs,
        padding: layouts.spacing.sm,
    },
    clearButtonText: {
        fontSize: 14,
        color: colors.error,
        fontWeight: '600',
    },
    savedIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: layouts.spacing.xs,
    },
    savedText: {
        fontSize: 14,
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