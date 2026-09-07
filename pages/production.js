import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

// Thứ tự các field trong 1 dòng sản phẩm — cập nhật thêm ma_khach_hang và so_ngay_giao
const ITEM_FIELDS = ['ma_khach_hang', 'ma_hang', 'ten_san_pham', 'quy_cach', 'so_luong', 'chat_lieu', 'so_ngay_giao', 'co_po', 'chung_tu_thong_quan'];

export default function ProductionPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [parsingAi, setParsingAi] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState('');

  // State chung cho đơn hàng (đã lược bỏ ma_khach_hang chung)
  const [headerData, setHeaderData] = useState({
    ma_don_hang: '',
    ngay_xuong_don: ''
  });

  // State danh sách các dòng sản phẩm trong đơn (bổ sung các trường mới theo yêu cầu)
  const [items, setItems] = useState([
    { 
      ma_khach_hang: '', 
      ma_hang: '', 
      ten_san_pham: '', 
      quy_cach: '', 
      so_luong: 0, 
      chat_lieu: '',
      so_ngay_giao: '',
      ngay_giao_hang: '',
      co_po: true,             // Mặc định có PO (hàng chính ngạch)
      chung_tu_thong_quan: false // Checkbox tích thủ công khi nhận chứng từ
    }
  ]);

  // ==========================================
  // AUTOCOMPLETE: danh sách gợi ý lấy từ dữ liệu cũ
  // ==========================================
  const [suggestions, setSuggestions] = useState({
    ten_san_pham: [],
    chat_lieu: [],
    ma_khach_hang: [],
    quy_cach: [],
    ma_hang: []
  });

  // ==========================================
  // REF cho từng ô input trong bảng
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

  const fetchSuggestions = async () => {
    const { data, error } = await supabase
      .from('production_orders')
      .select('ten_san_pham, chat_lieu, ma_khach_hang, quy_cach, ma_hang');

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
      ma_khach_hang: uniqueSorted('ma_khach_hang'),
      quy_cach: uniqueSorted('quy_cach'),
      ma_hang: uniqueSorted('ma_hang')
    });
  };

  useEffect(() => {
    fetchOrders();
    fetchSuggestions();
  }, []);

  // Hàm tính toán ngày giao hàng dựa vào ngày xuống đơn và số ngày giao
  const calculateDeliveryDate = (ngayXuongDon, soNgay) => {
    if (!ngayXuongDon || isNaN(soNgay) || soNgay === '') return '';
    const date = new Date(ngayXuongDon);
    date.setDate(date.getDate() + parseInt(soNgay, 10));
    return date.toISOString().split('T')[0];
  };

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
        if (result.data.items && result.data.items.length > 0) {
          // Gắn thêm các giá trị mặc định cho item mới parse nếu chưa có
          const mappedItems = result.data.items.map(item => ({
            ...item,
            ma_khach_hang: result.data.ma_khach_hang || '',
            so_ngay_giao: item.so_ngay_giao || '',
            ngay_giao_hang: calculateDeliveryDate(result.data.ngay_xuong_don, item.so_ngay_giao),
            co_po: true,
            chung_tu_thong_quan: false
          }));
          setItems(mappedItems);
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
      return [
        ...prevItems,
        { 
          ma_khach_hang: '', 
          ma_hang: '', 
          ten_san_pham: '', 
          quy_cach: '', 
          so_luong: 0, 
          chat_lieu: '', 
          so_ngay_giao: '',
          ngay_giao_hang: '',
          co_po: true,
          chung_tu_thong_quan: false
        }
      ];
    });
    return newIndex;
  }, []);

  const handleRemoveItemRow = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // Nếu thay đổi số ngày giao hoặc thay đổi ngày xuống đơn chung, tự tính lại ngày giao hàng
    if (field === 'so_ngay_giao') {
      newItems[index]['ngay_giao_hang'] = calculateDeliveryDate(headerData.ngay_xuong_don, value);
    }

    // Nếu chuyển trạng thái không có PO (hàng bảo hành), tự động xử lý chứng từ thông quan
    if (field === 'co_po' && !value) {
      newItems[index]['chung_tu_thong_quan'] = false; 
    }

    setItems(newItems);
  };

  // Khi thay đổi ngày xuống đơn chung, cập nhật lại toàn bộ ngày giao hàng của các dòng dựa theo số ngày giao tương ứng
  const handleHeaderDateChange = (e) => {
    const newDate = e.target.value;
    setHeaderData({ ...headerData, ngay_xuong_don: newDate });
    
    setItems(prevItems => prevItems.map(item => ({
      ...item,
      ngay_giao_hang: calculateDeliveryDate(newDate, item.so_ngay_giao)
    })));
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

    const recordsToInsert = items.map(item => ({
      ma_don_hang: headerData.ma_don_hang,
      ngay_xuong_don: headerData.ngay_xuong_don,
      ma_khach_hang: item.ma_khach_hang,
      ma_hang: item.ma_hang,
      ten_san_pham: item.ten_san_pham,
      quy_cach: item.quy_cach,
      so_luong: item.so_luong,
      chat_lieu: item.chat_lieu,
      so_ngay_giao: item.so_ngay_giao,
      ngay_giao_hang: item.ngay_giao_hang,
      co_po: item.co_po,
      chung_tu_thong_quan: item.co_po ? item.chung_tu_thong_quan : false,
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

  // GIAO DIỆN SPLIT-SCREEN 
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

          {/* Thông tin chung (Chỉ còn Mã đơn hàng và Ngày xuống đơn) */}
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
                onChange={handleHeaderDateChange}
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
            </p>

            <div className="space-y-3">
              {items.map((item, index) => (
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

                  {/* Dòng 1: Mã khách hàng & Mã hàng */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-0.5">Mã khách hàng</label>
                      <input
                        ref={setInputRef(index, 'ma_khach_hang')}
                        type="text"
                        list="suggest-ma-khach-hang"
                        placeholder="Mã khách hàng"
                        value={item.ma_khach_hang}
                        onChange={(e) => handleItemChange(index, 'ma_khach_hang', e.target.value)}
                        onKeyDown={(e) => handleItemKeyDown(e, index, 'ma_khach_hang')}
                        className="w-full p-1.5 border rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-0.5">Mã hàng / Model</label>
                      <input
                        ref={setInputRef(index, 'ma_hang')}
                        type="text"
                        list="suggest-ma-hang"
                        placeholder="Mã hàng / Model"
                        value={item.ma_hang}
                        onChange={(e) => handleItemChange(index, 'ma_hang', e.target.value)}
                        onKeyDown={(e) => handleItemKeyDown(e, index, 'ma_hang')}
                        className="w-full p-1.5 border rounded text-xs"
                      />
                    </div>
                  </div>

                  {/* Dòng 2: Tên sản phẩm & Quy cách */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-0.5">Tên sản phẩm</label>
                      <input
                        ref={setInputRef(index, 'ten_san_pham')}
                        type="text"
                        list="suggest-ten-san-pham"
                        placeholder="Tên sản phẩm"
                        value={item.ten_san_pham}
                        onChange={(e) => handleItemChange(index, 'ten_san_pham', e.target.value)}
                        onKeyDown={(e) => handleItemKeyDown(e, index, 'ten_san_pham')}
                        className="w-full p-1.5 border rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-0.5">Quy cách</label>
                      <input
                        ref={setInputRef(index, 'quy_cach')}
                        type="text"
                        list="suggest-quy-cach"
                        placeholder="Quy cách"
                        value={item.quy_cach}
                        onChange={(e) => handleItemChange(index, 'quy_cach', e.target.value)}
                        onKeyDown={(e) => handleItemKeyDown(e, index, 'quy_cach')}
                        className="w-full p-1.5 border rounded text-xs"
                      />
                    </div>
                  </div>

                  {/* Dòng 3: Số lượng, Chất liệu, Số ngày giao */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-0.5">Số lượng</label>
                      <input
                        ref={setInputRef(index, 'so_luong')}
                        type="number"
                        placeholder="Số lượng"
                        value={item.so_luong}
                        onChange={(e) => handleItemChange(index, 'so_luong', parseInt(e.target.value) || 0)}
                        onKeyDown={(e) => handleItemKeyDown(e, index, 'so_luong')}
                        className="w-full p-1.5 border rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-0.5">Chất liệu</label>
                      <input
                        ref={setInputRef(index, 'chat_lieu')}
                        type="text"
                        list="suggest-chat-lieu"
                        placeholder="Chất liệu"
                        value={item.chat_lieu}
                        onChange={(e) => handleItemChange(index, 'chat_lieu', e.target.value)}
                        onKeyDown={(e) => handleItemKeyDown(e, index, 'chat_lieu')}
                        className="w-full p-1.5 border rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-0.5">Số ngày giao</label>
                      <input
                        ref={setInputRef(index, 'so_ngay_giao')}
                        type="number"
                        placeholder="Ví dụ: 20"
                        value={item.so_ngay_giao}
                        onChange={(e) => handleItemChange(index, 'so_ngay_giao', e.target.value)}
                        onKeyDown={(e) => handleItemKeyDown(e, index, 'so_ngay_giao')}
                        className="w-full p-1.5 border rounded text-xs"
                      />
                    </div>
                  </div>

                  {/* Hiển thị ngày giao hàng tự tính & Cấu hình Báo quan / Check-list */}
                  <div className="flex items-center justify-between pt-2 border-t text-xs bg-gray-50 p-2 rounded">
                    <div>
                      <span className="text-gray-500">Ngày giao dự kiến: </span>
                      <span className="font-semibold text-blue-600">
                        {item.ngay_giao_hang || 'Chưa xác định'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Checkbox Có PO / Báo quan */}
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          ref={setInputRef(index, 'co_po')}
                          type="checkbox"
                          checked={item.co_po}
                          onChange={(e) => handleItemChange(index, 'co_po', e.target.checked)}
                          onKeyDown={(e) => handleItemKeyDown(e, index, 'co_po')}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium">Có PO (Báo quan)</span>
                      </label>

                      {/* Trạng thái File gốc / Checklist chứng từ */}
                      {item.co_po ? (
                        <label className="flex items-center gap-1.5 cursor-pointer text-purple-700">
                          <input
                            ref={setInputRef(index, 'chung_tu_thong_quan')}
                            type="checkbox"
                            checked={item.chung_tu_thong_quan}
                            onChange={(e) => handleItemChange(index, 'chung_tu_thong_quan', e.target.checked)}
                            onKeyDown={(e) => handleItemKeyDown(e, index, 'chung_tu_thong_quan')}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span>Đã nhận chứng từ chính ngạch</span>
                        </label>
                      ) : (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-800 font-semibold rounded text-[11px]">
                          Hàng tiểu ngạch
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>

            {/* datalist dùng chung cho toàn bộ các ô cùng loại trong bảng */}
            <datalist id="suggest-ma-khach-hang">
              {suggestions.ma_khach_hang.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
            <datalist id="suggest-ma-hang">
              {suggestions.ma_hang.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
            <datalist id="suggest-ten-san-pham">
              {suggestions.ten_san_pham.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
            <datalist id="suggest-quy-cach">
              {suggestions.quy_cach.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
            <datalist id="suggest-chat-lieu">
              {suggestions.chat_lieu.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
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

      <div className="bg-white shadow rounded-lg overflow-hidden border">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b text-sm text-gray-700">
              <th className="p-3">Mã đơn hàng</th>
              <th className="p-3">Ngày xuống đơn</th>
              <th className="p-3">Mã khách hàng</th>
              <th className="p-3">Mã hàng</th>
              <th className="p-3">Tên sản phẩm</th>
              <th className="p-3">Số lượng</th>
              <th className="p-3">Ngày giao</th>
              <th className="p-3">File gốc / Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center p-6 text-gray-500">Chưa có đơn sản xuất nào được tạo.</td>
              </tr>
            ) : (
              orders.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50 text-sm">
                  <td className="p-3 font-semibold">{item.ma_don_hang}</td>
                  <td className="p-3">{item.ngay_xuong_don}</td>
                  <td className="p-3 font-medium text-purple-700">{item.ma_khach_hang || '—'}</td>
                  <td className="p-3">{item.ma_hang}</td>
                  <td className="p-3">{item.ten_san_pham}</td>
                  <td className="p-3">{item.so_luong}</td>
                  <td className="p-3 text-blue-600">{item.ngay_giao_hang || '—'}</td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      {!item.co_po ? (
                        <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs font-semibold w-max">
                          Hàng tiểu ngạch
                        </span>
                      ) : item.chung_tu_thong_quan ? (
                        <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-semibold w-max">
                          Đã nhận chứng từ chính ngạch
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs w-max">
                          Chưa có chứng từ (Chính ngạch)
                        </span>
                      )}

                      {item.file_url && (
                        <a href={item.file_url} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs">
                          Xem PDF gốc
                        </a>
                      )}
                    </div>
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
