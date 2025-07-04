import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View, Linking, Alert } from 'react-native';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { DriverDocument, VehicleDocument, getDocumentTypeLabel, getDocumentIcon } from '../../utils/documentTypes';

interface DocumentCardProps {
  document: DriverDocument | VehicleDocument;
  type: 'driver' | 'vehicle';
}

export default function DocumentCard({ document, type }: DocumentCardProps) {
  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'expired', text: 'Expired', color: colors.error };
    if (diffDays <= 30) return { status: 'expiring', text: `${diffDays} days left`, color: colors.warning };
    return { status: 'valid', text: `${diffDays} days left`, color: colors.success };
  };

  const handleDownload = async () => {
    try {
      if (document.file_url) {
        const supported = await Linking.canOpenURL(document.file_url);
        if (supported) {
          await Linking.openURL(document.file_url);
        } else {
          Alert.alert('Error', 'Cannot open document');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open document');
    }
  };

  const expiryStatus = getExpiryStatus(document.expiry_date);
  const documentIcon = getDocumentIcon(document.document_type);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name={documentIcon} size={24} color={colors.primary} />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.documentName}>{document.document_name}</Text>
          <Text style={styles.documentType}>
            {getDocumentTypeLabel(document.document_type, type)}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.downloadButton}
          onPress={handleDownload}
        >
          <Ionicons name="download-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {document.notes && (
        <Text style={styles.notes}>{document.notes}</Text>
      )}

      {expiryStatus && (
        <View style={styles.footer}>
          <View style={[styles.expiryBadge, { backgroundColor: expiryStatus.color + '20' }]}>
            <Text style={[styles.expiryText, { color: expiryStatus.color }]}>
              {expiryStatus.text}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginBottom: layouts.spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layouts.spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: layouts.borderRadius.md,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: layouts.spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  documentName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  documentType: {
    fontSize: 10,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  downloadButton: {
    width: 36,
    height: 36,
    borderRadius: layouts.borderRadius.md,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notes: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: layouts.spacing.md,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  footer: {
    alignItems: 'flex-end',
    paddingTop: layouts.spacing.sm,
  },
  expiryBadge: {
    paddingHorizontal: layouts.spacing.md,
    paddingVertical: layouts.spacing.sm,
    borderRadius: layouts.borderRadius.full,
  },
  expiryText: {
    fontSize: 13,
    fontWeight: '600',
  },
});