import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';
import { supabase } from '../../lib/supabaseClient';

export const config = {
  api: {
    bodyParser: { sizeLimit: '5mb' },
  },
};

// ==========================================
// HẰNG SỐ LAYOUT (đơn vị: point, 1cm = 28.3465pt)
// Khổ A4 = 595.28 x 841.89 pt
// Căn lề theo yêu cầu: Top/Bottom/Left 2cm, Right 1.5cm
// ==========================================
const CM = 28.3465;
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN_TOP = 2 * CM;
const MARGIN_BOTTOM = 2 * CM;
const MARGIN_LEFT = 2 * CM;
const MARGIN_RIGHT = 1.5 * CM;
const CONTENT_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT;

const TINH_TRANG_LABEL = {
  moi_100: 'Mới 100%',
  da_sua_chua_hoan_tat: 'Đã sửa chữa hoàn tất',
};

function loadFontBytes(filename) {
  // Font đặt tại thư mục /fonts ở gốc repo (ngang hàng với /pages, /lib) —
  // KHÔNG đặt trong /public vì không cần phục vụ trực tiếp qua URL, chỉ cần
  // đọc bằng fs ngay trong hàm API này lúc build/chạy trên Vercel.
  return fs.readFileSync(path.join(process.cwd(), 'fonts', filename));
}

