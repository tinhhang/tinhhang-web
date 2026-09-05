import React, { useState } from 'react';
import Head from 'next/head';

export default function PoManagement() {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    ma_don_hang: '',
    ngay_xuong_don: '',
    ma_khach_hang: '',
    items: [
      {
        ma_hang: '',
        ten_san_pham: '',
        quy_cach: '',
        so_luong: '',
        chat_lieu: '',
        ghi_chu: ''
      }
    ]
  });

  // ==========================================
  // THÊM DÒNG SẢN PHẨM
  // ==========================================
  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          ma_hang: '',
          ten_san_pham: '',
          quy_cach: '',
          so_luong: '',
          chat_lieu: '',
          ghi_chu: ''
        }
      ]
    });
  };

  // ==========================================
  // XÓA DÒNG SẢN PHẨM
  // ==========================================
  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);

    setFormData({
      ...formData,
      items: newItems
    });
  };

  // ==========================================
  // THAY ĐỔI DỮ LIỆU TRONG DÒNG SẢN PHẨM
  // ==========================================
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];

    newItems[index] = {
      ...newItems[index],
      [field]: value
    };

    setFormData({
      ...formData,
      items: newItems
    });
  };

  // ==========================================
  // ĐỌC FILE PDF BẰNG AI
  // ==========================================
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    // Kiểm tra định dạng file
    if (file.type !== 'application/pdf') {
      alert('Vui lòng chọn file PDF.');
      event.target.value = null;
      return;
    }

    setLoading(true);

    try {
      // ========================================
      // BƯỚC 1: ĐỌC FILE PDF
      // ========================================

      const base64Pdf = await new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          try {
            const result = reader.result;

            if (typeof result !== 'string') {
              reject(new Error('Không thể đọc file PDF.'));
              return;
            }

            /*
              FileReader.readAsDataURL() sẽ trả về dạng:

              data:application/pdf;base64,JVBERi0xLjQ...

              API chỉ cần phần Base64 phía sau dấu phẩy.
            */

            const base64 = result.includes(',')
              ? result.split(',')[1]
              : result;

            if (!base64) {
              reject(new Error('Không lấy được dữ liệu Base64 của PDF.'));
              return;
            }

            resolve(base64);
          } catch (error) {
            reject(error);
          }
        };

        reader.onerror = () => {
          reject(new Error('Không thể đọc file PDF.'));
        };

        reader.readAsDataURL(file);
      });

      console.log(
        'PDF đã chuyển sang Base64. Độ dài:',
        base64Pdf.length
      );

      // ========================================
      // BƯỚC 2: GỬI PDF ĐẾN API
      // ========================================

    const res = await fetch('/api/parse-pdf', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    base64Pdf: base64Pdf   // thay vì pdfUrl
  })
});

      // ========================================
      // BƯỚC 3: ĐỌC KẾT QUẢ API
      // ========================================

      let data;

      try {
        data = await res.json();
      } catch (jsonError) {
        throw new Error(
          'Server không trả về dữ liệu JSON hợp lệ.'
        );
      }

      console.log(
        'Dữ liệu AI trả về:',
        data
      );

      if (!res.ok) {
        throw new Error(
          data?.error ||
          'Lỗi xử lý PDF từ server.'
        );
      }

      // ========================================
      // BƯỚC 4: KIỂM TRA DỮ LIỆU AI
      // ========================================

      if (!data || typeof data !== 'object') {
        throw new Error(
          'AI không trả về dữ liệu hợp lệ.'
        );
      }

      // ========================================
      // BƯỚC 5: XỬ LÝ DANH SÁCH SẢN PHẨM
      // ========================================

      let parsedItems = [];

      if (Array.isArray(data.items)) {
        parsedItems = data.items.map((item) => ({
          ma_hang:
            typeof item?.ma_hang === 'string'
              ? item.ma_hang
              : '',

          ten_san_pham:
            typeof item?.ten_san_pham === 'string'
              ? item.ten_san_pham
              : '',

          quy_cach:
            typeof item?.quy_cach === 'string'
              ? item.quy_cach
              : '',

          so_luong:
            typeof item?.so_luong === 'string'
              ? item.so_luong
              : '',

          chat_lieu:
            typeof item?.chat_lieu === 'string'
              ? item.chat_lieu
              : '',

          ghi_chu:
            typeof item?.ghi_chu === 'string'
              ? item.ghi_chu
              : ''
        }));
      }

      // ========================================
      // BƯỚC 6: NẾU AI KHÔNG ĐỌC ĐƯỢC ITEMS
      // ========================================

      if (parsedItems.length === 0) {
        parsedItems = [
          {
            ma_hang: '',
            ten_san_pham: '',
            quy_cach: '',
            so_luong: '',
            chat_lieu: '',
            ghi_chu: ''
          }
        ];
      }

      // ========================================
      // BƯỚC 7: ĐƯA DỮ LIỆU AI VÀO FORM
      // ========================================

      setFormData({
        ma_don_hang:
          typeof data.ma_don_hang === 'string'
            ? data.ma_don_hang
            : '',

        ngay_xuong_don:
          typeof data.ngay_xuong_don === 'string'
            ? data.ngay_xuong_don
            : '',

        ma_khach_hang:
          typeof data.ma_khach_hang === 'string'
            ? data.ma_khach_hang
            : '',

        items: parsedItems
      });

      // ========================================
      // THÔNG BÁO KẾT QUẢ
      // ========================================

      alert(
        `AI đã bóc tách đơn hàng thành công!\n\nĐã đọc ${parsedItems.length} dòng sản phẩm.`
      );

    } catch (err) {
      console.error(
        'Lỗi đọc file PDF:',
        err
      );

      alert(
        'Lỗi đọc file PDF: ' +
        (err?.message || 'Không xác định')
      );

    } finally {
      setLoading(false);

      // Cho phép chọn lại chính file vừa chọn
      event.target.value = null;
    }
  };

  return (
    <div
      style={{
        padding: '24px',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '1200px',
        margin: '0 auto'
      }}
    >
      <Head>
        <title>Quản lý Đơn hàng - Tỉnh Hằng</title>
      </Head>

      <h1
        style={{
          color: '#333',
          fontSize: '24px',
          marginBottom: '20px'
        }}
      >
        Quản lý Đơn hàng & Bóc tách PDF
      </h1>

      {/* ==========================================
          UPLOAD PDF
          ========================================== */}

      <div
        style={{
          marginBottom: '20px',
          padding: '15px',
          background: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}
      >
        <label
          style={{
            display: 'block',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}
        >
          Chọn file PDF đơn hàng từ máy tính:
        </label>

        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileUpload}
          disabled={loading}
          style={{
            padding: '8px',
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            width: '100%'
          }}
        />

        {loading && (
          <p
            style={{
              color: '#7c3aed',
              marginTop: '8px',
              fontWeight: 'bold'
            }}
          >
            ⏳ AI đang đọc bảng đơn hàng, vui lòng đợi chút...
          </p>
        )}
      </div>

      {/* ==========================================
          THÔNG TIN ĐƠN HÀNG
          ========================================== */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '15px',
          marginBottom: '20px'
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              marginBottom: '5px'
            }}
          >
            Mã đơn hàng
          </label>

          <input
            type="text"
            value={formData.ma_don_hang}
            onChange={(e) =>
              setFormData({
                ...formData,
                ma_don_hang: e.target.value
              })
            }
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              marginBottom: '5px'
            }}
          >
            Ngày xuống đơn
          </label>

          <input
            type="date"
            value={formData.ngay_xuong_don}
            onChange={(e) =>
              setFormData({
                ...formData,
                ngay_xuong_don: e.target.value
              })
            }
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              marginBottom: '5px'
            }}
          >
            Mã khách hàng
          </label>

          <input
            type="text"
            value={formData.ma_khach_hang}
            onChange={(e) =>
              setFormData({
                ...formData,
                ma_khach_hang: e.target.value
              })
            }
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
        </div>
      </div>

      {/* ==========================================
          DANH SÁCH HÀNG
          ========================================== */}

      <h3
        style={{
          fontSize: '18px',
          marginTop: '30px',
          marginBottom: '10px'
        }}
      >
        Chi tiết danh sách hàng
      </h3>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: '15px'
        }}
      >
        <thead>
          <tr
            style={{
              background: '#f3f4f6',
              textAlign: 'left'
            }}
          >
            <th
              style={{
                padding: '10px',
                border: '1px solid #ddd'
              }}
            >
              Mã hàng
            </th>

            <th
              style={{
                padding: '10px',
                border: '1px solid #ddd'
              }}
            >
              Sản phẩm
            </th>

            <th
              style={{
                padding: '10px',
                border: '1px solid #ddd'
              }}
            >
              Quy cách
            </th>

            <th
              style={{
                padding: '10px',
                border: '1px solid #ddd'
              }}
            >
              Số lượng
            </th>

            <th
              style={{
                padding: '10px',
                border: '1px solid #ddd'
              }}
            >
              Chất liệu
            </th>

            <th
              style={{
                padding: '10px',
                border: '1px solid #ddd',
                width: '80px'
              }}
            >
              Thao tác
            </th>
          </tr>
        </thead>

        <tbody>
          {formData.items.map((item, index) => (
            <tr key={index}>

              {/* MÃ HÀNG */}
              <td
                style={{
                  padding: '8px',
                  border: '1px solid #ddd'
                }}
              >
                <input
                  type="text"
                  value={item.ma_hang}
                  onChange={(e) =>
                    handleItemChange(
                      index,
                      'ma_hang',
                      e.target.value
                    )
                  }
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: 'none'
                  }}
                />
              </td>

              {/* TÊN SẢN PHẨM */}
              <td
                style={{
                  padding: '8px',
                  border: '1px solid #ddd'
                }}
              >
                <input
                  type="text"
                  value={item.ten_san_pham}
                  onChange={(e) =>
                    handleItemChange(
                      index,
                      'ten_san_pham',
                      e.target.value
                    )
                  }
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: 'none'
                  }}
                />
              </td>

              {/* QUY CÁCH */}
              <td
                style={{
                  padding: '8px',
                  border: '1px solid #ddd'
                }}
              >
                <input
                  type="text"
                  value={item.quy_cach}
                  onChange={(e) =>
                    handleItemChange(
                      index,
                      'quy_cach',
                      e.target.value
                    )
                  }
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: 'none'
                  }}
                />
              </td>

              {/* SỐ LƯỢNG */}
              <td
                style={{
                  padding: '8px',
                  border: '1px solid #ddd'
                }}
              >
                <input
                  type="text"
                  value={item.so_luong}
                  onChange={(e) =>
                    handleItemChange(
                      index,
                      'so_luong',
                      e.target.value
                    )
                  }
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: 'none'
                  }}
                />
              </td>

              {/* CHẤT LIỆU */}
              <td
                style={{
                  padding: '8px',
                  border: '1px solid #ddd'
                }}
              >
                <input
                  type="text"
                  value={item.chat_lieu}
                  onChange={(e) =>
                    handleItemChange(
                      index,
                      'chat_lieu',
                      e.target.value
                    )
                  }
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: 'none'
                  }}
                />
              </td>

              {/* THAO TÁC */}
              <td
                style={{
                  padding: '8px',
                  border: '1px solid #ddd',
                  textAlign: 'center'
                }}
              >
                {formData.items.length > 1 && (
                  <button
                    onClick={() =>
                      handleRemoveItem(index)
                    }
                    style={{
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Xóa
                  </button>
                )}
              </td>

            </tr>
          ))}
        </tbody>
      </table>

      {/* ==========================================
          THÊM DÒNG
          ========================================== */}

      <button
        onClick={handleAddItem}
        style={{
          padding: '8px 16px',
          background: '#10b981',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        + Thêm dòng
      </button>
    </div>
  );
}
