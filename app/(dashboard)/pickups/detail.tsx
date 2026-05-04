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

export default function PickupDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const assignmentId = params.id as string;

    const [assignment, setAssignment] = useState<DriverPickupAssignment | null>(null);
    const [loading, setLoading] = useState(true);
    const [transferModal, setTransferModal] = useState(false);
    const slideTriggered = useRef(false);

    useEffect(() => {
        loadAssignment();
    }, [assignmentId]);

    // When screen regains focus after slide was triggered (driver updated a status),
    // navigate back to pickups list. The 5-second polling will detect status 29 (PICKED UP)
    // and move the assignment to completed only when the booking is actually picked up.
    useFocusEffect(
        useCallback(() => {
            if (slideTriggered.current) {
                slideTriggered.current = false;
                router.back();
            }
        }, [])
    );

    const loadAssignment = async () => {
        if (!assignmentId) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabaseQuery<any>(async (client) => {
                return await client
                    .from('pickup_assignments')
                    .select('*')
                    .eq('id', assignmentId)
                    .single();
            });

            if (error || !data) {
                Alert.alert('Error', 'Assignment not found');
                router.back();
                return;
            }

            setAssignment({
                ...data,
                items: Array.isArray(data.items) ? data.items : [],
            });
        } catch (err) {
            console.error('Error loading assignment:', err);
            Alert.alert('Error', 'Failed to load assignment');
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
        if (!assignment) return;
        const address = [
            assignment.shipper_address_1,
            assignment.shipper_locality,
            assignment.shipper_post_code,
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
        if (!assignment) return;
        slideTriggered.current = true;
        router.push({
            pathname: '/(dashboard)/bookings/single-scan',
            params: { bookingRef: assignment.miles_ref },
        });
    };

    const handleTransferSuccess = () => {
        loadAssignment();
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

    if (!assignment) return null;

    const isTransferRequested = assignment.status === 'transfer_requested';
    const isExport = assignment.is_export;
    const isSameDayOrDedicated = assignment.service_level_id === 5 || assignment.service_level_id === 4;
    const showConsignee = isSameDayOrDedicated && !isExport;
    const items = assignment.items || [];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerRef}>{assignment.miles_ref}</Text>
                    <Text style={styles.headerSub}>{assignment.service_level}</Text>
                </View>
                <TouchableOpacity style={styles.navBtn} onPress={handleNavigate}>
                    <Ionicons name="navigate" size={20} color={colors.info} />
                </TouchableOpacity>
            </View>

            {/* Badges row */}
            <View style={styles.badgesRow}>
                {assignment.is_urgent && (
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
                {isTransferRequested && (
                    <View style={styles.transferChip}>
                        <Ionicons name="swap-horizontal" size={12} color="#92400e" />
                        <Text style={styles.transferChipText}>Transfer Requested</Text>
                    </View>
                )}
                <View style={styles.serviceLevelChip}>
                    <Text style={styles.serviceLevelChipText}>{assignment.service_level || '-'}</Text>
                </View>
            </View>

            {/* Scrollable content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Special Instructions */}
                {assignment.special_instruction ? (
                    <View style={styles.specialBox}>
                        <View style={styles.specialHeader}>
                            <Ionicons name="warning-outline" size={16} color="#92400e" />
                            <Text style={styles.specialTitle}>Special Instructions</Text>
                        </View>
                        <Text style={styles.specialText}>{assignment.special_instruction}</Text>
                    </View>
                ) : null}

                {/* Dispatcher Message */}
                {assignment.message ? (
                    <View style={styles.messageBox}>
                        <View style={styles.messageHeader}>
                            <Ionicons name="chatbubble-outline" size={14} color="#1d4ed8" />
                            <Text style={styles.messageLabel}>Note from dispatcher</Text>
                        </View>
                        <Text style={styles.messageText}>{assignment.message}</Text>
                    </View>
                ) : null}

                {/* Collection Info Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                        <Text style={styles.cardTitle}>Collection Details</Text>
                    </View>
                    <View style={styles.cardBody}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Date</Text>
                            <Text style={styles.detailValue}>
                                {assignment.collection_date
                                    ? new Date(assignment.collection_date + 'T00:00:00').toLocaleDateString('en-GB', {
                                        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
                                    })
                                    : '-'}
                            </Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Time Window</Text>
                            <Text style={styles.detailValueMono}>
                                {formatTime(assignment.collection_time_from)} - {formatTime(assignment.collection_time_to)}
                            </Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Pieces</Text>
                            <Text style={styles.detailValue}>{assignment.total_pieces || 0}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Weight</Text>
                            <Text style={styles.detailValue}>{assignment.total_weight || 0} kg</Text>
                        </View>
                    </View>
                </View>

                {/* Shipper Card */}
                <View style={styles.card}>
                    <View style={[styles.cardHeader, { backgroundColor: '#fff7ed' }]}>
                        <Ionicons name="business-outline" size={16} color={colors.primary} />
                        <Text style={styles.cardTitle}>Shipper (Collection Address)</Text>
                    </View>
                    <View style={styles.cardBody}>
                        <Text style={styles.addressName}>
                            {assignment.shipper_company || assignment.shipper_contact_name || '-'}
                        </Text>
                        {assignment.shipper_contact_name && assignment.shipper_company ? (
                            <Text style={styles.addressLine}>{assignment.shipper_contact_name}</Text>
                        ) : null}
                        {assignment.shipper_address_1 ? (
                            <Text style={styles.addressLine}>{assignment.shipper_address_1}</Text>
                        ) : null}
                        {assignment.shipper_address_2 ? (
                            <Text style={styles.addressLine}>{assignment.shipper_address_2}</Text>
                        ) : null}
                        <Text style={styles.addressLine}>
                            {assignment.shipper_locality} {assignment.shipper_post_code}
                        </Text>
                        {assignment.shipper_country ? (
                            <Text style={styles.addressLineLight}>{assignment.shipper_country}</Text>
                        ) : null}

                        {assignment.shipper_contact_no ? (
                            <TouchableOpacity
                                style={styles.actionRow}
                                onPress={() => handleCall(assignment.shipper_contact_no)}
                            >
                                <View style={styles.actionIcon}>
                                    <Ionicons name="call" size={16} color="#fff" />
                                </View>
                                <Text style={styles.actionText}>{assignment.shipper_contact_no}</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>

                {/* Consignee Card - hidden for export */}
                {showConsignee && (assignment.consignee_company || assignment.consignee_contact_name) ? (
                    <View style={styles.card}>
                        <View style={[styles.cardHeader, { backgroundColor: '#eff6ff' }]}>
                            <Ionicons name="location-outline" size={16} color={colors.info} />
                            <Text style={styles.cardTitle}>Consignee (Delivery Address)</Text>
                        </View>
                        <View style={styles.cardBody}>
                            <Text style={styles.addressName}>
                                {assignment.consignee_company || assignment.consignee_contact_name || '-'}
                            </Text>
                            {assignment.consignee_contact_name && assignment.consignee_company ? (
                                <Text style={styles.addressLine}>{assignment.consignee_contact_name}</Text>
                            ) : null}
                            {assignment.consignee_address_1 ? (
                                <Text style={styles.addressLine}>{assignment.consignee_address_1}</Text>
                            ) : null}
                            {assignment.consignee_address_2 ? (
                                <Text style={styles.addressLine}>{assignment.consignee_address_2}</Text>
                            ) : null}
                            <Text style={styles.addressLine}>
                                {assignment.consignee_locality} {assignment.consignee_post_code}
                            </Text>
                            {assignment.consignee_country ? (
                                <Text style={styles.addressLineLight}>{assignment.consignee_country}</Text>
                            ) : null}
                            {assignment.consignee_contact_no ? (
                                <TouchableOpacity
                                    style={styles.actionRow}
                                    onPress={() => handleCall(assignment.consignee_contact_no)}
                                >
                                    <View style={[styles.actionIcon, { backgroundColor: colors.info }]}>
                                        <Ionicons name="call" size={16} color="#fff" />
                                    </View>
                                    <Text style={[styles.actionText, { color: colors.info }]}>
                                        {assignment.consignee_contact_no}
                                    </Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>
                ) : null}

                {/* Items Card */}
                <View style={styles.card}>
                    <View style={[styles.cardHeader, { backgroundColor: '#f8fafc' }]}>
                        <Ionicons name="cube-outline" size={16} color={colors.text} />
                        <Text style={styles.cardTitle}>Items</Text>
                        {items.length > 1 && (
                            <View style={styles.itemCountChip}>
                                <Text style={styles.itemCountText}>{items.length}</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.itemsTableContainer}>
                        {/* Table Header */}
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableCell, styles.cellDesc, styles.tableHeaderText]}>Description</Text>
                            <Text style={[styles.tableCell, styles.cellNum, styles.tableHeaderText]}>Pcs</Text>
                            <Text style={[styles.tableCell, styles.cellNum, styles.tableHeaderText]}>Weight</Text>
                            <Text style={[styles.tableCell, styles.cellDim, styles.tableHeaderText]}>Dimensions</Text>
                        </View>
                        {/* Table Rows */}
                        {items.length > 0 ? items.map((item, idx) => (
                            <View key={idx} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                                <Text style={[styles.tableCell, styles.cellDesc]} numberOfLines={2}>
                                    {item.description || '-'}
                                </Text>
                                <Text style={[styles.tableCell, styles.cellNum]}>{item.pieces || '-'}</Text>
                                <Text style={[styles.tableCell, styles.cellNum]}>
                                    {item.weight ? `${item.weight} kg` : '-'}
                                </Text>
                                <Text style={[styles.tableCell, styles.cellDim]}>{formatDimensions(item)}</Text>
                            </View>
                        )) : (
                            <View style={styles.tableRow}>
                                <Text style={[styles.tableCell, styles.cellDesc]}>-</Text>
                                <Text style={[styles.tableCell, styles.cellNum]}>{assignment.total_pieces || '-'}</Text>
                                <Text style={[styles.tableCell, styles.cellNum]}>
                                    {assignment.total_weight ? `${assignment.total_weight} kg` : '-'}
                                </Text>
                                <Text style={[styles.tableCell, styles.cellDim]}>-</Text>
                            </View>
                        )}
                        {/* Totals */}
                        <View style={styles.tableTotals}>
                            <Text style={styles.totalText}>
                                Total Pieces: {assignment.total_pieces || 0}
                            </Text>
                            <Text style={styles.totalText}>
                                Total Weight: {assignment.total_weight || 0} kg
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Transfer reason */}
                {isTransferRequested && assignment.transfer_reason ? (
                    <View style={styles.transferReasonCard}>
                        <Text style={styles.transferReasonLabel}>Your transfer reason:</Text>
                        <Text style={styles.transferReasonText}>"{assignment.transfer_reason}"</Text>
                    </View>
                ) : null}

                {/* Request Transfer */}
                {!isTransferRequested && (
                    <TouchableOpacity
                        style={styles.transferBtn}
                        onPress={() => setTransferModal(true)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="swap-horizontal-outline" size={18} color={colors.primary} />
                        <Text style={styles.transferBtnText}>Request Transfer</Text>
                    </TouchableOpacity>
                )}

                {/* Bottom spacer so content doesn't hide behind sticky slide */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Sticky Slide Button */}
            {!isTransferRequested && (
                <View style={styles.stickyBottom}>
                    <SlideToConfirm
                        label="Arrived at Collection Point"
                        onConfirm={handleSlideConfirm}
                    />
                </View>
            )}

            {/* Transfer Modal */}
            <TransferRequestModal
                visible={transferModal}
                assignment={assignment}
                onClose={() => setTransferModal(false)}
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

    // Header
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
    headerRef: {
        fontSize: 18,
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

    // Badges
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

    // Scroll
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: layouts.spacing.md,
        gap: layouts.spacing.md,
    },

    // Special Instructions
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

    // Message
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

    // Cards
    card: {
        backgroundColor: colors.card,
        borderRadius: layouts.borderRadius.md,
        borderWidth: 1,
        borderColor: colors.gray200,
        overflow: 'hidden',
        shadowColor: colors.shadow,
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

    // Detail rows
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

    // Address
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

    // Items table
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
    itemsTableContainer: {},
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
    tableTotals: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: colors.gray100,
    },
    totalText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.text,
    },

    // Transfer
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

    // Sticky bottom
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