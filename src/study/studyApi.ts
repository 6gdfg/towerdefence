import { getToken } from '../td/authProgress';
import { readApiJson } from '../td/apiClient';
import type { StudyProgressWire } from './types';

export async function fetchStudyProgress() {
  const token = getToken();
  if (!token) return null;
  const response = await fetch('/api/study', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await readApiJson<{ progress?: StudyProgressWire | null }>(response, 'Failed to load study progress');
  return payload.progress ?? null;
}

export async function saveStudyProgressToCloud(progress: StudyProgressWire) {
  const token = getToken();
  if (!token) return null;
  const response = await fetch('/api/study', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ progress }),
  });
  return readApiJson<{ ok: boolean }>(response, 'Failed to save study progress');
}
