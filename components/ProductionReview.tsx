const handleParsePdf = async (pdfUrl) => {
  try {
    // Bước 1: Tải file từ Supabase về trình duyệt trước
    const response = await fetch(pdfUrl);
    const blob = await response.blob();
    
    // Bước 2: Chuyển file sang dạng Base64
    const base64data = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    });
    
    // Bước 3: Gửi cục Base64 đó lên API thay vì gửi URL
    const res = await fetch('/api/parse-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Pdf: base64data })
    });
    
    const result = await res.json();
    
    // Ở đây bà xử lý kết quả nhận được (đổ vào form)
    console.log("Kết quả từ AI:", result);
    // Ví dụ: setFormData(result); 
    
  } catch (err) {
    alert("Lỗi đọc file: " + err.message);
  }
};
