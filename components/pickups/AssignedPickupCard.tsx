import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { DriverPickupAssignment } from '../../lib/pickupAssignments';

interface AssignedPickupCardProps {
    assignment: DriverPickupAssignment;
    onPress: (assignment: DriverPickupAssignment) => void;
}

export default function AssignedPickupCard({ assignment, onPress }: AssignedPickupCardProps) {
    const isTransferRequested = assignment.status === 'transfer_requested';

    return (
        <TouchableOpacity
            style={[
                styles.card,
                assignment.is_urgent && styles.cardUrgent,
                isTransferRequested && styles.cardTransfer,
            ]}
            onPress={() => onPress(assignment)}
            activeOpacity={0.7}
        >
            {/* Top: Ref + Urgent + Service Level */}
            <View style={styles.topRow}>
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
                        <Text style={styles.transferText}>Transfer Req</Text>
                    </View>
                )}
                {assignment.is_export && (
                    <View style={styles.exportBadge}>
                        <Text style={styles.exportText}>EXPORT</Text>
                    </View>
                )}
                <View style={styles.spacer} />
                <Text style={styles.serviceLevel}>{assignment.service_level || '-'}</Text>
            </View>

            {/* Middle: Company / City */}
            <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                    <Ionicons name="business-outline" size={14} color={colors.textLight} />
                    <Text style={styles.companyText} numberOfLines={1}>
                        {assignment.shipper_company || assignment.shipper_contact_name || 'Unknown'}
                    </Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={14} color={colors.textLight} />
                    <Text style={styles.localityText}>{assignment.shipper_locality || '-'}</Text>
                </View>
            </View>

            {/* Bottom: Notes + Chevron */}
            <View style={styles.bottomRow}>
                {assignment.message ? (
                    <View style={styles.noteRow}>
                        <Ionicons name="chatbubble-outline" size={11} color="#1d4ed8" />
                        <Text style={styles.noteText} numberOfLines={1}>{assignment.message}</Text>
                    </View>
                ) : (
                    <View style={styles.spacer} />
                )}
                <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
            </View>
        </TouchableOpacity>
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
    cardTransfer: {
        borderLeftColor: '#f59e0b',
        backgroundColor: '#fffbeb',
        opacity: 0.85,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
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
    transferText: {
        fontSize: 9,
        fontWeight: '600',
        color: '#92400e',
    },
    exportBadge: {
        backgroundColor: '#dbeafe',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    exportText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#1d4ed8',
        letterSpacing: 0.3,
    },
    spacer: {
        flex: 1,
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
        gap: 4,
        marginBottom: 6,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    companyText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
        flex: 1,
    },
    localityText: {
        fontSize: 13,
        color: colors.textLight,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: colors.gray100,
    },
    noteRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    noteText: {
        fontSize: 12,
        color: '#1d4ed8',
        flex: 1,
    },
});