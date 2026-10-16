import type { Metadata } from "next";
import { PolicyPage } from "@/src/components/legal/policy-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Chính sách quyền riêng tư của nền tảng TravelLink AI.",
};

export default function PrivacyPolicyPage() {
  return <PolicyPage
    kind="privacy"
    title="Privacy Policy"
    description="Thông tin về dữ liệu có thể được xử lý khi Merchant và Reseller sử dụng TravelLink AI."
    updatedLabel="Phiên bản hiển thị · Cần xác nhận ngày có hiệu lực trước khi phát hành"
    sections={[
      { title: "Thông tin có thể được xử lý", paragraphs: [
        "Tùy tính năng được sử dụng, nền tảng có thể xử lý thông tin tài khoản như tên hiển thị, địa chỉ email, vai trò và thông tin xác thực phiên; thông tin do người dùng nhập về sản phẩm, chiến dịch, nội dung và hồ sơ cộng tác.",
        "Khi dùng liên kết theo dõi, dữ liệu sự kiện như mã chiến dịch, mã liên kết, thời điểm truy cập và thông tin kỹ thuật cần thiết để ghi nhận lượt giới thiệu có thể được xử lý. Không gửi thông tin nhạy cảm của khách hàng qua nội dung quảng bá hoặc liên kết nếu không cần thiết.",
      ] },
      { title: "Mục đích sử dụng", paragraphs: [
        "Thông tin có thể được dùng để cung cấp chức năng đăng nhập và phân quyền, hiển thị chiến dịch, tạo và quản lý liên kết theo dõi, thống kê hoạt động, hỗ trợ vận hành, bảo vệ tài khoản và xử lý sự cố.",
        "Nền tảng chỉ nên sử dụng dữ liệu cho các mục đích phù hợp với tính năng đang cung cấp và thông tin đã được thông báo cho người dùng. Cơ sở xử lý cụ thể cho từng loại dữ liệu cần được đơn vị vận hành rà soát và xác nhận.",
      ] },
      { title: "Vai trò của Merchant và Reseller", paragraphs: [
        "Merchant chịu trách nhiệm cân nhắc dữ liệu cá nhân đưa vào thông tin sản phẩm, chiến dịch hoặc nội dung quảng bá và cần tránh cung cấp dữ liệu không cần thiết.",
        "Reseller cần sử dụng dữ liệu chiến dịch và liên kết theo đúng mục đích, không thu thập hoặc chia sẻ thêm thông tin của khách hàng nếu chưa có căn cứ và thông báo phù hợp.",
      ] },
      { title: "Lưu trữ và bảo vệ thông tin", paragraphs: [
        "Dữ liệu được xử lý thông qua các thành phần kỹ thuật của dự án và nhà cung cấp dịch vụ được cấu hình cho nền tảng. Quyền truy cập được giới hạn theo tính năng và vai trò ở mức hệ thống hỗ trợ.",
        "Thời hạn lưu trữ, địa điểm xử lý, biện pháp bảo vệ cụ thể, quy trình xử lý sự cố và danh sách nhà cung cấp cần được đơn vị vận hành xác minh và bổ sung trước khi phát hành chính thức. Không có thời hạn lưu trữ hoặc cam kết bảo mật cụ thể nào được xác lập trên trang này.",
      ] },
      { title: "Chia sẻ dữ liệu", paragraphs: [
        "Một số dữ liệu có thể được xử lý bởi nhà cung cấp hạ tầng hoặc dịch vụ được tích hợp nhằm vận hành tính năng nền tảng. Dữ liệu liên quan đến chiến dịch cũng có thể được hiển thị cho Merchant hoặc Reseller tương ứng để thực hiện hoạt động cộng tác.",
        "Đơn vị vận hành cần xác nhận danh sách bên nhận dữ liệu, phạm vi chia sẻ và cơ chế áp dụng trước khi công bố chính sách chính thức. Trang này không khẳng định việc bán hoặc chuyển giao dữ liệu cho bên thứ ba.",
      ] },
      { title: "Lựa chọn và quyền riêng tư", paragraphs: [
        "Người dùng có thể xem và cập nhật một số thông tin hồ sơ thông qua tính năng hiện có. Yêu cầu truy cập, chỉnh sửa hoặc xóa dữ liệu cần được gửi đến kênh hỗ trợ chính thức sau khi đơn vị vận hành công bố thông tin liên hệ và quy trình tiếp nhận.",
        "Việc xóa dữ liệu có thể ảnh hưởng đến tài khoản, lịch sử chiến dịch hoặc khả năng đối soát. Cách xử lý các trường hợp này cần được đơn vị vận hành xác định rõ trước khi phát hành.",
      ] },
      { title: "Liên hệ và cập nhật chính sách", paragraphs: [
        "Đơn vị vận hành cần bổ sung tên pháp lý, địa chỉ, email hoặc kênh tiếp nhận yêu cầu về dữ liệu, ngày hiệu lực và quy trình thông báo thay đổi chính sách. Vui lòng hoàn thiện các thông tin này trước khi sử dụng trang như chính sách chính thức.",
      ] },
    ]}
  />;
}
