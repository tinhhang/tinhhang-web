const handleParsePdf = async (pdfUrl) => {
  try {
    const response = await fetch(pdfUrl);
    const blob = await response.blob();

    const base64Pdf = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const res = await fetch('/api/parse-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Pdf })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Lỗi server");

    console.log("Đọc PDF thành công:", result);
    // Đưa dữ liệu trích xuất được vào form giao diện của bà ở đây, ví dụ:
    // setFormData(result);

  } catch (err) {
    alert("Không đọc được PDF: " + err.message);
  }
};
