import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { GroupedPickupAssignment } from '../../lib/pickupAssignments';

interface GroupedPickupCardProps {
    group: GroupedPickupAssignment;
    onPress: () => void;
}

const formatTime = (t: string | null | undefined): string => t ? t.substring(0, 5) : '--:--';

export default function GroupedPickupCard({ group, onPress }: GroupedPickupCardProps) {
    const first = group.assignments[0];

    return (
        <TouchableOpacity
            style={[
                styles.card,
                group.hasUrgent && styles.cardUrgent,
                group.hasTransferRequested && styles.cardTransferRequested,
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.topRow}>
                <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{group.assignments.length} Pickups</Text>
                </View>
                {group.hasUrgent && (
                    <View style={styles.urgentBadge}>
                        <Ionicons name="alert-circle" size={10} color="#fff" />
                        <Text style={styles.urgentText}>URGENT</Text>
                    </View>
                )}
                {group.hasTransferRequested && (
                    <View style={styles.transferBadge}>
                        <Ionicons name="swap-horizontal" size={10} color="#92400e" />
                        <Text style={styles.transferBadgeText}>Transfer Req</Text>
                    </View>
                )}
                <View style={{ flex: 1 }} />
                <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
            </View>

            <View style={styles.metaRow}>
                <Text style={styles.serviceLevel}>{first.service_level || '-'}</Text>
                {first.is_export && (
                    <View style={styles.exportBadge}>
                        <Text style={styles.exportBadgeText}>EXPORT</Text>
                    </View>
                )}
                <Text style={styles.timeText}>
                    <Ionicons name="time-outline" size={11} color={colors.textLight} />{' '}
                    {formatTime(first.collection_time_from)} - {formatTime(first.collection_time_to)}
                </Text>
            </View>

            <Text style={styles.companyText} numberOfLines={1}>
                {group.shipper_company || first.shipper_contact_name || 'Unknown'}
            </Text>
            <Text style={styles.localityText}>{group.shipper_locality || '-'}</Text>

            <View style={styles.refsRow}>
                {group.assignments.map(a => (
                    <Text key={a.id} style={styles.refText}>{a.miles_ref}</Text>
                ))}
            </View>

            <View style={styles.statsRow}>
                <Text style={styles.statText}>{group.totalPieces} pcs</Text>
                <Text style={styles.statDot}>·</Text>
                <Text style={styles.statText}>{group.totalWeight} kg</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#ffffff',
        borderRadius: layouts.borderRadius.md,
        marginBottom: layouts.spacing.md,
        padding: layouts.spacing.md,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
        gap: 6,
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
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    countBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 6,
    },
    countBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ffffff',
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
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
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
    exportBadge: {
        backgroundColor: '#dbeafe',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    exportBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#1d4ed8',
        letterSpacing: 0.3,
    },
    timeText: {
        fontSize: 11,
        color: colors.textLight,
    },
    companyText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#101010',
    },
    localityText: {
        fontSize: 12,
        color: '#666666',
    },
    refsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 2,
    },
    refText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.primary,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    statText: {
        fontSize: 11,
        color: colors.textLight,
    },
    statDot: {
        fontSize: 11,
        color: colors.gray400,
    },
});