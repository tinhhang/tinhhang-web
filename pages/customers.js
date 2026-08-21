import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';

export default function CustomersManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State modal thêm/sửa
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [formData, setFormData] = useState({
    customer_code: '',
    customer_name: '',
    address: '',
    tax_code: '',
    contact_person: '',
    phone: ''
  });

  const fetchCustomers = async () => {
    setLoading(true);
    let query = supabase.from('customers').select('*').order('id', { ascending: false });

    // Tìm kiếm theo từ khóa có trong tên khách hàng
    if (searchTerm.trim() !== '') {
      query = query.ilike('customer_name', `%${searchTerm.trim()}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Lỗi tải danh sách khách hàng:', error.message);
    } else if (data) {
      setCustomers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm]);

  // Xử lý Thêm hoặc Cập nhật
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      customer_code: formData.customer_code.trim(),
      customer_name: formData.customer_name.trim(),
      address: formData.address.trim(),
      tax_code: formData.tax_code.trim(),
      contact_person: formData.contact_person.trim(),
      phone: formData.phone.trim()
    };

    let error;
    if (isEditing) {
      // Cập nhật
      const res = await supabase.from('customers').update(payload).eq('id', currentId);
      error = res.error;
    } else {
      // Thêm mới
      const res = await supabase.from('customers').insert([payload]);
      error = res.error;
    }

    if (error) {
      alert('Lỗi thao tác: ' + error.message);
    } else {
      alert(isEditing ? 'Cập nhật khách hàng thành công!' : 'Thêm khách hàng thành công!');
      closeModal();
      await fetchCustomers();
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({ customer_code: '', customer_name: '', address: '', tax_code: '', contact_person: '', phone: '' });
    setShowModal(true);
  };

  const openEditModal = (cus) => {
    setIsEditing(true);
    setCurrentId(cus.id);
    setFormData({
      customer_code: cus.customer_code || cus.code || '',
      customer_name: cus.customer_name || cus.name || '',
      address: cus.address || '',
      tax_code: cus.tax_code || '',
      contact_person: cus.contact_person || '',
      phone: cus.phone || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentId(null);
  };

  // Tính năng Import từ Excel
  const handleExcelImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          alert('File Excel không có dữ liệu!');
          return;
        }

        // Chuẩn hóa dữ liệu đẩy lên Supabase
        // Kỳ vọng file excel có các cột tương ứng hoặc mapping tương đương
        const formattedData = data.map(item => ({
          customer_code: String(item.customer_code || item.Mãkháchhàng || item.Code || '').trim(),
          customer_name: String(item.customer_name || item.Tênkháchhàng || item.Name || '').trim(),
          address: String(item.address || item.Địachỉ || '').trim(),
          tax_code: String(item.tax_code || item.Mãsốthuế || '').trim(),
          contact_person: String(item.contact_person || item.Ngườiliênhệ || '').trim(),
          phone: String(item.phone || item.Sốđiệnthoại || '').trim()
        })).filter(item => item.customer_code && item.customer_name);

        if (formattedData.length === 0) {
          alert('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại tên cột trong file Excel (cần có mã và tên khách hàng).');
          return;
        }

        const { error } = await supabase.from('customers').upsert(formattedData, { onConflict: 'customer_code' });

        if (error) {
          alert('Lỗi import Excel: ' + error.message);
        } else {
          alert(`Import thành công ${formattedData.length} khách hàng!`);
          await fetchCustomers();
        }
      } catch (err) {
        alert('Lỗi đọc file Excel: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
    // Reset input file
    e.target.value = null;
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Quản lý Danh mục Khách hàng</h1>

      {/* Thanh công cụ: Tìm kiếm, Thêm thủ công, Import Excel, Quay lại PO */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button 
          onClick={openAddModal}
          style={{ padding: '8px 16px', cursor: 'pointer', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px' }}
        >
          + Thêm khách hàng thủ công
        </button>

        <label style={{ padding: '8px 16px', background: '#10b981', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>
          📂 Import từ Excel
          <input type="file" accept=".xlsx, .xls" onChange={handleExcelImport} style={{ display: 'none' }} />
        </label>

        <input 
          type="text" 
          placeholder="🔍 Tìm kiếm theo tên khách hàng..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ padding: '8px', width: '280px', border: '1px solid #ccc', borderRadius: '4px' }}
        />

        <a href="/po" style={{ padding: '8px 16px', background: '#e2e8f0', color: '#333', textDecoration: 'none', borderRadius: '4px', marginLeft: 'auto' }}>
          Đến trang Quản lý PO ➔
        </a>
      </div>

      {loading && <p>Đang tải dữ liệu khách hàng...</p>}

      {/* Bảng danh sách */}
      <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f2f2f2' }}>
            <th>STT</th>
            <th>Mã Khách Hàng</th>
            <th>Tên Khách Hàng / Công Ty</th>
            <th>Địa chỉ</th>
            <th>Mã số thuế</th>
            <th>Người đại diện</th>
            <th>Số điện thoại</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {customers.length === 0 && !loading ? (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center' }}>Không tìm thấy dữ liệu khách hàng nào</td>
            </tr>
          ) : (
            customers.map((c, index) => (
              <tr key={c.id || index}>
                <td>{index + 1}</td>
                <td><strong>{c.customer_code || c.code}</strong></td>
                <td>{c.customer_name || c.name}</td>
                <td>{c.address}</td>
                <td>{c.tax_code}</td>
                <td>{c.contact_person}</td>
                <td>{c.phone}</td>
                <td>
                  <button 
                    onClick={() => openEditModal(c)}
                    style={{ padding: '4px 8px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Sửa
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal Thêm / Sửa Khách Hàng */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '450px' }}>
            <h2>{isEditing ? 'Chỉnh sửa thông tin khách hàng' : 'Thêm khách hàng mới'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '10px' }}>
                <label>Mã Khách hàng (*): </label>
                <input 
                  type="text" 
                  value={formData.customer_code} 
                  onChange={e => setFormData({...formData, customer_code: e.target.value})} 
                  required 
                  disabled={isEditing} // Không cho sửa mã chính nếu đang update để tránh vỡ quan hệ
                  style={{ width: '100%', padding: '6px', background: isEditing ? '#f3f4f6' : '#fff' }} 
                />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Tên Khách hàng / Công ty (*): </label>
                <input type="text" value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} required style={{ width: '100%', padding: '6px' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Địa chỉ: </label>
                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} style={{ width: '100%', padding: '6px' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Mã số thuế: </label>
                <input type="text" value={formData.tax_code} onChange={e => setFormData({...formData, tax_code: e.target.value})} style={{ width: '100%', padding: '6px' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Người đại diện (nếu có): </label>
                <input type="text" value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} style={{ width: '100%', padding: '6px' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Số điện thoại (nếu có): </label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '6px' }} />
              </div>
              
              <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="submit" style={{ padding: '8px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px' }}>Lưu</button>
                <button type="button" onClick={closeModal} style={{ padding: '8px 16px' }}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
