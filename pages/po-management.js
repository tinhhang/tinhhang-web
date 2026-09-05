import React, { useState } from 'react';
import Head from 'next/head';

export default function PoManagement() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ma_don_hang: '',
    ngay_xuong_don: '',
    ma_khach_hang: '',
    items: [
      { ma_hang: '', ten_san_pham: '', quy_cach: '', so_luong: '', chat_lieu: '' }
    ]
  });

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { ma_hang: '', ten_san_pham: '', quy_cach: '', so_luong: '', chat_lieu: '' }]
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

 const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file); // Gửi file trực tiếp dạng form-data

      const res = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formDataObj // Không cần set Content-Type, trình duyệt tự lo
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi xử lý từ server");

      setFormData({
        ma_don_hang: data.ma_don_hang || '',
        ngay_xuong_don: data.ngay_xuong_don || '',
        ma_khach_hang: data.ma_khach_hang || '',
        items: data.items && data.items.length > 0 ? data.items : formData.items
      });

      alert("AI đã bóc tách đơn hàng thành công!");
    } catch (err) {
      console.error(err);
      alert("Lỗi đọc file PDF: " + err.message);
    } finally {
      setLoading(false);
      event.target.value = null;
    }
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <Head>
        <title>Quản lý Đơn hàng - Tỉnh Hằng</title>
      </Head>

      <h1 style={{ color: '#333', fontSize: '24px', marginBottom: '20px' }}>Quản lý Đơn hàng & Bóc tách PDF</h1>

      <div style={{ marginBottom: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Chọn file PDF đơn hàng từ máy tính:</label>
        <input 
          type="file" 
          accept="application/pdf"
          onChange={handleFileUpload}
          disabled={loading}
          style={{ padding: '8px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
        />
        {loading && <p style={{ color: '#7c3aed', marginTop: '8px', fontWeight: 'bold' }}>⏳ AI đang đọc bảng đơn hàng, vui lòng đợi chút...</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Mã đơn hàng</label>
          <input 
            type="text" 
            value={formData.ma_don_hang} 
            onChange={(e) => setFormData({ ...formData, ma_don_hang: e.target.value })}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Ngày xuống đơn</label>
          <input 
            type="date" 
            value={formData.ngay_xuong_don} 
            onChange={(e) => setFormData({ ...formData, ngay_xuong_don: e.target.value })}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Mã khách hàng</label>
          <input 
            type="text" 
            value={formData.ma_khach_hang} 
            onChange={(e) => setFormData({ ...formData, ma_khach_hang: e.target.value })}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
      </div>

      <h3 style={{ fontSize: '18px', marginTop: '30px', marginBottom: '10px' }}>Chi tiết danh sách hàng</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
        <thead>
          <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Mã hàng</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Sản phẩm</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Quy cách</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Số lượng</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Chất liệu</th>
            <th style={{ padding: '10px', border: '1px solid #ddd', width: '80px' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {formData.items.map((item, index) => (
            <tr key={index}>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                <input 
                  type="text" 
                  value={item.ma_hang} 
                  onChange={(e) => handleItemChange(index, 'ma_hang', e.target.value)}
                  style={{ width: '100%', padding: '6px', border: 'none' }}
                />
              </td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                <input 
                  type="text" 
                  value={item.ten_san_pham} 
                  onChange={(e) => handleItemChange(index, 'ten_san_pham', e.target.value)}
                  style={{ width: '100%', padding: '6px', border: 'none' }}
                />
              </td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                <input 
                  type="text" 
                  value={item.quy_cach} 
                  onChange={(e) => handleItemChange(index, 'quy_cach', e.target.value)}
                  style={{ width: '100%', padding: '6px', border: 'none' }}
                />
              </td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                <input 
                  type="text" 
                  value={item.so_luong} 
                  onChange={(e) => handleItemChange(index, 'so_luong', e.target.value)}
                  style={{ width: '100%', padding: '6px', border: 'none' }}
                />
              </td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                <input 
                  type="text" 
                  value={item.chat_lieu} 
                  onChange={(e) => handleItemChange(index, 'chat_lieu', e.target.value)}
                  style={{ width: '100%', padding: '6px', border: 'none' }}
                />
              </td>
              <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                {formData.items.length > 1 && (
                  <button 
                    onClick={() => handleRemoveItem(index)}
                    style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Xóa
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button 
        onClick={handleAddItem}
        style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        + Thêm dòng
      </button>
    </div>
  );
}
