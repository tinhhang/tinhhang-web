import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '30mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pdfUrl, base64Pdf: rawBase64 } = req.body || {};

    let cleanBase64;

    if (pdfUrl && typeof pdfUrl === 'string') {
      // Trường hợp trang /production: nhận URL, tự tải file về server rồi convert base64
      const pdfRes = await fetch(pdfUrl);

      if (!pdfRes.ok) {
        return res.status(400).json({
          error: `Không tải được file PDF từ URL (status ${pdfRes.status}).`,
        });
      }

      const arrayBuffer = await pdfRes.arrayBuffer();
      cleanBase64 = Buffer.from(arrayBuffer).toString('base64');

    } else if (rawBase64 && typeof rawBase64 === 'string') {
      cleanBase64 = rawBase64.includes(',')
        ? rawBase64.split(',')[1]
        : rawBase64;
    } else {
      return res.status(400).json({
        error: 'Thiếu dữ liệu PDF (cần pdfUrl hoặc base64Pdf).',
      });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });

    const prompt = `
Bạn là hệ thống AI chuyên đọc đơn đặt hàng (PO) bằng tiếng Trung hoặc tiếng Việt từ file PDF.

NHIỆM VỤ:
Đọc trực tiếp nội dung và BỐ CỤC của file PDF, đặc biệt là bảng sản phẩm.

Mục tiêu là chuyển dữ liệu trong PDF thành đúng một JSON object.

========================
QUY TẮC ĐỌC BẢNG - RẤT QUAN TRỌNG
========================

1. Phải dựa vào vị trí thực tế của các ô trong bảng PDF.

2. Mỗi DÒNG SẢN PHẨM trong bảng phải tương ứng với MỘT object trong "items".

3. Các giá trị nằm trên CÙNG MỘT DÒNG phải được giữ nguyên quan hệ với nhau.

Ví dụ:

产品名称 | 机台型号规格 | 数量 | 材质/涂层要求 | 备注
---------------------------------------------------
产品A    | 规格A        | 2套  | 材料A          | 备注A
产品B    | 规格B        | 1套  | 材料B          | 备注B

phải trở thành:

{
  "items": [
    {
      "ten_san_pham": "产品A",
      "quy_cach": "规格A",
      "so_luong": "2套",
      "chat_lieu": "材料A",
      "ghi_chu": "备注A"
    },
    {
      "ten_san_pham": "产品B",
      "quy_cach": "规格B",
      "so_luong": "1套",
      "chat_lieu": "材料B",
      "ghi_chu": "备注B"
    }
  ]
}

4. TUYỆT ĐỐI KHÔNG được lấy sản phẩm của dòng này ghép với quy cách, số lượng, chất liệu hoặc ghi chú của dòng khác.

5. Nếu bảng có nhiều dòng, phải đọc lần lượt từ trên xuống dưới.

6. Nếu bảng tiếp tục sang trang khác, phải tiếp tục đọc các dòng sản phẩm ở trang sau.

7. Nếu header của bảng được lặp lại ở trang sau, không được coi header là một sản phẩm.

8. Không đưa các dòng "合计", "总计", "合计金额", "TOTAL" hoặc dòng tổng cộng vào "items".

9. Nếu một ô bị xuống dòng nhưng vẫn thuộc cùng một hàng của bảng thì phải ghép nội dung đó vào cùng một field.

10. Nếu một ô được merge theo chiều dọc:
    - Phải căn cứ vào bố cục bảng để xác định giá trị đó áp dụng cho dòng nào.
    - Không tự ý tạo thêm sản phẩm.

11. Không được tự tạo sản phẩm mới chỉ vì nhìn thấy một đoạn text riêng biệt.

12. Không được bỏ qua dòng sản phẩm chỉ vì nội dung dài hoặc xuống nhiều dòng.

13. Nếu không chắc chắn một giá trị thuộc dòng nào thì ưu tiên quan hệ vị trí trong bảng PDF, không tự suy đoán theo ý nghĩa.

========================
QUY TẮC TRÍCH XUẤT FIELD
========================

Thông tin chung:

"ma_don_hang":
- Lấy giá trị sau "单据编号".
- Ví dụ: YN2026090402A.
- Không tự tạo mã.

"ngay_xuong_don":
- Lấy từ trường "日期".
- Chuyển sang YYYY-MM-DD.
- Nếu không xác định được ngày thì trả "".

"ma_khach_hang":
- Lấy từ trường "客户".
- Giữ nguyên nội dung trong PDF.

========================
CHI TIẾT SẢN PHẨM
========================

Mỗi dòng sản phẩm tạo một object:

"ma_hang":
- Chỉ lấy nếu PDF thực sự có mã hàng/mã sản phẩm riêng.
- Nếu không có mã hàng riêng thì trả "".
- TUYỆT ĐỐI không tự tạo mã hàng.
- Không lấy tên sản phẩm làm mã hàng.

"ten_san_pham":
- Lấy từ cột "产品名称".
- Giữ nguyên tên sản phẩm trong PDF.

"quy_cach":
- Lấy từ cột "机台型号规格".
- Giữ nguyên thông tin kỹ thuật.
- Không tự rút gọn.

"so_luong":
- Lấy từ cột "数量".
- Giữ nguyên giá trị và đơn vị nếu có.
- Ví dụ: "1套", "2PCS", "5".

"chat_lieu":
- Lấy từ cột "材质/涂层要求".
- Giữ nguyên nội dung.
- Không tự suy đoán vật liệu.

"ghi_chu":
- Lấy từ cột "备注".
- Nếu không có thì trả "".

========================
QUY TẮC KHÔNG SUY ĐOÁN
========================

- Chỉ trích xuất thông tin thực sự có trong PDF.
- Không tự bổ sung thông tin bị thiếu.
- Không tự dịch tên sản phẩm.
- Không tự sửa mã sản phẩm.
- Không tự đổi đơn vị.
- Không tự tạo mã đơn hàng.
- Không tự tạo mã khách hàng.
- Không tự tạo sản phẩm.

Nếu không tìm thấy một field, trả chuỗi rỗng "".

========================
ĐỊNH DẠNG OUTPUT
========================

Chỉ trả về MỘT JSON object duy nhất.

Không markdown.
Không \`\`\`.
Không giải thích.
Không thêm text bên ngoài JSON.

Cấu trúc bắt buộc:

{
  "ma_don_hang": "",
  "ngay_xuong_don": "",
  "ma_khach_hang": "",
  "items": [
    {
      "ma_hang": "",
      "ten_san_pham": "",
      "quy_cach": "",
      "so_luong": "",
      "chat_lieu": "",
      "ghi_chu": ""
    }
  ]
}
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: cleanBase64,
        },
      },
    ]);

    const responseText = result.response.text();

    console.log('Raw AI response:', responseText);

    let parsedData;

    try {
      parsedData = JSON.parse(responseText.trim());
    } catch (firstError) {
      const cleanStr = responseText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const firstBrace = cleanStr.indexOf('{');
      const lastBrace = cleanStr.lastIndexOf('}');

      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('AI không trả về cấu trúc JSON hợp lệ.');
      }

      try {
        parsedData = JSON.parse(cleanStr.substring(firstBrace, lastBrace + 1));
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        console.error('AI response:', responseText);
        throw new Error('AI đã trả dữ liệu nhưng không thể chuyển thành JSON.');
      }
    }

    if (!parsedData || typeof parsedData !== 'object') {
      throw new Error('Dữ liệu AI trả về không hợp lệ.');
    }

    if (!Array.isArray(parsedData.items)) {
      parsedData.items = [];
    }

    parsedData.items = parsedData.items.map((item) => ({
      ma_hang: typeof item?.ma_hang === 'string' ? item.ma_hang.trim() : '',
      ten_san_pham: typeof item?.ten_san_pham === 'string' ? item.ten_san_pham.trim() : '',
      quy_cach: typeof item?.quy_cach === 'string' ? item.quy_cach.trim() : '',
      so_luong: typeof item?.so_luong === 'string' ? item.so_luong.trim() : '',
      chat_lieu: typeof item?.chat_lieu === 'string' ? item.chat_lieu.trim() : '',
      ghi_chu: typeof item?.ghi_chu === 'string' ? item.ghi_chu.trim() : '',
    }));

    const finalData = {
      ma_don_hang: typeof parsedData.ma_don_hang === 'string' ? parsedData.ma_don_hang.trim() : '',
      ngay_xuong_don: typeof parsedData.ngay_xuong_don === 'string' ? parsedData.ngay_xuong_don.trim() : '',
      ma_khach_hang: typeof parsedData.ma_khach_hang === 'string' ? parsedData.ma_khach_hang.trim() : '',
      items: parsedData.items,
    };

    console.log('Parsed PDF data:', JSON.stringify(finalData, null, 2));

    // Bọc theo { success, data } để khớp với handleAutoParseAi ở pages/production.js
    return res.status(200).json({
      success: true,
      data: finalData,
    });

  } catch (error) {
    console.error('Lỗi tại API parse-pdf:', error);

    return res.status(500).json({
      error: error?.message || 'Có lỗi xảy ra khi đọc PDF.',
    });
  }
}
