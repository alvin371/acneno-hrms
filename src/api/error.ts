import type { AxiosError } from 'axios';

type ApiErrorBody = {
  message?: string | string[];
  errors?: Record<string, string[] | string>;
};

const defaultMessage = 'Something went wrong. Please try again.';

const isAxiosError = (error: unknown): error is AxiosError<ApiErrorBody> =>
  Boolean((error as AxiosError)?.isAxiosError);

const humanizeClientMessage = (message?: string | null) => {
  if (!message) {
    return null;
  }

  const normalized = message.toLowerCase();

  if (
    normalized.includes('geolocation.getcurrentposition is not a function') ||
    (normalized.includes('geolocation') && normalized.includes('not a function'))
  ) {
    return 'Location services are not available in this build. Please update or reinstall the app and try again.';
  }

  return null;
};

const extractMessage = (data?: ApiErrorBody | string | null) => {
  if (!data) {
    return null;
  }

  if (typeof data === 'string') {
    return data;
  }

  if (Array.isArray(data.message)) {
    return data.message.filter(Boolean).join(', ');
  }

  if (typeof data.message === 'string') {
    return data.message;
  }

  if (data.errors) {
    const firstKey = Object.keys(data.errors)[0];
    if (firstKey) {
      const fieldErrors = data.errors[firstKey];
      if (Array.isArray(fieldErrors)) {
        return fieldErrors.filter(Boolean)[0] ?? null;
      }
      if (typeof fieldErrors === 'string') {
        return fieldErrors;
      }
    }
  }

  return null;
};

export const getErrorMessage = (error: unknown) => {
  if (typeof error === 'string') {
    return error;
  }

  if (!isAxiosError(error)) {
    if (error instanceof Error && error.message) {
      const humanized = humanizeClientMessage(error.message);
      if (humanized) {
        return humanized;
      }
      return error.message;
    }
    return defaultMessage;
  }

  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return 'The request is taking too long. Please check your connection and try again.';
    }

    return 'We could not reach the server. Please check your connection and try again.';
  }

  const status = error.response.status;
  const serverMessage = extractMessage(error.response.data);

  if (status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  if (status === 403) {
    return "You don't have permission to do that. Please contact your administrator.";
  }

  if (status === 404) {
    return 'We could not find what you requested. Please refresh and try again.';
  }

  if (status === 409) {
    return serverMessage
      ? `${serverMessage} Please update the details and try again.`
      : 'That request conflicts with existing data. Please update the details and try again.';
  }

  if (status === 422 || status === 400) {
    return serverMessage
      ? `${serverMessage} Please review the details and try again.`
      : 'Some of the information is invalid. Please review the details and try again.';
  }

  if (status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  if (status >= 500) {
    return 'The server is having trouble right now. Please try again in a few minutes.';
  }

  if (serverMessage) {
    return `${serverMessage} Please try again.`;
  }

  if (error.message) {
    return `${error.message} Please try again.`;
  }

  return defaultMessage;
};
