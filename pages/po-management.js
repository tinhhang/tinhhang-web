<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hệ Thống Quản Lý Đơn Hàng & Kho Mở Rộng</title>
<style>
*{box-sizing:border-box}
body{margin:0;font-family:Arial,sans-serif;background:#f5f7fb;color:#1f2937}
header{height:60px;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 20px;box-shadow:0 2px 4px rgba(0,0,0,0.1)}
.logo{font-size:18px;font-weight:bold;display:flex;align-items:center;gap:8px}

nav.top-nav{background:#1e293b;display:flex;padding:0 10px;border-bottom:1px solid #334155}
.nav-item{position:relative;display:inline-block}
.nav-btn{background:transparent;color:#cbd5e1;border:0;padding:14px 18px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px}
.nav-btn:hover, .nav-item.active .nav-btn{background:#334155;color:#fff}
.dropdown{display:none;position:absolute;top:100%;left:0;background:#fff;min-width:240px;box-shadow:0 8px 16px rgba(0,0,0,0.15);border-radius:0 0 8px 8px;z-index:1000;overflow:hidden}
.dropdown button{width:100%;text-align:left;background:#fff;border:0;padding:12px 16px;color:#334155;cursor:pointer;font-size:13px;border-bottom:1px solid #f1f5f9}
.dropdown button:hover{background:#f1f5f9;color:#2563eb;font-weight:bold}
.nav-item:hover .dropdown{display:block}

.main{padding:24px;max-width:1450px;margin:0 auto}
h1{margin:0 0 18px;font-size:22px;color:#0f172a}
.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:18px}
.label{color:#64748b;font-size:13px}
.value{font-size:26px;font-weight:700;margin-top:8px}

.panel{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:18px;margin-top:18px}
.toolbar{display:flex;gap:10px;align-items:center;margin-bottom:14px;flex-wrap:wrap}
button.primary{background:#2563eb;color:#fff;border:0;border-radius:8px;padding:9px 14px;cursor:pointer;font-weight:600}
button.primary:hover{background:#1d4ed8}
button.secondary{background:#eef2ff;color:#3730a3;border:0;border-radius:8px;padding:9px 14px;cursor:pointer;font-weight:600}
button.secondary:hover{background:#e0e7ff}
button.danger{background:#ef4444;color:#fff;border:0;border-radius:6px;padding:6px 10px;cursor:pointer}
button.sm{padding:4px 8px;font-size:12px}

input,select{padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;background:#fff;outline:none}
input:focus,select:focus{border-color:#2563eb}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{padding:10px;border-bottom:1px solid #eef0f3;text-align:left;vertical-align:middle}
th{background:#f8fafc;color:#475569;font-weight:600}
tr:hover{background:#f8fafc}
.badge{display:inline-block;padding:4px 8px;border-radius:999px;font-size:12px;font-weight:600}
.badge-success{background:#dcfce7;color:#15803d}
.badge-pending{background:#ffedd5;color:#c2410c}
.badge-po{background:#e0e7ff;color:#3730a3}
.badge-gray{background:#f1f5f9;color:#475569}
.hidden{display:none!important}.empty{padding:35px;text-align:center;color:#64748b}

/* Printable Form UI */
.delivery-builder .formgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:12px}
.delivery-builder label{font-size:12px;color:#475569;display:flex;flex-direction:column;gap:5px}
.printable{max-width:900px;margin:20px auto;background:#fff;padding:30px;border:1px solid #e5e7eb;border-radius:8px}
.doc-head{text-align:center}.doc-head .vn{font-weight:700;font-size:11pt}.doc-head .sub{font-weight:700;font-size:11pt}.dots{margin:3px}.doc-head h2{font-size:16pt;margin:10px 0 2px}.doc-head .cn{font-size:14pt;font-weight:700}.date-line{text-align:left;font-style:italic;margin:12px 0 8px}

/* Căn lề thông tin chuẩn xác */
.party-block { margin-bottom: 12px; }
.info-row { display: grid; grid-template-columns: 85px 1fr; margin-bottom: 4px; line-height: 1.5; }
.info-row-multi { display: grid; grid-template-columns: 85px 1fr 90px 1fr; margin-bottom: 4px; line-height: 1.5; align-items: center; }
.info-label { font-weight: bold; }

.items{width:100%;border-collapse:collapse;margin-top:15px}.items th,.items td{border:1px solid #333;padding:8px;text-align:center}

/* Modal UI */
.modal{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:2000}
.modal-content{background:#fff;border-radius:12px;padding:20px;width:100%;max-width:600px;box-shadow:0 10px 25px rgba(0,0,0,0.2);max-height:90vh;overflow-y:auto}
.form-group{margin-bottom:12px;display:flex;flex-direction:column;gap:4px}
.form-group label{font-size:12px;font-weight:bold;color:#475569}
.form-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
.sub-text{font-size:11px;color:#64748b;margin-top:2px}

@media print{
  @page { size: A4 portrait; margin: 12mm 15mm; }
  body { background: #fff!important; font-size: 11pt; color: #000; }
  header, nav, .toolbar, .delivery-builder, .main > section:not(#deliveryForm), #deliveryForm > h1, #deliveryForm > .panel:first-of-type { display: none !important; }
  .main { padding: 0!important; margin: 0!important; }
  .printable { border: none!important; padding: 0!important; margin: 0!important; width: 100%!important; max-width: 100%!important; box-shadow: none!important; }
}
</style>
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
</head>
<body>

<header>
  <div class="logo">📦 HỆ THỐNG QUẢN LÝ ĐƠN HÀNG & KHO</div>
  <div>
    <button class="secondary" onclick="exportBackupData()">💾 Sao Lưu (Backup JSON)</button>
    <button class="secondary" onclick="document.getElementById('restoreFile').click()">📂 Phục Hồi Dữ Liệu</button>
    <input type="file" id="restoreFile" accept=".json" class="hidden" onchange="importBackupData(event)">
  </div>
</header>

<nav class="top-nav">
  <div class="nav-item"><button class="nav-btn" onclick="show('dashboard')">📊 Tổng quan</button></div>
  <div class="nav-item">
    <button class="nav-btn">📑 Đơn Hàng & Sản Xuất ▾</button>
    <div class="dropdown">
      <button onclick="show('orderMatrix')">📈 Tiến Độ & Đối Soát (Matrix)</button>
      <button onclick="show('clientOrders')">📄 Quản Lý PO / HĐMB / Báo Giá</button>
    </div>
  </div>
  <div class="nav-item">
    <button class="nav-btn">📦 Hàng hóa & Kho ▾</button>
    <div class="dropdown">
      <button onclick="show('inbound')">📥 Nhập kho & Đơn sản xuất</button>
      <button onclick="show('stock')">🏭 Hàng tồn</button>
      <button onclick="show('products')">📋 Danh mục & Mapping tên hàng</button>
    </div>
  </div>
  <div class="nav-item">
    <button class="nav-btn">🚚 Xuất kho ▾</button>
    <div class="dropdown">
      <button onclick="show('outboundHistory')">📜 Lịch sử xuất kho & In phiếu</button>
    </div>
  </div>
  <div class="nav-item">
    <button class="nav-btn">⚙️ Quản lý chung ▾</button>
    <div class="dropdown">
      <button onclick="show('customers')">👥 Quản lý khách hàng</button>
    </div>
  </div>
  <div class="nav-item"><button class="nav-btn" onclick="show('deliveryForm')">🖨️ Mẫu Bàn giao</button></div>
</nav>

<main class="main">

  <!-- TỔNG QUAN -->
  <section id="dashboard" class="page">
    <h1>Tổng quan hệ thống</h1>
    <div class="cards">
      <div class="card"><div class="label">Tổng PO / Đơn Đặt Hàng</div><div class="value" id="cOrders">0</div></div>
      <div class="card"><div class="label">Đơn SX Đang Theo Dõi</div><div class="value" id="cProdOrders">0</div></div>
      <div class="card"><div class="label">Mã Sản Phẩm Master</div><div class="value" id="cProducts">0</div></div>
      <div class="card"><div class="label">Tồn kho hiện tại</div><div class="value" id="cStock">0</div></div>
    </div>
  </section>

  <!-- 1. BẢNG MA TRẬN TIẾN ĐỘ & ĐỐI SOÁT (ORDER TRACKING MATRIX) -->
  <section id="orderMatrix" class="page">
    <h1>Bảng Đối Soát Vòng Đời Đơn Hàng & Tiến Độ Sản Xuất</h1>
    <div class="panel">
      <div class="toolbar">
        <input id="matrixSearch" placeholder="🔎 Tìm theo PO, Khách hàng, Tên hàng..." oninput="renderOrderMatrix()" style="width:300px">
        <button class="primary" onclick="openClientOrderModal()">+ Thêm PO / HĐMB Mới</button>
        <button class="secondary" style="background:#4f46e5;color:#fff" onclick="openInboundModal('po')">🏭 + Import/Nhập Đơn Sản Xuất</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Loại CT</th>
            <th>Số PO / HĐMB</th>
            <th>Khách hàng</th>
            <th>Tên Hàng PO (Việt)</th>
            <th>Mã & Tên Đơn SX (Trung)</th>
            <th>SL Đặt</th>
            <th>SL SX</th>
            <th>Đã Giao</th>
            <th>Còn Lại</th>
            <th>Khớp SX</th>
            <th>Thao Tác</th>
          </tr>
        </thead>
        <tbody id="matrixRows"></tbody>
      </table>
    </div>
  </section>

  <!-- 2. QUẢN LÝ PO / HĐMB / BÁO GIÁ KHÁCH HÀNG -->
  <section id="clientOrders" class="page hidden">
    <h1>Danh Sách PO / Hợp Đồng / Báo Giá Đã Tiếp Nhận</h1>
    <div class="panel">
      <div class="toolbar">
        <button class="primary" onclick="openClientOrderModal()">+ Tạo PO / HĐMB Khách Hàng</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Loại</th>
            <th>Số PO / Mã CT</th>
            <th>Khách hàng</th>
            <th>Ngày PO</th>
            <th>Tên hàng đặt</th>
            <th>Số lượng đặt</th>
            <th>File đính kèm</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody id="clientOrderRows"></tbody>
      </table>
    </div>
  </section>

  <!-- 3. MAPPING TÊN HÀNG & DANH MỤC SẢN PHẨM -->
  <section id="products" class="page hidden">
    <h1>Danh Mục Sản Phẩm Master & Mapping 3 Tên Hàng</h1>
    <div class="panel">
      <div class="toolbar">
        <input id="pSearch" placeholder="🔎 Tìm mã SP, tên Việt, tên Trung, tên Nhập kho..." oninput="renderProducts()" style="width:300px">
        <button class="primary" onclick="addProduct()">+ Thêm Mã Sản Phẩm Mới</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Mã SKU Master</th>
            <th>Tên Trên PO Khách (Việt)</th>
            <th>Tên Trên Đơn SX (Tiếng Trung)</th>
            <th>Tên Nhập Kho / Kế Toán</th>
            <th>Tồn Hiện Tại</th>
            <th>Thao Tác</th>
          </tr>
        </thead>
        <tbody id="productRows"></tbody>
      </table>
    </div>
  </section>

  <!-- HÀNG TỒN -->
  <section id="stock" class="page hidden">
    <h1>Báo cáo Hàng tồn kho</h1>
    <div class="panel">
      <div class="toolbar">
        <label><input type="checkbox" id="stockOnlyAvailable" checked onchange="renderStock()"> Chỉ hiển thị hàng đang tồn (>0)</label>
        <button class="secondary" onclick="exportStockExcel()">📊 Export Excel Hàng Tồn</button>
        <input id="stockSearch" placeholder="🔎 Tìm theo mã SP, tên hàng..." oninput="renderStock()" style="width:250px">
      </div>
      <table>
        <thead>
          <tr><th>Mã SP Master</th><th>Tên hàng (Nhập kho)</th><th>Tên Tiếng Trung</th><th>SL Tồn</th></tr>
        </thead>
        <tbody id="stockRows"></tbody>
      </table>
    </div>
  </section>

  <!-- NHẬP KHO & ĐƠN SẢN XUẤT PO -->
  <section id="inbound" class="page hidden">
    <h1>Nhập Kho / Đơn Sản Xuất Tiếng Trung</h1>
    <div class="panel">
      <div class="toolbar">
        <button class="primary" onclick="openInboundModal('manual')">+ Nhập kho thủ công</button>
        <button class="secondary" style="background:#4f46e5;color:#fff" onclick="openInboundModal('po')">🏭 + Thêm Đơn SX Tiếng Trung</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Ngày Nhập/SX</th><th>Mã Đơn SX (Trung)</th><th>Mã PO Khách</th><th>Tên Hàng SX (Trung)</th><th>Số Lượng</th><th>Trạng Thái Gán PO</th><th>Trạng Thái Kho</th>
          </tr>
        </thead>
        <tbody id="inboundRows"></tbody>
      </table>
    </div>
  </section>

  <!-- LỊCH SỬ XUẤT KHO VÀ IN PHIẾU -->
  <section id="outboundHistory" class="page hidden">
    <h1>Lịch sử xuất kho & In lại Phiếu</h1>
    <div class="panel">
      <div class="toolbar">
        <button class="primary" onclick="openOutboundModal()">+ Tạo phiếu xuất kho mới</button>
        <input id="outSearch" placeholder="🔎 Tìm tên khách hàng, mã SP, PO..." oninput="renderOutboundHistory()" style="width:280px">
      </div>
      <table>
        <thead>
          <tr><th>Ngày giao</th><th>Khách hàng</th><th>Mã SP</th><th>Tên hàng</th><th>SL Xuất</th><th>Số PO</th><th>Thao tác</th></tr>
        </thead>
        <tbody id="outHistoryRows"></tbody>
      </table>
    </div>
  </section>

  <!-- QUẢN LÝ KHÁCH HÀNG -->
  <section id="customers" class="page hidden">
    <h1>Quản lý Khách hàng</h1>
    <div class="panel">
      <div class="toolbar">
        <button class="primary" onclick="openCustomerModal()">+ Thêm Khách Hàng</button>
        <input id="cSearch" placeholder="🔎 Tìm mã KH, tên công ty, MST..." oninput="renderCustomers()" style="width:250px">
      </div>
      <table>
        <thead>
          <tr><th>Mã KH</th><th>Tên Công ty</th><th>Mã số thuế</th><th>Địa chỉ</th><th>Đại diện</th><th>Thao tác</th></tr>
        </thead>
        <tbody id="customerRows"></tbody>
      </table>
    </div>
  </section>

  <!-- MẪU BÀN GIAO & IN -->
  <section id="deliveryForm" class="page hidden">
    <h1>Biên bản bàn giao / 送货单</h1>
    <div class="panel">
      <div class="toolbar">
        <button class="primary" onclick="printAndSaveDelivery()">🖨️ In Biên Bản & Lưu Lịch Sử Xuất Kho</button>
      </div>
      <div class="delivery-builder">
        <div class="formgrid">
          <label>Ngày giao <input id="dfDate" type="date" oninput="syncDelivery()"></label>
          <label>Khách hàng
            <input id="dfCustomer" list="customerDatalist" placeholder="Gõ tìm tên KH..." oninput="syncDelivery()">
          </label>
          <datalist id="customerDatalist"></datalist>
          <label>Số PO / Đơn SX <input id="dfPO" placeholder="VD: PO-2026-001" oninput="syncDelivery()"></label>
          <label>Ngày PO <input id="dfPODate" type="date" oninput="syncDelivery()"></label>
        </div>
        <div class="formgrid">
          <label>Tên hàng theo PO 
            <input id="dfName" list="stockDatalist" placeholder="Nhập tên hàng..." oninput="syncDelivery()">
          </label>
          <datalist id="stockDatalist"></datalist>
          <label>Đơn vị tính <input id="dfUnit" value="PCS" oninput="syncDelivery()"></label>
          <label>Số lượng xuất <input id="dfQty" type="number" value="1" min="1" oninput="syncDelivery()"></label>
          <label>Tình trạng <input id="dfCondition" value="Mới 100%" oninput="syncDelivery()"></label>
        </div>
      </div>
    </div>

    <!-- MẪU IN BÀN GIAO CHUẨN ĐÃ CĂN CHỈNH TỌA ĐỘ CSS GRID -->
    <div class="printable" id="deliveryPreview">
      <div style="text-align: right; font-weight: bold; font-size: 8pt; margin-bottom: 10px;">
        CÔNG TY TNHH MÁY MÓC TINH HẰNG VIỆT NAM
      </div>

      <div class="doc-head">
        <div class="vn">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
        <div class="sub">Độc lập - Tự do - Hạnh phúc</div>
        <div class="dots">---o0o---</div>
        <h2>BIÊN BẢN BÀN GIAO</h2>
        <div class="cn">送货单</div>
        <div class="date-line">Hôm nay, ngày <span id="pvDate">___</span> năm 2026 chúng tôi gồm:</div>
      </div>

      <div style="margin: 15px 0;">
        <!-- BÊN A -->
        <div class="party-block">
          <div class="info-row">
            <span class="info-label">Bên A:</span>
            <span><b>CÔNG TY TNHH MÁY MÓC TINH HẰNG VIỆT NAM</b></span>
          </div>
          <div class="info-row">
            <span class="info-label">Địa chỉ:</span>
            <span>T91-CN01, Cụm sản xuất nghề tập trung, Xã Gia Lâm, Thành phố Hà Nội, Việt Nam</span>
          </div>
          <div class="info-row-multi">
            <span class="info-label">Đại diện:</span>
            <span>Ông (bà): <b>ZHONG XIN HUA</b></span>
            <span class="info-label">Chức vụ:</span>
            <span><b>Giám đốc</b></span>
          </div>
          <div class="info-row-multi">
            <span class="info-label">Điện thoại:</span>
            <span>0967708588</span>
            <span class="info-label">MST:</span>
            <span>0107926474</span>
          </div>
        </div>

        <div style="height: 8px;"></div>

        <!-- BÊN B -->
        <div class="party-block">
          <div class="info-row">
            <span class="info-label">Bên B:</span>
            <span><b id="pvCustomer">_______________________</b></span>
          </div>
          <div class="info-row">
            <span class="info-label">Địa chỉ:</span>
            <span id="pvAddress">_______________________</span>
          </div>
          <div class="info-row-multi">
            <span class="info-label">Đại diện:</span>
            <span>Ông (bà): <b id="pvRep"></b></span>
            <span class="info-label">Chức vụ:</span>
            <span><b id="pvRole"></b></span>
          </div>
          <div class="info-row-multi">
            <span class="info-label">Điện thoại:</span>
            <span id="pvPhone"></span>
            <span class="info-label">MST:</span>
            <span id="pvTax"></span>
          </div>
        </div>
      </div>

      <p style="margin: 10px 0 5px">Hai bên bàn giao và nghiệm thu nội dung cụ thể như sau:</p>

      <table class="items">
        <thead>
          <tr><th>STT</th><th>Số PO</th><th>Ngày PO</th><th>Danh mục hàng</th><th>ĐVT</th><th>SL</th><th>Tình trạng</th></tr>
        </thead>
        <tbody id="pvItems"></tbody>
      </table>

      <div style="display: flex; justify-content: space-between; margin-top: 40px; text-align: center;">
        <div style="width: 48%;"><b>CÔNG TY TNHH MÁY MÓC TINH HẰNG VIỆT NAM</b></div>
        <div style="width: 48%;"><b id="pvSigCustomer">ĐẠI DIỆN BÊN B</b></div>
      </div>
    </div>
  </section>

</main>

<!-- MODALS SYSTEM -->

<!-- MODAL CẬP NHẬT MAPPING SẢN PHẨM MASTER -->
<div id="productModal" class="modal hidden">
  <div class="modal-content">
    <h3 id="pModalTitle" style="margin-top:0">Cập Nhật Mapping 3 Tên Hàng</h3>
    <input type="hidden" id="mPCode">
    <div class="form-group">
      <label>Mã SKU Master Nội Bộ</label>
      <input id="mPSku" placeholder="VD: SP-J350-D40">
    </div>
    <div class="form-group">
      <label>1. Tên trên PO Khách Hàng (Tiếng Việt)</label>
      <input id="mPNameVi" placeholder="VD: Bộ nòng đùn (Xi lanh) cho máy ép nhựa JSW J350T D40mm">
    </div>
    <div class="form-group">
      <label>2. Tên trên Đơn Sản Xuất (Tiếng Trung)</label>
      <input id="mPNameCn" placeholder="VD: 料管 法兰 子母射咀 JSW J350ADS-460H Φ40">
    </div>
    <div class="form-group">
      <label>3. Tên Nhập Kho / Kế Toán</label>
      <input id="mPNameStock" placeholder="VD: Bộ nòng đùn (Xi lanh) JSW J350T D40mm (EPB300 D40 - 1S)">
    </div>
    <div class="form-actions">
      <button class="secondary" onclick="closeProductModal()">Hủy</button>
      <button class="primary" onclick="saveProductMaster()">Lưu Sản Phẩm</button>
    </div>
  </div>
</div>

<!-- MODAL THÊM PO / HĐMB KHÁCH HÀNG -->
<div id="clientOrderModal" class="modal hidden">
  <div class="modal-content">
    <h3 style="margin-top:0">Thêm PO / HĐMB Khách Hàng</h3>
    <div class="form-group">
      <label>Loại Chứng Từ</label>
      <select id="mOrderType">
        <option value="PO">PO (Đơn Đặt Hàng)</option>
        <option value="HĐMB">HĐMB (Hợp Đồng Mua Bán)</option>
        <option value="Báo Giá">Báo Giá Xác Nhận</option>
      </select>
    </div>
    <div class="form-group">
      <label>Số PO / Mã Hợp Đồng</label>
      <input id="mOrderPo" placeholder="VD: PO-2026-0814">
    </div>
    <div class="form-group">
      <label>Khách Hàng</label>
      <input id="mOrderCust" list="customerDatalist" placeholder="Gõ tên khách hàng...">
    </div>
    <div class="form-group">
      <label>Ngày PO</label>
      <input type="date" id="mOrderDate">
    </div>
    <div class="form-group">
      <label>Mặt Hàng Đặt (Khớp Danh Mục Master)</label>
      <select id="mOrderProduct" onchange="autoFillOrderName(this.value)">
        <option value="">-- Chọn Sản Phẩm Master --</option>
      </select>
    </div>
    <div class="form-group">
      <label>Tên Hàng Ghi Trên PO Khách</label>
      <input id="mOrderName" placeholder="Nhập tên theo yêu cầu của khách...">
    </div>
    <div class="form-group">
      <label>Số Lượng Đặt</label>
      <input type="number" id="mOrderQty" value="1" min="1">
    </div>
    <div class="form-group">
      <label>Đính Kèm File PDF / Ảnh Đơn Đặt Hàng</label>
      <input type="file" id="mOrderFile" accept=".pdf,image/*" onchange="convertFileToBase64(this)">
      <div class="sub-text" id="mOrderFileStatus">Chưa có file đính kèm</div>
    </div>
    <div class="form-actions">
      <button class="secondary" onclick="closeClientOrderModal()">Hủy</button>
      <button class="primary" onclick="saveClientOrder()">Lưu Đơn Đặt Hàng</button>
    </div>
  </div>
</div>

<!-- MODAL THÊM ĐƠN SẢN XUẤT / NHẬP KHO -->
<div id="inboundModal" class="modal hidden">
  <div class="modal-content">
    <h3 id="inboundModalTitle" style="margin-top:0">Thêm Đơn Sản Xuất / Nhập Kho</h3>
    <input type="hidden" id="mInType" value="po">
    <div class="form-group"><label>Ngày SX / Nhập Kho</label><input type="date" id="mInDate"></div>
    <div class="form-group"><label>Mã Đơn Sản Xuất (Tiếng Trung)</label><input id="mInDSX" placeholder="VD: YN2026081401A"></div>
    <div class="form-group">
      <label>Gán Cho PO Khách Hàng (Tùy Chọn)</label>
      <select id="mInPoLink">
        <option value="">-- Đơn SX Tồn Kho (Chưa Gán PO) --</option>
      </select>
      <div class="sub-text">Có thể gán vào PO của khách sau bất kỳ lúc nào</div>
    </div>
    <div class="form-group">
      <label>Mặt Hàng Master</label>
      <select id="mInProduct" onchange="autoFillInboundCnName(this.value)">
        <option value="">-- Chọn Mã Sản Phẩm Master --</option>
      </select>
    </div>
    <div class="form-group"><label>Tên Hàng Tiếng Trung Trên File ĐSX</label><input id="mInCnName" placeholder="VD: 料管 法兰 子母射咀"></div>
    <div class="form-group"><label>Số Lượng Sản Xuất</label><input type="number" id="mInQty" value="1" min="1"></div>
    <div class="form-actions">
      <button class="secondary" onclick="closeInboundModal()">Hủy</button>
      <button class="primary" onclick="saveInboundManual()">Lưu Đơn SX / Nhập Kho</button>
    </div>
  </div>
</div>

<!-- MODAL XUẤT KHO -->
<div id="outboundModal" class="modal hidden">
  <div class="modal-content">
    <h3 id="outModalTitle" style="margin-top:0">Tạo Phiếu Xuất Kho / Giao Hàng</h3>
    <div class="form-group"><label>Ngày giao</label><input type="date" id="mOutDate"></div>
    <div class="form-group"><label>Khách hàng</label><input id="mOutCust" list="customerDatalist" placeholder="Gõ tìm tên KH..."></div>
    <div class="form-group"><label>Tên hàng</label><input id="mOutName" list="stockDatalist" placeholder="Gõ tên hàng..."></div>
    <div class="form-group"><label>Số lượng giao</label><input type="number" id="mOutQty" value="1" min="1"></div>
    <div class="form-group"><label>Số PO / Đơn SX</label><input id="mOutPO"></div>
    <div class="form-actions">
      <button class="secondary" onclick="closeOutboundModal()">Hủy</button>
      <button class="primary" onclick="confirmSaveOutboundAndImport()">Lưu & Chuyển sang Mẫu In</button>
    </div>
  </div>
</div>

<!-- MODAL KHÁCH HÀNG -->
<div id="custModal" class="modal hidden">
  <div class="modal-content">
    <h3 id="modalCustTitle" style="margin-top:0">Thêm Khách hàng</h3>
    <div class="form-group"><label>Mã KH</label><input id="mCustCode"></div>
    <div class="form-group"><label>Tên Công ty</label><input id="mCustName"></div>
    <div class="form-group"><label>Mã số thuế</label><input id="mCustTax"></div>
    <div class="form-group"><label>Địa chỉ</label><input id="mCustAddress"></div>
    <div class="form-group"><label>Người đại diện</label><input id="mCustRep"></div>
    <div class="form-group"><label>Chức vụ</label><input id="mCustRole"></div>
    <div class="form-group"><label>Số điện thoại</label><input id="mCustPhone"></div>
    <div class="form-actions">
      <button class="secondary" onclick="closeCustomerModal()">Hủy</button>
      <button class="primary" onclick="saveCustomer()">Lưu Khách Hàng</button>
    </div>
  </div>
</div>

<script>
// CẤU TRÚC DỮ LIỆU CHÍNH HỆ THỐNG
const S = {
  products: [],    // Master Products (3 Aliases Mapping)
  clientOrders: [],// PO/HĐMB Khách hàng
  inbound: [],     // Đơn Sản Xuất & Lô Nhập Kho
  outbound: [],    // Lịch sử xuất giao
  customers: []    // Danh sách Khách hàng
};

let currentUploadedBase64 = "";

function loadData(){
  S.products = JSON.parse(localStorage.getItem("inv_products") || "[]");
  S.clientOrders = JSON.parse(localStorage.getItem("inv_clientOrders") || "[]");
  S.inbound = JSON.parse(localStorage.getItem("inv_inbound") || "[]");
  S.outbound = JSON.parse(localStorage.getItem("inv_outbound") || "[]");
  S.customers = JSON.parse(localStorage.getItem("inv_customers") || "[]");
  
  // Dữ liệu mẫu khởi tạo lần đầu nếu trống
  if(S.products.length === 0){
    S.products.push({
      code: "SP-J350-D40",
      nameVi: "Bộ nòng đùn (Xi lanh) cho máy ép nhựa JSW J350T D40mm",
      nameCn: "料管 法兰 子母射咀 JSW J350ADS-460H Φ40",
      nameStock: "Bộ nòng đùn (Xi lanh) cho máy ép nhựa JSW J350T D40mm (EPB300 D40 - 1S)",
      stock: 0
    });
    saveData("products");
  }

  rebuildStockData();
}

function saveData(key){
  localStorage.setItem("inv_" + key, JSON.stringify(S[key]));
}

function esc(x){
  return String(x??"").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

function normText(v){ return String(v??"").replace(/\s+/g," ").trim().toLowerCase(); }

function show(pageId){
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  const p = document.getElementById(pageId);
  if(p) p.classList.remove("hidden");
}

function rebuildStockData(){
  S.products.forEach(p => p.stock = 0);
  S.inbound.forEach(x => {
    if(!x.delivered){
      let p = S.products.find(prod => prod.code === x.spCode);
      if(p) p.stock = (+p.stock || 0) + (+x.qty || 0);
    }
  });
}

function renderAllViews(){
  rebuildStockData();
  document.getElementById("cOrders").textContent = S.clientOrders.length;
  document.getElementById("cProdOrders").textContent = S.inbound.length;
  document.getElementById("cProducts").textContent = S.products.length;
  document.getElementById("cStock").textContent = S.products.reduce((a,b)=>a+(+b.stock||0), 0);

  renderOrderMatrix();
  renderClientOrders();
  renderProducts();
  renderStock();
  renderInbound();
  renderCustomers();
  renderOutboundHistory();
  updateDatalists();
}

/* --- 1. HỆ THỐNG MA TRẬN TIẾN ĐỘ & ĐỐI SOÁT --- */
function renderOrderMatrix(){
  const q = normText(document.getElementById("matrixSearch")?.value || "");
  const rows = [];

  // Quét danh sách PO Khách Hàng
  S.clientOrders.forEach(o => {
    const matchedInbound = S.inbound.filter(i => i.poLink === o.poNumber);
    const totalProdQty = matchedInbound.reduce((a, b) => a + (+b.qty || 0), 0);
    
    const matchedOutbound = S.outbound.filter(out => out.po === o.poNumber);
    const totalDeliveredQty = matchedOutbound.reduce((a, b) => a + (+b.qty || 0), 0);

    const remainQty = (+o.qty || 0) - totalDeliveredQty;

    const dsxNames = matchedInbound.map(i => `${i.dsxCode} (${i.nameCn})`).join("<br>") || "<i>Chưa có ĐSX</i>";

    if(!q || normText(`${o.poNumber} ${o.customer} ${o.nameVi}`).includes(q)){
      rows.push(`
        <tr>
          <td><span class="badge badge-po">${esc(o.type)}</span></td>
          <td><b>${esc(o.poNumber)}</b></td>
          <td>${esc(o.customer)}</td>
          <td>${esc(o.nameVi)}</td>
          <td>${dsxNames}</td>
          <td><b>${o.qty}</b></td>
          <td><b style="color:#2563eb">${totalProdQty}</b></td>
          <td><b style="color:#16a34a">${totalDeliveredQty}</b></td>
          <td><b style="color:${remainQty>0?'#dc2626':'#16a34a'}">${remainQty}</b></td>
          <td>
            ${totalProdQty >= o.qty ? '<span class="badge badge-success">🟢 Đủ SX</span>' : (totalProdQty>0 ? '<span class="badge badge-pending">🟡 Thiếu SX</span>' : '<span class="badge badge-gray">🔴 Chưa SX</span>')}
          </td>
          <td>
            <button class="secondary sm" onclick="openOutboundForPO('${esc(o.poNumber)}', '${esc(o.customer)}', '${esc(o.nameVi)}', ${remainQty})">🚚 Xuất Kho</button>
          </td>
        </tr>
      `);
    }
  });

  // Quét thêm Đơn SX chưa được gán PO (Đơn độc lập/Tồn kho)
  S.inbound.filter(i => !i.poLink).forEach(i => {
    if(!q || normText(`${i.dsxCode} ${i.nameCn}`).includes(q)){
      rows.push(`
        <tr style="background:#fefce8">
          <td><span class="badge badge-gray">Tồn Kho</span></td>
          <td><i>(Chưa Gán PO)</i></td>
          <td><i>(Chưa Có)</i></td>
          <td><i>-</i></td>
          <td><b>${esc(i.dsxCode)}</b><br>${esc(i.nameCn)}</td>
          <td>-</td>
          <td><b>${i.qty}</b></td>
          <td>0</td>
          <td>${i.qty}</td>
          <td><span class="badge badge-pending">🔵 Tồn Kho Tự Do</span></td>
          <td>
            <button class="primary sm" onclick="linkDSXToPO('${esc(i.dsxCode)}')">🔗 Gán PO</button>
          </td>
        </tr>
      `);
    }
  });

  document.getElementById("matrixRows").innerHTML = rows.join("") || `<tr><td colspan="11" class="empty">Chưa có dữ liệu tiến độ.</td></tr>`;
}

function linkDSXToPO(dsxCode){
  const po = prompt("Nhập Số PO Khách Hàng muốn gán cho Đơn SX " + dsxCode + ":");
  if(!po) return;
  const inRecord = S.inbound.find(i => i.dsxCode === dsxCode);
  if(inRecord){
    inRecord.poLink = po.trim();
    saveData("inbound");
    renderAllViews();
    alert("Đã gán Đơn SX " + dsxCode + " vào PO " + po + " thành công!");
  }
}

/* --- 2. QUẢN LÝ PO / HĐMB KHÁCH HÀNG --- */
function renderClientOrders(){
  document.getElementById("clientOrderRows").innerHTML = S.clientOrders.map((o, idx) => `
    <tr>
      <td><span class="badge badge-po">${esc(o.type)}</span></td>
      <td><b>${esc(o.poNumber)}</b></td>
      <td>${esc(o.customer)}</td>
      <td>${esc(o.date)}</td>
      <td>${esc(o.nameVi)}</td>
      <td><b>${o.qty}</b></td>
      <td>${o.fileBase64 ? `<a href="${o.fileBase64}" target="_blank" style="color:#2563eb;font-weight:bold">📄 Xem File</a>` : '<i>Không có</i>'}</td>
      <td><button class="danger sm" onclick="deleteClientOrder(${idx})">🗑️ Xóa</button></td>
    </tr>
  `).join("") || `<tr><td colspan="8" class="empty">Chưa có chứng từ PO / HĐMB.</td></tr>`;
}

function openClientOrderModal(){
  document.getElementById("clientOrderModal").classList.remove("hidden");
  document.getElementById("mOrderPo").value = "PO-" + new Date().getFullYear() + "-" + String(S.clientOrders.length + 1).padStart(3, "0");
  document.getElementById("mOrderDate").value = new Date().toISOString().slice(0, 10);
  document.getElementById("mOrderName").value = "";
  document.getElementById("mOrderQty").value = 1;
  currentUploadedBase64 = "";
  document.getElementById("mOrderFileStatus").textContent = "Chưa có file đính kèm";

  // Fill dropdown Master Products
  const select = document.getElementById("mOrderProduct");
  select.innerHTML = '<option value="">-- Chọn Sản Phẩm Master --</option>' + S.products.map(p => `<option value="${p.code}">${p.code} - ${p.nameVi}</option>`).join("");
}

function closeClientOrderModal(){ document.getElementById("clientOrderModal").classList.add("hidden"); }

function autoFillOrderName(code){
  const p = S.products.find(x => x.code === code);
  if(p) document.getElementById("mOrderName").value = p.nameVi;
}

function convertFileToBase64(input){
  const file = input.files[0];
  if(file){
    const reader = new FileReader();
    reader.onload = function(e){
      currentUploadedBase64 = e.target.result;
      document.getElementById("mOrderFileStatus").textContent = "Đã đính kèm file: " + file.name;
    };
    reader.readAsDataURL(file);
  }
}

function saveClientOrder(){
  const poNumber = document.getElementById("mOrderPo").value.trim();
  const customer = document.getElementById("mOrderCust").value.trim();
  const nameVi = document.getElementById("mOrderName").value.trim();
  const qty = +document.getElementById("mOrderQty").value || 0;

  if(!poNumber || !customer || !nameVi || qty <= 0){
    alert("Vui lòng điền đầy đủ thông tin PO, Khách Hàng và Số Lượng!");
    return;
  }

  S.clientOrders.push({
    type: document.getElementById("mOrderType").value,
    poNumber, customer,
    date: document.getElementById("mOrderDate").value,
    spCode: document.getElementById("mOrderProduct").value,
    nameVi, qty,
    fileBase64: currentUploadedBase64
  });

  saveData("clientOrders");
  closeClientOrderModal();
  renderAllViews();
}

function deleteClientOrder(idx){
  if(confirm("Xóa chứng từ PO này?")){
    S.clientOrders.splice(idx, 1);
    saveData("clientOrders");
    renderAllViews();
  }
}

/* --- 3. QUẢN LÝ DANH MỤC & MAPPING 3 TÊN HÀNG --- */
function renderProducts(){
  const q = normText(document.getElementById("pSearch")?.value || "");
  const rows = S.products.filter(p => !q || normText(`${p.code} ${p.nameVi} ${p.nameCn} ${p.nameStock}`).includes(q));

  document.getElementById("productRows").innerHTML = rows.map(p => `
    <tr>
      <td><b>${esc(p.code)}</b></td>
      <td>${esc(p.nameVi||"-")}</td>
      <td style="color:#1e40af;font-weight:bold">${esc(p.nameCn||"-")}</td>
      <td>${esc(p.nameStock||"-")}</td>
      <td><b>${p.stock||0}</b></td>
      <td><button class="secondary sm" onclick="editProduct('${esc(p.code)}')">✏️ Sửa Mapping</button></td>
    </tr>
  `).join("") || `<tr><td colspan="6" class="empty">Chưa có sản phẩm.</td></tr>`;
}

function addProduct(){
  document.getElementById("productModal").classList.remove("hidden");
  document.getElementById("mPCode").value = "";
  document.getElementById("mPSku").value = "SP-" + String(S.products.length + 1).padStart(4, "0");
  document.getElementById("mPNameVi").value = "";
  document.getElementById("mPNameCn").value = "";
  document.getElementById("mPNameStock").value = "";
}

function editProduct(code){
  const p = S.products.find(x => x.code === code);
  if(!p) return;
  document.getElementById("productModal").classList.remove("hidden");
  document.getElementById("mPCode").value = p.code;
  document.getElementById("mPSku").value = p.code;
  document.getElementById("mPNameVi").value = p.nameVi || "";
  document.getElementById("mPNameCn").value = p.nameCn || "";
  document.getElementById("mPNameStock").value = p.nameStock || "";
}

function closeProductModal(){ document.getElementById("productModal").classList.add("hidden"); }

function saveProductMaster(){
  const sku = document.getElementById("mPSku").value.trim();
  const nameVi = document.getElementById("mPNameVi").value.trim();
  const nameCn = document.getElementById("mPNameCn").value.trim();
  const nameStock = document.getElementById("mPNameStock").value.trim();

  if(!sku || !nameVi){ alert("Vui lòng nhập Mã SKU và Tên tiếng Việt!"); return; }

  const existIdx = S.products.findIndex(x => x.code === sku || x.code === document.getElementById("mPCode").value);
  if(existIdx >= 0){
    S.products[existIdx].code = sku;
    S.products[existIdx].nameVi = nameVi;
    S.products[existIdx].nameCn = nameCn;
    S.products[existIdx].nameStock = nameStock;
  } else {
    S.products.push({ code: sku, nameVi, nameCn, nameStock, stock: 0 });
  }

  saveData("products");
  closeProductModal();
  renderAllViews();
}

/* --- 4. NHẬP KHO & ĐƠN SẢN XUẤT TIẾNG TRUNG --- */
function renderInbound(){
  document.getElementById("inboundRows").innerHTML = S.inbound.map((x, idx) => `
    <tr>
      <td>${esc(x.date||"")}</td>
      <td><b>${esc(x.dsxCode||"-")}</b></td>
      <td><b>${esc(x.poLink||"Chưa Gán PO")}</b></td>
      <td style="color:#1e40af;font-weight:bold">${esc(x.nameCn||"")}</td>
      <td><b>${x.qty||0}</b></td>
      <td>${x.poLink ? '<span class="badge badge-success">Đã Gán</span>' : '<span class="badge badge-pending">Tồn Kho</span>'}</td>
      <td>${x.delivered ? '<span class="badge badge-success">🚚Đã xuất</span>' : '<span class="badge badge-pending">📦 Trong kho</span>'}</td>
    </tr>
  `).join("") || `<tr><td colspan="7" class="empty">Chưa có dữ liệu đơn sản xuất.</td></tr>`;
}

function openInboundModal(type){
  document.getElementById("inboundModal").classList.remove("hidden");
  document.getElementById("mInDate").value = new Date().toISOString().slice(0, 10);
  document.getElementById("mInDSX").value = "YN" + new Date().getFullYear() + String(S.inbound.length + 1).padStart(4, "0");
  document.getElementById("mInCnName").value = "";
  document.getElementById("mInQty").value = 1;

  // Fill PO Link dropdown
  const poSelect = document.getElementById("mInPoLink");
  poSelect.innerHTML = '<option value="">-- Đơn SX Tồn Kho (Chưa Gán PO) --</option>' + S.clientOrders.map(o => `<option value="${o.poNumber}">${o.poNumber} (${o.customer})</option>`).join("");

  // Fill Product dropdown
  const pSelect = document.getElementById("mInProduct");
  pSelect.innerHTML = '<option value="">-- Chọn Mã Sản Phẩm Master --</option>' + S.products.map(p => `<option value="${p.code}">${p.code} - ${p.nameCn || p.nameVi}</option>`).join("");
}

function closeInboundModal(){ document.getElementById("inboundModal").classList.add("hidden"); }

function autoFillInboundCnName(code){
  const p = S.products.find(x => x.code === code);
  if(p) document.getElementById("mInCnName").value = p.nameCn || p.nameVi;
}

function saveInboundManual(){
  const dsxCode = document.getElementById("mInDSX").value.trim();
  const nameCn = document.getElementById("mInCnName").value.trim();
  const qty = +document.getElementById("mInQty").value || 0;

  if(!dsxCode || !nameCn || qty <= 0){ alert("Vui lòng nhập Mã ĐSX, Tên Tiếng Trung và Số Lượng!"); return; }

  S.inbound.push({
    date: document.getElementById("mInDate").value,
    dsxCode,
    poLink: document.getElementById("mInPoLink").value,
    spCode: document.getElementById("mInProduct").value,
    nameCn, qty,
    delivered: false
  });

  saveData("inbound");
  closeInboundModal();
  renderAllViews();
}

/* --- 5. HÀNG TỒN & XUẤT KHO --- */
function renderStock(){
  const only = document.getElementById("stockOnlyAvailable")?.checked !== false;
  const q = normText(document.getElementById("stockSearch")?.value || "");
  const rows = S.products.filter(p => {
    if(only && (+p.stock||0) <= 0) return false;
    if(q && !normText(`${p.code} ${p.nameStock} ${p.nameCn}`).includes(q)) return false;
    return true;
  });
  document.getElementById("stockRows").innerHTML = rows.map(p => `
    <tr>
      <td><b>${esc(p.code)}</b></td>
      <td>${esc(p.nameStock || p.nameVi)}</td>
      <td style="color:#1e40af">${esc(p.nameCn||"-")}</td>
      <td><b style="color:${p.stock>0?'#16a34a':'#dc2626'}">${p.stock||0}</b></td>
    </tr>
  `).join("") || `<tr><td colspan="4" class="empty">Không có hàng tồn.</td></tr>`;
}

function openOutboundForPO(poNumber, customer, nameVi, remainQty){
  openOutboundModal();
  document.getElementById("mOutPO").value = poNumber;
  document.getElementById("mOutCust").value = customer;
  document.getElementById("mOutName").value = nameVi;
  document.getElementById("mOutQty").value = remainQty > 0 ? remainQty : 1;
}

function openOutboundModal(){
  document.getElementById("outboundModal").classList.remove("hidden");
  document.getElementById("mOutDate").value = new Date().toISOString().slice(0, 10);
}

function closeOutboundModal(){ document.getElementById("outboundModal").classList.add("hidden"); }

function confirmSaveOutboundAndImport(){
  const name = document.getElementById("mOutName").value.trim();
  const qty = +document.getElementById("mOutQty").value || 0;
  const date = document.getElementById("mOutDate").value;
  const customer = document.getElementById("mOutCust").value.trim();
  const po = document.getElementById("mOutPO").value.trim();

  if(!name || qty <= 0){ alert("Vui lòng nhập tên hàng và số lượng hợp lệ!"); return; }

  const outboundRecord = { date, customer, name, qty, po };
  S.outbound.push(outboundRecord);
  
  // Trừ số lượng kho tương ứng
  let remain = qty;
  for(let i = 0; i < S.inbound.length; i++){
    if((S.inbound[i].poLink === po || !S.inbound[i].poLink) && !S.inbound[i].delivered){
      if(S.inbound[i].qty <= remain){
        remain -= S.inbound[i].qty;
        S.inbound[i].delivered = true;
      } else {
        S.inbound[i].qty -= remain;
        remain = 0;
      }
    }
    if(remain <= 0) break;
  }

  saveData("outbound");
  saveData("inbound");
  closeOutboundModal();
  renderAllViews();

  exportToDeliveryForm(outboundRecord);
}

function renderOutboundHistory(){
  const q = normText(document.getElementById("outSearch")?.value || "");
  const filtered = S.outbound.filter(o => !q || normText(`${o.customer} ${o.name} ${o.po}`).includes(q));

  document.getElementById("outHistoryRows").innerHTML = filtered.map((o, idx) => `
    <tr>
      <td>${esc(o.date)}</td>
      <td><b>${esc(o.customer)}</b></td>
      <td>${esc(o.sp||"-")}</td>
      <td>${esc(o.name)}</td>
      <td><b style="color:#dc2626">${o.qty}</b></td>
      <td>${esc(o.po||"-")}</td>
      <td>
        <button class="secondary sm" onclick='exportToDeliveryForm(${JSON.stringify(o)})'>🖨️ In Biên Bản</button>
      </td>
    </tr>
  `).join("") || `<tr><td colspan="7" class="empty">Chưa có lịch sử xuất kho.</td></tr>`;
}

function exportToDeliveryForm(outData){
  show('deliveryForm');
  if(outData.date) document.getElementById("dfDate").value = outData.date;
  if(outData.customer) document.getElementById("dfCustomer").value = outData.customer;
  if(outData.po) document.getElementById("dfPO").value = outData.po;
  if(outData.name) document.getElementById("dfName").value = outData.name;
  if(outData.qty) document.getElementById("dfQty").value = outData.qty;
  syncDelivery();
}

/* --- 6. KHÁCH HÀNG & MẪU IN BÀN GIAO --- */
function renderCustomers(){
  const q = normText(document.getElementById("cSearch")?.value || "");
  const filtered = S.customers.filter(c => !q || normText(`${c.code} ${c.name} ${c.tax}`).includes(q));

  document.getElementById("customerRows").innerHTML = filtered.map((c) => `
    <tr>
      <td><b>${esc(c.code)}</b></td>
      <td>${esc(c.name)}</td>
      <td>${esc(c.tax||"")}</td>
      <td>${esc(c.address||"")}</td>
      <td>${esc(c.rep||"")}</td>
      <td><button class="danger sm" onclick="deleteCustomer('${esc(c.code)}')">🗑️</button></td>
    </tr>
  `).join("") || `<tr><td colspan="6" class="empty">Chưa có dữ liệu khách hàng.</td></tr>`;
}

function openCustomerModal(){
  document.getElementById("custModal").classList.remove("hidden");
  document.getElementById("mCustCode").value = "KH" + String(S.customers.length + 1).padStart(4, "0");
}

function closeCustomerModal(){ document.getElementById("custModal").classList.add("hidden"); }

function saveCustomer(){
  const code = document.getElementById("mCustCode").value.trim();
  const name = document.getElementById("mCustName").value.trim();
  if(!name){ alert("Vui lòng nhập Tên Công ty!"); return; }

  S.customers.push({
    code, name,
    tax: document.getElementById("mCustTax").value.trim(),
    address: document.getElementById("mCustAddress").value.trim(),
    rep: document.getElementById("mCustRep").value.trim(),
    role: document.getElementById("mCustRole").value.trim(),
    phone: document.getElementById("mCustPhone").value.trim()
  });

  saveData("customers");
  closeCustomerModal();
  renderAllViews();
}

function deleteCustomer(code){
  if(confirm("Xóa khách hàng này?")){
    S.customers = S.customers.filter(x => x.code !== code);
    saveData("customers");
    renderAllViews();
  }
}

function syncDelivery(){
  document.getElementById("pvDate").textContent = document.getElementById("dfDate")?.value || "___";
  
  const custVal = normText(document.getElementById("dfCustomer")?.value || "");
  const c = S.customers.find(x => normText(x.name) === custVal || normText(x.code) === custVal);
  
  if (c) {
    document.getElementById("pvCustomer").textContent = c.name;
    document.getElementById("pvAddress").textContent = c.address || "";
    document.getElementById("pvTax").textContent = c.tax || "";
    document.getElementById("pvRep").textContent = c.rep || "";
    document.getElementById("pvRole").textContent = c.role || "";
    document.getElementById("pvPhone").textContent = c.phone || "";
    document.getElementById("pvSigCustomer").textContent = c.name;
  } else {
    const raw = document.getElementById("dfCustomer").value.trim();
    document.getElementById("pvCustomer").textContent = raw || "_______________________";
    document.getElementById("pvSigCustomer").textContent = raw || "ĐẠI DIỆN BÊN B";
    document.getElementById("pvAddress").textContent = "_______________________";
    document.getElementById("pvTax").textContent = "";
    document.getElementById("pvRep").textContent = "";
    document.getElementById("pvRole").textContent = "";
    document.getElementById("pvPhone").textContent = "";
  }

  const name = document.getElementById("dfName")?.value || "";
  const po = document.getElementById("dfPO")?.value || "";
  const poDate = document.getElementById("dfPODate")?.value || "";
  const unit = document.getElementById("dfUnit")?.value || "PCS";
  const qty = document.getElementById("dfQty")?.value || "1";
  const cond = document.getElementById("dfCondition")?.value || "Mới 100%";

  document.getElementById("pvItems").innerHTML = `
    <tr>
      <td>1</td>
      <td>${esc(po)}</td>
      <td>${esc(poDate)}</td>
      <td style="text-align:left">${esc(name || "_______________________")}</td>
      <td>${esc(unit)}</td>
      <td>${esc(qty)}</td>
      <td>${esc(cond)}</td>
    </tr>
  `;
}

function printAndSaveDelivery(){
  window.print();
}

function updateDatalists() {
  document.getElementById("customerDatalist").innerHTML = S.customers.map(c => `<option value="${esc(c.name)}">${esc(c.code)} - MST: ${esc(c.tax||'N/A')}</option>`).join("");
  document.getElementById("stockDatalist").innerHTML = S.products.map(p => `<option value="${esc(p.nameVi)}">[Tồn: ${p.stock||0}] ${esc(p.code)}</option>`).join("");
}

/* --- BACKUP & RESTORE DATA --- */
function exportBackupData(){
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(S));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", `Backup_Kho_Matrix_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  dlAnchor.remove();
}

function importBackupData(e){
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = function(evt){
    try {
      const data = JSON.parse(evt.target.result);
      Object.keys(data).forEach(k => { if(S[k]!==undefined){ S[k]=data[k]; saveData(k); } });
      renderAllViews();
      alert("Phục hồi thành công toàn bộ dữ liệu PO, Đơn SX và Mapping Kho!");
    } catch(err){ alert("Lỗi đọc file Backup!"); }
  };
  reader.readAsText(file);
}

// KHỞI CHẠY HỆ THỐNG
loadData();
renderAllViews();
document.getElementById("dfDate").value = new Date().toISOString().slice(0, 10);
syncDelivery();
</script>
</body>
</html>
