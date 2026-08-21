import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';

export default function Inventory({ lang }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ code: '', name: '', unit: 'Bộ', quantity: 0 });

  const t = {
    VN: {
      title: 'Quản Lý Nhập & Tồn Kho',
      addManual: '+ Nhập Tay',
      importExcel: '📥 Import Excel',
      code: 'Mã Sản Phẩm',
      name: 'Tên Sản Phẩm / Quy Cách',
      unit: 'ĐVT',
      stock: 'Số Lượng Tồn Kho',
      status: 'Trạng Thái',
      empty: 'Chưa có dữ liệu tồn kho.',
      inStock: 'Còn hàng',
      lowStock: 'Sắp hết hàng',
      modalTitle: 'Thêm Hàng Vừa Nhập Kho',
      save: 'Lưu Nhập Kho',
      cancel: 'Hủy'
    },
    CN: {
      title: '入库与库存管理',
      addManual: '+ 手动录入',
      importExcel: '📥 导入 Excel',
      code: '产品编号',
      name: '产品名称 / 规格',
      unit: '单位',
      stock: '库存数量',
      status: '状态',
      empty: '暂无库存数据。',
      inStock: '有货',
      lowStock: '库存紧张',
      modalTitle: '新增入库产品',
      save: '保存入库',
      cancel: '取消'
    }
  }[lang || 'VN'];

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('inventory').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        setItems(data);
      }
    } catch (err) {
      console.error('Lỗi lấy dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  }

  // Xử lý đọc file Excel chuẩn xác theo thứ tự Cột
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // Đọc dữ liệu dạng mảng 2 chiều [[hàng 1], [hàng 2], ...]
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const parsedItems = [];

        // Lặp qua từng hàng để lọc ra dữ liệu thật
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          // Tìm xem hàng nào có mô tả/tên sản phẩm dài (dữ liệu thật)
          const nameIdx = row.findIndex(cell => typeof cell === 'string' && cell.length > 10 && !cell.includes('Mã') && !cell.includes('STT'));
          
          if (nameIdx !== -1) {
            const name = row[nameIdx];
            const code = row[nameIdx - 1] || row[0] || '';
            const unit = row[nameIdx + 1] || 'Bộ';
            let qty = Number(row[nameIdx + 2] || row[row.length - 1] || 1);
            if (isNaN(qty)) qty = 1;

            parsedItems.push({
              code: String(code).trim(),
              name: String(name).trim(),
              unit: String(unit).trim(),
              quantity: qty
            });
          }
        }

        if (parsedItems.length === 0) {
          alert('Không tìm thấy dòng dữ liệu phù hợp trong file Excel!');
          return;
        }

        setItems(parsedItems);
        await supabase.from('inventory').insert(parsedItems);
        alert(`Import thành công ${parsedItems.length} sản phẩm!`);
      } catch (err) {
        console.error('Lỗi đọc file Excel:', err);
        alert('Có lỗi xảy ra khi đọc file Excel!');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAddManual = async (e) => {
    e.preventDefault();
    try {
      await supabase.from('inventory').insert([formData]);
    } catch (err) {
      console.log('Chưa lưu Supabase, lưu tạm giao diện');
    }
    setItems([formData, ...items]);
    setShowModal(false);
    setFormData({ code: '', name: '', unit: 'Bộ', quantity: 0 });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">{t.title}</h1>
        
        <div className="flex items-center gap-3">
          <label className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium shadow cursor-pointer text-sm flex items-center gap-2">
            {t.importExcel}
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow text-sm"
          >
            {t.addManual}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
          <thead className="bg-gray-100 font-semibold text-gray-700">
            <tr>
              <th className="px-6 py-3">{t.code}</th>
              <th className="px-6 py-3">{t.name}</th>
              <th className="px-6 py-3">{t.unit}</th>
              <th className="px-6 py-3">{t.stock}</th>
              <th className="px-6 py-3">{t.status}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">Đang tải dữ liệu...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">{t.empty}</td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.code}</td>
                  <td className="px-6 py-4">{item.name}</td>
                  <td className="px-6 py-4">{item.unit}</td>
                  <td className="px-6 py-4 font-semibold">{item.quantity}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.quantity > 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.quantity > 10 ? t.inStock : t.lowStock}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-800">{t.modalTitle}</h2>
            <form onSubmit={handleAddManual} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Mã sản phẩm</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-md"
                  placeholder="VD: TV-35MM"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên sản phẩm / Quy cách</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-md"
                  placeholder="VD: Bộ Trục Vít 35mm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Đơn vị tính</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="mt-1 w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Số lượng</label>
                  <input
                    type="number"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="mt-1 w-full p-2 border rounded-md"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
