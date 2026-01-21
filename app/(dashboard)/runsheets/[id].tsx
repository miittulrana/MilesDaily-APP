import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import LoadingIndicator from '../../../components/LoadingIndicator';
import BookingCard from '../../../components/runsheets/BookingCard';
import { fetchRunsheetDetail } from '../../../lib/runsheetService';
import { optimizeDeliveryRoute } from '../../../lib/routeOptimization';
import { AssignedRunsheet, RunsheetBooking } from '../../../utils/runsheetTypes';

export default function RunsheetDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [runsheet, setRunsheet] = useState<AssignedRunsheet | null>(null);
    const [filteredBookings, setFilteredBookings] = useState<RunsheetBooking[]>([]);
    const [originalBookings, setOriginalBookings] = useState<RunsheetBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'city' | 'company' | 'miles_ref'>('city');
    const [isOptimized, setIsOptimized] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);

    useEffect(() => {
        loadRunsheetDetail();
    }, [id]);

    useEffect(() => {
        if (runsheet && !isOptimized) {
            filterAndSortBookings();
        }
    }, [runsheet, searchQuery, sortBy, isOptimized]);

    const loadRunsheetDetail = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchRunsheetDetail(id);
            setRunsheet(data);
            setOriginalBookings([...data.runsheet.csv_data]);
        } catch (err: any) {
            setError(err.message || 'Failed to load runsheet details');
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortBookings = () => {
        if (!runsheet) return;

        let bookings = [...originalBookings];

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

        bookings.sort((a, b) => {
            if (sortBy === 'city') {
                return a.consignee_city.localeCompare(b.consignee_city);
            } else if (sortBy === 'company') {
                return a.consignee_company.localeCompare(b.consignee_company);
            } else {
                return a.miles_ref.localeCompare(b.miles_ref);
            }
        });

        setFilteredBookings(bookings);
    };

    const handleOptimizeToggle = async (value: boolean) => {
        if (value) {
            await optimizeRoute();
        } else {
            setIsOptimized(false);
            filterAndSortBookings();
        }
    };

    const optimizeRoute = async () => {
        try {
            setIsOptimizing(true);

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Location permission is needed to optimize your route.'
                );
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const startLocation = {
                lat: location.coords.latitude,
                lng: location.coords.longitude,
            };

            let bookingsToOptimize = [...originalBookings];
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                bookingsToOptimize = bookingsToOptimize.filter(
                    (b) =>
                        b.miles_ref.toLowerCase().includes(query) ||
                        b.hawb.toLowerCase().includes(query) ||
                        b.consignee_company.toLowerCase().includes(query) ||
                        b.consignee_name.toLowerCase().includes(query) ||
                        b.consignee_city.toLowerCase().includes(query)
                );
            }

            const optimizedResult = await optimizeDeliveryRoute(
                bookingsToOptimize,
                startLocation
            );

            setFilteredBookings(optimizedResult.optimizedBookings);
            setIsOptimized(true);
        } catch (err: any) {
            console.error('Optimization error:', err);
            Alert.alert(
                'Optimization Failed',
                err.message || 'Failed to optimize route. Please try again.'
            );
            setIsOptimized(false);
        } finally {
            setIsOptimizing(false);
        }
    };

    const renderBooking = ({ item, index }: { item: RunsheetBooking; index: number }) => (
        <BookingCard
            booking={item}
            sequenceNumber={isOptimized ? index + 1 : undefined}
        />
    );

    if (loading) {
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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerInfo}>
                    <Text style={styles.driverName}>{runsheet.runsheet.staff_name}</Text>
                    <Text style={styles.dateRange}>
                        {runsheet.runsheet.date_from} to {runsheet.runsheet.date_to}
                    </Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{filteredBookings.length}</Text>
                            <Text style={styles.statLabel}>Bookings</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>
                                {filteredBookings.reduce((sum, b) => sum + parseInt(b.total_pieces || '0'), 0)}
                            </Text>
                            <Text style={styles.statLabel}>Pieces</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.optimizeContainer}>
                <View style={styles.optimizeRow}>
                    <View style={styles.optimizeInfo}>
                        <Ionicons
                            name="navigate-circle"
                            size={24}
                            color={isOptimized ? colors.success : colors.gray400}
                        />
                        <View>
                            <Text style={styles.optimizeLabel}>Route Optimization</Text>
                            <Text style={styles.optimizeSubtext}>
                                {isOptimized ? 'Optimized route active' : 'Use GPS to optimize delivery order'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.switchContainer}>
                        {isOptimizing ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <Switch
                                value={isOptimized}
                                onValueChange={handleOptimizeToggle}
                                trackColor={{ false: colors.gray300, true: colors.success + '80' }}
                                thumbColor={isOptimized ? colors.success : colors.gray400}
                                ios_backgroundColor={colors.gray300}
                            />
                        )}
                    </View>
                </View>
            </View>

            <View style={styles.controls}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={colors.gray400} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by ref, company, city..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={colors.gray400}
                        editable={!isOptimized}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={colors.gray400} />
                        </TouchableOpacity>
                    )}
                </View>

                {!isOptimized && (
                    <View style={styles.sortContainer}>
                        <Text style={styles.sortLabel}>Sort by:</Text>
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
                )}
            </View>

            <FlatList
                data={filteredBookings}
                renderItem={renderBooking}
                keyExtractor={(item, index) => `${item.miles_ref}-${index}`}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.card,
        padding: layouts.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    headerInfo: {
        gap: layouts.spacing.sm,
    },
    driverName: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
    },
    dateRange: {
        fontSize: 14,
        color: colors.textLight,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: layouts.spacing.md,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.primary,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textLight,
        marginTop: layouts.spacing.xs,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: colors.gray200,
    },
    optimizeContainer: {
        backgroundColor: colors.card,
        padding: layouts.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    optimizeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    optimizeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: layouts.spacing.md,
        flex: 1,
    },
    optimizeLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    optimizeSubtext: {
        fontSize: 12,
        color: colors.textLight,
        marginTop: 2,
    },
    switchContainer: {
        marginLeft: layouts.spacing.md,
    },
    controls: {
        padding: layouts.spacing.lg,
        gap: layouts.spacing.md,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: layouts.borderRadius.lg,
        paddingHorizontal: layouts.spacing.md,
        borderWidth: 1,
        borderColor: colors.gray200,
        gap: layouts.spacing.sm,
    },
    searchInput: {
        flex: 1,
        height: 44,
        fontSize: 14,
        color: colors.text,
    },
    sortContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: layouts.spacing.sm,
    },
    sortLabel: {
        fontSize: 14,
        color: colors.textLight,
        fontWeight: '500',
    },
    sortButton: {
        paddingVertical: layouts.spacing.xs,
        paddingHorizontal: layouts.spacing.md,
        borderRadius: layouts.borderRadius.md,
        backgroundColor: colors.gray100,
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
    listContent: {
        padding: layouts.spacing.lg,
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