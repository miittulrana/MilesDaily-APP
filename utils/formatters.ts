export const formatCoordinates = (lat: number, lng: number, precision: number = 6): string => {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
};

export const formatSpeed = (speedMps: number | null | undefined): string => {
  if (speedMps === null || speedMps === undefined) {
    return 'N/A';
  }
  
  const speedKmh = speedMps * 3.6;
  return `${Math.round(speedKmh)} km/h`;
};

export const formatBatteryLevel = (level: number | null | undefined): string => {
  if (level === null || level === undefined) {
    return 'Unknown';
  }
  
  return `${Math.round(level * 100)}%`;
};

export const formatTimestamp = (timestamp: number | string): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export const formatDateTime = (timestamp: number | string): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};