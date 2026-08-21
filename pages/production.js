import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ProductionPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State quản lý việc hiển thị Modal Upload & Giao diện Rà soát Split-Screen
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState('');
  
  // State form nhập liệu đơn sản xuất
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

  // 1. Tải danh sách đơn sản xuất khi vào trang
  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('production_orders')
      .select('*')
      .order('id', { ascending: false });
    if (!error && data) setOrders(data);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 2. Xử lý upload file PDF lên Supabase Storage
  const handleFileUpload = async (e) => {
    try {
      setLoading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      // Upload vào bucket 'production_files'
      const { error: uploadError } = await supabase.storage
        .from('production_files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Lấy link công khai của file
      const { data: publicUrlData } = supabase.storage
        .from('production_files')
        .getPublicUrl(fileName);

      setCurrentPdfUrl(publicUrlData.publicUrl);
      setShowUploadModal(false); // Tắt popup upload, chuyển sang màn hình rà soát
    } catch (error) {
      alert('Lỗi upload file: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Lưu thông tin đơn sản xuất vào bảng Database
  const handleSaveOrder = async () => {
    if (!formData.ma_don_hang || !formData.ngay_xuong_don) {
      alert('Vui lòng điền mã đơn hàng và ngày xuống đơn!');
      return;
    }

    const { error } = await supabase
      .from('production_orders')
      .insert([{ ...formData, file_url: currentPdfUrl }]);

    if (error) {
      alert('Lỗi khi lưu: ' + error.message);
    } else {
      alert('Đã lưu đơn sản xuất thành công!');
      setCurrentPdfUrl(''); // Reset về màn hình danh sách
      fetchOrders(); // Tải lại danh sách
    }
  };

  // --- GIAO DIỆN 1: NẾU ĐANG TRONG QUÁ TRÌNH UPLOAD VÀ RÀ SOÁT (SPLIT-SCREEN) ---
  if (currentPdfUrl) {
    return (
      <div className="flex h-screen w-full bg-gray-50">
        {/* Bên trái: Xem file PDF gốc */}
        <div className="w-1/2 h-full border-r bg-white">
          <iframe src={currentPdfUrl} className="w-full h-full" title="PDF Preview" />
        </div>

        {/* Bên phải: Form rà soát dữ liệu */}
        <div className="w-1/2 h-full p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Rà soát & Nhập đơn sản xuất</h2>
            <button 
              onClick={() => setCurrentPdfUrl('')} 
              className="text-red-500 hover:underline text-sm"
            >
              Quay lại danh sách
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mã đơn hàng</label>
              <input 
                type="text" 
                value={formData.ma_don_hang}
                onChange={(e) => setFormData({...formData, ma_don_hang: e.target.value})}
                className="w-full p-2 border rounded" 
                placeholder="Nhập mã đơn hàng..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ngày xuống đơn</label>
              <input 
                type="date" 
                value={formData.ngay_xuong_don}
                onChange={(e) => setFormData({...formData, ngay_xuong_don: e.target.value})}
                className="w-full p-2 border rounded" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mã khách hàng</label>
              <input 
                type="text" 
                value={formData.ma_khach_hang}
                onChange={(e) => setFormData({...formData, ma_khach_hang: e.target.value})}
                className="w-full p-2 border rounded" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mã hàng (Mapping PO)</label>
              <input 
                type="text" 
                value={formData.ma_hang}
                onChange={(e) => setFormData({...formData, ma_hang: e.target.value})}
                className="w-full p-2 border rounded" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tên sản phẩm</label>
              <input 
                type="text" 
                value={formData.ten_san_pham}
                onChange={(e) => setFormData({...formData, ten_san_pham: e.target.value})}
                className="w-full p-2 border rounded" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quy cách</label>
              <input 
                type="text" 
                value={formData.quy_cach}
                onChange={(e) => setFormData({...formData, quy_cach: e.target.value})}
                className="w-full p-2 border rounded" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Số lượng</label>
              <input 
                type="number" 
                value={formData.so_luong}
                onChange={(e) => setFormData({...formData, so_luong: parseInt(e.target.value) || 0})}
                className="w-full p-2 border rounded" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Chất liệu</label>
              <input 
                type="text" 
                value={formData.chat_lieu}
                onChange={(e) => setFormData({...formData, chat_lieu: e.target.value})}
                className="w-full p-2 border rounded" 
              />
            </div>
            
            <button 
              onClick={handleSaveOrder}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 mt-4"
            >
              LƯU ĐƠN HÀNG VÀO HỆ THỐNG
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- GIAO DIỆN 2: TRANG CHỦ DANH SÁCH ĐƠN SẢN XUẤT ---
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản Lý Đơn Sản Xuất</h1>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
        >
          + Import Đơn Sản Xuất (PDF)
        </button>
      </div>

      {/* Bảng hiển thị danh sách đơn */}
      <div className="bg-white shadow rounded-lg overflow-hidden border">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b text-sm text-gray-700">
              <th className="p-3">Mã đơn hàng</th>
              <th className="p-3">Ngày xuống đơn</th>
              <th className="p-3">Mã khách hàng</th>
              <th className="p-3">Mã hàng</th>
              <th className="p-3">Tên sản phẩm</th>
              <th className="p-3">Số lượng</th>
              <th className="p-3">Trạng thái chứng từ</th>
              <th className="p-3">File gốc</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center p-6 text-gray-500">Chưa có đơn sản xuất nào được tạo.</td>
              </tr>
            ) : (
              orders.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50 text-sm">
                  <td className="p-3 font-semibold">{item.ma_don_hang}</td>
                  <td className="p-3">{item.ngay_xuong_don}</td>
                  <td className="p-3">{item.ma_khach_hang}</td>
                  <td className="p-3">{item.ma_hang}</td>
                  <td className="p-3">{item.ten_san_pham}</td>
                  <td className="p-3">{item.so_luong}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                      {item.trang_thai_chung_tu}
                    </span>
                  </td>
                  <td className="p-3">
                    {item.file_url && (
                      <a href={item.file_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                        Xem PDF
                      </a>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL UPLOAD FILE */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[400px] shadow-lg">
            <h3 className="text-lg font-bold mb-4">Tải lên file PDF đơn sản xuất</h3>
            <input 
              type="file" 
              accept="application/pdf" 
              onChange={handleFileUpload} 
              disabled={loading}
              className="block w-full mb-4 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            {loading && <p className="text-sm text-blue-600 mb-4 animate-pulse">Đang tải file lên hệ thống...</p>}
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
              >
              Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
