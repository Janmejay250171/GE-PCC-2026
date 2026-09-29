/**
 * Care Journey API Client
 * Persists and retrieves Care Journey states and simulated event stream
 * with resilient localStorage fallbacks.
 */

export async function fetchJourneyState(journeyId) {
  try {
    const res = await fetch(`/api/journey/${encodeURIComponent(journeyId)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[JourneyAPI] Backend fetch error, checking localStorage:', err);
  }

  // LocalStorage fallback: check both keys
  try {
    const saved = localStorage.getItem(`sehatsure_state_${journeyId}`) ||
                  localStorage.getItem(`sehatsure_journey_${journeyId}`);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }

  return null;
}

export async function postJourneyEvent(journeyId, payload) {
  try {
    const res = await fetch(`/api/journey/${encodeURIComponent(journeyId)}/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.state) {
        try {
          localStorage.setItem(`sehatsure_state_${journeyId}`, JSON.stringify(data.state));
          localStorage.setItem(`sehatsure_journey_${journeyId}`, JSON.stringify(data.state));
        } catch {
          // ignore
        }
      }
      return data;
    }
  } catch (err) {
    console.warn('[JourneyAPI] Backend event post failed, falling back to local evaluation:', err);
  }

  return null;
}

export async function syncJourneyState(journeyId, state) {
  try {
    localStorage.setItem(`sehatsure_state_${journeyId}`, JSON.stringify(state));
    localStorage.setItem(`sehatsure_journey_${journeyId}`, JSON.stringify(state));
  } catch {
    // ignore
  }

  try {
    const res = await fetch(`/api/journey/${encodeURIComponent(journeyId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    // ignore
  }

  return state;
}

export async function resetJourneyState(journeyId) {
  try {
    localStorage.removeItem(`sehatsure_state_${journeyId}`);
    localStorage.removeItem(`sehatsure_journey_${journeyId}`);
  } catch {
    // ignore
  }

  try {
    await fetch(`/api/journey/${encodeURIComponent(journeyId)}/reset`, {
      method: 'POST'
    });
  } catch {
    // ignore
  }
}

export async function resolveAlertApi(journeyId, alertId) {
  try {
    const res = await fetch(`/api/journey/${encodeURIComponent(journeyId)}/alerts/${encodeURIComponent(alertId)}/resolve`, {
      method: 'POST'
    });
    if (res.ok) return await res.json();
  } catch {
    // ignore
  }
  return null;
}
