import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { DriverPickupAssignment } from '../../lib/pickupAssignments';

interface CompletedPickupCardProps {
    assignment: DriverPickupAssignment;
}

const formatTime = (t: string | null | undefined): string => t ? t.substring(0, 5) : '--:--';

export default function CompletedPickupCard({ assignment }: CompletedPickupCardProps) {
    const completedTime = assignment.completed_at
        ? new Date(assignment.completed_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : '-';

    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    <Text style={styles.milesRef}>{assignment.miles_ref}</Text>
                </View>
                <Text style={styles.completedTime}>Picked up at {completedTime}</Text>
            </View>

            <View style={styles.infoRow}>
                <Ionicons name="business-outline" size={13} color={colors.textLight} />
                <Text style={styles.infoText} numberOfLines={1}>{assignment.shipper_company || 'Unknown'}</Text>
                <Text style={styles.locality}>{assignment.shipper_locality || '-'}</Text>
            </View>

            <View style={styles.metaRow}>
                <Text style={styles.serviceLevel}>{assignment.service_level || '-'}</Text>
                <Text style={styles.pieces}>{assignment.total_pieces || 0} pcs</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#f0fdf4',
        borderRadius: layouts.borderRadius.md,
        padding: layouts.spacing.md,
        marginBottom: layouts.spacing.sm,
        borderWidth: 1,
        borderColor: '#bbf7d0',
        borderLeftWidth: 3,
        borderLeftColor: colors.success,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: layouts.spacing.xs,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    milesRef: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.success,
    },
    completedTime: {
        fontSize: 11,
        color: colors.textLight,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        color: colors.text,
        flex: 1,
    },
    locality: {
        fontSize: 11,
        color: colors.textLight,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: layouts.spacing.md,
    },
    serviceLevel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#0369a1',
        backgroundColor: '#e0f2fe',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 3,
    },
    pieces: {
        fontSize: 11,
        color: colors.textLight,
    },
});