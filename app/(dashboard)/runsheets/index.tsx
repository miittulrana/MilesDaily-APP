import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import LoadingIndicator from '../../../components/LoadingIndicator';
import RunsheetCard from '../../../components/runsheets/RunsheetCard';
import DateFilter from '../../../components/runsheets/DateFilter';
import { fetchAssignedRunsheets } from '../../../lib/runsheetService';
import { AssignedRunsheet } from '../../../utils/runsheetTypes';
import { getCurrentDate } from '../../../utils/dateUtils';

export default function RunsheetsScreen() {
    const router = useRouter();
    const [runsheets, setRunsheets] = useState<AssignedRunsheet[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState(getCurrentDate());

    useEffect(() => {
        loadRunsheets();
    }, [selectedDate]);

    const loadRunsheets = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchAssignedRunsheets(selectedDate, selectedDate);
            setRunsheets(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load runsheets');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadRunsheets();
    };

    const handleRunsheetPress = (runsheet: AssignedRunsheet) => {
        router.push(`/runsheets/${runsheet.runsheet.id}`);
    };

    const renderRunsheet = ({ item }: { item: AssignedRunsheet }) => (
        <RunsheetCard runsheet={item} onPress={() => handleRunsheetPress(item)} />
    );

    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={colors.gray400} />
            <Text style={styles.emptyTitle}>No Run-Sheets Found</Text>
            <Text style={styles.emptyDescription}>
                No run-sheets have been assigned to you for the selected date.
            </Text>
        </View>
    );

    if (loading && !refreshing) {
        return <LoadingIndicator fullScreen message="Loading run-sheets..." />;
    }

    return (
        <View style={styles.container}>
            <DateFilter
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
            />

            {error && (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={20} color={colors.error} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={loadRunsheets} style={styles.retryButton}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}

            <FlatList
                data={runsheets}
                renderItem={renderRunsheet}
                keyExtractor={(item) => item.id}
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
                ListEmptyComponent={renderEmpty}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    listContent: {
        padding: layouts.spacing.lg,
        paddingTop: 0,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.error + '15',
        margin: layouts.spacing.lg,
        padding: layouts.spacing.md,
        borderRadius: layouts.borderRadius.md,
        borderWidth: 1,
        borderColor: colors.error + '30',
    },
    errorText: {
        color: colors.error,
        fontSize: 14,
        marginLeft: layouts.spacing.sm,
        flex: 1,
    },
    retryButton: {
        backgroundColor: colors.error,
        paddingVertical: layouts.spacing.xs,
        paddingHorizontal: layouts.spacing.sm,
        borderRadius: layouts.borderRadius.sm,
    },
    retryText: {
        color: colors.background,
        fontSize: 12,
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        padding: layouts.spacing.xl,
        marginTop: layouts.spacing.xl,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginTop: layouts.spacing.lg,
        marginBottom: layouts.spacing.sm,
    },
    emptyDescription: {
        fontSize: 14,
        color: colors.textLight,
        textAlign: 'center',
        lineHeight: 20,
    },
});