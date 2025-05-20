import React from 'react';
import { View, StyleSheet, Image, SafeAreaView } from 'react-native';
import LoginForm from '../components/auth/LoginForm';
import Logo from '../components/common/Logo';
import { Colors } from '../constants/Colors';

export default function LoginScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Logo width={200} height={80} />
      </View>
      
      <View style={styles.formContainer}>
        <LoginForm />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
});