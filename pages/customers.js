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

        // Ánh xạ các cột A-F
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

        // Dùng insert thông từng dòng hoặc gửi nguyên cục mà không dùng onConflict khắt khe
        const { error } = await supabase.from('customers').insert(imported);

        if (error) {
          // Nếu lỗi do trùng lặp khóa chính/mã khách hàng, ta thử thông báo cụ thể
          alert('Lỗi khi lưu lên Supabase (Có thể mã khách hàng bị trùng): ' + error.message);
        } else {
          alert(`Đã import và lưu thành công ${imported.length} khách hàng lên Supabase!`);
          await fetchCustomers();
        }
      } catch (error) {
        console.error("Lỗi đọc file:", error);
        alert('Lỗi đọc file Excel, vui lòng kiểm tra lại định dạng.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };
