export async function fetchCities(query = '') {
  const url = query ? `/api/hospitals/cities?q=${encodeURIComponent(query)}` : '/api/hospitals/cities';
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to load cities list.');
  }
  const data = await res.json();
  return data.cities || [];
}

export async function fetchTaxonomy() {
  const res = await fetch('/api/hospitals/taxonomy');
  if (!res.ok) {
    throw new Error('Failed to load clinical taxonomy.');
  }
  return res.json();
}

export async function searchHospitals(params) {
  const res = await fetch('/api/hospitals/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Failed to search hospitals.');
  }
  return res.json();
}

export async function fetchHospitalBreakdown(params) {
  const res = await fetch('/api/hospitals/breakdown', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Failed to calculate bill breakdown.');
  }
  return res.json();
}
