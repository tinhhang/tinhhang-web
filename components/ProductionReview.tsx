"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase'; // Đảm bảo đường dẫn này đúng với project của bà

export default function ProductionReview({ pdfUrl }: { pdfUrl: string }) {
  const [formData, setFormData] = useState({
    ma_don_hang: '',
    ngay_xuong_don: '',
    ma_khach_hang: '',
    ma_hang: '',
    ten_san_pham: '',
    quy_cach: '',
    so_luong: 0,
    chat_lieu: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from('production_orders')
      .insert([{ ...formData, file_url: pdfUrl }]);

    if (error) {
      alert("Lỗi khi lưu: " + error.message);
    } else {
      alert("Đã lưu đơn thành công!");
    }
  };

  return (
    <div className="flex h-screen w-full">
      {/* Bên trái: PDF Viewer */}
      <div className="w-1/2 h-full bg-gray-100">
        <iframe src={pdfUrl} className="w-full h-full" title="PDF File" />
      </div>

      {/* Bên phải: Form nhập liệu */}
      <div className="w-1/2 h-full p-8 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Thông tin Đơn sản xuất</h2>
        <div className="space-y-4">
          <input name="ma_don_hang" placeholder="Mã đơn hàng" onChange={handleInputChange} className="w-full p-2 border rounded" />
          <input type="date" name="ngay_xuong_don" onChange={handleInputChange} className="w-full p-2 border rounded" />
          <input name="ma_khach_hang" placeholder="Mã khách hàng" onChange={handleInputChange} className="w-full p-2 border rounded" />
          <input name="ma_hang" placeholder="Mã hàng" onChange={handleInputChange} className="w-full p-2 border rounded" />
          <input name="ten_san_pham" placeholder="Tên sản phẩm" onChange={handleInputChange} className="w-full p-2 border rounded" />
          <input name="so_luong" type="number" placeholder="Số lượng" onChange={handleInputChange} className="w-full p-2 border rounded" />
          <input name="chat_lieu" placeholder="Chất liệu" onChange={handleInputChange} className="w-full p-2 border rounded" />
          
          <button 
            onClick={handleSave}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700"
          >
            LƯU ĐƠN HÀNG VÀO CSDL
          </button>
        </div>
      </div>
    </div>
  );
}
