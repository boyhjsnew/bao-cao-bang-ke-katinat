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
            field="inv_invoiceSeries"
            header="Ký hiệu"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
          ></Column>
          <Column
            sortable
            field="inv_invoiceAuth_id"
            header="id"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
          ></Column>
          <Column
            sortable
            field="is_success"
            header="Trạng thái gửi CQT"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
            body={(rowData) =>
              rowData.is_success === 1 ? "Thành công" : "Có lỗi"
            }
          ></Column>
          <Column
            sortable
            field="inv_invoiceIssuedDate"
            header="Ngày hoá đơn"
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
            field="inv_invoiceNumber"
            header="Số hoá đơn"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
          ></Column>
          <Column
            sortable
            field="inv_invoiceNumber"
            header="Key API"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
          ></Column>
          <Column
            sortable
            field="so_benh_an"
            header="Số đơn hàng"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
          ></Column>
          <Column
            sortable
            field="inv_buyerLegalName"
            header="Tên đơn vị mua"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
          ></Column>
          <Column
            sortable
            field="inv_buyerDisplayName"
            header="Tên người mua"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
          ></Column>
          <Column
            sortable
            field="inv_buyerAddressLine"
            header="Địa chỉ"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
          ></Column>
          <Column
            sortable
            field="inv_buyerTaxCode"
            header="Mã số thuế"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
          ></Column>
          <Column
            sortable
            field="inv_itemCode"
            header="Mã hàng"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
          ></Column>
          <Column
            sortable
            field="inv_itemName"
            header="Tên hàng"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
          ></Column>
          <Column
            sortable
            field="inv_unitCode"
            header="Đơn vị tính"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
          ></Column>
          <Column
            sortable
            field="inv_tuoivang"
            header="Tuổi vàng"
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
            field="inv_trongluong"
            header="Trọng lượng"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
            body={(rowData) =>
              rowData.inv_trongluong
                ? rowData.inv_trongluong
                    .toFixed(3)
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                : ""
            }
          />
          <Column
            sortable
            field="inv_tiencong"
            header="Tiền công"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
            body={(rowData) =>
              rowData.inv_tiencong
                ? rowData.inv_tiencong
                    .toFixed(0)
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                : ""
            }
          />
          <Column
            sortable
            field="inv_TotalAmountWithoutVat"
            header="Tổng tiền hàng"
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
            field="inv_discountAmount"
            header="Tổng tiền CK"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
            body={(rowData) =>
              rowData.inv_discountAmount
                ? rowData.inv_discountAmount
                    .toFixed(0)
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                : ""
            }
          />
          <Column
            sortable
            field="inv_TotalAmountWithoutVat"
            header="Tổng tiền trước thuế"
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
            field="inv_taxRate"
            header="Thuế suất"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
            body={(rowData) =>
              rowData.inv_taxRate ? `${rowData.inv_taxRate.toFixed(0)}%` : ""
            }
          />
          <Column
            sortable
            field="inv_taxAmount"
            header="Tổng tiền thuế"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
            body={(rowData) =>
              rowData.inv_taxAmount
                ? rowData.inv_taxAmount
                    .toFixed(0)
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                : ""
            }
          />

          <Column
            sortable
            field="inv_TotalAmount"
            header="Tổng tiền thanh toán"
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
            field="tchat"
            header="Tính chất hàng hoá"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
            body={(rowData) =>
              rowData.tchat === 1
                ? "Hàng hoá, dịch vụ"
                : rowData.tchat === 2
                ? "Khuyến mãi"
                : rowData.tchat === 3
                ? "Chiết khấu thương mai"
                : "Ghi chú diễn giải"
            }
          ></Column>
          <Column
            sortable
            field="inv_currencyCode"
            header="Mã tiền tệ"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
          ></Column>
          <Column
            sortable
            field="inv_exchangeRate"
            header="Tỷ giá"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
          ></Column>
          <Column
            sortable
            field="inv_paymentMethodName"
            header="Hình thức TT"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
          ></Column>
          <Column
            sortable
            field="sobaomat"
            header="Mã tra cứu"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
          ></Column>
          <Column
            sortable
            field=""
            header="Người lập"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
          ></Column>
          <Column
            sortable
            field=""
            header="Trạng thái"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "160px",
            }}
            body={(rowData) => {
              let result;
              switch (rowData.is_tthdon) {
                case 0:
                  result = "Gốc";
                  break;
                case 6:
                  result = "Bị thay thế";
                  break;
                case 3:
                  result = "Thay thế";
                  break;
                default:
                  result = "Ghi chú diễn giải";
              }
              return result;
            }}
          ></Column>
          <Column
            sortable
            field="tthai"
            header="Trạng thái"
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
