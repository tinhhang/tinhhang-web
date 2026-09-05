import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Cho phép nhận file dung lượng lớn
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { base64Pdf } = req.body;
    if (!base64Pdf) {
      return res.status(400).json({ error: "Không nhận được dữ liệu file PDF" });
    }

    // Sử dụng model gemini-1.5-flash để đọc hiểu tài liệu cực tốt
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      "Trích xuất thông tin đơn hàng từ PDF này thành JSON chính xác các trường: ma_don_hang, ngay_xuong_don, ma_khach_hang, items (gồm mảng các sản phẩm với: ma_hang, ten_san_pham, quy_cach, so_luong, chat_lieu). Trả về JSON thuần, tuyệt đối không bọc trong markdown.",
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64Pdf
        }
      }
    ]);

    const text = result.response.text();
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return res.status(200).json(JSON.parse(jsonStr));

  } catch (error) {
    console.error('Lỗi API parse-pdf:', error);
    return res.status(500).json({ error: error.message });
  }
}
