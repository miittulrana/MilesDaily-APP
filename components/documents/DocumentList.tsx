import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import DocumentCard from './DocumentCard';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { DriverDocument, VehicleDocument } from '../../utils/documentTypes';

interface DocumentListProps {
  driverDocuments: DriverDocument[];
  vehicleDocuments: VehicleDocument[];
  driverName: string;
  vehicleName: string;
}

export default function DocumentList({ 
  driverDocuments, 
  vehicleDocuments, 
  driverName, 
  vehicleName 
}: DocumentListProps) {
  const hasDocuments = driverDocuments.length > 0 || vehicleDocuments.length > 0;

  if (!hasDocuments) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="document-outline" size={80} color={colors.gray300} />
        </View>
        <Text style={styles.emptyStateTitle}>No Documents Available</Text>
        <Text style={styles.emptyStateDescription}>
          Documents will appear here once they are uploaded through the web dashboard.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {driverDocuments.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="person-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Driver Documents</Text>
          </View>
          {driverDocuments.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              type="driver"
            />
          ))}
        </View>
      )}

      {vehicleDocuments.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="car-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Vehicle Documents</Text>
          </View>
          {vehicleDocuments.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              type="vehicle"
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: layouts.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layouts.spacing.lg,
    paddingBottom: layouts.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: layouts.borderRadius.md,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: layouts.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: layouts.spacing.xxl * 3,
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
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: layouts.spacing.md,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
});