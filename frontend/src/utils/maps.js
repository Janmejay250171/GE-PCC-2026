/**
 * Utility for generating Google Maps URLs and opening Google Maps
 * for hospital locations using coordinates or name + address.
 */

export function getGoogleMapsUrl(hospital = {}) {
  if (!hospital) return 'https://www.google.com/maps';

  const hospitalName = hospital.name || hospital.hospital_name || '';
  const latVal =
    hospital.latitude ??
    hospital.lat ??
    (hospital.coordinates && (hospital.coordinates.lat || hospital.coordinates.latitude || hospital.coordinates[1]));
  const lngVal =
    hospital.longitude ??
    hospital.lng ??
    (hospital.coordinates && (hospital.coordinates.lng || hospital.coordinates.longitude || hospital.coordinates[0]));

  // If explicit latitude and longitude coordinates are provided
  if (latVal != null && lngVal != null && !isNaN(Number(latVal)) && !isNaN(Number(lngVal))) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latVal},${lngVal}`)}`;
  }

  const address = hospital.address || '';
  const city = hospital.city || '';

  // Check if address itself contains coordinates like "12.9716, 77.5946" or "12.9716,77.5946"
  if (address) {
    const coordMatch = address.match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
    if (coordMatch) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${coordMatch[1]},${coordMatch[2]}`)}`;
    }
  }

  // Build high-accuracy search query: "Hospital Name, Address, City"
  const parts = [];
  if (hospitalName) parts.push(hospitalName.trim());
  if (address && (!hospitalName || !address.toLowerCase().includes(hospitalName.toLowerCase()))) {
    parts.push(address.trim());
  }
  if (city && (!address || !address.toLowerCase().includes(city.toLowerCase()))) {
    parts.push(city.trim());
  }

  const query = parts.length > 0 ? parts.join(', ') : (hospitalName || address || city || 'hospital');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function openGoogleMaps(hospital = {}, e) {
  if (e && e.stopPropagation) {
    e.stopPropagation();
  }
  const url = getGoogleMapsUrl(hospital);
  window.open(url, '_blank', 'noopener,noreferrer');
}
