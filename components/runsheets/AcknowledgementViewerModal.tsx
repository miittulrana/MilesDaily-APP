import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';

interface AcknowledgementViewerModalProps {
    visible: boolean;
    pdfUrl: string;
    onClose: () => void;
}

export default function AcknowledgementViewerModal({
    visible,
    pdfUrl,
    onClose
}: AcknowledgementViewerModalProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.container}>
                <View style={styles.safeArea}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Acknowledgement PDF</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.content}>
                    {loading && !error && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={styles.loadingText}>Loading PDF...</Text>
                        </View>
                    )}

                    {error && (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={60} color={colors.error} />
                            <Text style={styles.errorText}>Failed to load PDF</Text>
                            <TouchableOpacity style={styles.retryButton} onPress={() => {
                                setError(false);
                                setLoading(true);
                            }}>
                                <Text style={styles.retryText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {!error && (
                        <WebView
                            source={{ uri: pdfUrl }}
                            style={styles.webView}
                            onLoadStart={() => setLoading(true)}
                            onLoadEnd={() => setLoading(false)}
                            onError={() => {
                                setLoading(false);
                                setError(true);
                            }}
                            onHttpError={() => {
                                setLoading(false);
                                setError(true);
                            }}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            originWhitelist={['*']}
                            mixedContentMode="always"
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    safeArea: {
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: layouts.spacing.lg,
        paddingVertical: layouts.spacing.md,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    closeButton: {
        padding: layouts.spacing.sm,
    },
    content: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
        zIndex: 1,
        gap: layouts.spacing.md,
    },
    loadingText: {
        fontSize: 14,
        color: colors.textLight,
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: layouts.spacing.xl,
        gap: layouts.spacing.md,
    },
    errorText: {
        fontSize: 16,
        color: colors.error,
        fontWeight: '600',
    },
    retryButton: {
        backgroundColor: colors.primary,
        paddingVertical: layouts.spacing.sm,
        paddingHorizontal: layouts.spacing.lg,
        borderRadius: layouts.borderRadius.md,
    },
    retryText: {
        color: colors.background,
        fontSize: 14,
        fontWeight: '600',
    },
    webView: {
        flex: 1,
        backgroundColor: colors.background,
    },
});