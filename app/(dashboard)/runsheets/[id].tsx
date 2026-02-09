import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import LoadingIndicator from '../../../components/LoadingIndicator';
import BookingCard from '../../../components/runsheets/BookingCard';
import AcknowledgementModal from '../../../components/runsheets/AcknowledgementModal';
import { fetchRunsheetDetail, fetchBookingStatuses, fetchRouteOptimization } from '../../../lib/runsheetService';
import { AssignedRunsheet, RunsheetBooking, BookingStatusMap, RouteOptimizationData, OptimizedStopData } from '../../../utils/runsheetTypes';
import { isBizhandleLoggedIn } from '../../../lib/bizhandleAuth';
import { checkAcknowledgementExists, saveAcknowledgement } from '../../../lib/runsheetAcknowledgement';
import { supabase } from '../../../lib/supabase';

export default function RunsheetDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [runsheet, setRunsheet] = useState<AssignedRunsheet | null>(null);
    const [routeOptimization, setRouteOptimization] = useState<RouteOptimizationData | null>(null);
    const [displayBookings, setDisplayBookings] = useState<RunsheetBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'sequence' | 'city' | 'company' | 'miles_ref'>('sequence');
    const [showAcknowledgementModal, setShowAcknowledgementModal] = useState(false);
    const [isAcknowledged, setIsAcknowledged] = useState(false);
    const [checkingAcknowledgement, setCheckingAcknowledgement] = useState(true);
    const [bookingStatuses, setBookingStatuses] = useState<BookingStatusMap>({});
    const [loadingStatuses, setLoadingStatuses] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadRunsheetDetail();
    }, [id]);

    useEffect(() => {
        if (runsheet) {
            prepareDisplayBookings();
        }
    }, [runsheet, routeOptimization, searchQuery, sortBy]);

    const loadBookingStatuses = async (runsheetData: AssignedRunsheet) => {
        try {
            setLoadingStatuses(true);
            const bookings = runsheetData.runsheet.csv_data;
            if (bookings.length === 0) {
                return;
            }
            const originalStaffId = runsheetData.runsheet.staff_id;
            const statuses = await fetchBookingStatuses(bookings, originalStaffId);
            setBookingStatuses(statuses);
        } catch (err) {
            console.error('Error loading booking statuses:', err);
        } finally {
            setLoadingStatuses(false);
        }
    };

    const loadRunsheetDetail = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchRunsheetDetail(id);
            setRunsheet(data);

            console.log('[RunsheetDetail] is_optimized:', data.is_optimized);
            console.log('[RunsheetDetail] optimization_id:', data.optimization_id);

            // KEY FIX: Use optimization_id (not runsheet_id) to fetch from route_optimizations
            if (data.is_optimized && data.optimization_id) {
                console.log('[RunsheetDetail] Fetching optimization data...');
                const optimization = await fetchRouteOptimization(data.optimization_id);
                console.log('[RunsheetDetail] Optimization result:', optimization ? 'Found' : 'Not found');
                if (optimization) {
                    console.log('[RunsheetDetail] Optimized stops count:', optimization.optimized_stops?.length || 0);
                }
                setRouteOptimization(optimization);
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const acknowledged = await checkAcknowledgementExists(id, user.id);
                setIsAcknowledged(acknowledged);
                if (!acknowledged) {
                    setShowAcknowledgementModal(true);
                }
            }

            await loadBookingStatuses(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load runsheet details');
        } finally {
            setLoading(false);
            setCheckingAcknowledgement(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadRunsheetDetail();
        setRefreshing(false);
    };

    const prepareDisplayBookings = () => {
        if (!runsheet) return;

        let bookings: RunsheetBooking[] = [];

        if (runsheet.is_optimized && routeOptimization && routeOptimization.optimized_stops && routeOptimization.optimized_stops.length > 0) {
            bookings = routeOptimization.optimized_stops.map((stop: OptimizedStopData) => ({
                miles_ref: stop.miles_ref,
                hawb: stop.hawb || '',
                consignee_company: stop.consignee_company,
                consignee_name: stop.consignee_name,
                consignee_address: stop.cleaned_address || stop.consignee_address,
                consignee_city: stop.consignee_city,
                consignee_postcode: stop.consignee_postcode,
                consignee_mobile: stop.consignee_mobile,
                service_type: stop.service_type,
                driver_name: runsheet.runsheet.staff_name,
                total_pieces: stop.total_pieces,
                total_weight: stop.total_weight,
            }));
        } else {
            bookings = [...runsheet.runsheet.csv_data];
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            bookings = bookings.filter(
                (b) =>
                    b.miles_ref.toLowerCase().includes(query) ||
                    b.hawb.toLowerCase().includes(query) ||
                    b.consignee_company.toLowerCase().includes(query) ||
                    b.consignee_name.toLowerCase().includes(query) ||
                    b.consignee_city.toLowerCase().includes(query)
            );
        }

        if (!runsheet.is_optimized || sortBy !== 'sequence') {
            bookings.sort((a, b) => {
                if (sortBy === 'city') {
                    return a.consignee_city.localeCompare(b.consignee_city);
                } else if (sortBy === 'company') {
                    return a.consignee_company.localeCompare(b.consignee_company);
                } else if (sortBy === 'miles_ref') {
                    return a.miles_ref.localeCompare(b.miles_ref);
                }
                return 0;
            });
        }

        setDisplayBookings(bookings);
    };

    const handleViewMap = () => {
        if (!runsheet || !runsheet.is_optimized || !routeOptimization || !routeOptimization.optimized_stops) {
            Alert.alert('Not Available', 'Route map is only available for optimized runsheets.');
            return;
        }

        console.log('[handleViewMap] Passing', routeOptimization.optimized_stops.length, 'stops to map');

        router.push({
            pathname: '/(dashboard)/runsheets/route-map',
            params: {
                runsheetId: id,
                optimizedData: JSON.stringify(routeOptimization.optimized_stops),
                staffName: runsheet.runsheet.staff_name,
                totalDistance: routeOptimization.total_distance_km.toString(),
                totalDuration: routeOptimization.total_duration_minutes.toString(),
                departureTime: routeOptimization.departure_time || '07:30',
            },
        });
    };

    const handleBookingPress = async (booking: RunsheetBooking) => {
        const isLoggedIn = await isBizhandleLoggedIn();

        if (!isLoggedIn) {
            Alert.alert(
                'Bizhandle Login Required',
                'You need to login to Bizhandle to scan bookings.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Login',
                        onPress: () => {
                            router.push({
                                pathname: '/(dashboard)/bookings/login',
                            });
                        },
                    },
                ]
            );
            return;
        }

        const bookingRef = (booking.customer_id === 109 || booking.customer_id === 990)
            ? booking.hawb
            : booking.miles_ref;

        router.push({
            pathname: '/(dashboard)/bookings/single-scan',
            params: { bookingRef },
        });
    };

    const handleAcknowledge = async (signature: string) => {
        if (!runsheet) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }

        const totalPieces = runsheet.runsheet.csv_data.reduce(
            (sum, b) => sum + parseInt(b.total_pieces || '0'),
            0
        );

        const driverName = `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email;

        const result = await saveAcknowledgement({
            runsheetId: id,
            driverId: user.id,
            driverName: driverName || user.email || 'Unknown Driver',
            signatureBase64: signature,
            runsheetDetails: {
                staffName: runsheet.runsheet.staff_name,
                dateFrom: runsheet.runsheet.date_from,
                dateTo: runsheet.runsheet.date_to,
                totalBookings: runsheet.runsheet.csv_data.length,
                totalPieces: totalPieces,
            }
        });

        if (result.success) {
            setIsAcknowledged(true);
            setShowAcknowledgementModal(false);
            Alert.alert('Success', 'Run-sheet acknowledged successfully!');
        } else {
            Alert.alert('Error', result.error || 'Failed to save acknowledgement');
        }
    };

    const getSequenceNumber = (booking: RunsheetBooking, index: number): number | undefined => {
        if (!runsheet?.is_optimized || !routeOptimization?.optimized_stops) {
            return undefined;
        }
        const optimizedStop = routeOptimization.optimized_stops.find(
            (stop: OptimizedStopData) => stop.miles_ref === booking.miles_ref
        );
        return optimizedStop?.stop_number;
    };

    const renderBooking = ({ item, index }: { item: RunsheetBooking; index: number }) => {
        const bookingStatus = bookingStatuses[item.miles_ref];
        const sequenceNumber = getSequenceNumber(item, index);

        return (
            <BookingCard
                booking={item}
                sequenceNumber={sequenceNumber}
                onPress={() => handleBookingPress(item)}
                currentStatus={bookingStatus}
            />
        );
    };

    if (loading || checkingAcknowledgement) {
        return <LoadingIndicator fullScreen message="Loading runsheet details..." />;
    }

    if (error || !runsheet) {
        return (
            <View style={styles.errorState}>
                <Ionicons name="alert-circle" size={64} color={colors.error} />
                <Text style={styles.errorTitle}>Failed to Load</Text>
                <Text style={styles.errorDescription}>{error || 'Runsheet not found'}</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const hasOptimizedMap = runsheet.is_optimized && routeOptimization && routeOptimization.optimized_stops && routeOptimization.optimized_stops.length > 0;

    return (
        <View style={styles.container}>
            <View style={styles.compactHeader}>
                {runsheet.is_optimized && routeOptimization && (
                    <View style={styles.optimizedBanner}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                        <Text style={styles.optimizedText}>Route Optimized</Text>
                        <Text style={styles.optimizedCount}>
                            {routeOptimization.optimized_stops?.length || 0} stops • {routeOptimization.total_distance_km}km • {Math.round(routeOptimization.total_duration_minutes)}min
                        </Text>
                    </View>
                )}

                {hasOptimizedMap && (
                    <TouchableOpacity
                        style={styles.viewMapButton}
                        onPress={handleViewMap}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="map" size={20} color={colors.background} />
                        <Text style={styles.viewMapButtonText}>View Route Map</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.controls}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={18} color={colors.gray400} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={colors.gray400}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color={colors.gray400} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.sortContainer}>
                    {runsheet.is_optimized && (
                        <TouchableOpacity
                            style={[styles.sortButton, sortBy === 'sequence' && styles.sortButtonActive]}
                            onPress={() => setSortBy('sequence')}
                        >
                            <Text style={[styles.sortButtonText, sortBy === 'sequence' && styles.sortButtonTextActive]}>
                                Route
                            </Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.sortButton, sortBy === 'city' && styles.sortButtonActive]}
                        onPress={() => setSortBy('city')}
                    >
                        <Text style={[styles.sortButtonText, sortBy === 'city' && styles.sortButtonTextActive]}>
                            City
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.sortButton, sortBy === 'company' && styles.sortButtonActive]}
                        onPress={() => setSortBy('company')}
                    >
                        <Text style={[styles.sortButtonText, sortBy === 'company' && styles.sortButtonTextActive]}>
                            Company
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.sortButton, sortBy === 'miles_ref' && styles.sortButtonActive]}
                        onPress={() => setSortBy('miles_ref')}
                    >
                        <Text style={[styles.sortButtonText, sortBy === 'miles_ref' && styles.sortButtonTextActive]}>
                            Ref
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {loadingStatuses && (
                <View style={styles.statusLoadingBanner}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.statusLoadingText}>Loading status updates...</Text>
                </View>
            )}

            <FlatList
                data={displayBookings}
                renderItem={renderBooking}
                keyExtractor={(item, index) => `${item.miles_ref}-${index}`}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                }
            />

            {runsheet && (
                <AcknowledgementModal
                    visible={showAcknowledgementModal}
                    runsheetId={id}
                    staffName={runsheet.runsheet.staff_name}
                    dateFrom={runsheet.runsheet.date_from}
                    dateTo={runsheet.runsheet.date_to}
                    totalBookings={runsheet.runsheet.csv_data.length}
                    totalPieces={runsheet.runsheet.csv_data.reduce((sum, b) => sum + parseInt(b.total_pieces || '0'), 0)}
                    onAcknowledge={handleAcknowledge}
                    onCancel={() => router.back()}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    compactHeader: {
        backgroundColor: colors.card,
        padding: layouts.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
        gap: layouts.spacing.sm,
    },
    optimizedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.success + '15',
        paddingVertical: layouts.spacing.sm,
        paddingHorizontal: layouts.spacing.md,
        borderRadius: layouts.borderRadius.md,
        gap: layouts.spacing.sm,
    },
    optimizedText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.success,
    },
    optimizedCount: {
        flex: 1,
        fontSize: 12,
        color: colors.success,
        fontWeight: '500',
        textAlign: 'right',
    },
    viewMapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: layouts.borderRadius.md,
        paddingVertical: layouts.spacing.sm,
        paddingHorizontal: layouts.spacing.lg,
        gap: layouts.spacing.xs,
    },
    viewMapButtonText: {
        color: colors.background,
        fontSize: 14,
        fontWeight: '700',
    },
    controls: {
        padding: layouts.spacing.md,
        gap: layouts.spacing.sm,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: layouts.borderRadius.md,
        paddingHorizontal: layouts.spacing.sm,
        borderWidth: 1,
        borderColor: colors.gray200,
        gap: layouts.spacing.xs,
        height: 40,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: colors.text,
    },
    sortContainer: {
        flexDirection: 'row',
        gap: layouts.spacing.xs,
    },
    sortButton: {
        flex: 1,
        paddingVertical: layouts.spacing.xs,
        paddingHorizontal: layouts.spacing.sm,
        borderRadius: layouts.borderRadius.md,
        backgroundColor: colors.gray100,
        alignItems: 'center',
    },
    sortButtonActive: {
        backgroundColor: colors.primary,
    },
    sortButtonText: {
        fontSize: 12,
        color: colors.text,
        fontWeight: '500',
    },
    sortButtonTextActive: {
        color: colors.background,
    },
    statusLoadingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.info + '15',
        paddingVertical: layouts.spacing.sm,
        gap: layouts.spacing.sm,
    },
    statusLoadingText: {
        fontSize: 12,
        color: colors.info,
        fontWeight: '500',
    },
    listContent: {
        padding: layouts.spacing.md,
    },
    errorState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: layouts.spacing.xl,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.text,
        marginTop: layouts.spacing.lg,
        marginBottom: layouts.spacing.sm,
    },
    errorDescription: {
        fontSize: 14,
        color: colors.textLight,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: layouts.spacing.xl,
    },
    backButton: {
        backgroundColor: colors.primary,
        paddingVertical: layouts.spacing.md,
        paddingHorizontal: layouts.spacing.xl,
        borderRadius: layouts.borderRadius.lg,
    },
    backButtonText: {
        color: colors.background,
        fontSize: 16,
        fontWeight: '600',
    },
});