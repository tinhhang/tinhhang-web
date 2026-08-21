import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function POManagement({ lang }) {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);

  const t = {
    VN: { title: 'Quản Lý Đơn Hàng (PO)', poNumber: 'Số PO', customer: 'Khách Hàng', orderDate: 'Ngày Đặt Hàng', deliveryDate: 'Ngày Giao Hàng', status: 'Trạng Thái', empty: 'Chưa có đơn hàng (PO) nào.' },
    CN: { title: 'PO 订单管理', poNumber: 'PO 编号', customer: '客户', orderDate: '下单日期', deliveryDate: '交货日期', status: '状态', empty: '暂无 PO 订单。' }
  }[lang || 'VN'];

  useEffect(() => {
    async function fetchPOs() {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('orders').select('*');
        if (error) throw error;
        setPos(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPOs();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{t.title}</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
          <thead className="bg-gray-100 font-semibold text-gray-700">
            <tr>
              <th className="px-6 py-3">{t.poNumber}</th>
              <th className="px-6 py-3">{t.customer}</th>
              <th className="px-6 py-3">{t.orderDate}</th>
              <th className="px-6 py-3">{t.deliveryDate}</th>
              <th className="px-6 py-3">{t.status}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">Đang tải...</td></tr>
            ) : pos.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">{t.empty}</td></tr>
            ) : (
              pos.map((po, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-blue-600">{po.po_number}</td>
                  <td className="px-6 py-4">{po.customer_name}</td>
                  <td className="px-6 py-4">{po.order_date}</td>
                  <td className="px-6 py-4">{po.delivery_date}</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">{po.status || 'Đang xử lý'}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
