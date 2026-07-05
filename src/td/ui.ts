import type { CSSProperties } from 'react';

export const btnStyle = (disabled = false): CSSProperties => ({
  padding: '6px 10px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  background: disabled ? '#f3f4f6' : '#fff',
  color: disabled ? '#9ca3af' : '#111827',
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.15s ease',
});
