import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function DeliveryHistoryPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterTen, setFilterTen] = useState('');
  const [filterTuNgay, setFilterTuNgay] = useState('');
  const [filterDenNgay, setFilterDenNgay] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('delivery_notes')
      .select('*, delivery_note_items(*)')
      .eq('trang_thai', 'da_xuat_kho')
      .order('id', { ascending: false });
    if (!error && data) setNotes(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      if (filterTen && !(n.ten_khach_hang || '').toLowerCase().includes(filterTen.toLowerCase())) return false;
      if (filterTuNgay && n.ngay_tao < filterTuNgay) return false;
      if (filterDenNgay && n.ngay_tao > filterDenNgay) return false;
      return true;
    });
  }, [notes, filterTen, filterTuNgay, filterDenNgay]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lịch Sử Giao Hàng</h1>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Lọc theo tên khách hàng..."
          value={filterTen}
          onChange={(e) => setFilterTen(e.target.value)}
          className="p-2 border rounded text-sm flex-1 min-w-[200px]"
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Từ ngày</label>
          <input type="date" value={filterTuNgay} onChange={(e) => setFilterTuNgay(e.target.value)} className="p-2 border rounded text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Đến ngày</label>
          <input type="date" value={filterDenNgay} onChange={(e) => setFilterDenNgay(e.target.value)} className="p-2 border rounded text-sm" />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-x-auto border">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-100 border-b text-sm text-gray-700">
              <th className="p-3">Ngày tạo</th>
              <th className="p-3">Khách hàng</th>
              <th className="p-3">MST</th>
              <th className="p-3">Số dòng hàng</th>
              <th className="p-3">Danh mục hàng hoá</th>
              <th className="p-3">File PDF</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center p-6 text-gray-500">Đang tải...</td></tr>
            ) : filteredNotes.length === 0 ? (
              <tr><td colSpan={6} className="text-center p-6 text-gray-500">Chưa có biên bản nào đã xuất kho.</td></tr>
            ) : (
              filteredNotes.map((n) => {
                const noteItems = n.delivery_note_items || [];
                return (
                  <tr key={n.id} className="border-b hover:bg-gray-50 text-sm align-top">
                    <td className="p-3">{n.ngay_tao}</td>
                    <td className="p-3 font-semibold">{n.ten_khach_hang}</td>
                    <td className="p-3">{n.mst || '—'}</td>
                    <td className="p-3">{noteItems.length}</td>
                    <td className="p-3">
                      <div className="flex flex-col gap-0.5 max-w-md whitespace-normal">
                        {noteItems.map((it, idx) => (
                          <span key={idx} className="text-xs text-gray-600">
                            {it.ma_hang ? `[${it.ma_hang}] ` : ''}{it.ten_hang} — SL: {it.so_luong} {it.dvt}
                            {it.so_po ? ` (PO: ${it.so_po})` : ''}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      {n.file_url ? (
                        <a href={n.file_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                          Xem PDF
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
