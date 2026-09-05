import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
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

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      `Bạn là một chuyên gia bóc tách dữ liệu đơn hàng tiếng Trung/Việt. Hãy đọc file PDF đơn hàng này và trích xuất chính xác thành một đối tượng JSON thuần duy nhất (không bọc trong markdown hay \`\`\`json) theo cấu trúc sau:
      {
        "ma_don_hang": "Chuỗi mã đơn hàng, ví dụ lấy từ mục 单据编号",
        "ngay_xuong_don": "Ngày tháng định dạng YYYY-MM-DD",
        "ma_khach_hang": "Tên khách hàng hoặc mã khách hàng ở cột cuối cùng",
        "items": [
          {
            "ma_hang": "Mã hàng hoặc tên sản phẩm",
            "ten_san_pham": "Sản phẩm",
            "quy_cach": "Quy cách / 机台型号规格",
            "so_luong": "Số lượng kèm đơn vị (ví dụ: 2支)",
            "chat_lieu": "Chất liệu / 材质/涂层要求"
          }
        ]
      }`,
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
