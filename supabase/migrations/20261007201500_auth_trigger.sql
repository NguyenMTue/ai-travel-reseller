-- Tạo function để tự động thêm dữ liệu vào bảng merchants hoặc resellers khi có user mới
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role text;
  full_name text;
BEGIN
  -- Lấy thông tin từ raw_user_meta_data truyền vào lúc signUp
  user_role := NEW.raw_user_meta_data->>'role';
  full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Người dùng mới');

  IF user_role = 'merchant' THEN
    INSERT INTO public.merchants (id, name)
    VALUES (NEW.id, full_name);
  ELSIF user_role = 'reseller' THEN
    INSERT INTO public.resellers (id, name, email)
    VALUES (NEW.id, full_name, NEW.email);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Xóa trigger cũ nếu có
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Tạo trigger chạy sau khi insert vào auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
