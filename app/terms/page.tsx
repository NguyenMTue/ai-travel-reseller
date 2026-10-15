import type { Metadata } from "next";
import { PolicyDocument } from "@/src/components/legal/policy-document";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng — Bản nháp",
  description: "Khung Điều khoản sử dụng TravelLink AI — chờ công ty bổ sung và phê duyệt, chưa có hiệu lực.",
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return (
    <PolicyDocument
      title="Điều khoản sử dụng"
      introduction="Khung thông tin về việc sử dụng TravelLink AI, dành cho doanh nghiệp, cộng tác viên và người truy cập."
      sections={[
        {
          id: "pham-vi",
          title: "Phạm vi và đơn vị vận hành",
          description: "Phần này dành cho thông tin đơn vị vận hành và phạm vi áp dụng của Điều khoản sử dụng. Tên TravelLink AI trên giao diện là tên sản phẩm; thông tin pháp nhân còn chờ xác nhận.",
          pending: "Tên pháp nhân, thông tin nhận diện, địa chỉ và phạm vi dịch vụ thuộc điều khoản chính thức.",
        },
        {
          id: "tai-khoan",
          title: "Tài khoản và vai trò",
          description: "Phần này dự kiến trình bày điều kiện tham gia và cách sử dụng tài khoản theo từng vai trò doanh nghiệp, cộng tác viên hoặc người truy cập.",
          pending: "Điều kiện tạo tài khoản, quy định về thông tin tài khoản, phân quyền, quản lý và chấm dứt tài khoản.",
        },
        {
          id: "noi-dung-ai",
          title: "Nội dung và công cụ AI",
          description: "Phần này dành cho quy định về nội dung được cung cấp, nội dung có hỗ trợ của AI và việc sử dụng hoặc chia sẻ nội dung trên các kênh của người dùng.",
          pending: "Quyền sử dụng nội dung, sở hữu trí tuệ, trách nhiệm kiểm tra thông tin, quy trình duyệt và các giới hạn sử dụng được công ty phê duyệt.",
        },
        {
          id: "san-pham-giao-dich",
          title: "Sản phẩm, giao dịch và hoa hồng",
          description: "Phần này dành cho các điều khoản liên quan đến thông tin sản phẩm du lịch, đặt dịch vụ, thanh toán và quan hệ giữa các bên tham gia.",
          pending: "Trách nhiệm của từng bên, điều kiện đặt hoặc hủy dịch vụ, hoàn tiền và quy định ghi nhận, đối soát, chi trả hoa hồng nếu áp dụng.",
        },
        {
          id: "quyen-trach-nhiem",
          title: "Quyền, trách nhiệm và tranh chấp",
          description: "Phần này dành cho quyền và nghĩa vụ của các bên, các hành vi bị hạn chế và cơ chế xử lý khi phát sinh vấn đề trong quá trình sử dụng.",
          pending: "Quy định về trách nhiệm, tạm ngừng dịch vụ, tiếp nhận khiếu nại, giải quyết tranh chấp và các điều khoản pháp lý liên quan.",
        },
        {
          id: "cap-nhat-lien-he",
          title: "Cập nhật điều khoản và liên hệ",
          description: "Phần này dành cho thông tin phiên bản, cách thông báo thay đổi và đầu mối giải đáp về Điều khoản sử dụng. Bản nháp hiện chưa có ngày hiệu lực.",
          pending: "Nội dung chính thức đã duyệt, phiên bản, ngày hiệu lực, cách thông báo thay đổi và kênh liên hệ do công ty xác nhận.",
        },
      ]}
      related={{ href: "/privacy", title: "Chính sách quyền riêng tư" }}
    />
  );
}
