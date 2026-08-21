import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function POManagement() {
  const [pos, setPos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newPo, setNewPo] = useState({ po_number: '', customer_name: '', order_date: new Date().toISOString().split('T')[0], delivery_date: '', status: 'Chờ duyệt' });
  const [items, setItems] = useState([{ product_code: '', quantity: 1, unit_price: 0 }]);

  const fetchPOs = async () => {
    const { data } = await supabase.from('po_management').select('*, po_items(*)').order('id', { ascending: false });
    if (data) setPos(data);
  };

  useEffect(() => { fetchPOs(); }, []);

  const addItem = () => setItems([...items, { product_code: '', quantity: 1, unit_price: 0 }]);

  const savePO = async () => {
    // 1. Lưu thông tin chung
    const { data: po, error: poError } = await supabase
      .from('po_management')
      .insert([newPo])
      .select();

    if (poError) { alert('Lỗi PO: ' + poError.message); return; }

    // 2. Lưu chi tiết sản phẩm
    const poItems = items.map(item => ({ ...item, po_id: po[0].id }));
    const { error: itemsError } = await supabase.from('po_items').insert(poItems);

    if (itemsError) alert('Lỗi chi tiết: ' + itemsError.message);
    else { alert('Tạo PO thành công!'); setShowModal(false); fetchPOs(); }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Quản lý PO</h1>
      <button onClick={() => setShowModal(true)}>+ Tạo PO mới</button>

      <table border="1" style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th>Mã PO</th><th>Khách</th><th>Trạng thái</th><th>Chi tiết</th>
          </tr>
        </thead>
        <tbody>
          {pos.map(po => (
            <tr key={po.id}>
              <td>{po.po_number}</td>
              <td>{po.customer_name}</td>
              <td>{po.status}</td>
              <td>{po.po_items?.map(i => `${i.product_code} (x${i.quantity})`).join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '20px', width: '500px' }}>
            <h2>Tạo PO</h2>
            <input placeholder="Số PO" onChange={e => setNewPo({...newPo, po_number: e.target.value})} />
            <input placeholder="Khách hàng" onChange={e => setNewPo({...newPo, customer_name: e.target.value})} />
            
            <h3>Chi tiết sản phẩm</h3>
            {items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '5px' }}>
                <input placeholder="Mã hàng" onChange={e => {
                  let newItems = [...items];
                  newItems[idx].product_code = e.target.value;
                  setItems(newItems);
                }} />
                <input type="number" placeholder="SL" onChange={e => {
                  let newItems = [...items];
                  newItems[idx].quantity = e.target.value;
                  setItems(newItems);
                }} />
              </div>
            ))}
            <button onClick={addItem}>+ Thêm dòng</button>
            <button onClick={savePO}>Lưu toàn bộ PO</button>
            <button onClick={() => setShowModal(false)}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}
