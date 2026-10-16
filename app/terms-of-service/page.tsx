import type { Metadata } from "next";
import { PolicyPage } from "@/src/components/legal/policy-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Điều khoản sử dụng nền tảng TravelLink AI dành cho Merchant và Reseller.",
};

export default function TermsOfServicePage() {
  return <PolicyPage
    kind="terms"
    title="Terms of Service"
    description="Điều khoản sử dụng nền tảng kết nối doanh nghiệp du lịch và cộng tác viên quảng bá."
    updatedLabel="Phiên bản hiển thị · Cần xác nhận ngày có hiệu lực trước khi phát hành"
    sections={[
      { title: "Phạm vi dịch vụ", paragraphs: [
        "TravelLink AI hỗ trợ Merchant giới thiệu sản phẩm và chiến dịch du lịch, đồng thời giúp Reseller khám phá nội dung quảng bá và chia sẻ liên kết theo các tính năng được cung cấp trên nền tảng.",
        "Các tính năng, điều kiện tham gia, ghi nhận giới thiệu và khoản hoa hồng cụ thể có thể phụ thuộc thông tin của từng chiến dịch. Thông tin hiển thị tại chiến dịch cần được đọc cùng các điều khoản này.",
      ] },
      { title: "Tài khoản và trách nhiệm chung", paragraphs: [
        "Người dùng cần cung cấp thông tin phù hợp khi đăng ký, bảo vệ thông tin đăng nhập và chịu trách nhiệm đối với hoạt động được thực hiện bằng tài khoản của mình. Nếu phát hiện truy cập trái phép hoặc thông tin tài khoản không chính xác, người dùng nên thông báo cho đơn vị vận hành qua kênh hỗ trợ chính thức.",
        "Người dùng cần sử dụng nền tảng đúng mục đích, không can thiệp trái phép vào hệ thống, không mạo danh người khác, không phát tán mã độc hoặc thực hiện hành vi gây ảnh hưởng đến quyền và trải nghiệm của người dùng khác.",
      ] },
      { title: "Quyền và trách nhiệm của Merchant", paragraphs: [
        "Merchant có thể quản lý thông tin sản phẩm, tạo và quản lý chiến dịch theo quyền được cấp. Merchant chịu trách nhiệm về tính chính xác, quyền sử dụng và nội dung của thông tin, hình ảnh, giá bán, điều kiện áp dụng và chính sách dịch vụ do mình cung cấp.",
        "Merchant cần nêu rõ điều kiện chiến dịch, cách xác nhận đơn hàng và cơ sở tính hoa hồng cho Reseller. Mọi thay đổi ảnh hưởng đến chiến dịch cần được cập nhật trên nền tảng kịp thời.",
      ] },
      { title: "Quyền và trách nhiệm của Reseller", paragraphs: [
        "Reseller có thể xem các chiến dịch được phép truy cập, lựa chọn nội dung phù hợp và quảng bá bằng các công cụ do nền tảng cung cấp. Reseller cần tuân thủ điều kiện của từng chiến dịch và chỉ sử dụng tài liệu trong phạm vi được cho phép.",
        "Reseller không được đưa ra cam kết sai lệch về sản phẩm, sửa đổi nội dung theo cách gây hiểu nhầm, sử dụng phương thức quảng bá trái phép hoặc tự nhận là Merchant. Việc ghi nhận lượt giới thiệu và hoa hồng căn cứ vào dữ liệu, điều kiện và quy trình của chiến dịch tương ứng.",
      ] },
      { title: "Chiến dịch, nội dung và liên kết theo dõi", paragraphs: [
        "Các liên kết theo dõi có thể được dùng để nhận diện nguồn giới thiệu và hỗ trợ thống kê hiệu quả chiến dịch. Người dùng không được thao túng lượt nhấp, đơn hàng hoặc dữ liệu quy đổi. Liên kết có thể không ghi nhận kết quả nếu thiết bị, trình duyệt, mạng hoặc hệ thống liên quan không gửi đủ dữ liệu.",
        "Quyền sử dụng nội dung quảng bá chỉ giới hạn trong mục đích và thời gian của chiến dịch, trừ khi Merchant có hướng dẫn khác. Quyền sở hữu nội dung của mỗi bên vẫn thuộc về chủ thể tương ứng.",
      ] },
      { title: "Tạm ngừng, thay đổi và giới hạn", paragraphs: [
        "Đơn vị vận hành có thể cập nhật tính năng hoặc tạm thời hạn chế quyền truy cập khi cần vận hành, bảo trì, bảo vệ tài khoản hoặc xử lý dấu hiệu sử dụng không phù hợp. Các điều kiện cụ thể về thông báo, khiếu nại và giải quyết tranh chấp cần được đơn vị vận hành xác nhận trước khi phát hành chính thức.",
        "Không có nội dung nào tại trang này thay thế thỏa thuận riêng giữa Merchant và Reseller hoặc xác định nghĩa vụ pháp lý chưa được xác nhận.",
      ] },
      { title: "Liên hệ và thông tin cần hoàn thiện", paragraphs: [
        "Đơn vị vận hành cần bổ sung tên pháp lý, địa chỉ, email hoặc kênh hỗ trợ chính thức, ngày hiệu lực, quy trình khiếu nại và cơ chế giải quyết tranh chấp trước khi công bố bản điều khoản có hiệu lực.",
      ] },
    ]}
  />;
}
