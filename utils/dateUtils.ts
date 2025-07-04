import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import { TimeRemaining } from './tempAssignmentTypes';

dayjs.extend(relativeTime);
dayjs.extend(duration);

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

export const calculateTimeRemaining = (endDateTime: string): TimeRemaining => {
  const now = dayjs();
  const end = dayjs(endDateTime);
  const diff = end.diff(now);

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
    };
  }

  const duration = dayjs.duration(diff);

  return {
    days: Math.floor(duration.asDays()),
    hours: duration.hours(),
    minutes: duration.minutes(),
    seconds: duration.seconds(),
    isExpired: false,
  };
};