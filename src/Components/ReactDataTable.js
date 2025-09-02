import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

export default function ReactDataTable(props) {
  // Chuyển đổi dữ liệu với kiểm tra an toàn
  const flattenedInvoices = (props.invoices || []).flatMap((invoice) => {
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

  return (
    <div
      style={{
        backgroundColor: "#F8F9FA",
        borderWidth: "0.1px",
        borderColor: "#DEE2E6",
      }}
      className="flex border-solid mr-3 ml-3 border-round-sm"
    >
      <div className="card w-full">
        <DataTable
          value={flattenedInvoices}
          paginator
          paginatorPosition="bottom"
          rows={5}
          scrollable
          sortField="true"
          rowsPerPageOptions={[(props.invoices || []).length]}
        >
          {/* Cột thông tin hóa đơn */}
          <Column
            header="#"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "110px",
            }}
            body={(rowData, options) => options.rowIndex + 1}
          ></Column>

          <Column
            sortable
            field="inv_invoiceNumber"
            header="Số HĐ"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
          ></Column>

          <Column
            sortable
            field="inv_invoiceSeries"
            header="Ký Hiệu"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
          ></Column>

          <Column
            sortable
            field="inv_itemName"
            header="Tuyến"
            style={{
              width: "10%",
              fontSize: "14px",
              minWidth: "160px",
            }}
            body={(rowData) => {
              const taxCode = rowData.inv_buyerTaxCode || "3500676761";
              const series = rowData.inv_invoiceSeries;
              return props.getTuyenBySeries
                ? props.getTuyenBySeries(taxCode, series)
                : series;
            }}
          ></Column>

          <Column
            sortable
            field="inv_invoiceIssuedDate"
            header="Ngày Hóa Đơn"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
            body={(rowData) => {
              if (!rowData.inv_invoiceIssuedDate) return "";
              const date = new Date(rowData.inv_invoiceIssuedDate);
              return date.toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              });
            }}
          />

          <Column
            sortable
            field="inv_departureDate"
            header="Biển số xe"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
          ></Column>

          <Column
            sortable
            field="inv_quantity"
            header="Số lượng"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
          ></Column>

          <Column
            sortable
            field="inv_unitPrice"
            header="Đơn giá"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
            body={(rowData) =>
              rowData.inv_unitPrice
                ? rowData.inv_unitPrice
                    .toFixed(2)
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                : ""
            }
          />

          <Column
            sortable
            field="inv_TotalAmountWithoutVat"
            header="Tiền trước thuế"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
            body={(rowData) =>
              rowData.inv_TotalAmountWithoutVat
                ? rowData.inv_TotalAmountWithoutVat
                    .toFixed(0)
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                : ""
            }
          />

          <Column
            sortable
            field="inv_vatAmount"
            header="Tiền Thuế"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
            body={(rowData) =>
              rowData.inv_vatAmount
                ? rowData.inv_vatAmount
                    .toFixed(0)
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                : ""
            }
          />

          <Column
            sortable
            field="inv_TotalAmount"
            header="Thành tiền"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
            body={(rowData) => {
              const formatCustomCurrency = (value) => {
                if (value == null) return ""; // Xử lý giá trị null hoặc undefined
                return value
                  .toFixed(0) // Đảm bảo luôn có 2 chữ số thập phân
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ",") // Thêm dấu , phân cách hàng nghìn
                  .replace(".", "."); // Đảm bảo dấu . cho phần thập phân
              };

              return formatCustomCurrency(rowData.inv_TotalAmount);
            }}
          />

          <Column
            sortable
            field="ghi_chu"
            header="Ghi chú"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
          ></Column>
        </DataTable>
      </div>
    </div>
  );
}
