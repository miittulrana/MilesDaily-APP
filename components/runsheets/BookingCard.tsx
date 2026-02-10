import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { RunsheetBooking, BookingStatus } from '../../utils/runsheetTypes';
import { logBookingCall } from '../../lib/callLogService';
import { supabase } from '../../lib/supabase';

interface BookingCardProps {
    booking: RunsheetBooking;
    sequenceNumber?: number;
    onPress?: () => void;
    currentStatus?: BookingStatus;
    lat?: number;
    lng?: number;
}

export default function BookingCard({ booking, sequenceNumber, onPress, currentStatus, lat, lng }: BookingCardProps) {
    const CardWrapper = onPress ? TouchableOpacity : View;
    const wrapperProps = onPress ? { onPress, activeOpacity: 0.7 } : {};

    const buildAddressString = (): string => {
        const parts = [];
        if (booking.consignee_address) parts.push(booking.consignee_address);
        if (booking.consignee_city) parts.push(booking.consignee_city);
        if (booking.consignee_postcode) parts.push(booking.consignee_postcode);
        parts.push('Malta');
        return parts.join(', ');
    };

    const openGoogleMaps = async () => {
        let url: string;
        if (lat && lng && lat !== 0 && lng !== 0) {
            url = `google.navigation:q=${lat},${lng}`;
        } else {
            const address = encodeURIComponent(buildAddressString());
            url = `google.navigation:q=${address}`;
        }

        const webUrl = lat && lng && lat !== 0 && lng !== 0
            ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
            : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(buildAddressString())}&travelmode=driving`;

        try {
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
                await Linking.openURL(url);
            } else {
                await Linking.openURL(webUrl);
            }
        } catch (error) {
            try {
                await Linking.openURL(webUrl);
            } catch (webError) {
                Alert.alert('Error', 'Failed to open Google Maps.');
            }
        }
    };

    const openWaze = async () => {
        let wazeUrl: string;
        let wazeWebUrl: string;

        if (lat && lng && lat !== 0 && lng !== 0) {
            wazeUrl = `waze://?ll=${lat},${lng}&navigate=yes`;
            wazeWebUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
        } else {
            const address = encodeURIComponent(buildAddressString());
            wazeUrl = `waze://?q=${address}&navigate=yes`;
            wazeWebUrl = `https://waze.com/ul?q=${address}&navigate=yes`;
        }

        try {
            const canOpen = await Linking.canOpenURL(wazeUrl);
            if (canOpen) {
                await Linking.openURL(wazeUrl);
            } else {
                Alert.alert(
                    'Waze Not Installed',
                    'Would you like to open Waze in your browser instead?',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open in Browser', onPress: () => Linking.openURL(wazeWebUrl) }
                    ]
                );
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to open Waze.');
        }
    };

    const handleMapPress = () => {
        Alert.alert(
            'Navigate with',
            'Choose your preferred navigation app',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Waze', onPress: openWaze },
                { text: 'Google Maps', onPress: openGoogleMaps }
            ]
        );
    };

    const handleCallPress = async () => {
        const phoneNumber = booking.consignee_mobile;
        if (!phoneNumber) {
            Alert.alert('No Phone Number', 'This booking does not have a phone number.');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const driverName = user?.user_metadata?.first_name && user?.user_metadata?.last_name
                ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                : user?.email || 'Unknown Driver';

            await logBookingCall({
                miles_ref: booking.miles_ref,
                hawb: booking.hawb || null,
                contact_name: booking.consignee_name || booking.consignee_company || 'Unknown',
                mobile_number: phoneNumber,
                driver_name: driverName
            });

            const cleanedNumber = phoneNumber.replace(/\s/g, '');
            const phoneUrl = `tel:${cleanedNumber}`;
            await Linking.openURL(phoneUrl);
        } catch (error) {
            const cleanedNumber = phoneNumber.replace(/\s/g, '');
            const phoneUrl = `tel:${cleanedNumber}`;
            await Linking.openURL(phoneUrl);
        }
    };

    return (
        <CardWrapper style={styles.container} {...wrapperProps}>
            {sequenceNumber !== undefined && (
                <View style={styles.sequenceBadge}>
                    <Text style={styles.sequenceText}>{sequenceNumber}</Text>
                </View>
            )}

            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.refContainer}>
                        <Ionicons name="document-text" size={16} color={colors.primary} />
                        <Text style={styles.milesRef}>{booking.miles_ref}</Text>
                    </View>
                    {booking.hawb && booking.hawb.trim() !== '' && (
                        <View style={styles.hawbContainer}>
                            <Ionicons name="barcode-outline" size={14} color={colors.info} />
                            <Text style={styles.hawbLabel}>HAWB:</Text>
                            <Text style={styles.hawbValue}>{booking.hawb}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.actionIconButton}
                        onPress={handleMapPress}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="navigate" size={20} color={colors.info} />
                    </TouchableOpacity>
                    {booking.consignee_mobile && (
                        <TouchableOpacity
                            style={styles.actionIconButton}
                            onPress={handleCallPress}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="call" size={20} color={colors.success} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {currentStatus && (
                <View style={styles.statusBanner}>
                    <Ionicons name="information-circle" size={16} color={colors.info} />
                    <Text style={styles.statusText}>
                        {currentStatus.status_name}
                        {currentStatus.staff_name && ` - ${currentStatus.staff_name}`}
                    </Text>
                </View>
            )}

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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: layouts.spacing.md,
        paddingBottom: layouts.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    headerLeft: {
        flex: 1,
        gap: layouts.spacing.xs,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: layouts.spacing.sm,
        marginLeft: layouts.spacing.sm,
    },
    actionIconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.gray100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    refContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: layouts.spacing.xs,
    },
    milesRef: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    hawbContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.info + '15',
        paddingVertical: layouts.spacing.xs,
        paddingHorizontal: layouts.spacing.sm,
        borderRadius: layouts.borderRadius.sm,
        gap: layouts.spacing.xs,
        alignSelf: 'flex-start',
    },
    hawbLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.info,
    },
    hawbValue: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.info,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.info + '15',
        paddingVertical: layouts.spacing.xs,
        paddingHorizontal: layouts.spacing.sm,
        borderRadius: layouts.borderRadius.sm,
        marginBottom: layouts.spacing.sm,
        gap: layouts.spacing.xs,
    },
    statusText: {
        fontSize: 12,
        color: colors.info,
        fontWeight: '600',
        flex: 1,
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