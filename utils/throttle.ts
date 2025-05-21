import { throttle as lodashThrottle } from 'lodash';

export const throttle = <T extends (...args: any[]) => any>(
  func: T, 
  wait: number = 3000
) => {
  return lodashThrottle(func, wait, {
    leading: true,
    trailing: true,
  });
};