import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FormInput from '../../../components/FormInput';
import LoadingIndicator from '../../../components/LoadingIndicator';
import LocationPicker from '../../../components/accident/LocationPicker';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { getDriverVehicles } from '../../../lib/accidentService';
import { AccidentType, GeneralSubType } from '../../../utils/accidentTypes';

interface Vehicle {
  id: string;
  license_plate: string;
  brand: string;
  model?: string;
}

export default function DetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const accidentType = params.type as AccidentType;
  const accidentSubType = params.subType as GeneralSubType;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  
  const [accidentDate, setAccidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [accidentTime, setAccidentTime] = useState(new Date().toTimeString().slice(0, 5));
  const [location, setLocation] = useState('');
  const [locationLat, setLocationLat] = useState<number | undefined>();
  const [locationLng, setLocationLng] = useState<number | undefined>();
  const [lesaReportNo, setLesaReportNo] = useState('');
  const [policeReportNo, setPoliceReportNo] = useState('');

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await getDriverVehicles();
      setVehicles(data);
      if (data.length === 1) {
        setSelectedVehicle(data[0].id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!selectedVehicle) {
      Alert.alert('Error', 'Please select a vehicle');
      return;
    }
    
    if (!location.trim()) {
      Alert.alert('Error', 'Please enter the accident location');
      return;
    }

    if (accidentSubType === 'lesa' || accidentSubType === 'physical-injury') {
      if (!lesaReportNo.trim()) {
        Alert.alert('Error', 'LESA report number is required for this type of accident');
        return;
      }
    }

    if (accidentSubType === 'police' || accidentSubType === 'physical-injury') {
      if (!policeReportNo.trim()) {
        Alert.alert('Error', 'Police report number is required for this type of accident');
        return;
      }
    }

    const detailsData = {
      type: accidentType,
      subType: accidentSubType,
      vehicleId: selectedVehicle,
      date: accidentDate,
      time: accidentTime,
      location,
      locationLat,
      locationLng,
      lesaReportNo: lesaReportNo.trim() || undefined,
      policeReportNo: policeReportNo.trim() || undefined,
    };

    router.push({
      pathname: '/(dashboard)/accident/photo-upload',
      params: detailsData
    });
  };

  const getAccidentTypeDisplay = () => {
    const typeDisplay = accidentType === 'front-to-rear' ? 'Front-to-Rear' : 'General';
    if (accidentSubType) {
      return `${typeDisplay} (${accidentSubType.toUpperCase()})`;
    }
    return typeDisplay;
  };

  if (loading) {
    return <LoadingIndicator fullScreen message="Loading vehicle information..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Accident Details</Text>
          <Text style={styles.description}>
            Provide specific details about the accident
          </Text>
          <View style={styles.typeDisplay}>
            <Text style={styles.typeText}>Type: {getAccidentTypeDisplay()}</Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
            <View style={styles.vehicleSelector}>
              {vehicles.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle.id}
                  style={[
                    styles.vehicleOption,
                    selectedVehicle === vehicle.id && styles.vehicleOptionSelected
                  ]}
                  onPress={() => setSelectedVehicle(vehicle.id)}
                >
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehiclePlate}>{vehicle.license_plate}</Text>
                    <Text style={styles.vehicleDetails}>
                      {vehicle.brand} {vehicle.model}
                    </Text>
                  </View>
                  <View style={[
                    styles.radioButton,
                    selectedVehicle === vehicle.id && styles.radioButtonSelected
                  ]}>
                    {selectedVehicle === vehicle.id && <View style={styles.radioButtonInner} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date & Time</Text>
            <View style={styles.dateTimeRow}>
              <FormInput
                label="Date"
                value={accidentDate}
                onChangeText={setAccidentDate}
                placeholder="YYYY-MM-DD"
                containerStyle={styles.dateInput}
                required
              />
              <FormInput
                label="Time"
                value={accidentTime}
                onChangeText={setAccidentTime}
                placeholder="HH:MM"
                containerStyle={styles.timeInput}
                required
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <LocationPicker
              address={location}
              onAddressChange={setLocation}
              onLocationChange={(lat, lng) => {
                setLocationLat(lat);
                setLocationLng(lng);
              }}
            />
          </View>

          {(accidentSubType === 'lesa' || accidentSubType === 'physical-injury') && (
            <View style={styles.section}>
              <FormInput
                label="LESA Report Number"
                value={lesaReportNo}
                onChangeText={setLesaReportNo}
                placeholder="Enter LESA report number"
                required
              />
            </View>
          )}

          {(accidentSubType === 'police' || accidentSubType === 'physical-injury') && (
            <View style={styles.section}>
              <FormInput
                label="Police Report Number"
                value={policeReportNo}
                onChangeText={setPoliceReportNo}
                placeholder="Enter police report number"
                required
              />
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={submitting}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.continueButton,
            submitting && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={submitting}
        >
          {submitting ? (
            <LoadingIndicator size="small" color={colors.background} message="" />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
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
    marginBottom: layouts.spacing.md,
  },
  typeDisplay: {
    backgroundColor: colors.primary + '15',
    paddingVertical: layouts.spacing.sm,
    paddingHorizontal: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  form: {
    padding: layouts.spacing.lg,
    paddingTop: 0,
  },
  section: {
    marginBottom: layouts.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.md,
  },
  vehicleSelector: {
    gap: layouts.spacing.md,
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: layouts.spacing.lg,
    borderRadius: layouts.borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  vehicleOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehiclePlate: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  vehicleDetails: {
    fontSize: 14,
    color: colors.textLight,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: layouts.spacing.md,
  },
  dateInput: {
    flex: 1,
  },
  timeInput: {
    flex: 1,
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
    backgroundColor: colors.gray400,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});