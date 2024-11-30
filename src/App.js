import logo from "./logo.svg";

import { Button } from "primereact/button";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

import "../src/App.css";
import ReactDataTable from "./Components/ReactDataTable";
import { useState } from "react";
import Modal from "./Components/Modal";
import * as XLSX from "xlsx"; // Import xlsx for Excel export
import { saveAs } from "file-saver"; // Import file-saver to save the file

function App() {
  const paginatorLeft = <Button type="button" icon="pi pi-refresh" text />;
  const paginatorRight = <Button type="button" icon="pi pi-download" text />;
  const [visible, setVisible] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const handleInvoices = (invoicesData) => {
    setInvoices(invoicesData);
  };
  const flattenedInvoices = invoices.flatMap((invoice) =>
    invoice.details.map((detail) => ({
      ...invoice, // Thêm thông tin hóa đơn vào chi tiết
      ...detail, // Gộp thông tin chi tiết
    }))
  );
  const exportToExcel = () => {
    // Prepare the headers and data from the DataTable
    const wsData = flattenedInvoices.map((row) => ({
      "Ký hiệu": row.inv_invoiceSeries,
      "Trạng thái gửi CQT": row.is_success == 1 ? "Thành công" : "Có lỗi",
      "Ngày hoá đơn": new Date(row.inv_invoiceIssuedDate).toLocaleDateString(
        "vi-VN",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      ),
      "Số hoá đơn": row.inv_invoiceNumber,
      "Số đơn hàng": row.so_benh_an,
      "Tên đơn vị mua": row.inv_buyerLegalName,
      "Tên người mua": row.inv_buyerDisplayName,
      "Địa chỉ": row.inv_buyerAddressLine,
      "Mã số thuế": row.inv_buyerTaxCode,
      "Mã hàng": row.inv_itemCode,
      "Tên hàng": row.inv_itemName,
      "Đơn vị tính": row.inv_unitCode,
      "Tuổi vàng": row.inv_tuoivang,
      "Số lượng": row.inv_quantity,
      "Đơn giá": row.inv_unitPrice ? row.inv_unitPrice : null, // Use raw value
      "Trọng lượng": row.inv_trongluong ? row.inv_trongluong : null, // Use raw value
      "Tiền công": row.inv_tiencong ? row.inv_tiencong : null, // Use raw value
      "Tổng tiền hàng": row.inv_TotalAmountWithoutVat
        ? row.inv_TotalAmountWithoutVat
        : null, // Use raw value
      "Tổng tiền CK": row.inv_discountAmount ? row.inv_discountAmount : null, // Use raw value
      "Tổng tiền trước thuế": row.inv_TotalAmountWithoutVat
        ? row.inv_TotalAmountWithoutVat
        : null, // Use raw value
      "Thuế suất": row.inv_taxRate ? `${row.inv_taxRate}%` : "",
      "Tổng tiền thuế": row.inv_taxAmount ? row.inv_taxAmount : null, // Use raw value
      "Tổng tiền thanh toán": row.inv_TotalAmount ? row.inv_TotalAmount : null, // Use raw value
      "Tính chất hàng hoá":
        row.tchat == 1
          ? "Hàng hoá, dịch vụ"
          : row.tchat == 2
          ? "Khuyến mãi"
          : row.tchat == 3
          ? "Chiết khấu thương mai"
          : "Ghi chú diễn giải",
      "Mã tiền tệ": row.inv_currencyCode,
      "Tỷ giá": row.inv_exchangeRate,
      "Hình thức TT": row.inv_paymentMethodName,
      "Mã tra cứu": row.sobaomat,
      "Người lập": row.inv_creator, // Assuming this field exists
      "Trạng thái":
        row.is_tthdon == 0
          ? "Gốc"
          : row.is_tthdon == 6
          ? "Bị thay thế"
          : "Thay thế",
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(wsData);

    // Ensure numbers are treated as numbers in Excel
    const range = ws["!ref"];
    const cells = XLSX.utils.decode_range(range);

    // Loop through all rows and columns
    for (let R = cells.s.r; R <= cells.e.r; ++R) {
      for (let C = cells.s.c; C <= cells.e.c; ++C) {
        const address = { r: R, c: C };
        const cell = ws[XLSX.utils.encode_cell(address)];

        // Set numeric cells to number type
        if (cell && cell.v !== null && !isNaN(cell.v)) {
          cell.t = "n"; // Mark as number type in Excel
        }
      }
    }

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");

    // Export to Excel
    const excelFile = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelFile], {
      bookType: "xlsx",
      type: "application/octet-stream",
    });

    saveAs(blob, "Invoices.xlsx"); // Download the Excel file
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
        className="flex col h-3rem  border-solid mr-3 ml-3 mt-3 border-round-sm  "
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
