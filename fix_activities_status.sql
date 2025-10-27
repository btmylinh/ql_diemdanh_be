-- Fix activities with incorrect status
UPDATE activity 
SET status = CASE 
  WHEN NOW() < start_time THEN 1
  WHEN NOW() >= start_time AND NOW() < end_time THEN 2
  WHEN NOW() >= end_time THEN 3
  ELSE 0
END
WHERE status != CASE 
  WHEN NOW() < start_time THEN 1
  WHEN NOW() >= start_time AND NOW() < end_time THEN 2
  WHEN NOW() >= end_time THEN 3
  ELSE 0
END;
