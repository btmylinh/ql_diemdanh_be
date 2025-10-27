-- Trigger: Tự động tạo QR code khi tạo hoạt động
CREATE OR REPLACE FUNCTION generate_activity_qr_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Tạo QR code với thông tin hoạt động
    NEW.qr_code := json_build_object(
        'activityId', NEW.id,
        'name', NEW.name,
        'timestamp', EXTRACT(EPOCH FROM NOW())
    )::TEXT;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_qr_code
    BEFORE INSERT ON activity
    FOR EACH ROW
    EXECUTE FUNCTION generate_activity_qr_code();

-- Trigger: Kiểm tra số lượng đăng ký không vượt quá giới hạn
CREATE OR REPLACE FUNCTION check_registration_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_participants INTEGER;
BEGIN
    -- Lấy số lượng đăng ký hiện tại và giới hạn
    SELECT COUNT(*), a.max_participants
    INTO current_count, max_participants
    FROM registration r
    JOIN activity a ON r.id_activity = a.id
    WHERE r.id_activity = NEW.id_activity AND r.status = '1'
    GROUP BY a.max_participants;
    
    -- Kiểm tra giới hạn
    IF max_participants IS NOT NULL AND current_count >= max_participants THEN
        RAISE EXCEPTION 'Hoạt động đã đầy, không thể đăng ký thêm';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_registration_limit
    BEFORE INSERT ON registration
    FOR EACH ROW
    EXECUTE FUNCTION check_registration_limit();

-- Trigger: Tự động cập nhật thống kê khi có điểm danh mới
CREATE OR REPLACE FUNCTION update_attendance_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Có thể thêm logic cập nhật cache hoặc thống kê real-time ở đây
    -- Ví dụ: cập nhật bảng thống kê tổng hợp
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_attendance_stats
    AFTER INSERT ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_attendance_stats();

-- Trigger: Kiểm tra thời gian đăng ký
CREATE OR REPLACE FUNCTION check_registration_deadline()
RETURNS TRIGGER AS $$
DECLARE
    deadline TIMESTAMP;
BEGIN
    -- Lấy deadline đăng ký của hoạt động
    SELECT registration_deadline INTO deadline
    FROM activity
    WHERE id = NEW.id_activity;
    
    -- Kiểm tra deadline
    IF deadline IS NOT NULL AND NOW() > deadline THEN
        RAISE EXCEPTION 'Đã hết hạn đăng ký cho hoạt động này';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_registration_deadline
    BEFORE INSERT ON registration
    FOR EACH ROW
    EXECUTE FUNCTION check_registration_deadline();
