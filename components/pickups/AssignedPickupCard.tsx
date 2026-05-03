import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { DriverPickupAssignment, PickupItem } from '../../lib/pickupAssignments';
import SlideToConfirm from './SlideToConfirm';

interface AssignedPickupCardProps {
    assignment: DriverPickupAssignment;
    onRequestTransfer: (assignment: DriverPickupAssignment) => void;
    onSlideConfirm: (assignment: DriverPickupAssignment) => void;
}

const formatTime = (t: string | null | undefined): string => t ? t.substring(0, 5) : '--:--';

const formatDimensions = (item: PickupItem): string => {
    if (item.length && item.width && item.height) {
        return `${item.length} x ${item.width} x ${item.height}`;
    }
    return '-';
};

// Service level IDs: Same Day = 5, Dedicated = 4, Next Day = 6, ROU/Routine = 3
const SERVICE_SAME_DAY = 5;
const SERVICE_DEDICATED = 4;
const SERVICE_NEXT_DAY = 6;
const SERVICE_ROUTINE = 3;

export default function AssignedPickupCard({
    assignment,
    onRequestTransfer,
    onSlideConfirm,
}: AssignedPickupCardProps) {
    const [expanded, setExpanded] = useState(false);
    const isTransferRequested = assignment.status === 'transfer_requested';

    // Determine what to show based on service level and export flag
    const slId = assignment.service_level_id;
    const isExport = assignment.is_export;

    // Export: shipper only (no consignee)
    // All service levels: shipper + consignee + items
    const showConsignee = !isExport;

    const handleCall = (number: string) => {
        const cleaned = number.replace(/\s/g, '');
        Linking.openURL(`tel:${cleaned}`).catch(() => {
            Alert.alert('Error', 'Failed to open phone dialer');
        });
    };

    const items = assignment.items || [];

    return (
        <View style={[
            styles.card,
            assignment.is_urgent && styles.cardUrgent,
            isTransferRequested && styles.cardTransferRequested,
        ]}>
            {/* COLLAPSED VIEW - always visible */}
            <TouchableOpacity
                style={styles.collapsedRow}
                onPress={() => setExpanded(!expanded)}
                activeOpacity={0.7}
            >
                <View style={styles.collapsedLeft}>
                    <View style={styles.refRow}>
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
                                <Text style={styles.transferBadgeText}>Transfer Req</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.collapsedMeta}>
                        <Text style={styles.serviceLevel}>{assignment.service_level || '-'}</Text>
                        {isExport && (
                            <View style={styles.exportBadge}>
                                <Text style={styles.exportBadgeText}>EXPORT</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.companyText} numberOfLines={1}>
                        {assignment.shipper_company || assignment.shipper_contact_name || 'Unknown'}
                    </Text>
                    <Text style={styles.localityText}>{assignment.shipper_locality || '-'}</Text>
                    {assignment.message ? (
                        <View style={styles.notePreview}>
                            <Ionicons name="chatbubble-outline" size={10} color="#1d4ed8" />
                            <Text style={styles.notePreviewText} numberOfLines={1}>{assignment.message}</Text>
                        </View>
                    ) : null}
                </View>
                <View style={styles.collapsedRight}>
                    <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={colors.gray400}
                    />
                </View>
            </TouchableOpacity>

            {/* EXPANDED VIEW */}
            {expanded && (
                <View style={styles.expandedBody}>
                    {/* Special Instructions */}
                    {assignment.special_instruction ? (
                        <View style={styles.specialBox}>
                            <Ionicons name="warning-outline" size={14} color={colors.warning} />
                            <Text style={styles.specialText}>{assignment.special_instruction}</Text>
                        </View>
                    ) : null}

                    {/* Collection Date & Time */}
                    <View style={styles.infoGrid}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Collection Date</Text>
                            <Text style={styles.infoValue}>
                                {assignment.collection_date
                                    ? new Date(assignment.collection_date + 'T00:00:00').toLocaleDateString('en-GB', {
                                        day: '2-digit', month: 'short', year: 'numeric'
                                    })
                                    : '-'}
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Time Window</Text>
                            <Text style={styles.infoValue}>
                                {formatTime(assignment.collection_time_from)} - {formatTime(assignment.collection_time_to)}
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Service Level</Text>
                            <Text style={styles.infoValue}>{assignment.service_level || '-'}</Text>
                        </View>
                        {isExport && (
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Type</Text>
                                <View style={styles.exportBadgeLarge}>
                                    <Ionicons name="globe-outline" size={12} color="#1d4ed8" />
                                    <Text style={styles.exportBadgeLargeText}>EXPORT</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Dispatcher Message */}
                    {assignment.message ? (
                        <View style={styles.messageBox}>
                            <Ionicons name="chatbubble-outline" size={12} color="#1d4ed8" />
                            <Text style={styles.messageText}>{assignment.message}</Text>
                        </View>
                    ) : null}

                    {/* Shipper (Collection Address) */}
                    <View style={styles.addressSection}>
                        <View style={styles.addressHeader}>
                            <Ionicons name="business-outline" size={14} color={colors.primary} />
                            <Text style={styles.addressTitle}>Shipper (Collection Address)</Text>
                        </View>
                        <View style={styles.addressBody}>
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
                                <Text style={styles.addressLine}>{assignment.shipper_country}</Text>
                            ) : null}
                            {assignment.shipper_contact_no ? (
                                <TouchableOpacity
                                    style={styles.phoneRow}
                                    onPress={() => handleCall(assignment.shipper_contact_no)}
                                >
                                    <Ionicons name="call-outline" size={13} color={colors.success} />
                                    <Text style={styles.phoneText}>{assignment.shipper_contact_no}</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>

                    {/* Consignee (Delivery Address) - hidden for export */}
                    {showConsignee && (assignment.consignee_company || assignment.consignee_contact_name) ? (
                        <View style={styles.addressSection}>
                            <View style={styles.addressHeader}>
                                <Ionicons name="location-outline" size={14} color={colors.info} />
                                <Text style={styles.addressTitle}>Consignee (Delivery Address)</Text>
                            </View>
                            <View style={styles.addressBody}>
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
                                    <Text style={styles.addressLine}>{assignment.consignee_country}</Text>
                                ) : null}
                                {assignment.consignee_contact_no ? (
                                    <TouchableOpacity
                                        style={styles.phoneRow}
                                        onPress={() => handleCall(assignment.consignee_contact_no)}
                                    >
                                        <Ionicons name="call-outline" size={13} color={colors.success} />
                                        <Text style={styles.phoneText}>{assignment.consignee_contact_no}</Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        </View>
                    ) : null}

                    {/* Items Table */}
                    <View style={styles.itemsSection}>
                        <View style={styles.itemsHeader}>
                            <Ionicons name="cube-outline" size={14} color={colors.text} />
                            <Text style={styles.itemsTitle}>Items</Text>
                        </View>
                        <View style={styles.itemsTable}>
                            <View style={styles.itemsTableHeader}>
                                <Text style={[styles.itemsCell, styles.itemsCellDesc]}>Description</Text>
                                <Text style={[styles.itemsCell, styles.itemsCellNum]}>Pcs</Text>
                                <Text style={[styles.itemsCell, styles.itemsCellNum]}>Weight</Text>
                                <Text style={[styles.itemsCell, styles.itemsCellDim]}>Dimensions</Text>
                            </View>
                            {items.length > 0 ? items.map((item, idx) => (
                                <View key={idx} style={styles.itemsTableRow}>
                                    <Text style={[styles.itemsCell, styles.itemsCellDesc]} numberOfLines={1}>
                                        {item.description || '-'}
                                    </Text>
                                    <Text style={[styles.itemsCell, styles.itemsCellNum]}>
                                        {item.pieces || '-'}
                                    </Text>
                                    <Text style={[styles.itemsCell, styles.itemsCellNum]}>
                                        {item.weight ? `${item.weight} kg` : '-'}
                                    </Text>
                                    <Text style={[styles.itemsCell, styles.itemsCellDim]}>
                                        {formatDimensions(item)}
                                    </Text>
                                </View>
                            )) : (
                                <View style={styles.itemsTableRow}>
                                    <Text style={[styles.itemsCell, styles.itemsCellDesc]}>-</Text>
                                    <Text style={[styles.itemsCell, styles.itemsCellNum]}>
                                        {assignment.total_pieces || '-'}
                                    </Text>
                                    <Text style={[styles.itemsCell, styles.itemsCellNum]}>
                                        {assignment.total_weight ? `${assignment.total_weight} kg` : '-'}
                                    </Text>
                                    <Text style={[styles.itemsCell, styles.itemsCellDim]}>-</Text>
                                </View>
                            )}
                            <View style={styles.itemsTotals}>
                                <Text style={styles.itemsTotalText}>
                                    Total Pieces: {assignment.total_pieces || 0}
                                </Text>
                                <Text style={styles.itemsTotalText}>
                                    Total Weight: {assignment.total_weight || 0} kg
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Transfer reason (if requested) */}
                    {isTransferRequested && assignment.transfer_reason ? (
                        <View style={styles.transferReasonBox}>
                            <Text style={styles.transferReasonLabel}>Your transfer reason:</Text>
                            <Text style={styles.transferReasonText}>"{assignment.transfer_reason}"</Text>
                        </View>
                    ) : null}

                    {/* Request Transfer button (inside expanded) */}
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

                    {/* Slide to Confirm - Arrived at Collection Point */}
                    {!isTransferRequested && (
                        <View style={styles.slideContainer}>
                            <SlideToConfirm
                                label="Arrived at Collection Point"
                                onConfirm={() => onSlideConfirm(assignment)}
                            />
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: layouts.borderRadius.md,
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
        overflow: 'hidden',
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

    // Collapsed
    collapsedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: layouts.spacing.md,
    },
    collapsedLeft: {
        flex: 1,
        gap: 3,
    },
    collapsedRight: {
        paddingLeft: layouts.spacing.sm,
    },
    refRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: layouts.spacing.sm,
        marginBottom: 2,
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
    collapsedMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
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
    companyText: {
        fontSize: 13,
        fontWeight: '500',
        color: colors.text,
    },
    localityText: {
        fontSize: 12,
        color: colors.textLight,
    },
    notePreview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    notePreviewText: {
        fontSize: 11,
        color: '#1d4ed8',
        flex: 1,
    },

    // Expanded
    expandedBody: {
        borderTopWidth: 1,
        borderTopColor: colors.gray200,
        padding: layouts.spacing.md,
        gap: layouts.spacing.md,
    },
    specialBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        backgroundColor: '#fef3c7',
        padding: layouts.spacing.sm,
        borderRadius: layouts.borderRadius.sm,
        borderWidth: 1,
        borderColor: '#fbbf24',
    },
    specialText: {
        flex: 1,
        fontSize: 12,
        color: '#92400e',
        lineHeight: 18,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: layouts.spacing.sm,
    },
    infoItem: {
        minWidth: '45%',
    },
    infoLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.textLight,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
    },
    exportBadgeLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#dbeafe',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    exportBadgeLargeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1d4ed8',
    },
    messageBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
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

    // Address sections
    addressSection: {
        borderWidth: 1,
        borderColor: colors.gray200,
        borderRadius: layouts.borderRadius.sm,
        overflow: 'hidden',
    },
    addressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.gray100,
        paddingHorizontal: layouts.spacing.sm,
        paddingVertical: 6,
    },
    addressTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.text,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    addressBody: {
        padding: layouts.spacing.sm,
        gap: 2,
    },
    addressName: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 2,
    },
    addressLine: {
        fontSize: 13,
        color: colors.text,
        lineHeight: 20,
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    phoneText: {
        fontSize: 13,
        color: colors.success,
        fontWeight: '600',
    },

    // Items
    itemsSection: {},
    itemsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    itemsTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.text,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    itemsTable: {
        borderWidth: 1,
        borderColor: colors.gray200,
        borderRadius: layouts.borderRadius.sm,
        overflow: 'hidden',
    },
    itemsTableHeader: {
        flexDirection: 'row',
        backgroundColor: colors.gray100,
        paddingVertical: 6,
        paddingHorizontal: 8,
    },
    itemsTableRow: {
        flexDirection: 'row',
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderTopWidth: 1,
        borderTopColor: colors.gray100,
    },
    itemsCell: {
        fontSize: 11,
        color: colors.text,
    },
    itemsCellDesc: {
        flex: 2,
        fontWeight: '500',
    },
    itemsCellNum: {
        flex: 1,
        textAlign: 'center',
    },
    itemsCellDim: {
        flex: 2,
        textAlign: 'right',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 10,
    },
    itemsTotals: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        paddingHorizontal: 8,
        backgroundColor: colors.gray100,
        borderTopWidth: 1,
        borderTopColor: colors.gray200,
    },
    itemsTotalText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.text,
    },

    // Transfer
    transferReasonBox: {
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
    transferRequestBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
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

    // Slide
    slideContainer: {
        marginTop: layouts.spacing.xs,
    },
});