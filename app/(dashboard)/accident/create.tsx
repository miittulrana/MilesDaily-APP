import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FormInput from '../../../components/FormInput';
import LoadingIndicator from '../../../components/LoadingIndicator';
import AccidentTypeCard from '../../../components/accident/AccidentTypeCard';
import LocationPicker from '../../../components/accident/LocationPicker';
import PhotoCapture from '../../../components/accident/PhotoCapture';
import ContactModal from '../../../components/ContactModal';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { createAccidentReport, getDriverVehicles, uploadAccidentImage, submitAccidentReport } from '../../../lib/accidentService';
import { AccidentType, GeneralSubType, ACCIDENT_TYPES, GENERAL_SUB_TYPES, getRequiredReportType } from '../../../utils/accidentTypes';

interface Vehicle {
  id: string;
  license_plate: string;
  brand: string;
  model?: string;
}

type Step = 'vehicle' | 'type' | 'subtype' | 'report-numbers' | 'forms' | 'photos' | 'location' | 'review';

export default function CreateAccidentScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('vehicle');
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showContactModal, setShowContactModal] = useState(false);
  
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedType, setSelectedType] = useState<AccidentType | null>(null);
  const [selectedSubType, setSelectedSubType] = useState<GeneralSubType | null>(null);
  
  const [accidentDate, setAccidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [accidentTime, setAccidentTime] = useState(new Date().toTimeString().slice(0, 5));
  const [location, setLocation] = useState('');
  const [locationLat, setLocationLat] = useState<number | undefined>();
  const [locationLng, setLocationLng] = useState<number | undefined>();
  const [lesaReportNo, setLesaReportNo] = useState('');
  const [policeReportNo, setPoliceReportNo] = useState('');
  
  const [form1Images, setForm1Images] = useState<string[]>([]);
  const [form2Images, setForm2Images] = useState<string[]>([]);
  const [accidentPhotos, setAccidentPhotos] = useState<string[]>([]);
  
  const [submitting, setSubmitting] = useState(false);

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

  const getStepFlow = (): Step[] => {
    if (selectedType === 'front-to-rear') {
      return ['vehicle', 'type', 'forms', 'photos', 'location', 'review'];
    } else if (selectedType === 'general') {
      return ['vehicle', 'type', 'subtype', 'report-numbers', 'photos', 'location', 'review'];
    }
    return ['vehicle', 'type'];
  };

  const handleNext = async () => {
    const stepFlow = getStepFlow();
    const currentIndex = stepFlow.indexOf(currentStep);
    
    switch (currentStep) {
      case 'vehicle':
        if (!selectedVehicle) {
          Alert.alert('Error', 'Please select a vehicle');
          return;
        }
        setCurrentStep('type');
        break;
        
      case 'type':
        if (!selectedType) {
          Alert.alert('Error', 'Please select accident type');
          return;
        }
        if (selectedType === 'front-to-rear') {
          setCurrentStep('forms');
        } else {
          setCurrentStep('subtype');
        }
        break;
        
      case 'subtype':
        if (!selectedSubType) {
          Alert.alert('Error', 'Please select accident sub-type');
          return;
        }
        setCurrentStep('report-numbers');
        break;
        
      case 'report-numbers':
        const reportType = getRequiredReportType(selectedSubType!);
        if (reportType === 'police' && !policeReportNo.trim()) {
          Alert.alert('Error', 'Police report number is required');
          return;
        }
        if (reportType === 'lesa' && !lesaReportNo.trim()) {
          Alert.alert('Error', 'LESA report number is required');
          return;
        }
        setCurrentStep('photos');
        break;
        
      case 'forms':
        if (selectedType === 'front-to-rear' && form1Images.length === 0) {
          Alert.alert('Error', 'Please upload at least Form 1');
          return;
        }
        setCurrentStep('photos');
        break;
        
      case 'photos':
        if (accidentPhotos.length === 0) {
          Alert.alert('Error', 'Please upload at least one accident photo');
          return;
        }
        setCurrentStep('location');
        break;
        
      case 'location':
        if (!location.trim()) {
          Alert.alert('Error', 'Please enter accident location');
          return;
        }
        setCurrentStep('review');
        break;
        
      case 'review':
        await submitReport();
        break;
    }
  };

  const submitReport = async () => {
    try {
      setSubmitting(true);
      
      const result = await createAccidentReport({
        vehicle_id: selectedVehicle,
        accident_type: selectedType!,
        general_sub_type: selectedSubType || undefined,
        location_address: location,
        location_latitude: locationLat,
        location_longitude: locationLng,
        accident_date: accidentDate,
        accident_time: accidentTime,
        lesa_report_no: lesaReportNo || undefined,
        police_report_no: policeReportNo || undefined,
      });

      if (!result.success || !result.reportId) {
        Alert.alert('Error', result.error || 'Failed to create report');
        return;
      }

      const allImages = [
        ...form1Images.map((uri, index) => ({ uri, type: 'form1' as const, order: index })),
        ...form2Images.map((uri, index) => ({ uri, type: 'form2' as const, order: index })),
        ...accidentPhotos.map((uri, index) => ({ uri, type: 'accident_photo' as const, order: index })),
      ];

      for (let i = 0; i < allImages.length; i++) {
        const image = allImages[i];
        const uploadResult = await uploadAccidentImage(result.reportId, image.uri, image.type, image.order);
        if (!uploadResult.success) {
          Alert.alert('Upload Error', `Failed to upload image ${i + 1}: ${uploadResult.error}`);
          return;
        }
      }

      const submitResult = await submitAccidentReport(result.reportId);
      
      if (submitResult.success) {
        Alert.alert(
          'Success! 🎉',
          'Your accident report has been submitted successfully. An admin will review it soon.',
          [{ text: 'OK', onPress: () => setShowContactModal(true) }]
        );
      } else {
        Alert.alert('Error', submitResult.error || 'Failed to submit report');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    const stepFlow = getStepFlow();
    const currentIndex = stepFlow.indexOf(currentStep);
    
    if (currentIndex > 0) {
      setCurrentStep(stepFlow[currentIndex - 1]);
    } else {
      router.back();
    }
  };

  const renderStepIndicator = () => {
    const steps = getStepFlow();
    const currentIndex = steps.indexOf(currentStep);
    
    return (
      <View style={styles.stepIndicator}>
        {steps.map((step, index) => (
          <View key={step} style={styles.stepIndicatorItem}>
            <View style={[
              styles.stepDot,
              index <= currentIndex && styles.stepDotActive
            ]}>
              <Text style={[
                styles.stepDotText,
                index <= currentIndex && styles.stepDotTextActive
              ]}>
                {index + 1}
              </Text>
            </View>
            {index < steps.length - 1 && (
              <View style={[
                styles.stepLine,
                index < currentIndex && styles.stepLineActive
              ]} />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderContent = () => {
    switch (currentStep) {
      case 'vehicle':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Select Your Vehicle</Text>
            <Text style={styles.stepDescription}>Choose the vehicle involved in the accident</Text>
            
            {loading ? (
              <LoadingIndicator message="Loading vehicles..." />
            ) : (
              <View style={styles.vehicleList}>
                {vehicles.map((vehicle) => (
                  <TouchableOpacity
                    key={vehicle.id}
                    style={[
                      styles.vehicleCard,
                      selectedVehicle === vehicle.id && styles.vehicleCardSelected
                    ]}
                    onPress={() => setSelectedVehicle(vehicle.id)}
                  >
                    <View style={styles.vehicleInfo}>
                      <Text style={styles.vehiclePlate}>{vehicle.license_plate}</Text>
                      <Text style={styles.vehicleDetails}>
                        {vehicle.brand} {vehicle.model}
                      </Text>
                    </View>
                    {selectedVehicle === vehicle.id && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        );
        
      case 'type':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Accident Type</Text>
            <Text style={styles.stepDescription}>Select the type of accident that occurred</Text>
            
            {ACCIDENT_TYPES.map((type) => (
              <AccidentTypeCard
                key={type.id}
                title={type.title}
                description={type.description}
                icon={type.icon}
                color={type.color}
                selected={selectedType === type.id}
                onPress={() => setSelectedType(type.id)}
              />
            ))}
          </View>
        );
        
      case 'subtype':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>General Accident Type</Text>
            <Text style={styles.stepDescription}>Select the specific type of general accident</Text>
            
            {GENERAL_SUB_TYPES.map((subType) => (
              <AccidentTypeCard
                key={subType.id}
                title={subType.title}
                description={subType.description}
                icon="📋"
                color={subType.color}
                selected={selectedSubType === subType.id}
                onPress={() => setSelectedSubType(subType.id)}
              />
            ))}
          </View>
        );
        
      case 'report-numbers':
        const reportType = selectedSubType ? getRequiredReportType(selectedSubType) : 'police';
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Report Numbers</Text>
            <Text style={styles.stepDescription}>Enter the required report number for this accident type</Text>
            
            {reportType === 'police' ? (
              <FormInput
                label="Police Report Number"
                value={policeReportNo}
                onChangeText={setPoliceReportNo}
                placeholder="Enter police report number"
                required
              />
            ) : (
              <FormInput
                label="LESA Report Number"
                value={lesaReportNo}
                onChangeText={setLesaReportNo}
                placeholder="Enter LESA report number"
                required
              />
            )}
            
            <View style={styles.dateTimeRow}>
              <FormInput
                label="Date"
                value={accidentDate}
                onChangeText={setAccidentDate}
                placeholder="YYYY-MM-DD"
                containerStyle={styles.dateInput}
              />
              <FormInput
                label="Time"
                value={accidentTime}
                onChangeText={setAccidentTime}
                placeholder="HH:MM"
                containerStyle={styles.timeInput}
              />
            </View>
          </View>
        );
        
      case 'forms':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Accident Forms</Text>
            <Text style={styles.stepDescription}>Upload clear photos of the completed accident forms</Text>
            
            <PhotoCapture
              imageType="form1"
              title="Form 1"
              description="Upload the first accident form (Required)"
              maxImages={1}
              images={form1Images}
              onImagesChange={setForm1Images}
            />
            
            <PhotoCapture
              imageType="form2"
              title="Form 2"
              description="Upload the second accident form (Optional)"
              maxImages={1}
              images={form2Images}
              onImagesChange={setForm2Images}
            />
          </View>
        );
        
      case 'photos':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Accident Photos</Text>
            <Text style={styles.stepDescription}>Take or select photos of the accident scene and vehicle damage</Text>
            
            <PhotoCapture
              imageType="accident_photo"
              title="Accident Scene Photos"
              description="Upload photos of the accident scene and vehicle damage"
              maxImages={10}
              images={accidentPhotos}
              onImagesChange={setAccidentPhotos}
            />
          </View>
        );
        
      case 'location':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Accident Location</Text>
            <Text style={styles.stepDescription}>Provide the exact location where the accident occurred</Text>
            
            <LocationPicker
              address={location}
              onAddressChange={setLocation}
              onLocationChange={(lat, lng) => {
                setLocationLat(lat);
                setLocationLng(lng);
              }}
            />
          </View>
        );
        
      case 'review':
        const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);
        const selectedTypeData = ACCIDENT_TYPES.find(t => t.id === selectedType);
        const selectedSubTypeData = GENERAL_SUB_TYPES.find(st => st.id === selectedSubType);
        
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Review & Submit</Text>
            <Text style={styles.stepDescription}>Review your accident report before submitting</Text>
            
            <View style={styles.reviewSection}>
              <Text style={styles.reviewSectionTitle}>Vehicle</Text>
              <Text style={styles.reviewText}>
                {selectedVehicleData?.license_plate} - {selectedVehicleData?.brand} {selectedVehicleData?.model}
              </Text>
            </View>
            
            <View style={styles.reviewSection}>
              <Text style={styles.reviewSectionTitle}>Accident Type</Text>
              <Text style={styles.reviewText}>
                {selectedTypeData?.title}
                {selectedSubTypeData && ` (${selectedSubTypeData.title})`}
              </Text>
            </View>
            
            <View style={styles.reviewSection}>
              <Text style={styles.reviewSectionTitle}>Date & Time</Text>
              <Text style={styles.reviewText}>{accidentDate} at {accidentTime}</Text>
            </View>
            
            <View style={styles.reviewSection}>
              <Text style={styles.reviewSectionTitle}>Location</Text>
              <Text style={styles.reviewText}>{location}</Text>
            </View>
            
            {(policeReportNo || lesaReportNo) && (
              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Report Numbers</Text>
                {policeReportNo && <Text style={styles.reviewText}>Police: {policeReportNo}</Text>}
                {lesaReportNo && <Text style={styles.reviewText}>LESA: {lesaReportNo}</Text>}
              </View>
            )}
            
            <View style={styles.reviewSection}>
              <Text style={styles.reviewSectionTitle}>Images</Text>
              <Text style={styles.reviewText}>
                {selectedType === 'front-to-rear' 
                  ? `${form1Images.length + form2Images.length + accidentPhotos.length} images ready to upload`
                  : `${accidentPhotos.length} accident photos ready to upload`
                }
              </Text>
            </View>
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderStepIndicator()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>
      
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          disabled={loading || submitting}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.nextButton, (loading || submitting) && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={loading || submitting}
        >
          {loading || submitting ? (
            <LoadingIndicator size="small" color={colors.background} message="" />
          ) : (
            <Text style={styles.nextButtonText}>
              {currentStep === 'review' ? 'Submit Report' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ContactModal
        visible={showContactModal}
        onClose={() => {
          setShowContactModal(false);
          router.replace('/(dashboard)/accident');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: layouts.spacing.lg,
    paddingHorizontal: layouts.spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  stepIndicatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepDotText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray500,
  },
  stepDotTextActive: {
    color: colors.background,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.gray200,
    marginHorizontal: layouts.spacing.xs,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: layouts.spacing.lg,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: layouts.spacing.sm,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: layouts.spacing.xl,
    lineHeight: 20,
  },
  vehicleList: {
    gap: layouts.spacing.md,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: layouts.spacing.lg,
    borderRadius: layouts.borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  vehicleCardSelected: {
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
  dateTimeRow: {
    flexDirection: 'row',
    gap: layouts.spacing.md,
    marginBottom: layouts.spacing.md,
  },
  dateInput: {
    flex: 1,
  },
  timeInput: {
    flex: 1,
  },
  reviewSection: {
    marginBottom: layouts.spacing.lg,
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.sm,
  },
  reviewText: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  actions: {
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
  nextButton: {
    flex: 2,
    paddingVertical: layouts.spacing.md,
    paddingHorizontal: layouts.spacing.lg,
    borderRadius: layouts.borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});