import Constants from 'expo-constants';
import { GeocodedAddress, OptimizedRoute, RouteWaypoint } from '../utils/routeTypes';
import { RunsheetBooking } from '../utils/runsheetTypes';
import { standardizeCityName } from '../utils/cityUtils';

const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const GEOCODING_API_KEY = Constants.expoConfig?.extra?.googleGeocodingApiKey ||
    process.env.EXPO_PUBLIC_GOOGLE_GEOCODING_API_KEY || GOOGLE_MAPS_API_KEY;
const ROUTE_API_KEY = Constants.expoConfig?.extra?.googleRouteApiKey ||
    process.env.EXPO_PUBLIC_GOOGLE_ROUTE_API_KEY || GOOGLE_MAPS_API_KEY;

const GEOCODING_BASE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const ROUTES_BASE_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

const MAX_WAYPOINTS = 25;
const geocodeCache = new Map<string, { lat: number; lng: number }>();

const DEBUG_MODE = true;

export function getGeocodeCache(): Map<string, { lat: number; lng: number }> {
    return geocodeCache;
}

export function getGeocodeCacheAsObject(): { [key: string]: { lat: number; lng: number } } {
    const obj: { [key: string]: { lat: number; lng: number } } = {};
    geocodeCache.forEach((value, key) => {
        obj[key] = value;
    });
    return obj;
}

export async function optimizeDeliveryRoute(
    bookings: RunsheetBooking[],
    startLocation: { lat: number; lng: number }
): Promise<OptimizedRoute> {
    if (DEBUG_MODE) {
        console.log('═══════════════════════════════════════');
        console.log('🚀 ROUTE OPTIMIZATION STARTED');
        console.log('═══════════════════════════════════════');
        console.log('📍 Start Location:', startLocation);
        console.log('📦 Total Bookings:', bookings.length);
    }

    if (bookings.length === 0) {
        if (DEBUG_MODE) console.log('⚠️  No bookings to optimize');
        return {
            optimizedBookings: [],
            totalDistance: 0,
            totalDuration: 0,
            waypoints: [],
        };
    }

    if (bookings.length === 1) {
        if (DEBUG_MODE) console.log('ℹ️  Only 1 booking, no optimization needed');
        const address = buildFullAddress(bookings[0]);
        const location = await geocodeAddress(address);
        const waypoints: RouteWaypoint[] = location ? [{
            location,
            address,
            bookingIndex: 0,
        }] : [];

        return {
            optimizedBookings: bookings,
            totalDistance: 0,
            totalDuration: 0,
            waypoints,
        };
    }

    try {
        if (DEBUG_MODE) console.log('\n🗺️  PHASE 1: Geocoding addresses...');
        const geocodedAddresses = await geocodeBookingAddresses(bookings);

        const validDestinations = geocodedAddresses
            .filter((addr) => addr.location !== null)
            .map((addr, idx) => ({
                location: addr.location!,
                address: addr.address,
                bookingIndex: idx,
            }));

        if (DEBUG_MODE) {
            console.log(`✅ Successfully geocoded: ${validDestinations.length}/${bookings.length}`);
        }

        if (validDestinations.length === 0) {
            throw new Error('No valid addresses could be geocoded');
        }

        if (DEBUG_MODE) console.log('\n🧮 PHASE 2: Computing optimal route...');

        let optimizedOrder: number[];

        if (validDestinations.length > MAX_WAYPOINTS) {
            if (DEBUG_MODE) {
                console.log(`⚠️  ${validDestinations.length} waypoints exceeds Google's limit of ${MAX_WAYPOINTS}`);
                console.log('🏙️  Using smart city-grouped optimization...');
            }
            optimizedOrder = optimizeByCityGroups(startLocation, validDestinations, bookings);
        } else {
            optimizedOrder = await computeOptimalRoute(startLocation, validDestinations, bookings);
        }

        const optimizedBookings = optimizedOrder.map((index) => bookings[index]);

        const optimizedWaypoints: RouteWaypoint[] = optimizedOrder
            .map((index) => {
                const dest = validDestinations.find(d => d.bookingIndex === index);
                if (dest) {
                    return {
                        location: dest.location,
                        address: dest.address,
                        bookingIndex: index,
                    };
                }
                return null;
            })
            .filter((wp): wp is RouteWaypoint => wp !== null);

        if (DEBUG_MODE) {
            printOptimizationResults(bookings, optimizedBookings);
        }

        return {
            optimizedBookings,
            totalDistance: 0,
            totalDuration: 0,
            waypoints: optimizedWaypoints,
        };
    } catch (error) {
        console.error('❌ Route optimization error:', error);
        throw error;
    }
}

