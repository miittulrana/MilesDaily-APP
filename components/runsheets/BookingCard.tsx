import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { RunsheetBooking } from '../../utils/runsheetTypes';

interface BookingCardProps {
    booking: RunsheetBooking;
    sequenceNumber?: number;
    onPress?: () => void;
}

export default function BookingCard({ booking, sequenceNumber, onPress }: BookingCardProps) {
    const CardWrapper = onPress ? TouchableOpacity : View;
    const wrapperProps = onPress ? { onPress, activeOpacity: 0.7 } : {};

    return (
        <CardWrapper style={styles.container} {...wrapperProps}>
            {sequenceNumber !== undefined && (
                <View style={styles.sequenceBadge}>
                    <Text style={styles.sequenceText}>{sequenceNumber}</Text>
                </View>
            )}

            <View style={styles.header}>
                <View style={styles.refContainer}>
                    <Ionicons name="document-text" size={16} color={colors.primary} />
                    <Text style={styles.milesRef}>{booking.miles_ref}</Text>
                </View>
                {booking.hawb && (
                    <Text style={styles.hawb}>HAWB: {booking.hawb}</Text>
                )}
            </View>

            <View style={styles.section}>
                <View style={styles.row}>
                    <Ionicons name="business" size={16} color={colors.textLight} />
                    <Text style={styles.label}>Company:</Text>
                </View>
                <Text style={styles.value}>{booking.consignee_company || 'N/A'}</Text>
            </View>

            {booking.consignee_name && (
                <View style={styles.section}>
                    <View style={styles.row}>
                        <Ionicons name="person" size={16} color={colors.textLight} />
                        <Text style={styles.label}>Contact:</Text>
                    </View>
                    <Text style={styles.value}>{booking.consignee_name}</Text>
                </View>
            )}

            <View style={styles.section}>
                <View style={styles.row}>
                    <Ionicons name="location" size={16} color={colors.textLight} />
                    <Text style={styles.label}>Address:</Text>
                </View>
                <Text style={styles.value}>{booking.consignee_address}</Text>
                <Text style={styles.cityPostcode}>
                    {booking.consignee_city}
                    {booking.consignee_postcode && `, ${booking.consignee_postcode}`}
                </Text>
            </View>

            {booking.consignee_mobile && (
                <View style={styles.section}>
                    <View style={styles.row}>
                        <Ionicons name="call" size={16} color={colors.textLight} />
                        <Text style={styles.label}>Mobile:</Text>
                    </View>
                    <Text style={styles.value}>{booking.consignee_mobile}</Text>
                </View>
            )}

            <View style={styles.footer}>
                <View style={styles.statBox}>
                    <Ionicons name="cube-outline" size={16} color={colors.primary} />
                    <Text style={styles.statValue}>{booking.total_pieces}</Text>
                    <Text style={styles.statLabel}>Pieces</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.statBox}>
                    <Ionicons name="barbell-outline" size={16} color={colors.primary} />
                    <Text style={styles.statValue}>{parseFloat(booking.total_weight).toFixed(1)}</Text>
                    <Text style={styles.statLabel}>Kg</Text>
                </View>

                {booking.service_type && (
                    <>
                        <View style={styles.divider} />
                        <View style={styles.statBox}>
                            <Ionicons name="flash-outline" size={16} color={colors.primary} />
                            <Text style={styles.serviceType}>{booking.service_type}</Text>
                        </View>
                    </>
                )}
            </View>

            {onPress && (
                <View style={styles.tapIndicator}>
                    <Ionicons name="scan-outline" size={20} color={colors.primary} />
                    <Text style={styles.tapText}>Tap to scan</Text>
                </View>
            )}
        </CardWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.card,
        borderRadius: layouts.borderRadius.lg,
        padding: layouts.spacing.md,
        marginBottom: layouts.spacing.md,
        borderWidth: 1,
        borderColor: colors.gray200,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        position: 'relative',
    },
    sequenceBadge: {
        position: 'absolute',
        top: -8,
        left: -8,
        backgroundColor: colors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    sequenceText: {
        color: colors.background,
        fontSize: 14,
        fontWeight: '700',
    },
    header: {
        marginBottom: layouts.spacing.md,
        paddingBottom: layouts.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    refContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: layouts.spacing.xs,
        marginBottom: layouts.spacing.xs,
    },
    milesRef: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    hawb: {
        fontSize: 12,
        color: colors.textLight,
        fontStyle: 'italic',
    },
    section: {
        marginBottom: layouts.spacing.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: layouts.spacing.xs,
        marginBottom: layouts.spacing.xs,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textLight,
    },
    value: {
        fontSize: 14,
        color: colors.text,
        lineHeight: 20,
    },
    cityPostcode: {
        fontSize: 13,
        color: colors.textLight,
        marginTop: layouts.spacing.xs,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.gray100,
        borderRadius: layouts.borderRadius.md,
        padding: layouts.spacing.sm,
        marginTop: layouts.spacing.sm,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        gap: layouts.spacing.xs,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
    },
    statLabel: {
        fontSize: 10,
        color: colors.textLight,
    },
    serviceType: {
        fontSize: 11,
        color: colors.text,
        fontWeight: '600',
        textAlign: 'center',
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: colors.gray300,
    },
    tapIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: layouts.spacing.xs,
        marginTop: layouts.spacing.sm,
        paddingTop: layouts.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.gray200,
    },
    tapText: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '600',
    },
});