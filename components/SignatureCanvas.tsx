import { useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import SignatureScreen from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import { layouts } from '../constants/layouts';

interface SignatureCanvasProps {
  onSignature: (signature: string | null) => void;
}

export default function SignatureCanvas({ onSignature }: SignatureCanvasProps) {
  const signatureRef = useRef<any>(null);
  const [hasSignature, setHasSignature] = useState(false);

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setHasSignature(false);
    onSignature(null);
  };

  const handleEnd = () => {
    signatureRef.current?.readSignature();
  };

  const handleOK = (signature: string) => {
    if (signature) {
      const base64Data = signature.replace('data:image/png;base64,', '');
      setHasSignature(true);
      onSignature(base64Data);
    }
  };

  const handleEmpty = () => {
    setHasSignature(false);
    onSignature(null);
  };

  const handleBegin = () => {
  };

  const style = `.m-signature-pad {box-shadow: none; border: none; margin: 0; padding: 0;} 
                 .m-signature-pad--body {border: none; margin: 0; padding: 0;}
                 .m-signature-pad--footer {display: none; margin: 0; padding: 0;}
                 body,html {width: 100%; height: 100%; margin: 0; padding: 0;}
                 canvas {width: 100% !important; height: 100% !important;}`;

  return (
    <View style={styles.container}>
      <View style={styles.canvasContainer}>
        <SignatureScreen
          ref={signatureRef}
          onEnd={handleEnd}
          onOK={handleOK}
          onEmpty={handleEmpty}
          onBegin={handleBegin}
          autoClear={false}
          descriptionText=""
          clearText=""
          confirmText=""
          webStyle={style}
          backgroundColor="rgb(255,255,255)"
          penColor="black"
          dotSize={2}
          minWidth={2}
          maxWidth={3}
          trimWhitespace={false}
          imageType="image/png"
        />
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
        {hasSignature && (
          <View style={styles.savedIndicator}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.savedText}>Saved</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: layouts.borderRadius.md,
    overflow: 'hidden',
  },
  canvasContainer: {
    height: 200,
    backgroundColor: colors.background,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: layouts.spacing.sm,
    backgroundColor: colors.gray100,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: layouts.spacing.sm,
  },
  clearButtonText: {
    marginLeft: layouts.spacing.xs,
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
  },
  savedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedText: {
    marginLeft: layouts.spacing.xs,
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
});