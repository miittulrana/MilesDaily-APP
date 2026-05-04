import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Linking, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { DriverPickupAssignment, PickupItem } from '../../../lib/pickupAssignments';
import { supabaseQuery } from '../../../lib/supabase';
import SlideToConfirm from '../../../components/pickups/SlideToConfirm';
import TransferRequestModal from '../../../components/pickups/TransferRequestModal';

const formatTime = (t: string | null | undefined): string => t ? t.substring(0, 5) : '--:--';

const formatDimensions = (item: PickupItem): string => {
    if (item.length && item.width && item.height) {
        return `${item.length} x ${item.width} x ${item.height}`;
    }
    return '-';
};

export default function GroupedPickupDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const idsParam = params.ids as string;

    const [assignments, setAssignments] = useState<DriverPickupAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [transferModal, setTransferModal] = useState<{
        visible: boolean;
        assignment: DriverPickupAssignment | null;
    }>({ visible: false, assignment: null });
    const slideTriggered = useRef(false);

    useEffect(() => {
        loadAssignments();
    }, [idsParam]);

    useFocusEffect(
        useCallback(() => {
            if (slideTriggered.current) {
                slideTriggered.current = false;
                router.back();
            }
        }, [])
    );

    const loadAssignments = async () => {
        if (!idsParam) {
            setLoading(false);
            return;
        }

        const ids = idsParam.split(',').filter(Boolean);

        try {
            const { data, error } = await supabaseQuery<any[]>(async (client) => {
                return await client
                    .from('pickup_assignments')
                    .select('*')
                    .in('id', ids)
                    .order('created_at', { ascending: true });
            });

            if (error || !data || data.length === 0) {
                Alert.alert('Error', 'Assignments not found');
                router.back();
                return;
            }

            setAssignments(data.map((d: any) => ({
                ...d,
                items: Array.isArray(d.items) ? d.items : [],
            })));
        } catch (err) {
            console.error('Error loading grouped assignments:', err);
            Alert.alert('Error', 'Failed to load assignments');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleCall = (number: string) => {
        const cleaned = number.replace(/\s/g, '');
        Linking.openURL(`tel:${cleaned}`).catch(() => {
            Alert.alert('Error', 'Failed to open phone dialer');
        });
    };

    const handleNavigate = () => {
        if (assignments.length === 0) return;
        const first = assignments[0];
        const address = [
            first.shipper_address_1,
            first.shipper_locality,
            first.shipper_post_code,
            'Malta',
        ].filter(Boolean).join(', ');

        const encoded = encodeURIComponent(address);
        const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=driving`;
        const wazeUrl = `waze://?q=${encoded}&navigate=yes`;

        Alert.alert('Navigate with', 'Choose your preferred navigation app', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Waze',
                onPress: async () => {
                    const canOpen = await Linking.canOpenURL(wazeUrl);
                    if (canOpen) {
                        Linking.openURL(wazeUrl);
                    } else {
                        Linking.openURL(googleUrl);
                    }
                },
            },
            { text: 'Google Maps', onPress: () => Linking.openURL(googleUrl) },
        ]);
    };

    const handleSlideConfirm = () => {
        slideTriggered.current = true;
        const milesRefs = assignments.map(a => a.miles_ref).join(',');
        router.push({
            pathname: '/(dashboard)/bookings/bulk-scan',
            params: { mode: 'pickup', refs: milesRefs },
        });
    };

    const handleTransferSuccess = () => {
        loadAssignments();
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingState}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (assignments.length === 0) return null;

    const first = assignments[0];
    const isExport = first.is_export;
    const hasUrgent = assignments.some(a => a.is_urgent);
    const hasTransferRequested = assignments.some(a => a.status === 'transfer_requested');
    const allTransferRequested = assignments.every(a => a.status === 'transfer_requested');
    const totalPieces = assignments.reduce((s, a) => s + (a.total_pieces || 0), 0);
    const totalWeight = assignments.reduce((s, a) => s + (a.total_weight || 0), 0);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{first.shipper_company || 'Pickup Group'}</Text>
                    <Text style={styles.headerSub}>{assignments.length} Pickups · {first.service_level}</Text>
                </View>
                <TouchableOpacity style={styles.navBtn} onPress={handleNavigate}>
                    <Ionicons name="navigate" size={20} color={colors.info} />
                </TouchableOpacity>
            </View>

            {/* Badges */}
            <View style={styles.badgesRow}>
                <View style={styles.countChip}>
                    <Ionicons name="layers" size={12} color="#fff" />
                    <Text style={styles.countChipText}>{assignments.length} Pickups</Text>
                </View>
                {hasUrgent && (
                    <View style={styles.urgentChip}>
                        <Ionicons name="alert-circle" size={12} color="#fff" />
                        <Text style={styles.urgentChipText}>URGENT</Text>
                    </View>
                )}
                {isExport && (
                    <View style={styles.exportChip}>
                        <Ionicons name="globe-outline" size={12} color="#1d4ed8" />
                        <Text style={styles.exportChipText}>EXPORT</Text>
                    </View>
                )}
                {hasTransferRequested && (
                    <View style={styles.transferChip}>
                        <Ionicons name="swap-horizontal" size={12} color="#92400e" />
                        <Text style={styles.transferChipText}>Transfer Requested</Text>
                    </View>
                )}
                <View style={styles.serviceLevelChip}>
                    <Text style={styles.serviceLevelChipText}>{first.service_level || '-'}</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* All Booking References */}
                <View style={styles.refsCard}>
                    <View style={styles.refsHeader}>
                        <Ionicons name="documents-outline" size={16} color="#c2410c" />
                        <Text style={styles.refsTitle}>Booking References</Text>
                    </View>
                    <View style={styles.refsGrid}>
                        {assignments.map(a => (
                            <View key={a.id} style={styles.refItem}>
                                <Text style={styles.refItemText}>{a.miles_ref}</Text>
                                {a.is_urgent && (
                                    <View style={styles.refUrgentDot}>
                                        <Text style={styles.refUrgentDotText}>!</Text>
                                    </View>
                                )}
                                {a.status === 'transfer_requested' && (
                                    <Ionicons name="swap-horizontal" size={10} color="#92400e" />
                                )}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Special Instructions */}
                {first.special_instruction ? (
                    <View style={styles.specialBox}>
                        <View style={styles.specialHeader}>
                            <Ionicons name="warning-outline" size={16} color="#92400e" />
                            <Text style={styles.specialTitle}>Special Instructions</Text>
                        </View>
                        <Text style={styles.specialText}>{first.special_instruction}</Text>
                    </View>
                ) : null}

                {/* Dispatcher Message */}
                {first.message ? (
                    <View style={styles.messageBox}>
                        <View style={styles.messageHeader}>
                            <Ionicons name="chatbubble-outline" size={14} color="#1d4ed8" />
                            <Text style={styles.messageLabel}>Note from dispatcher</Text>
                        </View>
                        <Text style={styles.messageText}>{first.message}</Text>
                    </View>
                ) : null}

                {/* Collection Details */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                        <Text style={styles.cardTitle}>Collection Details</Text>
                    </View>
                    <View style={styles.cardBody}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Date</Text>
                            <Text style={styles.detailValue}>
                                {first.collection_date
                                    ? new Date(first.collection_date + 'T00:00:00').toLocaleDateString('en-GB', {
                                        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
                                    })
                                    : '-'}
                            </Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Time Window</Text>
                            <Text style={styles.detailValueMono}>
                                {formatTime(first.collection_time_from)} - {formatTime(first.collection_time_to)}
                            </Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Total Pieces</Text>
                            <Text style={styles.detailValue}>{totalPieces}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Total Weight</Text>
                            <Text style={styles.detailValue}>{totalWeight} kg</Text>
                        </View>
                    </View>
                </View>

                {/* Shipper */}
                <View style={styles.card}>
                    <View style={[styles.cardHeader, { backgroundColor: '#fff7ed' }]}>
                        <Ionicons name="business-outline" size={16} color={colors.primary} />
                        <Text style={styles.cardTitle}>Shipper (Collection Address)</Text>
                    </View>
                    <View style={styles.cardBody}>
                        <Text style={styles.addressName}>
                            {first.shipper_company || first.shipper_contact_name || '-'}
                        </Text>
                        {first.shipper_contact_name && first.shipper_company ? (
                            <Text style={styles.addressLine}>{first.shipper_contact_name}</Text>
                        ) : null}
                        {first.shipper_address_1 ? (
                            <Text style={styles.addressLine}>{first.shipper_address_1}</Text>
                        ) : null}
                        {first.shipper_address_2 ? (
                            <Text style={styles.addressLine}>{first.shipper_address_2}</Text>
                        ) : null}
                        <Text style={styles.addressLine}>
                            {first.shipper_locality} {first.shipper_post_code}
                        </Text>
                        {first.shipper_country ? (
                            <Text style={styles.addressLineLight}>{first.shipper_country}</Text>
                        ) : null}
                        {first.shipper_contact_no ? (
                            <TouchableOpacity
                                style={styles.actionRow}
                                onPress={() => handleCall(first.shipper_contact_no)}
                            >
                                <View style={styles.actionIcon}>
                                    <Ionicons name="call" size={16} color="#fff" />
                                </View>
                                <Text style={styles.actionText}>{first.shipper_contact_no}</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>

                {/* Per-booking breakdown */}
                <View style={styles.card}>
                    <View style={[styles.cardHeader, { backgroundColor: '#f8fafc' }]}>
                        <Ionicons name="cube-outline" size={16} color={colors.text} />
                        <Text style={styles.cardTitle}>Items per Booking</Text>
                        <View style={styles.itemCountChip}>
                            <Text style={styles.itemCountText}>{assignments.length}</Text>
                        </View>
                    </View>
                    {assignments.map((a, aIdx) => {
                        const items = a.items || [];
                        return (
                            <View key={a.id}>
                                {/* Booking sub-header */}
                                <View style={[styles.bookingSubHeader, aIdx > 0 && styles.bookingSubHeaderBorder]}>
                                    <Text style={styles.bookingSubRef}>{a.miles_ref}</Text>
                                    <Text style={styles.bookingSubMeta}>
                                        {a.total_pieces || 0} pcs · {a.total_weight || 0} kg
                                    </Text>
                                    {a.is_urgent && (
                                        <View style={styles.tinyUrgent}>
                                            <Text style={styles.tinyUrgentText}>URGENT</Text>
                                        </View>
                                    )}
                                </View>
                                {/* Items table */}
                                {items.length > 0 ? (
                                    <View style={styles.itemsContainer}>
                                        <View style={styles.tableHeader}>
                                            <Text style={[styles.tableCell, styles.cellDesc, styles.tableHeaderText]}>Description</Text>
                                            <Text style={[styles.tableCell, styles.cellNum, styles.tableHeaderText]}>Pcs</Text>
                                            <Text style={[styles.tableCell, styles.cellNum, styles.tableHeaderText]}>Weight</Text>
                                            <Text style={[styles.tableCell, styles.cellDim, styles.tableHeaderText]}>Dimensions</Text>
                                        </View>
                                        {items.map((item, idx) => (
                                            <View key={idx} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                                                <Text style={[styles.tableCell, styles.cellDesc]} numberOfLines={2}>
                                                    {item.description || '-'}
                                                </Text>
                                                <Text style={[styles.tableCell, styles.cellNum]}>{item.pieces || '-'}</Text>
                                                <Text style={[styles.tableCell, styles.cellNum]}>
                                                    {item.weight ? `${item.weight} kg` : '-'}
                                                </Text>
                                                <Text style={[styles.tableCell, styles.cellDim]}>
                                                    {formatDimensions(item)}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                ) : (
                                    <View style={styles.noItemsRow}>
                                        <Text style={styles.noItemsText}>
                                            {a.total_pieces || 0} pcs · {a.total_weight || 0} kg
                                        </Text>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                    {/* Grand totals */}
                    <View style={styles.grandTotals}>
                        <Text style={styles.grandTotalText}>Total Pieces: {totalPieces}</Text>
                        <Text style={styles.grandTotalText}>Total Weight: {totalWeight} kg</Text>
                    </View>
                </View>

                {/* Transfer request per booking */}
                {assignments.filter(a => a.status === 'transfer_requested' && a.transfer_reason).map(a => (
                    <View key={a.id} style={styles.transferReasonCard}>
                        <Text style={styles.transferReasonLabel}>{a.miles_ref} transfer reason:</Text>
                        <Text style={styles.transferReasonText}>"{a.transfer_reason}"</Text>
                    </View>
                ))}

                {/* Request Transfer */}
                {!allTransferRequested && (
                    <TouchableOpacity
                        style={styles.transferBtn}
                        onPress={() => {
                            const firstAssignable = assignments.find(a => a.status !== 'transfer_requested');
                            if (firstAssignable) {
                                setTransferModal({ visible: true, assignment: firstAssignable });
                            }
                        }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="swap-horizontal-outline" size={18} color={colors.primary} />
                        <Text style={styles.transferBtnText}>Request Transfer</Text>
                    </TouchableOpacity>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Sticky Slide */}
            {!allTransferRequested && (
                <View style={styles.stickyBottom}>
                    <SlideToConfirm
                        label={`Arrived (${assignments.length} Pickups)`}
                        onConfirm={handleSlideConfirm}
                    />
                </View>
            )}

            <TransferRequestModal
                visible={transferModal.visible}
                assignment={transferModal.assignment}
                onClose={() => setTransferModal({ visible: false, assignment: null })}
                onSuccess={handleTransferSuccess}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fb',
    },
    loadingState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: layouts.spacing.md,
        paddingVertical: 14,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
        gap: layouts.spacing.sm,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.gray100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.text,
    },
    headerSub: {
        fontSize: 12,
        color: colors.textLight,
        marginTop: 1,
    },
    navBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        paddingHorizontal: layouts.spacing.md,
        paddingVertical: 10,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    countChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    countChipText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
    },
    urgentChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#dc2626',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    urgentChipText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.3,
    },
    exportChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#dbeafe',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    exportChipText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1d4ed8',
    },
    transferChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#fef3c7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    transferChipText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#92400e',
    },
    serviceLevelChip: {
        backgroundColor: '#e0f2fe',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    serviceLevelChipText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#0369a1',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: layouts.spacing.md,
        gap: layouts.spacing.md,
    },
    refsCard: {
        backgroundColor: '#fff7ed',
        borderRadius: layouts.borderRadius.md,
        borderWidth: 1,
        borderColor: '#fed7aa',
        overflow: 'hidden',
    },
    refsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#ffedd5',
    },
    refsTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#c2410c',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    refsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        padding: 12,
    },
    refItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#fdba74',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    refItemText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
    },
    refUrgentDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#dc2626',
        alignItems: 'center',
        justifyContent: 'center',
    },
    refUrgentDotText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#fff',
    },
    specialBox: {
        backgroundColor: '#fffbeb',
        borderRadius: layouts.borderRadius.md,
        borderWidth: 1,
        borderColor: '#fbbf24',
        overflow: 'hidden',
    },
    specialHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#fef3c7',
    },
    specialTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#92400e',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    specialText: {
        fontSize: 13,
        color: '#78350f',
        lineHeight: 20,
        padding: 12,
    },
    messageBox: {
        backgroundColor: '#eff6ff',
        borderRadius: layouts.borderRadius.md,
        borderWidth: 1,
        borderColor: '#bfdbfe',
        overflow: 'hidden',
    },
    messageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#dbeafe',
    },
    messageLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1d4ed8',
    },
    messageText: {
        fontSize: 13,
        color: '#1e40af',
        lineHeight: 20,
        padding: 12,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: layouts.borderRadius.md,
        borderWidth: 1,
        borderColor: colors.gray200,
        overflow: 'hidden',
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: colors.gray100,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.text,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        flex: 1,
    },
    cardBody: {
        padding: 14,
        gap: 2,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    detailLabel: {
        fontSize: 13,
        color: colors.textLight,
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    detailValueMono: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    divider: {
        height: 1,
        backgroundColor: colors.gray100,
    },
    addressName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    addressLine: {
        fontSize: 14,
        color: colors.text,
        lineHeight: 22,
    },
    addressLineLight: {
        fontSize: 13,
        color: colors.textLight,
        lineHeight: 20,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: colors.gray100,
    },
    actionIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.success,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.success,
    },
    itemCountChip: {
        backgroundColor: colors.primary,
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemCountText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
    },
    bookingSubHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: '#fff7ed',
    },
    bookingSubHeaderBorder: {
        borderTopWidth: 1,
        borderTopColor: colors.gray200,
    },
    bookingSubRef: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
    },
    bookingSubMeta: {
        fontSize: 12,
        color: colors.textLight,
        flex: 1,
    },
    tinyUrgent: {
        backgroundColor: '#fee2e2',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    tinyUrgentText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#dc2626',
    },
    itemsContainer: {},
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: colors.gray100,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    tableHeaderText: {
        fontWeight: '700',
        fontSize: 11,
        color: colors.textLight,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray100,
    },
    tableRowAlt: {
        backgroundColor: '#fafbfc',
    },
    tableCell: {
        fontSize: 13,
        color: colors.text,
    },
    cellDesc: {
        flex: 3,
        paddingRight: 8,
    },
    cellNum: {
        flex: 1,
        textAlign: 'center',
    },
    cellDim: {
        flex: 2,
        textAlign: 'right',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 11,
        color: colors.textLight,
    },
    noItemsRow: {
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    noItemsText: {
        fontSize: 12,
        color: colors.textLight,
    },
    grandTotals: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: colors.gray100,
        borderTopWidth: 1,
        borderTopColor: colors.gray200,
    },
    grandTotalText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.text,
    },
    transferReasonCard: {
        backgroundColor: '#fefce8',
        borderRadius: layouts.borderRadius.md,
        padding: 14,
        borderWidth: 1,
        borderColor: '#fde68a',
    },
    transferReasonLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#92400e',
        marginBottom: 4,
    },
    transferReasonText: {
        fontSize: 13,
        color: '#78350f',
        fontStyle: 'italic',
        lineHeight: 20,
    },
    transferBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: layouts.borderRadius.md,
        backgroundColor: colors.card,
    },
    transferBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
    },
    stickyBottom: {
        paddingHorizontal: layouts.spacing.md,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 8 : 16,
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.gray200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 8,
    },
});