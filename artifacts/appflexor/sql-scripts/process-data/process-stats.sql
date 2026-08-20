-- Process History Stats
SELECT 
  a.c_title AS business_area,
  c.c_title AS category,
  m.c_title AS process,
  h.c_task_name,
  h.c_task_type,
  h.c_assignee,
  to_timestamp(h.c_created_time::BIGINT / 1000) AS c_created_time,
  to_timestamp(h.c_completed_time::BIGINT / 1000) AS c_completed_time,
  (to_timestamp(h.c_completed_time::BIGINT / 1000) - to_timestamp(h.c_created_time::BIGINT / 1000)) AS cycle_time
FROM app_fd_task_history h
JOIN app_fd_process_map m ON m.c_process_key = h.c_process_definition_key
JOIN app_fd_business_area a ON a.id::text = m.c_business_area
JOIN app_fd_process_category c ON c.id::text = m.c_category;