// Cắt 1 đoạn text dài thành nhiều dòng vừa với độ rộng cho trước
function wrapText(text, font, fontSize, maxWidth) {
  const words = String(text || '').split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [''];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { deliveryNoteId } = req.body || {};
    if (!deliveryNoteId) {
      return res.status(400).json({ error: 'Thiếu deliveryNoteId.' });
    }

    // Lấy dữ liệu đầy đủ của biên bản từ Supabase
    const { data: note, error: noteError } = await supabase
      .from('delivery_notes')
      .select('*, delivery_note_items(*)')
      .eq('id', deliveryNoteId)
      .single();

    if (noteError || !note) {
      return res.status(404).json({ error: 'Không tìm thấy biên bản giao hàng.' });
    }

    const items = note.delivery_note_items || [];

    // ==========================================
    // TẠO PDF
    // ==========================================
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const regularFont = await pdfDoc.embedFont(loadFontBytes('LiberationSerif-Regular.ttf'));
    const boldFont = await pdfDoc.embedFont(loadFontBytes('LiberationSerif-Bold.ttf'));
    const italicFont = await pdfDoc.embedFont(loadFontBytes('LiberationSerif-Italic.ttf'));

    const songHuoDanImageBytes = fs.readFileSync(path.join(process.cwd(), 'fonts', 'song_huo_dan.png'));
    const songHuoDanImage = await pdfDoc.embedPng(songHuoDanImageBytes);

    let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    let y = PAGE_H - MARGIN_TOP;

    const drawText = (text, x, yPos, font, size, options = {}) => {
      page.drawText(String(text || ''), {
        x, y: yPos, size, font,
        color: options.color || rgb(0, 0, 0),
      });
    };

    const drawCentered = (text, font, size, yPos) => {
      const w = font.widthOfTextAtSize(text, size);
      drawText(text, (PAGE_W - w) / 2, yPos, font, size);
    };

    // ---------- HÀNG ĐẦU: 2 CỘT (BÊN A / QUỐC HIỆU) ----------
    const colWidth = CONTENT_W / 2;
    drawText('CÔNG TY TNHH MÁY MÓC', MARGIN_LEFT, y, boldFont, 11);
    drawText('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', MARGIN_LEFT + colWidth, y, boldFont, 11);
    y -= 14;
    drawText('TINH HẰNG VIỆT NAM', MARGIN_LEFT, y, boldFont, 11);
    const doclapText = 'Độc lập – Tự do – Hạnh phúc';
    const doclapW = italicFont.widthOfTextAtSize(doclapText, 11);
    drawText(doclapText, MARGIN_LEFT + colWidth + (colWidth - doclapW) / 2, y, italicFont, 11);
    y -= 10;
    // Gạch chân dưới dòng quốc hiệu (căn giữa cột phải)
    const lineW = doclapW * 0.9;
    const lineX = MARGIN_LEFT + colWidth + (colWidth - lineW) / 2;
    page.drawLine({ start: { x: lineX, y: y + 2 }, end: { x: lineX + lineW, y: y + 2 }, thickness: 0.75 });

    y -= 26;

    // ---------- TIÊU ĐỀ ----------
    drawCentered('BIÊN BẢN GIAO HÀNG', boldFont, 15, y);
    y -= 26;
    page.drawImage(songHuoDanImage, {
      x: (PAGE_W - 90) / 2, y: y - 8, width: 90, height: 90 * (122 / 320),
    });
    y -= 34;

    // ---------- DÒNG NGÀY (để trống theo đúng yêu cầu file mẫu) ----------
    drawText('Hôm nay, ngày ......... tháng ......... năm 2026 chúng tôi gồm:', MARGIN_LEFT, y, italicFont, 10.5);
    y -= 22;

    // ---------- BÊN A (cố định) ----------
    const drawLabelValue = (label, value, boldLabel = true) => {
      drawText(label, MARGIN_LEFT, y, boldFont, 10.5);
      const labelW = boldFont.widthOfTextAtSize(label + ' ', 10.5);
      drawText(value, MARGIN_LEFT + labelW, y, regularFont, 10.5);
      y -= 16;
    };

    drawLabelValue('BÊN A:', 'CÔNG TY TNHH MÁY MÓC TINH HẰNG VIỆT NAM');
    drawLabelValue('MST:', '0107926474');
    drawLabelValue('ĐỊA CHỈ:', 'T91-CN01, Cụm sản xuất nghề tập trung, Xã Gia Lâm, Thành phố Hà Nội');

    drawText('NGƯỜI ĐẠI DIỆN:', MARGIN_LEFT, y, boldFont, 10.5);
    let ndW = boldFont.widthOfTextAtSize('NGƯỜI ĐẠI DIỆN: ', 10.5);
    drawText('Ông Zhong Xin Hua', MARGIN_LEFT + ndW, y, regularFont, 10.5);
    drawText('CHỨC VỤ:', MARGIN_LEFT + colWidth, y, boldFont, 10.5);
    drawText('Giám đốc', MARGIN_LEFT + colWidth + boldFont.widthOfTextAtSize('CHỨC VỤ: ', 10.5), y, regularFont, 10.5);
    y -= 16;

    drawLabelValue('SỐ ĐIỆN THOẠI:', '0986671024');
    y -= 6;

    // ---------- BÊN B (snapshot từ delivery_notes) ----------
    drawLabelValue('BÊN B:', note.ten_khach_hang || '');
    drawLabelValue('MST:', note.mst || '');
    drawLabelValue('ĐỊA CHỈ:', note.dia_chi || '');

    drawText('NGƯỜI ĐẠI DIỆN:', MARGIN_LEFT, y, boldFont, 10.5);
    ndW = boldFont.widthOfTextAtSize('NGƯỜI ĐẠI DIỆN: ', 10.5);
    drawText(note.nguoi_dai_dien || '', MARGIN_LEFT + ndW, y, regularFont, 10.5);
    drawText('CHỨC VỤ:', MARGIN_LEFT + colWidth, y, boldFont, 10.5);
    drawText(note.chuc_vu || '', MARGIN_LEFT + colWidth + boldFont.widthOfTextAtSize('CHỨC VỤ: ', 10.5), y, regularFont, 10.5);
    y -= 16;

    drawLabelValue('SỐ ĐIỆN THOẠI:', note.so_dien_thoai || '');
    y -= 6;

    drawText('Hai bên bàn giao và nghiệm thu các danh mục hàng hóa/dịch vụ như sau:', MARGIN_LEFT, y, regularFont, 10.5);
    y -= 18;

    // ---------- BẢNG DANH MỤC HÀNG HÓA ----------
    const colWidths = {
      stt: 26,
      soPo: 70,
      ngayPo: 60,
      danhMuc: 140,
      dvt: 50,
      soLuong: 55,
      tinhTrang: CONTENT_W - (26 + 70 + 60 + 140 + 50 + 55),
    };
    const headers = [
      { key: 'stt', label: 'STT' },
      { key: 'soPo', label: 'SỐ PO' },
      { key: 'ngayPo', label: 'NGÀY PO' },
      { key: 'danhMuc', label: 'DANH MỤC HÀNG HÓA/DỊCH VỤ' },
      { key: 'dvt', label: 'ĐVT' },
      { key: 'soLuong', label: 'SỐ LƯỢNG' },
      { key: 'tinhTrang', label: 'TÌNH TRẠNG' },
    ];
    const rowFontSize = 9;
    const headerFontSize = 8.5;
    const cellPadding = 4;

    const drawTableRow = (cells, rowHeight, isHeader = false) => {
      let x = MARGIN_LEFT;
      const font = isHeader ? boldFont : regularFont;
      const size = isHeader ? headerFontSize : rowFontSize;

      for (const h of headers) {
        const w = colWidths[h.key];
        page.drawRectangle({
          x, y: y - rowHeight, width: w, height: rowHeight,
          borderColor: rgb(0, 0, 0), borderWidth: 0.75,
        });

        const cellLines = cells[h.key] || [''];
        const lineHeight = size + 2;
        const totalTextH = cellLines.length * lineHeight;
        let textY = y - (rowHeight - totalTextH) / 2 - size;

        for (const line of cellLines) {
          const lineW = font.widthOfTextAtSize(line, size);
          const textX = isHeader ? x + (w - lineW) / 2 : x + cellPadding;
          drawText(line, textX, textY, font, size);
          textY -= lineHeight;
        }
        x += w;
      }
      y -= rowHeight;
    };

    // Header row
    const headerCells = {};
    headers.forEach((h) => { headerCells[h.key] = wrapText(h.label, boldFont, headerFontSize, colWidths[h.key] - cellPadding * 2); });
    const headerRowHeight = Math.max(...headers.map((h) => headerCells[h.key].length)) * (headerFontSize + 2) + 8;
    drawTableRow(headerCells, headerRowHeight, true);

    // Data rows
    if (items.length === 0) {
      drawTableRow({ stt: [''], soPo: [''], ngayPo: [''], danhMuc: ['(Chưa có dòng hàng)'], dvt: [''], soLuong: [''], tinhTrang: [''] }, 20);
    }

    items.forEach((item, idx) => {
      // Nếu gần hết trang thì sang trang mới
      if (y < MARGIN_BOTTOM + 150) {
        page = pdfDoc.addPage([PAGE_W, PAGE_H]);
        y = PAGE_H - MARGIN_TOP;
      }

      const cells = {
        stt: [String(idx + 1)],
        soPo: wrapText(item.so_po || '—', regularFont, rowFontSize, colWidths.soPo - cellPadding * 2),
        ngayPo: wrapText(item.ngay_po || '—', regularFont, rowFontSize, colWidths.ngayPo - cellPadding * 2),
        danhMuc: wrapText(item.ten_hang || '', regularFont, rowFontSize, colWidths.danhMuc - cellPadding * 2),
        dvt: wrapText(item.dvt || '', regularFont, rowFontSize, colWidths.dvt - cellPadding * 2),
        soLuong: [String(item.so_luong ?? '')],
        tinhTrang: wrapText(TINH_TRANG_LABEL[item.tinh_trang] || '', regularFont, rowFontSize, colWidths.tinhTrang - cellPadding * 2),
      };
      const rowHeight = Math.max(...Object.values(cells).map((c) => c.length)) * (rowFontSize + 2) + 8;
      drawTableRow(cells, Math.max(rowHeight, 20));
    });

    y -= 24;

    // ---------- XÁC NHẬN 2 BÊN ----------
    if (y < MARGIN_BOTTOM + 80) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN_TOP;
    }

    drawText('Bên B xác nhận:', MARGIN_LEFT, y, regularFont, 10.5);
    y -= 24;

    const signColWidth = CONTENT_W / 2;
    drawCentered2Col('CÔNG TY TNHH MÁY MÓC TINH HẰNG VIỆT NAM', note.ten_khach_hang || '[TÊN KHÁCH HÀNG]');

    function drawCentered2Col(leftText, rightText) {
      const leftLines = wrapText(leftText, boldFont, 10.5, signColWidth - 10);
      const rightLines = wrapText(rightText, boldFont, 10.5, signColWidth - 10);
      const maxLines = Math.max(leftLines.length, rightLines.length);
      for (let i = 0; i < maxLines; i++) {
        if (leftLines[i]) {
          const w = boldFont.widthOfTextAtSize(leftLines[i], 10.5);
          drawText(leftLines[i], MARGIN_LEFT + (signColWidth - w) / 2, y, boldFont, 10.5);
        }
        if (rightLines[i]) {
          const w = boldFont.widthOfTextAtSize(rightLines[i], 10.5);
          drawText(rightLines[i], MARGIN_LEFT + signColWidth + (signColWidth - w) / 2, y, boldFont, 10.5);
        }
        y -= 14;
      }
    }

    // ==========================================
    // LƯU LÊN SUPABASE STORAGE
    // ==========================================
    const pdfBytes = await pdfDoc.save();
    const fileName = `bien-ban-giao-hang-${deliveryNoteId}-${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('delivery_notes')
      .upload(fileName, Buffer.from(pdfBytes), { contentType: 'application/pdf' });

    if (uploadError) {
      return res.status(500).json({ error: 'Lỗi khi lưu PDF lên Storage: ' + uploadError.message });
    }

    const { data: publicUrlData } = supabase.storage.from('delivery_notes').getPublicUrl(fileName);

    return res.status(200).json({ success: true, file_url: publicUrlData.publicUrl });

  } catch (error) {
    console.error('Lỗi tạo PDF biên bản giao hàng:', error);
    return res.status(500).json({ error: error?.message || 'Có lỗi khi tạo PDF.' });
  }
}
