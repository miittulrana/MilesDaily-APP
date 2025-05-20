import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import Logo from '../common/Logo';

interface HeaderProps {
  title?: string;
  showLogo?: boolean;
  showBackButton?: boolean;
  showLogoutButton?: boolean;
  onBackPress?: () => void;
  onLogoutPress?: () => void;
}

export default function Header({
  title,
  showLogo = true,
  showBackButton = false,
  showLogoutButton = false,
  onBackPress,
  onLogoutPress,
}: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {showBackButton && (
          <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
        )}
        {showLogo && <Logo width={80} height={32} />}
      </View>
      
      {title && <Text style={styles.title}>{title}</Text>}
      
      <View style={styles.rightSection}>
        {showLogoutButton && (
          <TouchableOpacity onPress={onLogoutPress} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color={Colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  backButton: {
    marginRight: 8,
  },
  logoutButton: {
    padding: 4,
  },
});