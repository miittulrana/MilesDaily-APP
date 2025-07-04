import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AccidentTypeCard from '../../../components/accident/AccidentTypeCard';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { AccidentType, GeneralSubType, ACCIDENT_TYPES, GENERAL_SUB_TYPES } from '../../../utils/accidentTypes';

export default function TypeSelectionScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<AccidentType | null>(null);
  const [selectedSubType, setSelectedSubType] = useState<GeneralSubType | null>(null);
  const [showSubTypes, setShowSubTypes] = useState(false);

  const handleTypeSelect = (type: AccidentType) => {
    setSelectedType(type);
    if (type === 'general') {
      setShowSubTypes(true);
      setSelectedSubType(null);
    } else {
      setShowSubTypes(false);
      setSelectedSubType(null);
    }
  };

  const handleSubTypeSelect = (subType: GeneralSubType) => {
    setSelectedSubType(subType);
  };

  const handleContinue = () => {
    if (!selectedType) return;
    
    const params: any = { type: selectedType };
    if (selectedSubType) {
      params.subType = selectedSubType;
    }
    
    router.push({
      pathname: '/(dashboard)/accident/details',
      params
    });
  };

  const canContinue = selectedType && (selectedType !== 'general' || selectedSubType);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Accident Type</Text>
          <Text style={styles.description}>
            Choose the type of accident that best describes what happened
          </Text>
        </View>

        <View style={styles.typeSection}>
          <Text style={styles.sectionTitle}>Accident Type</Text>
          {ACCIDENT_TYPES.map((type) => (
            <AccidentTypeCard
              key={type.id}
              title={type.title}
              description={type.description}
              icon={type.icon}
              color={type.color}
              selected={selectedType === type.id}
              onPress={() => handleTypeSelect(type.id)}
            />
          ))}
        </View>

        {showSubTypes && (
          <View style={styles.subTypeSection}>
            <Text style={styles.sectionTitle}>General Accident Sub-Type</Text>
            <Text style={styles.sectionDescription}>
              Select the specific type of general accident
            </Text>
            {GENERAL_SUB_TYPES.map((subType) => (
              <AccidentTypeCard
                key={subType.id}
                title={subType.title}
                description={subType.description}
                icon="📋"
                color={subType.color}
                selected={selectedSubType === subType.id}
                onPress={() => handleSubTypeSelect(subType.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.continueButton,
            !canContinue && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          <Text style={[
            styles.continueButtonText,
            !canContinue && styles.continueButtonTextDisabled
          ]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: layouts.spacing.lg,
    paddingBottom: layouts.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: layouts.spacing.sm,
  },
  description: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  typeSection: {
    padding: layouts.spacing.lg,
    paddingTop: 0,
  },
  subTypeSection: {
    padding: layouts.spacing.lg,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    marginTop: layouts.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.sm,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: layouts.spacing.lg,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: layouts.spacing.lg,
    gap: layouts.spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  backButton: {
    flex: 1,
    paddingVertical: layouts.spacing.md,
    paddingHorizontal: layouts.spacing.lg,
    borderRadius: layouts.borderRadius.lg,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  continueButton: {
    flex: 2,
    paddingVertical: layouts.spacing.md,
    paddingHorizontal: layouts.spacing.lg,
    borderRadius: layouts.borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  continueButtonTextDisabled: {
    color: colors.gray500,
  },
});