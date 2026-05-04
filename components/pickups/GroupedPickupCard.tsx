import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { GroupedPickupAssignment, DriverPickupAssignment, PickupItem } from '../../lib/pickupAssignments';
import SlideToConfirm from './SlideToConfirm';

interface GroupedPickupCardProps {
    group: GroupedPickupAssignment;
    onRequestTransfer: (assignment: DriverPickupAssignment) => void;
    onSlideConfirm: (assignments: DriverPickupAssignment[]) => void;
}

const formatTime = (t: string | null | undefined): string => t ? t.substring(0, 5) : '--:--';

const formatDimensions = (item: PickupItem): string => {
    if (item.length && item.width && item.height) {
        return `${item.length} x ${item.width} x ${item.height}`;
    }
    return '-';
};

export default function GroupedPickupCard({
    group,
    onRequestTransfer,
    onSlideConfirm,
}: GroupedPickupCardProps) {
    const [expanded, setExpanded] = useState(false);
    const first = group.assignments[0];

    const handleCall = (number: string) => {
        const cleaned = number.replace(/\s/g, '');
        Linking.openURL(`tel:${cleaned}`).catch(() => {
            Alert.alert('Error', 'Failed to open phone dialer');
        });
    };

    return (
        <View style={[
            styles.card,
            group.hasUrgent && styles.cardUrgent,
            group.hasTransferRequested && styles.cardTransferRequested,
        ]}>
            {/* COLLAPSED VIEW */}
            <TouchableOpacity
                style={styles.collapsedRow}
                onPress={() => setExpanded(!expanded)}
                activeOpacity={0.7}
            >
                <View style={styles.collapsedLeft}>
                    <View style={styles.refRow}>
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
                    </View>
                    <View style={styles.collapsedMeta}>
                        <Text style={styles.serviceLevel}>{first.service_level || '-'}</Text>
                        {first.is_export && (
                            <View style={styles.exportBadge}>
                                <Text style={styles.exportBadgeText}>EXPORT</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.companyText} numberOfLines={1}>
                        {group.shipper_company || first.shipper_contact_name || 'Unknown'}
                    </Text>
                    <Text style={styles.localityText}>{group.shipper_locality || '-'}</Text>

                    {/* All miles refs preview */}
                    <View style={styles.refsPreview}>
                        {group.assignments.map(a => (
                            <Text key={a.id} style={styles.refPreviewText}>{a.miles_ref}</Text>
                        ))}
                    </View>
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
                    {/* All Miles Refs */}
                    <View style={styles.allRefsBox}>
                        <Text style={styles.allRefsTitle}>Booking References</Text>
                        <View style={styles.allRefsGrid}>
                            {group.assignments.map(a => (
                                <View key={a.id} style={styles.allRefItem}>
                                    <Text style={styles.allRefText}>{a.miles_ref}</Text>
                                    {a.is_urgent && (
                                        <View style={styles.tinyUrgentBadge}>
                                            <Text style={styles.tinyUrgentText}>!</Text>
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Special Instructions (from first - they share the same shipper) */}
                    {first.special_instruction ? (
                        <View style={styles.specialBox}>
                            <Ionicons name="warning-outline" size={14} color={colors.warning} />
                            <Text style={styles.specialText}>{first.special_instruction}</Text>
                        </View>
                    ) : null}

                    {/* Collection Date & Time */}
                    <View style={styles.infoGrid}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Collection Date</Text>
                            <Text style={styles.infoValue}>
                                {first.collection_date
                                    ? new Date(first.collection_date + 'T00:00:00').toLocaleDateString('en-GB', {
                                        day: '2-digit', month: 'short', year: 'numeric'
                                    })
                                    : '-'}
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Time Window</Text>
                            <Text style={styles.infoValue}>
                                {formatTime(first.collection_time_from)} - {formatTime(first.collection_time_to)}
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Total Pieces</Text>
                            <Text style={styles.infoValue}>{group.totalPieces}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Total Weight</Text>
                            <Text style={styles.infoValue}>{group.totalWeight} kg</Text>
                        </View>
                    </View>

                    {/* Dispatcher Message (from first assignment) */}
                    {first.message ? (
                        <View style={styles.messageBox}>
                            <Ionicons name="chatbubble-outline" size={12} color="#1d4ed8" />
                            <Text style={styles.messageText}>{first.message}</Text>
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
                                <Text style={styles.addressLine}>{first.shipper_country}</Text>
                            ) : null}
                            {first.shipper_contact_no ? (
                                <TouchableOpacity
                                    style={styles.phoneRow}
                                    onPress={() => handleCall(first.shipper_contact_no)}
                                >
                                    <Ionicons name="call-outline" size={13} color={colors.success} />
                                    <Text style={styles.phoneText}>{first.shipper_contact_no}</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>

                    {/* Per-booking items breakdown */}
                    {group.assignments.map(a => (
                        <View key={a.id} style={styles.perBookingSection}>
                            <View style={styles.perBookingHeader}>
                                <Text style={styles.perBookingRef}>{a.miles_ref}</Text>
                                <Text style={styles.perBookingPieces}>{a.total_pieces} pcs / {a.total_weight} kg</Text>
                            </View>
                            {(a.items || []).length > 0 && (
                                <View style={styles.miniItemsList}>
                                    {a.items.map((item, idx) => (
                                        <Text key={idx} style={styles.miniItemText}>
                                            {item.description || '-'} ({item.pieces} pcs, {item.weight} kg)
                                        </Text>
                                    ))}
                                </View>
                            )}
                        </View>
                    ))}

                    {/* Request Transfer per booking */}
                    {!group.hasTransferRequested && group.assignments.length > 0 && (
                        <TouchableOpacity
                            style={styles.transferRequestBtn}
                            onPress={() => onRequestTransfer(group.assignments[0])}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="swap-horizontal-outline" size={16} color={colors.primary} />
                            <Text style={styles.transferRequestText}>Request Transfer</Text>
                        </TouchableOpacity>
                    )}

                    {/* Slide to Confirm */}
                    {!group.hasTransferRequested && (
                        <View style={styles.slideContainer}>
                            <SlideToConfirm
                                label={`Arrived (${group.assignments.length} Pickups)`}
                                onConfirm={() => onSlideConfirm(group.assignments)}
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
        backgroundColor: '#ffffff',
        borderRadius: layouts.borderRadius.md,
        marginBottom: layouts.spacing.md,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
        shadowColor: 'rgba(0,0,0,0.1)',
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
        fontSize: 14,
        fontWeight: '600',
        color: '#101010',
    },
    localityText: {
        fontSize: 12,
        color: '#666666',
    },
    refsPreview: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 4,
    },
    refPreviewText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.primary,
    },

    expandedBody: {
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        padding: layouts.spacing.md,
        gap: layouts.spacing.md,
    },

    allRefsBox: {
        backgroundColor: '#fff7ed',
        borderWidth: 1,
        borderColor: '#fed7aa',
        borderRadius: layouts.borderRadius.sm,
        padding: layouts.spacing.sm,
    },
    allRefsTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#c2410c',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        marginBottom: 6,
    },
    allRefsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    allRefItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#fdba74',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    allRefText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.primary,
    },
    tinyUrgentBadge: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#dc2626',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tinyUrgentText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#ffffff',
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
        color: '#666666',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#101010',
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
    addressSection: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: layouts.borderRadius.sm,
        overflow: 'hidden',
    },
    addressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#f8f8f8',
        paddingHorizontal: layouts.spacing.sm,
        paddingVertical: 6,
    },
    addressTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#101010',
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
        color: '#101010',
        marginBottom: 2,
    },
    addressLine: {
        fontSize: 13,
        color: '#101010',
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

    perBookingSection: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: layouts.borderRadius.sm,
        padding: layouts.spacing.sm,
        backgroundColor: '#fafafa',
    },
    perBookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    perBookingRef: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.primary,
    },
    perBookingPieces: {
        fontSize: 11,
        color: '#666666',
    },
    miniItemsList: {
        gap: 2,
    },
    miniItemText: {
        fontSize: 11,
        color: '#666666',
    },

    transferRequestBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: layouts.spacing.sm,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: layouts.borderRadius.md,
        backgroundColor: '#f8f8f8',
    },
    transferRequestText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.primary,
    },
    slideContainer: {
        marginTop: layouts.spacing.xs,
    },
});