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

    console.log('Đang tải file từ URL:', pdfUrl);
    const fileResponse = await fetch(pdfUrl);
    if (!fileResponse.ok) {
      throw new Error(`Không thể tải file từ Storage, mã lỗi: ${fileResponse.status}`);
    }

    const arrayBuffer = await fileResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      Bạn là một trợ lý thông minh chuyên đọc đơn hàng/chứng từ sản xuất tiếng Trung và tiếng Anh.
      Hãy đọc file tài liệu PDF này và trích xuất thông tin thành đúng định dạng JSON thuần túy (không kèm bất kỳ markdown hay ký tự rác nào, bắt đầu bằng { và kết thúc bằng }):
      {
        "ma_don_hang": "Mã đơn hàng (ví dụ trong ảnh là YN2026082101A)",
        "ngay_xuong_don": "Ngày tháng định dạng YYYY-MM-DD (ví dụ: 2026-08-21)",
        "ma_khach_hang": "Mã khách hàng hoặc tên viết tắt ở cột cuối (ví dụ: MUTO, ICAM, GS)",
        "items": [
          {
            "ma_hang": "Model máy hoặc mã quy cách (ví dụ: FANUC S-2000I 50B Φ26)",
            "ten_san_pham": "Tên sản phẩm tiếng Trung hoặc Việt (ví dụ: 单料管, 射咀)",
            "quy_cach": "Quy cách chi tiết nếu có",
            "so_luong": Số lượng dạng số nguyên (ví dụ: 2, 5),
            "chat_lieu": "Chất liệu hoặc yêu cầu lớp phủ (ví dụ: A级合金, SKD61 内孔电镀)"
          }
        ]
      }
      Hãy quét sạch tất cả các dòng sản phẩm có trong bảng của đơn hàng đưa vào mảng "items".
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
    console.log('AI trả về thô:', textResult);

    // Làm sạch chuỗi JSON cẩn thận hơn
    textResult = textResult.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
    
    const jsonStartIndex = textResult.indexOf('{');
    const jsonEndIndex = textResult.lastIndexOf('}');
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
      textResult = textResult.substring(jsonStartIndex, jsonEndIndex + 1);
    }

    const parsedData = JSON.parse(textResult);
    return res.status(200).json({ success: true, data: parsedData });

  } catch (error) {
    console.error('Lỗi chi tiết tại API parse-pdf:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
