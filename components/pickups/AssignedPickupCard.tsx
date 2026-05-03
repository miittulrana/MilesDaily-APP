import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { DriverPickupAssignment } from '../../lib/pickupAssignments';

interface AssignedPickupCardProps {
    assignment: DriverPickupAssignment;
    onRequestTransfer: (assignment: DriverPickupAssignment) => void;
}

const formatTime = (t: string | null | undefined): string => t ? t.substring(0, 5) : '--:--';

export default function AssignedPickupCard({ assignment, onRequestTransfer }: AssignedPickupCardProps) {
    const isTransferRequested = assignment.status === 'transfer_requested';

    return (
        <View style={[
            styles.card,
            assignment.is_urgent && styles.cardUrgent,
            isTransferRequested && styles.cardTransferRequested
        ]}>
            {/* Header row */}
            <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                    <Text style={styles.milesRef}>{assignment.miles_ref}</Text>
                    {assignment.is_urgent && (
                        <View style={styles.urgentBadge}>
                            <Ionicons name="alert-circle" size={10} color="#fff" />
                            <Text style={styles.urgentText}>URGENT</Text>
                        </View>
                    )}
                    {isTransferRequested && (
                        <View style={styles.transferBadge}>
                            <Ionicons name="swap-horizontal" size={10} color="#92400e" />
                            <Text style={styles.transferBadgeText}>Transfer Requested</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.serviceLevel}>{assignment.service_level || '-'}</Text>
            </View>

            {/* Shipper info */}
            <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                    <Ionicons name="business-outline" size={14} color={colors.textLight} />
                    <Text style={styles.infoText} numberOfLines={1}>
                        {assignment.shipper_company || 'Unknown'}
                    </Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={14} color={colors.textLight} />
                    <Text style={styles.infoText}>{assignment.shipper_locality || '-'}</Text>
                </View>
                {assignment.shipper_contact_no ? (
                    <View style={styles.infoRow}>
                        <Ionicons name="call-outline" size={14} color={colors.textLight} />
                        <Text style={styles.infoText}>{assignment.shipper_contact_no}</Text>
                    </View>
                ) : null}
            </View>

            {/* Time + pieces */}
            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={12} color={colors.textLight} />
                    <Text style={styles.metaText}>
                        {formatTime(assignment.collection_time_from)} - {formatTime(assignment.collection_time_to)}
                    </Text>
                </View>
                <View style={styles.metaItem}>
                    <Ionicons name="cube-outline" size={12} color={colors.textLight} />
                    <Text style={styles.metaText}>{assignment.total_pieces || 0} pcs</Text>
                </View>
                <View style={styles.metaItem}>
                    <Text style={styles.statusText}>{assignment.current_status_name || '-'}</Text>
                </View>
            </View>

            {/* Message from dispatcher */}
            {assignment.message ? (
                <View style={styles.messageBox}>
                    <Ionicons name="chatbubble-outline" size={12} color="#1d4ed8" />
                    <Text style={styles.messageText}>{assignment.message}</Text>
                </View>
            ) : null}

            {/* Actions */}
            {!isTransferRequested && (
                <TouchableOpacity
                    style={styles.transferRequestBtn}
                    onPress={() => onRequestTransfer(assignment)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="swap-horizontal-outline" size={16} color={colors.primary} />
                    <Text style={styles.transferRequestText}>Request Transfer</Text>
                </TouchableOpacity>
            )}

            {isTransferRequested && assignment.transfer_reason ? (
                <View style={styles.transferReasonBox}>
                    <Text style={styles.transferReasonLabel}>Your reason:</Text>
                    <Text style={styles.transferReasonText}>"{assignment.transfer_reason}"</Text>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: layouts.borderRadius.md,
        padding: layouts.spacing.md,
        marginBottom: layouts.spacing.md,
        borderWidth: 1,
        borderColor: colors.gray200,
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    cardUrgent: {
        borderLeftColor: '#dc2626',
        backgroundColor: '#fffbfb',
    },
    cardTransferRequested: {
        borderLeftColor: '#f59e0b',
        backgroundColor: '#fffbeb',
        opacity: 0.85,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: layouts.spacing.sm,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: layouts.spacing.sm,
    },
    milesRef: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.primary,
    },
    urgentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#dc2626',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    urgentText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: 0.3,
    },
    transferBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#fef3c7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    transferBadgeText: {
        fontSize: 9,
        fontWeight: '600',
        color: '#92400e',
    },
    serviceLevel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#0369a1',
        backgroundColor: '#e0f2fe',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    infoSection: {
        marginBottom: layouts.spacing.sm,
        gap: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: 13,
        color: colors.text,
        flex: 1,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: layouts.spacing.md,
        paddingTop: layouts.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.gray100,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 11,
        color: colors.textLight,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#92400e',
        backgroundColor: '#fef3c7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 3,
    },
    messageBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginTop: layouts.spacing.sm,
        padding: layouts.spacing.sm,
        backgroundColor: '#eff6ff',
        borderRadius: layouts.borderRadius.sm,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    messageText: {
        fontSize: 12,
        color: '#1e40af',
        flex: 1,
        lineHeight: 18,
    },
    transferRequestBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: layouts.spacing.md,
        paddingVertical: layouts.spacing.sm,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: layouts.borderRadius.md,
        backgroundColor: colors.gray100,
    },
    transferRequestText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.primary,
    },
    transferReasonBox: {
        marginTop: layouts.spacing.sm,
        padding: layouts.spacing.sm,
        backgroundColor: '#fefce8',
        borderRadius: layouts.borderRadius.sm,
    },
    transferReasonLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#92400e',
        marginBottom: 2,
    },
    transferReasonText: {
        fontSize: 12,
        color: '#78350f',
        fontStyle: 'italic',
    },
});