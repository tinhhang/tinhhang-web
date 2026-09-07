import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

// ==========================================
// HẰNG SỐ / NHÃN HIỂN THỊ
// ==========================================

const LOAI_DON_HANG_LABEL = {
  PO: 'PO',
  HDMB: 'HĐMB',
  Bao_gia: 'Báo giá'
};

const TRANG_THAI_LABEL = {
  moi_nhan: 'Mới nhận',
  da_xuong_don_sx: 'Đã xuống đơn sản xuất',
  da_nhap_kho: 'Đã nhập kho',
  da_giao_hang: 'Đã giao hàng',
  po_closed: 'PO Closed'
};

const TRANG_THAI_ORDER = ['moi_nhan', 'da_xuong_don_sx', 'da_nhap_kho', 'da_giao_hang', 'po_closed'];

const TRANG_THAI_COLOR = {
  moi_nhan: 'bg-gray-100 text-gray-700',
  da_xuong_don_sx: 'bg-blue-100 text-blue-700',
  da_nhap_kho: 'bg-purple-100 text-purple-700',
  da_giao_hang: 'bg-green-100 text-green-700',
  po_closed: 'bg-black text-white'
};

const ITEM_FIELDS = ['ma_hang', 'ten_hang', 'so_luong', 'don_gia', 'thue_suat', 'so_luong_da_xuong_sx', 'so_luong_da_nhap_kho', 'so_luong_da_giao'];

const SO_NGAY_CANH_BAO_CHUA_XUONG_SX = 3;

const emptyItem = () => ({
  ma_hang: '',
  ten_hang: '',
  so_luong: 0,
  don_gia: 0,
  thue_suat: 0,
  so_luong_da_xuong_sx: 0,
  so_luong_da_nhap_kho: 0,
  so_luong_da_giao: 0
});

const formatVND = (value) => {
  const n = Number(value) || 0;
  return n.toLocaleString('vi-VN') + ' đ';
};

const tinhThanhTien = (item) => {
  const soLuong = Number(item.so_luong) || 0;
  const donGia = Number(item.don_gia) || 0;
  const thueSuat = Number(item.thue_suat) || 0;
  return soLuong * donGia * (1 + thueSuat / 100);
};

