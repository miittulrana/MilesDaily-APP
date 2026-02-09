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
    isAcknowledged?: boolean;
    isOptimized?: boolean;
    onViewAcknowledgement?: () => void;
}

export default function RunsheetCard({ runsheet, onPress, isAcknowledged, isOptimized, onViewAcknowledgement }: RunsheetCardProps) {
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
            case 'digital_delivery':
                return 'Digital Delivery';
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
            case 'digital_delivery':
                return colors.info;
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

    const handleViewAcknowledgement = (e: any) => {
        e.stopPropagation();
        if (onViewAcknowledgement) {
            onViewAcknowledgement();
        }
    };

    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.driverName}>{runsheet.runsheet.staff_name}</Text>
                    <View style={styles.badgesRow}>
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
                        {isOptimized && (
                            <View style={styles.optimizedBadge}>
                                <Ionicons name="navigate-circle" size={12} color={colors.info} />
                                <Text style={styles.optimizedBadgeText}>Optimized</Text>
                            </View>
                        )}
                    </View>
                </View>
                <View style={styles.headerRight}>
                    {isAcknowledged && onViewAcknowledgement && (
                        <TouchableOpacity style={styles.viewButton} onPress={handleViewAcknowledgement}>
                            <Ionicons name="document-text" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    )}
                    <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
                </View>
            </View>

            <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.textLight} />
                <Text style={styles.dateText}>
                    {formatDate(runsheet.runsheet.date_from)} - {formatDate(runsheet.runsheet.date_to)}
                </Text>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Ionicons name="cube-outline" size={18} color={colors.primary} />
                    <View style={styles.statContent}>
                        <Text style={styles.statValue}>{runsheet.runsheet.csv_data.length}</Text>
                        <Text style={styles.statLabel}>Bookings</Text>
                    </View>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statBox}>
                    <Ionicons name="layers-outline" size={18} color={colors.primary} />
                    <View style={styles.statContent}>
                        <Text style={styles.statValue}>{totalPieces}</Text>
                        <Text style={styles.statLabel}>Pieces</Text>
                    </View>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statBox}>
                    <Ionicons name="barbell-outline" size={18} color={colors.primary} />
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
                {isOptimized && (
                    <View style={styles.mapHint}>
                        <Ionicons name="map-outline" size={12} color={colors.info} />
                        <Text style={styles.mapHintText}>Route map available</Text>
                    </View>
                )}
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
        marginBottom: layouts.spacing.sm,
    },
    titleContainer: {
        flex: 1,
        gap: layouts.spacing.sm,
        marginRight: layouts.spacing.md,
    },
    driverName: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    badgesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: layouts.spacing.xs,
    },
    typeBadge: {
        paddingVertical: layouts.spacing.xs,
        paddingHorizontal: layouts.spacing.sm,
        borderRadius: layouts.borderRadius.full,
    },
    typeBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    optimizedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: layouts.spacing.xs,
        paddingHorizontal: layouts.spacing.sm,
        borderRadius: layouts.borderRadius.full,
        backgroundColor: colors.info + '20',
        gap: 4,
    },
    optimizedBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.info,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: layouts.spacing.sm,
    },
    viewButton: {
        width: 36,
        height: 36,
        borderRadius: layouts.borderRadius.md,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: layouts.spacing.xs,
        marginBottom: layouts.spacing.md,
    },
    dateText: {
        fontSize: 13,
        color: colors.textLight,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.gray100,
        borderRadius: layouts.borderRadius.md,
        paddingVertical: layouts.spacing.md,
        paddingHorizontal: layouts.spacing.lg,
    },
    statBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: layouts.spacing.sm,
    },
    statContent: {
        alignItems: 'flex-start',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    statLabel: {
        fontSize: 10,
        color: colors.textLight,
        marginTop: 1,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: colors.gray300,
        marginHorizontal: layouts.spacing.sm,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: layouts.spacing.md,
        paddingTop: layouts.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.gray200,
    },
    assignedText: {
        fontSize: 11,
        color: colors.textLight,
    },
    mapHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    mapHintText: {
        fontSize: 11,
        color: colors.info,
        fontWeight: '500',
    },
});