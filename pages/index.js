import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard({ lang }) {
  const [delayedOrders, setDelayedOrders] = useState([]);
  const [missingDocOrders, setMissingDocOrders] = useState([]);
  const [unassignedProdOrders, setUnassignedProdOrders] = useState([]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    // 1. Cảnh báo giao chậm
    const { data: poData } = await supabase.from('po_list').select('*');
    if (poData) {
      const today = new Date();
      setDelayedOrders(poData.filter(item => new Date(item.delivery_required_date) < today && item.status !== 'Đã giao'));
    }

    // 2. Cảnh báo trễ chứng từ
    const { data: prodData } = await supabase.from('production_orders').select('*');
    if (prodData) {
      setMissingDocOrders(prodData.filter(item => item.document_status === 'Chưa nhận chứng từ'));
      
      // 3. Cảnh báo quá 3 ngày chưa xuống đơn sản xuất
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      setUnassignedProdOrders(prodData.filter(item => new Date(item.created_at) < threeDaysAgo && !item.product_code));
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        {lang === 'VN' ? 'Bảng Điều Khiển & Cảnh Báo' : '控制面板与预警'}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Thẻ 1: Cảnh báo giao chậm */}
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm">
          <h2 className="text-red-700 font-bold text-lg mb-2">
            🚨 {lang === 'VN' ? 'Cảnh Báo Giao Chậm' : '延迟交货预警'} ({delayedOrders.length})
          </h2>
          <p className="text-sm text-red-600 mb-3">Các PO đã quá hạn giao hàng nhưng chưa hoàn thành.</p>
          <ul className="text-sm space-y-1">
            {delayedOrders.map(item => (
              <li key={item.id} className="bg-white p-2 rounded border border-red-200">
                <strong>{item.po_number}</strong> - {item.product_name} (Hạn: {item.delivery_required_date})
              </li>
            ))}
          </ul>
        </div>

        {/* Thẻ 2: Trễ chứng từ */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded shadow-sm">
          <h2 className="text-yellow-700 font-bold text-lg mb-2">
            📄 {lang === 'VN' ? 'Chưa Nhận Chứng Từ' : '未收到单据预警'} ({missingDocOrders.length})
          </h2>
          <p className="text-sm text-yellow-600 mb-3">Các đơn sản xuất chưa cập nhật chứng từ kèm theo.</p>
          <ul className="text-sm space-y-1">
            {missingDocOrders.map(item => (
              <li key={item.id} className="bg-white p-2 rounded border border-yellow-200">
                Lệnh: <strong>{item.order_number}</strong> - Khách: {item.customer_code}
              </li>
            ))}
          </ul>
        </div>

        {/* Thẻ 3: Quá 3 ngày chưa xuống đơn */}
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded shadow-sm">
          <h2 className="text-orange-700 font-bold text-lg mb-2">
            ⏳ {lang === 'VN' ? 'Quá 3 Ngày Chưa Xuống Đơn' : '超过3天未下生产单'} ({unassignedProdOrders.length})
          </h2>
          <p className="text-sm text-orange-600 mb-3">Đơn hàng tồn đọng quá 3 ngày chưa chuyển thành đơn sản xuất.</p>
          <ul className="text-sm space-y-1">
            {unassignedProdOrders.map(item => (
              <li key={item.id} className="bg-white p-2 rounded border border-orange-200">
                Mã: <strong>{item.order_number}</strong> - Tạo ngày: {new Date(item.created_at).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
