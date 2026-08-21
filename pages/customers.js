import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabaseClient';

export default function Customers({ lang }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  const t = {
    VN: { title: 'Quản lý Danh mục Khách hàng', add: '+ Thêm khách hàng thủ công', import: '📁 Import từ Excel lên Supabase', search: 'Tìm kiếm theo tên khách hàng...', stt: 'STT', code: 'Mã Khách Hàng', name: 'Tên Khách Hàng / Công Ty', address: 'Địa chỉ', tax: 'Mã số thuế', rep: 'Người đại diện', phone: 'Số điện thoại', action: 'Thao tác' },
    CN: { title: '客户管理', add: '+ 手动添加客户', import: '📁 导入 Excel 到 Supabase', search: '按名称搜索...', stt: '序号', code: '客户代码', name: '客户/公司名称', address: '地址', tax: '税号', rep: '法人代表', phone: '电话', action: '操作' }
  }[lang];

  // Tải danh sách khách hàng từ Supabase khi mở trang
  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('customers').select('*').order('id', { ascending: false });
    if (error) {
      console.error('Lỗi tải khách hàng:', error.message);
    } else if (data) {
      setCustomers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Xử lý Import Excel và lưu thẳng lên Supabase
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });

        // Ánh xạ các cột A-F theo đúng yêu cầu của bà:
        // A: customer_code, B: customer_name, C: address, D: tax_code, E: representative, F: phone
        const imported = rawData.slice(1).filter(row => row[0] || row[1]).map(row => ({
          customer_code: String(row[0] || '').trim(),
          customer_name: String(row[1] || '').trim(),
          address: String(row[2] || '').trim(),
          tax_code: String(row[3] || '').trim(),
          representative: String(row[4] || '').trim(),
          phone: String(row[5] || '').trim()
        }));

        if (imported.length === 0) {
          alert('Không tìm thấy dữ liệu hợp lệ trong file Excel.');
          return;
        }

        // Đẩy lên Supabase (dùng upsert để nếu trùng mã thì cập nhật luôn hoặc insert mới)
        const { error } = await supabase.from('customers').upsert(imported, { onConflict: 'customer_code' });

        if (error) {
          alert('Lỗi khi lưu lên Supabase: ' + error.message);
        } else {
          alert(`Đã import và lưu thành công ${imported.length} khách hàng lên Supabase!`);
          await fetchCustomers(); // Tải lại danh sách
        }
      } catch (error) {
        console.error("Lỗi đọc file:", error);
        alert('Lỗi đọc file Excel, vui lòng kiểm tra lại định dạng.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  // Xóa khách hàng trên Supabase
  const handleDelete = async (id) => {
    if (!confirm('Bà có chắc muốn xóa khách hàng này không?')) return;
    
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) {
      alert('Lỗi khi xóa: ' + error.message);
    } else {
      alert('Đã xóa thành công!');
      await fetchCustomers();
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t.title}</h1>
      
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => {
            // Thêm thủ công mẫu nhanh gọn
            const code = prompt("Nhập mã khách hàng:");
            if (!code) return;
            const name = prompt("Nhập tên công ty/khách hàng:");
            supabase.from('customers').insert([{ customer_code: code, customer_name: name }]).then(({ error }) => {
              if (error) alert('Lỗi: ' + error.message);
              else { alert('Thêm thành công!'); fetchCustomers(); }
            });
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {t.add}
        </button>

        <label className="bg-green-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-green-700 flex items-center gap-2">
          {t.import}
          <input type="file" onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls" />
        </label>
      </div>

      {loading && <p>Đang tải dữ liệu từ cơ sở dữ liệu...</p>}

      <table className="w-full bg-white shadow-md rounded-lg overflow-hidden border-collapse">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-3 border">STT</th>
            <th className="p-3 border">{t.code}</th>
            <th className="p-3 border">{t.name}</th>
            <th className="p-3 border">{t.address}</th>
            <th className="p-3 border">{t.tax}</th>
            <th className="p-3 border">{t.rep}</th>
            <th className="p-3 border">{t.phone}</th>
            <th className="p-3 border">{t.action}</th>
          </tr>
        </thead>
        <tbody>
          {customers.length > 0 ? (
            customers.map((c, i) => (
              <tr key={c.id || i} className="border-t hover:bg-gray-50">
                <td className="p-3 border">{i + 1}</td>
                <td className="p-3 border font-semibold">{c.customer_code || c.code}</td>
                <td className="p-3 border">{c.customer_name || c.name}</td>
                <td className="p-3 border">{c.address}</td>
                <td className="p-3 border">{c.tax_code || c.taxCode}</td>
                <td className="p-3 border">{c.representative}</td>
                <td className="p-3 border">{c.phone}</td>
                <td className="p-3 border text-red-500 cursor-pointer hover:underline" onClick={() => handleDelete(c.id)}>
                  Xóa
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="8" className="p-6 text-center text-gray-400">Chưa có dữ liệu khách hàng trên hệ thống</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
