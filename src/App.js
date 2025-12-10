import { Button } from "primereact/button";

import "../src/App.css";
import ReactDataTable from "./Components/ReactDataTable";
import { useState, useMemo } from "react";
import Modal from "./Components/Modal";
import * as ExcelJS from "exceljs";

import { saveAs } from "file-saver"; // Import file-saver to save the file

function App() {
  const [visible, setVisible] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [selectedTaxCode, setSelectedTaxCode] = useState(null); // Thêm state để lưu mã số thuế đã chọn
  const [reportType, setReportType] = useState("bang-ke-ban-ra"); // State để quản lý loại báo cáo
  const [fromDate, setFromDate] = useState(null); // State để lưu từ ngày
  const [toDate, setToDate] = useState(null); // State để lưu đến ngày

  const handleInvoices = (
    invoicesData,
    taxCode,
    reportType,
    fromDateParam,
    toDateParam
  ) => {
    // Cập nhật để nhận thêm taxCode, reportType, fromDate và toDate
    setInvoices(invoicesData);
    setSelectedTaxCode(taxCode); // Lưu mã số thuế đã chọn
    setReportType(reportType); // Lưu loại báo cáo đã chọn
    setFromDate(fromDateParam); // Lưu từ ngày
    setToDate(toDateParam); // Lưu đến ngày
  };

  // Function để xác định tuyến dựa trên mã số thuế và ký hiệu
  const getTuyenBySeries = (taxCode, series) => {
    // Sử dụng taxCode được truyền vào từ ReactDataTable
    if (!taxCode) {
      // console.log("getTuyenBySeries - Không có mã số thuế");
      return "Không có MST";
    }

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
        "5C25MAD": "BX Miền Tây - BX Vũng Tây",
        "5C25MAC": "BX Miền Tây - BX Bà Rịa",
        "5C25MAB": "BX. MIỀN ĐÔNG - BX. VŨNG TÀU",
        "5C25MAA": "Phường Bến Thành - Phường Vũng Tàu",
      },
    };

    // Debug log để kiểm tra
    // console.log("getTuyenBySeries - taxCode:", taxCode, "series:", series);

    // Chỉ xử lý 2 mã số thuế được định nghĩa
    if (!tuyens[taxCode]) {
      // console.log("getTuyenBySeries - Mã số thuế không được hỗ trợ:", taxCode);
      return "Không xác định";
    }

    const result = tuyens[taxCode]?.[series];
    // console.log("getTuyenBySeries - result:", result);

    return result || "Không xác định";
  };

  // Helper function để tính toán mergedInvoices từ invoices và reportType
  const calculateMergedInvoices = (invoicesData, currentReportType) => {
    // Đảm bảo invoicesData luôn là array
    const invoicesArray = Array.isArray(invoicesData) ? invoicesData : [];

    const flattenedInvoices = invoicesArray.flatMap((invoice) => {
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

    // Xử lý dữ liệu dựa trên loại báo cáo
    let groupedInvoices = {};

    if (currentReportType === "tong-hop-tem-ve") {
      // Báo cáo tổng hợp tem, vé: Group by Ký hiệu + Ngày
      groupedInvoices = flattenedInvoices.reduce((groups, invoice) => {
        const key = `${invoice.inv_invoiceSeries || ""}_${
          invoice.inv_invoiceIssuedDate || ""
        }`;

        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(invoice);
        return groups;
      }, {});
    } else if (currentReportType === "bang-ke-ban-ra") {
      // Bảng kê bán ra: Group theo thuế suất từ ma_thue trong details
      // Xử lý từng hóa đơn gốc (không flatten)
      const processedInvoices = invoicesArray.map((invoice) => {
        // Tính thuế suất chính của hóa đơn từ details
        let mainTaxRate = null;

        if (
          invoice.details &&
          Array.isArray(invoice.details) &&
          invoice.details.length > 0
        ) {
          // Lấy ma_thue từ detail có giá trị lớn nhất
          const detailsWithValue = invoice.details.filter(
            (d) => d.inv_TotalAmountWithoutVat > 0
          );

          if (detailsWithValue.length > 0) {
            // Lấy ma_thue từ detail có giá trị lớn nhất
            const mainDetail = detailsWithValue.reduce((max, d) =>
              d.inv_TotalAmountWithoutVat > max.inv_TotalAmountWithoutVat
                ? d
                : max
            );
            mainTaxRate = mainDetail.ma_thue;
          } else {
            // Nếu không có detail có giá trị, lấy ma_thue đầu tiên
            mainTaxRate = invoice.details[0]?.ma_thue;
          }
        }

        // Map ma_thue sang id nhóm thuế suất
        // ma_thue có thể là: "8", "10", "5", "0", null, hoặc các giá trị khác
        let taxRateGroupId = "khong-chiu"; // Default

        if (mainTaxRate === "8") {
          taxRateGroupId = "8";
        } else if (mainTaxRate === "10") {
          taxRateGroupId = "10";
        } else if (mainTaxRate === "5") {
          taxRateGroupId = "5";
        } else if (mainTaxRate === "0") {
          taxRateGroupId = "0";
        } else if (
          mainTaxRate &&
          mainTaxRate !== "0" &&
          mainTaxRate !== "5" &&
          mainTaxRate !== "8" &&
          mainTaxRate !== "10"
        ) {
          taxRateGroupId = "khac";
        } else if (!mainTaxRate) {
          // Nếu không có ma_thue, tính từ tổng
          if (invoice.inv_TotalAmountWithoutVat > 0) {
            const calculatedRate =
              (invoice.inv_vatAmount / invoice.inv_TotalAmountWithoutVat) * 100;
            if (Math.abs(calculatedRate) < 0.1) taxRateGroupId = "0";
            else if (Math.abs(calculatedRate - 5) < 0.1) taxRateGroupId = "5";
            else if (Math.abs(calculatedRate - 8) < 0.1) taxRateGroupId = "8";
            else if (Math.abs(calculatedRate - 10) < 0.1) taxRateGroupId = "10";
            else if (calculatedRate > 0) taxRateGroupId = "khac";
            else taxRateGroupId = "khong-chiu";
          } else {
            taxRateGroupId = "khong-chiu";
          }
        }

        return {
          ...invoice,
          _taxRateGroupId: taxRateGroupId,
        };
      });

      // Group theo thuế suất
      groupedInvoices = processedInvoices.reduce((groups, invoice) => {
        const taxRate = invoice._taxRateGroupId || "khong-chiu";

        if (!groups[taxRate]) {
          groups[taxRate] = [];
        }
        groups[taxRate].push(invoice);
        return groups;
      }, {});

      // Sắp xếp các hóa đơn trong mỗi nhóm thuế suất:
      // 1. Theo ký hiệu (inv_invoiceSeries) - tuần tự
      // 2. Trong cùng ký hiệu: theo ngày hóa đơn (từ nhỏ đến lớn)
      // 3. Trong cùng ký hiệu và ngày: theo số hóa đơn (từ nhỏ đến lớn)
      Object.keys(groupedInvoices).forEach((taxRate) => {
        groupedInvoices[taxRate].sort((a, b) => {
          // So sánh ký hiệu (inv_invoiceSeries)
          const seriesA = a.inv_invoiceSeries || "";
          const seriesB = b.inv_invoiceSeries || "";

          if (seriesA !== seriesB) {
            return seriesA.localeCompare(seriesB, "vi", {
              numeric: true,
              sensitivity: "base",
            });
          }

          // Nếu cùng ký hiệu, so sánh ngày hóa đơn
          const dateA = a.inv_invoiceIssuedDate
            ? new Date(a.inv_invoiceIssuedDate).getTime()
            : 0;
          const dateB = b.inv_invoiceIssuedDate
            ? new Date(b.inv_invoiceIssuedDate).getTime()
            : 0;

          if (dateA !== dateB) {
            return dateA - dateB; // Từ nhỏ đến lớn
          }

          // Nếu cùng ký hiệu và ngày, so sánh số hóa đơn
          const numberA = Number(a.inv_invoiceNumber) || 0;
          const numberB = Number(b.inv_invoiceNumber) || 0;

          return numberA - numberB; // Từ nhỏ đến lớn
        });

        // Log để kiểm tra sắp xếp (chỉ log 5 dòng đầu tiên)
        // if (groupedInvoices[taxRate].length > 0) {
        //   console.log(
        //     `=== Sắp xếp nhóm ${taxRate} (${groupedInvoices[taxRate].length} hóa đơn) ===`
        //   );
        //   const sample = groupedInvoices[taxRate].slice(0, 5).map((inv) => ({
        //     series: inv.inv_invoiceSeries,
        //     date: inv.inv_invoiceIssuedDate,
        //     number: inv.inv_invoiceNumber,
        //   }));
        //   console.log("5 hóa đơn đầu tiên:", sample);
        // }
      });
    } else {
      // Báo cáo theo biển số xe: Group by ký hiệu, ngày và biển số xe
      groupedInvoices = flattenedInvoices.reduce((groups, invoice) => {
        // Tạo key duy nhất từ 3 trường: ký hiệu + ngày + biển số xe
        const key = `${invoice.inv_invoiceSeries || ""}_${
          invoice.inv_invoiceIssuedDate || ""
        }_${invoice.inv_departureDate || "Không có biển số"}`;

        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(invoice);
        return groups;
      }, {});
    }

    // Debug log để kiểm tra
    // console.log("=== THÔNG TIN DỮ LIỆU ===");
    // console.log("Loại báo cáo:", currentReportType);
    // console.log("Tổng số hóa đơn từ API:", invoicesArray.length);
    // console.log(
    //   "invoicesData type:",
    //   typeof invoicesData,
    //   Array.isArray(invoicesData)
    // );
    // console.log("Số lượng dòng gốc (sau flatten):", flattenedInvoices.length);
    // console.log(
    //   "Số lượng nhóm sau khi group:",
    //   Object.keys(groupedInvoices).length
    // );

    // if (currentReportType === "bang-ke-ban-ra") {
    //   console.log("=== PHÂN BỐ THEO THUẾ SUẤT ===");
    //   Object.keys(groupedInvoices).forEach((taxRate) => {
    //     const count = groupedInvoices[taxRate].length;
    //     const totalBeforeTax = groupedInvoices[taxRate].reduce(
    //       (sum, inv) => sum + (Number(inv.inv_TotalAmountWithoutVat) || 0),
    //       0
    //     );
    //     const totalTax = groupedInvoices[taxRate].reduce(
    //       (sum, inv) => sum + (Number(inv.inv_vatAmount) || 0),
    //       0
    //     );
    //     console.log(
    //       `Nhóm ${taxRate}: ${count} hóa đơn | Trước thuế: ${totalBeforeTax.toLocaleString(
    //         "vi-VN"
    //       )} | Thuế: ${totalTax.toLocaleString("vi-VN")}`
    //     );
    //   });
    // }

    // console.log("Các nhóm:", Object.keys(groupedInvoices).slice(0, 5));

    // Gộp các dòng theo logic tương ứng với loại báo cáo
    let result = [];

    if (currentReportType === "bang-ke-ban-ra") {
      // Bảng kê bán ra: Không merge, giữ nguyên từng hóa đơn, chỉ group theo thuế suất
      // Dữ liệu đã được group theo thuế suất trong groupedInvoices
      // mergedInvoices sẽ là object với key là thuế suất, value là array các hóa đơn

      // Log để kiểm tra groupedInvoices
      // console.log("=== KIỂM TRA groupedInvoices CHO BANG-KE-BAN-RA ===");
      // console.log("groupedInvoices keys:", Object.keys(groupedInvoices));
      // console.log("groupedInvoices type:", typeof groupedInvoices);
      // Object.keys(groupedInvoices).forEach((key) => {
      //   const group = groupedInvoices[key];
      //   console.log(
      //     `  - Nhóm ${key}: ${
      //       Array.isArray(group) ? group.length : "không phải array"
      //     } hóa đơn`
      //   );
      // });

      result = groupedInvoices;
    } else {
      // Các báo cáo khác: Merge như cũ
      result = Object.keys(groupedInvoices)
        .sort((a, b) => {
          // Sắp xếp theo key để giữ thứ tự logic
          return a.localeCompare(b);
        })
        .map((key) => {
          const invoicesInGroup = groupedInvoices[key];

          // Lấy thông tin từ dòng đầu tiên của nhóm
          const firstInvoice = invoicesInGroup[0];

          // Cộng dồn các cột số liệu
          const totalQuantity = invoicesInGroup.reduce(
            (sum, inv) => sum + (Number(inv.inv_quantity) || 0),
            0
          );
          const totalBeforeTax = invoicesInGroup.reduce(
            (sum, inv) => sum + (Number(inv.inv_TotalAmountWithoutVat) || 0),
            0
          );
          const totalTax = invoicesInGroup.reduce(
            (sum, inv) => sum + (Number(inv.inv_vatAmount) || 0),
            0
          );
          const totalAmount = invoicesInGroup.reduce(
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
            // Thêm thông tin về số lượng dòng gộp cho báo cáo tổng hợp tem, vé
            ...(currentReportType === "tong-hop-tem-ve" && {
              _groupCount: invoicesInGroup.length,
            }),
          };
        });
    }

    // Debug log để kiểm tra kết quả
    // if (currentReportType === "bang-ke-ban-ra") {
    //   console.log(
    //     "Bảng kê bán ra - Số nhóm thuế suất:",
    //     Object.keys(result).length
    //   );
    //   console.log("Bảng kê bán ra - Các nhóm:", Object.keys(result));
    //   Object.keys(result).forEach((taxRate) => {
    //     console.log(`Nhóm ${taxRate}: ${result[taxRate].length} hóa đơn`);
    //   });
    // } else {
    //   console.log("Số lượng dòng sau khi merge:", result.length);
    //   console.log(
    //     "Mẫu dữ liệu sau khi merge:",
    //     result.slice(0, 3).map((item) => ({
    //       series: item.inv_invoiceSeries,
    //       date: item.inv_invoiceIssuedDate,
    //       bienSo: item.inv_departureDate,
    //       quantity: item.inv_quantity,
    //       groupCount: item._groupCount,
    //     }))
    //   );
    // }

    // Đảm bảo result luôn là object (không phải undefined)
    if (currentReportType === "bang-ke-ban-ra") {
      // Đảm bảo result là object
      return result && typeof result === "object" ? result : {};
    } else {
      // Đảm bảo result là array
      return Array.isArray(result) ? result : [];
    }
  };

  // Sử dụng useMemo để tính toán lại mergedInvoices khi invoices hoặc reportType thay đổi
  const mergedInvoices = useMemo(() => {
    return calculateMergedInvoices(invoices, reportType);
  }, [invoices, reportType]);
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("bao-cao-chi-tiet");

    // Thêm tiêu đề - khác nhau tùy theo loại báo cáo
    const headers =
      reportType === "tong-hop-tem-ve"
        ? [
            "Ký Hiệu",
            "Ngày Hóa Đơn",
            "Tên hàng",
            "Số lượng",
            "Đơn giá",
            "Tiền trước thuế",
            "Tiền Thuế",
            "Thành tiền",
            "Ghi chú",
          ]
        : [
            "Ký Hiệu",
            "Tuyến",
            "Ngày Hóa Đơn",
            "Biển số xe",
            "Tên hàng",
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

    // Thêm dữ liệu - khác nhau tùy theo loại báo cáo
    mergedInvoices.forEach((row) => {
      if (reportType === "tong-hop-tem-ve") {
        // Báo cáo tổng hợp tem, vé: Không có Tuyến và Biển số xe
        const dataRow = worksheet.addRow([
          row.inv_invoiceSeries || "",
          row.inv_invoiceIssuedDate
            ? new Date(row.inv_invoiceIssuedDate).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : "",
          row.inv_itemName || "",
          row.inv_quantity ? Number(row.inv_quantity) : "",
          row.inv_unitPrice ? Number(row.inv_unitPrice) : "",
          row.inv_TotalAmountWithoutVat
            ? Number(row.inv_TotalAmountWithoutVat)
            : "",
          row.inv_vatAmount ? Number(row.inv_vatAmount) : "",
          row.inv_TotalAmount ? Number(row.inv_TotalAmount) : "",
          row.ghi_chu || "",
        ]);
      } else {
        // Báo cáo theo biển số xe: Có đầy đủ các cột
        const dataRow = worksheet.addRow([
          row.inv_invoiceSeries || "",
          getTuyenBySeries(
            row.inv_sellerTaxCode || "",
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
          row.inv_itemName || "",
          row.inv_quantity ? Number(row.inv_quantity) : "",
          row.inv_unitPrice ? Number(row.inv_unitPrice) : "",
          row.inv_TotalAmountWithoutVat
            ? Number(row.inv_TotalAmountWithoutVat)
            : "",
          row.inv_vatAmount ? Number(row.inv_vatAmount) : "",
          row.inv_TotalAmount ? Number(row.inv_TotalAmount) : "",
          row.ghi_chu || "",
        ]);
      }

      // Thêm viền cho từng ô dữ liệu
      const currentRow =
        reportType === "tong-hop-tem-ve"
          ? worksheet.getRow(worksheet.rowCount)
          : worksheet.getRow(worksheet.rowCount);

      currentRow.eachCell((cell) => {
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

    // Thêm dòng tổng cộng - khác nhau tùy theo loại báo cáo
    const totalRow =
      reportType === "tong-hop-tem-ve"
        ? [
            "Tổng cộng",
            "",
            "",
            totalSoLuong,
            "",
            totalTruocThue,
            totalThue,
            totalThanhTien,
            "",
          ]
        : [
            "Tổng cộng",
            "",
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

  // Đếm tổng số dòng sẽ xuất
  const countTotalRows = (mergedInvoices, taxRateGroups) => {
    let totalRows = 1; // Header
    taxRateGroups.forEach((group) => {
      const groupInvoices = mergedInvoices[group.id] || [];
      totalRows += 1; // Header nhóm
      totalRows += groupInvoices.length; // Dữ liệu
      totalRows += 1; // Tổng cộng nhóm
    });
    totalRows += 1; // Tổng cộng tổng thể
    return totalRows;
  };

  // Helper functions cho export Excel
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

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Helper function để format ngày
  const formatDateForExcel = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper function để lấy tên tháng
  const getMonthName = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const months = [
      "tháng 1",
      "tháng 2",
      "tháng 3",
      "tháng 4",
      "tháng 5",
      "tháng 6",
      "tháng 7",
      "tháng 8",
      "tháng 9",
      "tháng 10",
      "tháng 11",
      "tháng 12",
    ];
    return months[d.getMonth()];
  };

  const addHeaderToSheet = (ws, addTitleRows = false) => {
    let startRow = 1;

    // Thêm 2 dòng tiêu đề nếu được yêu cầu
    if (addTitleRows && fromDate && toDate) {
      // Thêm dòng 1: Mã số thuế - tháng
      const taxCodeDisplay = selectedTaxCode?.code || selectedTaxCode || "N/A";
      const monthName = getMonthName(fromDate);
      const titleRow1 = ws.addRow([`${taxCodeDisplay} - ${monthName}`]);
      titleRow1.getCell(1).font = { bold: true, size: 14 };
      titleRow1.getCell(1).alignment = { horizontal: "left" };
      ws.mergeCells(1, 1, 1, 10); // Merge 10 cột

      // Thêm dòng 2: Từ ngày đến ngày
      const fromDateStr = formatDateForExcel(fromDate);
      const toDateStr = formatDateForExcel(toDate);
      const titleRow2 = ws.addRow([
        `Khoảng thời gian: Từ ngày ${fromDateStr} đến ngày ${toDateStr}`,
      ]);
      titleRow2.getCell(1).font = { bold: true, size: 12 };
      titleRow2.getCell(1).alignment = { horizontal: "left" };
      ws.mergeCells(2, 1, 2, 10); // Merge 10 cột

      // Thêm dòng trống
      ws.addRow([]);
      startRow = 4; // Header giờ ở dòng 4
    }

    const headers = [
      "#",
      "Ký hiệu",
      "Tên cửa hàng",
      "Ngày hóa đơn",
      "Số hóa đơn",
      "Tên khách hàng",
      "Mã số thuế",
      "Tổng tiền trước thuế",
      "Tổng tiền thuế",
      "Ghi chú",
    ];

    ws.addRow(headers);

    // Áp dụng style cho tiêu đề
    const headerRow = ws.getRow(startRow);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0070C0" },
    };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };

    // Thêm viền cho tiêu đề
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
    });
  };

  const setColumnWidths = (ws) => {
    ws.columns = [
      { width: 8 }, // #
      { width: 15 }, // Ký hiệu
      { width: 20 }, // Tên cửa hàng
      { width: 15 }, // Ngày hóa đơn
      { width: 15 }, // Số hóa đơn
      { width: 30 }, // Tên khách hàng
      { width: 18 }, // Mã số thuế
      { width: 20 }, // Tổng tiền trước thuế
      { width: 18 }, // Tổng tiền thuế
      { width: 20 }, // Ghi chú
    ];
  };

  const addGroupToSheet = (
    ws,
    group,
    groupInvoices,
    allMergedInvoices,
    allTaxRateGroups,
    isSplitMode
  ) => {
    let rowsAdded = 0;

    // Luôn thêm header nhóm (dù có dữ liệu hay không)
    const groupHeaderRow = ws.addRow([
      group.label,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
    rowsAdded++;

    // Merge từ cột 1 đến cột 10
    ws.mergeCells(groupHeaderRow.number, 1, groupHeaderRow.number, 10);
    groupHeaderRow.getCell(1).font = { bold: true };
    groupHeaderRow.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE7E6E6" },
    };
    groupHeaderRow.getCell(1).alignment = {
      horizontal: "left",
      vertical: "middle",
    };
    groupHeaderRow.getCell(1).border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };

    if (groupInvoices.length === 0) {
      // Nếu không có dữ liệu, thêm dòng trống
      const emptyRow = ws.addRow(["", "", "", "", "", "", "", "", "", ""]);
      rowsAdded++;
      emptyRow.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        };
      });
    } else {
      // Group theo ký hiệu, sau đó trong mỗi ký hiệu group theo tên nhà hàng
      const groupedBySeries = groupInvoices.reduce((acc, invoice) => {
        const series = invoice.inv_invoiceSeries || "";
        if (!acc[series]) {
          acc[series] = {};
        }
        const tencuahang = invoice.tencuahang || "";
        if (!acc[series][tencuahang]) {
          acc[series][tencuahang] = [];
        }
        acc[series][tencuahang].push(invoice);
        return acc;
      }, {});

      let rowIndex = 0;
      let groupTotalBeforeTax = 0;
      let groupTotalTax = 0;

      // Sắp xếp các ký hiệu
      const sortedSeries = Object.keys(groupedBySeries).sort((a, b) =>
        a.localeCompare(b, "vi", { numeric: true, sensitivity: "base" })
      );

      // Duyệt qua từng ký hiệu
      sortedSeries.forEach((series) => {
        const shopsInSeries = groupedBySeries[series];

        // Sắp xếp các tên nhà hàng trong ký hiệu
        const sortedShops = Object.keys(shopsInSeries).sort((a, b) =>
          a.localeCompare(b, "vi", { numeric: true, sensitivity: "base" })
        );

        // Duyệt qua từng nhà hàng trong ký hiệu
        sortedShops.forEach((tencuahang) => {
          const shopInvoices = shopsInSeries[tencuahang];

          // Thêm sub-header cho tên nhà hàng (nếu có nhiều hơn 1 nhà hàng trong ký hiệu)
          if (sortedShops.length > 1) {
            const shopHeaderRow = ws.addRow([
              "",
              series,
              tencuahang,
              "",
              "",
              "",
              "",
              "",
              "",
              "",
            ]);
            rowsAdded++;

            // Merge từ cột 2 đến cột 3 cho sub-header nhà hàng
            ws.mergeCells(shopHeaderRow.number, 2, shopHeaderRow.number, 3);
            shopHeaderRow.getCell(2).font = { bold: true, size: 11 };
            shopHeaderRow.getCell(2).fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF2F2F2" },
            };
            shopHeaderRow.getCell(2).alignment = {
              horizontal: "left",
              vertical: "middle",
            };
            shopHeaderRow.eachCell((cell) => {
              cell.border = {
                top: { style: "thin", color: { argb: "FF000000" } },
                left: { style: "thin", color: { argb: "FF000000" } },
                bottom: { style: "thin", color: { argb: "FF000000" } },
                right: { style: "thin", color: { argb: "FF000000" } },
              };
            });
          }

          // Thêm các hóa đơn của nhà hàng
          let shopTotalBeforeTax = 0;
          let shopTotalTax = 0;

          shopInvoices.forEach((invoice) => {
            rowIndex++;
            rowsAdded++;
            shopTotalBeforeTax +=
              Number(invoice.inv_TotalAmountWithoutVat) || 0;
            shopTotalTax += Number(invoice.inv_vatAmount) || 0;

            const dataRow = ws.addRow([
              rowIndex,
              invoice.inv_invoiceSeries || "",
              invoice.tencuahang || "",
              formatDate(invoice.inv_invoiceIssuedDate),
              invoice.inv_invoiceNumber || "",
              invoice.inv_buyerDisplayName || invoice.inv_buyerLegalName || "",
              invoice.inv_buyerTaxCode || "",
              invoice.inv_TotalAmountWithoutVat || 0,
              invoice.inv_vatAmount || 0,
              getInvoiceStatus(invoice),
            ]);

            // Format số cho các cột tiền (cột 8 và 9)
            dataRow.getCell(8).numFmt = "#,##0";
            dataRow.getCell(9).numFmt = "#,##0";

            // Tối ưu: Chỉ style khi không chia sheet hoặc số dòng ít
            if (!isSplitMode || ws.rowCount < 50000) {
              dataRow.eachCell((cell) => {
                cell.border = {
                  top: { style: "thin", color: { argb: "FF000000" } },
                  left: { style: "thin", color: { argb: "FF000000" } },
                  bottom: { style: "thin", color: { argb: "FF000000" } },
                  right: { style: "thin", color: { argb: "FF000000" } },
                };
                cell.alignment = { vertical: "middle" };
              });

              dataRow.getCell(1).alignment = {
                horizontal: "center",
                vertical: "middle",
              };
              dataRow.getCell(8).alignment = {
                horizontal: "right",
                vertical: "middle",
              };
              dataRow.getCell(9).alignment = {
                horizontal: "right",
                vertical: "middle",
              };
            }
          });

          // Thêm tổng cộng cho nhà hàng (chỉ khi có nhiều hơn 1 nhà hàng trong ký hiệu)
          if (sortedShops.length > 1) {
            rowsAdded++;
            const shopTotalRow = ws.addRow([
              "",
              "",
              "",
              "",
              "",
              "",
              `Tổng ${tencuahang}`,
              shopTotalBeforeTax,
              shopTotalTax,
              "",
            ]);

            // Format số cho dòng tổng nhà hàng
            shopTotalRow.getCell(8).numFmt = "#,##0";
            shopTotalRow.getCell(9).numFmt = "#,##0";

            shopTotalRow.font = { bold: true };
            shopTotalRow.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF2F2F2" },
            };
            shopTotalRow.getCell(7).alignment = {
              horizontal: "right",
              vertical: "middle",
            };
            shopTotalRow.getCell(8).alignment = {
              horizontal: "right",
              vertical: "middle",
            };
            shopTotalRow.getCell(9).alignment = {
              horizontal: "right",
              vertical: "middle",
            };

            shopTotalRow.eachCell((cell) => {
              cell.border = {
                top: { style: "thin", color: { argb: "FF000000" } },
                left: { style: "thin", color: { argb: "FF000000" } },
                bottom: { style: "thin", color: { argb: "FF000000" } },
                right: { style: "thin", color: { argb: "FF000000" } },
              };
            });
          }

          // Cộng vào tổng nhóm
          groupTotalBeforeTax += shopTotalBeforeTax;
          groupTotalTax += shopTotalTax;
        });
      });

      // Thêm dòng tổng cộng cho nhóm thuế suất
      rowsAdded++;
      const groupTotalRow = ws.addRow([
        "",
        "",
        "",
        "",
        "",
        "",
        "Tổng cộng",
        groupTotalBeforeTax,
        groupTotalTax,
        "",
      ]);

      // Format số cho dòng tổng
      groupTotalRow.getCell(8).numFmt = "#,##0";
      groupTotalRow.getCell(9).numFmt = "#,##0";

      groupTotalRow.font = { bold: true };
      groupTotalRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE7E6E6" },
      };
      groupTotalRow.getCell(7).alignment = {
        horizontal: "right",
        vertical: "middle",
      };
      groupTotalRow.getCell(8).alignment = {
        horizontal: "right",
        vertical: "middle",
      };
      groupTotalRow.getCell(9).alignment = {
        horizontal: "right",
        vertical: "middle",
      };

      groupTotalRow.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        };
      });
    }

    return rowsAdded;
  };

  const addGrandTotalToSheet = (
    ws,
    allMergedInvoices,
    allTaxRateGroups,
    sheetIndex
  ) => {
    // Tính tổng cộng tổng thể cho tất cả các nhóm
    let grandTotalBeforeTax = 0;
    let grandTotalTax = 0;

    allTaxRateGroups.forEach((group) => {
      const groupInvoices = allMergedInvoices[group.id] || [];
      grandTotalBeforeTax += groupInvoices.reduce(
        (sum, inv) => sum + (Number(inv.inv_TotalAmountWithoutVat) || 0),
        0
      );
      grandTotalTax += groupInvoices.reduce(
        (sum, inv) => sum + (Number(inv.inv_vatAmount) || 0),
        0
      );
    });

    // Thêm dòng tổng cộng tổng thể
    const grandTotalRow = ws.addRow([
      "",
      "",
      "",
      "",
      "",
      "",
      sheetIndex > 1 ? `Tổng cộng (Sheet ${sheetIndex})` : "Tổng cộng",
      grandTotalBeforeTax,
      grandTotalTax,
      "",
    ]);

    // Format số cho dòng tổng cộng
    grandTotalRow.getCell(8).numFmt = "#,##0";
    grandTotalRow.getCell(9).numFmt = "#,##0";

    grandTotalRow.font = { bold: true };
    grandTotalRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE7E6E6" },
    };
    grandTotalRow.getCell(7).alignment = {
      horizontal: "right",
      vertical: "middle",
    };
    grandTotalRow.getCell(8).alignment = {
      horizontal: "right",
      vertical: "middle",
    };
    grandTotalRow.getCell(9).alignment = {
      horizontal: "right",
      vertical: "middle",
    };

    grandTotalRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
    });
  };

  // Helper function để thêm tổng cộng cho các nhóm cụ thể trong sheet
  const addGrandTotalToSheetForGroups = (
    ws,
    allMergedInvoices,
    groupIds,
    sheetIndex
  ) => {
    // Tính tổng cộng chỉ cho các nhóm trong sheet này
    let grandTotalBeforeTax = 0;
    let grandTotalTax = 0;

    groupIds.forEach((groupId) => {
      const groupInvoices = allMergedInvoices[groupId] || [];
      grandTotalBeforeTax += groupInvoices.reduce(
        (sum, inv) => sum + (Number(inv.inv_TotalAmountWithoutVat) || 0),
        0
      );
      grandTotalTax += groupInvoices.reduce(
        (sum, inv) => sum + (Number(inv.inv_vatAmount) || 0),
        0
      );
    });

    // Thêm dòng tổng cộng tổng thể
    const grandTotalRow = ws.addRow([
      "",
      "",
      "",
      "",
      "",
      "",
      sheetIndex > 1 ? `Tổng cộng (Sheet ${sheetIndex})` : "Tổng cộng",
      grandTotalBeforeTax,
      grandTotalTax,
      "",
    ]);

    // Format số cho dòng tổng cộng
    grandTotalRow.getCell(8).numFmt = "#,##0";
    grandTotalRow.getCell(9).numFmt = "#,##0";

    grandTotalRow.font = { bold: true };
    grandTotalRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE7E6E6" },
    };
    grandTotalRow.getCell(7).alignment = {
      horizontal: "right",
      vertical: "middle",
    };
    grandTotalRow.getCell(8).alignment = {
      horizontal: "right",
      vertical: "middle",
    };
    grandTotalRow.getCell(9).alignment = {
      horizontal: "right",
      vertical: "middle",
    };

    grandTotalRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
    });
  };

  // Hàm chia thành nhiều file Excel (mỗi file tối đa maxRowsPerFile dòng)
  const exportMultipleFiles = async (
    mergedInvoices,
    taxRateGroups,
    maxRowsPerFile
  ) => {
    let currentFileIndex = 1;
    let currentRowCount = 0;
    let currentWorkbook = new ExcelJS.Workbook();
    let currentWorksheet = currentWorkbook.addWorksheet("bang-ke-ban-ra");
    const fileGroups = {}; // Lưu các nhóm trong mỗi file để tính tổng

    // Helper function để lưu file hiện tại và tạo file mới
    const saveCurrentFileAndCreateNew = async () => {
      // Lưu file hiện tại trước khi tạo file mới
      if (currentRowCount > 1) {
        // Thêm tổng cộng tổng thể cho file hiện tại
        if (
          fileGroups[currentFileIndex] &&
          fileGroups[currentFileIndex].length > 0
        ) {
          addGrandTotalToSheetForGroups(
            currentWorksheet,
            mergedInvoices,
            fileGroups[currentFileIndex],
            currentFileIndex
          );
          currentRowCount++;
        }

        // Điều chỉnh độ rộng cột
        setColumnWidths(currentWorksheet);

        // Lưu file
        // console.log(`Đang tạo file ${currentFileIndex}...`);
        const buffer = await currentWorkbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/octet-stream" });
        saveAs(blob, `bang-ke-ban-ra-${currentFileIndex}.xlsx`);
        // console.log(
        //   `Đã xuất file: bang-ke-ban-ra-${currentFileIndex}.xlsx (${currentRowCount} dòng)`
        // );
      }

      // Tạo file mới
      currentFileIndex++;
      currentWorkbook = new ExcelJS.Workbook();
      currentWorksheet = currentWorkbook.addWorksheet("bang-ke-ban-ra");
      addHeaderToSheet(currentWorksheet, false); // Không thêm tiêu đề vào file tiếp theo
      fileGroups[currentFileIndex] = [];
      currentRowCount = 1; // Header row
    };

    // Tạo file đầu tiên
    addHeaderToSheet(currentWorksheet, true); // Thêm tiêu đề vào file đầu tiên
    fileGroups[currentFileIndex] = [];
    currentRowCount = 4; // Đã có 3 dòng tiêu đề + 1 dòng header

    // Duyệt qua từng nhóm thuế suất
    for (const group of taxRateGroups) {
      const groupInvoices = mergedInvoices[group.id] || [];
      const hasGroupData = groupInvoices.length > 0;

      // Tính số dòng nhóm sẽ thêm: header nhóm (1) + dữ liệu (groupInvoices.length) + tổng cộng nhóm (1)
      const groupRows = hasGroupData
        ? 1 + groupInvoices.length + 1 // header + data + total
        : 1 + 1; // header + empty row

      // Kiểm tra nếu cần tạo file mới
      // Chỉ tạo file mới khi:
      // 1. File hiện tại đã có ít nhất 1 nhóm có dữ liệu
      // 2. Thêm nhóm này sẽ vượt quá maxRowsPerFile
      // 3. VÀ nhóm này có dữ liệu
      const hasDataInCurrentFile = fileGroups[currentFileIndex].length > 0;
      const willExceedLimit = currentRowCount + groupRows > maxRowsPerFile;

      if (willExceedLimit && hasDataInCurrentFile && hasGroupData) {
        // Lưu file hiện tại và tạo file mới
        await saveCurrentFileAndCreateNew();
      }

      // Thêm nhóm vào file hiện tại
      const rowsAdded = addGroupToSheet(
        currentWorksheet,
        group,
        groupInvoices,
        mergedInvoices,
        taxRateGroups,
        false
      );
      currentRowCount += rowsAdded;

      // Chỉ thêm vào fileGroups nếu nhóm có dữ liệu
      if (hasGroupData) {
        fileGroups[currentFileIndex].push(group.id);
      }
    }

    // Lưu file cuối cùng
    if (currentRowCount > 1) {
      // Thêm tổng cộng tổng thể cho file cuối cùng
      if (
        fileGroups[currentFileIndex] &&
        fileGroups[currentFileIndex].length > 0
      ) {
        addGrandTotalToSheetForGroups(
          currentWorksheet,
          mergedInvoices,
          fileGroups[currentFileIndex],
          currentFileIndex
        );
        currentRowCount++;
      }

      // Điều chỉnh độ rộng cột
      setColumnWidths(currentWorksheet);

      // Lưu file
      // console.log(`Đang tạo file ${currentFileIndex}...`);
      const buffer = await currentWorkbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/octet-stream" });
      saveAs(blob, `bang-ke-ban-ra-${currentFileIndex}.xlsx`);
      // console.log(
      //   `Đã xuất file: bang-ke-ban-ra-${currentFileIndex}.xlsx (${currentRowCount} dòng)`
      // );
    }

    // console.log(`Đã xuất tổng cộng ${currentFileIndex} file Excel`);
  };

  // Hàm xuất bảng kê tổng hợp
  const exportBangKeTongHop = async () => {
    if (reportType !== "bang-ke-ban-ra") {
      alert("Vui lòng chọn bảng kê bán ra và lọc dữ liệu trước khi xuất Excel");
      return;
    }

    // Sử dụng dữ liệu từ invoices state (bảng kê chi tiết)
    const invoicesToUse = Array.isArray(invoices) ? invoices : [];

    // Kiểm tra xem có dữ liệu không
    if (!invoicesToUse || invoicesToUse.length === 0) {
      alert(
        "Chưa có dữ liệu để xuất. Vui lòng đợi thêm vài giây hoặc lọc dữ liệu trước."
      );
      return;
    }

    // Flatten invoices để lấy chi tiết
    const flattenedInvoices = invoicesToUse.flatMap((invoice) => {
      if (invoice && invoice.details && Array.isArray(invoice.details)) {
        return invoice.details.map((detail) => ({
          ...invoice,
          ...detail,
        }));
      }
      return [invoice];
    });

    // Helper function để tính thuế suất từ ma_thue
    const getTaxRateFromMaThue = (maThue) => {
      if (maThue === "8") return "8%";
      if (maThue === "10") return "10%";
      if (maThue === "5") return "5%";
      if (maThue === "0") return "0%";
      if (!maThue || maThue === null || maThue === "") {
        // Tính từ tỷ lệ thuế
        return "Không chịu thuế";
      }
      return `${maThue}%`;
    };

    // Helper function để tính thuế suất từ invoice (nếu không có ma_thue trong detail)
    const calculateTaxRateFromInvoice = (invoice) => {
      if (invoice.inv_TotalAmountWithoutVat > 0) {
        const calculatedRate =
          (invoice.inv_vatAmount / invoice.inv_TotalAmountWithoutVat) * 100;
        if (Math.abs(calculatedRate) < 0.1) return "0%";
        if (Math.abs(calculatedRate - 5) < 0.1) return "5%";
        if (Math.abs(calculatedRate - 8) < 0.1) return "8%";
        if (Math.abs(calculatedRate - 10) < 0.1) return "10%";
        if (calculatedRate > 0) return `${calculatedRate.toFixed(1)}%`;
        return "Không chịu thuế";
      }
      return "Không chịu thuế";
    };

    // Group theo tên nhà hàng và % thuế suất
    const groupedData = flattenedInvoices.reduce((groups, item) => {
      const tencuahang = item.tencuahang || "Không xác định";
      const maThue = item.ma_thue;

      // Tính thuế suất từ ma_thue trong detail
      let taxRate = "Không chịu thuế";
      if (maThue) {
        taxRate = getTaxRateFromMaThue(maThue);
      } else {
        // Nếu không có ma_thue, tính từ tỷ lệ thuế của detail
        if (item.inv_TotalAmountWithoutVat > 0) {
          const calculatedRate =
            (item.inv_vatAmount / item.inv_TotalAmountWithoutVat) * 100;
          if (Math.abs(calculatedRate) < 0.1) taxRate = "0%";
          else if (Math.abs(calculatedRate - 5) < 0.1) taxRate = "5%";
          else if (Math.abs(calculatedRate - 8) < 0.1) taxRate = "8%";
          else if (Math.abs(calculatedRate - 10) < 0.1) taxRate = "10%";
          else if (calculatedRate > 0)
            taxRate = `${calculatedRate.toFixed(1)}%`;
          else taxRate = "Không chịu thuế";
        }
      }

      const key = `${tencuahang}_${taxRate}`;

      if (!groups[key]) {
        groups[key] = {
          tencuahang,
          taxRate,
          kyhieu: item.inv_invoiceSeries || "",
          kyhieuSet: new Set([item.inv_invoiceSeries || ""]),
          totalBeforeTax: 0,
          totalTax: 0,
        };
      } else {
        // Thêm ký hiệu vào set nếu chưa có
        if (item.inv_invoiceSeries) {
          groups[key].kyhieuSet.add(item.inv_invoiceSeries);
        }
      }

      // Sum tiền trước thuế và tiền thuế từ detail
      groups[key].totalBeforeTax += Number(item.inv_TotalAmountWithoutVat) || 0;
      groups[key].totalTax += Number(item.inv_vatAmount) || 0;

      return groups;
    }, {});

    // Chuyển đổi object thành array và sắp xếp
    const summaryData = Object.values(groupedData)
      .map((item) => {
        // Xử lý ký hiệu: nếu có nhiều ký hiệu khác nhau, để trống
        const kyhieuArray = Array.from(item.kyhieuSet).filter((k) => k);
        const kyhieu =
          kyhieuArray.length === 1
            ? kyhieuArray[0]
            : kyhieuArray.length > 1
            ? "" // Để trống nếu có nhiều ký hiệu
            : "";
        return {
          ...item,
          kyhieu,
        };
      })
      .sort((a, b) => {
        // Sắp xếp theo tên nhà hàng, sau đó theo thuế suất
        if (a.tencuahang !== b.tencuahang) {
          return a.tencuahang.localeCompare(b.tencuahang, "vi", {
            numeric: true,
            sensitivity: "base",
          });
        }
        return a.taxRate.localeCompare(b.taxRate, "vi", {
          numeric: true,
          sensitivity: "base",
        });
      });

    // Helper function để format ngày
    const formatDateForExcel = (date) => {
      if (!date) return "";
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // Helper function để lấy tên tháng
    const getMonthName = (date) => {
      if (!date) return "";
      const d = new Date(date);
      const months = [
        "tháng 1",
        "tháng 2",
        "tháng 3",
        "tháng 4",
        "tháng 5",
        "tháng 6",
        "tháng 7",
        "tháng 8",
        "tháng 9",
        "tháng 10",
        "tháng 11",
        "tháng 12",
      ];
      return months[d.getMonth()];
    };

    // Tạo Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("bang-ke-tong-hop");

    // Thêm dòng 1: Mã số thuế - tháng
    const taxCodeDisplay = selectedTaxCode?.code || selectedTaxCode || "N/A";
    const monthName = fromDate ? getMonthName(fromDate) : "";
    const titleRow1 = worksheet.addRow([`${taxCodeDisplay} - ${monthName}`]);
    titleRow1.getCell(1).font = { bold: true, size: 14 };
    titleRow1.getCell(1).alignment = { horizontal: "left" };
    worksheet.mergeCells(1, 1, 1, 5); // Merge 5 cột

    // Thêm dòng 2: Từ ngày đến ngày
    const fromDateStr = formatDateForExcel(fromDate);
    const toDateStr = formatDateForExcel(toDate);
    const titleRow2 = worksheet.addRow([
      `Khoảng thời gian: Từ ngày ${fromDateStr} đến ngày ${toDateStr}`,
    ]);
    titleRow2.getCell(1).font = { bold: true, size: 12 };
    titleRow2.getCell(1).alignment = { horizontal: "left" };
    worksheet.mergeCells(2, 1, 2, 5); // Merge 5 cột

    // Thêm dòng trống
    worksheet.addRow([]);

    // Thêm header
    const headers = [
      "Ký hiệu",
      "Tên cửa hàng",
      "% Thuế suất",
      "Tổng tiền trước thuế",
      "Tổng tiền thuế",
    ];
    worksheet.addRow(headers);

    // Áp dụng style cho tiêu đề
    const headerRow = worksheet.getRow(4); // Header giờ ở dòng 4
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0070C0" },
    };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };

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
    summaryData.forEach((row) => {
      const dataRow = worksheet.addRow([
        row.kyhieu,
        row.tencuahang,
        row.taxRate,
        row.totalBeforeTax,
        row.totalTax,
      ]);

      // Format số cho các cột tiền
      dataRow.getCell(4).numFmt = "#,##0";
      dataRow.getCell(5).numFmt = "#,##0";

      // Thêm viền cho từng ô dữ liệu
      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        };
        cell.alignment = { vertical: "middle" };
      });

      dataRow.getCell(4).alignment = {
        horizontal: "right",
        vertical: "middle",
      };
      dataRow.getCell(5).alignment = {
        horizontal: "right",
        vertical: "middle",
      };
    });

    // Tính tổng cộng
    const grandTotalBeforeTax = summaryData.reduce(
      (sum, row) => sum + row.totalBeforeTax,
      0
    );
    const grandTotalTax = summaryData.reduce(
      (sum, row) => sum + row.totalTax,
      0
    );

    // Thêm dòng tổng cộng
    const totalRow = worksheet.addRow([
      "",
      "Tổng cộng",
      "",
      grandTotalBeforeTax,
      grandTotalTax,
    ]);

    // Format số cho dòng tổng cộng
    totalRow.getCell(4).numFmt = "#,##0";
    totalRow.getCell(5).numFmt = "#,##0";

    totalRow.font = { bold: true };
    totalRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFCCCCCC" },
    };
    totalRow.getCell(2).alignment = { horizontal: "right", vertical: "middle" };
    totalRow.getCell(4).alignment = { horizontal: "right", vertical: "middle" };
    totalRow.getCell(5).alignment = { horizontal: "right", vertical: "middle" };

    // Thêm viền cho dòng tổng cộng
    totalRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
    });

    // Điều chỉnh độ rộng cột
    worksheet.columns = [
      { width: 15 }, // Ký hiệu
      { width: 30 }, // Tên cửa hàng
      { width: 15 }, // % Thuế suất
      { width: 20 }, // Tổng tiền trước thuế
      { width: 18 }, // Tổng tiền thuế
    ];

    // Lưu file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, "bang-ke-tong-hop.xlsx");
  };

  const exportBangKeBanRa = async (customInvoices = null) => {
    if (reportType !== "bang-ke-ban-ra") {
      alert("Vui lòng chọn bảng kê bán ra và lọc dữ liệu trước khi xuất Excel");
      return;
    }

    // Sử dụng dữ liệu từ tham số nếu có, nếu không thì dùng invoices state
    // Đảm bảo invoicesToUse luôn là array
    const invoicesToUse = Array.isArray(customInvoices)
      ? customInvoices
      : Array.isArray(invoices)
      ? invoices
      : [];

    // Kiểm tra xem có dữ liệu không
    if (!invoicesToUse || invoicesToUse.length === 0) {
      alert(
        "Chưa có dữ liệu để xuất. Vui lòng đợi thêm vài giây hoặc lọc dữ liệu trước."
      );
      return;
    }

    // Tính toán lại mergedInvoices với dữ liệu mới nhất
    // Đảm bảo luôn có dữ liệu mới nhất, kể cả khi API đang load
    // Dữ liệu đã được sắp xếp: ký hiệu -> ngày -> số hóa đơn
    const currentMergedInvoices = calculateMergedInvoices(
      invoicesToUse,
      reportType
    );

    // Log để xác nhận thứ tự sắp xếp trong Excel
    // console.log("=== XÁC NHẬN THỨ TỰ SẮP XẾP CHO EXCEL ===");
    // if (currentMergedInvoices && typeof currentMergedInvoices === "object") {
    //   Object.keys(currentMergedInvoices).forEach((taxRate) => {
    //     const groupInvoices = currentMergedInvoices[taxRate] || [];
    //     if (groupInvoices.length > 0) {
    //       console.log(`Nhóm ${taxRate}: ${groupInvoices.length} hóa đơn`);
    //       const first3 = groupInvoices.slice(0, 3).map((inv) => ({
    //         series: inv.inv_invoiceSeries,
    //         date: inv.inv_invoiceIssuedDate,
    //         number: inv.inv_invoiceNumber,
    //       }));
    //       const last3 = groupInvoices.slice(-3).map((inv) => ({
    //         series: inv.inv_invoiceSeries,
    //         date: inv.inv_invoiceIssuedDate,
    //         number: inv.inv_invoiceNumber,
    //       }));
    //       console.log("3 hóa đơn đầu:", first3);
    //       console.log("3 hóa đơn cuối:", last3);
    //     }
    //   });
    // }

    // Tính số hóa đơn đã được group
    const totalInvoices =
      currentMergedInvoices && typeof currentMergedInvoices === "object"
        ? Object.values(currentMergedInvoices).reduce(
            (sum, group) => sum + (Array.isArray(group) ? group.length : 0),
            0
          )
        : 0;

    // Debug log chi tiết
    // console.log("=== exportBangKeBanRa Debug ===");
    // console.log(
    //   "exportBangKeBanRa - invoicesToUse.length:",
    //   invoicesToUse.length
    // );
    // console.log(
    //   "exportBangKeBanRa - invoicesToUse sample (3 đầu):",
    //   invoicesToUse.slice(0, 3).map((inv) => ({
    //     series: inv.inv_invoiceSeries,
    //     number: inv.inv_invoiceNumber,
    //     date: inv.inv_invoiceIssuedDate,
    //   }))
    // );
    // console.log(
    //   "exportBangKeBanRa - customInvoices:",
    //   customInvoices ? "Có" : "Không"
    // );
    // console.log(
    //   "exportBangKeBanRa - currentMergedInvoices type:",
    //   typeof currentMergedInvoices,
    //   Array.isArray(currentMergedInvoices)
    // );
    // if (currentMergedInvoices && typeof currentMergedInvoices === "object") {
    //   console.log(
    //     "exportBangKeBanRa - currentMergedInvoices keys:",
    //     Object.keys(currentMergedInvoices)
    //   );
    //   // Log chi tiết từng nhóm
    //   Object.keys(currentMergedInvoices).forEach((key) => {
    //     const group = currentMergedInvoices[key];
    //     if (Array.isArray(group)) {
    //       console.log(
    //         `  - Nhóm ${key}: ${group.length} hóa đơn`,
    //         group.length > 0
    //           ? {
    //               first: {
    //                 series: group[0].inv_invoiceSeries,
    //                 number: group[0].inv_invoiceNumber,
    //               },
    //             }
    //           : "rỗng"
    //       );
    //     }
    //   });
    // }
    // console.log("exportBangKeBanRa - totalInvoices:", totalInvoices);

    // Kiểm tra và cảnh báo nếu không có dữ liệu
    if (totalInvoices === 0) {
      // console.error("=== LỖI: Không có dữ liệu để xuất Excel ===");
      // console.error("invoicesToUse.length:", invoicesToUse.length);
      // console.error("currentMergedInvoices:", currentMergedInvoices);
      alert(
        `Không có dữ liệu để xuất Excel.\n\n` +
          `Số hóa đơn đã lấy: ${invoicesToUse.length}\n` +
          `Số hóa đơn sau khi xử lý: ${totalInvoices}\n\n` +
          `Vui lòng kiểm tra lại dữ liệu hoặc thử lại sau.`
      );
      return;
    }

    // Thông báo thông tin
    // console.log(`Đang xuất Excel với ${totalInvoices} hóa đơn hiện có...`);

    // Đếm số dòng
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

    const totalRows = countTotalRows(currentMergedInvoices, taxRateGroups);

    // Log thông tin trước khi xuất Excel
    // console.log("=== THÔNG TIN XUẤT EXCEL ===");
    // console.log("Tổng số dòng sẽ xuất:", totalRows);
    // console.log("Số nhóm thuế suất:", taxRateGroups.length);
    // taxRateGroups.forEach((group) => {
    //   const groupInvoices = currentMergedInvoices[group.id] || [];
    //   if (groupInvoices.length > 0) {
    //     const groupTotalBeforeTax = groupInvoices.reduce(
    //       (sum, inv) => sum + (Number(inv.inv_TotalAmountWithoutVat) || 0),
    //       0
    //     );
    //     const groupTotalTax = groupInvoices.reduce(
    //       (sum, inv) => sum + (Number(inv.inv_vatAmount) || 0),
    //       0
    //     );
    //     console.log(
    //       `${group.label}: ${
    //         groupInvoices.length
    //       } hóa đơn | Trước thuế: ${groupTotalBeforeTax.toLocaleString(
    //         "vi-VN"
    //       )} | Thuế: ${groupTotalTax.toLocaleString("vi-VN")}`
    //     );
    //   }
    // });

    // Nếu > 200,000 dòng, chia thành nhiều file Excel
    const MAX_ROWS_PER_FILE = 500000;
    const shouldSplitFiles = totalRows > MAX_ROWS_PER_FILE;

    if (shouldSplitFiles) {
      // console.log(
      //   `Sẽ chia thành nhiều file (giới hạn: ${MAX_ROWS_PER_FILE} dòng/file)`
      // );

      // Chia thành nhiều file Excel
      await exportMultipleFiles(
        currentMergedInvoices,
        taxRateGroups,
        MAX_ROWS_PER_FILE
      );
      return;
    }

    // Nếu <= 200,000 dòng, xuất 1 file với 1 sheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("bang-ke-ban-ra");

    // Thêm header vào sheet (có thêm tiêu đề)
    addHeaderToSheet(worksheet, true);

    // Duyệt qua từng nhóm thuế suất
    taxRateGroups.forEach((group) => {
      const groupInvoices = currentMergedInvoices[group.id] || [];
      addGroupToSheet(
        worksheet,
        group,
        groupInvoices,
        currentMergedInvoices,
        taxRateGroups,
        false
      );
    });

    // Thêm tổng cộng tổng thể
    addGrandTotalToSheet(worksheet, currentMergedInvoices, taxRateGroups, 1);

    // Điều chỉnh độ rộng cột
    setColumnWidths(worksheet);

    // console.log(`Sheet có ${worksheet.rowCount} dòng`);
    // console.log("Đang tạo file Excel...");

    // Lưu file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, "bang-ke-ban-ra.xlsx");
    // console.log("Đã xuất file: bang-ke-ban-ra.xlsx");
  };

  // Hàm xuất CSV (nhẹ hơn nhiều so với Excel)
  const exportBangKeBanRaCSV = (mergedInvoices, taxRateGroups) => {
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

    const formatDate = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    const formatNumber = (value) => {
      if (!value || value === 0) return "0";
      return Number(value)
        .toFixed(0)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    // Tạo CSV content
    let csvContent = "\uFEFF"; // BOM để Excel hiển thị tiếng Việt đúng
    csvContent +=
      "#,Ký hiệu,Ngày hóa đơn,Số hóa đơn,Tên khách hàng,Mã số thuế,Tổng tiền trước thuế,Tổng tiền thuế,Ghi chú\n";

    // Duyệt qua từng nhóm
    taxRateGroups.forEach((group) => {
      const groupInvoices = mergedInvoices[group.id] || [];

      // Header nhóm
      csvContent += `"${group.label}",,,,,,,,\n`;

      if (groupInvoices.length > 0) {
        let rowIndex = 0;
        groupInvoices.forEach((invoice) => {
          rowIndex++;
          csvContent += `${rowIndex},"${
            invoice.inv_invoiceSeries || ""
          }","${formatDate(invoice.inv_invoiceIssuedDate)}","${
            invoice.inv_invoiceNumber || ""
          }","${
            invoice.inv_buyerDisplayName || invoice.inv_buyerLegalName || ""
          }","${invoice.inv_sellerTaxCode || ""}","${formatNumber(
            invoice.inv_TotalAmountWithoutVat
          )}","${formatNumber(invoice.inv_vatAmount)}","${getInvoiceStatus(
            invoice
          )}"\n`;
        });

        // Tổng cộng nhóm
        const groupTotalBeforeTax = groupInvoices.reduce(
          (sum, inv) => sum + (Number(inv.inv_TotalAmountWithoutVat) || 0),
          0
        );
        const groupTotalTax = groupInvoices.reduce(
          (sum, inv) => sum + (Number(inv.inv_vatAmount) || 0),
          0
        );
        csvContent += `,,,,,"Tổng cộng","${formatNumber(
          groupTotalBeforeTax
        )}","${formatNumber(groupTotalTax)}",""\n`;
      }
    });

    // Tổng cộng tổng thể
    let grandTotalBeforeTax = 0;
    let grandTotalTax = 0;
    taxRateGroups.forEach((group) => {
      const groupInvoices = mergedInvoices[group.id] || [];
      grandTotalBeforeTax += groupInvoices.reduce(
        (sum, inv) => sum + (Number(inv.inv_TotalAmountWithoutVat) || 0),
        0
      );
      grandTotalTax += groupInvoices.reduce(
        (sum, inv) => sum + (Number(inv.inv_vatAmount) || 0),
        0
      );
    });
    csvContent += `,,,,,"Tổng cộng","${formatNumber(
      grandTotalBeforeTax
    )}","${formatNumber(grandTotalTax)}",""\n`;

    // Tạo và download file
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    saveAs(blob, "bang-ke-ban-ra.csv");
  };

  return (
    <div className="container">
      {/* item button menu với logo */}
      <div
        style={{
          backgroundColor: "#F8F9FA",
          borderWidth: "0.1px",
          borderColor: "#DEE2E6",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 8px",
        }}
        className="border-solid mr-3 ml-3 mt-3 border-round-sm"
      >
        {/* Các nút chức năng */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <Button
            label="Lọc dữ liệu"
            className="min-h-full border-solid border-1 border-round-sm text-sm "
            onClick={() => setVisible(true)}
          ></Button>

          {/* <Button
          onClick={exportToExcel}
          label="Xuất excel"
          className="w-1 min-h-full border-solid border-1 border-round-sm ml-2 text-sm "
        ></Button> */}

          <Button
            onClick={exportBangKeBanRa}
            label="Xuất bảng kê chi tiết"
            className="min-h-full border-solid border-1 border-round-sm ml-2 text-sm "
          ></Button>

          <Button
            onClick={exportBangKeTongHop}
            label="Xuất bảng kê tổng hợp"
            className="min-h-full border-solid border-1 border-round-sm ml-2 text-sm "
          ></Button>
        </div>

        {/* Logo bên góc phải */}
        <img
          src="/logo-minvoice.png"
          alt="M-invoice Logo"
          style={{
            height: "50px",

            objectFit: "contain",
          }}
        />
      </div>

      {/* Ghi chú nguồn dữ liệu - highlight màu mè */}
      <div
        style={{
          backgroundColor: "#E3F2FD",
          borderLeft: "4px solid #2196F3",
          padding: "12px 20px",
          margin: "10px 12px",
          borderRadius: "4px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            color: "#1565C0",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "18px",
              marginRight: "10px",
            }}
          >
            ℹ️
          </span>
          <span>
            Số liệu từ web tool được lấy từ dữ liệu bằng hình thức kết nối API
            với hóa đơn điện tử M-invoice
          </span>
        </div>
      </div>

      {/* table  */}
      <ReactDataTable
        invoices={reportType === "bang-ke-ban-ra" ? invoices : mergedInvoices}
        groupedInvoicesByTaxRate={
          reportType === "bang-ke-ban-ra" ? mergedInvoices : null
        }
        getTuyenBySeries={getTuyenBySeries}
        reportType={reportType}
      />
      <Modal
        visible={visible}
        setVisible={setVisible}
        setInvoices={handleInvoices}
        reportType={reportType}
        setReportType={setReportType}
        exportBangKeBanRa={exportBangKeBanRa}
        currentInvoices={invoices}
      ></Modal>
    </div>
  );
}

export default App;
