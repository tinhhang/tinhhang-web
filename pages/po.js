import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function POManagement() {
  const [poList, setPoList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // State form tương ứng chính xác với các cột trong bảng po_list của Supabase
  const [formData, setFormData] = useState({
    po_number: '',
    customer_code: '',
    product_name: '',
    product_code: '',
    quantity: 1,
    unit_price: 0,
    po_date: new Date().toISOString().split('T')[0]
  });

  // Format ngày hiển thị Việt Nam (DD/MM/YYYY)
  const formatDateForDisplay = (val) => {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Tải danh sách PO từ bảng po_list
  const fetchPOList = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('po_list')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Lỗi khi tải danh sách PO:', error.message);
    } else if (data) {
      setPoList(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPOList();
  }, []);

  // Thêm mới PO vào bảng po_list
  const handleAddPO = async (e) => {
    e.preventDefault();
    const newRow = {
      po_number: formData.po_number,
      customer_code: formData.customer_code,
      product_name: formData.product_name,
      product_code: formData.product_code,
      quantity: Number(formData.quantity),
      unit_price: Number(formData.unit_price),
      po_date: formData.po_date || null
    };

    const { error } = await supabase.from('po_list').insert([newRow]);

    if (error) {
      alert('Lỗi khi thêm PO: ' + error.message);
    } else {
      alert('Thêm dòng PO thành công!');
      setShowModal(false);
      setFormData({
        po_number: '',
        customer_code: '',
        product_name: '',
        product_code: '',
        quantity: 1,
        unit_price: 0,
        po_date: new Date().toISOString().split('T')[0]
      });
      await fetchPOList();
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Quản lý PO (po_list)</h1>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setShowModal(true)}
          style={{ padding: '8px 16px', cursor: 'pointer', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px' }}
        >
          + Thêm dòng PO mới
        </button>
      </div>

      {loading && <p>Đang tải dữ liệu PO...</p>}

      <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f2f2f2' }}>
            <th>STT</th>
            <th>Số PO</th>
            <th>Mã Khách hàng</th>
            <th>Tên sản phẩm</th>
            <th>Mã sản phẩm</th>
            <th>Số lượng</th>
            <th>Đơn giá</th>
            <th>Ngày PO</th>
          </tr>
        </thead>
        <tbody>
          {poList.length === 0 && !loading ? (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center' }}>Chưa có dữ liệu PO nào</td>
            </tr>
          ) : (
            poList.map((po, index) => (
              <tr key={po.id || index}>
                <td>{index + 1}</td>
                <td><strong>{po.po_number}</strong></td>
                <td>{po.customer_code}</td>
                <td>{po.product_name}</td>
                <td>{po.product_code}</td>
                <td>{po.quantity}</td>
                <td>{po.unit_price ? po.unit_price.toLocaleString('vi-VN') : 0}</td>
                <td>{formatDateForDisplay(po.po_date)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal thêm mới PO */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '450px' }}>
            <h2>Thêm dòng PO</h2>
            <form onSubmit={handleAddPO}>
              <div style={{ marginBottom: '10px' }}>
                <label>Số PO: </label>
                <input type="text" value={formData.po_number} onChange={e => setFormData({...formData, po_number: e.target.value})} required style={{ width: '100%', padding: '6px' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Mã Khách hàng: </label>
                <input type="text" value={formData.customer_code} onChange={e => setFormData({...formData, customer_code: e.target.value})} style={{ width: '100%', padding: '6px' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Tên sản phẩm: </label>
                <input type="text" value={formData.product_name} onChange={e => setFormData({...formData, product_name: e.target.value})} required style={{ width: '100%', padding: '6px' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Mã sản phẩm: </label>
                <input type="text" value={formData.product_code} onChange={e => setFormData({...formData, product_code: e.target.value})} style={{ width: '100%', padding: '6px' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Số lượng: </label>
                <input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required style={{ width: '100%', padding: '6px' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Đơn giá: </label>
                <input type="number" value={formData.unit_price} onChange={e => setFormData({...formData, unit_price: e.target.value})} style={{ width: '100%', padding: '6px' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Ngày PO: </label>
                <input type="date" value={formData.po_date} onChange={e => setFormData({...formData, po_date: e.target.value})} style={{ width: '100%', padding: '6px' }} />
              </div>
              <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="submit" style={{ padding: '8px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px' }}>Lưu</button>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px' }}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
