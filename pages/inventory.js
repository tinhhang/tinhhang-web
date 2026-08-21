import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabaseClient'; // BÀ KIỂM TRA ĐƯỜNG DẪN FILE SUPABASE CHO ĐÚNG NHÉ

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    importDate: new Date().toISOString().split('T')[0],
    productCode: '',
    productName: '',
    quantity: 1,
    customsDeclarationNo: '',
    exportUnit: '',
    deliveryStatus: 'Chưa giao',
    invoiceStatus: 'Chưa xuất hóa đơn',
    invoiceDate: ''
  });

  // 1. Chuẩn hóa ngày về định dạng ISO (YYYY-MM-DD) để lưu vào Supabase không bị lỗi out of range
  const formatDateForDB = (val) => {
    if (!val) return null;
    
    let d;
    if (val instanceof Date) {
      d = val;
    } else {
      const str = String(val).trim();
      if (!str) return null;
      
      const parts = str.split(/[\/\-]/);
      if (parts.length === 3) {
        const p1 = parseInt(parts[0], 10);
        const p2 = parseInt(parts[1], 10);
        const p3 = parseInt(parts[2], 10);
        
        // Nếu định dạng d/m/yyyy hoặc dd/mm/yyyy
        if (p3 > 1000) {
          const day = String(p1).padStart(2, '0');
          const month = String(p2).padStart(2, '0');
          return `${p3}-${month}-${day}`;
        }
      }
      d = new Date(str);
    }

    if (isNaN(d.getTime())) return null;

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  // 2. Format ngày hiển thị ra giao diện bảng (DD/MM/YYYY)
  const formatDateForDisplay = (val) => {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Tải dữ liệu từ Supabase khi mở trang
  const fetchInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inventory_import')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Lỗi lấy dữ liệu:', error.message);
    } else if (data) {
      const mappedData = data.map((item) => ({
        id: item.id,
        importDate: formatDateForDisplay(item.import_date),
        productCode: item.product_code,
        productName: item.product_name,
        quantity: item.quantity,
        customsDeclarationNo: item.import_declaration_no,
        exportUnit: item.export_unit,
        delivery_status: item.delivery_status,
        deliveryStatus: item.delivery_status ? 'Đã giao' : 'Chưa giao',
        invoice_status: item.invoice_status,
        invoiceStatus: item.invoice_status || 'Chưa xuất hóa đơn',
        invoice_date: item.invoice_date,
        invoiceDate: formatDateForDisplay(item.invoice_date)
      }));
      setItems(mappedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // 3. Import Excel và LƯU VÀO SUPABASE
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setLoading(true);
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const parsedItems = [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const colB = row[1];
          const colC = row[2];
          const colD = row[3];
          const colE = row[4];
          const colF = row[5];
          const colG = row[6];
          const colJ = row[9];
          const colP = row[15];

          if (
            !colD ||
            String(colD).trim().toUpperCase() === 'TÊN SẢN PHẨM' ||
            String(colD).trim().toUpperCase() === 'TÊN HÀNG'
          ) {
            continue;
          }

          const pStatus = String(colP).trim().toLowerCase() === 'true' || colP === true;
          const hasDateG = colG && String(colG).trim() !== '';
          let isDelivered = false;

          if (pStatus || (!pStatus && hasDateG)) {
            isDelivered = true;
          }

          let invoiceStatus = pStatus ? 'Đã xuất hóa đơn' : 'Chưa xuất hóa đơn';
          let invoiceDate = pStatus ? formatDateForDB(colJ) : null;

          parsedItems.push({
            import_date: formatDateForDB(colC),
            product_code: '',
            product_name: String(colD || '').trim(),
            quantity: isNaN(Number(colE)) ? 0 : Number(colE),
            import_declaration_no: String(colB || '').trim(),
            export_unit: String(colF || '').trim(),
            delivery_status: isDelivered,
            invoice_status: invoiceStatus,
            invoice_date: invoiceDate
          });
        }

        if (parsedItems.length === 0) {
          alert('Không tìm thấy dữ liệu phù hợp trong file Excel!');
          setLoading(false);
          return;
        }

        const { error } = await supabase.from('inventory_import').insert(parsedItems);

        if (error) {
          console.error('Lỗi khi lưu vào DB:', error);
          alert('Lỗi lưu vào CSDL: ' + error.message);
        } else {
          alert(`Đã Import thành công ${parsedItems.length} dòng dữ liệu!`);
          await fetchInventory();
        }
      } catch (err) {
        console.error('Lỗi đọc file Excel:', err);
        alert('Có lỗi xảy ra khi đọc file Excel!');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // 4. Cập nhật Mã hàng trực tiếp lên Supabase
  const handleProductCodeChange = async (index, value) => {
    const updatedItems = [...items];
    updatedItems[index].productCode = value;
    setItems(updatedItems);

    const item = updatedItems[index];
    if (item.id) {
      await supabase.from('inventory_import').update({ product_code: value }).eq('id', item.id);
    }
  };

  // 5. Đổi trạng thái Hóa đơn & lưu DB
  const toggleInvoiceStatus = async (index) => {
    const updatedItems = [...items];
    const item = updatedItems[index];

    let newInvoiceStatus = 'Chưa xuất hóa đơn';
    let newInvoiceDateForDB = null;
    let newInvoiceDateDisplay = '';

    if (item.invoiceStatus === 'Chưa xuất hóa đơn') {
      newInvoiceStatus = 'Đã xuất hóa đơn';
      const todayStr = new Date().toISOString().split('T')[0];
      newInvoiceDateForDB = todayStr;
      newInvoiceDateDisplay = formatDateForDisplay(todayStr);
    }

    item.invoiceStatus = newInvoiceStatus;
    item.invoice_status = newInvoiceStatus;
    item.invoiceDate = newInvoiceDateDisplay;
    item.invoice_date = newInvoiceDateForDB;

    setItems(updatedItems);

    if (item.id) {
      await supabase
        .from('inventory_import')
        .update({
          invoice_status: newInvoiceStatus,
          invoice_date: newInvoiceDateForDB
        })
        .eq('id', item.id);
    }
  };

  // 6. Đổi trạng thái Giao hàng & lưu DB
  const toggleDeliveryStatus = async (index) => {
    const updatedItems = [...items];
    const item = updatedItems[index];

    const currentStatus = item.delivery_status !== undefined ? item.delivery_status : item.deliveryStatus === 'Đã giao';
    const newStatus = !currentStatus;

    item.delivery_status = newStatus;
    item.deliveryStatus = newStatus ? 'Đã giao' : 'Chưa giao';

    setItems(updatedItems);

    if (item.id) {
      await supabase
        .from('inventory_import')
        .update({
          delivery_status: newStatus
        })
        .eq('id', item.id);
    }
  };

  // 7. Nhập dữ liệu thủ công & lưu DB
  const handleAddManual = async (e) => {
    e.preventDefault();
    const newItem = {
      import_date: formatDateForDB(formData.importDate),
      product_code: formData.productCode,
      product_name: formData.productName,
      quantity: formData.quantity,
      import_declaration_no: formData.customsDeclarationNo,
      export_unit: formData.exportUnit,
      delivery_status: false,
      invoice_status: formData.invoiceStatus,
      invoice_date: formData.invoiceStatus === 'Đã xuất hóa đơn' ? formatDateForDB(formData.invoiceDate) : null
    };

    const { error } = await supabase.from('inventory_import').insert([newItem]);
    if (error) {
      alert('Lỗi khi thêm mới: ' + error.message);
    } else {
      await fetchInventory();
      setShowModal(false);
      setFormData({
        importDate: new Date().toISOString().split('T')[0],
        productCode: '',
        productName: '',
        quantity: 1,
        customsDeclarationNo: '',
        exportUnit: '',
        deliveryStatus: 'Chưa giao',
        invoiceStatus: 'Chưa xuất hóa đơn',
        invoiceDate: ''
      });
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Quản lý Kho Nhập</h1>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
        <button onClick={() => setShowModal(true)}>+ Thêm mới thủ công</button>
      </div>

      {loading && <p>Đang tải dữ liệu...</p>}

      <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f2f2f2' }}>
            <th>STT</th>
            <th>Tờ khai</th>
            <th>Ngày nhập</th>
            <th>Mã sản phẩm</th>
            <th>Tên sản phẩm</th>
            <th>Số lượng</th>
            <th>Đơn vị xuất</th>
            <th>Trạng thái giao</th>
            <th>Trạng thái hóa đơn</th>
            <th>Ngày hóa đơn</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id || index}>
              <td>{index + 1}</td>
              <td>{item.customsDeclarationNo}</td>
              <td>{item.importDate}</td>
              <td>
                <input
                  type="text"
                  value={item.productCode || ''}
                  onChange={(e) => handleProductCodeChange(index, e.target.value)}
                  placeholder="Nhập mã..."
                />
              </td>
              <td>{item.productName}</td>
              <td>{item.quantity}</td>
              <td>{item.exportUnit}</td>
              <td>
                <button onClick={() => toggleDeliveryStatus(index)}>
                  {item.deliveryStatus}
                </button>
              </td>
              <td>
                <button onClick={() => toggleInvoiceStatus(index)}>
                  {item.invoiceStatus}
                </button>
              </td>
              <td>{item.invoiceDate}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '400px' }}>
            <h2>Thêm mới hàng hóa</h2>
            <form onSubmit={handleAddManual}>
              <div><label>Ngày nhập:</label><input type="date" value={formData.importDate} onChange={e => setFormData({...formData, importDate: e.target.value})} required /></div>
              <div><label>Số tờ khai:</label><input type="text" value={formData.customsDeclarationNo} onChange={e => setFormData({...formData, customsDeclarationNo: e.target.value})} required /></div>
              <div><label>Tên sản phẩm:</label><input type="text" value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} required /></div>
              <div><label>Mã sản phẩm:</label><input type="text" value={formData.productCode} onChange={e => setFormData({...formData, productCode: e.target.value})} /></div>
              <div><label>Số lượng:</label><input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} required /></div>
              <div><label>Đơn vị xuất:</label><input type="text" value={formData.exportUnit} onChange={e => setFormData({...formData, exportUnit: e.target.value})} /></div>
              <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                <button type="submit">Lưu</button>
                <button type="button" onClick={() => setShowModal(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
