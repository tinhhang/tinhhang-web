const handleParsePdf = async (pdfUrl) => {
  try {
    // 1. Tải file PDF từ URL Supabase về trình duyệt trước
    const response = await fetch(pdfUrl);
    const blob = await response.blob();

    // 2. Chuyển blob thành chuỗi Base64
    const base64Pdf = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Cắt bỏ phần header metadata của dataURL (ví dụ: "data:application/pdf;base64,")
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // 3. Gửi cục Base64 đó lên API của chúng ta
    const res = await fetch('/api/parse-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Pdf })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Lỗi server");

    console.log("Đọc PDF thành công:", result);
    // Đưa dữ liệu trích xuất được vào form giao diện của bà ở đây
    // Ví dụ: setFormData(result);

  } catch (err) {
    alert("Không đọc được PDF: " + err.message);
  }
};
