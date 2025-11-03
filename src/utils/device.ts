export const isMobileDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};
