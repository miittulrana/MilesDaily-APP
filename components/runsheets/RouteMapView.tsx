import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Linking, Alert, Modal, ScrollView } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { OptimizedStopData } from '../../utils/runsheetTypes';

const WAREHOUSE = { latitude: 35.875204, longitude: 14.4945183 };
const MALTA_REGION: Region = {
    latitude: 35.9375,
    longitude: 14.3754,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
};

interface RouteMapViewProps {
    optimizedStops: OptimizedStopData[];
    currentLocation: {
        latitude: number;
        longitude: number;
    } | null;
    staffName: string;
    totalDistance: number;
    totalDuration: number;
    departureTime: string;
    onClose?: () => void;
}

export default function RouteMapView({
    optimizedStops,
    currentLocation,
    staffName,
    totalDistance,
    totalDuration,
    departureTime,
    onClose
}: RouteMapViewProps) {
    const mapRef = useRef<MapView>(null);
    const [selectedStop, setSelectedStop] = useState<OptimizedStopData | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [mapReady, setMapReady] = useState(false);

    const validStops = optimizedStops.filter(stop => 
        stop.lat && stop.lng && 
        stop.lat !== 0 && stop.lng !== 0 &&
        stop.lat > 35 && stop.lat < 37 &&
        stop.lng > 14 && stop.lng < 15
    );

    useEffect(() => {
        if (mapReady && validStops.length > 0 && mapRef.current) {
            setTimeout(() => {
                fitMapToMarkers();
            }, 1000);
        }
    }, [mapReady, validStops.length]);

    const fitMapToMarkers = () => {
        if (validStops.length === 0 || !mapRef.current) {
            mapRef.current?.animateToRegion(MALTA_REGION, 500);
            return;
        }

        const allCoordinates = [
            WAREHOUSE,
            ...validStops.map(stop => ({
                latitude: stop.lat,
                longitude: stop.lng,
            })),
        ];

        if (currentLocation && currentLocation.latitude > 35 && currentLocation.latitude < 37) {
            allCoordinates.push(currentLocation);
        }

        try {
            mapRef.current.fitToCoordinates(allCoordinates, {
                edgePadding: { top: 150, right: 80, bottom: 220, left: 80 },
                animated: true,
            });
        } catch (e) {
            console.log('fitToCoordinates error:', e);
            mapRef.current?.animateToRegion(MALTA_REGION, 500);
        }
    };

    const handleMapReady = () => {
        setMapReady(true);
    };

    const handleMarkerPress = (stop: OptimizedStopData) => {
        setSelectedStop(stop);
        setShowDetailModal(true);
    };

    const openWazeNavigation = async (stop: OptimizedStopData) => {
        const wazeUrl = `waze://?ll=${stop.lat},${stop.lng}&navigate=yes`;
        const wazeWebUrl = `https://waze.com/ul?ll=${stop.lat},${stop.lng}&navigate=yes`;

        try {
            const canOpen = await Linking.canOpenURL(wazeUrl);
            if (canOpen) {
                await Linking.openURL(wazeUrl);
            } else {
                // Fallback to web URL if Waze app is not installed
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
            console.error('Error opening Waze:', error);
            Alert.alert('Error', 'Failed to open Waze navigation.');
        }
    };

    const handleNavigateFromModal = () => {
        if (selectedStop) {
            setShowDetailModal(false);
            setTimeout(() => {
                openWazeNavigation(selectedStop);
            }, 300);
        }
    };

    const handleCallPhone = (phone: string) => {
        const phoneUrl = `tel:${phone.replace(/\s/g, '')}`;
        Linking.openURL(phoneUrl);
    };

    const getConfidenceColor = (confidence: string) => {
        if (confidence === 'high') return colors.success;
        if (confidence === 'medium') return colors.warning;
        if (confidence === 'low') return colors.error;
        return colors.gray400;
    };

    const routeCoordinates = [
        WAREHOUSE,
        ...validStops.map(stop => ({
            latitude: stop.lat,
            longitude: stop.lng,
        })),
        WAREHOUSE,
    ];

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    const renderDetailModal = () => {
        if (!selectedStop) return null;

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
                                <Text style={styles.modalSequenceText}>{selectedStop.stop_number}</Text>
                            </View>
                            <View style={styles.modalHeaderText}>
                                <Text style={styles.modalMilesRef}>{selectedStop.miles_ref}</Text>
                                <Text style={styles.modalEta}>ETA: {selectedStop.eta}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setShowDetailModal(false)}
                            >
                                <Ionicons name="close" size={24} color={colors.gray500} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalDivider} />

                        <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
                            <View style={styles.modalSection}>
                                <View style={styles.modalRow}>
                                    <Ionicons name="business" size={18} color={colors.primary} />
                                    <Text style={styles.modalLabel}>Company</Text>
                                </View>
                                <Text style={styles.modalValue}>{selectedStop.consignee_company || 'N/A'}</Text>
                            </View>

                            {selectedStop.consignee_name && (
                                <View style={styles.modalSection}>
                                    <View style={styles.modalRow}>
                                        <Ionicons name="person" size={18} color={colors.primary} />
                                        <Text style={styles.modalLabel}>Contact</Text>
                                    </View>
                                    <Text style={styles.modalValue}>{selectedStop.consignee_name}</Text>
                                </View>
                            )}

                            <View style={styles.modalSection}>
                                <View style={styles.modalRow}>
                                    <Ionicons name="location" size={18} color={colors.primary} />
                                    <Text style={styles.modalLabel}>Address</Text>
                                </View>
                                <Text style={styles.modalValue}>
                                    {selectedStop.cleaned_address || selectedStop.consignee_address}
                                </Text>
                                <Text style={styles.modalValueSecondary}>
                                    {selectedStop.consignee_city}
                                    {selectedStop.consignee_postcode ? `, ${selectedStop.consignee_postcode}` : ''}
                                </Text>
                                <View style={styles.confidenceRow}>
                                    <View style={[styles.confidenceDot, { backgroundColor: getConfidenceColor(selectedStop.geocode_confidence) }]} />
                                    <Text style={styles.confidenceText}>{selectedStop.geocode_confidence} confidence</Text>
                                </View>
                            </View>

                            {selectedStop.consignee_mobile && (
                                <View style={styles.modalSection}>
                                    <View style={styles.modalRow}>
                                        <Ionicons name="call" size={18} color={colors.primary} />
                                        <Text style={styles.modalLabel}>Mobile</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => handleCallPhone(selectedStop.consignee_mobile)}>
                                        <Text style={[styles.modalValue, styles.phoneLink]}>{selectedStop.consignee_mobile}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <View style={styles.modalSection}>
                                <View style={styles.modalRow}>
                                    <Ionicons name="navigate" size={18} color={colors.primary} />
                                    <Text style={styles.modalLabel}>Route Info</Text>
                                </View>
                                <Text style={styles.modalValue}>
                                    {selectedStop.distance_from_prev_km} km from previous stop
                                </Text>
                                <Text style={styles.modalValueSecondary}>
                                    ~{selectedStop.duration_from_prev_min} min drive
                                </Text>
                            </View>

                            <View style={styles.modalStats}>
                                <View style={styles.modalStatItem}>
                                    <Ionicons name="cube-outline" size={20} color={colors.primary} />
                                    <Text style={styles.modalStatValue}>{selectedStop.total_pieces}</Text>
                                    <Text style={styles.modalStatLabel}>Pieces</Text>
                                </View>
                                <View style={styles.modalStatDivider} />
                                <View style={styles.modalStatItem}>
                                    <Ionicons name="barbell-outline" size={20} color={colors.primary} />
                                    <Text style={styles.modalStatValue}>{parseFloat(selectedStop.total_weight || '0').toFixed(1)}</Text>
                                    <Text style={styles.modalStatLabel}>Kg</Text>
                                </View>
                                {selectedStop.service_type && (
                                    <>
                                        <View style={styles.modalStatDivider} />
                                        <View style={styles.modalStatItem}>
                                            <Ionicons name="flash-outline" size={20} color={colors.primary} />
                                            <Text style={styles.modalStatValue}>{selectedStop.service_type}</Text>
                                            <Text style={styles.modalStatLabel}>Service</Text>
                                        </View>
                                    </>
                                )}
                            </View>
                        </ScrollView>

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
                onMapReady={handleMapReady}
                initialRegion={MALTA_REGION}
            >
                {routeCoordinates.length > 1 && (
                    <Polyline
                        coordinates={routeCoordinates}
                        strokeColor={colors.primary}
                        strokeWidth={4}
                    />
                )}

                <Marker
                    coordinate={WAREHOUSE}
                    title="Miles Express Warehouse"
                    description="Start / End Point"
                >
                    <View style={styles.warehouseMarker}>
                        <Ionicons name="star" size={16} color={colors.background} />
                    </View>
                </Marker>

                {validStops.map((stop) => (
                    <Marker
                        key={`marker-${stop.miles_ref}-${stop.stop_number}`}
                        coordinate={{ latitude: stop.lat, longitude: stop.lng }}
                        onPress={() => handleMarkerPress(stop)}
                    >
                        <View style={styles.markerContainer}>
                            <View style={styles.markerBubble}>
                                <Text style={styles.markerText}>{stop.stop_number}</Text>
                            </View>
                            <View style={styles.markerArrow} />
                        </View>
                    </Marker>
                ))}

                {currentLocation && currentLocation.latitude > 35 && currentLocation.latitude < 37 && (
                    <Marker
                        coordinate={currentLocation}
                        title="Your Location"
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
                    <Text style={styles.topBarSubtitle}>{staffName} • Departure: {departureTime}</Text>
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
                    <View style={styles.legendWarehouse}>
                        <Ionicons name="star" size={10} color={colors.background} />
                    </View>
                    <Text style={styles.legendText}>Warehouse</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={styles.legendCurrentLocation} />
                    <Text style={styles.legendText}>Your Location</Text>
                </View>
            </View>

            <View style={styles.bottomBar}>
                <View style={styles.bottomBarContent}>
                    <View style={styles.bottomBarStats}>
                        <View style={styles.bottomBarStatItem}>
                            <Ionicons name="location" size={20} color={colors.primary} />
                            <Text style={styles.bottomBarStatValue}>{validStops.length}</Text>
                            <Text style={styles.bottomBarStatLabel}>Stops</Text>
                        </View>
                        <View style={styles.bottomBarDivider} />
                        <View style={styles.bottomBarStatItem}>
                            <Ionicons name="navigate" size={20} color={colors.primary} />
                            <Text style={styles.bottomBarStatValue}>{totalDistance.toFixed(1)}</Text>
                            <Text style={styles.bottomBarStatLabel}>km</Text>
                        </View>
                        <View style={styles.bottomBarDivider} />
                        <View style={styles.bottomBarStatItem}>
                            <Ionicons name="time" size={20} color={colors.primary} />
                            <Text style={styles.bottomBarStatValue}>{formatDuration(totalDuration)}</Text>
                            <Text style={styles.bottomBarStatLabel}>drive</Text>
                        </View>
                    </View>
                    <Text style={styles.bottomBarHint}>Tap any stop to navigate</Text>
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
    legendWarehouse: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.success,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: layouts.spacing.xs,
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
        gap: layouts.spacing.sm,
    },
    bottomBarStats: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: layouts.spacing.lg,
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
    bottomBarHint: {
        fontSize: 12,
        color: colors.textLight,
        textAlign: 'center',
        marginTop: layouts.spacing.xs,
    },
    warehouseMarker: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.success,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: colors.background,
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
    modalEta: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
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
    modalScrollContent: {
        maxHeight: 300,
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
    phoneLink: {
        color: colors.primary,
        textDecorationLine: 'underline',
    },
    confidenceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 26,
        marginTop: 4,
        gap: 6,
    },
    confidenceDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    confidenceText: {
        fontSize: 12,
        color: colors.textLight,
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