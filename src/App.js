import logo from "./logo.svg";

import { Button } from "primereact/button";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

import "../src/App.css";
import ReactDataTable from "./Components/ReactDataTable";
import { useState } from "react";
import Modal from "./Components/Modal";
import * as XLSX from "xlsx"; // Import xlsx for Excel export
import * as ExcelJS from "exceljs";

import { saveAs } from "file-saver"; // Import file-saver to save the file

function App() {
  const paginatorLeft = <Button type="button" icon="pi pi-refresh" text />;
  const paginatorRight = <Button type="button" icon="pi pi-download" text />;
  const [visible, setVisible] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const handleInvoices = (invoicesData) => {
    setInvoices(invoicesData);
  };

  // Function để xác định tuyến dựa trên mã số thuế và ký hiệu
  const getTuyenBySeries = (taxCode, series) => {
    const tuyens = {
      3500676761: {
        "5C25MHM": "BX Vũng Tàu - BX Miền Tây",
        "5C25MBT": "BX Bà Rịa - BX Miền Tây",
        "5C25MAD": "BX Vũng Tàu - BX Miền Tây",
        "5C25MAC": "BX Bà Rịa - BX Miền Tây",
        "5C25MAB": "BX. VŨNG TÀU - BX. MIỀN ĐÔNG",
        "5C25MAA": "Phường Vũng Tàu - Phường Bến Thành",
      },
      "3500676761-001": {
        "5C25MHM": "BX Miền Tây - BX Vũng Tàu",
        "5C25MBT": "BX Miền Tây - BX Bà Rịa",
        "5C25MAD": "BX Miền Tây - BX Vũng Tàu",
        "5C25MAC": "BX Miền Tây - BX Bà Rịa",
        "5C25MAB": "BX. MIỀN ĐÔNG - BX. VŨNG TÀU",
        "5C25MAA": "Phường Bến Thành - Phường Vũng Tàu",
      },
    };

    return tuyens[taxCode]?.[series] || series || "";
  };

  const flattenedInvoices = (invoices || []).flatMap((invoice) => {
    // Kiểm tra nếu invoice.details tồn tại và là mảng
    if (invoice && invoice.details && Array.isArray(invoice.details)) {
      return invoice.details.map((detail) => ({
        ...invoice, // Thêm thông tin hóa đơn vào chi tiết
        ...detail, // Gộp thông tin chi tiết
      }));
    }
    // Nếu không có details, trả về invoice gốc
    return [invoice];
  });

  // Group by biển số xe và sắp xếp theo thứ tự: ký hiệu, ngày, biển số xe
  const groupedInvoices = flattenedInvoices.reduce((groups, invoice) => {
    const bienSoXe = invoice.inv_departureDate || "Không có biển số";

    if (!groups[bienSoXe]) {
      groups[bienSoXe] = [];
    }
    groups[bienSoXe].push(invoice);
    return groups;
  }, {});

  // Gộp các dòng có cùng biển số xe thành 1 dòng và cộng dồn số liệu
  const mergedInvoices = Object.keys(groupedInvoices)
    .sort((a, b) => {
      // Sắp xếp theo biển số xe
      return a.localeCompare(b);
    })
    .map((bienSoXe) => {
      const invoicesInGroup = groupedInvoices[bienSoXe];

      // Sắp xếp dữ liệu trong mỗi nhóm theo ký hiệu, ngày
      const sortedInvoices = invoicesInGroup.sort((a, b) => {
        // Sắp xếp theo ký hiệu trước
        const seriesCompare = (a.inv_invoiceSeries || "").localeCompare(
          b.inv_invoiceSeries || ""
        );
        if (seriesCompare !== 0) return seriesCompare;

        // Nếu ký hiệu giống nhau, sắp xếp theo ngày
        const dateA = new Date(a.inv_invoiceIssuedDate || "");
        const dateB = new Date(b.inv_invoiceIssuedDate || "");
        return dateA - dateB;
      });

      // Lấy thông tin từ dòng đầu tiên của nhóm
      const firstInvoice = sortedInvoices[0];

      // Cộng dồn các cột số liệu
      const totalQuantity = sortedInvoices.reduce(
        (sum, inv) => sum + (Number(inv.inv_quantity) || 0),
        0
      );
      const totalBeforeTax = sortedInvoices.reduce(
        (sum, inv) => sum + (Number(inv.inv_TotalAmountWithoutVat) || 0),
        0
      );
      const totalTax = sortedInvoices.reduce(
        (sum, inv) => sum + (Number(inv.inv_vatAmount) || 0),
        0
      );
      const totalAmount = sortedInvoices.reduce(
        (sum, inv) => sum + (Number(inv.inv_TotalAmount) || 0),
        0
      );

      // Tạo dòng gộp với thông tin tổng hợp
      return {
        ...firstInvoice,
        inv_quantity: totalQuantity,
        inv_TotalAmountWithoutVat: totalBeforeTax,
        inv_vatAmount: totalTax,
        inv_TotalAmount: totalAmount,
      };
    });
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("bao-cao-chi-tiet");

    // Thêm tiêu đề - chỉ giữ lại các cột được yêu cầu
    const headers = [
      "Ký Hiệu",
      "Tuyến",
      "Ngày Hóa Đơn",
      "Biển số xe",
      "Số lượng",
      "Đơn giá",
      "Tiền trước thuế",
      "Tiền Thuế",
      "Thành tiền",
      "Ghi chú",
    ];
    worksheet.addRow(headers);

    // Áp dụng style cho tiêu đề
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0070C0" },
    };
    headerRow.alignment = { horizontal: "center" };

    // Thêm viền cho tiêu đề
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
    });

    // Thêm dữ liệu - chỉ giữ lại các cột được yêu cầu
    mergedInvoices.forEach((row) => {
      const dataRow = worksheet.addRow([
        row.inv_invoiceSeries || "",
        getTuyenBySeries(
          row.inv_buyerTaxCode || "3500676761",
          row.inv_invoiceSeries
        ) || "",
        row.inv_invoiceIssuedDate
          ? new Date(row.inv_invoiceIssuedDate).toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "",
        row.inv_departureDate || "",
        row.inv_quantity ? Number(row.inv_quantity) : "",
        row.inv_unitPrice ? Number(row.inv_unitPrice) : "",
        row.inv_TotalAmountWithoutVat
          ? Number(row.inv_TotalAmountWithoutVat)
          : "",
        row.inv_vatAmount ? Number(row.inv_vatAmount) : "",
        row.inv_TotalAmount ? Number(row.inv_TotalAmount) : "",
        row.ghi_chu || "",
      ]);

      // Thêm viền cho từng ô dữ liệu
      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        };
      });
    });

    // Tính tổng các cột cần tính
    const totalSoLuong = mergedInvoices.reduce(
      (sum, row) => sum + (row.inv_quantity || 0),
      0
    );
    const totalTruocThue = mergedInvoices.reduce(
      (sum, row) => sum + (row.inv_TotalAmountWithoutVat || 0),
      0
    );
    const totalThue = mergedInvoices.reduce(
      (sum, row) => sum + (row.inv_vatAmount || 0),
      0
    );
    const totalThanhTien = mergedInvoices.reduce(
      (sum, row) => sum + (row.inv_TotalAmount || 0),
      0
    );

    // Thêm dòng tổng cộng
    const totalRow = [
      "Tổng cộng",
      "",
      "",
      "",
      totalSoLuong,
      "",
      totalTruocThue,
      totalThue,
      totalThanhTien,
      "",
    ];
    const lastRow = worksheet.addRow(totalRow);

    // Định dạng dòng tổng cộng
    lastRow.font = { bold: true, color: { argb: "FF000000" } };
    lastRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFCCCCCC" },
    };
    lastRow.alignment = { horizontal: "right" };

    // Thêm viền cho dòng tổng cộng
    lastRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
    });

    // Lưu file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, "bao-cao-chi-tiet.xlsx");
  };

  return (
    <div className="container">
      {/* item button menu */}
      <div
        style={{
          backgroundColor: "#F8F9FA",
          borderWidth: "0.1px",
          borderColor: "#DEE2E6",
        }}
        className="flex col h-3rem  border-solid mr-3 ml-3 mt-3 border-round-sm"
      >
        <Button
          label="Lọc dữ liệu"
          className="w-1 min-h-full border-solid border-1 border-round-sm text-sm "
          onClick={() => setVisible(true)}
        ></Button>

        <Button
          onClick={exportToExcel}
          label="Xuất excel"
          className="w-1 min-h-full border-solid border-1 border-round-sm ml-2 text-sm "
        ></Button>
      </div>
      {/* table  */}
      <ReactDataTable
        invoices={mergedInvoices}
        getTuyenBySeries={getTuyenBySeries}
      />
      <Modal
        visible={visible}
        setVisible={setVisible}
        setInvoices={handleInvoices}
      ></Modal>
    </div>
  );
}

export default App;