const soNgayTu = (dateStr) => {
  if (!dateStr) return null;
  const then = new Date(dateStr);
  const now = new Date();
  const diffMs = now - then;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

export default function CustomerOrdersPage() {
  // ==========================================
  // STATE CHUNG
  // ==========================================
  const [view, setView] = useState('list'); // 'list' | 'detail'
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // Bộ lọc ở màn hình danh sách
  const [filterMaKhachHang, setFilterMaKhachHang] = useState('');
  const [filterLoaiDonHang, setFilterLoaiDonHang] = useState('');

  // ==========================================
  // STATE MÀN HÌNH CHI TIẾT (tạo mới / sửa)
  // ==========================================
  const [currentOrderId, setCurrentOrderId] = useState(null); // null | 'new' | id
  const [savingOrder, setSavingOrder] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [headerData, setHeaderData] = useState({
    ma_don_hang: '',
    ma_khach_hang: '',
    loai_don_hang: 'PO',
    ngay_don_hang: '',
    ngay_yeu_cau_giao: '',
    trang_thai: 'moi_nhan',
    file_url: ''
  });
  const [trangThaiBanDau, setTrangThaiBanDau] = useState('moi_nhan'); // để biết có đổi trạng thái hay không khi lưu

  const [items, setItems] = useState([emptyItem()]);

  // Gợi ý autocomplete cho mã hàng / tên hàng (lấy từ dữ liệu đã nhập trước đó)
  const [suggestions, setSuggestions] = useState({ ma_hang: [], ten_hang: [] });

  // Ref các ô input trong bảng item, dùng để điều khiển phím Enter nhảy ô
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

  // ==========================================
  // TẢI DỮ LIỆU
  // ==========================================

  const fetchOrders = async () => {
    setLoadingList(true);
    const { data, error } = await supabase
      .from('customer_orders')
      .select('*, customer_order_items(*)')
      .order('id', { ascending: false });
    if (!error && data) setOrders(data);
    setLoadingList(false);
  };

  const fetchCustomers = async () => {
    // Giả định bảng "customers" có cột ma_khach_hang và ten_khach_hang.
    // Nếu tên cột khác, sửa lại 2 dòng .select() và phần hiển thị bên dưới cho khớp.
    const { data, error } = await supabase
      .from('customers')
      .select('ma_khach_hang, ten_khach_hang')
      .order('ma_khach_hang', { ascending: true });
    if (!error && data) setCustomers(data);
  };

  const fetchSuggestions = async () => {
    const { data, error } = await supabase
      .from('customer_order_items')
      .select('ma_hang, ten_hang');
    if (error || !data) return;

    const uniqueSorted = (key) => {
      const values = data.map((row) => (row[key] || '').trim()).filter((v) => v.length > 0);
      return Array.from(new Set(values)).sort();
    };

    setSuggestions({
      ma_hang: uniqueSorted('ma_hang'),
      ten_hang: uniqueSorted('ten_hang')
    });
  };

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchSuggestions();
  }, []);

  // ==========================================
  // CẢNH BÁO Ở TRANG CHỦ (tính động từ dữ liệu orders đã tải)
  // ==========================================

  const canhBaoGiaoCham = useMemo(() => {
    const homNay = new Date();
    homNay.setHours(0, 0, 0, 0);

    return orders.filter((o) => {
      if (!o.ngay_yeu_cau_giao) return false;
      if (o.trang_thai === 'da_giao_hang' || o.trang_thai === 'po_closed') return false;
      const hanGiao = new Date(o.ngay_yeu_cau_giao);
      return hanGiao < homNay;
    });
  }, [orders]);

  const canhBaoChuaXuongSX = useMemo(() => {
    return orders.filter((o) => {
      if (o.trang_thai !== 'moi_nhan') return false;
      const soNgay = soNgayTu(o.created_at);
      return soNgay !== null && soNgay > SO_NGAY_CANH_BAO_CHUA_XUONG_SX;
    });
  }, [orders]);

  // ==========================================
  // DANH SÁCH ĐÃ LỌC (theo mã khách hàng / loại đơn)
  // ==========================================

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (filterMaKhachHang && o.ma_khach_hang !== filterMaKhachHang) return false;
      if (filterLoaiDonHang && o.loai_don_hang !== filterLoaiDonHang) return false;
      return true;
    });
  }, [orders, filterMaKhachHang, filterLoaiDonHang]);

  // ==========================================
  // MỞ MÀN HÌNH CHI TIẾT (tạo mới hoặc sửa đơn có sẵn)
  // ==========================================

  const openNewOrder = () => {
    setHeaderData({
      ma_don_hang: '',
      ma_khach_hang: '',
      loai_don_hang: 'PO',
      ngay_don_hang: new Date().toISOString().slice(0, 10),
      ngay_yeu_cau_giao: '',
      trang_thai: 'moi_nhan',
      file_url: ''
    });
    setTrangThaiBanDau('moi_nhan');
    setItems([emptyItem()]);
    setCurrentOrderId('new');
    setView('detail');
  };

  const openOrder = (order) => {
    setHeaderData({
      ma_don_hang: order.ma_don_hang || '',
      ma_khach_hang: order.ma_khach_hang || '',
      loai_don_hang: order.loai_don_hang || 'PO',
      ngay_don_hang: order.ngay_don_hang || '',
      ngay_yeu_cau_giao: order.ngay_yeu_cau_giao || '',
      trang_thai: order.trang_thai || 'moi_nhan',
      file_url: order.file_url || ''
    });
    setTrangThaiBanDau(order.trang_thai || 'moi_nhan');
    const orderItems = (order.customer_order_items || []).length > 0
      ? order.customer_order_items.map((it) => ({ ...it }))
      : [emptyItem()];
    setItems(orderItems);
    setCurrentOrderId(order.id);
    setView('detail');
  };

  const backToList = () => {
    setView('list');
    setCurrentOrderId(null);
  };

  // ==========================================
  // UPLOAD FILE PO/HĐ GỐC (PDF hoặc ảnh)
  // ==========================================

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Chỉ chấp nhận file PDF hoặc hình ảnh (PNG/JPG/WEBP).');
      e.target.value = null;
      return;
    }

    setUploadingFile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('po_list')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('po_list')
        .getPublicUrl(fileName);

      setHeaderData((prev) => ({ ...prev, file_url: publicUrlData.publicUrl }));
    } catch (err) {
      alert('Lỗi upload file: ' + err.message);
    } finally {
      setUploadingFile(false);
      e.target.value = null;
    }
  };

  // ==========================================
  // THAO TÁC VỚI CÁC DÒNG SẢN PHẨM
  // ==========================================

  const handleAddItemRow = useCallback(() => {
    let newIndex = -1;
    setItems((prev) => {
      newIndex = prev.length;
      return [...prev, emptyItem()];
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
      return newItems;
    });
  };

  // Chuẩn hoá mã hàng khi rời khỏi ô (trim + viết hoa), và cảnh báo nhẹ nếu mã
  // chưa từng xuất hiện trong dữ liệu cũ — không chặn nhập, chỉ nhắc kiểm tra lại.
  const handleMaHangBlur = (index, rawValue) => {
    const chuanHoa = rawValue.trim().toUpperCase();
    handleItemChange(index, 'ma_hang', chuanHoa);

    if (chuanHoa.length > 0 && !suggestions.ma_hang.includes(chuanHoa)) {
      console.warn(`Mã hàng "${chuanHoa}" chưa từng xuất hiện trong dữ liệu trước đây — kiểm tra lại chính tả nếu cần.`);
    }
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

  const tongGiaTriDon = useMemo(() => {
    return items.reduce((sum, item) => sum + tinhThanhTien(item), 0);
  }, [items]);

  // ==========================================
  // LƯU ĐƠN HÀNG (tạo mới hoặc cập nhật)
  // ==========================================

  const handleSaveOrder = async () => {
    if (!headerData.ma_don_hang || !headerData.ma_khach_hang || !headerData.ngay_don_hang) {
      alert('Vui lòng điền đủ Mã đơn hàng, Mã khách hàng và Ngày đơn hàng!');
      return;
    }

    const validItems = items.filter((it) => it.ma_hang.trim() && it.ten_hang.trim());
    if (validItems.length === 0) {
      alert('Đơn hàng cần ít nhất 1 dòng sản phẩm có Mã hàng và Tên hàng.');
      return;
    }

    setSavingOrder(true);
    try {
      let orderId = currentOrderId;

      if (currentOrderId === 'new') {
        // Tạo mới đơn hàng
        const { data: inserted, error: insertError } = await supabase
          .from('customer_orders')
          .insert([headerData])
          .select()
          .single();

        if (insertError) throw insertError;
        orderId = inserted.id;

        // Ghi lịch sử trạng thái ban đầu
        await supabase.from('customer_order_status_history').insert([{
          order_id: orderId,
          trang_thai: headerData.trang_thai,
          ghi_chu: 'Tạo đơn hàng mới'
        }]);

      } else {
        // Cập nhật đơn hàng có sẵn
        const { error: updateError } = await supabase
          .from('customer_orders')
          .update(headerData)
          .eq('id', orderId);

        if (updateError) throw updateError;

        // Nếu trạng thái thay đổi so với lúc mở form -> ghi thêm 1 dòng lịch sử
        if (headerData.trang_thai !== trangThaiBanDau) {
          await supabase.from('customer_order_status_history').insert([{
            order_id: orderId,
            trang_thai: headerData.trang_thai,
            ghi_chu: `Chuyển từ "${TRANG_THAI_LABEL[trangThaiBanDau]}" sang "${TRANG_THAI_LABEL[headerData.trang_thai]}"`
          }]);
        }

        // Xoá toàn bộ item cũ rồi insert lại (đơn giản, tránh phải so khớp id)
        const { error: deleteError } = await supabase
          .from('customer_order_items')
          .delete()
          .eq('order_id', orderId);

        if (deleteError) throw deleteError;
      }

      // Chuẩn hoá mã hàng (trim + uppercase) trước khi lưu, và bỏ field "id" cũ nếu có
      const itemsToInsert = validItems.map(({ id, order_id, created_at, ...rest }) => ({
        ...rest,
        ma_hang: rest.ma_hang.trim().toUpperCase(),
        ten_hang: rest.ten_hang.trim(),
        order_id: orderId
      }));

      const { error: itemsError } = await supabase
        .from('customer_order_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      alert('Đã lưu đơn hàng thành công!');
      await fetchOrders();
      await fetchSuggestions();
      backToList();

    } catch (err) {
      alert('Lỗi khi lưu đơn hàng: ' + err.message);
    } finally {
      setSavingOrder(false);
    }
  };

  // ==========================================================
  // MÀN HÌNH CHI TIẾT: TẠO MỚI / SỬA ĐƠN HÀNG
  // ==========================================================
  if (view === 'detail') {
    return (
      <div className="flex h-screen w-full bg-gray-50">
        {/* Bên trái: xem trước file PO/HĐ gốc */}
        <div className="w-1/2 h-full border-r bg-white flex flex-col">
          <div className="p-3 border-b flex items-center justify-between">
            <span className="text-sm font-semibold">File gốc đơn hàng</span>
            <label className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full cursor-pointer hover:bg-green-100">
              {uploadingFile ? 'Đang tải lên...' : (headerData.file_url ? 'Thay file khác' : '+ Tải lên file')}
              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                onChange={handleFileUpload}
                disabled={uploadingFile}
                className="hidden"
              />
            </label>
          </div>
          <div className="flex-1 overflow-auto">
            {headerData.file_url ? (
              headerData.file_url.match(/\.pdf($|\?)/i) ? (
                <iframe src={headerData.file_url} className="w-full h-full" title="PO Preview" />
              ) : (
                <img src={headerData.file_url} alt="PO gốc" className="w-full h-auto" />
              )
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-400">
                Chưa có file được tải lên
              </div>
            )}
          </div>
        </div>

        {/* Bên phải: form nhập liệu */}
        <div className="w-1/2 h-full p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {currentOrderId === 'new' ? 'Tạo đơn hàng mới' : `Sửa đơn hàng #${headerData.ma_don_hang}`}
            </h2>
            <button onClick={backToList} className="text-red-500 hover:underline text-sm">
              Quay lại danh sách
            </button>
          </div>

          {/* Thông tin chung */}
          <div className="grid grid-cols-2 gap-3 mb-3 bg-white p-4 rounded-lg border shadow-sm">
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
              <label className="block text-xs font-medium mb-1">Loại đơn hàng</label>
              <select
                value={headerData.loai_don_hang}
                onChange={(e) => setHeaderData({ ...headerData, loai_don_hang: e.target.value })}
                className="w-full p-1.5 border rounded text-sm"
              >
                {Object.entries(LOAI_DON_HANG_LABEL).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Mã khách hàng</label>
              <select
                value={headerData.ma_khach_hang}
                onChange={(e) => setHeaderData({ ...headerData, ma_khach_hang: e.target.value })}
                className="w-full p-1.5 border rounded text-sm"
              >
                <option value="">-- Chọn khách hàng --</option>
                {customers.map((c) => (
                  <option key={c.ma_khach_hang} value={c.ma_khach_hang}>
                    {c.ma_khach_hang} — {c.ten_khach_hang}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Trạng thái</label>
              <select
                value={headerData.trang_thai}
                onChange={(e) => setHeaderData({ ...headerData, trang_thai: e.target.value })}
                className="w-full p-1.5 border rounded text-sm"
              >
                {TRANG_THAI_ORDER.map((key) => (
                  <option key={key} value={key}>{TRANG_THAI_LABEL[key]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Ngày đơn hàng</label>
              <input
                type="date"
                value={headerData.ngay_don_hang}
                onChange={(e) => setHeaderData({ ...headerData, ngay_don_hang: e.target.value })}
                className="w-full p-1.5 border rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Ngày yêu cầu giao (nếu có)</label>
              <input
                type="date"
                value={headerData.ngay_yeu_cau_giao || ''}
                onChange={(e) => setHeaderData({ ...headerData, ngay_yeu_cau_giao: e.target.value })}
                className="w-full p-1.5 border rounded text-sm"
              />
            </div>
          </div>

          {/* Bảng chi tiết sản phẩm */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-sm">Chi tiết hàng hoá ({items.length} dòng)</h3>
              <button
                onClick={handleAddItemRow}
                className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
              >
                + Thêm dòng
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-2">
              💡 Nhấn <kbd className="px-1 border rounded bg-gray-100">Enter</kbd> để nhảy sang ô tiếp theo. Ở ô cuối cùng, Enter sẽ tự thêm dòng mới.
            </p>

            <datalist id="suggest-ma-hang-co">
              {suggestions.ma_hang.map((v) => <option key={v} value={v} />)}
            </datalist>
            <datalist id="suggest-ten-hang-co">
              {suggestions.ten_hang.map((v) => <option key={v} value={v} />)}
            </datalist>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="p-3 bg-white border rounded-lg shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500">Dòng #{index + 1}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">
                        Thành tiền: <b>{formatVND(tinhThanhTien(item))}</b>
                      </span>
                      {items.length > 1 && (
                        <button onClick={() => handleRemoveItemRow(index)} className="text-red-500 text-xs hover:underline">
                          Xoá dòng
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      ref={setInputRef(index, 'ma_hang')}
                      type="text"
                      list="suggest-ma-hang-co"
                      placeholder="Mã hàng (dùng để mapping toàn hệ thống)"
                      value={item.ma_hang}
                      onChange={(e) => handleItemChange(index, 'ma_hang', e.target.value)}
                      onBlur={(e) => handleMaHangBlur(index, e.target.value)}
                      onKeyDown={(e) => handleItemKeyDown(e, index, 'ma_hang')}
                      className="p-1.5 border rounded text-xs font-mono"
                    />
                    <input
                      ref={setInputRef(index, 'ten_hang')}
                      type="text"
                      list="suggest-ten-hang-co"
                      placeholder="Tên hàng"
                      value={item.ten_hang}
                      onChange={(e) => handleItemChange(index, 'ten_hang', e.target.value)}
                      onKeyDown={(e) => handleItemKeyDown(e, index, 'ten_hang')}
                      className="p-1.5 border rounded text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">Số lượng đặt</label>
                      <input
                        ref={setInputRef(index, 'so_luong')}
                        type="number"
                        value={item.so_luong}
                        onChange={(e) => handleItemChange(index, 'so_luong', parseFloat(e.target.value) || 0)}
                        onKeyDown={(e) => handleItemKeyDown(e, index, 'so_luong')}
                        className="w-full p-1.5 border rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">Đơn giá (VND)</label>
                      <input
                        ref={setInputRef(index, 'don_gia')}
                        type="number"
                        value={item.don_gia}
                        onChange={(e) => handleItemChange(index, 'don_gia', parseFloat(e.target.value) || 0)}
                        onKeyDown={(e) => handleItemKeyDown(e, index, 'don_gia')}
                        className="w-full p-1.5 border rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">Thuế suất</label>
                      <select
                        ref={setInputRef(index, 'thue_suat')}
                        value={item.thue_suat}
                        onChange={(e) => handleItemChange(index, 'thue_suat', parseFloat(e.target.value))}
                        onKeyDown={(e) => handleItemKeyDown(e, index, 'thue_suat')}
                        className="w-full p-1.5 border rounded text-xs"
                      >
                        <option value={0}>0%</option>
                        <option value={8}>8%</option>
                        <option value={10}>10%</option>
                      </select>
                    </div>
                  </div>

                  {/* Giao hàng/nhập kho từng phần */}
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">SL đã xuống SX</label>
                      <input
                        ref={setInputRef(index, 'so_luong_da_xuong_sx')}
                        type="number"
                        value={item.so_luong_da_xuong_sx}
                        onChange={(e) => handleItemChange(index, 'so_luong_da_xuong_sx', parseFloat(e.target.value) || 0)}
                        onKeyDown={(e) => handleItemKeyDown(e, index, 'so_luong_da_xuong_sx')}
                        className="w-full p-1.5 border rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">SL đã nhập kho</label>
                      <input
                        ref={setInputRef(index, 'so_luong_da_nhap_kho')}
                        type="number"
                        value={item.so_luong_da_nhap_kho}
                        onChange={(e) => handleItemChange(index, 'so_luong_da_nhap_kho', parseFloat(e.target.value) || 0)}
                        onKeyDown={(e) => handleItemKeyDown(e, index, 'so_luong_da_nhap_kho')}
                        className="w-full p-1.5 border rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">SL đã giao khách</label>
                      <input
                        ref={setInputRef(index, 'so_luong_da_giao')}
                        type="number"
                        value={item.so_luong_da_giao}
                        onChange={(e) => handleItemChange(index, 'so_luong_da_giao', parseFloat(e.target.value) || 0)}
                        onKeyDown={(e) => handleItemKeyDown(e, index, 'so_luong_da_giao')}
                        className="w-full p-1.5 border rounded text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-right mt-3 text-sm">
              Tổng giá trị đơn: <b className="text-blue-700">{formatVND(tongGiaTriDon)}</b>
            </div>
          </div>

          <button
            onClick={handleSaveOrder}
            disabled={savingOrder}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 text-sm shadow disabled:opacity-50"
          >
            {savingOrder ? 'Đang lưu...' : 'LƯU ĐƠN HÀNG'}
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // MÀN HÌNH DANH SÁCH (trang chủ của module)
  // ==========================================================
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản Lý Đơn Đặt Hàng Khách</h1>
        <button
          onClick={openNewOrder}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
        >
          + Tạo đơn mới
        </button>
      </div>

      {/* ========================================== */}
      {/* CẢNH BÁO */}
      {/* ========================================== */}
      {(canhBaoGiaoCham.length > 0 || canhBaoChuaXuongSX.length > 0) && (
        <div className="mb-6 space-y-2">
          {canhBaoGiaoCham.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm font-bold text-red-700 mb-1">
                ⚠️ {canhBaoGiaoCham.length} đơn hàng đã trễ hạn giao:
              </p>
              <div className="flex flex-wrap gap-2">
                {canhBaoGiaoCham.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => openOrder(o)}
                    className="text-xs bg-white border border-red-300 text-red-700 px-2 py-1 rounded hover:bg-red-100"
                  >
                    {o.ma_don_hang} ({o.ma_khach_hang}) — hạn {o.ngay_yeu_cau_giao}
                  </button>
                ))}
              </div>
            </div>
          )}

          {canhBaoChuaXuongSX.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm font-bold text-yellow-700 mb-1">
                ⏳ {canhBaoChuaXuongSX.length} đơn hàng quá {SO_NGAY_CANH_BAO_CHUA_XUONG_SX} ngày chưa xuống đơn sản xuất:
              </p>
              <div className="flex flex-wrap gap-2">
                {canhBaoChuaXuongSX.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => openOrder(o)}
                    className="text-xs bg-white border border-yellow-300 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-100"
                  >
                    {o.ma_don_hang} ({o.ma_khach_hang}) — nhận {soNgayTu(o.created_at)} ngày trước
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* BỘ LỌC */}
      {/* ========================================== */}
      <div className="flex gap-3 mb-4">
        <select
          value={filterMaKhachHang}
          onChange={(e) => setFilterMaKhachHang(e.target.value)}
          className="p-2 border rounded text-sm"
        >
          <option value="">-- Tất cả khách hàng --</option>
          {customers.map((c) => (
            <option key={c.ma_khach_hang} value={c.ma_khach_hang}>
              {c.ma_khach_hang} — {c.ten_khach_hang}
            </option>
          ))}
        </select>

        <select
          value={filterLoaiDonHang}
          onChange={(e) => setFilterLoaiDonHang(e.target.value)}
          className="p-2 border rounded text-sm"
        >
          <option value="">-- Tất cả loại đơn --</option>
          {Object.entries(LOAI_DON_HANG_LABEL).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* ========================================== */}
      {/* BẢNG DANH SÁCH */}
      {/* ========================================== */}
      <div className="bg-white shadow rounded-lg overflow-hidden border">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b text-sm text-gray-700">
              <th className="p-3">Mã đơn hàng</th>
              <th className="p-3">Loại đơn</th>
              <th className="p-3">Mã khách hàng</th>
              <th className="p-3">Ngày đơn hàng</th>
              <th className="p-3">Hạn giao</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3">Số dòng hàng</th>
            </tr>
          </thead>
          <tbody>
            {loadingList ? (
              <tr><td colSpan={7} className="text-center p-6 text-gray-500">Đang tải...</td></tr>
            ) : filteredOrders.length === 0 ? (
              <tr><td colSpan={7} className="text-center p-6 text-gray-500">Chưa có đơn hàng nào.</td></tr>
            ) : (
              filteredOrders.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => openOrder(o)}
                  className="border-b hover:bg-gray-50 text-sm cursor-pointer"
                >
                  <td className="p-3 font-semibold">{o.ma_don_hang}</td>
                  <td className="p-3">{LOAI_DON_HANG_LABEL[o.loai_don_hang]}</td>
                  <td className="p-3">{o.ma_khach_hang}</td>
                  <td className="p-3">{o.ngay_don_hang}</td>
                  <td className="p-3">{o.ngay_yeu_cau_giao || '—'}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${TRANG_THAI_COLOR[o.trang_thai]}`}>
                      {TRANG_THAI_LABEL[o.trang_thai]}
                    </span>
                  </td>
                  <td className="p-3">{(o.customer_order_items || []).length}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
