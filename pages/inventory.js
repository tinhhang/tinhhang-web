import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Inventory({ lang }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const t = {
    VN: {
      title: 'Quản Lý Nhập & Tồn Kho',
      code: 'Mã Sản Phẩm',
      name: 'Tên Sản Phẩm / Quy Cách',
      unit: 'ĐVT',
      stock: 'Số Lượng Tồn Kho',
      status: 'Trạng Thái',
      empty: 'Chưa có dữ liệu tồn kho.',
      inStock: 'Còn hàng',
      lowStock: 'Sắp hết hàng',
    },
    CN: {
      title: '入库与库存管理',
      code: '产品编号',
      name: '产品名称 / 规格',
      unit: '单位',
      stock: '库存数量',
      status: '状态',
      empty: '暂无库存数据。',
      inStock: '有货',
      lowStock: '库存紧张',
    }
  }[lang || 'VN'];

  useEffect(() => {
    async function fetchInventory() {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('inventory').select('*');
        if (error) throw error;
        setItems(data || []);
      } catch (err) {
        console.error('Lỗi lấy dữ liệu tồn kho:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchInventory();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{t.title}</h1>

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
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  {t.empty}
                </td>
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
    </div>
  );
}
