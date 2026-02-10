import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import { layouts } from '../constants/layouts';
import SignatureModal from './SignatureModal';

interface SignatureCanvasProps {
    onSignature: (signature: string | null) => void;
}

export default function SignatureCanvas({ onSignature }: SignatureCanvasProps) {
    const [modalVisible, setModalVisible] = useState(false);
    const [signatureData, setSignatureData] = useState<string | null>(null);

    const handleOpenModal = () => {
        setModalVisible(true);
    };

    const handleSave = (signature: string) => {
        setSignatureData(signature);
        const base64Data = signature.replace('data:image/png;base64,', '');
        onSignature(base64Data);
        setModalVisible(false);
    };

    const handleCancel = () => {
        setModalVisible(false);
    };

    const handleClear = () => {
        setSignatureData(null);
        onSignature(null);
    };

    return (
        <View style={styles.container}>
            {signatureData ? (
                <View style={styles.previewContainer}>
                    <Image
                        source={{ uri: signatureData }}
                        style={styles.previewImage}
                        resizeMode="contain"
                    />
                    <View style={styles.previewActions}>
                        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                            <Ionicons name="trash-outline" size={18} color={colors.error} />
                            <Text style={styles.clearButtonText}>Clear</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.editButton} onPress={handleOpenModal}>
                            <Ionicons name="create-outline" size={18} color={colors.primary} />
                            <Text style={styles.editButtonText}>Re-sign</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.savedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                        <Text style={styles.savedText}>Saved</Text>
                    </View>
                </View>
            ) : (
                <TouchableOpacity style={styles.openButton} onPress={handleOpenModal}>
                    <View style={styles.openButtonContent}>
                        <Ionicons name="pencil" size={32} color={colors.primary} />
                        <Text style={styles.openButtonText}>Tap to Sign</Text>
                        <Text style={styles.openButtonHint}>Opens full screen signature pad</Text>
                    </View>
                </TouchableOpacity>
            )}

            <SignatureModal
                visible={modalVisible}
                onSave={handleSave}
                onCancel={handleCancel}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: layouts.borderRadius.md,
        overflow: 'hidden',
        backgroundColor: colors.background,
    },
    openButton: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.gray100,
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: colors.gray300,
        borderRadius: layouts.borderRadius.md,
        margin: 2,
    },
    openButtonContent: {
        alignItems: 'center',
        gap: layouts.spacing.sm,
    },
    openButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.primary,
    },
    openButtonHint: {
        fontSize: 12,
        color: colors.textLight,
    },
    previewContainer: {
        position: 'relative',
    },
    previewImage: {
        height: 150,
        width: '100%',
        backgroundColor: colors.background,
    },
    previewActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: layouts.spacing.sm,
        backgroundColor: colors.gray100,
        borderTopWidth: 1,
        borderTopColor: colors.gray200,
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: layouts.spacing.sm,
        gap: 4,
    },
    clearButtonText: {
        fontSize: 14,
        color: colors.error,
        fontWeight: '600',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: layouts.spacing.sm,
        gap: 4,
    },
    editButtonText: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
    },
    savedBadge: {
        position: 'absolute',
        top: layouts.spacing.sm,
        right: layouts.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.success + '20',
        paddingHorizontal: layouts.spacing.sm,
        paddingVertical: 4,
        borderRadius: layouts.borderRadius.full,
        gap: 4,
    },
    savedText: {
        fontSize: 12,
        color: colors.success,
        fontWeight: '600',
    },
});