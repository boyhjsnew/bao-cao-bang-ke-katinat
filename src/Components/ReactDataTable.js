import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

export default function ReactDataTable(props) {
  // Sử dụng dữ liệu đã được xử lý từ App.js
  const displayData = props.invoices || [];
  const groupedInvoicesByTaxRate = props.groupedInvoicesByTaxRate || {};
  const reportType = props.reportType || "bang-ke-ban-ra";

  // Debug - Chỉ log khi cần thiết để tránh crash browser với dữ liệu lớn
  // Tắt debug logs khi có quá nhiều dữ liệu (> 1000 items)
  if (displayData.length < 1000) {
    // console.log("=== ReactDataTable Debug ===");
    // console.log("ReactDataTable - reportType:", reportType);
    // console.log("ReactDataTable - displayData length:", displayData.length);
    // console.log(
    //   "ReactDataTable - displayData sample:",
    //   displayData.slice(0, 2)
    // );
  }

  // Chỉ log summary khi có nhiều dữ liệu
  if (displayData.length >= 1000) {
    // console.log(
    //   `ReactDataTable - Có ${displayData.length} hóa đơn (đã tắt debug chi tiết để tối ưu)`
    // );
  }

  // Định nghĩa các nhóm thuế suất theo thứ tự (từ dưới lên trên)
  const taxRateGroups = [
    {
      id: "khac",
      label: "7. Hàng hoá, dịch vụ chịu thuế suất thuế GTGT KHÁC",
      order: 7,
    },
    {
      id: "10",
      label: "6. Hàng hoá, dịch vụ chịu thuế suất thuế GTGT 10%",
      order: 6,
    },
    {
      id: "8",
      label: "5. Hàng hoá, dịch vụ chịu thuế suất thuế GTGT 8%",
      order: 5,
    },
    {
      id: "5",
      label: "4. Hàng hoá, dịch vụ chịu thuế suất thuế GTGT 5%",
      order: 4,
    },
    {
      id: "0",
      label: "3. Hàng hoá, dịch vụ chịu thuế suất thuế GTGT 0%",
      order: 3,
    },
    {
      id: "khong-khai",
      label: "2. Hàng hóa, dịch vụ không kê khai nộp thuế",
      order: 2,
    },
    {
      id: "khong-chiu",
      label: "1. Hàng hóa, dịch vụ không chịu thuế GTGT",
      order: 1,
    },
  ];

  // Format số tiền
  const formatCurrency = (value) => {
    if (!value || value === 0) return "0";
    return Number(value)
      .toFixed(0)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Format ngày
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Format trạng thái hóa đơn
  const getInvoiceStatus = (invoice) => {
    const status =
      invoice.trang_thai_hd !== undefined
        ? invoice.trang_thai_hd
        : invoice.invoiceStatus;

    switch (status) {
      case 0:
        return "Gốc";
      case 2:
        return "Điều chỉnh";
      case 3:
        return "Thay thế";
      case 5:
        return "Bị điều chỉnh";
      case 6:
        return "Bị thay thế";
      default:
        return invoice.ghi_chu || "";
    }
  };

  // Render bảng kê bán ra với các nhóm thuế suất
  if (reportType === "bang-ke-ban-ra") {
    // Giới hạn số dòng hiển thị trên UI để tối ưu performance
    // Chỉ hiển thị một số dòng mẫu, dữ liệu Excel vẫn đầy đủ
    // Giảm số dòng hiển thị khi có quá nhiều dữ liệu để tránh crash browser
    // Tối ưu: chỉ đếm tổng số hóa đơn một lần, không dùng reduce với dữ liệu lớn
    let totalInvoices = 0;
    try {
      const groups = Object.values(groupedInvoicesByTaxRate);
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        if (Array.isArray(group)) {
          totalInvoices += group.length;
        }
      }
    } catch (e) {
      // console.warn("Lỗi khi đếm tổng số hóa đơn:", e);
      totalInvoices = displayData.length; // Fallback
    }

    // Điều chỉnh số dòng hiển thị dựa trên tổng số hóa đơn
    let MAX_ROWS_TO_DISPLAY = 20; // Mặc định
    if (totalInvoices > 50000) {
      MAX_ROWS_TO_DISPLAY = 5; // Chỉ hiển thị 5 dòng khi có quá nhiều dữ liệu
    } else if (totalInvoices > 20000) {
      MAX_ROWS_TO_DISPLAY = 10; // Hiển thị 10 dòng
    }

    return (
      <div
        style={{
          backgroundColor: "#F8F9FA",
          borderWidth: "0.1px",
          borderColor: "#DEE2E6",
        }}
        className="flex border-solid mr-3 ml-3 border-round-sm"
      >
        <div className="card w-full" style={{ overflowX: "auto" }}>
          {/* Thông báo tối ưu UI */}
          <div
            style={{
              padding: "10px",
              backgroundColor: "#FFF3CD",
              border: "1px solid #FFC107",
              borderRadius: "4px",
              margin: "10px",
              fontSize: "14px",
            }}
          >
            <strong>Lưu ý:</strong> Để tối ưu hiệu suất và tránh crash browser,
            giao diện chỉ hiển thị{" "}
            <strong>{MAX_ROWS_TO_DISPLAY} dòng đầu tiên</strong> cho mỗi nhóm
            thuế suất. Dữ liệu xuất Excel vẫn <strong>đầy đủ</strong> tất cả các
            hóa đơn ({totalInvoices.toLocaleString("vi-VN")} hóa đơn).
            {totalInvoices > 50000 && (
              <span
                style={{
                  color: "#DC3545",
                  fontWeight: "bold",
                  display: "block",
                  marginTop: "5px",
                }}
              >
                ⚠️ Dữ liệu rất lớn - Vui lòng xuất Excel ngay để tránh crash
                browser!
              </span>
            )}
          </div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#0070C0", color: "#FFFFFF" }}>
                <th
                  style={{
                    padding: "10px",
                    textAlign: "center",
                    border: "1px solid #000",
                    minWidth: "60px",
                  }}
                >
                  #
                </th>
                <th
                  style={{
                    padding: "10px",
                    textAlign: "center",
                    border: "1px solid #000",
                    minWidth: "120px",
                  }}
                >
                  Ký hiệu
                </th>
                <th
                  style={{
                    padding: "10px",
                    textAlign: "center",
                    border: "1px solid #000",
                    minWidth: "150px",
                  }}
                >
                  Tên cửa hàng
                </th>
                <th
                  style={{
                    padding: "10px",
                    textAlign: "center",
                    border: "1px solid #000",
                    minWidth: "130px",
                  }}
                >
                  Ngày hóa đơn
                </th>
                <th
                  style={{
                    padding: "10px",
                    textAlign: "center",
                    border: "1px solid #000",
                    minWidth: "130px",
                  }}
                >
                  Số hóa đơn
                </th>
                <th
                  style={{
                    padding: "10px",
                    textAlign: "center",
                    border: "1px solid #000",
                    minWidth: "200px",
                  }}
                >
                  Tên khách hàng
                </th>
                <th
                  style={{
                    padding: "10px",
                    textAlign: "center",
                    border: "1px solid #000",
                    minWidth: "150px",
                  }}
                >
                  Mã số thuế
                </th>
                <th
                  style={{
                    padding: "10px",
                    textAlign: "center",
                    border: "1px solid #000",
                    minWidth: "180px",
                  }}
                >
                  Tổng tiền trước thuế
                </th>
                <th
                  style={{
                    padding: "10px",
                    textAlign: "center",
                    border: "1px solid #000",
                    minWidth: "150px",
                  }}
                >
                  Tổng tiền thuế
                </th>
                <th
                  style={{
                    padding: "10px",
                    textAlign: "center",
                    border: "1px solid #000",
                    minWidth: "150px",
                  }}
                >
                  Ghi chú
                </th>
              </tr>
            </thead>
            <tbody>
              {taxRateGroups.map((group, groupIndex) => {
                // Lấy danh sách hóa đơn theo thuế suất từ groupedInvoicesByTaxRate
                const groupInvoices = groupedInvoicesByTaxRate[group.id] || [];

                // Tính tổng cho nhóm - Tối ưu: sử dụng for loop thay vì reduce để tránh crash với dữ liệu lớn
                let groupTotalBeforeTax = 0;
                let groupTotalTax = 0;

                // Chỉ tính tổng nếu có dữ liệu và không quá lớn (tránh crash browser)
                if (groupInvoices.length > 0 && groupInvoices.length < 100000) {
                  for (let i = 0; i < groupInvoices.length; i++) {
                    const inv = groupInvoices[i];
                    groupTotalBeforeTax +=
                      Number(inv.inv_TotalAmountWithoutVat) || 0;
                    groupTotalTax += Number(inv.inv_vatAmount) || 0;
                  }
                } else if (groupInvoices.length >= 100000) {
                  // Với dữ liệu quá lớn, bỏ qua tính tổng để tránh crash
                  // console.warn(
                  //   `Nhóm ${group.id} có ${groupInvoices.length} hóa đơn - bỏ qua tính tổng để tránh crash browser`
                  // );
                }

                // Chỉ hiển thị một số dòng đầu tiên để tối ưu UI
                const invoicesToDisplay = groupInvoices.slice(
                  0,
                  MAX_ROWS_TO_DISPLAY
                );
                const remainingCount =
                  groupInvoices.length - MAX_ROWS_TO_DISPLAY;

                let rowIndex = 0;

                return (
                  <React.Fragment key={group.id}>
                    {/* Dòng header nhóm */}
                    <tr style={{ backgroundColor: "#E7E6E6" }}>
                      <td
                        colSpan={9}
                        style={{
                          padding: "8px 10px",
                          fontWeight: "bold",
                          border: "1px solid #000",
                        }}
                      >
                        {group.label}
                      </td>
                    </tr>
                    {/* Các dòng chi tiết hóa đơn trong nhóm - chỉ hiển thị một số dòng đầu tiên */}
                    {groupInvoices.length > 0 ? (
                      <>
                        {invoicesToDisplay.map((invoice, idx) => {
                          rowIndex++;
                          return (
                            <tr key={idx}>
                              <td
                                style={{
                                  padding: "8px 10px",
                                  textAlign: "center",
                                  border: "1px solid #000",
                                }}
                              >
                                {rowIndex}
                              </td>
                              <td
                                style={{
                                  padding: "8px 10px",
                                  border: "1px solid #000",
                                }}
                              >
                                {invoice.inv_invoiceSeries || ""}
                              </td>
                              <td
                                style={{
                                  padding: "8px 10px",
                                  border: "1px solid #000",
                                }}
                              >
                                {invoice.tencuahang || ""}
                              </td>
                              <td
                                style={{
                                  padding: "8px 10px",
                                  border: "1px solid #000",
                                }}
                              >
                                {formatDate(invoice.inv_invoiceIssuedDate)}
                              </td>
                              <td
                                style={{
                                  padding: "8px 10px",
                                  border: "1px solid #000",
                                }}
                              >
                                {invoice.inv_invoiceNumber || ""}
                              </td>
                              <td
                                style={{
                                  padding: "8px 10px",
                                  border: "1px solid #000",
                                }}
                              >
                                {invoice.inv_buyerDisplayName ||
                                  invoice.inv_buyerLegalName ||
                                  invoice.ten ||
                                  ""}
                              </td>
                              <td
                                style={{
                                  padding: "8px 10px",
                                  border: "1px solid #000",
                                }}
                              >
                                {invoice.inv_buyerTaxCode || invoice.mst || ""}
                              </td>
                              <td
                                style={{
                                  padding: "8px 10px",
                                  textAlign: "right",
                                  border: "1px solid #000",
                                }}
                              >
                                {formatCurrency(
                                  invoice.inv_TotalAmountWithoutVat
                                )}
                              </td>
                              <td
                                style={{
                                  padding: "8px 10px",
                                  textAlign: "right",
                                  border: "1px solid #000",
                                }}
                              >
                                {formatCurrency(invoice.inv_vatAmount)}
                              </td>
                              <td
                                style={{
                                  padding: "8px 10px",
                                  border: "1px solid #000",
                                }}
                              >
                                {getInvoiceStatus(invoice)}
                              </td>
                            </tr>
                          );
                        })}
                        {/* Thông báo nếu còn nhiều dòng hơn */}
                        {remainingCount > 0 && (
                          <tr style={{ backgroundColor: "#FFF3CD" }}>
                            <td
                              colSpan={9}
                              style={{
                                padding: "8px 10px",
                                textAlign: "center",
                                border: "1px solid #000",
                                fontStyle: "italic",
                                color: "#856404",
                              }}
                            >
                              ... (Còn {remainingCount.toLocaleString("vi-VN")}{" "}
                              hóa đơn nữa, tổng cộng{" "}
                              {groupInvoices.length.toLocaleString("vi-VN")} hóa
                              đơn. Dữ liệu Excel sẽ đầy đủ tất cả)
                            </td>
                          </tr>
                        )}
                      </>
                    ) : (
                      // Hiển thị dòng trống nếu không có dữ liệu
                      <tr>
                        <td
                          colSpan={9}
                          style={{
                            padding: "8px 10px",
                            border: "1px solid #000",
                            height: "40px",
                          }}
                        ></td>
                      </tr>
                    )}
                    {/* Dòng tổng cộng cho nhóm */}
                    <tr
                      style={{ backgroundColor: "#E7E6E6", fontWeight: "bold" }}
                    >
                      <td
                        colSpan={6}
                        style={{
                          padding: "8px 10px",
                          textAlign: "right",
                          border: "1px solid #000",
                        }}
                      >
                        Tổng cộng
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          textAlign: "right",
                          border: "1px solid #000",
                        }}
                      >
                        {formatCurrency(groupTotalBeforeTax)}
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          textAlign: "right",
                          border: "1px solid #000",
                        }}
                      >
                        {formatCurrency(groupTotalTax)}
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          border: "1px solid #000",
                        }}
                      ></td>
                    </tr>
                  </React.Fragment>
                );
              })}
              {/* Dòng tổng cộng tổng thể */}
              {(() => {
                // Tính tổng cộng tổng thể từ tất cả các nhóm
                let grandTotalBeforeTax = 0;
                let grandTotalTax = 0;

                taxRateGroups.forEach((group) => {
                  const groupInvoices =
                    groupedInvoicesByTaxRate[group.id] || [];
                  // Tối ưu: dùng for loop thay vì reduce để tránh crash với dữ liệu lớn
                  if (groupInvoices.length < 100000) {
                    for (let i = 0; i < groupInvoices.length; i++) {
                      const inv = groupInvoices[i];
                      grandTotalBeforeTax +=
                        Number(inv.inv_TotalAmountWithoutVat) || 0;
                      grandTotalTax += Number(inv.inv_vatAmount) || 0;
                    }
                  } else {
                    // Bỏ qua tính tổng cho nhóm quá lớn để tránh crash
                    // console.warn(
                    //   `Bỏ qua tính grandTotal cho nhóm ${group.id} (${groupInvoices.length} hóa đơn) để tránh crash`
                    // );
                  }
                });

                return (
                  <tr
                    style={{ backgroundColor: "#E7E6E6", fontWeight: "bold" }}
                  >
                    <td
                      colSpan={6}
                      style={{
                        padding: "8px 10px",
                        textAlign: "right",
                        border: "1px solid #000",
                      }}
                    >
                      Tổng cộng
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        textAlign: "right",
                        border: "1px solid #000",
                      }}
                    >
                      {formatCurrency(grandTotalBeforeTax)}
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        textAlign: "right",
                        border: "1px solid #000",
                      }}
                    >
                      {formatCurrency(grandTotalTax)}
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        border: "1px solid #000",
                      }}
                    ></td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Render DataTable cho các báo cáo khác
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
          value={displayData.length > 0 ? displayData : [{}]}
          paginator
          paginatorPosition="bottom"
          rows={5}
          scrollable
          sortField="true"
          rowsPerPageOptions={[displayData.length || 5]}
          emptyMessage="Không có dữ liệu"
        >
          {/* Luôn hiển thị các cột cho bảng kê bán ra */}
          <Column
            header="#"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "60px",
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
              minWidth: "120px",
            }}
          ></Column>

          <Column
            sortable
            field="tencuahang"
            header="Tên cửa hàng"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "150px",
            }}
          ></Column>

          <Column
            sortable
            field="inv_invoiceIssuedDate"
            header="Ngày hóa đơn"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "130px",
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
            header="Số hóa đơn"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "130px",
            }}
          ></Column>

          <Column
            sortable
            field="inv_buyerName"
            header="Tên khách hàng"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "200px",
            }}
          ></Column>

          <Column
            sortable
            field="inv_buyerTaxCode"
            header="Mã số thuế"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "150px",
            }}
          ></Column>

          <Column
            sortable
            field="inv_TotalAmountWithoutVat"
            header="Tổng tiền trước thuế"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "180px",
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
            header="Tổng tiền thuế"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "150px",
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
            field="ghi_chu"
            header="Ghi chú"
            style={{
              width: "1%",
              fontSize: "14px",
              minWidth: "150px",
            }}
            body={(rowData) => {
              const status =
                rowData.trang_thai_hd !== undefined
                  ? rowData.trang_thai_hd
                  : rowData.invoiceStatus;

              switch (status) {
                case 0:
                  return "Gốc";
                case 2:
                  return "Điều chỉnh";
                case 3:
                  return "Thay thế";
                case 5:
                  return "Bị điều chỉnh";
                case 6:
                  return "Bị thay thế";
                default:
                  return rowData.ghi_chu || "";
              }
            }}
          ></Column>
          {/* Tạm thời ẩn các cột cho báo cáo khác */}
          {/* {reportType !== "bang-ke-ban-ra" && (
            <>
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
                  const taxCode = rowData.inv_buyerTaxCode || "0317701572";
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
                    if (value == null) return "";
                return value
                      .toFixed(0)
                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      .replace(".", ".");
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
            </>
          )} */}
        </DataTable>
      </div>
    </div>
  );
}
