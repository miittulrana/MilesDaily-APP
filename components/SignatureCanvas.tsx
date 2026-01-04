import { useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import { layouts } from '../constants/layouts';

interface SignatureCanvasProps {
  onSignature: (signature: string | null) => void;
}

export default function SignatureCanvas({ onSignature }: SignatureCanvasProps) {
  const webViewRef = useRef<WebView>(null);
  const [hasSignature, setHasSignature] = useState(false);

  const handleClear = () => {
    webViewRef.current?.injectJavaScript('clearCanvas();');
    setHasSignature(false);
    onSignature(null);
  };

  const handleSave = () => {
    webViewRef.current?.injectJavaScript(`
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'signature',
        data: canvas.toDataURL('image/png')
      }));
    `);
  };

  const handleMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'signature' && message.data) {
        const base64Data = message.data.split(',')[1];
        const filename = `${FileSystem.cacheDirectory}signature_${Date.now()}.png`;
        
        await FileSystem.writeAsStringAsync(filename, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        setHasSignature(true);
        onSignature(filename);
      } else if (message.type === 'stroke') {
        if (!hasSignature) {
          handleSave();
        }
      }
    } catch (error) {
      console.error('Signature error:', error);
    }
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * { margin: 0; padding: 0; }
          body { overflow: hidden; touch-action: none; }
          canvas { 
            display: block; 
            width: 100%;
            height: 100vh;
            touch-action: none;
            background: white;
          }
        </style>
      </head>
      <body>
        <canvas id="canvas"></canvas>
        <script>
          const canvas = document.getElementById('canvas');
          const ctx = canvas.getContext('2d');
          let drawing = false;
          let lastX = 0;
          let lastY = 0;

          function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
          }

          resizeCanvas();
          window.addEventListener('resize', resizeCanvas);

          function startDrawing(e) {
            drawing = true;
            const touch = e.touches ? e.touches[0] : e;
            lastX = touch.clientX;
            lastY = touch.clientY;
          }

          function draw(e) {
            if (!drawing) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(touch.clientX, touch.clientY);
            ctx.stroke();
            lastX = touch.clientX;
            lastY = touch.clientY;
          }

          function stopDrawing() {
            if (drawing) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'stroke'
              }));
            }
            drawing = false;
          }

          canvas.addEventListener('touchstart', startDrawing);
          canvas.addEventListener('touchmove', draw);
          canvas.addEventListener('touchend', stopDrawing);
          canvas.addEventListener('mousedown', startDrawing);
          canvas.addEventListener('mousemove', draw);
          canvas.addEventListener('mouseup', stopDrawing);

          function clearCanvas() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <View style={styles.canvasContainer}>
        <WebView
          ref={webViewRef}
          source={{ html }}
          onMessage={handleMessage}
          style={styles.webView}
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
  webView: {
    flex: 1,
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