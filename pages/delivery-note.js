import { useState } from 'react';

export default function DeliveryNote({ lang }) {
  const [customer, setCustomer] = useState({ name: 'CÔNG TY TNHH PEGATRON VIỆT NAM', address: 'KCN Đình Vũ, Hải Phòng', phone: '0123456789' });
  const [items, setItems] = useState([
    { id: 1, name: 'Bộ Trục Vít 35mm', unit: 'Bộ', qty: 10, note: 'Hàng mới' },
    { id: 2, name: 'Xilanh Nhiệt 45mm', unit: 'Cái', qty: 5, note: 'Kèm chứng từ' }
  ]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="mb-4 flex justify-between items-center no-print">
        <h1 className="text-xl font-bold">Màn Hình In Biên Bản Giao Hàng (A4)</h1>
        <button
          onClick={handlePrint}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded shadow"
        >
          🖨️ In Biên Bản (A4)
        </button>
      </div>

      {/* Khung A4 Chuẩn */}
      <div className="bg-white p-8 max-w-[210mm] mx-auto shadow-lg border print:shadow-none print:border-none print:p-0">
        <style jsx global>{`
          @media print {
            .no-print { display: none !important; }
            body { background: white; margin: 0; }
            @page { size: A4; margin: 20mm 15mm; }
          }
        `}</style>

        {/* Header Công ty */}
        <div className="border-b-2 border-gray-800 pb-4 mb-4 text-center">
          <h2 className="text-xl font-bold uppercase">CÔNG TY TNHH MÁY MÓC TINH HẰNG VIỆT NAM</h2>
          <p className="text-sm">Địa chỉ: KCN Yên Phong, Bắc Ninh | Hotline: 0988.xxx.xxx</p>
          <h1 className="text-2xl font-extrabold uppercase mt-4 tracking-wider">BIÊN BẢN GIAO HÀNG</h1>
          <p className="text-xs italic">Ngày ...... tháng ...... năm 202...</p>
        </div>

        {/* Thông tin khách hàng */}
        <div className="text-sm space-y-1 mb-6">
          <p><strong>Đơn vị nhận hàng:</strong> {customer.name}</p>
          <p><strong>Địa chỉ:</strong> {customer.address}</p>
          <p><strong>Số điện thoại:</strong> {customer.phone}</p>
        </div>

        {/* Bảng hàng hóa */}
        <table className="w-full border-collapse border border-gray-800 text-sm mb-8">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-800">
              <th className="border border-gray-800 p-2 text-center w-12">STT</th>
              <th className="border border-gray-800 p-2 text-left">Tên Sản Phẩm / Quy Cách</th>
              <th className="border border-gray-800 p-2 text-center w-20">ĐVT</th>
              <th className="border border-gray-800 p-2 text-center w-20">Số Lượng</th>
              <th className="border border-gray-800 p-2 text-left w-32">Ghi Chú</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id}>
                <td className="border border-gray-800 p-2 text-center">{idx + 1}</td>
                <td className="border border-gray-800 p-2">{item.name}</td>
                <td className="border border-gray-800 p-2 text-center">{item.unit}</td>
                <td className="border border-gray-800 p-2 text-center font-bold">{item.qty}</td>
                <td className="border border-gray-800 p-2">{item.note}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Khung Ký tên */}
        <div className="grid grid-cols-2 text-center text-sm font-bold mt-12">
          <div>
            <p>ĐẠI DIỆN BÊN GIAO</p>
            <p className="text-xs font-normal italic mt-1">(Ký, ghi rõ họ tên)</p>
            <div className="h-20"></div>
          </div>
          <div>
            <p>ĐẠI DIỆN BÊN NHẬN</p>
            <p className="text-xs font-normal italic mt-1">(Ký, ghi rõ họ tên)</p>
            <div className="h-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
