import { GoogleGenAI } from '@google/genai';

// Khởi tạo Gemini AI SDK mới nhất
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

    // Tải file PDF từ URL (Supabase storage) về để AI đọc
    const fileResponse = await fetch(pdfUrl);
    const arrayBuffer = await fileResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Chuyển đổi buffer thành Base64 để truyền vào Gemini
    const base64Data = buffer.toString('base64');

    // Yêu cầu AI đọc và trích xuất dữ liệu trả về chuẩn định dạng JSON
    const prompt = `
      Bạn là một trợ lý thông minh chuyên đọc đơn hàng/chứng từ sản xuất tiếng Trung/Anh.
      Hãy đọc file tài liệu PDF này và trích xuất chính xác các thông tin sau thành dạng JSON:
      {
        "ma_don_hang": "Mã đơn hàng (ví dụ: YN2026082101A...)",
        "ngay_xuong_don": "Ngày tháng định dạng YYYY-MM-DD",
        "ma_khach_hang": "Mã khách hàng hoặc tên viết tắt khách (ví dụ: MUTO, ICAM, GS...)",
        "ma_hang": "Mã hàng / Model máy / Quy cách dòng đầu tiên (ví dụ: FANUC S-2000I...)",
        "ten_san_pham": "Tên sản phẩm dòng đầu tiên (ví dụ: 单料管, 射咀...)",
        "quy_cach": "Quy cách chi tiết nếu có",
        "so_luong": Số lượng của dòng đầu tiên (chỉ lấy số nguyên),
        "chat_lieu": "Chất liệu hoặc yêu cầu lớp phủ (ví dụ: A级合金, SKD61...)"
      }
      Chỉ trả về đúng một đoạn JSON thuần túy, không kèm theo chữ nào khác ngoài JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Data
          }
        },
        { text: prompt }
      ]
    });

    let textResult = response.text.trim();
    // Làm sạch chuỗi JSON nếu AI lỡ bọc trong markdown code block
    textResult = textResult.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

    const parsedData = JSON.parse(textResult);
    return res.status(200).json({ success: true, data: parsedData });

  } catch (error) {
    console.error('Lỗi AI parse PDF:', error);
    return res.status(500).json({ error: 'Không thể đọc được file bằng AI: ' + error.message });
  }
}
