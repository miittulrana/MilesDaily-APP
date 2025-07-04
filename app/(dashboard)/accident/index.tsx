import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LoadingIndicator from '../../../components/LoadingIndicator';
import ContactModal from '../../../components/ContactModal';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { getDriverAccidents } from '../../../lib/accidentService';
import { AccidentReport } from '../../../utils/accidentTypes';

export default function AccidentScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<AccidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const data = await getDriverAccidents();
      const pendingOnlyReports = data.filter(report => report.status === 'pending');
      setReports(pendingOnlyReports);
    } catch (err) {
      setError('Failed to load accident reports');
      console.error('Error loading reports:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReports(false);
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'viewed': return colors.info;
      case 'submitted': return colors.success;
      case 'processed': return colors.primary;
      default: return colors.gray400;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'viewed': return 'Under Review';
      case 'submitted': return 'Submitted';
      case 'processed': return 'Processed';
      default: return status;
    }
  };

  const getAccidentTypeDisplay = (report: AccidentReport) => {
    let typeDisplay = report.accident_type === 'front-to-rear' ? 'Front-to-Rear' : 'General';
    
    if (report.general_sub_type) {
      switch (report.general_sub_type) {
        case 'injury':
          typeDisplay += ' (Injury)';
          break;
        case 'govt-property':
          typeDisplay += ' (Govt. Property)';
          break;
        case 'private-property':
          typeDisplay += ' (Private Property)';
          break;
        default:
          typeDisplay += ` (${report.general_sub_type})`;
      }
    }
    
    return typeDisplay;
  };

  if (loading) {
    return <LoadingIndicator fullScreen message="Loading accident reports..." />;
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Accident Reports</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.newClaimButton}
            onPress={() => router.push('/(dashboard)/accident/create')}
          >
            <Ionicons name="add" size={24} color={colors.background} />
            <Text style={styles.newClaimText}>Start New Claim</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.phoneButton}
            onPress={() => setShowContactModal(true)}
          >
            <Ionicons name="call" size={20} color={colors.info} />
            <Text style={styles.phoneButtonText}>Important Phone Numbers</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadReports()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {reports.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={64} color={colors.gray400} />
          <Text style={styles.emptyTitle}>No Pending Reports</Text>
          <Text style={styles.emptyDescription}>
            You don't have any accident reports pending review. Submitted reports are processed by admin.
          </Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => router.push('/(dashboard)/accident/create')}
          >
            <Text style={styles.startButtonText}>Start New Claim</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.reportsList}>
          {reports.map((report) => (
            <View key={report.id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View style={styles.reportInfo}>
                  <Text style={styles.reportNumber}>
                    {report.report_number || `#${report.id.slice(0, 8).toUpperCase()}`}
                  </Text>
                  <Text style={styles.reportDate}>
                    {formatDate(report.submitted_at)}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(report.status) }
                ]}>
                  <Text style={styles.statusText}>
                    {getStatusText(report.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.reportDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="car-outline" size={16} color={colors.textLight} />
                  <Text style={styles.detailText}>
                    {report.vehicle?.license_plate} - {report.vehicle?.brand} {report.vehicle?.model}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="warning-outline" size={16} color={colors.textLight} />
                  <Text style={styles.detailText}>
                    {getAccidentTypeDisplay(report)}
                  </Text>
                </View>
                {report.images && report.images.length > 0 && (
                  <View style={styles.detailRow}>
                    <Ionicons name="image-outline" size={16} color={colors.textLight} />
                    <Text style={styles.detailText}>
                      {report.images.length} image{report.images.length > 1 ? 's' : ''} attached
                    </Text>
                  </View>
                )}
              </View>

              {report.claim_number && (
                <View style={styles.claimNumberContainer}>
                  <Text style={styles.claimNumberLabel}>Claim Number:</Text>
                  <Text style={styles.claimNumber}>{report.claim_number}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      <ContactModal
        visible={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: layouts.spacing.lg,
    paddingBottom: layouts.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: layouts.spacing.lg,
  },
  newClaimButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: layouts.spacing.md,
    paddingHorizontal: layouts.spacing.lg,
    borderRadius: layouts.borderRadius.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: layouts.spacing.md,
  },
  newClaimText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: layouts.spacing.sm,
  },
  phoneButton: {
    backgroundColor: colors.info + '15',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: layouts.spacing.md,
    paddingHorizontal: layouts.spacing.lg,
    borderRadius: layouts.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.info,
  },
  phoneButtonText: {
    color: colors.info,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: layouts.spacing.sm,
  },
  errorContainer: {
    margin: layouts.spacing.lg,
    padding: layouts.spacing.lg,
    backgroundColor: colors.error + '15',
    borderRadius: layouts.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginBottom: layouts.spacing.md,
  },
  retryButton: {
    backgroundColor: colors.error,
    paddingVertical: layouts.spacing.sm,
    paddingHorizontal: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    alignSelf: 'flex-start',
  },
  retryText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: layouts.spacing.xl,
    marginTop: layouts.spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: layouts.spacing.lg,
    marginBottom: layouts.spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: layouts.spacing.xl,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingVertical: layouts.spacing.md,
    paddingHorizontal: layouts.spacing.xl,
    borderRadius: layouts.borderRadius.lg,
  },
  startButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  reportsList: {
    padding: layouts.spacing.lg,
    paddingTop: 0,
  },
  reportCard: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginBottom: layouts.spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: layouts.spacing.md,
  },
  reportInfo: {
    flex: 1,
  },
  reportNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  reportDate: {
    fontSize: 12,
    color: colors.textLight,
  },
  statusBadge: {
    paddingVertical: layouts.spacing.xs,
    paddingHorizontal: layouts.spacing.sm,
    borderRadius: layouts.borderRadius.full,
  },
  statusText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '500',
  },
  reportDetails: {
    marginBottom: layouts.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layouts.spacing.sm,
  },
  detailText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: layouts.spacing.sm,
    flex: 1,
  },
  claimNumberContainer: {
    backgroundColor: colors.success + '15',
    padding: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  claimNumberLabel: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '500',
  },
  claimNumber: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '700',
  },
});