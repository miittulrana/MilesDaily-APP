import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl,
    TouchableOpacity, AppState, AppStateStatus
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import LoadingIndicator from '../../../components/LoadingIndicator';
import AssignedPickupCard from '../../../components/pickups/AssignedPickupCard';
import GroupedPickupCard from '../../../components/pickups/GroupedPickupCard';
import CompletedPickupCard from '../../../components/pickups/CompletedPickupCard';
import TransferRequestModal from '../../../components/pickups/TransferRequestModal';
import {
    DriverPickupAssignment,
    GroupedPickupAssignment,
    fetchDriverAssignments,
    subscribeToAssignments,
    checkPickedUpStatus,
    markAssignmentsCompleted,
    groupAssignments,
} from '../../../lib/pickupAssignments';
import { setupPickupNotificationChannel, notifyNewAssignment } from '../../../lib/pickupNotifications';
import { getDriverInfo } from '../../../lib/auth';

export default function PickupsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'assigned' | 'completed'>('assigned');
    const [assigned, setAssigned] = useState<DriverPickupAssignment[]>([]);
    const [completed, setCompleted] = useState<DriverPickupAssignment[]>([]);
    const [driverId, setDriverId] = useState<string | null>(null);

    const [transferModal, setTransferModal] = useState<{
        visible: boolean;
        assignment: DriverPickupAssignment | null;
    }>({ visible: false, assignment: null });

    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const previousAssignedCountRef = useRef(0);
    const appStateRef = useRef(AppState.currentState);

    const todayStr = new Date().toISOString().split('T')[0];

    useEffect(() => {
        setupPickupNotificationChannel();
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        const driver = await getDriverInfo();
        if (!driver?.id) {
            setLoading(false);
            return;
        }
        setDriverId(driver.id);
        await loadAssignments(driver.id);
        setLoading(false);
    };

    const loadAssignments = useCallback(async (id?: string) => {
        const did = id || driverId;
        if (!did) return;

        const result = await fetchDriverAssignments(did, todayStr);

        if (result.assigned.length > previousAssignedCountRef.current && previousAssignedCountRef.current > 0) {
            const newest = result.assigned[0];
            if (newest) {
                notifyNewAssignment(newest.miles_ref, newest.message, newest.is_urgent);
            }
        }
        previousAssignedCountRef.current = result.assigned.length;

        setAssigned(result.assigned);
        setCompleted(result.completed);
    }, [driverId, todayStr]);

    useEffect(() => {
        if (!driverId) return;

        const poll = async () => {
            const pickedUpIds = await checkPickedUpStatus(assigned);
            if (pickedUpIds.length > 0) {
                await markAssignmentsCompleted(pickedUpIds);
                await loadAssignments();
            }
        };

        pollingRef.current = setInterval(poll, 5000);

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [driverId, assigned, loadAssignments]);

    useEffect(() => {
        if (!driverId) return;

        const unsubscribe = subscribeToAssignments(
            driverId,
            () => loadAssignments(),
            () => loadAssignments()
        );

        return unsubscribe;
    }, [driverId, loadAssignments]);

    useEffect(() => {
        const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
            if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
                loadAssignments();
            }
            appStateRef.current = nextState;
        });

        return () => sub.remove();
    }, [loadAssignments]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadAssignments();
        setRefreshing(false);
    };

    const handleRequestTransfer = (assignment: DriverPickupAssignment) => {
        setTransferModal({ visible: true, assignment });
    };

    const handleTransferSuccess = () => {
        loadAssignments();
    };

    // Single pickup slide confirm -> single scan
    const handleSlideConfirm = (assignment: DriverPickupAssignment) => {
        router.push({
            pathname: '/(dashboard)/bookings/single-scan',
            params: { bookingRef: assignment.miles_ref },
        });
    };

    // Grouped pickup slide confirm -> bulk scan with pre-loaded refs
    const handleGroupSlideConfirm = (assignments: DriverPickupAssignment[]) => {
        const milesRefs = assignments.map(a => a.miles_ref).join(',');
        router.push({
            pathname: '/(dashboard)/bookings/bulk-scan',
            params: { mode: 'pickup', refs: milesRefs },
        });
    };

    // Group the assigned pickups
    const { grouped, singles } = groupAssignments(assigned);

    if (loading) {
        return <LoadingIndicator fullScreen message="Loading your pickups..." />;
    }

    return (
        <View style={styles.container}>
            {/* Tab bar */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'assigned' && styles.tabActive]}
                    onPress={() => setActiveTab('assigned')}
                >
                    <Text style={[styles.tabText, activeTab === 'assigned' && styles.tabTextActive]}>
                        Assigned
                    </Text>
                    {assigned.length > 0 && (
                        <View style={[styles.tabBadge, activeTab === 'assigned' && styles.tabBadgeActive]}>
                            <Text style={styles.tabBadgeText}>{assigned.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
                    onPress={() => setActiveTab('completed')}
                >
                    <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
                        Completed
                    </Text>
                    {completed.length > 0 && (
                        <View style={[styles.tabBadgeGreen, activeTab === 'completed' && styles.tabBadgeActive]}>
                            <Text style={styles.tabBadgeText}>{completed.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.historyBtn}
                    onPress={() => router.push('/(dashboard)/pickups/history')}
                >
                    <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentInner}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                }
            >
                {activeTab === 'assigned' ? (
                    assigned.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="cube-outline" size={48} color={colors.gray300} />
                            <Text style={styles.emptyText}>No assigned pickups for today</Text>
                            <Text style={styles.emptyHint}>Pull down to refresh</Text>
                        </View>
                    ) : (
                        <>
                            {/* Grouped pickup cards */}
                            {grouped.map(g => (
                                <GroupedPickupCard
                                    key={g.key}
                                    group={g}
                                    onRequestTransfer={handleRequestTransfer}
                                    onSlideConfirm={handleGroupSlideConfirm}
                                />
                            ))}
                            {/* Single pickup cards */}
                            {singles.map(a => (
                                <AssignedPickupCard
                                    key={a.id}
                                    assignment={a}
                                    onRequestTransfer={handleRequestTransfer}
                                    onSlideConfirm={handleSlideConfirm}
                                />
                            ))}
                        </>
                    )
                ) : (
                    completed.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="checkmark-circle-outline" size={48} color={colors.gray300} />
                            <Text style={styles.emptyText}>No completed pickups yet</Text>
                        </View>
                    ) : (
                        completed.map(a => (
                            <CompletedPickupCard key={a.id} assignment={a} />
                        ))
                    )
                )}
            </ScrollView>

            <TransferRequestModal
                visible={transferModal.visible}
                assignment={transferModal.assignment}
                onClose={() => setTransferModal({ visible: false, assignment: null })}
                onSuccess={handleTransferSuccess}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    tabBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: layouts.spacing.md,
        paddingVertical: layouts.spacing.sm,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
        gap: layouts.spacing.sm,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: layouts.spacing.sm,
        paddingHorizontal: layouts.spacing.md,
        borderRadius: layouts.borderRadius.md,
        backgroundColor: colors.gray100,
    },
    tabActive: {
        backgroundColor: colors.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textLight,
    },
    tabTextActive: {
        color: '#ffffff',
    },
    tabBadge: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 10,
        backgroundColor: colors.primary,
    },
    tabBadgeGreen: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 10,
        backgroundColor: colors.success,
    },
    tabBadgeActive: {
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    tabBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#ffffff',
    },
    historyBtn: {
        marginLeft: 'auto',
        padding: layouts.spacing.sm,
        borderRadius: layouts.borderRadius.md,
        backgroundColor: colors.gray100,
    },
    content: {
        flex: 1,
    },
    contentInner: {
        padding: layouts.spacing.md,
        paddingBottom: layouts.spacing.xl,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: layouts.spacing.xxxl,
        gap: layouts.spacing.sm,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.textLight,
    },
    emptyHint: {
        fontSize: 13,
        color: colors.gray400,
    },
});