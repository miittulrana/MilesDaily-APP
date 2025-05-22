import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const formatDate = (date: string | Date): string => {
  return dayjs(date).format('DD/MM/YYYY');
};

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('DD/MM/YYYY HH:mm');
};

export const formatTime = (date: string | Date): string => {
  return dayjs(date).format('HH:mm');
};

export const getRelativeTime = (date: string | Date): string => {
  return dayjs(date).fromNow();
};

export const getCurrentDate = (): string => {
  return dayjs().format('YYYY-MM-DD');
};

export const addDays = (date: string | Date, days: number): string => {
  return dayjs(date).add(days, 'day').format('YYYY-MM-DD');
};

export const subtractDays = (date: string | Date, days: number): string => {
  return dayjs(date).subtract(days, 'day').format('YYYY-MM-DD');
};

export const getStartOfMonth = (): string => {
  return dayjs().startOf('month').format('YYYY-MM-DD');
};

export const getEndOfMonth = (): string => {
  return dayjs().endOf('month').format('YYYY-MM-DD');
};