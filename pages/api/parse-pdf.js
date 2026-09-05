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

    const prompt = `Bạn là hệ thống AI chuyên trích xuất dữ liệu từ chứng từ, đơn hàng công nghiệp tiếng Trung và tiếng Việt. 
Hãy phân tích kỹ tệp PDF này, đọc toàn bộ các hàng và cột trong bảng dữ liệu sản phẩm. 
Trích xuất và trả về MỘT ĐỐI TƯỢNG JSON THUẦN TÚY duy nhất, không kèm theo bất kỳ định dạng markdown nào (tuyệt đối không dùng cụm từ \`\`\`json hay \`\`\`), theo đúng cấu trúc khóa sau:
{
  "ma_don_hang": "Mã đơn hàng (ví dụ: 単据编号 / Order No)",
  "ngay_xuong_don": "Ngày tháng định dạng YYYY-MM-DD",
  "ma_khach_hang": "Tên hoặc mã khách hàng",
  "items": [
    {
      "ma_hang": "Mã sản phẩm / Model",
      "ten_san_pham": "Tên sản phẩm",
      "quy_cach": "Quy cách kỹ thuật / kích thước",
      "so_luong": "Số lượng kèm đơn vị",
      "chat_lieu": "Yêu cầu chất liệu / lớp phủ (nếu có)"
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
    
    // Làm sạch chuỗi phản hồi để đảm bảo lấy đúng JSON thuần
    const cleanJsonStr = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    // Tìm vị trí mở và đóng ngoặc nhọn của JSON để loại bỏ chữ rác bên ngoài nếu AI lỡ sinh ra
    const firstBrace = cleanJsonStr.indexOf('{');
    const lastBrace = cleanJsonStr.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("AI không trả về cấu trúc dữ liệu hợp lệ.");
    }

    const jsonFinalString = cleanJsonStr.substring(firstBrace, lastBrace + 1);
    return res.status(200).json(JSON.parse(jsonFinalString));

  } catch (error) {
    console.error('Lỗi API parse-pdf:', error);
    return res.status(500).json({ error: error.message });
  }
}
