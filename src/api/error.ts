import type { AxiosError } from 'axios';

export const getErrorMessage = (error: unknown) => {
  if (typeof error === 'string') {
    return error;
  }

  const axiosError = error as AxiosError<{ message?: string }>;
  const message = axiosError.response?.data?.message;

  if (message) {
    return message;
  }

  if (axiosError.message) {
    return axiosError.message;
  }

  return 'Something went wrong. Please try again.';
};
