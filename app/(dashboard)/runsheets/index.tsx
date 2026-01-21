import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import LoadingIndicator from '../../../components/LoadingIndicator';
import RunsheetCard from '../../../components/runsheets/RunsheetCard';
import DateFilter from '../../../components/runsheets/DateFilter';
import AcknowledgementViewerModal from '../../../components/runsheets/AcknowledgementViewerModal';
import { fetchAssignedRunsheets } from '../../../lib/runsheetService';
import { AssignedRunsheet } from '../../../utils/runsheetTypes';
import { getCurrentDate } from '../../../utils/dateUtils';
import { checkAcknowledgementExists, downloadAcknowledgementPDF } from '../../../lib/runsheetAcknowledgement';
import { supabase } from '../../../lib/supabase';

interface RunsheetWithAcknowledgement extends AssignedRunsheet {
    isAcknowledged?: boolean;
}

export default function RunsheetsScreen() {
    const router = useRouter();
    const [runsheets, setRunsheets] = useState<RunsheetWithAcknowledgement[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState(getCurrentDate());
    const [showPdfViewer, setShowPdfViewer] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');

    useEffect(() => {
        loadRunsheets();
    }, [selectedDate]);

    const loadRunsheets = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchAssignedRunsheets(selectedDate, selectedDate);

            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const runsheetsWithStatus = await Promise.all(
                    data.map(async (runsheet) => {
                        const isAcknowledged = await checkAcknowledgementExists(runsheet.runsheet_id, user.id);
                        return {
                            ...runsheet,
                            isAcknowledged
                        };
                    })
                );
                setRunsheets(runsheetsWithStatus);
            } else {
                setRunsheets(data);
            }
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

    const handleRunsheetPress = (runsheet: RunsheetWithAcknowledgement) => {
        router.push(`/(dashboard)/runsheets/${runsheet.runsheet.id}`);
    };

    const handleViewAcknowledgement = async (runsheet: RunsheetWithAcknowledgement) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const result = await downloadAcknowledgementPDF(runsheet.runsheet_id, user.id);

        if (result.success && result.url) {
            setPdfUrl(result.url);
            setShowPdfViewer(true);
        } else {
            Alert.alert('Error', result.error || 'Failed to load PDF');
        }
    };

    const renderRunsheet = ({ item }: { item: RunsheetWithAcknowledgement }) => (
        <View style={styles.cardWrapper}>
            <View style={styles.badgeContainer}>
                {item.isAcknowledged ? (
                    <View style={styles.acknowledgedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.background} />
                        <Text style={styles.badgeText}>Acknowledged</Text>
                    </View>
                ) : (
                    <View style={styles.pendingBadge}>
                        <Ionicons name="alert-circle" size={14} color={colors.background} />
                        <Text style={styles.badgeText}>Pending</Text>
                    </View>
                )}
            </View>
            <RunsheetCard
                runsheet={item}
                onPress={() => handleRunsheetPress(item)}
                isAcknowledged={item.isAcknowledged}
                onViewAcknowledgement={() => handleViewAcknowledgement(item)}
            />
        </View>
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

            <AcknowledgementViewerModal
                visible={showPdfViewer}
                pdfUrl={pdfUrl}
                onClose={() => setShowPdfViewer(false)}
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
        paddingTop: layouts.spacing.md,
    },
    cardWrapper: {
        position: 'relative',
        marginBottom: layouts.spacing.xl,
    },
    badgeContainer: {
        position: 'absolute',
        top: -12,
        left: 0,
        right: 0,
        zIndex: 10,
        alignItems: 'center',
    },
    acknowledgedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.success,
        paddingHorizontal: layouts.spacing.sm,
        paddingVertical: 4,
        borderRadius: layouts.borderRadius.full,
        gap: 4,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    pendingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.warning,
        paddingHorizontal: layouts.spacing.sm,
        paddingVertical: 4,
        borderRadius: layouts.borderRadius.full,
        gap: 4,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    badgeText: {
        color: colors.background,
        fontSize: 10,
        fontWeight: '700',
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