function optimizeByCityGroups(
    origin: { lat: number; lng: number },
    destinations: RouteWaypoint[],
    bookings: RunsheetBooking[]
): number[] {
    if (DEBUG_MODE) {
        console.log('\n  📍 Step 1: Standardizing and grouping cities...');
    }

    const cityGroups = new Map<string, number[]>();
    const cityStandardization = new Map<string, string>();

    bookings.forEach((booking, idx) => {
        const originalCity = booking.consignee_city;
        const standardCity = standardizeCityName(originalCity) || originalCity.trim();

        if (!cityStandardization.has(originalCity)) {
            cityStandardization.set(originalCity, standardCity);
        }

        if (!cityGroups.has(standardCity)) {
            cityGroups.set(standardCity, []);
        }
        cityGroups.get(standardCity)!.push(idx);
    });

    if (DEBUG_MODE) {
        console.log(`  ✅ Standardized to ${cityGroups.size} unique cities:`);

        const cityMappings = new Map<string, Set<string>>();
        cityStandardization.forEach((standard, original) => {
            if (!cityMappings.has(standard)) {
                cityMappings.set(standard, new Set());
            }
            cityMappings.get(standard)!.add(original);
        });

        cityMappings.forEach((originals, standard) => {
            const count = cityGroups.get(standard)?.length || 0;
            const variants = Array.from(originals).join(', ');
            console.log(`    • ${standard}: ${count} parcels`);
            if (originals.size > 1) {
                console.log(`      (merged: ${variants})`);
            }
        });
    }

    const cityCentroids = new Map<string, { lat: number; lng: number }>();

    cityGroups.forEach((indices, city) => {
        const cityLocations = indices
            .map(idx => destinations[idx]?.location)
            .filter(loc => loc !== null && loc !== undefined);

        if (cityLocations.length > 0) {
            const avgLat = cityLocations.reduce((sum, loc) => sum + loc.lat, 0) / cityLocations.length;
            const avgLng = cityLocations.reduce((sum, loc) => sum + loc.lng, 0) / cityLocations.length;
            cityCentroids.set(city, { lat: avgLat, lng: avgLng });
        }
    });

    if (DEBUG_MODE) {
        console.log('\n  🎯 Step 2: Optimizing city visit order (nearest-first)...');
    }

    const unvisitedCities = new Set(cityGroups.keys());
    const cityVisitOrder: string[] = [];
    let currentLocation = origin;

    while (unvisitedCities.size > 0) {
        let nearestCity: string | null = null;
        let nearestDistance = Infinity;

        unvisitedCities.forEach((city) => {
            const centroid = cityCentroids.get(city);
            if (centroid) {
                const distance = calculateDistance(
                    currentLocation.lat,
                    currentLocation.lng,
                    centroid.lat,
                    centroid.lng
                );

                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestCity = city;
                }
            }
        });

        if (nearestCity) {
            cityVisitOrder.push(nearestCity);
            unvisitedCities.delete(nearestCity);
            const nextCentroid = cityCentroids.get(nearestCity);
            if (nextCentroid) {
                currentLocation = nextCentroid;
            }
        } else {
            break;
        }
    }

    if (DEBUG_MODE) {
        console.log(`  ✅ City order: ${cityVisitOrder.join(' → ')}`);
        console.log('\n  📦 Step 3: Sorting parcels within each city...');
    }

    const finalOrder: number[] = [];

    cityVisitOrder.forEach((city) => {
        const cityIndices = cityGroups.get(city) || [];

        if (cityIndices.length === 1) {
            finalOrder.push(cityIndices[0]);
        } else {
            const sortedCityIndices = cityIndices.sort((a, b) => {
                const locA = destinations[a]?.location;
                const locB = destinations[b]?.location;

                if (!locA || !locB) return 0;

                const distA = calculateDistance(currentLocation.lat, currentLocation.lng, locA.lat, locA.lng);
                const distB = calculateDistance(currentLocation.lat, currentLocation.lng, locB.lat, locB.lng);

                return distA - distB;
            });

            finalOrder.push(...sortedCityIndices);

            const lastIndex = sortedCityIndices[sortedCityIndices.length - 1];
            const lastLocation = destinations[lastIndex]?.location;
            if (lastLocation) {
                currentLocation = lastLocation;
            }
        }
    });

    if (DEBUG_MODE) {
        console.log(`  ✅ Optimization complete: ${finalOrder.length} parcels ordered`);
    }

    return finalOrder;
}

