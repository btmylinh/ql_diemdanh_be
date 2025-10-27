SELECT 
  id, 
  name, 
  status, 
  start_time, 
  end_time,
  CASE 
    WHEN NOW() < start_time THEN 1
    WHEN NOW() >= start_time AND NOW() < end_time THEN 2
    WHEN NOW() >= end_time THEN 3
    ELSE 0
  END as should_be_status
FROM activity 
ORDER BY start_time ASC 
LIMIT 10;
