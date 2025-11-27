import type { ApiResponse } from '@/types';

const isApiResponse = (value: unknown): value is ApiResponse<unknown> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'timestamp' in value &&
    'success' in value
  );
};

export const unwrapApiResponse = <T>(payload: unknown): T => {
  if (isApiResponse(payload)) {
    if (payload.success === false) {
      const message = payload.error ?? payload.message ?? 'Request failed';
      throw new Error(message);
    }
    return (payload.data as T) ?? ({} as T);
  }
  return payload as T;
};

/**
 * Get today's date in YYYY-MM-DD format for date input fields.
 * Uses local timezone to avoid off-by-one errors.
 */
export const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get date string offset by a number of days from today.
 * @param daysOffset - Number of days to offset (negative for past dates)
 */
export const getOffsetDateString = (daysOffset: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
