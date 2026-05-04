import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import CompletedPickupCard from '../../../components/pickups/CompletedPickupCard';
import { DriverPickupAssignment, fetchAssignmentHistory } from '../../../lib/pickupAssignments';
import { getDriverInfo } from '../../../lib/auth';

export default function PickupsHistoryScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [assignments, setAssignments] = useState<DriverPickupAssignment[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    // Date range
    const [dateFrom, setDateFrom] = useState(() => new Date());

    const [dateTo, setDateTo] = useState(new Date());

    // Date picker visibility (Android needs modal)
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const formatDisplay = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const handleSearch = useCallback(async () => {
        setLoading(true);
        setHasSearched(true);

        const driver = await getDriverInfo();
        if (!driver?.id) {
            setLoading(false);
            return;
        }

        const data = await fetchAssignmentHistory(driver.id, formatDate(dateFrom), formatDate(dateTo));
        setAssignments(data);
        setLoading(false);
    }, [dateFrom, dateTo]);

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'assigned': return { text: 'Assigned', color: '#2563eb', bg: '#dbeafe' };
            case 'completed': return { text: 'Completed', color: '#16a34a', bg: '#dcfce7' };
            case 'transfer_requested': return { text: 'Transfer Req', color: '#d97706', bg: '#fef3c7' };
            case 'transferred': return { text: 'Transferred', color: '#7c3aed', bg: '#ede9fe' };
            case 'cancelled': return { text: 'Cancelled', color: '#6b7280', bg: '#f3f4f6' };
            default: return { text: status, color: '#64748b', bg: '#f1f5f9' };
        }
    };

    // Group by date
    const groupedByDate = assignments.reduce<Record<string, DriverPickupAssignment[]>>((acc, a) => {
        const date = a.pickup_date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(a);
        return acc;
    }, {});

    const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pickup History</Text>
            </View>

            {/* Date range filter */}
            <View style={styles.filterRow}>
                <TouchableOpacity
                    style={styles.dateBtn}
                    onPress={() => setShowFromPicker(true)}
                >
                    <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                    <Text style={styles.dateText}>{formatDisplay(dateFrom)}</Text>
                </TouchableOpacity>

                <Text style={styles.dateSeparator}>to</Text>

                <TouchableOpacity
                    style={styles.dateBtn}
                    onPress={() => setShowToPicker(true)}
                >
                    <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                    <Text style={styles.dateText}>{formatDisplay(dateTo)}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.searchBtn, loading && styles.searchBtnDisabled]}
                    onPress={handleSearch}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons name="search" size={18} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>

            {/* Date pickers (Android shows as modal) */}
            {showFromPicker && (
                <DateTimePicker
                    value={dateFrom}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_, d) => {
                        setShowFromPicker(Platform.OS === 'ios');
                        if (d) setDateFrom(d);
                    }}
                    maximumDate={dateTo}
                />
            )}
            {showToPicker && (
                <DateTimePicker
                    value={dateTo}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_, d) => {
                        setShowToPicker(Platform.OS === 'ios');
                        if (d) setDateTo(d);
                    }}
                    minimumDate={dateFrom}
                    maximumDate={new Date()}
                />
            )}

            {/* Results */}
            <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
                {loading ? (
                    <View style={styles.emptyState}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.emptyText}>Loading history...</Text>
                    </View>
                ) : !hasSearched ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={48} color={colors.gray300} />
                        <Text style={styles.emptyText}>Select dates and search</Text>
                    </View>
                ) : assignments.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="cube-outline" size={48} color={colors.gray300} />
                        <Text style={styles.emptyText}>No pickups found for this period</Text>
                    </View>
                ) : (
                    sortedDates.map(date => (
                        <View key={date} style={styles.dateGroup}>
                            <View style={styles.dateGroupHeader}>
                                <Text style={styles.dateGroupTitle}>
                                    {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', {
                                        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
                                    })}
                                </Text>
                                <Text style={styles.dateGroupCount}>{groupedByDate[date].length}</Text>
                            </View>
                            {groupedByDate[date].map(assignment => {
                                const statusInfo = getStatusLabel(assignment.status);
                                return (
                                    <View key={assignment.id} style={styles.historyCard}>
                                        <View style={styles.historyTop}>
                                            <Text style={styles.historyRef}>{assignment.miles_ref}</Text>
                                            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                                                <Text style={[styles.statusText, { color: statusInfo.color }]}>
                                                    {statusInfo.text}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.historyInfo}>
                                            <Text style={styles.historyCompany} numberOfLines={1}>
                                                {assignment.shipper_company || 'Unknown'}
                                            </Text>
                                            <Text style={styles.historyLocality}>
                                                {assignment.shipper_locality || '-'}
                                            </Text>
                                        </View>
                                        <View style={styles.historyMeta}>
                                            <Text style={styles.historyService}>{assignment.service_level || '-'}</Text>
                                            <Text style={styles.historyPieces}>{assignment.total_pieces || 0} pcs</Text>
                                            {assignment.is_urgent && (
                                                <View style={styles.urgentBadge}>
                                                    <Text style={styles.urgentText}>URGENT</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: layouts.spacing.md,
        paddingHorizontal: layouts.spacing.md,
        paddingVertical: layouts.spacing.md,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    backBtn: {
        padding: layouts.spacing.xs,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: layouts.spacing.sm,
        paddingHorizontal: layouts.spacing.md,
        paddingVertical: layouts.spacing.md,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    dateBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: layouts.spacing.sm,
        paddingHorizontal: layouts.spacing.md,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: layouts.borderRadius.md,
        backgroundColor: colors.gray100,
    },
    dateText: {
        fontSize: 13,
        color: colors.text,
        fontWeight: '500',
    },
    dateSeparator: {
        fontSize: 13,
        color: colors.textLight,
    },
    searchBtn: {
        width: 44,
        height: 44,
        borderRadius: layouts.borderRadius.md,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchBtnDisabled: {
        opacity: 0.6,
    },
    content: {
        flex: 1,
    },
    contentInner: {
        padding: layouts.spacing.md,
        paddingBottom: layouts.spacing.xxxl,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: layouts.spacing.xxxl,
        gap: layouts.spacing.sm,
    },
    emptyText: {
        fontSize: 15,
        color: colors.textLight,
    },
    dateGroup: {
        marginBottom: layouts.spacing.lg,
    },
    dateGroupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: layouts.spacing.sm,
        paddingBottom: layouts.spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    dateGroupTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
    },
    dateGroupCount: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textLight,
        backgroundColor: colors.gray200,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    historyCard: {
        backgroundColor: colors.card,
        borderRadius: layouts.borderRadius.md,
        padding: layouts.spacing.md,
        marginBottom: layouts.spacing.sm,
        borderWidth: 1,
        borderColor: colors.gray200,
    },
    historyTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    historyRef: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    historyInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: layouts.spacing.sm,
        marginBottom: 4,
    },
    historyCompany: {
        fontSize: 13,
        color: colors.text,
        flex: 1,
    },
    historyLocality: {
        fontSize: 12,
        color: colors.textLight,
    },
    historyMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: layouts.spacing.md,
    },
    historyService: {
        fontSize: 10,
        fontWeight: '600',
        color: '#0369a1',
        backgroundColor: '#e0f2fe',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 3,
    },
    historyPieces: {
        fontSize: 11,
        color: colors.textLight,
    },
    urgentBadge: {
        backgroundColor: '#fee2e2',
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 3,
    },
    urgentText: {
        fontSize: 8,
        fontWeight: '700',
        color: '#dc2626',
        letterSpacing: 0.3,
    },
});