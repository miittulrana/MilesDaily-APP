export const formatCurrency = (value: number): string => {
  return `€${value.toFixed(2)}`;
};

export const formatNumber = (value: number, decimals = 2): string => {
  return value.toFixed(decimals);
};

export const formatDistance = (value: number): string => {
  return `${value.toFixed(1)} km`;
};

export const formatConsumption = (value: number): string => {
  return `${value.toFixed(2)} L/100km`;
};

export const formatVolume = (value: number): string => {
  return `${value.toFixed(2)} L`;
};

export const parseFloatSafe = (value: string): number => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};