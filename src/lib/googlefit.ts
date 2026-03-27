const SCOPE = 'https://www.googleapis.com/auth/fitness.activity.read';
const AGGREGATE_URL = 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate';

/**
 * Fetch today's step count from Google Fit via the REST API.
 * Uses Google Identity Services for OAuth — opens a consent popup
 * the first time, then uses a cached token for subsequent calls.
 */
export function fetchGoogleFitSteps(): Promise<number> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) return Promise.reject(new Error('VITE_GOOGLE_CLIENT_ID not set'));

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPE,
        callback: async (response) => {
          if (response.error) {
            reject(new Error(response.error));
            return;
          }
          try {
            const steps = await querySteps(response.access_token);
            resolve(steps);
          } catch (err) {
            reject(err);
          }
        },
      });
      tokenClient.requestAccessToken({ prompt: '' }); // empty prompt = use cached consent
    } catch (err) {
      reject(new Error('Google Identity Services not loaded'));
    }
  });
}

async function querySteps(accessToken: string): Promise<number> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const res = await fetch(AGGREGATE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      aggregateBy: [
        {
          dataTypeName: 'com.google.step_count.delta',
          dataSourceId:
            'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
        },
      ],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: startOfDay.getTime(),
      endTimeMillis: now.getTime(),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fitness API error: ${res.status} — ${text}`);
  }

  const data = await res.json();
  let total = 0;
  for (const bucket of data.bucket || []) {
    for (const dataset of bucket.dataset || []) {
      for (const point of dataset.point || []) {
        for (const val of point.value || []) {
          total += val.intVal || 0;
        }
      }
    }
  }
  return total;
}
