import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function CustomersManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_code: '',
    customer_name: '',
    contact_person: '',
    phone: '',
    address: ''
  });

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Lỗi tải danh sách khách hàng:', error.message);
    } else if (data) {
      setCustomers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('customers').insert([{
      customer_code: formData.customer_code.trim(),
      customer_name: formData.customer_name.trim(),
      contact_person: formData.contact_person.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim()
    }]);

    if (error) {
      alert('Lỗi khi thêm khách hàng: ' + error.message);
    } else {
      alert('Thêm khách hàng thành công!');
      setShowModal(false);
      setFormData({ customer_code: '', customer_name: '', contact_person: '', phone: '', address: '' });
      await fetchCustomers();
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Quản lý Danh mục Khách hàng</h1>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => setShowModal(true)}
          style={{ padding: '8px 16px', cursor: 'pointer', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px' }}
        >
          + Thêm khách hàng mới
        </button>
        <a href="/po" style={{ padding: '8px 16px', background: '#e2e8f0', color: '#333', textDecoration: 'none', borderRadius: '4px' }}>
          Quay lại Quản lý PO
        </a>
      </div>

      {loading && <p>Đang tải dữ liệu...</p>}

      <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f2f2f2' }}>
            <th>STT</th>
            <th>Mã Khách Hàng</th>
            <th>Tên Khách Hàng / Công Ty</th>
            <th>Người liên hệ</th>
            <th>Số điện thoại</th>
            <th>Địa chỉ</th>
          </tr>
        </thead>
        <tbody>
          {customers.length === 0 && !loading ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center' }}>Chưa có dữ liệu khách hàng nào</td>
            </tr>
          ) : (
            customers.map((c, index) => (
              <tr key={c.id || index}>
                <td>{index + 1}</td>
                <td><strong>{c.customer_code || c.code}</strong></td>
                <td>{c.customer_name || c.name}</td>
                <td>{c.contact_person}</td>
                <td>{c.phone}</td>
                <td>{c.address}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal thêm khách hàng */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '400px' }}>
            <h2>Thêm khách hàng mới</h2>
            <form onSubmit={handleAddCustomer}>
              <div style={{ marginBottom: '10px' }}>
                <label>Mã Khách hàng (VD: MUTO): </label>
                <input type="text" value={formData.customer_code} onChange={e => setFormData({...formData, customer_code: e.target.value})} required style={{ width: '100%', padding: '6px' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Tên Khách hàng: </label>
                <input type="text" value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} required style={{ width: '100%', padding: '6px' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Người liên hệ: </label>
                <input type="text" value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} style={{ width: '100%', padding: '6px' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Số điện thoại: </label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '6px' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Địa chỉ: </label>
                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} style={{ width: '100%', padding: '6px' }} />
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
