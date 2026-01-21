import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { AssignedRunsheet } from '../../utils/runsheetTypes';
import { formatDate } from '../../utils/dateUtils';

interface RunsheetCardProps {
    runsheet: AssignedRunsheet;
    onPress: () => void;
}

export default function RunsheetCard({ runsheet, onPress }: RunsheetCardProps) {
    const getReportTypeLabel = (type: string, subtype?: string | null) => {
        switch (type) {
            case 'delivery':
                return 'With Delivery Courier';
            case 'processed':
                return 'Processed';
            case 'end_of_day':
                return 'End of Day Report';
            case 'sub_contractor':
                return `Sub-Contractor ${subtype === 'morning' ? '(Morning)' : '(Afternoon)'}`;
            default:
                return 'Run-Sheet';
        }
    };

    const getReportTypeColor = (type: string) => {
        switch (type) {
            case 'delivery':
                return colors.success;
            case 'processed':
                return colors.info;
            case 'end_of_day':
                return colors.warning;
            case 'sub_contractor':
                return colors.primary;
            default:
                return colors.gray500;
        }
    };

    const totalPieces = runsheet.runsheet.csv_data.reduce(
        (sum, booking) => sum + parseInt(booking.total_pieces || '0'),
        0
    );

    const totalWeight = runsheet.runsheet.csv_data.reduce(
        (sum, booking) => sum + parseFloat(booking.total_weight || '0'),
        0
    );

    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.driverName}>{runsheet.runsheet.staff_name}</Text>
                    <View
                        style={[
                            styles.typeBadge,
                            { backgroundColor: getReportTypeColor(runsheet.runsheet.report_type) + '20' },
                        ]}
                    >
                        <Text
                            style={[
                                styles.typeBadgeText,
                                { color: getReportTypeColor(runsheet.runsheet.report_type) },
                            ]}
                        >
                            {getReportTypeLabel(runsheet.runsheet.report_type, runsheet.runsheet.report_subtype)}
                        </Text>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
            </View>

            <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                    <Ionicons name="calendar-outline" size={16} color={colors.textLight} />
                    <Text style={styles.infoText}>
                        {formatDate(runsheet.runsheet.date_from)} - {formatDate(runsheet.runsheet.date_to)}
                    </Text>
                </View>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Ionicons name="cube-outline" size={20} color={colors.primary} />
                    <View style={styles.statContent}>
                        <Text style={styles.statValue}>{runsheet.runsheet.csv_data.length}</Text>
                        <Text style={styles.statLabel}>Bookings</Text>
                    </View>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statBox}>
                    <Ionicons name="layers-outline" size={20} color={colors.primary} />
                    <View style={styles.statContent}>
                        <Text style={styles.statValue}>{totalPieces}</Text>
                        <Text style={styles.statLabel}>Pieces</Text>
                    </View>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statBox}>
                    <Ionicons name="barbell-outline" size={20} color={colors.primary} />
                    <View style={styles.statContent}>
                        <Text style={styles.statValue}>{totalWeight.toFixed(1)}</Text>
                        <Text style={styles.statLabel}>Kg</Text>
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.assignedText}>
                    Assigned {formatDate(runsheet.assigned_at)}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.card,
        borderRadius: layouts.borderRadius.lg,
        padding: layouts.spacing.lg,
        marginBottom: layouts.spacing.md,
        borderWidth: 1,
        borderColor: colors.gray200,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: layouts.spacing.md,
    },
    titleContainer: {
        flex: 1,
        gap: layouts.spacing.sm,
    },
    driverName: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    typeBadge: {
        alignSelf: 'flex-start',
        paddingVertical: layouts.spacing.xs,
        paddingHorizontal: layouts.spacing.sm,
        borderRadius: layouts.borderRadius.full,
    },
    typeBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    infoRow: {
        marginBottom: layouts.spacing.md,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: layouts.spacing.sm,
    },
    infoText: {
        fontSize: 13,
        color: colors.textLight,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: colors.gray100,
        borderRadius: layouts.borderRadius.md,
        padding: layouts.spacing.md,
        marginBottom: layouts.spacing.md,
    },
    statBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: layouts.spacing.sm,
    },
    statContent: {
        flex: 1,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    statLabel: {
        fontSize: 11,
        color: colors.textLight,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: colors.gray300,
        marginHorizontal: layouts.spacing.sm,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: colors.gray200,
        paddingTop: layouts.spacing.sm,
    },
    assignedText: {
        fontSize: 12,
        color: colors.textLight,
        fontStyle: 'italic',
    },
});