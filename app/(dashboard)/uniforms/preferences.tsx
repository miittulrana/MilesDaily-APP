import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ErrorMessage from '../../../components/ErrorMessage';
import LoadingIndicator from '../../../components/LoadingIndicator';
import PreferenceSelector from '../../../components/uniforms/PreferenceSelector';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { useDriverPreferences, useUniformTypes, useUniformSizes } from '../../../lib/hooks/useUniforms';
import { DriverSizePreference, CreatePreferenceData } from '../../../utils/uniformTypes';

export default function PreferencesScreen() {
  const [showSelector, setShowSelector] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  const { 
    preferences, 
    loading: preferencesLoading, 
    error: preferencesError, 
    refetch: refetchPreferences,
    createPreference 
  } = useDriverPreferences();

  const { types } = useUniformTypes();
  const { sizes } = useUniformSizes(selectedTypeId);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchPreferences();
    setRefreshing(false);
  }, [refetchPreferences]);

  const handleCreatePreference = async (preferenceData: CreatePreferenceData) => {
    try {
      await createPreference(preferenceData);
      Alert.alert('Success', 'Size preference saved successfully');
    } catch (error) {
      throw error;
    }
  };

  const handleTypeChange = (typeId: string) => {
    setSelectedTypeId(typeId);
  };

  const renderPreferenceCard = ({ item }: { item: DriverSizePreference }) => (
    <View style={styles.preferenceCard}>
      <View style={styles.preferenceHeader}>
        <Text style={styles.preferenceName}>{item.uniform_type?.name}</Text>
        <View style={styles.sizeBadge}>
          <Text style={styles.sizeText}>{item.uniform_size?.name}</Text>
        </View>
      </View>
      
      <Text style={styles.preferenceCategory}>
        Category: {item.uniform_type?.category}
      </Text>
      
      {item.uniform_type?.description && (
        <Text style={styles.preferenceDescription}>
          {item.uniform_type.description}
        </Text>
      )}
    </View>
  );

  const groupedPreferences = preferences.reduce((acc, pref) => {
    const category = pref.uniform_type?.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(pref);
    return acc;
  }, {} as Record<string, DriverSizePreference[]>);

  if (preferencesLoading) {
    return <LoadingIndicator fullScreen message="Loading preferences..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Size Preferences</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowSelector(true)}
        >
          <Ionicons name="add" size={20} color={colors.background} />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {preferencesError && <ErrorMessage message={preferencesError} />}

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={24} color={colors.info} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>About Size Preferences</Text>
          <Text style={styles.infoText}>
            Set your preferred sizes for each uniform type. These will be auto-selected when making requests.
          </Text>
        </View>
      </View>

      {Object.keys(groupedPreferences).length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="resize-outline" size={64} color={colors.gray300} />
          <Text style={styles.emptyStateTitle}>No Size Preferences</Text>
          <Text style={styles.emptyStateDescription}>
            Add your size preferences to make uniform requests faster
          </Text>
          <TouchableOpacity 
            style={styles.emptyStateButton}
            onPress={() => setShowSelector(true)}
          >
            <Text style={styles.emptyStateButtonText}>Add First Preference</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={Object.entries(groupedPreferences)}
          keyExtractor={([category]) => category}
          renderItem={({ item: [category, prefs] }) => (
            <View style={styles.categorySection}>
              <Text style={styles.categoryTitle}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
              {prefs.map(pref => (
                <View key={pref.id}>
                  {renderPreferenceCard({ item: pref })}
                </View>
              ))}
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}

      <PreferenceSelector
        visible={showSelector}
        uniformTypes={types}
        uniformSizes={sizes}
        selectedTypeId={selectedTypeId}
        onClose={() => {
          setShowSelector(false);
          setSelectedTypeId('');
        }}
        onSubmit={handleCreatePreference}
        onTypeChange={handleTypeChange}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layouts.spacing.lg,
    paddingVertical: layouts.spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: layouts.borderRadius.md,
    gap: 4,
  },
  addButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.info + '10',
    margin: layouts.spacing.lg,
    padding: layouts.spacing.lg,
    borderRadius: layouts.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  infoContent: {
    flex: 1,
    marginLeft: layouts.spacing.md,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.info,
    marginBottom: layouts.spacing.xs,
  },
  infoText: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
  },
  listContent: {
    padding: layouts.spacing.lg,
  },
  categorySection: {
    marginBottom: layouts.spacing.xl,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.md,
    paddingHorizontal: layouts.spacing.sm,
  },
  preferenceCard: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginBottom: layouts.spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  preferenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layouts.spacing.sm,
  },
  preferenceName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  sizeBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: layouts.borderRadius.full,
  },
  sizeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  preferenceCategory: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: layouts.spacing.xs,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  preferenceDescription: {
    fontSize: 14,
    color: colors.textLight,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: layouts.spacing.lg,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: layouts.spacing.lg,
    marginBottom: layouts.spacing.sm,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: layouts.spacing.lg,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: layouts.borderRadius.md,
  },
  emptyStateButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
});