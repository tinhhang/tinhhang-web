import { useState } from 'react';
import * as XLSX from 'xlsx';

export default function Customers({ lang }) {
  const [customers, setCustomers] = useState([]);

  const t = {
    VN: { title: 'Quản lý Danh mục Khách hàng', add: '+ Thêm khách hàng thủ công', import: '📁 Import từ Excel', search: 'Tìm kiếm theo tên khách hàng...', stt: 'STT', code: 'Mã Khách Hàng', name: 'Tên Khách Hàng / Công Ty', address: 'Địa chỉ', tax: 'Mã số thuế', rep: 'Người đại diện', phone: 'Số điện thoại', action: 'Thao tác' },
    CN: { title: '客户管理', add: '+ 手动添加客户', import: '📁 从 Excel 导入', search: '按名称搜索...', stt: '序号', code: '客户代码', name: '客户/公司名称', address: '地址', tax: '税号', rep: '法人代表', phone: '电话', action: '操作' }
  }[lang];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });

        // Bỏ qua dòng tiêu đề (slice(1)) và ánh xạ cột A-F
        const imported = rawData.slice(1).filter(row => row[0] || row[1]).map(row => ({
          id: row[0] || '',
          name: row[1] || '',
          address: row[2] || '',
          taxCode: row[3] || '',
          representative: row[4] || '',
          phone: row[5] || ''
        }));

        setCustomers(prev => [...prev, ...imported]);
        alert(`Đã import thành công ${imported.length} khách hàng!`);
      } catch (error) {
        alert('Lỗi đọc file, vui lòng kiểm tra định dạng Excel.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t.title}</h1>
      
      <div className="flex gap-4 mb-6">
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">{t.add}</button>
        <label className="bg-green-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-green-700 flex items-center gap-2">
          {t.import}
          <input type="file" onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls" />
        </label>
        <input type="text" placeholder={t.search} className="border px-4 py-2 rounded flex-1" />
      </div>

      <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-3">{t.stt}</th>
            <th className="p-3">{t.code}</th>
            <th className="p-3">{t.name}</th>
            <th className="p-3">{t.address}</th>
            <th className="p-3">{t.tax}</th>
            <th className="p-3">{t.rep}</th>
            <th className="p-3">{t.phone}</th>
            <th className="p-3">{t.action}</th>
          </tr>
        </thead>
        <tbody>
          {customers.length > 0 ? (
            customers.map((c, i) => (
              <tr key={i} className="border-t">
                <td className="p-3">{i + 1}</td>
                <td className="p-3">{c.id}</td>
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.address}</td>
                <td className="p-3">{c.taxCode}</td>
                <td className="p-3">{c.representative}</td>
                <td className="p-3">{c.phone}</td>
                <td className="p-3 text-red-500 cursor-pointer">Xóa</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="8" className="p-6 text-center text-gray-400">Không tìm thấy dữ liệu</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
