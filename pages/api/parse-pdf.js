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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pdfUrl } = req.body;
    if (!pdfUrl) {
      return res.status(400).json({ error: 'Thiếu đường dẫn file PDF' });
    }

    const fileResponse = await fetch(pdfUrl);
    const arrayBuffer = await fileResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      Bạn là một trợ lý thông minh chuyên đọc đơn hàng/chứng từ sản xuất tiếng Trung và tiếng Anh.
      Hãy đọc file tài liệu PDF này và trích xuất thông tin thành đúng định dạng JSON thuần túy (không kèm markdown):
      {
        "ma_don_hang": "Mã đơn hàng (ví dụ: YN2026082101A...)",
        "ngay_xuong_don": "Ngày tháng định dạng YYYY-MM-DD",
        "ma_khach_hang": "Mã khách hàng hoặc tên viết tắt (ví dụ: MUTO, ICAM, GS...)",
        "items": [
          {
            "ma_hang": "Model máy / Mã quy cách trong bảng (ví dụ: FANUC S-2000I...)",
            "ten_san_pham": "Tên sản phẩm (ví dụ: 单料管, 射咀...)",
            "quy_cach": "Quy cách chi tiết nếu có",
            "so_luong": Số lượng (chỉ lấy số nguyên),
            "chat_lieu": "Chất liệu hoặc yêu cầu lớp phủ (ví dụ: SKD61, A级合金...)"
          }
        ]
      }
      Hãy quét hết tất cả các dòng sản phẩm có trong bảng của đơn hàng đưa vào mảng "items".
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64Data
        }
      },
      prompt
    ]);

    const response = await result.response;
    let textResult = response.text().trim();
    textResult = textResult.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

    const parsedData = JSON.parse(textResult);
    return res.status(200).json({ success: true, data: parsedData });

  } catch (error) {
    console.error('Lỗi AI parse PDF:', error);
    return res.status(500).json({ error: 'Lỗi: ' + error.message });
  }
}
