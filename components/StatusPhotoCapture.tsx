import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors } from '../constants/Colors';
import { layouts } from '../constants/layouts';
import { CompressedImage, compressImage } from '../lib/imageCompression';
import {
    LEFT_MESSAGE_NOTE_1_STATUS_ID,
    LEFT_MESSAGE_NOTE_2_STATUS_ID,
    WRONG_CASE_PACKAGING_STATUS_ID,
    CORRECT_CONTACT_DETAILS_STATUS_ID,
    getStatusInstructions,
} from '../lib/statusHelpers';

interface StatusPhotoCaptureProps {
    visible: boolean;
    statusId: number;
    statusName: string;
    onComplete: (photos: CompressedImage[]) => void;
    onCancel: () => void;
    maxPhotos?: number;
}

export default function StatusPhotoCapture({
    visible,
    statusId,
    statusName,
    onComplete,
    onCancel,
    maxPhotos = 3,
}: StatusPhotoCaptureProps) {
    const [permission, requestPermission] = useCameraPermissions();
    const [photos, setPhotos] = useState<CompressedImage[]>([]);
    const [cameraRef, setCameraRef] = useState<any>(null);
    const [capturing, setCapturing] = useState(false);

    const instructions = getStatusInstructions(statusId);

    const getPhotoDescription = () => {
        switch (statusId) {
            case LEFT_MESSAGE_NOTE_1_STATUS_ID:
                return 'Take a photo of the location where you left the message note';
            case LEFT_MESSAGE_NOTE_2_STATUS_ID:
                return 'Take a photo of the location';
            case WRONG_CASE_PACKAGING_STATUS_ID:
                return 'Take a photo showing the damage or packaging problem clearly';
            case CORRECT_CONTACT_DETAILS_STATUS_ID:
                return 'Take a photo of the parcel';
            default:
                return 'Take a photo';
        }
    };

    const handleTakePhoto = async () => {
        if (!cameraRef || capturing || photos.length >= maxPhotos) return;

        try {
            setCapturing(true);
            const photoResult = await cameraRef.takePictureAsync({ quality: 0.8 });
            const compressed = await compressImage(photoResult.uri);
            
            const newPhotos = [...photos, compressed];
            setPhotos(newPhotos);
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Error', 'Failed to capture photo. Please try again.');
        } finally {
            setCapturing(false);
        }
    };

    const handleRemovePhoto = (index: number) => {
        setPhotos(photos.filter((_, i) => i !== index));
    };

    const handleComplete = () => {
        if (photos.length === 0) {
            Alert.alert('Photo Required', 'Please take at least one photo');
            return;
        }
        onComplete(photos);
        setPhotos([]);
    };

    const handleCancel = () => {
        setPhotos([]);
        onCancel();
    };

    if (!permission) {
        return null;
    }

    if (!permission.granted) {
        return (
            <Modal visible={visible} animationType="slide" onRequestClose={handleCancel}>
                <SafeAreaView style={styles.container}>
                    <View style={styles.permissionContainer}>
                        <Ionicons name="camera-outline" size={64} color={colors.gray400} />
                        <Text style={styles.permissionText}>Camera permission required</Text>
                        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                            <Text style={styles.permissionButtonText}>Grant Permission</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelLink} onPress={handleCancel}>
                            <Text style={styles.cancelLinkText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={handleCancel}>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>{statusName}</Text>
                        <Text style={styles.headerSubtitle}>Photo Required</Text>
                    </View>
                    <View style={styles.headerButton} />
                </View>

                {instructions.length > 0 && (
                    <View style={styles.instructionsContainer}>
                        {instructions.map((instruction, index) => (
                            <View key={index} style={styles.instructionItem}>
                                <Text style={styles.instructionNumber}>{index + 1}.</Text>
                                <Text style={styles.instructionText}>{instruction}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.cameraContainer}>
                    <CameraView
                        style={styles.camera}
                        facing="back"
                        ref={(ref) => setCameraRef(ref)}
                    >
                        <View style={styles.cameraOverlay}>
                            <View style={styles.photoCountBadge}>
                                <Text style={styles.photoCountText}>
                                    {photos.length} / {maxPhotos}
                                </Text>
                            </View>
                        </View>
                    </CameraView>
                </View>

                <View style={styles.bottomSection}>
                    <Text style={styles.photoDescription}>{getPhotoDescription()}</Text>

                    {photos.length > 0 && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.thumbnailScroll}
                            contentContainerStyle={styles.thumbnailContainer}
                        >
                            {photos.map((photo, index) => (
                                <View key={index} style={styles.thumbnailWrapper}>
                                    <Image source={{ uri: photo.uri }} style={styles.thumbnail} />
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={() => handleRemovePhoto(index)}
                                    >
                                        <Ionicons name="close-circle" size={24} color={colors.error} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    )}

                    <View style={styles.controls}>
                        <TouchableOpacity
                            style={[
                                styles.captureButton,
                                (capturing || photos.length >= maxPhotos) && styles.captureButtonDisabled,
                            ]}
                            onPress={handleTakePhoto}
                            disabled={capturing || photos.length >= maxPhotos}
                        >
                            <View style={styles.captureButtonInner} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.completeButton,
                            photos.length === 0 && styles.completeButtonDisabled,
                        ]}
                        onPress={handleComplete}
                        disabled={photos.length === 0}
                    >
                        <Ionicons name="checkmark-circle" size={20} color={colors.background} />
                        <Text style={styles.completeButtonText}>
                            Done - Continue ({photos.length} photo{photos.length !== 1 ? 's' : ''})
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
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: layouts.spacing.md,
        paddingVertical: layouts.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    headerButton: {
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
        color: colors.text,
    },
    headerSubtitle: {
        fontSize: 12,
        color: colors.error,
        fontWeight: '600',
    },
    instructionsContainer: {
        backgroundColor: colors.gray100,
        padding: layouts.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    instructionItem: {
        flexDirection: 'row',
        paddingVertical: layouts.spacing.xs,
    },
    instructionNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
        marginRight: layouts.spacing.sm,
        width: 20,
    },
    instructionText: {
        flex: 1,
        fontSize: 14,
        color: colors.text,
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
    photoCountBadge: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: layouts.spacing.md,
        paddingVertical: layouts.spacing.sm,
        borderRadius: layouts.borderRadius.full,
    },
    photoCountText: {
        color: colors.background,
        fontSize: 14,
        fontWeight: '600',
    },
    bottomSection: {
        backgroundColor: colors.background,
        padding: layouts.spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.gray200,
    },
    photoDescription: {
        fontSize: 14,
        color: colors.textLight,
        textAlign: 'center',
        marginBottom: layouts.spacing.md,
    },
    thumbnailScroll: {
        maxHeight: 90,
        marginBottom: layouts.spacing.md,
    },
    thumbnailContainer: {
        paddingHorizontal: layouts.spacing.xs,
    },
    thumbnailWrapper: {
        marginRight: layouts.spacing.md,
        position: 'relative',
    },
    thumbnail: {
        width: 70,
        height: 70,
        borderRadius: layouts.borderRadius.md,
        borderWidth: 2,
        borderColor: colors.primary,
    },
    removeButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: colors.background,
        borderRadius: 12,
    },
    controls: {
        alignItems: 'center',
        marginBottom: layouts.spacing.md,
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: colors.primary,
    },
    captureButtonDisabled: {
        borderColor: colors.gray400,
        opacity: 0.5,
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.primary,
    },
    completeButton: {
        flexDirection: 'row',
        backgroundColor: colors.success,
        paddingVertical: layouts.spacing.md,
        borderRadius: layouts.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        gap: layouts.spacing.sm,
    },
    completeButtonDisabled: {
        backgroundColor: colors.gray400,
    },
    completeButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.background,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: layouts.spacing.xl,
    },
    permissionText: {
        fontSize: 16,
        color: colors.text,
        marginTop: layouts.spacing.lg,
        marginBottom: layouts.spacing.xl,
        textAlign: 'center',
    },
    permissionButton: {
        backgroundColor: colors.primary,
        paddingVertical: layouts.spacing.md,
        paddingHorizontal: layouts.spacing.xl,
        borderRadius: layouts.borderRadius.md,
        marginBottom: layouts.spacing.md,
    },
    permissionButtonText: {
        color: colors.background,
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