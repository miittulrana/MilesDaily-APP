import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LoadingIndicator from '../LoadingIndicator';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';

interface PunchButtonProps {
  onPress: () => void;
  loading: boolean;
  type: 'punch_in' | 'punch_out';
  disabled?: boolean;
}

export default function PunchButton({ onPress, loading, type, disabled = false }: PunchButtonProps) {
  const isPunchIn = type === 'punch_in';
  
  const getButtonColors = () => {
    if (disabled) {
      return [colors.gray400, colors.gray500];
    }
    return isPunchIn 
      ? [colors.success, '#059669'] 
      : [colors.error, '#dc2626'];
  };

  const getIconName = () => {
    return isPunchIn ? 'play-circle' : 'stop-circle';
  };

  const getButtonText = () => {
    if (loading) {
      return isPunchIn ? 'Punching In...' : 'Punching Out...';
    }
    return isPunchIn ? 'Punch In' : 'Punch Out';
  };

  const getShadowColor = () => {
    if (disabled) return colors.gray400;
    return isPunchIn ? colors.success : colors.error;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { 
          shadowColor: getShadowColor(),
          shadowOpacity: disabled ? 0.1 : 0.3 
        }
      ]}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={getButtonColors()}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.content}>
          {loading ? (
            <LoadingIndicator size="small" color={colors.background} message="" />
          ) : (
            <Ionicons 
              name={getIconName()} 
              size={28} 
              color={colors.background} 
            />
          )}
          <Text style={styles.buttonText}>
            {getButtonText()}
          </Text>
        </View>

        {!loading && (
          <View style={styles.rippleEffect}>
            <View style={[
              styles.ripple,
              { backgroundColor: colors.background + '20' }
            ]} />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    borderRadius: layouts.borderRadius.xl,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: layouts.spacing.md,
    zIndex: 2,
  },
  buttonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rippleEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  ripple: {
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.3,
  },
});