import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import LoadingIndicator from '../../../components/LoadingIndicator';
import DocumentCard from '../../../components/documents/DocumentCard';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { fetchTempAssignmentDocuments } from '../../../lib/documentsService';
import { VehicleDocument } from '../../../utils/documentTypes';

export default function TempAssignmentDocumentsScreen() {
  const router = useRouter();
  const { vehicleId, vehicleName } = useLocalSearchParams<{
    vehicleId: string;
    vehicleName: string;
  }>();
  
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      if (vehicleId) {
        const documentsData = await fetchTempAssignmentDocuments(vehicleId);
        setDocuments(documentsData);
      }
    } catch (err) {
      console.error('Error loading temp assignment documents:', err);
      setError('Failed to load documents');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [vehicleId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDocuments(false);
    setRefreshing(false);
  };

  const handleBack = () => {
    router.back();
  };

  if (loading && !refreshing) {
    return <LoadingIndicator fullScreen message="Loading vehicle documents..." />;
  }

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Temp Vehicle Documents</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {vehicleName}
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={styles.infoTitle}>Temporary Assignment Documents</Text>
          </View>
          <Text style={styles.infoText}>
            These are the documents for the temporarily assigned vehicle. You can view and download them while the assignment is active.
          </Text>
        </View>

        {documents.length > 0 ? (
          <View style={styles.documentsSection}>
            <Text style={styles.sectionTitle}>Vehicle Documents ({documents.length})</Text>
            {documents.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                type="vehicle"
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="document-outline" size={80} color={colors.gray300} />
            </View>
            <Text style={styles.emptyStateTitle}>No Documents Available</Text>
            <Text style={styles.emptyStateDescription}>
              No documents have been uploaded for this temporarily assigned vehicle yet.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
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
    paddingHorizontal: layouts.spacing.lg,
    paddingVertical: layouts.spacing.md,
    paddingTop: 50,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: layouts.spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textLight,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: layouts.spacing.lg,
  },
  errorContainer: {
    backgroundColor: colors.error + '10',
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    padding: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    marginBottom: layouts.spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginBottom: layouts.spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layouts.spacing.sm,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: layouts.spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  documentsSection: {
    marginBottom: layouts.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.lg,
    paddingBottom: layouts.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: layouts.spacing.xxl * 2,
    paddingHorizontal: layouts.spacing.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: layouts.borderRadius.xxl,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layouts.spacing.xl,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.md,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});