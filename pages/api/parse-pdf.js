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

    const prompt = `Đọc tài liệu đơn hàng tiếng Trung/Việt này. Hãy trích xuất dữ liệu thành một cấu trúc JSON chính xác tuyệt đối theo định dạng sau, không kèm bất kỳ markdown nào:
{
  "ma_don_hang": "...",
  "ngay_xuong_don": "...",
  "ma_khach_hang": "...",
  "items": [
    {
      "ma_hang": "...",
      "ten_san_pham": "...",
      "quy_cach": "...",
      "so_luong": "...",
      "chat_lieu": "..."
    }
  ]
}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64Pdf
        }
      }
    ]);

    const responseText = result.response.text();
    console.log("AI trả về thô:", responseText);

    // Làm sạch và cố gắng parse JSON
    const cleanStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = cleanStr.indexOf('{');
    const lastBrace = cleanStr.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
      const jsonString = cleanStr.substring(firstBrace, lastBrace + 1);
      try {
        const parsedData = JSON.parse(jsonString);
        return res.status(200).json(parsedData);
      } catch (e) {
        // Nếu parse lỗi JSON, trả về text thô để kiểm tra
        return res.status(200).json({ 
          ma_don_hang: "Lỗi cấu trúc", 
          items: [], 
          raw_text: responseText 
        });
      }
    } else {
      return res.status(200).json({ 
        ma_don_hang: "Không tìm thấy JSON", 
        items: [], 
        raw_text: responseText 
      });
    }

  } catch (error) {
    console.error('Lỗi API parse-pdf:', error);
    return res.status(500).json({ error: error.message });
  }
}
