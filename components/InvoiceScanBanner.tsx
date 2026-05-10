import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import { layouts } from '../constants/layouts';
import { fetchPendingScanRequests, InvoiceScanRequest } from '../lib/invoiceScanService';

interface InvoiceScanBannerProps {
    bizhandleStaffId: number | null | undefined;
    onAccept: (request: InvoiceScanRequest) => void;
}

export default function InvoiceScanBanner({ bizhandleStaffId, onAccept }: InvoiceScanBannerProps) {
    const [requests, setRequests] = useState<InvoiceScanRequest[]>([]);

    const pollRequests = useCallback(async () => {
        if (!bizhandleStaffId) return;
        const pending = await fetchPendingScanRequests(bizhandleStaffId);
        setRequests(pending);
    }, [bizhandleStaffId]);

    useEffect(() => {
        if (!bizhandleStaffId) return;

        // Initial fetch
        pollRequests();

        // Poll every 5 seconds
        const interval = setInterval(pollRequests, 5000);

        // Also poll when app comes to foreground
        const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
            if (state === 'active') pollRequests();
        });

        return () => {
            clearInterval(interval);
            subscription.remove();
        };
    }, [bizhandleStaffId, pollRequests]);

    if (requests.length === 0) return null;

    const req = requests[0]; // Show most recent

    const timeAgo = () => {
        const diff = Date.now() - new Date(req.created_at).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        return `${Math.floor(mins / 60)}h ago`;
    };

    return (
        <View style={styles.container}>
            <View style={styles.pulseRow}>
                <View style={styles.pulseDot} />
                <Text style={styles.liveLabel}>SCAN REQUEST</Text>
            </View>

            <View style={styles.infoRow}>
                <Ionicons name="camera-outline" size={22} color={colors.primary} />
                <View style={styles.textBlock}>
                    <Text style={styles.title}>Invoice Image Scan</Text>
                    <Text style={styles.subtitle}>
                        From {req.requester_name} · {timeAgo()}
                    </Text>
                    {req.customer_name ? (
                        <Text style={styles.meta}>Customer: {req.customer_name}</Text>
                    ) : null}
                </View>
            </View>

            <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => onAccept(req)}
                activeOpacity={0.8}
            >
                <Ionicons name="camera" size={18} color="#fff" />
                <Text style={styles.acceptBtnText}>Open Camera</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff7ed',
        borderWidth: 1,
        borderColor: '#fed7aa',
        borderRadius: layouts.borderRadius.lg,
        padding: layouts.spacing.md,
        marginBottom: layouts.spacing.lg,
    },
    pulseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary,
    },
    liveLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.primary,
        letterSpacing: 1.2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 12,
    },
    textBlock: {
        flex: 1,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    subtitle: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    meta: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    acceptBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.primary,
        paddingVertical: 12,
        borderRadius: layouts.borderRadius.md,
    },
    acceptBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
});