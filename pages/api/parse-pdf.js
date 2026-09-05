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

   const prompt = `Bạn là hệ thống AI chuyên đọc đơn hàng tiếng Trung/Việt. Hãy trích xuất dữ liệu từ tệp PDF này thành MỘT ĐỐI TƯỢNG JSON THUẦN TÚY duy nhất (tuyệt đối không dùng markdown hay \`\`\`json), bóc tách chuẩn xác theo cấu trúc sau:
{
  "ma_don_hang": "Lấy giá trị sau 单据编号, ví dụ: YN2026090402A",
  "ngay_xuong_don": "Lấy từ cột 日期, định dạng YYYY-MM-DD",
  "ma_khach_hang": "Lấy từ cột 客户, ví dụ: 龙生",
  "items": [
    {
      "ma_hang": "Tên sản phẩm hoặc mã tương ứng từ cột 产品名称",
      "ten_san_pham": "Sản phẩm từ cột 产品名称",
      "quy_cach": "Thông số từ cột 机台型号规格",
      "so_luong": "Số lượng từ cột 数量, ví dụ: 1套",
      "chat_lieu": "Yêu cầu từ cột 材质/涂层要求",
      "ghi_chu": "Thông tin từ cột 备注 (nếu có)"
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
