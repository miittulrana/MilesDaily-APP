// Format latitude and longitude to readable format
export const formatCoordinates = (lat: number, lng: number, precision: number = 6): string => {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
};

// Format speed from m/s to km/h
export const formatSpeed = (speedMps: number | null | undefined): string => {
  if (speedMps === null || speedMps === undefined) {
    return 'N/A';
  }
  
  const speedKmh = speedMps * 3.6; // Convert m/s to km/h
  return `${Math.round(speedKmh)} km/h`;
};

// Format battery level from decimal to percentage
export const formatBatteryLevel = (level: number | null | undefined): string => {
  if (level === null || level === undefined) {
    return 'Unknown';
  }
  
  return `${Math.round(level * 100)}%`;
};

// Format timestamp to readable time
export const formatTimestamp = (timestamp: number | string): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// Format timestamp to date and time
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