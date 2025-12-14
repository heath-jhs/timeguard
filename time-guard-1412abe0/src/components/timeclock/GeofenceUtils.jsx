// Haversine formula to calculate distance between two GPS coordinates
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export function isWithinGeofence(userLat, userLon, siteLat, siteLon, radiusMeters = 100) {
  const distance = calculateDistance(userLat, userLon, siteLat, siteLon);
  return {
    isWithin: distance <= radiusMeters,
    distance: Math.round(distance),
    radiusMeters
  };
}

export function formatDuration(startTime, endTime) {
  if (!startTime) return '0h 0m';
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const diff = Math.abs(end - start);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

export function formatTime(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString([], { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
}