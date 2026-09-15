import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

const TINH_TRANG_LABEL = {
  moi_100: 'Mới 100%',
  da_sua_chua_hoan_tat: 'Đã sửa chữa hoàn tất',
};

const emptyItem = () => ({
  so_po: '',
  po_order_id: null,
  po_item_id: null,
  ngay_po: '',
  ma_hang: '',
  ten_hang: '',
  dvt: '',
  so_luong: 1,
  tinh_trang: 'moi_100',
});

export default function DeliveryNotesPage() {
  const [view, setView] = useState('list'); // 'list' | 'detail'
  const [notes, setNotes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const [filterTen, setFilterTen] = useState('');
  const [filterNgay, setFilterNgay] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCustomerCode, setNewCustomerCode] = useState('');
  const [creating, setCreating] = useState(false);

  const [currentNoteId, setCurrentNoteId] = useState(null);
  const [headerData, setHeaderData] = useState(null);
  const [items, setItems] = useState([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const [xuatKhoDangXuLy, setXuatKhoDangXuLy] = useState(false);

  // PO của khách hàng hiện tại trong biên bản (kèm items) — dùng cho dropdown chọn PO/mã hàng
  const [customerPOs, setCustomerPOs] = useState([]);
  // Tồn kho gộp theo mã hàng — dùng cho autocomplete khi KHÔNG chọn PO
  const [inventoryStock, setInventoryStock] = useState([]);

  const fetchNotes = async () => {
    setLoadingList(true);
    const { data, error } = await supabase
      .from('delivery_notes')
      .select('*, delivery_note_items(*)')
      .eq('trang_thai', 'nhap')
      .order('id', { ascending: false });
    if (!error && data) setNotes(data);
    setLoadingList(false);
  };

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('customer_code, customer_name, address, tax_code, representative, phone')
      .order('customer_code', { ascending: true });
    if (!error && data) setCustomers(data);
  };

  const fetchInventoryStock = async () => {
    const { data, error } = await supabase
      .from('inventory_import')
      .select('product_code, product_name, quantity, so_luong_da_giao, export_unit');
    if (error || !data) return;

    const map = new Map();
    data.forEach((row) => {
      const ma = (row.product_code || '').trim().toUpperCase();
      if (!ma) return;
      const khaDung = (row.quantity || 0) - (row.so_luong_da_giao || 0);
      if (!map.has(ma)) {
        map.set(ma, { ma_hang: ma, ten_hang: row.product_name || '', dvt: row.export_unit || '', ton_kha_dung: 0 });
      }
      map.get(ma).ton_kha_dung += khaDung;
    });
    setInventoryStock(Array.from(map.values()).sort((a, b) => a.ma_hang.localeCompare(b.ma_hang)));
  };

  useEffect(() => {
    fetchNotes();
    fetchCustomers();
    fetchInventoryStock();
  }, []);

  // Nạp danh sách PO (kèm items) của khách hàng đang mở trong biên bản
  const fetchCustomerPOs = async (maKhachHang) => {
    if (!maKhachHang) {
      setCustomerPOs([]);
      return;
    }
    const { data, error } = await supabase
      .from('customer_orders')
      .select('*, customer_order_items(*)')
      .eq('ma_khach_hang', maKhachHang)
      .neq('trang_thai', 'po_closed')
      .order('id', { ascending: false });
    if (!error && data) setCustomerPOs(data);
  };

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      if (filterTen && !(n.ten_khach_hang || '').toLowerCase().includes(filterTen.toLowerCase())) return false;
      if (filterNgay && n.ngay_tao !== filterNgay) return false;
      return true;
    });
  }, [notes, filterTen, filterNgay]);

  // ==========================================
  // TẠO MỚI BIÊN BẢN (popup -> Tạo phiếu giao hàng)
  // ==========================================
  const handleCreateNote = async () => {
    const customer = customers.find((c) => c.customer_code === newCustomerCode);
    if (!customer) {
      alert('Vui lòng chọn khách hàng.');
      return;
    }

    setCreating(true);
    const { data, error } = await supabase
      .from('delivery_notes')
      .insert([{
        ma_khach_hang: customer.customer_code,
        ten_khach_hang: customer.customer_name,
        mst: customer.tax_code || '',
        dia_chi: customer.address || '',
        nguoi_dai_dien: customer.representative || '',
        chuc_vu: '',
        so_dien_thoai: customer.phone || '',
        trang_thai: 'nhap',
      }])
      .select()
      .single();

    setCreating(false);

    if (error) {
      alert('Lỗi khi tạo phiếu: ' + error.message);
      return;
    }

    setShowCreateModal(false);
    setNewCustomerCode('');
    openNote(data);
  };

  // ==========================================
  // MỞ 1 BIÊN BẢN ĐỂ SỬA/XEM
  // ==========================================
  const openNote = async (note) => {
    setHeaderData({
      ma_khach_hang: note.ma_khach_hang || '',
      ten_khach_hang: note.ten_khach_hang || '',
      mst: note.mst || '',
      dia_chi: note.dia_chi || '',
      nguoi_dai_dien: note.nguoi_dai_dien || '',
      chuc_vu: note.chuc_vu || '',
      so_dien_thoai: note.so_dien_thoai || '',
    });

    const noteItems = (note.delivery_note_items || []).length > 0
      ? note.delivery_note_items.map((it) => ({
          so_po: it.so_po || '',
          po_order_id: it.po_order_id || null,
          po_item_id: it.po_item_id || null,
          ngay_po: it.ngay_po || '',
          ma_hang: it.ma_hang || '',
          ten_hang: it.ten_hang || '',
          dvt: it.dvt || '',
          so_luong: it.so_luong || 0,
          tinh_trang: it.tinh_trang || 'moi_100',
        }))
      : [emptyItem()];

    setItems(noteItems);
    setCurrentNoteId(note.id);
    await fetchCustomerPOs(note.ma_khach_hang);
    setView('detail');
  };

  const backToList = () => {
    setView('list');
    setCurrentNoteId(null);
    setHeaderData(null);
    fetchNotes();
  };

  // ==========================================
  // THAO TÁC DÒNG HÀNG
  // ==========================================
  const handleAddItemRow = () => setItems((prev) => [...prev, emptyItem()]);
  const handleRemoveItemRow = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  // Chọn 1 PO cho dòng hàng -> reset lựa chọn mã hàng của dòng đó (chờ chọn lại theo PO mới)
  const handleChonPO = (index, orderId) => {
    const po = customerPOs.find((p) => String(p.id) === String(orderId));
    setItems((prev) => {
      const newItems = [...prev];
      newItems[index] = {
        ...newItems[index],
        po_order_id: po ? po.id : null,
        so_po: po ? po.ma_don_hang : '',
        ngay_po: po ? po.ngay_don_hang : '',
        po_item_id: null,
        ma_hang: '',
        ten_hang: '',
      };
      return newItems;
    });
  };

  // Chọn mã hàng THUỘC PO đã chọn -> tự điền tên hàng + gợi ý số lượng còn thiếu
  const handleChonMaHangTheoPO = (index, poItemId) => {
    const item = items[index];
    const po = customerPOs.find((p) => p.id === item.po_order_id);
    const poItem = po?.customer_order_items?.find((it) => String(it.id) === String(poItemId));
    if (!poItem) return;

    const conLai = Math.max((poItem.so_luong || 0) - (poItem.so_luong_da_giao || 0), 0);

    setItems((prev) => {
      const newItems = [...prev];
      newItems[index] = {
        ...newItems[index],
        po_item_id: poItem.id,
        ma_hang: poItem.ma_hang,
        ten_hang: poItem.ten_hang,
        so_luong: conLai > 0 ? conLai : newItems[index].so_luong,
      };
      return newItems;
    });
  };

  // Chọn mã hàng TỰ DO từ tồn kho (khi không chọn PO)
  const handleChonMaHangTuTonKho = (index, maHang) => {
    const stock = inventoryStock.find((s) => s.ma_hang === maHang);
    setItems((prev) => {
      const newItems = [...prev];
      newItems[index] = {
        ...newItems[index],
        ma_hang: maHang,
        ten_hang: stock?.ten_hang || newItems[index].ten_hang,
        dvt: stock?.dvt || newItems[index].dvt,
      };
      return newItems;
    });
  };

  // ==========================================
  // LƯU (giữ nguyên trạng thái nháp)
  // ==========================================
  const saveNote = async () => {
    if (!headerData.ten_khach_hang) {
      alert('Thiếu tên khách hàng.');
      return false;
    }

    const { error: updateError } = await supabase
      .from('delivery_notes')
      .update(headerData)
      .eq('id', currentNoteId);

    if (updateError) {
      alert('Lỗi khi lưu: ' + updateError.message);
      return false;
    }

    const { error: deleteError } = await supabase
      .from('delivery_note_items')
      .delete()
      .eq('delivery_note_id', currentNoteId);

    if (deleteError) {
      alert('Lỗi khi lưu chi tiết hàng hoá: ' + deleteError.message);
      return false;
    }

    const validItems = items.filter((it) => it.ten_hang.trim());
    if (validItems.length > 0) {
      const { error: insertError } = await supabase
        .from('delivery_note_items')
        .insert(validItems.map((it) => ({ ...it, delivery_note_id: currentNoteId })));

      if (insertError) {
        alert('Lỗi khi lưu chi tiết hàng hoá: ' + insertError.message);
        return false;
      }
    }

    return true;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    const ok = await saveNote();
    setSaving(false);
    if (ok) {
      alert('Đã lưu đơn hàng (dạng nháp)!');
      backToList();
    }
  };

  // ==========================================
  // XUẤT KHO VÀ IN
  // ==========================================
  const handleXuatKhoVaIn = async () => {
    const validItems = items.filter((it) => it.ten_hang.trim());
    if (validItems.length === 0) {
      alert('Cần ít nhất 1 dòng hàng hoá.');
      return;
    }

    if (!confirm('Xác nhận xuất kho? Số lượng sẽ được trừ vào tồn kho và không thể hoàn tác tự động.')) {
      return;
    }

    setXuatKhoDangXuLy(true);
    try {
      const ok = await saveNote();
      if (!ok) return;

      // ---------- TRỪ TỒN KHO THEO MÃ HÀNG (qua nhiều lô nếu cần) ----------
      const thieuHangCanhBao = [];

      for (const item of validItems) {
        if (!item.ma_hang) continue;
        let conLaiCanTru = Number(item.so_luong) || 0;

        const { data: lots, error: lotsError } = await supabase
          .from('inventory_import')
          .select('id, quantity, so_luong_da_giao')
          .eq('product_code', item.ma_hang.trim().toUpperCase())
          .order('id', { ascending: true });

        if (lotsError || !lots) continue;

        for (const lot of lots) {
          if (conLaiCanTru <= 0) break;
          const khaDung = (lot.quantity || 0) - (lot.so_luong_da_giao || 0);
          if (khaDung <= 0) continue;
          const tru = Math.min(khaDung, conLaiCanTru);

          await supabase
            .from('inventory_import')
            .update({ so_luong_da_giao: (lot.so_luong_da_giao || 0) + tru })
            .eq('id', lot.id);

          conLaiCanTru -= tru;
        }

        if (conLaiCanTru > 0) {
          thieuHangCanhBao.push(`${item.ma_hang} (thiếu ${conLaiCanTru})`);
        }
      }

      // ---------- CẬP NHẬT SỐ LƯỢNG ĐÃ GIAO BÊN PO + TỰ CHUYỂN TRẠNG THÁI PO ----------
      const poOrderIdsDaCham = new Set();

      for (const item of validItems) {
        if (!item.po_item_id) continue;

        const { data: poItemData } = await supabase
          .from('customer_order_items')
          .select('so_luong_da_giao, order_id')
          .eq('id', item.po_item_id)
          .single();

        if (!poItemData) continue;

        await supabase
          .from('customer_order_items')
          .update({ so_luong_da_giao: (poItemData.so_luong_da_giao || 0) + (Number(item.so_luong) || 0) })
          .eq('id', item.po_item_id);

        poOrderIdsDaCham.add(poItemData.order_id);
      }

      for (const orderId of poOrderIdsDaCham) {
        const { data: allItems } = await supabase
          .from('customer_order_items')
          .select('so_luong, so_luong_da_giao')
          .eq('order_id', orderId);

        const daGiaoDuTatCa = allItems && allItems.length > 0 &&
          allItems.every((it) => (it.so_luong_da_giao || 0) >= (it.so_luong || 0));

        if (daGiaoDuTatCa) {
          await supabase
            .from('customer_orders')
            .update({ trang_thai: 'da_giao_hang' })
            .eq('id', orderId);

          await supabase.from('customer_order_status_history').insert([{
            order_id: orderId,
            trang_thai: 'da_giao_hang',
            ghi_chu: 'Tự động cập nhật do đã giao đủ số lượng qua Biên bản giao hàng',
          }]);
        }
      }

      // ---------- SINH PDF ----------
      const res = await fetch('/api/generate-delivery-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryNoteId: currentNoteId }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Lỗi khi tạo PDF.');
      }

      await supabase
        .from('delivery_notes')
        .update({ trang_thai: 'da_xuat_kho', file_url: result.file_url })
        .eq('id', currentNoteId);

      window.open(result.file_url, '_blank');

      alert(
        thieuHangCanhBao.length > 0
          ? `Đã xuất kho thành công!\n\n⚠️ Cảnh báo: các mã hàng sau vượt quá tồn kho hiện có:\n${thieuHangCanhBao.join('\n')}`
          : 'Đã xuất kho và tạo phiếu giao hàng thành công!'
      );

      backToList();
      fetchInventoryStock();

    } catch (err) {
      alert('Lỗi khi xuất kho: ' + err.message);
    } finally {
      setXuatKhoDangXuLy(false);
    }
  };

  // ==========================================================
  // MÀN HÌNH CHI TIẾT
  // ==========================================================
  if (view === 'detail' && headerData) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Biên bản giao hàng</h2>
          <button onClick={backToList} className="text-red-500 hover:underline text-sm">Quay lại danh sách</button>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm mb-4">
          <h3 className="font-bold text-sm mb-3">Thông tin Bên B (khách hàng)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Tên khách hàng</label>
              <input type="text" value={headerData.ten_khach_hang} onChange={(e) => setHeaderData({ ...headerData, ten_khach_hang: e.target.value })} className="w-full p-1.5 border rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">MST</label>
              <input type="text" value={headerData.mst} onChange={(e) => setHeaderData({ ...headerData, mst: e.target.value })} className="w-full p-1.5 border rounded text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1">Địa chỉ</label>
              <input type="text" value={headerData.dia_chi} onChange={(e) => setHeaderData({ ...headerData, dia_chi: e.target.value })} className="w-full p-1.5 border rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Người đại diện</label>
              <input type="text" value={headerData.nguoi_dai_dien} onChange={(e) => setHeaderData({ ...headerData, nguoi_dai_dien: e.target.value })} className="w-full p-1.5 border rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Chức vụ (không bắt buộc)</label>
              <input type="text" value={headerData.chuc_vu} onChange={(e) => setHeaderData({ ...headerData, chuc_vu: e.target.value })} className="w-full p-1.5 border rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Số điện thoại</label>
              <input type="text" value={headerData.so_dien_thoai} onChange={(e) => setHeaderData({ ...headerData, so_dien_thoai: e.target.value })} className="w-full p-1.5 border rounded text-sm" />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-sm">Danh mục hàng hoá ({items.length} dòng)</h3>
            <button onClick={handleAddItemRow} className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700">+ Thêm dòng</button>
          </div>

          <datalist id="suggest-ton-kho">
            {inventoryStock.map((s) => <option key={s.ma_hang} value={s.ma_hang}>{`Tồn: ${s.ton_kha_dung}`}</option>)}
          </datalist>

          <div className="space-y-3">
            {items.map((item, index) => {
              const po = customerPOs.find((p) => p.id === item.po_order_id);
              return (
                <div key={index} className="p-3 bg-white border rounded-lg shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500">Dòng #{index + 1}</span>
                    {items.length > 1 && (
                      <button onClick={() => handleRemoveItemRow(index)} className="text-red-500 text-xs hover:underline">Xoá dòng</button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">Số PO (không bắt buộc)</label>
                      <select value={item.po_order_id || ''} onChange={(e) => handleChonPO(index, e.target.value)} className="w-full p-1.5 border rounded text-xs">
                        <option value="">-- Không theo PO (hàng tồn kho/thủ công) --</option>
                        {customerPOs.map((p) => (
                          <option key={p.id} value={p.id}>{p.ma_don_hang} ({p.ngay_don_hang})</option>
                        ))}
                      </select>
                    </div>

                    {item.po_order_id ? (
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-0.5">Mã hàng (theo PO)</label>
                        <select value={item.po_item_id || ''} onChange={(e) => handleChonMaHangTheoPO(index, e.target.value)} className="w-full p-1.5 border rounded text-xs">
                          <option value="">-- Chọn mã hàng --</option>
                          {po?.customer_order_items?.map((it) => (
                            <option key={it.id} value={it.id}>
                              {it.ma_hang} — {it.ten_hang} (còn {Math.max((it.so_luong || 0) - (it.so_luong_da_giao || 0), 0)})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-0.5">Mã hàng (tìm trong tồn kho)</label>
                        <input
                          type="text"
                          list="suggest-ton-kho"
                          value={item.ma_hang}
                          onChange={(e) => handleChonMaHangTuTonKho(index, e.target.value)}
                          className="w-full p-1.5 border rounded text-xs"
                          placeholder="Gõ mã hàng..."
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[10px] text-gray-400 mb-0.5">Tên hàng</label>
                      <input type="text" value={item.ten_hang} onChange={(e) => handleItemChange(index, 'ten_hang', e.target.value)} className="w-full p-1.5 border rounded text-xs" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">ĐVT</label>
                      <input type="text" value={item.dvt} onChange={(e) => handleItemChange(index, 'dvt', e.target.value)} className="w-full p-1.5 border rounded text-xs" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">Số lượng</label>
                      <input type="number" value={item.so_luong} onChange={(e) => handleItemChange(index, 'so_luong', parseFloat(e.target.value) || 0)} className="w-full p-1.5 border rounded text-xs" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Tình trạng</label>
                    <select value={item.tinh_trang} onChange={(e) => handleItemChange(index, 'tinh_trang', e.target.value)} className="w-full p-1.5 border rounded text-xs">
                      {Object.entries(TINH_TRANG_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handleSaveDraft} disabled={saving || xuatKhoDangXuLy} className="flex-1 bg-gray-600 text-white py-2.5 rounded-lg font-bold hover:bg-gray-700 text-sm shadow disabled:opacity-50">
            {saving ? 'Đang lưu...' : 'LƯU ĐƠN HÀNG'}
          </button>
          <button onClick={handleXuatKhoVaIn} disabled={saving || xuatKhoDangXuLy} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 text-sm shadow disabled:opacity-50">
            {xuatKhoDangXuLy ? 'Đang xử lý...' : 'XUẤT KHO VÀ IN'}
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // TRANG CHỦ — DANH SÁCH NHÁP
  // ==========================================================
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Biên Bản Giao Hàng</h1>
        <button onClick={() => setShowCreateModal(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium">
          + Tạo mới đơn giao hàng
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <input type="text" placeholder="Lọc theo tên khách hàng..." value={filterTen} onChange={(e) => setFilterTen(e.target.value)} className="p-2 border rounded text-sm flex-1" />
        <input type="date" value={filterNgay} onChange={(e) => setFilterNgay(e.target.value)} className="p-2 border rounded text-sm" />
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b text-sm text-gray-700">
              <th className="p-3">Ngày tạo</th>
              <th className="p-3">Khách hàng</th>
              <th className="p-3">Số dòng hàng</th>
              <th className="p-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loadingList ? (
              <tr><td colSpan={4} className="text-center p-6 text-gray-500">Đang tải...</td></tr>
            ) : filteredNotes.length === 0 ? (
              <tr><td colSpan={4} className="text-center p-6 text-gray-500">Chưa có bản nháp nào.</td></tr>
            ) : (
              filteredNotes.map((n) => (
                <tr key={n.id} className="border-b hover:bg-gray-50 text-sm">
                  <td className="p-3">{n.ngay_tao}</td>
                  <td className="p-3 font-semibold">{n.ten_khach_hang}</td>
                  <td className="p-3">{(n.delivery_note_items || []).length}</td>
                  <td className="p-3">
                    <button onClick={() => openNote(n)} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100">✏️ Sửa/Xem</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[420px] shadow-lg">
            <h3 className="text-lg font-bold mb-4">Tạo mới đơn giao hàng</h3>
            <label className="block text-xs font-medium mb-1">Chọn khách hàng</label>
            <select value={newCustomerCode} onChange={(e) => setNewCustomerCode(e.target.value)} className="w-full p-2 border rounded text-sm mb-4">
              <option value="">-- Chọn khách hàng --</option>
              {customers.map((c) => (
                <option key={c.customer_code} value={c.customer_code}>{c.customer_code} — {c.customer_name}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm">Đóng</button>
              <button onClick={handleCreateNote} disabled={creating} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-50">
                {creating ? 'Đang tạo...' : 'Tạo phiếu giao hàng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
