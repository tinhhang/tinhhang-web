import { useState } from 'react';
import Link from 'next/link';
import 'tailwindcss/tailwind.css';

export default function App({ Component, pageProps }) {
  const [lang, setLang] = useState('VN'); // VN | CN

  const t = {
    VN: {
      title: 'CÔNG TY TNHH MÁY MÓC TINH HẰNG VIỆT NAM',
      dashboard: 'Tổng quan & Cảnh báo',
      po: 'Quản lý PO',
      ocr: 'Đơn sản xuất (AI OCR)',
      inventory: 'Nhập & Tồn kho',
      delivery: 'In Biên bản giao hàng',
    },
    CN: {
      title: '越南精恒机械有限公司',
      dashboard: '概览与预警',
      po: 'PO 管理',
      ocr: '生产单 (AI OCR)',
      inventory: '入库与库存',
      delivery: '打印送货单',
    }
  }[lang];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Header ngang */}
      <header className="bg-blue-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-lg tracking-wide">{t.title}</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setLang(lang === 'VN' ? 'CN' : 'VN')}
              className="bg-blue-800 hover:bg-blue-700 px-3 py-1 rounded border border-blue-600 text-sm font-semibold"
            >
              🌐 {lang === 'VN' ? '中文' : 'Tiếng Việt'}
            </button>
          </div>
        </div>
        {/* Navigation bar */}
        <nav className="bg-blue-800 border-t border-blue-700">
          <div className="max-w-7xl mx-auto px-4 flex space-x-6 text-sm font-medium py-2">
            <Link href="/" className="hover:text-blue-200">{t.dashboard}</Link>
            <Link href="/po-management" className="hover:text-blue-200">{t.po}</Link>
            <Link href="/production-ocr" className="hover:text-blue-200">{t.ocr}</Link>
            <Link href="/inventory" className="hover:text-blue-200">{t.inventory}</Link>
            <Link href="/delivery-note" className="hover:text-blue-200">{t.delivery}</Link>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <Component {...pageProps} lang={lang} />
      </main>
    </div>
  );
}
