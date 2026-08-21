// 1. Import Excel và LƯU TRỰC TIẾP VÀO SUPABASE
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

          if (!colD || String(colD).trim().toUpperCase() === 'TÊN SẢN PHẨM' || String(colD).trim().toUpperCase() === 'TÊN HÀNG') {
            continue;
          }

          const pStatus = String(colP).trim().toLowerCase() === 'true' || colP === true;
          const hasDateG = colG && String(colG).trim() !== '';
          let isDelivered = false;
          
          if (pStatus || (!pStatus && hasDateG)) {
            isDelivered = true;
          }

          let invoiceStatus = pStatus ? 'Đã xuất hóa đơn' : 'Chưa xuất hóa đơn';
          let invoiceDate = pStatus ? formatDate(colJ) : '';

          // Ánh xạ đúng tên cột trong bảng inventory_import của Supabase
          parsedItems.push({
            import_date: formatDate(colC),
            product_code: '', 
            product_name: String(colD || '').trim(),
            quantity: isNaN(Number(colE)) ? 0 : Number(colE),
            import_declaration_no: String(colB || '').trim(),
            export_unit: String(colF || '').trim(),
            delivery_status: isDelivered, // Cột bool trên DB
            invoice_status: invoiceStatus,
            invoice_date: invoiceDate
          });
        }

        if (parsedItems.length === 0) {
          alert('Không tìm thấy dữ liệu phù hợp trong file Excel!');
          setLoading(false);
          return;
        }

        // Đẩy toàn bộ dữ liệu vào bảng inventory_import
        const { error } = await supabase.from('inventory_import').insert(parsedItems);
        
        if (error) {
          console.error('Lỗi khi lưu vào DB:', error);
          alert('Lỗi lưu vào CSDL: ' + error.message);
        } else {
          alert(`Đã Import thành công ${parsedItems.length} dòng dữ liệu!`);
          await fetchInventory(); // Tải lại dữ liệu thực tế từ DB lên UI
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

  // 2. Cập nhật Mã hàng trực tiếp lên Supabase
  const handleProductCodeChange = async (index, value) => {
    const updatedItems = [...items];
    updatedItems[index].productCode = value;
    setItems(updatedItems);

    const item = updatedItems[index];
    if (item.id) {
      await supabase.from('inventory_import').update({ product_code: value }).eq('id', item.id);
    }
  };

  // 3. Đổi trạng thái Hóa đơn & lưu DB
  const toggleInvoiceStatus = async (index) => {
    const updatedItems = [...items];
    const item = updatedItems[index];

    if (item.invoiceStatus === 'Chưa xuất hóa đơn' || item.invoice_status === 'Chưa xuất hóa đơn') {
      item.invoiceStatus = 'Đã xuất hóa đơn';
      item.invoice_status = 'Đã xuất hóa đơn';
      const today = new Date();
      item.invoiceDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
      item.invoice_date = item.invoiceDate;
    } else {
      item.invoiceStatus = 'Chưa xuất hóa đơn';
      item.invoice_status = 'Chưa xuất hóa đơn';
      item.invoiceDate = '';
      item.invoice_date = '';
    }

    setItems(updatedItems);
    if (item.id) {
      await supabase.from('inventory_import').update({
        invoice_status: item.invoice_status || item.invoiceStatus,
        invoice_date: item.invoice_date || item.invoiceDate
      }).eq('id', item.id);
    }
  };

  // 4. Đổi trạng thái Giao hàng & lưu DB
  const toggleDeliveryStatus = async (index) => {
    const updatedItems = [...items];
    const item = updatedItems[index];
    
    // Đảo ngược trạng thái
    const currentStatus = item.delivery_status !== undefined ? item.delivery_status : (item.deliveryStatus === 'Đã giao');
    const newStatus = !currentStatus;

    item.delivery_status = newStatus;
    item.deliveryStatus = newStatus ? 'Đã giao' : 'Chưa giao';
    
    setItems(updatedItems);
    if (item.id) {
      await supabase.from('inventory_import').update({
        delivery_status: newStatus
      }).eq('id', item.id);
    }
  };

  // 5. Nhập dữ liệu thủ công & lưu DB
  const handleAddManual = async (e) => {
    e.preventDefault();
    const newItem = {
      import_date: formData.importDate,
      product_code: formData.productCode,
      product_name: formData.productName,
      quantity: formData.quantity,
      import_declaration_no: formData.customsDeclarationNo,
      export_unit: formData.exportUnit,
      delivery_status: false,
      invoice_status: formData.invoiceStatus,
      invoice_date: formData.invoiceStatus === 'Đã xuất hóa đơn' ? formData.invoiceDate : ''
    };

    const { error } = await supabase.from('inventory_import').insert([newItem]);
    if (error) {
      alert('Lỗi khi thêm mới: ' + error.message);
    } else {
      await fetchInventory(); // Load lại dữ liệu thực tế từ DB
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
    }
  };
