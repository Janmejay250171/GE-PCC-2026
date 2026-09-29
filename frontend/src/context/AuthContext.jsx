import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginApi,
  signupApi,
  getProfileApi,
  toggleSaveHospitalApi,
  linkPolicyApi,
  deletePolicyApi
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('sehatsure_auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('sehatsure_auth_token') || null;
    } catch {
      return null;
    }
  });

  const [savedHospitals, setSavedHospitals] = useState(() => {
    try {
      const stored = localStorage.getItem('sehatsure_saved_hospitals');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [userPolicies, setUserPolicies] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sync to local storage
  useEffect(() => {
    if (user) {
      localStorage.setItem('sehatsure_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('sehatsure_auth_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('sehatsure_auth_token', token);
    } else {
      localStorage.removeItem('sehatsure_auth_token');
    }
  }, [token]);

  useEffect(() => {
    localStorage.setItem('sehatsure_saved_hospitals', JSON.stringify(savedHospitals));
  }, [savedHospitals]);

  // Load user profile on startup if token exists
  const loadProfile = useCallback(async (currentToken = token) => {
    if (!currentToken) return;
    try {
      setLoading(true);
      const data = await getProfileApi(currentToken);
      if (data.user) {
        setUser(data.user);
      }
      if (data.savedHospitals) {
        setSavedHospitals(data.savedHospitals);
      }
      if (data.policies) {
        setUserPolicies(data.policies);
      }
    } catch (err) {
      console.warn('Could not load profile with stored token:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadProfile(token);
    }
  }, [token, loadProfile]);

  const login = async (email, password) => {
    const res = await loginApi(email, password);
    setUser(res.user);
    setToken(res.token);
    if (res.savedHospitals) {
      setSavedHospitals(res.savedHospitals);
    }
    loadProfile(res.token);
    return res;
  };

  const signup = async (name, email, password, confirmPassword) => {
    const res = await signupApi(name, email, password, confirmPassword);
    setUser(res.user);
    setToken(res.token);
    setSavedHospitals([]);
    loadProfile(res.token);
    return res;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setSavedHospitals([]);
    setUserPolicies([]);
    localStorage.removeItem('sehatsure_auth_user');
    localStorage.removeItem('sehatsure_auth_token');
    localStorage.removeItem('sehatsure_saved_hospitals');
  };

  const isHospitalSaved = useCallback((hospitalName, address = '') => {
    if (!hospitalName) return false;
    const nameNorm = hospitalName.trim().toLowerCase();
    return savedHospitals.some(
      (h) => (h.hospital_name || '').trim().toLowerCase() === nameNorm
    );
  }, [savedHospitals]);

  const toggleSaveHospital = async (hospital, estimate, score) => {
    const hospitalData = {
      hospitalKey: `${hospital.hospital_name}_${hospital.address || hospital.city || ''}`,
      hospital_name: hospital.hospital_name,
      address: hospital.address || '',
      city: hospital.city || '',
      hospital_type: hospital.hospital_type || 'Private',
      tier: hospital.tier || 'Tier 2',
      segment: hospital.segment || 'Standard',
      rating: hospital.rating || 0,
      fitScore: score?.granularScore || score?.finalScore || 0
    };

    if (token) {
      try {
        const res = await toggleSaveHospitalApi(hospitalData, token);
        setSavedHospitals(res.savedHospitals || []);
        return res.isSaved;
      } catch (err) {
        console.error('Failed to toggle save on backend, falling back to local:', err);
      }
    }

    // Fallback to local state if offline or guest
    let newSaved;
    let nowSaved = false;
    const key = hospitalData.hospitalKey;
    const exists = savedHospitals.some((h) => h.hospitalKey === key || h.hospital_name === hospitalData.hospital_name);

    if (exists) {
      newSaved = savedHospitals.filter((h) => h.hospitalKey !== key && h.hospital_name !== hospitalData.hospital_name);
      nowSaved = false;
    } else {
      newSaved = [...savedHospitals, { ...hospitalData, savedAt: new Date().toISOString() }];
      nowSaved = true;
    }
    setSavedHospitals(newSaved);
    return nowSaved;
  };

  const linkCurrentPolicy = async (policyId) => {
    if (token && policyId) {
      try {
        await linkPolicyApi(policyId, token);
        loadProfile(token);
      } catch (err) {
        console.warn('Could not link policy to user:', err);
      }
    }
  };

  const removePolicy = async (policyId) => {
    if (!policyId) return;
    try {
      await deletePolicyApi(policyId);
      setUserPolicies((prev) => prev.filter((p) => p._id !== policyId));
      if (token) {
        loadProfile(token);
      }
    } catch (err) {
      console.error('Failed to remove policy:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        savedHospitals,
        userPolicies,
        loading,
        login,
        signup,
        logout,
        toggleSaveHospital,
        isHospitalSaved,
        loadProfile,
        linkCurrentPolicy,
        removePolicy
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
