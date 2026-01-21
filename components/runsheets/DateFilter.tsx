import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { formatDate } from '../../utils/dateUtils';

interface DateFilterProps {
    selectedDate: string;
    onDateChange: (date: string) => void;
}

export default function DateFilter({ selectedDate, onDateChange }: DateFilterProps) {
    const [showPicker, setShowPicker] = useState(false);

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowPicker(Platform.OS === 'ios');
        if (selectedDate) {
            const dateString = selectedDate.toISOString().split('T')[0];
            onDateChange(dateString);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.filterRow}>
                <Text style={styles.label}>Select Date:</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowPicker(true)}>
                    <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                    <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
                    <Ionicons name="chevron-down" size={18} color={colors.gray400} />
                </TouchableOpacity>
            </View>

            {showPicker && (
                <DateTimePicker
                    value={new Date(selectedDate)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.card,
        padding: layouts.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: layouts.spacing.sm,
        backgroundColor: colors.background,
        paddingVertical: layouts.spacing.sm,
        paddingHorizontal: layouts.spacing.md,
        borderRadius: layouts.borderRadius.md,
        borderWidth: 1,
        borderColor: colors.gray200,
    },
    dateText: {
        fontSize: 15,
        color: colors.text,
        fontWeight: '600',
    },
});