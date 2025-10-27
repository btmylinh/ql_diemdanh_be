-- Kiểm tra các function trong database
SELECT 
    proname as function_name,
    prokind as function_type,
    prosrc as function_source
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY proname;
