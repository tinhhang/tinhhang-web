import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function POManagement() {
  const [poList, setPoList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [customerSearch, setCustomerSearch] = useState('');

  const [formData, setFormData] = useState({
    po_number: '',
    customer_code: '',
    product_name: '',
    product_code: '',
    quantity: 1,
    unit_price: 0,
    po_date: new Date().toISOString().split('T')[0]
  });
  
  const [poFile, setPoFile] = useState(null);

  const formatDateForDisplay = (val) => {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchData = async () => {
    setLoading(true);
    
    const { data: poData, error: poError } = await supabase
      .from('po_list')
      .select('*')
      .order('id', { ascending: false });

    if (poError) console.error('Lỗi tải PO:', poError.message);
    else if (poData) setPoList(poData);

    const { data: cusData, error: cusError } = await supabase.from('customers').select('*');
    if (cusError) {
      console.error('Lỗi tải khách hàng:', cusError.message);
    } else if (cusData) {
      setCustomers(cusData);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPO = async (e) => {
    e.preventDefault();
    
    if (!formData.customer_code) {
      alert('Vui lòng chọn mã khách hàng!');
      return;
    }

    let fileUrl = '';
    // Chỉ upload nếu người dùng có chọn file
    if (poFile) {
      const fileName = `${Date.now()}_${poFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('po_files')
        .upload(fileName, poFile);

      if (uploadError) {
        alert('Lỗi tải lên file PO: ' + uploadError.message + '\n(Hãy chắc chắn đã tạo Bucket "po_files" trên Supabase)');
        return;
      }
      
      const { data: urlData } = supabase.storage.from('po_files').getPublicUrl(fileName);
      fileUrl = urlData.publicUrl;
    }

    const newRow = {
      po_number: formData.po_number,
      customer_code: formData.customer_code,
      product_name: formData.product_name,
      product_code: formData.product_code,
      quantity: Number(formData.quantity),
      unit_price: Number(formData.unit_price),
      po_date: formData.po_date || null,
      file_url: fileUrl || null // Lưu thêm link file nếu có cột này trong DB
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
      setCustomerSearch('');
      setPoFile(null);
      await fetchData();
    }
  };

  const filteredCustomers = customers.filter(c => {
    const code = String(c.customer_code || c.code || c.id || '').toLowerCase();
    const name = String(c.customer_name || c.name || '').toLowerCase();
    const keyword = customerSearch.toLowerCase();
    return code.includes(keyword) || name.includes(keyword);
  });

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Quản lý PO (po_list)</h1>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => setShowModal(true)}
          style={{ padding: '8px 16px', cursor: 'pointer', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px' }}
        >
          + Thêm dòng PO mới
        </button>
        <a href="/customers" style={{ padding: '8px 16px', background: '#e2e8f0', color: '#333', textDecoration: 'none', borderRadius: '4px' }}>
          Quản lý Danh sách Khách hàng
        </a>
      </div>

      {loading && <p>Đang tải dữ liệu...</p>}

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

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2>Thêm dòng PO & Tải file gốc</h2>
            <form onSubmit={handleAddPO}>
              <div style={{ marginBottom: '10px' }}>
                <label>Số PO: </label>
                <input type="text" value={formData.po_number} onChange={e => setFormData({...formData, po_number: e.target.value})} required style={{ width: '100%', padding: '6px' }} />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label>Khách hàng (Tìm theo mã hoặc tên): </label>
                <input 
                  type="text" 
                  placeholder="🔍 Gõ từ khóa để lọc danh sách bên dưới..." 
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  style={{ width: '100%', padding: '6px', marginBottom: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                
                <select 
                  value={formData.customer_code} 
                  onChange={e => setFormData({...formData, customer_code: e.target.value})} 
                  required 
                  size="5" 
                  style={{ width: '100%', padding: '6px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                >
                  {filteredCustomers.length === 0 ? (
                    <option value="" disabled>-- Không tìm thấy khách hàng --</option>
                  ) : (
                    filteredCustomers.map((c, idx) => {
                      const code = c.customer_code || c.code || c.id;
                      const name = c.customer_name || c.name;
                      return (
                        <option key={idx} value={code}>
                          {code} - {name}
                        </option>
                      );
                    })
                  )}
                </select>
                <div style={{ marginTop: '4px', fontSize: '13px', color: '#0070f3' }}>
                  ✓ Đã chọn mã khách hàng: <strong>{formData.customer_code || 'Chưa chọn'}</strong>
                </div>
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

              <div style={{ marginBottom: '10px', background: '#f9f9f9', padding: '8px', border: '1px dashed #ccc' }}>
                <label><strong>Tải file PO gốc (PDF / Ảnh) - Tùy chọn:</strong> </label>
                <input type="file" accept=".pdf,image/*" onChange={e => setPoFile(e.target.files[0])} style={{ width: '100%', marginTop: '5px' }} />
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
