import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import LoadingIndicator from '../../../components/LoadingIndicator';
import BreakdownList from '../../../components/breakdown/BreakdownList';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { getDriverInfo } from '../../../lib/auth';
import { fetchDriverBreakdownReports, getAssistanceNumbers } from '../../../lib/breakdownService';
import { BreakdownReport, AssistanceNumber } from '../../../utils/breakdownTypes';

export default function BreakdownScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<BreakdownReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [showPhoneNumbers, setShowPhoneNumbers] = useState(false);
  const [assistanceNumbers, setAssistanceNumbers] = useState<AssistanceNumber[]>([]);
  const [loadingNumbers, setLoadingNumbers] = useState(false);

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const driverInfo = await getDriverInfo();
      if (!driverInfo?.id) {
        setError('Driver information not found');
        return;
      }

      setDriverId(driverInfo.id);
      const reportsData = await fetchDriverBreakdownReports(driverInfo.id);
      setReports(reportsData);
    } catch (err) {
      console.error('Error loading breakdown reports:', err);
      setError('Failed to load breakdown reports');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData(false);
    setRefreshing(false);
  };

  const handleAddBreakdown = () => {
    router.push('/breakdown/add' as any);
  };

  const handleShowPhoneNumbers = async () => {
    try {
      setLoadingNumbers(true);
      const numbers = await getAssistanceNumbers();
      setAssistanceNumbers(numbers);
      setShowPhoneNumbers(true);
    } catch (err) {
      console.error('Error loading phone numbers:', err);
      setError('Failed to load phone numbers');
    } finally {
      setLoadingNumbers(false);
    }
  };

  if (loading) {
    return <LoadingIndicator fullScreen message="Loading breakdown reports..." />;
  }

  if (showPhoneNumbers) {
    return (
      <View style={styles.container}>
        <View style={styles.phoneNumbersModal}>
          <View style={styles.phoneNumbersHeader}>
            <Text style={styles.phoneNumbersTitle}>Important Phone Numbers</Text>
            <TouchableOpacity onPress={() => setShowPhoneNumbers(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.phoneNumbersSubtitle}>
            Emergency assistance contact numbers for vehicle breakdown:
          </Text>

          <ScrollView style={styles.phoneNumbersList}>
            {assistanceNumbers.length > 0 ? (
              assistanceNumbers.map((number) => (
                <TouchableOpacity
                  key={number.id}
                  style={styles.phoneNumberCard}
                  onPress={() => {
                    const phoneUrl = `tel:${number.phone_number}`;
                    import('expo-linking').then(({ default: Linking }) => {
                      Linking.openURL(phoneUrl);
                    });
                  }}
                >
                  <View style={styles.phoneNumberInfo}>
                    <Text style={styles.phoneNumberText}>{number.phone_number}</Text>
                    {number.description && (
                      <Text style={styles.phoneNumberDescription}>{number.description}</Text>
                    )}
                  </View>
                  <Ionicons name="call" size={24} color={colors.primary} />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noPhoneNumbersText}>
                No emergency contact numbers available
              </Text>
            )}
          </ScrollView>

          <TouchableOpacity 
            style={styles.phoneNumbersDoneButton} 
            onPress={() => setShowPhoneNumbers(false)}
          >
            <Text style={styles.phoneNumbersDoneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
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
          <Text style={styles.title}>Vehicle Breakdown</Text>
          <Text style={styles.subtitle}>
            Report vehicle breakdown issues and get emergency assistance
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddBreakdown}
          activeOpacity={0.8}
        >
          <View style={styles.addButtonContent}>
            <View style={styles.addButtonIcon}>
              <Ionicons name="warning" size={24} color={colors.background} />
            </View>
            <View style={styles.addButtonText}>
              <Text style={styles.addButtonTitle}>Report Breakdown</Text>
              <Text style={styles.addButtonSubtitle}>
                Get emergency assistance for vehicle issues
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.background} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.phoneNumbersButton}
          onPress={handleShowPhoneNumbers}
          activeOpacity={0.8}
          disabled={loadingNumbers}
        >
          <View style={styles.phoneNumbersButtonContent}>
            {loadingNumbers ? (
              <LoadingIndicator size="small" color={colors.info} message="" />
            ) : (
              <Ionicons name="call" size={16} color={colors.info} />
            )}
            <Text style={styles.phoneNumbersButtonText}>Important Phone Numbers</Text>
          </View>
        </TouchableOpacity>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <BreakdownList reports={reports} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: layouts.spacing.lg,
  },
  header: {
    marginBottom: layouts.spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    lineHeight: 22,
  },
  addButton: {
    backgroundColor: colors.error,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginBottom: layouts.spacing.xl,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: layouts.borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: layouts.spacing.md,
  },
  addButtonText: {
    flex: 1,
  },
  addButtonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.background,
    marginBottom: layouts.spacing.xs,
  },
  addButtonSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  errorContainer: {
    backgroundColor: colors.error + '10',
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    padding: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    marginBottom: layouts.spacing.lg,
  },
  phoneNumbersButton: {
    backgroundColor: colors.info + '15',
    borderRadius: layouts.borderRadius.md,
    padding: layouts.spacing.md,
    marginBottom: layouts.spacing.lg,
    borderWidth: 1,
    borderColor: colors.info + '30',
    alignSelf: 'flex-start',
  },
  phoneNumbersButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layouts.spacing.sm,
  },
  phoneNumbersButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.info,
  },
  phoneNumbersModal: {
    flex: 1,
    backgroundColor: colors.background,
    padding: layouts.spacing.lg,
  },
  phoneNumbersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layouts.spacing.lg,
  },
  phoneNumbersTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
  },
  phoneNumbersSubtitle: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: layouts.spacing.xl,
    lineHeight: 22,
  },
  phoneNumbersList: {
    flex: 1,
    marginBottom: layouts.spacing.lg,
  },
  phoneNumberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: layouts.spacing.lg,
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    marginBottom: layouts.spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  phoneNumberInfo: {
    flex: 1,
  },
  phoneNumberText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  phoneNumberDescription: {
    fontSize: 14,
    color: colors.textLight,
  },
  noPhoneNumbersText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: layouts.spacing.xl,
  },
  phoneNumbersDoneButton: {
    backgroundColor: colors.primary,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  phoneNumbersDoneButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});