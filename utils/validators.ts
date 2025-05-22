export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const validateAmount = (amount: string): boolean => {
  const amountRegex = /^\d+(\.\d{1,2})?$/;
  return amountRegex.test(amount) && parseFloat(amount) > 0;
};

export const validateOdometer = (value: string): boolean => {
  const numValue = parseFloat(value);
  return !isNaN(numValue) && numValue > 0;
};

export const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  if (password.length < 6) return 'weak';
  if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) return 'strong';
  return 'medium';
};

export const validateFuelRecordForm = (data: {
  amount_euros: string;
  current_km: string;
}): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  if (!validateRequired(data.amount_euros)) {
    errors.amount_euros = 'Amount is required';
  } else if (!validateAmount(data.amount_euros)) {
    errors.amount_euros = 'Amount must be a valid number greater than 0';
  }
  
  if (!validateRequired(data.current_km)) {
    errors.current_km = 'Current kilometers is required';
  } else if (!validateOdometer(data.current_km)) {
    errors.current_km = 'Current kilometers must be a valid number greater than 0';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};