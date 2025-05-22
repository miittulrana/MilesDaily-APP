import { forwardRef } from 'react';
import {
    KeyboardTypeOptions,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View
} from 'react-native';
import { colors } from '../constants/colors';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: object;
  keyboardType?: KeyboardTypeOptions;
  required?: boolean;
}

const FormInput = forwardRef<TextInput, FormInputProps>((props, ref) => {
  const { 
    label, 
    error, 
    containerStyle, 
    keyboardType = 'default',
    required = false,
    ...inputProps 
  } = props;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        ref={ref}
        style={[
          styles.input,
          error ? styles.inputError : null,
          inputProps.editable === false ? styles.inputDisabled : null
        ]}
        placeholderTextColor={colors.gray400}
        keyboardType={keyboardType}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: colors.text,
  },
  required: {
    color: colors.error,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputDisabled: {
    backgroundColor: colors.gray100,
    color: colors.gray500,
  },
  error: {
    marginTop: 4,
    fontSize: 12,
    color: colors.error,
  },
});

export default FormInput;