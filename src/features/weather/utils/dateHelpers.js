export const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('lv-LV', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};