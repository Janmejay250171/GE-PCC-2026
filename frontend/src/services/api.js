export async function uploadPolicyPdf(file, onProgressStep) {
  const formData = new FormData();
  formData.append('file', file);

  if (onProgressStep) onProgressStep('Uploading…');

  const res = await fetch('/api/policy/upload', {
    method: 'POST',
    body: formData
  });

  const data = await res.json();

  if (!res.ok && res.status !== 422) {
    throw new Error(data.error?.message || 'Failed to upload and analyze policy.');
  }

  return data;
}

export async function getDemoPolicies() {
  const res = await fetch('/api/policy/demo');
  if (!res.ok) {
    throw new Error('Failed to fetch demo policies.');
  }
  return res.json();
}

export async function createPolicyFromDemo(key) {
  const res = await fetch(`/api/policy/demo/${key}`, {
    method: 'POST'
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Failed to initialize demo policy.');
  }
  return data;
}

export async function getPolicy(id) {
  const res = await fetch(`/api/policy/${id}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Policy not found.');
  }
  return data;
}

export async function updatePolicy(id, updates) {
  const res = await fetch(`/api/policy/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error?.message || 'Failed to save policy updates.');
    err.details = data.missingRequired || data.error?.details;
    throw err;
  }
  return data;
}

export async function deletePolicyApi(id) {
  const res = await fetch(`/api/policy/${id}`, {
    method: 'DELETE'
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Failed to delete policy.');
  }
  return data;
}

export async function signupApi(name, email, password, confirmPassword) {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, confirmPassword })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Failed to sign up.');
  }
  return data;
}

export async function loginApi(email, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Failed to log in.');
  }
  return data;
}

export async function getProfileApi(token) {
  const res = await fetch('/api/auth/profile', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Failed to load profile.');
  }
  return data;
}

export async function toggleSaveHospitalApi(hospitalData, token) {
  const res = await fetch('/api/auth/saved-hospitals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(hospitalData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Failed to save hospital.');
  }
  return data;
}

export async function linkPolicyApi(policyId, token) {
  const res = await fetch('/api/auth/link-policy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ policyId })
  });
  return await res.json();
}

