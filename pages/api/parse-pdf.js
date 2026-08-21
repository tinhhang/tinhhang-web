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

    // Dùng model chuẩn gemini-1.5-flash
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      Bạn là một trợ lý thông minh chuyên đọc đơn hàng/chứng từ sản xuất.
      Hãy đọc file tài liệu PDF này và trích xuất chính xác các thông tin sau thành dạng JSON thuần túy (không kèm markdown):
      {
        "ma_don_hang": "Mã đơn hàng (ví dụ: YN2026082101A...)",
        "ngay_xuong_don": "Ngày tháng định dạng YYYY-MM-DD",
        "ma_khach_hang": "Mã khách hàng hoặc tên viết tắt (ví dụ: MUTO, ICAM, GS...)",
        "ma_hang": "Mã hàng / Model máy dòng đầu tiên",
        "ten_san_pham": "Tên sản phẩm dòng đầu tiên",
        "quy_cach": "Quy cách chi tiết nếu có",
        "so_luong": Số lượng của dòng đầu tiên (chỉ lấy số nguyên),
        "chat_lieu": "Chất liệu hoặc yêu cầu lớp phủ"
      }
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
    
    // Làm sạch chuỗi JSON
    textResult = textResult.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

    const parsedData = JSON.parse(textResult);
    return res.status(200).json({ success: true, data: parsedData });

  } catch (error) {
    console.error('Lỗi AI parse PDF:', error);
    return res.status(500).json({ error: 'Lỗi: ' + error.message });
  }
}
