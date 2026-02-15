export const getSavedCarColor = (): number => {
  const savedCarColor = localStorage.getItem('carColor');
  return savedCarColor ? parseInt(savedCarColor, 16) : 0xff0000; // default to red
};

// eslint-disable-next-line no-unused-vars
export const setupColorPicker = (onColorChange: (color: number) => void) => {
  const carColor = getSavedCarColor();
  const colorPicker = document.getElementById('carColorPicker') as HTMLInputElement;
  if (colorPicker) {
    // Set initial color from saved value
    colorPicker.value = '#' + carColor.toString(16).padStart(6, '0');

    colorPicker.addEventListener('input', (e) => {
      const hexColor = (e.target as HTMLInputElement).value;
      const numColor = parseInt(hexColor.substring(1), 16);
      localStorage.setItem('carColor', numColor.toString(16));
      onColorChange(numColor);
    });
  }
};
