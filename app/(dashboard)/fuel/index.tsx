import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Modal, ScrollView } from 'react-native';
import ErrorMessage from '../../../components/ErrorMessage';
import FuelRecordCard from '../../../components/fuel/FuelRecordCard';
import LoadingIndicator from '../../../components/LoadingIndicator';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { getDriverInfo } from '../../../lib/auth';
import { getAllFuelRecords } from '../../../lib/fuelService';
import { DriverInfo, FuelRecord } from '../../../utils/types';
import { supabase } from '../../../lib/supabase';
import { formatDate } from '../../../utils/dateUtils';

export default function FuelRecordsScreen() {
  const router = useRouter();
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [vehicle, setVehicle] = useState<any | null>(null);
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<FuelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDateModal, setShowDateModal] = useState(false);
  const [showAllRecords, setShowAllRecords] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  useEffect(() => {
    const loadDriver = async () => {
      try {
        setLoading(true);
        const driverData = await getDriverInfo();
        setDriver(driverData);
        
        if (driverData?.id) {
          try {
            const vehicleResponse = await fetch(`https://fleet.milesxp.com/api/drivers/${driverData.id}/vehicle`);
            if (vehicleResponse.ok) {
              const vehicleData = await vehicleResponse.json();
              if (vehicleData) {
                setVehicle(vehicleData);
              }
            } else {
              throw new Error('Web API vehicle fetch failed');
            }
          } catch (apiError) {
            console.error('Error fetching from API, falling back to local DB:', apiError);
            const { data: localVehicle } = await supabase
              .from('vehicles')
              .select('*')
              .eq('driver_id', driverData.id)
              .eq('status', 'assigned')
              .single();
              
            if (localVehicle) {
              setVehicle(localVehicle);
            }
          }
        }
      } catch (error) {
        console.error('Error loading driver info:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDriver();
  }, []);
  
  const fetchRecords = useCallback(async () => {
    if (driver?.id && vehicle?.id) {
      try {
        setRecordsLoading(true);
        setError(null);
        
        const data = await getAllFuelRecords(driver.id, vehicle.id);
        setRecords(data);
        setFilteredRecords(data);
      } catch (err) {
        setError('Failed to load fuel records');
        console.error('Error fetching fuel records:', err);
      } finally {
        setRecordsLoading(false);
      }
    }
  }, [driver, vehicle]);

  useFocusEffect(
    useCallback(() => {
      if (driver?.id && vehicle?.id) {
        fetchRecords();
      }
    }, [driver, vehicle, fetchRecords])
  );

  const handleAddFuel = () => {
    router.push('/(dashboard)/fuel/add');
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowAllRecords(false);
    setShowDateModal(false);
    filterRecordsByDate(date);
  };

  const filterRecordsByDate = (date: Date) => {
    // Get the selected date in YYYY-MM-DD format
    const selectedYear = date.getFullYear();
    const selectedMonth = String(date.getMonth() + 1).padStart(2, '0');
    const selectedDay = String(date.getDate()).padStart(2, '0');
    const selectedDateString = `${selectedYear}-${selectedMonth}-${selectedDay}`;
    
    console.log('Filtering for date:', selectedDateString);
    
    const filtered = records.filter(record => {
      // Get the record date in YYYY-MM-DD format
      const recordDate = new Date(record.created_at);
      const recordYear = recordDate.getFullYear();
      const recordMonth = String(recordDate.getMonth() + 1).padStart(2, '0');
      const recordDay = String(recordDate.getDate()).padStart(2, '0');
      const recordDateString = `${recordYear}-${recordMonth}-${recordDay}`;
      
      console.log('Record date:', recordDateString, 'Match:', recordDateString === selectedDateString);
      
      return recordDateString === selectedDateString;
    });
    
    console.log('Filtered records count:', filtered.length);
    setFilteredRecords(filtered);
  };

  const showAllRecordsHandler = () => {
    setShowAllRecords(true);
    setFilteredRecords(records);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(calendarMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCalendarMonth(newMonth);
  };

  const getMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    if (showAllRecords) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isFutureDate = (date: Date) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date > today;
  };

  const displayRecords = showAllRecords ? records : filteredRecords;

  if (loading) {
    return <LoadingIndicator fullScreen message="Loading..." />;
  }

  if (!driver) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Unable to load driver information</Text>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>No vehicle assigned to your account</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.vehicleSection}>
          <Text style={styles.vehicleNumber}>{vehicle.license_plate}</Text>
        </View>
        
        <TouchableOpacity style={styles.addButton} onPress={handleAddFuel}>
          <View style={styles.addButtonContent}>
            <Ionicons name="add" size={20} color={colors.background} />
            <Text style={styles.addButtonText}>Record Fuel</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Date Filter Section */}
      <View style={styles.filterSection}>
        <TouchableOpacity 
          style={[styles.filterButton, showAllRecords && styles.filterButtonActive]} 
          onPress={showAllRecordsHandler}
        >
          <Text style={[styles.filterButtonText, showAllRecords && styles.filterButtonTextActive]}>
            All Records
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, !showAllRecords && styles.filterButtonActive]} 
          onPress={() => setShowDateModal(true)}
        >
          <Ionicons name="calendar-outline" size={16} color={showAllRecords ? colors.textLight : colors.background} />
          <Text style={[styles.filterButtonText, !showAllRecords && styles.filterButtonTextActive]}>
            {showAllRecords ? 'Select Date' : formatDate(selectedDate)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Selection Modal */}
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDateModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDateModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={() => {}}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity 
                onPress={() => setShowDateModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.textLight} />
              </TouchableOpacity>
            </View>
            
            {/* Calendar */}
            <View style={styles.calendarContainer}>
              {/* Month Navigation */}
              <View style={styles.monthNavigation}>
                <TouchableOpacity 
                  style={styles.navButton}
                  onPress={() => changeMonth('prev')}
                >
                  <Ionicons name="chevron-back" size={20} color={colors.primary} />
                </TouchableOpacity>
                
                <Text style={styles.monthYearText}>
                  {getMonthYear(calendarMonth)}
                </Text>
                
                <TouchableOpacity 
                  style={styles.navButton}
                  onPress={() => changeMonth('next')}
                >
                  <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Week Days Header */}
              <View style={styles.weekDaysContainer}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <Text key={day} style={styles.weekDayText}>{day}</Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {getDaysInMonth(calendarMonth).map((date, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarDay,
                      date && isToday(date) && styles.todayDay,
                      date && isSelected(date) && styles.selectedDay,
                      date && isFutureDate(date) && styles.disabledDay,
                    ]}
                    onPress={() => date && !isFutureDate(date) && handleDateSelect(date)}
                    disabled={!date || isFutureDate(date)}
                  >
                    {date && (
                      <Text style={[
                        styles.calendarDayText,
                        isToday(date) && styles.todayDayText,
                        isSelected(date) && styles.selectedDayText,
                        isFutureDate(date) && styles.disabledDayText,
                      ]}>
                        {date.getDate()}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Records Section */}
      <View style={styles.recordsContainer}>
        {recordsLoading ? (
          <LoadingIndicator message="Loading fuel records..." />
        ) : (
          <>
            {error && <ErrorMessage message={error} />}

            {displayRecords.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="water-outline" size={48} color={colors.gray400} />
                </View>
                <Text style={styles.emptyStateTitle}>
                  {showAllRecords ? 'No Fuel Records' : 'No Records for Selected Date'}
                </Text>
                <Text style={styles.emptyStateDescription}>
                  {showAllRecords 
                    ? 'Start tracking your fuel expenses by recording your first fuel purchase'
                    : `No fuel records found for ${formatDate(selectedDate)}`
                  }
                </Text>
                {showAllRecords && (
                  <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddFuel}>
                    <Text style={styles.emptyStateButtonText}>Record First Fuel</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <FlatList
                data={displayRecords}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <FuelRecordCard 
                    record={item} 
                    showManualTag={true}
                  />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: layouts.spacing.lg,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layouts.spacing.lg,
    paddingVertical: layouts.spacing.lg,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  vehicleSection: {
    flex: 1,
  },
  vehicleNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: layouts.borderRadius.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: layouts.spacing.sm,
  },
  addButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  filterSection: {
    flexDirection: 'row',
    paddingHorizontal: layouts.spacing.lg,
    paddingVertical: layouts.spacing.md,
    gap: layouts.spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: layouts.borderRadius.full,
    backgroundColor: colors.gray100,
    gap: layouts.spacing.xs,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textLight,
  },
  filterButtonTextActive: {
    color: colors.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: layouts.borderRadius.xl,
    width: '95%',
    maxWidth: 400,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: layouts.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: colors.background,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
    marginLeft: layouts.spacing.md,
  },
  calendarContainer: {
    padding: layouts.spacing.lg,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layouts.spacing.lg,
  },
  navButton: {
    padding: layouts.spacing.sm,
    borderRadius: layouts.borderRadius.md,
    backgroundColor: colors.gray100,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginBottom: layouts.spacing.sm,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: colors.textLight,
    paddingVertical: layouts.spacing.sm,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: layouts.borderRadius.sm,
    marginBottom: 2,
  },
  todayDay: {
    backgroundColor: colors.primary + '20',
  },
  selectedDay: {
    backgroundColor: colors.primary,
  },
  disabledDay: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  todayDayText: {
    color: colors.primary,
    fontWeight: '600',
  },
  selectedDayText: {
    color: colors.background,
    fontWeight: '600',
  },
  disabledDayText: {
    color: colors.gray400,
  },
  recordsContainer: {
    flex: 1,
  },
  listContent: {
    padding: layouts.spacing.lg,
    paddingBottom: layouts.spacing.xl,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: layouts.spacing.xl,
    paddingTop: layouts.spacing.xxxl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: layouts.spacing.lg,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: layouts.spacing.sm,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: layouts.spacing.xl,
    lineHeight: 22,
    paddingHorizontal: layouts.spacing.lg,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: layouts.borderRadius.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  emptyStateButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});