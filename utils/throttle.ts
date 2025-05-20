import { throttle as lodashThrottle } from 'lodash';

export const throttle = (func: Function, wait: number = 3000) => {
  return lodashThrottle(func, wait, {
    leading: true,
    trailing: true,
  });
};