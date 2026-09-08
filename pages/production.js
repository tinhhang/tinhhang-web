import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

// Thứ tự các field (dạng text/number) trong 1 dòng sản phẩm — dùng để biết
// field nào là field cuối khi xử lý phím Enter nhảy ô. 2 checkbox (co_po_goc,
// da_nhan_chung_tu) không đưa vào đây vì Enter không áp dụng cho checkbox.
const ITEM_FIELDS = ['ma_khach_hang', 'ma_hang', 'ten_san_pham', 'quy_cach', 'so_luong', 'chat_lieu', 'so_ngay_giao'];

const emptyItem = () => ({
  ma_khach_hang: '',
  ma_hang: '',
  ten_san_pham: '',
  quy_cach: '',
  so_luong: 0,
  chat_lieu: '',
  so_ngay_giao: 0,
  co_po_goc: true,
  da_nhan_chung_tu: false
});

// Tính ngày giao dự kiến = ngày xuống đơn + số ngày giao
const tinhNgayGiaoDuKien = (ngayXuongDon, soNgayGiao) => {
  if (!ngayXuongDon) return '';
  const d = new Date(ngayXuongDon);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + (Number(soNgayGiao) || 0));
  return d.toISOString().slice(0, 10);
};

export default function ProductionPage() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [parsingAi, setParsingAi] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState('');

  // State chung cho đơn hàng (không còn ma_khach_hang ở đây nữa — đã chuyển xuống từng dòng)
  const [headerData, setHeaderData] = useState({
    ma_don_hang: '',
    ngay_xuong_don: ''
  });

  // State danh sách các dòng sản phẩm trong đơn
  const [items, setItems] = useState([emptyItem()]);

  // ==========================================
  // AUTOCOMPLETE: danh sách gợi ý lấy từ dữ liệu cũ
  // ==========================================
  const [suggestions, setSuggestions] = useState({
    ten_san_pham: [],
    chat_lieu: [],
    quy_cach: [],
    ma_hang: []
  });

  // ==========================================
  // REF cho từng ô input trong bảng, để điều khiển focus bằng bàn phím
  // ==========================================
  const inputRefs = useRef({});

  const setInputRef = (index, field) => (el) => {
    inputRefs.current[`${index}-${field}`] = el;
  };

  const focusCell = (index, field) => {
    const el = inputRefs.current[`${index}-${field}`];
    if (el) {
      el.focus();
      if (typeof el.select === 'function') el.select();
    }
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('production_orders')
      .select('*')
      .order('id', { ascending: false });
    if (!error && data) setOrders(data);
  };

  // Danh sách khách hàng để chọn/matching — dùng đúng bảng "customers"
  // (customer_code / customer_name) giống module PO.
  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('customer_code, customer_name')
      .order('customer_code', { ascending: true });
    if (!error && data) setCustomers(data);
  };

  const fetchSuggestions = async () => {
    const { data, error } = await supabase
      .from('production_orders')
      .select('ten_san_pham, chat_lieu, quy_cach, ma_hang');

    if (error || !data) return;

    const uniqueSorted = (key) => {
      const values = data
        .map((row) => (row[key] || '').trim())
        .filter((v) => v.length > 0);
      return Array.from(new Set(values)).sort();
    };

    setSuggestions({
      ten_san_pham: uniqueSorted('ten_san_pham'),
      chat_lieu: uniqueSorted('chat_lieu'),
      quy_cach: uniqueSorted('quy_cach'),
      ma_hang: uniqueSorted('ma_hang')
    });
  };

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchSuggestions();
  }, []);

  const handleFileUpload = async (e) => {
    try {
      setLoading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('production_files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('production_files')
        .getPublicUrl(fileName);

      setCurrentPdfUrl(publicUrlData.publicUrl);
      setShowUploadModal(false);

      handleAutoParseAi(publicUrlData.publicUrl);

    } catch (error) {
      alert('Lỗi upload file: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoParseAi = async (pdfUrlToScan) => {
    try {
      setParsingAi(true);
      const res = await fetch('/api/parse-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfUrl: pdfUrlToScan || currentPdfUrl })
      });

      const result = await res.json();
      if (result.success && result.data) {
        setHeaderData({
          ma_don_hang: result.data.ma_don_hang || '',
          ngay_xuong_don: result.data.ngay_xuong_don || ''
        });

        // AI chỉ đọc được mã khách hàng ở cấp cả đơn (không phân theo từng dòng),
        // nên dùng giá trị đó làm mặc định cho MỌI dòng — người dùng có thể
        // sửa lại riêng từng dòng nếu 1 đơn sản xuất thực tế gồm nhiều khách khác nhau.
        const maKhachHangMacDinh = result.data.ma_khach_hang || '';

        if (result.data.items && result.data.items.length > 0) {
          setItems(result.data.items.map((it) => ({
            ma_khach_hang: maKhachHangMacDinh,
            ma_hang: it.ma_hang || '',
            ten_san_pham: it.ten_san_pham || '',
            quy_cach: it.quy_cach || '',
            so_luong: it.so_luong || 0,
            chat_lieu: it.chat_lieu || '',
            so_ngay_giao: 0,
            co_po_goc: true,
            da_nhan_chung_tu: false
          })));
        }
      } else {
        alert('AI không đọc được dữ liệu cấu trúc bảng, bà nhập thủ công giúp tôi nhé!');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối AI scan.');
    } finally {
      setParsingAi(false);
    }
  };

  const handleAddItemRow = useCallback(() => {
    let newIndex = -1;
    setItems((prevItems) => {
      newIndex = prevItems.length;
      return [...prevItems, emptyItem()];
    });
    return newIndex;
  }, []);

  const handleRemoveItemRow = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };

      // Nếu bỏ tick "Có PO gốc" -> tự động bỏ luôn tick "Đã nhận chứng từ"
      // vì hàng không PO thì mặc định là hàng tiểu ngạch, không có chứng từ thông quan.
      if (field === 'co_po_goc' && value === false) {
        newItems[index].da_nhan_chung_tu = false;
      }

      return newItems;
    });
  };

  const handleItemKeyDown = (e, index, field) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    const fieldPos = ITEM_FIELDS.indexOf(field);
    const isLastField = fieldPos === ITEM_FIELDS.length - 1;
    const isLastRow = index === items.length - 1;

    if (isLastField && isLastRow) {
      const newIndex = handleAddItemRow();
      setTimeout(() => focusCell(newIndex, ITEM_FIELDS[0]), 0);
      return;
    }

    if (isLastField) {
      focusCell(index + 1, ITEM_FIELDS[0]);
    } else {
      focusCell(index, ITEM_FIELDS[fieldPos + 1]);
    }
  };

  const handleSaveOrder = async () => {
    if (!headerData.ma_don_hang || !headerData.ngay_xuong_don) {
      alert('Vui lòng điền mã đơn hàng và ngày xuống đơn!');
      return;
    }

    const thieuMaKH = items.some((it) => !it.ma_khach_hang);
    if (thieuMaKH) {
      alert('Vui lòng chọn Mã khách hàng cho tất cả các dòng sản phẩm!');
      return;
    }

    const recordsToInsert = items.map((item) => ({
      ...headerData,
      ...item,
      ngay_giao_du_kien: tinhNgayGiaoDuKien(headerData.ngay_xuong_don, item.so_ngay_giao),
      file_url: currentPdfUrl
    }));

    const { error } = await supabase
      .from('production_orders')
      .insert(recordsToInsert);

    if (error) {
      alert('Lỗi khi lưu: ' + error.message);
    } else {
      alert('Đã lưu toàn bộ đơn sản xuất thành công!');
      setCurrentPdfUrl('');
      fetchOrders();
      fetchSuggestions();
    }
  };

  // Bấm trực tiếp trên bảng danh sách để tick "Đã nhận chứng từ thông quan"
  // mà không cần mở lại form chi tiết — tiện cho việc cập nhật hàng ngày.
  const handleToggleChungTu = async (order) => {
    const newValue = !order.da_nhan_chung_tu;
    const { error } = await supabase
      .from('production_orders')
      .update({ da_nhan_chung_tu: newValue })
      .eq('id', order.id);

    if (error) {
      alert('Lỗi khi cập nhật: ' + error.message);
      return;
    }

    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, da_nhan_chung_tu: newValue } : o)));
  };

  // GIAO DIỆN SPLIT-SCREEN (NHẬP/RÀ SOÁT ĐƠN SẢN XUẤT)
  if (currentPdfUrl) {
    return (
      <div className="flex h-screen w-full bg-gray-50">
        <div className="w-1/2 h-full border-r bg-white">
          <iframe src={currentPdfUrl} className="w-full h-full" title="PDF Preview" />
        </div>

        <div className="w-1/2 h-full p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Rà soát & Nhập đơn sản xuất (Nhiều dòng)</h2>
            <button
              onClick={() => setCurrentPdfUrl('')}
              className="text-red-500 hover:underline text-sm"
            >
              Quay lại danh sách
            </button>
          </div>

          <div className="mb-4">
            <button
              onClick={() => handleAutoParseAi(currentPdfUrl)}
              disabled={parsingAi}
              className="w-full bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 flex items-center justify-center gap-2 shadow transition text-sm"
            >
              {parsingAi ? '⏳ AI đang bóc tách toàn bộ bảng đơn hàng...' : '✨ Yêu cầu AI đọc lại toàn bộ PDF'}
            </button>
          </div>

          {/* Thông tin chung — chỉ còn Mã đơn hàng và Ngày xuống đơn, không còn Mã khách hàng ở đây */}
          <div className="grid grid-cols-2 gap-3 mb-4 bg-white p-4 rounded-lg border shadow-sm">
            <div>
              <label className="block text-xs font-medium mb-1">Mã đơn hàng</label>
              <input
                type="text"
                value={headerData.ma_don_hang}
                onChange={(e) => setHeaderData({ ...headerData, ma_don_hang: e.target.value })}
                className="w-full p-1.5 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Ngày xuống đơn</label>
              <input
                type="date"
                value={headerData.ngay_xuong_don}
                onChange={(e) => setHeaderData({ ...headerData, ngay_xuong_don: e.target.value })}
                className="w-full p-1.5 border rounded text-sm"
              />
            </div>
          </div>

          {/* Bảng chi tiết danh sách sản phẩm */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-sm">Chi tiết danh sách hàng ({items.length} dòng)</h3>
              <button
                onClick={handleAddItemRow}
                className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
              >
                + Thêm dòng
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-2">
              💡 Mẹo: nhấn <kbd className="px-1 border rounded bg-gray-100">Enter</kbd> để nhảy nhanh sang ô tiếp theo.
              Ở ô cuối cùng, nhấn Enter sẽ tự thêm dòng mới.
            </p>

            <datalist id="suggest-ma-hang">
              {suggestions.ma_hang.map((v) => <option key={v} value={v} />)}
            </datalist>
            <datalist id="suggest-ten-san-pham">
              {suggestions.ten_san_pham.map((v) => <option key={v} value={v} />)}
            </datalist>
            <datalist id="suggest-quy-cach">
              {suggestions.quy_cach.map((v) => <option key={v} value={v} />)}
            </datalist>
            <datalist id="suggest-chat-lieu">
              {suggestions.chat_lieu.map((v) => <option key={v} value={v} />)}
            </datalist>

            <div className="space-y-3">
              {items.map((item, index) => {
                const ngayGiaoDuKien = tinhNgayGiaoDuKien(headerData.ngay_xuong_don, item.so_ngay_giao);

                return (
                  <div key={index} className="p-3 bg-white border rounded-lg shadow-sm relative space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500">Dòng #{index + 1}</span>
                      {items.length > 1 && (
                        <button
                          onClick={() => handleRemoveItemRow(index)}
                          className="text-red-500 text-xs hover:underline"
                        >
                          Xóa dòng
                        </button>
                      )}
                    </div>

                    {/* Mã khách hàng — matching với bảng customers, giống module PO */}
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">Mã khách hàng</label>
                      <select
                        ref={setInputRef(index, 'ma_khach_hang')}
                        value={item.ma_khach_hang}
                        onChange={(e) => handleItemChange(index, 'ma_khach_hang', e.target.value)}
                        onKeyDown={(e) => handleItemKeyDown(e, index, 'ma_khach_hang')}
                        className="w-full p-1.5 border rounded text-xs"
                      >
                        <option value="">-- Chọn khách hàng --</option>
                        {customers.map((c) => (
                          <option key={c.customer_code} value={c.customer_code}>
                            {c.customer_code} — {c.customer_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        ref={setInputRef(index, 'ma_hang')}
                        type="text"
                        list="suggest-ma-hang"
                        placeholder="Mã hàng / Model"
                        value={item.ma_hang}
                        onChange={(e) => handleItemChange(index, 'ma_hang', e.target.value)}
                        onKeyDown={(e) => handleItemKeyDown(e, index, 'ma_hang')}
                        className="p-1.5 border rounded text-xs"
                      />
                      <input
                        ref={setInputRef(index, 'ten_san_pham')}
                        type="text"
                        list="suggest-ten-san-pham"
                        placeholder="Tên sản phẩm"
                        value={item.ten_san_pham}
                        onChange={(e) => handleItemChange(index, 'ten_san_pham', e.target.value)}
                        onKeyDown={(e) => handleItemKeyDown(e, index, 'ten_san_pham')}
                        className="p-1.5 border rounded text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <input
                        ref={setInputRef(index, 'quy_cach')}
                        type="text"
                        list="suggest-quy-cach"
                        placeholder="Quy cách"
                        value={item.quy_cach}
                        onChange={(e) => handleItemChange(index, 'quy_cach', e.target.value)}
                        onKeyDown={(e) => handleItemKeyDown(e, index, 'quy_cach')}
                        className="p-1.5 border rounded text-xs"
                      />
                      <input
                        ref={setInputRef(index, 'so_luong')}
                        type="number"
                        placeholder="Số lượng"
                        value={item.so_luong}
                        onChange={(e) => handleItemChange(index, 'so_luong', parseInt(e.target.value) || 0)}
                        onKeyDown={(e) => handleItemKeyDown(e, index, 'so_luong')}
                        className="p-1.5 border rounded text-xs"
                      />
                      <input
                        ref={setInputRef(index, 'chat_lieu')}
                        type="text"
                        list="suggest-chat-lieu"
                        placeholder="Chất liệu"
                        value={item.chat_lieu}
                        onChange={(e) => handleItemChange(index, 'chat_lieu', e.target.value)}
                        onKeyDown={(e) => handleItemKeyDown(e, index, 'chat_lieu')}
                        className="p-1.5 border rounded text-xs"
                      />
                    </div>

                    {/* Thời gian giao hàng: nhập số ngày, tự tính ra ngày cụ thể */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-0.5">Giao sau (số ngày)</label>
                        <input
                          ref={setInputRef(index, 'so_ngay_giao')}
                          type="number"
                          placeholder="Ví dụ: 20"
                          value={item.so_ngay_giao}
                          onChange={(e) => handleItemChange(index, 'so_ngay_giao', parseInt(e.target.value) || 0)}
                          onKeyDown={(e) => handleItemKeyDown(e, index, 'so_ngay_giao')}
                          className="w-full p-1.5 border rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-0.5">Ngày giao dự kiến (tự tính)</label>
                        <input
                          type="text"
                          disabled
                          value={ngayGiaoDuKien || '— cần nhập Ngày xuống đơn trước —'}
                          className="w-full p-1.5 border rounded text-xs bg-gray-50 text-gray-600"
                        />
                      </div>
                    </div>

                    {/* PO gốc & chứng từ thông quan */}
                    <div className="flex items-center gap-6 pt-1 border-t">
                      <label className="flex items-center gap-1.5 text-xs">
                        <input
                          type="checkbox"
                          checked={item.co_po_goc}
                          onChange={(e) => handleItemChange(index, 'co_po_goc', e.target.checked)}
                        />
                        Có PO gốc
                      </label>

                      {item.co_po_goc ? (
                        <label className="flex items-center gap-1.5 text-xs">
                          <input
                            type="checkbox"
                            checked={item.da_nhan_chung_tu}
                            onChange={(e) => handleItemChange(index, 'da_nhan_chung_tu', e.target.checked)}
                          />
                          Đã nhận chứng từ thông quan chính ngạch
                        </label>
                      ) : (
                        <span className="text-xs italic text-orange-600">Hàng tiểu ngạch (không có PO)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleSaveOrder}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 text-sm shadow"
          >
            LƯU TẤT CẢ DÒNG VÀO HỆ THỐNG
          </button>
        </div>
      </div>
    );
  }

  // GIAO DIỆN TRANG CHỦ DANH SÁCH
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản Lý Đơn Sản Xuất</h1>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
        >
          + Import Đơn Sản Xuất (PDF)
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-x-auto border">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-100 border-b text-sm text-gray-700">
              <th className="p-3">Mã đơn hàng</th>
              <th className="p-3">Ngày xuống đơn</th>
              <th className="p-3">Mã khách hàng</th>
              <th className="p-3">Mã hàng</th>
              <th className="p-3">Tên sản phẩm</th>
              <th className="p-3">Số lượng</th>
              <th className="p-3">Ngày giao dự kiến</th>
              <th className="p-3">PO gốc</th>
              <th className="p-3">Chứng từ thông quan</th>
              <th className="p-3">File gốc PDF</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center p-6 text-gray-500">Chưa có đơn sản xuất nào được tạo.</td>
              </tr>
            ) : (
              orders.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50 text-sm">
                  <td className="p-3 font-semibold">{item.ma_don_hang}</td>
                  <td className="p-3">{item.ngay_xuong_don}</td>
                  <td className="p-3">{item.ma_khach_hang}</td>
                  <td className="p-3">{item.ma_hang}</td>
                  <td className="p-3">{item.ten_san_pham}</td>
                  <td className="p-3">{item.so_luong}</td>
                  <td className="p-3">{item.ngay_giao_du_kien || '—'}</td>
                  <td className="p-3">
                    {item.co_po_goc ? (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Có PO</span>
                    ) : (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Tiểu ngạch</span>
                    )}
                  </td>
                  <td className="p-3">
                    {item.co_po_goc ? (
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!item.da_nhan_chung_tu}
                          onChange={() => handleToggleChungTu(item)}
                        />
                        <span className={item.da_nhan_chung_tu ? 'text-green-600' : 'text-gray-400'}>
                          {item.da_nhan_chung_tu ? 'Đã nhận' : 'Chưa nhận'}
                        </span>
                      </label>
                    ) : (
                      <span className="text-xs italic text-orange-600">Hàng tiểu ngạch</span>
                    )}
                  </td>
                  <td className="p-3">
                    {item.file_url && (
                      <a href={item.file_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                        Xem PDF
                      </a>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[400px] shadow-lg">
            <h3 className="text-lg font-bold mb-4">Tải lên file PDF đơn sản xuất</h3>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileUpload}
              disabled={loading}
              className="block w-full mb-4 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            {loading && <p className="text-sm text-blue-600 mb-4 animate-pulse">Đang tải file lên hệ thống...</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
