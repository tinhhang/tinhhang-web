import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';

export default function Inventory({ lang }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // State form nhập thủ công
  const [formData, setFormData] = useState({
    importDate: new Date().toLocaleDateString('vi-VN'),
    productCode: '',
    productName: '',
    quantity: 1,
    customsDeclarationNo: '',
    exportUnit: '',
    deliveryStatus: 'Chưa giao',
    invoiceStatus: 'Chưa xuất hóa đơn',
    invoiceDate: ''
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('inventory').select('*');
      if (error) throw error;
      if (data) setItems(data);
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  }

  // Hàm định dạng ngày tháng d/m/yyyy
  const formatDate = (val) => {
    if (!val) return '';
    let d;
    if (typeof val === 'number') {
      d = new Date(Math.round((val - 25569) * 86400 * 1000));
    } else {
      d = new Date(val);
    }
    if (isNaN(d.getTime())) return String(val).trim();
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  // Xử lý Import Excel theo đúng các cột B, C, D, E, F, G, J, P
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // Lấy dữ liệu dạng mảng hàng [[A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P], ...]
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const parsedItems = [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          // Cột B: Index 1 (Số TK nhập khẩu)
          // Cột C: Index 2 (Ngày nhập kho)
          // Cột D: Index 3 (Tên sản phẩm)
          // Cột E: Index 4 (Số lượng)
          // Cột F: Index 5 (Đơn vị xuất)
          // Cột G: Index 6 (Thông tin ngày giao)
          // Cột J: Index 9 (Ngày xuất hóa đơn)
          // Cột P: Index 15 (Trạng thái boolean / True / False)

          const colB = row[1];
          const colC = row[2];
          const colD = row[3];
          const colE = row[4];
          const colF = row[5];
          const colG = row[6];
          const colJ = row[9];
          const colP = row[15];

          // Bỏ qua dòng tiêu đề
          if (!colD || String(colD).trim().toUpperCase() === 'TÊN SẢN PHẨM' || String(colD).trim().toUpperCase() === 'TÊN HÀNG') {
            continue;
          }

          // 1. Xử lý Logic Giao hàng (Cột G & Cột P)
          const pStatus = String(colP).trim().toLowerCase() === 'true' || colP === true;
          const hasDateG = colG && String(colG).trim() !== '';
          let deliveryStatus = 'Chưa giao';
          
          if (pStatus) {
            deliveryStatus = 'Đã giao';
          } else if (!pStatus && hasDateG) {
            deliveryStatus = 'Đã giao';
          } else {
            deliveryStatus = 'Chưa giao';
          }

          // 2. Xử lý Logic Xuất hóa đơn (Cột P & Cột J)
          let invoiceStatus = pStatus ? 'Đã xuất hóa đơn' : 'Chưa xuất hóa đơn';
          let invoiceDate = pStatus ? formatDate(colJ) : '';

          parsedItems.push({
            importDate: formatDate(colC),
            productCode: '', // Nhập thủ công sau
            productName: String(colD || '').trim(),
            quantity: isNaN(Number(colE)) ? 0 : Number(colE),
            customsDeclarationNo: String(colB || '').trim(),
            exportUnit: String(colF || '').trim(),
            deliveryStatus: deliveryStatus,
            invoiceStatus: invoiceStatus,
            invoiceDate: invoiceDate
          });
        }

        if (parsedItems.length === 0) {
          alert('Không tìm thấy dữ liệu phù hợp trong file Excel!');
          return;
        }

        setItems(parsedItems);
        await supabase.from('inventory').insert(parsedItems);
        alert(`Đã Import thành công ${parsedItems.length} dòng dữ liệu!`);
      } catch (err) {
        console.error('Lỗi đọc file Excel:', err);
        alert('Có lỗi xảy ra khi đọc file Excel!');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Đổi trạng thái Hóa đơn thủ công
  const toggleInvoiceStatus = async (index) => {
    const updatedItems = [...items];
    const item = updatedItems[index];

    if (item.invoiceStatus === 'Chưa xuất hóa đơn') {
      item.invoiceStatus = 'Đã xuất hóa đơn';
      const today = new Date();
      item.invoiceDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    } else {
      item.invoiceStatus = 'Chưa xuất hóa đơn';
      item.invoiceDate = '';
    }

    setItems(updatedItems);
    if (item.id) {
      await supabase.from('inventory').update({
        invoiceStatus: item.invoiceStatus,
        invoiceDate: item.invoiceDate
      }).eq('id', item.id);
    }
  };

  // Đổi trạng thái Giao hàng thủ công
  const toggleDeliveryStatus = async (index) => {
    const updatedItems = [...items];
    const item = updatedItems[index];
    item.deliveryStatus = item.deliveryStatus === 'Đã giao' ? 'Chưa giao' : 'Đã giao';
    
    setItems(updatedItems);
    if (item.id) {
      await supabase.from('inventory').update({
        deliveryStatus: item.deliveryStatus
      }).eq('id', item.id);
    }
  };

  // Nhập dữ liệu thủ công
  const handleAddManual = async (e) => {
    e.preventDefault();
    const newItem = {
      ...formData,
      deliveryStatus: 'Chưa giao', // Auto Chưa giao khi nhập thủ công
      invoiceDate: formData.invoiceStatus === 'Đã xuất hóa đơn' ? formData.invoiceDate : ''
    };

    setItems([newItem, ...items]);
    await supabase.from('inventory').insert([newItem]);
    setShowModal(false);
    setFormData({
      importDate: new Date().toLocaleDateString('vi-VN'),
      productCode: '',
      productName: '',
      quantity: 1,
      customsDeclarationNo: '',
      exportUnit: '',
      deliveryStatus: 'Chưa giao',
      invoiceStatus: 'Chưa xuất hóa đơn',
      invoiceDate: ''
    });
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Quản Lý Nhập Kho</h1>
        
        <div className="flex items-center gap-3">
          <label className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium shadow cursor-pointer text-sm flex items-center gap-2">
            📥 Import Excel
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow text-sm"
          >
            + Nhập Thủ Công
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
          <thead className="bg-gray-100 font-semibold text-gray-700">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">Ngày Nhập Kho</th>
              <th className="px-4 py-3 whitespace-nowrap">Số TK Nhập Khẩu</th>
              <th className="px-4 py-3 whitespace-nowrap">Mã Hàng</th>
              <th className="px-4 py-3 whitespace-nowrap">Tên Sản Phẩm</th>
              <th className="px-4 py-3 whitespace-nowrap">Số Lượng</th>
              <th className="px-4 py-3 whitespace-nowrap">Đơn Vị Xuất</th>
              <th className="px-4 py-3 whitespace-nowrap">Giao Hàng</th>
              <th className="px-4 py-3 whitespace-nowrap">Trạng Thái Hóa Đơn</th>
              <th className="px-4 py-3 whitespace-nowrap">Ngày Xuất Hóa Đơn</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="9" className="px-6 py-4 text-center text-gray-500">Đang tải dữ liệu...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-4 text-center text-gray-500">Chưa có dữ liệu nhập kho.</td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">{item.importDate}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{item.customsDeclarationNo}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <input
                      type="text"
                      value={item.productCode || ''}
                      placeholder="Nhập mã"
                      onChange={(e) => {
                        const updated = [...items];
                        updated[index].productCode = e.target.value;
                        setItems(updated);
                      }}
                      className="border rounded px-2 py-1 text-xs w-24"
                    />
                  </td>
                  <td className="px-4 py-3">{item.productName}</td>
                  <td className="px-4 py-3 font-semibold text-center whitespace-nowrap">{item.quantity}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{item.exportUnit}</td>
                  
                  {/* Trạng thái Giao Hàng */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => toggleDeliveryStatus(index)}
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        item.deliveryStatus === 'Đã giao' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {item.deliveryStatus}
                    </button>
                  </td>

                  {/* Trạng thái Hóa Đơn */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => toggleInvoiceStatus(index)}
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        item.invoiceStatus === 'Đã xuất hóa đơn' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {item.invoiceStatus}
                    </button>
                  </td>

                  {/* Ngày Xuất Hóa Đơn */}
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                    {item.invoiceDate || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nhập Thủ Công */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Thêm Dữ Liệu Nhập Kho Thủ Công</h2>
            <form onSubmit={handleAddManual} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700">Ngày nhập kho</label>
                <input
                  type="text"
                  value={formData.importDate}
                  onChange={(e) => setFormData({ ...formData, importDate: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-md text-sm"
                  placeholder="d/m/yyyy"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Số TK Nhập khẩu</label>
                <input
                  type="text"
                  value={formData.customsDeclarationNo}
                  onChange={(e) => setFormData({ ...formData, customsDeclarationNo: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Mã hàng</label>
                <input
                  type="text"
                  value={formData.productCode}
                  onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Tên sản phẩm</label>
                <input
                  type="text"
                  required
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-md text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Số lượng</label>
                  <input
                    type="number"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="mt-1 w-full p-2 border rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Đơn vị xuất</label>
                  <input
                    type="text"
                    value={formData.exportUnit}
                    onChange={(e) => setFormData({ ...formData, exportUnit: e.target.value })}
                    className="mt-1 w-full p-2 border rounded-md text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100 text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Lưu Nhập Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
