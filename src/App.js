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
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("bao-cao-chi-tiet");

    // Thêm tiêu đề
    const headers = [
      "Ký hiệu",
      "ID",
      "Trạng thái gửi CQT",
      "Ngày hoá đơn",
      "Số hoá đơn",
      "Số đơn hàng",
      "Tên đơn vị mua",
      "Tên người mua",
      "Địa chỉ",
      "Mã số thuế",
      "Mã hàng",
      "Tên hàng",
      "Đơn vị tính",
      // "Tuổi vàng",
      "Số lượng",
      "Đơn giá",
      // "Trọng lượng",
      // "Tiền công",
      "Tổng tiền hàng",
      "Tổng tiền CK",
      "Tổng tiền trước thuế",
      "Thuế suất",
      "Tổng tiền thuế",
      "Tổng tiền thanh toán",
      "Tính chất hàng hoá",
      "Mã tiền tệ",
      "Tỷ giá",
      "Hình thức TT",
      "Mã tra cứu",
      "Người lập",
      "Trạng thái",
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

    // Thêm dữ liệu
    flattenedInvoices.forEach((row) => {
      const dataRow = worksheet.addRow([
        row.inv_invoiceSeries || "",
        row.inv_invoiceAuth_id || "",
        row.is_success === 1 ? "Thành công" : "Có lỗi",
        row.inv_invoiceIssuedDate
          ? new Date(row.inv_invoiceIssuedDate).toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "",
        row.inv_invoiceNumber || "",
        row.so_benh_an || "",
        row.inv_buyerLegalName || "",
        row.inv_buyerDisplayName || "",
        row.inv_buyerAddressLine || "",
        row.inv_buyerTaxCode || "",
        row.inv_itemCode || "",
        row.inv_itemName || "",
        row.inv_unitCode || "",
        // row.inv_tuoivang,
        row.inv_quantity || "",
        row.inv_unitPrice ? row.inv_unitPrice.toFixed(2) : "",
        // row.inv_trongluong,
        // row.inv_tiencong || "",
        row.inv_TotalAmountWithoutVat
          ? row.inv_TotalAmountWithoutVat.toFixed(0)
          : "",
        row.inv_discountAmount ? row.inv_discountAmount.toFixed(0) : "",
        row.inv_TotalAmountWithoutVat
          ? row.inv_TotalAmountWithoutVat.toFixed(0)
          : "",
        row.ma_thue || "",
        row.inv_vatAmount ? row.inv_vatAmount.toFixed(0) : "",
        row.inv_TotalAmount ? row.inv_TotalAmount.toFixed(0) : "",
        row.tchat === 1
          ? "Hàng hoá, dịch vụ"
          : row.tchat === 2
          ? "Khuyến mãi"
          : row.tchat === 3
          ? "Chiết khấu thương mai"
          : "Ghi chú diễn giải",
        row.inv_currencyCode || "",
        row.inv_exchangeRate || "",
        row.inv_paymentMethodName || "",
        row.sobaomat || "",
        row.inv_creator || "",
        row.tthai || "",
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
    const totalTienCong = flattenedInvoices.reduce(
      (sum, row) => sum + (row.inv_tiencong || 0),
      0
    );
    const totalTienHang = flattenedInvoices.reduce(
      (sum, row) => sum + (row.inv_TotalAmountWithoutVat || 0),
      0
    );
    const totalTruocThue = flattenedInvoices.reduce(
      (sum, row) => sum + (row.inv_TotalAmountWithoutVat || 0),
      0
    );
    const totalThanhToan = flattenedInvoices.reduce(
      (sum, row) => sum + (row.inv_TotalAmount || 0),
      0
    );

    // Thêm dòng tổng cộng
    const totalRow = [
      "Tổng cộng", // Gộp các ô còn lại
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      totalTienCong,
      totalTienHang,
      "",
      totalTruocThue,
      "",
      "",
      totalThanhToan,
      "",
      "",
      "",
      "",
      "",
      "",
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
      <ReactDataTable invoices={invoices} />
      <Modal
        visible={visible}
        setVisible={setVisible}
        setInvoices={handleInvoices}
      ></Modal>
    </div>
  );
}

export default App;
