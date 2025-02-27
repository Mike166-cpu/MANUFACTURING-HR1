const formatDuration = (hours) => {
    if (!hours) return '0h 0m';
  
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
  
    return `${wholeHours}h ${minutes}m`;
  };
  
  module.exports = { formatDuration };