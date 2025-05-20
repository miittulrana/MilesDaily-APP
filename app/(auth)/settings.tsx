import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { getDriver } from '../../services/database';
import Header from '../../components/common/Header';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Colors } from '../../constants/Colors';
import { stopBackgroundLocationUpdates } from '../../utils/locationTask';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadDriverInfo() {
      if (user) {
        try {
          const data = await getDriver(user.id);
          setDriverInfo(data);
        } catch (error) {
          console.error('Error loading driver info:', error);
        } finally {
          setLoading(false);
        }
      }
    }
    
    loadDriverInfo();
  }, [user]);

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout? This will stop tracking your location.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            // Stop background tracking before logout
            await stopBackgroundLocationUpdates();
            await signOut();
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading settings..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Settings"
        showBackButton
        onBackPress={() => router.back()}
      />
      
      <ScrollView style={styles.content}>
        <Card style={styles.profileCard}>
          <Text style={styles.sectionTitle}>Driver Profile</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{driverInfo?.name || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{driverInfo?.email || 'N/A'}</Text>
          </View>
        </Card>
        
        <Card style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Track Interval:</Text>
            <Text style={styles.infoValue}>Every 3 seconds</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Background Tracking:</Text>
            <Text style={styles.infoValue}>Active</Text>
          </View>
        </Card>
        
        <View style={styles.buttonSection}>
          <Button
            title="Go to Tracking"
            onPress={() => router.push('/(auth)/tracking')}
            variant="outline"
            fullWidth
          />
          
          <View style={styles.spacer} />
          
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="secondary"
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    marginBottom: 16,
  },
  settingsCard: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.darkGray,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
  },
  buttonSection: {
    marginVertical: 24,
  },
  spacer: {
    height: 16,
  },
});