async function computeOptimalRoute(
    origin: { lat: number; lng: number },
    destinations: RouteWaypoint[],
    bookings: RunsheetBooking[]
): Promise<number[]> {
    if (destinations.length <= 1) {
        return destinations.map((_, idx) => idx);
    }

    try {
        const requestBody = {
            origin: {
                location: {
                    latLng: {
                        latitude: origin.lat,
                        longitude: origin.lng,
                    },
                },
            },
            destination: {
                location: {
                    latLng: {
                        latitude: destinations[destinations.length - 1].location.lat,
                        longitude: destinations[destinations.length - 1].location.lng,
                    },
                },
            },
            intermediates: destinations.slice(0, -1).map((dest) => ({
                location: {
                    latLng: {
                        latitude: dest.location.lat,
                        longitude: dest.location.lng,
                    },
                },
            })),
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_AWARE',
            computeAlternativeRoutes: false,
            optimizeWaypointOrder: true,
        };

        if (DEBUG_MODE) {
            console.log('  📡 Using Google Routes API (≤25 waypoints)...');
        }

        const response = await fetch(ROUTES_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': ROUTE_API_KEY,
                'X-Goog-FieldMask': 'routes.optimizedIntermediateWaypointIndex',
            },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const optimizedIndices = route.optimizedIntermediateWaypointIndex || [];
            const finalOrder = [...optimizedIndices, destinations.length - 1];

            if (DEBUG_MODE) {
                console.log('  ✅ Google optimization complete');
            }

            return finalOrder;
        }

        if (DEBUG_MODE) {
            console.log('  ⚠️  API failed, using city-grouped fallback');
        }
        return optimizeByCityGroups(origin, destinations, bookings);
    } catch (error) {
        console.error('❌ Routes API error:', error);
        return optimizeByCityGroups(origin, destinations, bookings);
    }
}

function printOptimizationResults(
    originalBookings: RunsheetBooking[],
    optimizedBookings: RunsheetBooking[]
): void {
    console.log('\n📊 OPTIMIZATION RESULTS:');
    console.log('═══════════════════════════════════════');

    const citySequence = Array.from(
        new Set(optimizedBookings.map(b => standardizeCityName(b.consignee_city) || b.consignee_city))
    );
    console.log('🗺️  City Visit Order:');
    console.log('   ', citySequence.join(' → '));

    console.log('\n📦 Delivery Sequence (first 15):');
    optimizedBookings.slice(0, 15).forEach((b, idx) => {
        const standardCity = standardizeCityName(b.consignee_city) || b.consignee_city;
        console.log(`  ${(idx + 1).toString().padStart(2)}. ${b.miles_ref} - ${standardCity}`);
    });

    if (optimizedBookings.length > 15) {
        console.log(`  ... and ${optimizedBookings.length - 15} more`);
    }

    const orderChanged = JSON.stringify(originalBookings.map(b => b.miles_ref)) !==
        JSON.stringify(optimizedBookings.map(b => b.miles_ref));

    console.log('\n' + (orderChanged ? '✅ Route optimized successfully!' : '⚠️  Route unchanged'));
    console.log('═══════════════════════════════════════\n');
}

function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

async function geocodeBookingAddresses(
    bookings: RunsheetBooking[]
): Promise<GeocodedAddress[]> {
    const geocodePromises = bookings.map(async (booking, index) => {
        const address = buildFullAddress(booking);

        if (geocodeCache.has(address)) {
            return {
                address,
                location: geocodeCache.get(address)!,
                success: true,
            };
        }

        try {
            const location = await geocodeAddress(address);
            if (location) {
                geocodeCache.set(address, location);
                return { address, location, success: true };
            }
            return { address, location: null, success: false };
        } catch (error) {
            return { address, location: null, success: false };
        }
    });

    return Promise.all(geocodePromises);
}

async function geocodeAddress(
    address: string
): Promise<{ lat: number; lng: number } | null> {
    try {
        const url = `${GEOCODING_BASE_URL}?address=${encodeURIComponent(
            address
        )}&key=${GEOCODING_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            const result = { lat: location.lat, lng: location.lng };
            geocodeCache.set(address, result);
            return result;
        }

        return null;
    } catch (error) {
        return null;
    }
}

function buildFullAddress(booking: RunsheetBooking): string {
    const parts = [
        booking.consignee_address,
        booking.consignee_city,
        booking.consignee_postcode,
        'Malta',
    ].filter(Boolean);

    return parts.join(', ');
}

export function clearGeocodeCache(): void {
    geocodeCache.clear();
    if (DEBUG_MODE) console.log('🗑️  Geocode cache cleared');
}