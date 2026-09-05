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

  // Xử lý thêm dòng sản phẩm
  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { ma_hang: '', ten_san_pham: '', quy_cach: '', so_luong: '', chat_lieu: '' }
      ]
    });
  };

  // Xử lý xóa dòng sản phẩm
  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  // Cập nhật giá trị từng dòng
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  // Hàm gọi AI bóc tách file PDF từ Supabase URL qua Base64
  const handleParsePdfFromUrl = async (pdfUrl) => {
  if (!pdfUrl) {
    alert("Vui lòng nhập link PDF!");
    return;
  }

  setLoading(true);
  try {
    const response = await fetch(pdfUrl);
    if (!response.ok) throw new Error("Không tải được file từ URL cung cấp");
    const blob = await response.blob();

    const base64Pdf = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const parts = reader.result.split(',');
        resolve(parts.length > 1 ? parts[1] : parts[0]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Gửi đúng key "base64Pdf" lên API
    const res = await fetch('/api/parse-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Pdf })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Lỗi server");

    setFormData({
      ma_don_hang: result.ma_don_hang || '',
      ngay_xuong_don: result.ngay_xuong_don || '',
      ma_khach_hang: result.ma_khach_hang || '',
      items: result.items && result.items.length > 0 ? result.items : formData.items
    });

    alert("Đọc đơn hàng thành công!");
  } catch (err) {
    console.error("Lỗi client:", err);
    alert("Lỗi: " + err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{ padding: '24px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <Head>
        <title>Quản lý Đơn hàng - Tỉnh Hằng</title>
      </Head>

      <h1 style={{ color: '#333', fontSize: '24px', marginBottom: '20px' }}>Quản lý Đơn hàng & Bóc tách PDF</h1>

      {/* Khu vực test nhập URL để gọi AI */}
      <div style={{ marginBottom: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Đường dẫn file PDF đơn hàng (Supabase URL):</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            id="pdfUrlInput" 
            placeholder="Dán link file PDF từ Supabase vào đây..." 
            style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button 
            onClick={() => {
              const url = document.getElementById('pdfUrlInput').value;
              handleParsePdfFromUrl(url);
            }}
            disabled={loading}
            style={{ padding: '8px 16px', background: '#6b21a8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {loading ? '⏳ AI đang bóc tách...' : '✨ Đọc PDF bằng AI'}
          </button>
        </div>
      </div>

      {/* Form thông tin chính */}
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

      {/* Bảng chi tiết sản phẩm (nhiều dòng) */}
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
