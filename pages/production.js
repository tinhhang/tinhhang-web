import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ProductionOrders({ lang }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const t = {
    VN: { title: 'Đơn Sản Xuất ', code: 'Mã Đơn SX', product: 'Sản Phẩm', qty: 'Số Lượng', docStatus: 'Trạng Thái Chứng Từ', empty: 'Chưa có đơn sản xuất nào.' },
    CN: { title: '生产单 ', code: '生产单号', product: '产品', qty: '数量', docStatus: '单据状态', empty: '暂无生产单。' }
  }[lang || 'VN'];

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('production_orders').select('*');
        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{t.title}</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
          <thead className="bg-gray-100 font-semibold text-gray-700">
            <tr>
              <th className="px-6 py-3">{t.code}</th>
              <th className="px-6 py-3">{t.product}</th>
              <th className="px-6 py-3">{t.qty}</th>
              <th className="px-6 py-3">{t.docStatus}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">Đang tải...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">{t.empty}</td></tr>
            ) : (
              orders.map((o, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{o.code}</td>
                  <td className="px-6 py-4">{o.product_name}</td>
                  <td className="px-6 py-4">{o.quantity}</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">{o.doc_status || 'Đã nhận đủ'}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
