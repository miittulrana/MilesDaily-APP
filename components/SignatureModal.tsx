import React, { useRef, useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Platform,
} from 'react-native';
import SignatureScreen from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import { layouts } from '../constants/layouts';

interface SignatureModalProps {
    visible: boolean;
    onSave: (signature: string) => void;
    onCancel: () => void;
}

export default function SignatureModal({ visible, onSave, onCancel }: SignatureModalProps) {
    const signatureRef = useRef<any>(null);
    const [hasDrawn, setHasDrawn] = useState(false);

    const handleClear = () => {
        signatureRef.current?.clearSignature();
        setHasDrawn(false);
    };

    const handleConfirm = () => {
        signatureRef.current?.readSignature();
    };

    const handleOK = (signature: string) => {
        if (signature) {
            onSave(signature);
            setHasDrawn(false);
        }
    };

    const handleBegin = () => {
        setHasDrawn(true);
    };

    const handleEnd = () => {
    };

    const handleEmpty = () => {
        setHasDrawn(false);
    };

    const handleCancel = () => {
        signatureRef.current?.clearSignature();
        setHasDrawn(false);
        onCancel();
    };

    const style = `.m-signature-pad {box-shadow: none; border: none; margin: 0; padding: 0; width: 100%; height: 100%;} 
                   .m-signature-pad--body {border: none; margin: 0; padding: 0; width: 100%; height: 100%;}
                   .m-signature-pad--footer {display: none;}
                   body, html {width: 100%; height: 100%; margin: 0; padding: 0; background-color: #fff;}
                   canvas {width: 100% !important; height: 100% !important; background-color: #fff;}`;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={handleCancel}
        >
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
                
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
                        <Ionicons name="close" size={24} color={colors.text} />
                        <Text style={styles.headerButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.headerTitle}>Sign Here</Text>
                    
                    <TouchableOpacity 
                        style={[styles.headerButton, styles.headerButtonRight]} 
                        onPress={handleClear}
                    >
                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                        <Text style={[styles.headerButtonText, { color: colors.error }]}>Clear</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.signatureContainer}>
                    <View style={styles.signatureBox}>
                        <SignatureScreen
                            ref={signatureRef}
                            onOK={handleOK}
                            onEmpty={handleEmpty}
                            onBegin={handleBegin}
                            onEnd={handleEnd}
                            autoClear={false}
                            descriptionText=""
                            clearText=""
                            confirmText=""
                            webStyle={style}
                            backgroundColor="rgb(255,255,255)"
                            penColor="black"
                            dotSize={1}
                            minWidth={2}
                            maxWidth={4}
                            trimWhitespace={false}
                            imageType="image/png"
                        />
                    </View>
                    <Text style={styles.hint}>Use your finger to sign above</Text>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.confirmButton, !hasDrawn && styles.confirmButtonDisabled]}
                        onPress={handleConfirm}
                        disabled={!hasDrawn}
                    >
                        <Ionicons name="checkmark-circle" size={24} color={colors.background} />
                        <Text style={styles.confirmButtonText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.gray100,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: layouts.spacing.md,
        paddingVertical: layouts.spacing.md,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    headerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: layouts.spacing.sm,
        gap: 4,
        minWidth: 80,
    },
    headerButtonRight: {
        justifyContent: 'flex-end',
    },
    headerButtonText: {
        fontSize: 16,
        color: colors.text,
        fontWeight: '500',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    signatureContainer: {
        flex: 1,
        padding: layouts.spacing.lg,
        justifyContent: 'center',
    },
    signatureBox: {
        flex: 1,
        backgroundColor: colors.background,
        borderRadius: layouts.borderRadius.lg,
        borderWidth: 2,
        borderColor: colors.gray300,
        borderStyle: 'dashed',
        overflow: 'hidden',
        maxHeight: 400,
    },
    hint: {
        textAlign: 'center',
        marginTop: layouts.spacing.md,
        fontSize: 14,
        color: colors.textLight,
    },
    footer: {
        padding: layouts.spacing.lg,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.gray200,
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        paddingVertical: layouts.spacing.md,
        borderRadius: layouts.borderRadius.lg,
        gap: layouts.spacing.sm,
    },
    confirmButtonDisabled: {
        backgroundColor: colors.gray400,
    },
    confirmButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.background,
    },
});