import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { getDriver } from '../../services/database';
import Header from '../../components/common/Header';
import Button from '../../components/ui/Button';
import { Colors } from '../../constants/Colors';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { stopBackgroundLocationUpdates } from '../../utils/locationTask';

import { View as CardView } from 'react-native';

function Card({ children, style }: { children: React.ReactNode, style?: any }) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadDriverInfo() {
      if (user) {
        try {
          const userId = (user as any).id;
          const data = await getDriver(userId);
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
            await stopBackgroundLocationUpdates();
            await signOut();
          },
        },
      ]
    );
  };

  const getDisplayName = () => {
    if (!driverInfo) return 'N/A';
    
    if (driverInfo.name) return driverInfo.name;
    
    if (driverInfo.first_name || driverInfo.last_name) {
      return `${driverInfo.first_name || ''} ${driverInfo.last_name || ''}`.trim();
    }
    
    return driverInfo.email ? driverInfo.email.split('@')[0] : 'N/A';
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
            <Text style={styles.infoValue}>{getDisplayName()}</Text>
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
  card: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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