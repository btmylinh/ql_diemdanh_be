-- Procedure: Tự động cập nhật status hoạt động
CREATE OR REPLACE FUNCTION update_activity_status()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
    now_time TIMESTAMP := NOW();
BEGIN
    -- Cập nhật hoạt động từ "Sắp diễn ra" sang "Đang diễn ra"
    UPDATE activity 
    SET status = 2 
    WHERE status = 1 
      AND start_time <= now_time 
      AND end_time > now_time;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- Cập nhật hoạt động từ "Đang diễn ra" sang "Đã hoàn thành"
    UPDATE activity 
    SET status = 3 
    WHERE status = 2 
      AND end_time <= now_time;
    
    GET DIAGNOSTICS updated_count = updated_count + ROW_COUNT;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Procedure: Tính toán thống kê hoạt động
CREATE OR REPLACE FUNCTION calculate_activity_stats(activity_id INTEGER)
RETURNS TABLE(
    total_registrations INTEGER,
    total_attendances INTEGER,
    attendance_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(reg_count.count, 0)::INTEGER as total_registrations,
        COALESCE(att_count.count, 0)::INTEGER as total_attendances,
        CASE 
            WHEN reg_count.count > 0 THEN 
                ROUND((COALESCE(att_count.count, 0)::DECIMAL / reg_count.count::DECIMAL) * 100, 2)
            ELSE 0 
        END as attendance_rate
    FROM 
        (SELECT COUNT(*) as count FROM registration WHERE id_activity = activity_id AND status = '1') reg_count,
        (SELECT COUNT(*) as count FROM attendance WHERE id_activity = activity_id) att_count;
END;
$$ LANGUAGE plpgsql;

-- Procedure: Tạo báo cáo định kỳ
CREATE OR REPLACE FUNCTION generate_daily_report(report_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
    report_id INTEGER;
    start_of_day TIMESTAMP;
    end_of_day TIMESTAMP;
BEGIN
    start_of_day := report_date::TIMESTAMP;
    end_of_day := (report_date + INTERVAL '1 day')::TIMESTAMP;
    
    -- Kiểm tra xem báo cáo đã tồn tại chưa
    SELECT id INTO report_id 
    FROM periodic_report 
    WHERE DATE(report_date) = report_date;
    
    IF report_id IS NOT NULL THEN
        RETURN report_id; -- Báo cáo đã tồn tại
    END IF;
    
    -- Tạo báo cáo mới
    INSERT INTO periodic_report (
        report_date,
        total_activities,
        activities_created,
        active_activities,
        completed_activities,
        total_users,
        new_users,
        active_users,
        admin_users,
        manager_users,
        student_users,
        registrations_today,
        total_registrations,
        attendances_today,
        total_attendances
    ) VALUES (
        start_of_day,
        (SELECT COUNT(*) FROM activity),
        (SELECT COUNT(*) FROM activity WHERE DATE(created_at) = report_date),
        (SELECT COUNT(*) FROM activity WHERE status = 2),
        (SELECT COUNT(*) FROM activity WHERE status = 3),
        (SELECT COUNT(*) FROM "user"),
        (SELECT COUNT(*) FROM "user" WHERE DATE(created_at) = report_date),
        (SELECT COUNT(*) FROM "user" WHERE status = 1),
        (SELECT COUNT(*) FROM "user" WHERE role = 'admin'),
        (SELECT COUNT(*) FROM "user" WHERE role = 'manager'),
        (SELECT COUNT(*) FROM "user" WHERE role = 'student'),
        (SELECT COUNT(*) FROM registration WHERE DATE(created_at) = report_date),
        (SELECT COUNT(*) FROM registration),
        (SELECT COUNT(*) FROM attendance WHERE DATE(checkin_time) = report_date),
        (SELECT COUNT(*) FROM attendance)
    ) RETURNING id INTO report_id;
    
    RETURN report_id;
END;
$$ LANGUAGE plpgsql;
