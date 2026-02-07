import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Linking, Alert, ActionSheetIOS, Dimensions, Modal } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { RunsheetBooking } from '../../utils/runsheetTypes';

interface RouteMapViewProps {
    bookings: RunsheetBooking[];
    currentLocation: {
        latitude: number;
        longitude: number;
    } | null;
    geocodedLocations: Map<string, { lat: number; lng: number }>;
    onClose?: () => void;
}

interface MarkerData {
    booking: RunsheetBooking;
    coordinate: {
        latitude: number;
        longitude: number;
    };
    sequenceNumber: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RouteMapView({
    bookings,
    currentLocation,
    geocodedLocations,
    onClose
}: RouteMapViewProps) {
    const mapRef = useRef<MapView>(null);
    const [markers, setMarkers] = useState<MarkerData[]>([]);
    const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
    const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        prepareMapData();
    }, [bookings, geocodedLocations]);

    useEffect(() => {
        if (markers.length > 0 && mapRef.current) {
            setTimeout(() => {
                fitMapToMarkers();
            }, 500);
        }
    }, [markers]);

    const prepareMapData = () => {
        const markerList: MarkerData[] = [];
        const coordinates: { latitude: number; longitude: number }[] = [];

        if (currentLocation) {
            coordinates.push({
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
            });
        }

        bookings.forEach((booking, index) => {
            const address = buildFullAddress(booking);
            const location = geocodedLocations.get(address);

            if (location) {
                const coordinate = {
                    latitude: location.lat,
                    longitude: location.lng,
                };

                markerList.push({
                    booking,
                    coordinate,
                    sequenceNumber: index + 1,
                });

                coordinates.push(coordinate);
            }
        });

        setMarkers(markerList);
        setRouteCoordinates(coordinates);
    };

    const buildFullAddress = (booking: RunsheetBooking): string => {
        const parts = [
            booking.consignee_address,
            booking.consignee_city,
            booking.consignee_postcode,
            'Malta',
        ].filter(Boolean);
        return parts.join(', ');
    };

    const fitMapToMarkers = () => {
        if (markers.length === 0 || !mapRef.current) return;

        const allCoordinates = [...markers.map(m => m.coordinate)];
        if (currentLocation) {
            allCoordinates.push({
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
            });
        }

        try {
            mapRef.current.fitToCoordinates(allCoordinates, {
                edgePadding: { top: 100, right: 50, bottom: 150, left: 50 },
                animated: true,
            });
        } catch (e) {
            console.log('fitToCoordinates error:', e);
        }
    };

    const handleMarkerPress = (marker: MarkerData) => {
        setSelectedMarker(marker);
        setShowDetailModal(true);
    };

    const openNavigationApp = (marker: MarkerData) => {
        const { latitude, longitude } = marker.coordinate;
        const destination = `${latitude},${longitude}`;

        const googleMapsUrl = Platform.select({
            ios: `comgooglemaps://?daddr=${destination}&directionsmode=driving`,
            android: `google.navigation:q=${destination}`,
        });

        const appleMapsUrl = `maps://?daddr=${destination}&dirflg=d`;
        const wazeUrl = `waze://?ll=${latitude},${longitude}&navigate=yes`;
        const googleMapsWebUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancel', 'Google Maps', 'Apple Maps', 'Waze'],
                    cancelButtonIndex: 0,
                    title: 'Choose Navigation App',
                },
                async (buttonIndex) => {
                    if (buttonIndex === 1) {
                        const canOpen = await Linking.canOpenURL(googleMapsUrl!);
                        if (canOpen) {
                            Linking.openURL(googleMapsUrl!);
                        } else {
                            Linking.openURL(googleMapsWebUrl);
                        }
                    } else if (buttonIndex === 2) {
                        Linking.openURL(appleMapsUrl);
                    } else if (buttonIndex === 3) {
                        const canOpen = await Linking.canOpenURL(wazeUrl);
                        if (canOpen) {
                            Linking.openURL(wazeUrl);
                        } else {
                            Alert.alert('Waze Not Installed', 'Please install Waze to use this option.');
                        }
                    }
                }
            );
        } else {
            Alert.alert(
                'Choose Navigation App',
                'Select your preferred navigation app',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Google Maps',
                        onPress: async () => {
                            const canOpen = await Linking.canOpenURL(googleMapsUrl!);
                            if (canOpen) {
                                Linking.openURL(googleMapsUrl!);
                            } else {
                                Linking.openURL(googleMapsWebUrl);
                            }
                        },
                    },
                    {
                        text: 'Waze',
                        onPress: async () => {
                            const canOpen = await Linking.canOpenURL(wazeUrl);
                            if (canOpen) {
                                Linking.openURL(wazeUrl);
                            } else {
                                Alert.alert('Waze Not Installed', 'Please install Waze to use this option.');
                            }
                        },
                    },
                ]
            );
        }
    };

    const handleNavigateFromModal = () => {
        if (selectedMarker) {
            setShowDetailModal(false);
            setTimeout(() => {
                openNavigationApp(selectedMarker);
            }, 300);
        }
    };

    const renderDetailModal = () => {
        if (!selectedMarker) return null;

        const marker = selectedMarker;

        return (
            <Modal
                visible={showDetailModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowDetailModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowDetailModal(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={styles.modalContent}
                        onPress={() => { }}
                    >
                        <View style={styles.modalHandle} />

                        <View style={styles.modalHeader}>
                            <View style={styles.modalSequenceBadge}>
                                <Text style={styles.modalSequenceText}>{marker.sequenceNumber}</Text>
                            </View>
                            <View style={styles.modalHeaderText}>
                                <Text style={styles.modalMilesRef}>{marker.booking.miles_ref}</Text>
                                {marker.booking.hawb && (
                                    <Text style={styles.modalHawb}>HAWB: {marker.booking.hawb}</Text>
                                )}
                            </View>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setShowDetailModal(false)}
                            >
                                <Ionicons name="close" size={24} color={colors.gray500} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalDivider} />

                        <View style={styles.modalSection}>
                            <View style={styles.modalRow}>
                                <Ionicons name="business" size={18} color={colors.primary} />
                                <Text style={styles.modalLabel}>Company</Text>
                            </View>
                            <Text style={styles.modalValue}>{marker.booking.consignee_company || 'N/A'}</Text>
                        </View>

                        {marker.booking.consignee_name && (
                            <View style={styles.modalSection}>
                                <View style={styles.modalRow}>
                                    <Ionicons name="person" size={18} color={colors.primary} />
                                    <Text style={styles.modalLabel}>Contact</Text>
                                </View>
                                <Text style={styles.modalValue}>{marker.booking.consignee_name}</Text>
                            </View>
                        )}

                        <View style={styles.modalSection}>
                            <View style={styles.modalRow}>
                                <Ionicons name="location" size={18} color={colors.primary} />
                                <Text style={styles.modalLabel}>Address</Text>
                            </View>
                            <Text style={styles.modalValue}>
                                {marker.booking.consignee_address}
                            </Text>
                            <Text style={styles.modalValueSecondary}>
                                {marker.booking.consignee_city}
                                {marker.booking.consignee_postcode ? `, ${marker.booking.consignee_postcode}` : ''}
                            </Text>
                        </View>

                        {marker.booking.consignee_mobile && (
                            <View style={styles.modalSection}>
                                <View style={styles.modalRow}>
                                    <Ionicons name="call" size={18} color={colors.primary} />
                                    <Text style={styles.modalLabel}>Mobile</Text>
                                </View>
                                <Text style={styles.modalValue}>{marker.booking.consignee_mobile}</Text>
                            </View>
                        )}

                        <View style={styles.modalStats}>
                            <View style={styles.modalStatItem}>
                                <Ionicons name="cube-outline" size={20} color={colors.primary} />
                                <Text style={styles.modalStatValue}>{marker.booking.total_pieces}</Text>
                                <Text style={styles.modalStatLabel}>Pieces</Text>
                            </View>
                            <View style={styles.modalStatDivider} />
                            <View style={styles.modalStatItem}>
                                <Ionicons name="barbell-outline" size={20} color={colors.primary} />
                                <Text style={styles.modalStatValue}>{parseFloat(marker.booking.total_weight).toFixed(1)}</Text>
                                <Text style={styles.modalStatLabel}>Kg</Text>
                            </View>
                            {marker.booking.service_type && (
                                <>
                                    <View style={styles.modalStatDivider} />
                                    <View style={styles.modalStatItem}>
                                        <Ionicons name="flash-outline" size={20} color={colors.primary} />
                                        <Text style={styles.modalStatValue}>{marker.booking.service_type}</Text>
                                        <Text style={styles.modalStatLabel}>Service</Text>
                                    </View>
                                </>
                            )}
                        </View>

                        <TouchableOpacity
                            style={styles.navigateButton}
                            onPress={handleNavigateFromModal}
                        >
                            <Ionicons name="navigate" size={20} color={colors.background} />
                            <Text style={styles.navigateButtonText}>Navigate to this stop</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        );
    };

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                showsUserLocation={false}
                showsMyLocationButton={false}
                showsCompass={true}
                showsScale={true}
                initialRegion={{
                    latitude: currentLocation?.latitude || 35.9375,
                    longitude: currentLocation?.longitude || 14.3754,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                }}
            >
                {routeCoordinates.length > 1 && (
                    <Polyline
                        coordinates={routeCoordinates}
                        strokeColor={colors.primary}
                        strokeWidth={4}
                    />
                )}

                {markers.map((marker, index) => (
                    <Marker
                        key={`marker-${marker.booking.miles_ref}-${index}`}
                        coordinate={marker.coordinate}
                        onPress={() => handleMarkerPress(marker)}
                        tracksViewChanges={false}
                    >
                        <View style={styles.markerContainer}>
                            <View style={styles.markerBubble}>
                                <Text style={styles.markerText}>{marker.sequenceNumber}</Text>
                            </View>
                            <View style={styles.markerArrow} />
                        </View>
                    </Marker>
                ))}

                {currentLocation && (
                    <Marker
                        key="current-location"
                        coordinate={{
                            latitude: currentLocation.latitude,
                            longitude: currentLocation.longitude,
                        }}
                        tracksViewChanges={false}
                    >
                        <View style={styles.currentLocationMarker}>
                            <View style={styles.currentLocationInner} />
                        </View>
                    </Marker>
                )}
            </MapView>

            <View style={styles.topBar}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.topBarInfo}>
                    <Text style={styles.topBarTitle}>Optimized Route</Text>
                    <Text style={styles.topBarSubtitle}>{markers.length} stops</Text>
                </View>
                <TouchableOpacity style={styles.fitButton} onPress={fitMapToMarkers}>
                    <Ionicons name="scan-outline" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={styles.legendMarker}>
                        <Text style={styles.legendMarkerText}>1</Text>
                    </View>
                    <Text style={styles.legendText}>Delivery Stop</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={styles.legendCurrentLocation} />
                    <Text style={styles.legendText}>Your Location</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={styles.legendRoute} />
                    <Text style={styles.legendText}>Route</Text>
                </View>
            </View>

            <View style={styles.bottomBar}>
                <View style={styles.bottomBarContent}>
                    <View style={styles.bottomBarStats}>
                        <View style={styles.bottomBarStatItem}>
                            <Ionicons name="location" size={20} color={colors.primary} />
                            <Text style={styles.bottomBarStatValue}>{markers.length}</Text>
                            <Text style={styles.bottomBarStatLabel}>Stops</Text>
                        </View>
                        <View style={styles.bottomBarDivider} />
                        <View style={styles.bottomBarStatItem}>
                            <Ionicons name="cube" size={20} color={colors.primary} />
                            <Text style={styles.bottomBarStatValue}>
                                {bookings.reduce((sum, b) => sum + parseInt(b.total_pieces || '0'), 0)}
                            </Text>
                            <Text style={styles.bottomBarStatLabel}>Pieces</Text>
                        </View>
                    </View>
                    {markers.length > 0 && (
                        <TouchableOpacity
                            style={styles.startNavigationButton}
                            onPress={() => openNavigationApp(markers[0])}
                        >
                            <Ionicons name="navigate" size={20} color={colors.background} />
                            <Text style={styles.startNavigationText}>Start Navigation</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {renderDetailModal()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    map: {
        flex: 1,
    },
    topBar: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: layouts.borderRadius.lg,
        padding: layouts.spacing.sm,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: layouts.borderRadius.md,
        backgroundColor: colors.gray100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topBarInfo: {
        flex: 1,
        marginLeft: layouts.spacing.md,
    },
    topBarTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    topBarSubtitle: {
        fontSize: 12,
        color: colors.textLight,
    },
    fitButton: {
        width: 40,
        height: 40,
        borderRadius: layouts.borderRadius.md,
        backgroundColor: colors.gray100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    legend: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 120 : 100,
        right: 16,
        backgroundColor: colors.card,
        borderRadius: layouts.borderRadius.md,
        padding: layouts.spacing.sm,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: layouts.spacing.xs,
    },
    legendMarker: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: layouts.spacing.xs,
    },
    legendMarkerText: {
        color: colors.background,
        fontSize: 10,
        fontWeight: '700',
    },
    legendCurrentLocation: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#4285F4',
        borderWidth: 3,
        borderColor: colors.background,
        marginRight: layouts.spacing.xs,
        marginLeft: 3,
    },
    legendRoute: {
        width: 20,
        height: 4,
        backgroundColor: colors.primary,
        borderRadius: 2,
        marginRight: layouts.spacing.xs,
    },
    legendText: {
        fontSize: 11,
        color: colors.textLight,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.card,
        borderTopLeftRadius: layouts.borderRadius.xl,
        borderTopRightRadius: layouts.borderRadius.xl,
        paddingTop: layouts.spacing.lg,
        paddingBottom: Platform.OS === 'ios' ? 34 : layouts.spacing.lg,
        paddingHorizontal: layouts.spacing.lg,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
    },
    bottomBarContent: {
        gap: layouts.spacing.md,
    },
    bottomBarStats: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: layouts.spacing.xl,
    },
    bottomBarStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: layouts.spacing.xs,
    },
    bottomBarStatValue: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    bottomBarStatLabel: {
        fontSize: 14,
        color: colors.textLight,
    },
    bottomBarDivider: {
        width: 1,
        height: 30,
        backgroundColor: colors.gray300,
    },
    startNavigationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: layouts.borderRadius.lg,
        paddingVertical: layouts.spacing.md,
        gap: layouts.spacing.sm,
    },
    startNavigationText: {
        color: colors.background,
        fontSize: 16,
        fontWeight: '700',
    },
    markerContainer: {
        alignItems: 'center',
    },
    markerBubble: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: colors.background,
    },
    markerText: {
        color: colors.background,
        fontSize: 12,
        fontWeight: '700',
    },
    markerArrow: {
        width: 0,
        height: 0,
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: colors.primary,
        marginTop: -2,
    },
    currentLocationMarker: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(66, 133, 244, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    currentLocationInner: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#4285F4',
        borderWidth: 3,
        borderColor: colors.background,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.card,
        borderTopLeftRadius: layouts.borderRadius.xl,
        borderTopRightRadius: layouts.borderRadius.xl,
        paddingHorizontal: layouts.spacing.lg,
        paddingBottom: Platform.OS === 'ios' ? 34 : layouts.spacing.lg,
        paddingTop: layouts.spacing.sm,
        maxHeight: '80%',
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: colors.gray300,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: layouts.spacing.md,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: layouts.spacing.md,
    },
    modalSequenceBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalSequenceText: {
        color: colors.background,
        fontSize: 16,
        fontWeight: '700',
    },
    modalHeaderText: {
        flex: 1,
        marginLeft: layouts.spacing.md,
    },
    modalMilesRef: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    modalHawb: {
        fontSize: 12,
        color: colors.textLight,
        marginTop: 2,
    },
    modalCloseButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.gray100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalDivider: {
        height: 1,
        backgroundColor: colors.gray200,
        marginBottom: layouts.spacing.md,
    },
    modalSection: {
        marginBottom: layouts.spacing.md,
    },
    modalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: layouts.spacing.xs,
        marginBottom: 4,
    },
    modalLabel: {
        fontSize: 12,
        color: colors.textLight,
        fontWeight: '600',
    },
    modalValue: {
        fontSize: 15,
        color: colors.text,
        marginLeft: 26,
    },
    modalValueSecondary: {
        fontSize: 14,
        color: colors.textLight,
        marginLeft: 26,
        marginTop: 2,
    },
    modalStats: {
        flexDirection: 'row',
        backgroundColor: colors.gray100,
        borderRadius: layouts.borderRadius.lg,
        padding: layouts.spacing.md,
        marginBottom: layouts.spacing.lg,
    },
    modalStatItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    modalStatValue: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    modalStatLabel: {
        fontSize: 11,
        color: colors.textLight,
    },
    modalStatDivider: {
        width: 1,
        height: 40,
        backgroundColor: colors.gray300,
    },
    navigateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: layouts.borderRadius.lg,
        paddingVertical: layouts.spacing.md,
        gap: layouts.spacing.sm,
    },
    navigateButtonText: {
        color: colors.background,
        fontSize: 16,
        fontWeight: '700',
    },
});