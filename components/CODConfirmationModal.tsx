import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    ScrollView,
    Image,
    Alert,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors } from '../constants/Colors';
import { layouts } from '../constants/layouts';
import { CODInfo } from '../lib/statusHelpers';
import { CompressedImage, compressImage } from '../lib/imageCompression';

interface CODConfirmationModalProps {
    visible: boolean;
    codInfo: CODInfo;
    onConfirm: (collectedAmount: number, paymentType: 'cash' | 'online', photo?: CompressedImage) => void;
    onCancel: () => void;
}

type Step = 'confirm' | 'camera';

export default function CODConfirmationModal({
    visible,
    codInfo,
    onConfirm,
    onCancel,
}: CODConfirmationModalProps) {
    const [permission, requestPermission] = useCameraPermissions();
    const [step, setStep] = useState<Step>('confirm');
    const [collectedAmount, setCollectedAmount] = useState('');
    const [photo, setPhoto] = useState<CompressedImage | null>(null);
    const [cameraRef, setCameraRef] = useState<any>(null);
    const [capturing, setCapturing] = useState(false);

    useEffect(() => {
        if (visible && codInfo.amount) {
            setCollectedAmount(codInfo.amount.toFixed(2));
        } else if (visible) {
            setCollectedAmount('');
        }
    }, [visible, codInfo.amount]);

    useEffect(() => {
        if (!visible) {
            setStep('confirm');
            setPhoto(null);
            setCollectedAmount('');
        }
    }, [visible]);

    const handleConfirmCash = () => {
        const amount = parseFloat(collectedAmount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount');
            return;
        }
        onConfirm(amount, 'cash');
    };

    const handleSelectOnline = () => {
        const amount = parseFloat(collectedAmount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount');
            return;
        }
        setStep('camera');
    };

    const handleTakePhoto = async () => {
        if (!cameraRef || capturing) return;

        try {
            setCapturing(true);
            const photoResult = await cameraRef.takePictureAsync({ quality: 0.8 });
            const compressed = await compressImage(photoResult.uri);
            setPhoto(compressed);
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Error', 'Failed to capture photo. Please try again.');
        } finally {
            setCapturing(false);
        }
    };

    const handleConfirmOnline = () => {
        if (!photo) {
            Alert.alert('Photo Required', 'Please take a photo of the payment proof');
            return;
        }
        const amount = parseFloat(collectedAmount);
        onConfirm(amount, 'online', photo);
    };

    const handleClose = () => {
        setStep('confirm');
        setPhoto(null);
        setCollectedAmount('');
        onCancel();
    };

    const handleRetakePhoto = () => {
        setPhoto(null);
    };

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    if (step === 'camera') {
        if (!permission?.granted) {
            return (
                <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
                    <SafeAreaView style={styles.cameraContainer}>
                        <View style={styles.cameraHeader}>
                            <TouchableOpacity onPress={() => setStep('confirm')} style={styles.headerCloseButton}>
                                <Ionicons name="arrow-back" size={24} color={colors.text} />
                            </TouchableOpacity>
                            <Text style={styles.cameraTitle}>Photo of Payment Proof</Text>
                            <View style={{ width: 40 }} />
                        </View>
                        <View style={styles.permissionContainer}>
                            <Ionicons name="camera-outline" size={64} color={colors.gray400} />
                            <Text style={styles.permissionText}>Camera permission required for payment proof</Text>
                            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                                <Text style={styles.permissionButtonText}>Grant Permission</Text>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </Modal>
            );
        }

        return (
            <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
                <SafeAreaView style={styles.cameraContainer}>
                    <View style={styles.cameraHeader}>
                        <TouchableOpacity onPress={() => setStep('confirm')} style={styles.headerCloseButton}>
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.cameraTitle}>Photo of Payment Proof</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.headerCloseButton}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {photo ? (
                        <View style={styles.photoPreviewContainer}>
                            <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                            <View style={styles.photoActions}>
                                <TouchableOpacity style={styles.retakeButton} onPress={handleRetakePhoto}>
                                    <Ionicons name="camera-reverse" size={20} color={colors.text} />
                                    <Text style={styles.retakeButtonText}>Retake</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.usePhotoButton} onPress={handleConfirmOnline}>
                                    <Ionicons name="checkmark-circle" size={20} color={colors.background} />
                                    <Text style={styles.usePhotoButtonText}>Confirm Payment</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.cameraViewContainer}>
                            <CameraView
                                style={styles.camera}
                                facing="back"
                                ref={(ref) => setCameraRef(ref)}
                            />
                            <View style={styles.cameraOverlay}>
                                <Text style={styles.cameraInstruction}>
                                    Take a photo of the online payment confirmation
                                </Text>
                                <TouchableOpacity
                                    style={[styles.captureButton, capturing && styles.captureButtonDisabled]}
                                    onPress={handleTakePhoto}
                                    disabled={capturing}
                                >
                                    <View style={styles.captureButtonInner} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </SafeAreaView>
            </Modal>
        );
    }

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={handleClose}
        >
            <SafeAreaView style={styles.container}>
                <TouchableWithoutFeedback onPress={dismissKeyboard}>
                    <View style={styles.innerContainer}>
                        <View style={styles.header}>
                            <TouchableOpacity onPress={handleClose} style={styles.headerCloseButton}>
                                <Ionicons name="close" size={28} color={colors.text} />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>COD / Cash Collected</Text>
                            <View style={{ width: 40 }} />
                        </View>

                        <ScrollView 
                            style={styles.scrollContent} 
                            contentContainerStyle={styles.scrollContentContainer}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.iconContainer}>
                                <Ionicons name="cash" size={48} color={colors.success} />
                            </View>

                            {codInfo.amount && codInfo.amount > 0 && (
                                <View style={styles.expectedAmountBox}>
                                    <Text style={styles.expectedLabel}>COD Amount to Collect</Text>
                                    <Text style={styles.expectedAmount}>
                                        {codInfo.currency} {codInfo.amount.toFixed(2)}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.infoBox}>
                                <Ionicons name="information-circle" size={20} color="#1e40af" />
                                <Text style={styles.infoText}>
                                    Confirm the amount collected below. If different from expected, enter the actual amount.
                                </Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Amount Collected *</Text>
                                <View style={styles.amountInputContainer}>
                                    <Text style={styles.currencyPrefix}>{codInfo.currency || 'EUR'}</Text>
                                    <TextInput
                                        style={styles.amountInput}
                                        value={collectedAmount}
                                        onChangeText={setCollectedAmount}
                                        placeholder="0.00"
                                        placeholderTextColor={colors.gray400}
                                        keyboardType="decimal-pad"
                                        returnKeyType="done"
                                        onSubmitEditing={dismissKeyboard}
                                    />
                                </View>
                            </View>

                            <Text style={styles.paymentTypeLabel}>How did customer pay?</Text>

                            <View style={styles.paymentOptions}>
                                <TouchableOpacity
                                    style={styles.paymentOption}
                                    onPress={handleConfirmCash}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.paymentIconContainer, { backgroundColor: '#dcfce7' }]}>
                                        <Ionicons name="cash-outline" size={36} color={colors.success} />
                                    </View>
                                    <Text style={styles.paymentOptionTitle}>Cash</Text>
                                    <Text style={styles.paymentOptionDesc}>Customer paid cash</Text>
                                    <View style={[styles.paymentOptionButton, { backgroundColor: colors.success }]}>
                                        <Text style={styles.paymentOptionButtonText}>Confirm Cash</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.paymentOption}
                                    onPress={handleSelectOnline}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.paymentIconContainer, { backgroundColor: '#dbeafe' }]}>
                                        <Ionicons name="phone-portrait-outline" size={36} color={colors.info} />
                                    </View>
                                    <Text style={styles.paymentOptionTitle}>Online</Text>
                                    <Text style={styles.paymentOptionDesc}>Take photo proof</Text>
                                    <View style={[styles.paymentOptionButton, { backgroundColor: colors.info }]}>
                                        <Text style={styles.paymentOptionButtonText}>Take Photo</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.reminderBox}>
                                <Ionicons name="alert-circle" size={20} color="#92400e" />
                                <Text style={styles.reminderText}>
                                    After confirming COD, scan the parcel again and select "Delivered"
                                </Text>
                            </View>
                        </ScrollView>
                    </View>
                </TouchableWithoutFeedback>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    innerContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: layouts.spacing.md,
        paddingVertical: layouts.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
        backgroundColor: colors.background,
    },
    headerCloseButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    scrollContent: {
        flex: 1,
    },
    scrollContentContainer: {
        padding: layouts.spacing.lg,
        paddingBottom: layouts.spacing.xl * 2,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#dcfce7',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: layouts.spacing.lg,
    },
    expectedAmountBox: {
        backgroundColor: '#fef3c7',
        padding: layouts.spacing.lg,
        borderRadius: layouts.borderRadius.lg,
        marginBottom: layouts.spacing.lg,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#f59e0b',
    },
    expectedLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#92400e',
        marginBottom: layouts.spacing.xs,
    },
    expectedAmount: {
        fontSize: 32,
        fontWeight: '800',
        color: '#92400e',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#dbeafe',
        padding: layouts.spacing.md,
        borderRadius: layouts.borderRadius.md,
        marginBottom: layouts.spacing.lg,
        gap: layouts.spacing.sm,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#1e40af',
        lineHeight: 20,
    },
    inputGroup: {
        marginBottom: layouts.spacing.lg,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: layouts.spacing.sm,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.gray300,
        borderRadius: layouts.borderRadius.lg,
        overflow: 'hidden',
        backgroundColor: colors.background,
    },
    currencyPrefix: {
        paddingHorizontal: layouts.spacing.lg,
        paddingVertical: layouts.spacing.md,
        fontSize: 20,
        fontWeight: '700',
        color: colors.textLight,
        backgroundColor: colors.gray100,
    },
    amountInput: {
        flex: 1,
        paddingHorizontal: layouts.spacing.md,
        paddingVertical: layouts.spacing.md,
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
    },
    paymentTypeLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: layouts.spacing.md,
    },
    paymentOptions: {
        flexDirection: 'row',
        gap: layouts.spacing.md,
        marginBottom: layouts.spacing.lg,
    },
    paymentOption: {
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: layouts.borderRadius.lg,
        padding: layouts.spacing.md,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.gray200,
    },
    paymentIconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: layouts.spacing.sm,
    },
    paymentOptionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: layouts.spacing.xs,
    },
    paymentOptionDesc: {
        fontSize: 13,
        color: colors.textLight,
        marginBottom: layouts.spacing.md,
        textAlign: 'center',
    },
    paymentOptionButton: {
        paddingVertical: layouts.spacing.sm,
        paddingHorizontal: layouts.spacing.md,
        borderRadius: layouts.borderRadius.md,
        width: '100%',
        alignItems: 'center',
    },
    paymentOptionButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.background,
    },
    reminderBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#fef3c7',
        padding: layouts.spacing.md,
        borderRadius: layouts.borderRadius.md,
        gap: layouts.spacing.sm,
        borderWidth: 1,
        borderColor: '#f59e0b',
    },
    reminderText: {
        flex: 1,
        fontSize: 14,
        color: '#92400e',
        fontWeight: '500',
        lineHeight: 20,
    },
    cameraContainer: {
        flex: 1,
        backgroundColor: colors.background,
    },
    cameraHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: layouts.spacing.md,
        paddingVertical: layouts.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    cameraTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    cameraViewContainer: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    cameraOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: layouts.spacing.xl,
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    cameraInstruction: {
        color: colors.background,
        fontSize: 14,
        textAlign: 'center',
        marginBottom: layouts.spacing.lg,
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: colors.info,
    },
    captureButtonDisabled: {
        opacity: 0.5,
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.info,
    },
    photoPreviewContainer: {
        flex: 1,
    },
    photoPreview: {
        flex: 1,
        resizeMode: 'contain',
    },
    photoActions: {
        flexDirection: 'row',
        padding: layouts.spacing.lg,
        gap: layouts.spacing.md,
        backgroundColor: colors.background,
    },
    retakeButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: layouts.spacing.md,
        borderRadius: layouts.borderRadius.md,
        backgroundColor: colors.gray200,
        alignItems: 'center',
        justifyContent: 'center',
        gap: layouts.spacing.sm,
    },
    retakeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    usePhotoButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: layouts.spacing.md,
        borderRadius: layouts.borderRadius.md,
        backgroundColor: colors.success,
        alignItems: 'center',
        justifyContent: 'center',
        gap: layouts.spacing.sm,
    },
    usePhotoButtonText: {
        fontSize: 16,
        fontWeight: '600',
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
    },
    permissionButtonText: {
        color: colors.background,
        fontSize: 16,
        fontWeight: '600',
    },
});