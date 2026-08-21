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
    const { pdfUrl } = req.body;
    
    // Tải file trực tiếp thông qua một fetch với timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Timeout 15 giây

    const fileResponse = await fetch(pdfUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!fileResponse.ok) throw new Error(`Không thể truy cập file: ${fileResponse.status}`);
    
    const buffer = Buffer.from(await fileResponse.arrayBuffer());
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      "Trích xuất thông tin đơn hàng từ PDF này thành JSON: ma_don_hang, ngay_xuong_don, ma_khach_hang, items (gồm: ma_hang, ten_san_pham, quy_cach, so_luong, chat_lieu). Trả về JSON thuần, không markdown.",
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: buffer.toString('base64')
        }
      }
    ]);

    const text = result.response.text();
    // Làm sạch kết quả
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return res.status(200).json(JSON.parse(jsonStr));

  } catch (error) {
    console.error('API Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
