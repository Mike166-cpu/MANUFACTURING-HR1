import { differenceInSeconds, addDays, parse, format } from 'date-fns';

export const calculateDuration = (date, startTime, endTime) => {
  // Parse the times into full Date objects
  const start = parse(startTime, 'HH:mm', new Date(`${date}T00:00:00`));
  let end = parse(endTime, 'HH:mm', new Date(`${date}T00:00:00`));
  
  // If end time is before start time (night shift), add a day to end time
  if (end < start) {
    end = addDays(end, 1);
  }
  
  const seconds = differenceInSeconds(end, start);
  return seconds;
};

export const calculateShiftDuration = calculateDuration;

export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return minutes > 0 ? `${hours} Hours ${minutes} Minutes` : `${hours} Hours`;
};
