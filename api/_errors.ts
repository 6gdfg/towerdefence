export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim()) {
    return error;
  }
  return String(error);
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}
