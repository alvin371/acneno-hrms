import { env } from '@/config/env';

export const resolveMediaUrl = (value?: string | null) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  const baseOrigin = new URL(env.API_BASE_URL).origin;
  const normalizedPath = value.startsWith('/') ? value.slice(1) : value;
  return `${baseOrigin}/${normalizedPath}`;
};
