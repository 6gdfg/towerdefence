function summarizeBody(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return trimmed.length > 180 ? `${trimmed.slice(0, 180)}...` : trimmed;
}

function getPayloadError(payload: unknown) {
  if (!payload || typeof payload !== 'object') return '';
  const error = (payload as { error?: unknown }).error;
  return typeof error === 'string' ? error : '';
}

export async function readApiJson<T>(response: Response, fallback: string): Promise<T> {
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';
  let payload: unknown = null;

  if (text.trim()) {
    if (contentType.includes('application/json')) {
      try {
        payload = JSON.parse(text);
      } catch {
        if (response.ok) {
          throw new Error('接口返回了无效 JSON');
        }
      }
    } else if (response.ok) {
      throw new Error(`接口返回格式错误：${summarizeBody(text) || contentType || '非 JSON 响应'}`);
    }
  }

  if (!response.ok) {
    const payloadError = getPayloadError(payload);
    const bodyMessage = summarizeBody(text);
    throw new Error(payloadError || bodyMessage || `${fallback}（HTTP ${response.status}）`);
  }

  return (payload ?? {}) as T;
}
