import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { base64Pdf } = req.body; // API này bây giờ chỉ nhận base64
    if (!base64Pdf) throw new Error("Không nhận được dữ liệu file");

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent([
      "Trích xuất thông tin đơn hàng từ PDF này thành JSON: ma_don_hang, ngay_xuong_don, ma_khach_hang, items (gồm: ma_hang, ten_san_pham, quy_cach, so_luong, chat_lieu). Trả về JSON thuần, không markdown.",
      { inlineData: { mimeType: 'application/pdf', data: base64Pdf } }
    ]);

    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return res.status(200).json(JSON.parse(text));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
