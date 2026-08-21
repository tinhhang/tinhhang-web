export default function Home({ lang }) {
  const t = {
    VN: {
      title: 'Bảng Điều Khiển & Cảnh Báo',
      alert1: 'Cảnh Báo Giao Chậm (0)',
      desc1: 'Các PO đã quá hạn giao hàng nhưng chưa hoàn thành.',
      alert2: 'Chưa Nhận Chứng Từ (0)',
      desc2: 'Các đơn sản xuất chưa cập nhật chứng từ kèm theo.',
      alert3: 'Quá 3 Ngày Chưa Xuống Đơn (0)',
      desc3: 'Đơn hàng tồn đọng quá 3 ngày chưa chuyển thành đơn sản xuất.',
    },
    CN: {
      title: '概览与预警',
      alert1: '交货延迟预警 (0)',
      desc1: '已超过交货日期但未完成的 PO。',
      alert2: '未接收单据 (0)',
      desc2: '未更新附带单据的生产单。',
      alert3: '超过 3 天未下发生产单 (0)',
      desc3: '积压超过 3 天未转为生产单的订单。',
    }
  }[lang || 'VN'];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{t.title}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-lg shadow border-l-4 border-red-500">
          <h2 className="font-semibold text-lg text-red-700 flex items-center gap-2">
            🚨 {t.alert1}
          </h2>
          <p className="text-sm text-gray-600 mt-2">{t.desc1}</p>
        </div>

        <div className="bg-white p-5 rounded-lg shadow border-l-4 border-yellow-500">
          <h2 className="font-semibold text-lg text-yellow-700 flex items-center gap-2">
            📄 {t.alert2}
          </h2>
          <p className="text-sm text-gray-600 mt-2">{t.desc2}</p>
        </div>

        <div className="bg-white p-5 rounded-lg shadow border-l-4 border-orange-500">
          <h2 className="font-semibold text-lg text-orange-700 flex items-center gap-2">
            ⏳ {t.alert3}
          </h2>
          <p className="text-sm text-gray-600 mt-2">{t.desc3}</p>
        </div>
      </div>
    </div>
  );
}
