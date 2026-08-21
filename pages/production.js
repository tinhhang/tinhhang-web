import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ProductionPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [parsingAi, setParsingAi] = useState(false);
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState('');
  
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

  const handleFileUpload = async (e) => {
    try {
      setLoading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('production_files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('production_files')
        .getPublicUrl(fileName);

      setCurrentPdfUrl(publicUrlData.publicUrl);
      setShowUploadModal(false);
      
      // Tự động gọi AI đọc luôn ngay khi upload xong cho nhanh!
      handleAutoParseAi(publicUrlData.publicUrl);

    } catch (error) {
      alert('Lỗi upload file: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Hàm gọi AI đọc file PDF
  const handleAutoParseAi = async (pdfUrlToScan) => {
    try {
      setParsingAi(true);
      const res = await fetch('/api/parse-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfUrl: pdfUrlToScan || currentPdfUrl })
      });
      
      const result = await res.json();
      if (result.success && result.data) {
        setFormData(prev => ({
          ...prev,
          ...result.data
        }));
      } else {
        alert('AI không trích xuất được dữ liệu, bà nhập tay giúp tôi nhé!');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối AI scan.');
    } finally {
      setParsingAi(false);
    }
  };

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
      setCurrentPdfUrl('');
      fetchOrders();
    }
  };

  // GIAO DIỆN SPLIT-SCREEN (RÀ SOÁT & ĐIỀN AI)
  if (currentPdfUrl) {
    return (
      <div className="flex h-screen w-full bg-gray-50">
        <div className="w-1/2 h-full border-r bg-white">
          <iframe src={currentPdfUrl} className="w-full h-full" title="PDF Preview" />
        </div>

        <div className="w-1/2 h-full p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Rà soát & Nhập đơn sản xuất</h2>
            <button 
              onClick={() => setCurrentPdfUrl('')} 
              className="text-red-500 hover:underline text-sm"
            >
              Quay lại danh sách
            </button>
          </div>

          {/* Nút kích hoạt AI đọc thủ công nếu muốn */}
          <div className="mb-6">
            <button
              onClick={() => handleAutoParseAi(currentPdfUrl)}
              disabled={parsingAi}
              className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-medium hover:bg-purple-700 flex items-center justify-center gap-2 shadow transition"
            >
              {parsingAi ? (
                <>⏳ AI đang đọc đơn hàng, bà đợi tí...</>
              ) : (
                <>✨ Tự động điền thông tin bằng AI</>
              )}
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

  // GIAO DIỆN TRANG CHỦ DANH SÁCH
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
              <th className="p-3">File gốc</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-6 text-gray-500">Chưa có đơn sản xuất nào được tạo.</td>
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
