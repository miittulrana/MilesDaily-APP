import React, { useState, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Image,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors } from '../constants/Colors';
import { layouts } from '../constants/layouts';
import { compressImage, CompressedImage } from '../lib/imageCompression';
import {
    InvoiceScanRequest,
    markRequestInProgress,
    uploadScanPhotos,
    markRequestCompleted,
    markRequestFailed,
} from '../lib/invoiceScanService';

interface InvoiceScanCameraProps {
    visible: boolean;
    request: InvoiceScanRequest | null;
    onComplete: () => void;
    onCancel: () => void;
}

const MAX_PHOTOS = 40;

export default function InvoiceScanCamera({ visible, request, onComplete, onCancel }: InvoiceScanCameraProps) {
    const [permission, requestPermission] = useCameraPermissions();
    const [photos, setPhotos] = useState<CompressedImage[]>([]);
    const cameraRef = useRef<any>(null);
    const [capturing, setCapturing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ uploaded: 0, total: 0 });
    const [uploadStatus, setUploadStatus] = useState('');

    const handleTakePhoto = async () => {
        if (!cameraRef.current || capturing || photos.length >= MAX_PHOTOS) return;

        try {
            setCapturing(true);
            const result = await cameraRef.current.takePictureAsync({ quality: 0.85 });
            const compressed = await compressImage(result.uri);
            setPhotos(prev => [...prev, compressed]);
        } catch (error) {
            console.error('Photo capture error:', error);
            Alert.alert('Error', 'Failed to capture photo. Try again.');
        } finally {
            setCapturing(false);
        }
    };

    const handleRemovePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!request || photos.length === 0) return;

        Alert.alert(
            'Submit Photos',
            `Upload ${photos.length} photo${photos.length !== 1 ? 's' : ''}? This will send them to the office.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Submit',
                    onPress: async () => {
                        setUploading(true);
                        setUploadStatus('Preparing upload…');
                        setUploadProgress({ uploaded: 0, total: photos.length });

                        try {
                            // Mark as in progress
                            await markRequestInProgress(request.id);
                            setUploadStatus(`Uploading photo 1 of ${photos.length}…`);

                            const result = await uploadScanPhotos(
                                request.id,
                                photos,
                                (uploaded, total) => {
                                    setUploadProgress({ uploaded, total });
                                    if (uploaded < total) {
                                        setUploadStatus(`Uploading photo ${uploaded + 1} of ${total}…`);
                                    } else {
                                        setUploadStatus('Finalizing…');
                                    }
                                },
                            );

                            if (result.success) {
                                await markRequestCompleted(request.id, result.urls);
                                setPhotos([]);
                                onComplete();
                                Alert.alert(
                                    'Photos Sent',
                                    `${result.urls.length} photos uploaded successfully. The office will process them.`,
                                );
                            } else {
                                await markRequestFailed(request.id);
                                Alert.alert('Upload Failed', result.error || 'Some photos failed to upload. Please try again.');
                            }
                        } catch (err: any) {
                            console.error('Submit error:', err);
                            await markRequestFailed(request.id);
                            Alert.alert('Error', `Upload failed: ${err.message}`);
                        } finally {
                            setUploading(false);
                            setUploadStatus('');
                        }
                    },
                },
            ],
        );
    };

    const handleClose = () => {
        if (photos.length > 0) {
            Alert.alert(
                'Discard Photos?',
                `You have ${photos.length} photo${photos.length !== 1 ? 's' : ''} that will be lost.`,
                [
                    { text: 'Keep Taking Photos', style: 'cancel' },
                    {
                        text: 'Discard & Close',
                        style: 'destructive',
                        onPress: () => {
                            setPhotos([]);
                            onCancel();
                        },
                    },
                ],
            );
        } else {
            onCancel();
        }
    };

    if (!visible) return null;

    // Permission not determined
    if (!permission) return null;

    // Permission denied
    if (!permission.granted) {
        return (
            <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
                <SafeAreaView style={styles.container}>
                    <View style={styles.permissionContainer}>
                        <Ionicons name="camera-outline" size={64} color={colors.gray400} />
                        <Text style={styles.permissionText}>Camera permission is required to take invoice photos</Text>
                        <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
                            <Text style={styles.permButtonText}>Grant Permission</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelLink} onPress={handleClose}>
                            <Text style={styles.cancelLinkText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        );
    }

    // Upload progress overlay
    if (uploading) {
        const pct = uploadProgress.total > 0
            ? Math.round((uploadProgress.uploaded / uploadProgress.total) * 100)
            : 0;

        return (
            <Modal visible={visible} animationType="fade" onRequestClose={() => { }}>
                <SafeAreaView style={styles.uploadOverlay}>
                    <View style={styles.uploadCard}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.uploadTitle}>Uploading Photos</Text>
                        <Text style={styles.uploadSubtitle}>{uploadStatus}</Text>

                        <View style={styles.progressBarOuter}>
                            <View style={[styles.progressBarInner, { width: `${pct}%` }]} />
                        </View>
                        <Text style={styles.progressText}>
                            {uploadProgress.uploaded} / {uploadProgress.total} — {pct}%
                        </Text>

                        <Text style={styles.uploadHint}>Please keep the app open</Text>
                    </View>
                </SafeAreaView>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleClose} style={styles.headerBtn}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Invoice Scan</Text>
                        <Text style={styles.headerSub}>
                            {request?.customer_name || 'Scan invoices'}
                        </Text>
                    </View>
                    <View style={styles.headerBtn} />
                </View>

                {/* Camera */}
                <View style={styles.cameraContainer}>
                    <CameraView
                        style={styles.camera}
                        facing="back"
                        ref={cameraRef}
                    >
                        <View style={styles.cameraOverlay}>
                            <View style={styles.countBadge}>
                                <Ionicons name="images-outline" size={14} color="#fff" />
                                <Text style={styles.countText}>
                                    {photos.length} / {MAX_PHOTOS}
                                </Text>
                            </View>
                        </View>
                    </CameraView>
                </View>

                {/* Bottom controls */}
                <View style={styles.bottomSection}>
                    {/* Thumbnails */}
                    {photos.length > 0 && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.thumbScroll}
                            contentContainerStyle={styles.thumbContainer}
                        >
                            {photos.map((photo, index) => (
                                <View key={index} style={styles.thumbWrap}>
                                    <Image source={{ uri: photo.uri }} style={styles.thumb} />
                                    <TouchableOpacity
                                        style={styles.thumbRemove}
                                        onPress={() => handleRemovePhoto(index)}
                                    >
                                        <Ionicons name="close-circle" size={22} color={colors.error} />
                                    </TouchableOpacity>
                                    <Text style={styles.thumbIndex}>{index + 1}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    )}

                    {/* Capture button */}
                    <View style={styles.captureRow}>
                        <TouchableOpacity
                            style={[
                                styles.captureBtn,
                                (capturing || photos.length >= MAX_PHOTOS) && styles.captureBtnDisabled,
                            ]}
                            onPress={handleTakePhoto}
                            disabled={capturing || photos.length >= MAX_PHOTOS}
                        >
                            <View style={styles.captureBtnInner} />
                        </TouchableOpacity>
                    </View>

                    {/* Submit button */}
                    <TouchableOpacity
                        style={[styles.submitBtn, photos.length === 0 && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={photos.length === 0}
                    >
                        <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                        <Text style={styles.submitBtnText}>
                            Submit {photos.length} Photo{photos.length !== 1 ? 's' : ''}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: layouts.spacing.md,
        paddingVertical: layouts.spacing.sm,
        backgroundColor: '#000',
    },
    headerBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    headerSub: {
        fontSize: 12,
        color: '#aaa',
        marginTop: 1,
    },
    cameraContainer: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    cameraOverlay: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        padding: layouts.spacing.md,
    },
    countBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    countText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    bottomSection: {
        backgroundColor: '#000',
        paddingHorizontal: layouts.spacing.md,
        paddingBottom: layouts.spacing.lg,
    },
    thumbScroll: {
        maxHeight: 80,
        marginBottom: layouts.spacing.sm,
    },
    thumbContainer: {
        paddingVertical: layouts.spacing.xs,
        gap: 8,
    },
    thumbWrap: {
        position: 'relative',
        marginRight: 4,
    },
    thumb: {
        width: 60,
        height: 60,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: colors.primary,
    },
    thumbRemove: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#000',
        borderRadius: 11,
    },
    thumbIndex: {
        position: 'absolute',
        bottom: 2,
        left: 4,
        fontSize: 10,
        fontWeight: '700',
        color: '#fff',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 4,
        borderRadius: 3,
        overflow: 'hidden',
    },
    captureRow: {
        alignItems: 'center',
        marginVertical: layouts.spacing.md,
    },
    captureBtn: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: colors.primary,
    },
    captureBtnDisabled: {
        borderColor: '#555',
        opacity: 0.4,
    },
    captureBtnInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.primary,
    },
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.success,
        paddingVertical: 14,
        borderRadius: layouts.borderRadius.md,
    },
    submitBtnDisabled: {
        backgroundColor: '#333',
    },
    submitBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    // Upload overlay
    uploadOverlay: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    uploadCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        width: '100%',
        maxWidth: 320,
    },
    uploadTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginTop: 20,
    },
    uploadSubtitle: {
        fontSize: 14,
        color: '#aaa',
        marginTop: 6,
        textAlign: 'center',
    },
    progressBarOuter: {
        width: '100%',
        height: 8,
        backgroundColor: '#333',
        borderRadius: 4,
        marginTop: 24,
        overflow: 'hidden',
    },
    progressBarInner: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        color: '#ccc',
        marginTop: 10,
        fontWeight: '600',
    },
    uploadHint: {
        fontSize: 12,
        color: '#666',
        marginTop: 20,
    },
    // Permission
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        padding: 32,
    },
    permissionText: {
        fontSize: 16,
        color: '#ccc',
        marginTop: layouts.spacing.lg,
        marginBottom: layouts.spacing.xl,
        textAlign: 'center',
    },
    permButton: {
        backgroundColor: colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: layouts.borderRadius.md,
        marginBottom: layouts.spacing.md,
    },
    permButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelLink: {
        paddingVertical: layouts.spacing.md,
    },
    cancelLinkText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '600',
    },
});