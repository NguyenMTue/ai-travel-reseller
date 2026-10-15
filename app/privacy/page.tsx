import type { Metadata } from "next";
import { PolicyDocument } from "@/src/components/legal/policy-document";

export const metadata: Metadata = {
  title: "Chính sách quyền riêng tư — Bản nháp",
  description: "Khung Chính sách quyền riêng tư TravelLink AI — chờ công ty bổ sung và phê duyệt, chưa có hiệu lực.",
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <PolicyDocument
      title="Chính sách quyền riêng tư"
      introduction="Khung thông tin về dữ liệu và quyền riêng tư khi sử dụng TravelLink AI. Các hoạt động xử lý dữ liệu cần được công ty xác nhận trong bản chính thức."
      sections={[
        {
          id: "don-vi-pham-vi",
          title: "Đơn vị phụ trách và phạm vi",
          description: "Phần này dành cho thông tin đơn vị chịu trách nhiệm về dữ liệu và phạm vi áp dụng của chính sách. Thông tin pháp nhân chưa được xác nhận trong bản nháp này.",
          pending: "Pháp nhân phụ trách, đối tượng áp dụng, dịch vụ thuộc phạm vi và đầu mối tiếp nhận yêu cầu về dữ liệu.",
        },
        {
          id: "du-lieu-muc-dich",
          title: "Dữ liệu và mục đích xử lý",
          description: "Phần này dành cho danh mục dữ liệu, nguồn dữ liệu và mục đích xử lý tương ứng. Danh mục thực tế còn chờ công ty xác nhận trước khi công bố.",
          pending: "Các loại dữ liệu được xử lý, nguồn thu thập, mục đích, cơ sở xử lý và cách thông báo hoặc xin sự đồng ý nếu áp dụng.",
        },
        {
          id: "cookie-theo-doi",
          title: "Cookie và công nghệ theo dõi",
          description: "Phần này dành cho thông tin về cookie, lưu trữ trên thiết bị và công nghệ đo lường hoặc theo dõi, nếu được sử dụng trong dịch vụ.",
          pending: "Danh mục công nghệ thực tế, mục đích, bên cung cấp, thời gian hoạt động và cách người dùng quản lý lựa chọn.",
        },
        {
          id: "chia-se-du-lieu",
          title: "Chia sẻ và bên xử lý dữ liệu",
          description: "Phần này dành cho thông tin về các bên có thể tiếp nhận hoặc xử lý dữ liệu trong quá trình cung cấp dịch vụ, bao gồm nhà cung cấp công nghệ nếu có.",
          pending: "Bên tiếp nhận, loại dữ liệu chia sẻ, mục đích, phạm vi và thông tin chuyển dữ liệu ra nước ngoài nếu có.",
        },
        {
          id: "luu-tru-bao-ve",
          title: "Lưu trữ và bảo vệ dữ liệu",
          description: "Phần này dành cho cách lưu trữ, xóa và bảo vệ dữ liệu. Bản nháp chưa xác định thời hạn lưu trữ hoặc đưa ra cam kết bảo mật thay cho công ty.",
          pending: "Thời hạn hoặc tiêu chí lưu trữ theo từng loại dữ liệu, quy trình xóa và các biện pháp bảo vệ được phép công bố.",
        },
        {
          id: "yeu-cau-du-lieu",
          title: "Quyền và yêu cầu về dữ liệu",
          description: "Phần này dành cho hướng dẫn người dùng thực hiện các yêu cầu về dữ liệu cá nhân theo chính sách chính thức sau khi được phê duyệt.",
          pending: "Các quyền áp dụng, cách gửi yêu cầu, bước xác minh, đầu mối tiếp nhận, quy trình và thời gian phản hồi được công ty xác nhận.",
        },
        {
          id: "cap-nhat-lien-he",
          title: "Cập nhật chính sách và liên hệ",
          description: "Phần này dành cho phiên bản chính sách, cách thông báo thay đổi và kênh liên hệ về quyền riêng tư. Bản nháp hiện chưa có ngày hiệu lực.",
          pending: "Bản chính sách được duyệt, phiên bản, ngày hiệu lực, phương thức thông báo thay đổi và kênh liên hệ chính thức.",
        },
      ]}
      related={{ href: "/terms", title: "Điều khoản sử dụng" }}
    />
  );
}
