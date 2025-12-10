import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { ProgressBar } from "primereact/progressbar";
// import { RadioButton } from "primereact/radiobutton"; // Tạm thời không dùng
import { addLocale, locale } from "primereact/api";
import "../Api/GetInvoices";
import getInvoices, {
  getInvoiceSeries,
  getInvoicesBySeriesList,
} from "../Api/GetInvoices";

export default function Modal(props) {
  const [position, setPosition] = useState("center");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [selectedSeries, setSelectedSeries] = useState([]); // Thay đổi thành array cho MultiSelect
  const [statusTax, setstatusTax] = useState(null);
  const [selectedTaxCode, setSelectedTaxCode] = useState(null);
  const [customSeries, setCustomSeries] = useState("");
  const [useCustomSeries, setUseCustomSeries] = useState(false);
  const [seriesOptions, setSeriesOptions] = useState([]); // State để lưu danh sách ký hiệu từ API
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [loadingData, setLoadingData] = useState(false); // State để hiển thị loading khi lấy dữ liệu
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [currentInvoices, setCurrentInvoices] = useState([]); // State để lưu dữ liệu đang load
  // Tạm thời không dùng, luôn dùng "bang-ke-ban-ra"
  // const [selectedReportType, setSelectedReportType] = useState(
  //   props.reportType || "bang-ke-ban-ra"
  // );

  const taxCodes = [
    { name: "0316612746", code: "0316612746" },
    { name: "0316612746-004", code: "0316612746-004" },
    { name: "0316612746-005", code: "0316612746-005" },
    { name: "0316612746-008", code: "0316612746-008" },
    { name: "0316612746-009", code: "0316612746-009" },
    { name: "0316612746-013", code: "0316612746-013" },
    { name: "0316612746-014", code: "0316612746-014" },
    { name: "0316612746-001", code: "0316612746-001" },
    { name: "0316612746-015", code: "0316612746-015" },

    { name: "0316612746-016", code: "0316612746-016" },
    { name: "0316612746-003", code: "0316612746-003" },
    { name: "0316612746-011", code: "0316612746-011" },
    { name: "0316612746-012", code: "0316612746-012" },
    { name: "0316612746-010", code: "0316612746-010" },
    { name: "0316612746-006", code: "0316612746-006" },
    { name: "0316612746-002", code: "0316612746-002" },
    { name: "0316612746-007", code: "0316612746-007" },
  ];

  // Tạm thời không dùng, đã ẩn phần chọn loại báo cáo
  // const reportTypes = [
  //   { name: "Theo biển số xe", value: "theo-bien-so-xe" },
  //   { name: "Báo cáo tổng hợp tem, vé", value: "tong-hop-tem-ve" },
  //   { name: "Bảng kê bán ra", value: "bang-ke-ban-ra" },
  // ];

  const trangthaiCQT = [{ statusTax: "Gốc", code: "1" }];

  // Effect để load danh sách ký hiệu khi chọn mã số thuế
  useEffect(() => {
    if (selectedTaxCode) {
      // Reset danh sách ký hiệu đã chọn và ký hiệu tùy chỉnh
      setSelectedSeries([]);
      setCustomSeries("");
      setUseCustomSeries(false);

      // Load danh sách ký hiệu mới cho mã số thuế đã chọn
      loadInvoiceSeries(selectedTaxCode.code);
    } else {
      // Nếu không có mã số thuế, reset tất cả
      setSelectedSeries([]);
      setCustomSeries("");
      setUseCustomSeries(false);
      setSeriesOptions([]);
    }
  }, [selectedTaxCode]);

  const loadInvoiceSeries = async (taxCode) => {
    setLoadingSeries(true);
    try {
      const series = await getInvoiceSeries(taxCode);
      setSeriesOptions(series);
    } catch (error) {
      // console.error("Error loading series:", error);
      setSeriesOptions([]);
    } finally {
      setLoadingSeries(false);
    }
  };

  addLocale("vi", {
    firstDayOfWeek: 1,
    dayNames: [
      "Chủ nhật",
      "Thứ hai",
      "Thứ ba",
      "Thứ tư",
      "Thứ năm",
      "Thứ sáu",
      "Thứ bảy",
    ],
    dayNamesShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
    dayNamesMin: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
    monthNames: [
      "Tháng một",
      "Tháng hai",
      "Tháng ba",
      "Tháng tư",
      "Tháng năm",
      "Tháng sáu",
      "Tháng bảy",
      "Tháng tám",
      "Tháng chín",
      "Tháng mười",
      "Tháng mười một",
      "Tháng mười hai",
    ],
    monthNamesShort: [
      "Th1",
      "Th2",
      "Th3",
      "Th4",
      "Th5",
      "Th6",
      "Th7",
      "Th8",
      "Th9",
      "Th10",
      "Th11",
      "Th12",
    ],
    today: "Hôm nay",
    clear: "Xóa",
  });
  locale("vi");

  const footerContent = (
    <div className="flex gap-2">
      <Button
        label="Huỷ bỏ"
        icon="pi pi-times"
        onClick={() => {
          props.setVisible(false);
          setLoadingData(false);
        }}
        className="p-button-text"
        disabled={loadingData}
      />
      {loadingData && props.exportBangKeBanRa && (
        <Button
          label={`Kết xuất trước${
            currentInvoices.length > 0 ||
            (props.currentInvoices && props.currentInvoices.length > 0)
              ? ` (${
                  currentInvoices.length > 0
                    ? currentInvoices.length
                    : props.currentInvoices?.length || 0
                } hóa đơn)`
              : ""
          }`}
          icon="pi pi-download"
          onClick={() => {
            if (props.exportBangKeBanRa) {
              // Ưu tiên dùng currentInvoices, nếu không có thì dùng invoices từ App.js
              const dataToExport =
                currentInvoices.length > 0
                  ? currentInvoices
                  : props.currentInvoices || [];

              if (dataToExport.length > 0) {
                // Truyền dữ liệu hiện có vào hàm xuất Excel
                props.exportBangKeBanRa(dataToExport);
              } else {
                alert("Chưa có dữ liệu để xuất. Vui lòng đợi thêm vài giây...");
              }
            }
          }}
          className="p-button-success"
        />
      )}
      <Button
        label="Nhận"
        icon="pi pi-check"
        onClick={() => getAllInvoice()}
        autoFocus
        loading={loadingData}
        disabled={loadingData}
      />
    </div>
  );

  const show = (position) => {
    setPosition(position);
  };

  const getAllInvoice = async () => {
    if (
      !fromDate ||
      !toDate ||
      (selectedSeries.length === 0 && !customSeries) ||
      !selectedTaxCode
    ) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setLoadingData(true);
    setProgress(0);
    setProgressMessage("Đang chuẩn bị lấy dữ liệu...");
    setCurrentInvoices([]); // Reset dữ liệu khi bắt đầu load mới

    // Định dạng ngày theo chuẩn API (yyyy-mm-dd)
    const formatDate = (date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const tuNgay = formatDate(fromDate);
    const denngay = formatDate(toDate);
    const taxCode = selectedTaxCode.code;

    // Giữ modal mở để hiển thị progress và cho phép xuất Excel trước

    // Load dữ liệu ở background (không block UI)
    (async () => {
      try {
        let allInvoices = [];

        // Nếu sử dụng ký hiệu tùy chỉnh
        if (useCustomSeries && customSeries) {
          setProgressMessage(`Đang lấy dữ liệu cho ký hiệu: ${customSeries}`);
          setProgress(50);

          const invoices = await getInvoices(
            taxCode,
            tuNgay,
            denngay,
            customSeries
          );
          allInvoices = invoices;
          // Cập nhật dữ liệu vào state của Modal
          setCurrentInvoices(Array.isArray(allInvoices) ? allInvoices : []);

          setProgress(100);
          setProgressMessage("Hoàn thành!");
        } else {
          // Nếu sử dụng danh sách ký hiệu từ API
          const totalSeries = selectedSeries.length;
          setProgressMessage(`Đang lấy dữ liệu cho ${totalSeries} ký hiệu...`);

          allInvoices = await getInvoicesBySeriesList(
            taxCode,
            tuNgay,
            denngay,
            selectedSeries,
            (
              totalInvoicesFetched,
              grandTotalInvoices,
              currentSeriesIndex,
              totalSeries,
              currentSeriesCode,
              invoicesForCurrentSeries,
              seriesTotal
            ) => {
              // Tính phần trăm dựa trên số hóa đơn đã lấy / tổng số hóa đơn từ API
              let percentage = 0;

              // Nếu đã hoàn thành (không có ký hiệu đang xử lý hoặc đã lấy đủ)
              if (
                !currentSeriesCode ||
                totalInvoicesFetched >= grandTotalInvoices
              ) {
                percentage = 100;
              } else if (grandTotalInvoices > 0) {
                percentage = Math.round(
                  (totalInvoicesFetched / grandTotalInvoices) * 100
                );
                // Giới hạn tối đa 99% cho đến khi hoàn thành
                if (percentage > 99) {
                  percentage = 99;
                }
              } else {
                // Nếu chưa có total, tính dựa trên số ký hiệu đã xử lý
                percentage = Math.round(
                  (currentSeriesIndex / totalSeries) * 50
                ); // Tạm thời 50% max
              }
              setProgress(percentage);

              // Hiển thị thông tin chi tiết
              if (
                !currentSeriesCode ||
                totalInvoicesFetched >= grandTotalInvoices
              ) {
                // Đã hoàn thành
                setProgressMessage(
                  `Hoàn thành! Đã lấy ${totalInvoicesFetched.toLocaleString(
                    "vi-VN"
                  )}/${grandTotalInvoices.toLocaleString(
                    "vi-VN"
                  )} hóa đơn (100%)`
                );
              } else if (grandTotalInvoices > 0) {
                const seriesInfo =
                  seriesTotal > 0
                    ? `${invoicesForCurrentSeries.toLocaleString(
                        "vi-VN"
                      )}/${seriesTotal.toLocaleString("vi-VN")}`
                    : `${invoicesForCurrentSeries.toLocaleString("vi-VN")}`;
                setProgressMessage(
                  `Đã lấy ${totalInvoicesFetched.toLocaleString(
                    "vi-VN"
                  )}/${grandTotalInvoices.toLocaleString(
                    "vi-VN"
                  )} hóa đơn (${percentage}%) - Ký hiệu ${currentSeriesCode}: ${seriesInfo} (${currentSeriesIndex}/${totalSeries})`
                );
              } else {
                setProgressMessage(
                  `Đã lấy ${totalInvoicesFetched.toLocaleString(
                    "vi-VN"
                  )} hóa đơn - Ký hiệu ${currentSeriesCode}: ${invoicesForCurrentSeries.toLocaleString(
                    "vi-VN"
                  )} hóa đơn (${currentSeriesIndex}/${totalSeries})`
                );
              }
            },
            // Callback để cập nhật dữ liệu từng phần
            (partialData, taxCode) => {
              const dataArray = Array.isArray(partialData) ? partialData : [];
              // Lưu dữ liệu vào state của Modal để có thể xuất Excel
              setCurrentInvoices(dataArray);
              // Cập nhật vào App.js
              props.setInvoices(
                dataArray,
                taxCode,
                "bang-ke-ban-ra",
                fromDate,
                toDate
              );
            },
            // Callback khi gặp lỗi nghiêm trọng - tự động xuất Excel
            (error, savedData, taxCode) => {
              // console.error("⚠️ Lỗi nghiêm trọng trong quá trình tải:", error);
              if (savedData && savedData.length > 0) {
                setProgressMessage(
                  `⚠️ Lỗi nghiêm trọng! Đang tự động xuất Excel với ${savedData.length} hóa đơn đã tải được...`
                );
                // Tự động xuất Excel với dữ liệu đã có
                setTimeout(async () => {
                  try {
                    if (props.exportBangKeBanRa) {
                      await props.exportBangKeBanRa(savedData);
                      setProgressMessage(
                        `✅ Đã tự động xuất Excel với ${savedData.length} hóa đơn. File đã được tải về.`
                      );
                      alert(
                        `⚠️ Đã gặp lỗi nghiêm trọng trong quá trình tải dữ liệu!\n\n` +
                          `✅ Đã tự động xuất Excel với ${savedData.length} hóa đơn đã tải được.\n\n` +
                          `File Excel đã được tải về máy của bạn.\n\n` +
                          `Lỗi: ${error.message || "Unknown error"}`
                      );
                    }
                  } catch (exportError) {
                    // console.error("Lỗi khi tự động xuất Excel:", exportError);
                    setProgressMessage(
                      `⚠️ Lỗi nghiêm trọng! Có ${savedData.length} hóa đơn đã tải được. Vui lòng nhấn "Kết xuất trước" để xuất Excel.`
                    );
                  }
                }, 500);
              }
            }
          );

          setProgress(100);
          setProgressMessage("Hoàn thành!");
        }

        // console.log("Tổng số hóa đơn nhận được:", allInvoices.length);
        // Cập nhật dữ liệu vào state của Modal
        const finalData = Array.isArray(allInvoices) ? allInvoices : [];

        // Kiểm tra xem có dữ liệu không
        if (finalData.length > 0) {
          setCurrentInvoices(finalData);
          // Luôn dùng "bang-ke-ban-ra" cho báo cáo
          props.setInvoices(
            finalData,
            taxCode,
            "bang-ke-ban-ra",
            fromDate,
            toDate
          );
          setProgressMessage(`Hoàn thành! Đã tải ${finalData.length} hóa đơn.`);

          // Đóng modal sau khi load xong
          setTimeout(() => {
            props.setVisible(false);
          }, 2000); // Đợi 2 giây để người dùng thấy thông báo
        } else {
          setProgressMessage("Không có dữ liệu để hiển thị!");
          alert("Không có dữ liệu để hiển thị. Vui lòng kiểm tra lại!");
        }
      } catch (error) {
        // console.error("Error fetching invoices:", error);

        // Kiểm tra xem có dữ liệu đã tải được không
        const currentData = currentInvoices || [];
        if (currentData.length > 0) {
          // Nếu có dữ liệu đã tải, tự động xuất Excel để bảo toàn dữ liệu
          setProgressMessage(
            `⚠️ Đã gặp lỗi! Đang tự động xuất Excel với ${currentData.length} hóa đơn đã tải được...`
          );
          // console.warn(
          //   `⚠️ Đã gặp lỗi nhưng vẫn giữ lại ${currentData.length} hóa đơn đã tải được. Tự động xuất Excel...`
          // );

          // Tự động xuất Excel với dữ liệu đã có
          try {
            if (props.exportBangKeBanRa) {
              // Đợi một chút để đảm bảo state đã được cập nhật
              setTimeout(async () => {
                await props.exportBangKeBanRa(currentData);
                setProgressMessage(
                  `✅ Đã tự động xuất Excel với ${currentData.length} hóa đơn. File đã được tải về.`
                );
                alert(
                  `⚠️ Đã gặp lỗi trong quá trình tải dữ liệu!\n\n` +
                    `✅ Đã tự động xuất Excel với ${currentData.length} hóa đơn đã tải được.\n\n` +
                    `File Excel đã được tải về máy của bạn.\n\n` +
                    `Lỗi: ${error.message || "Unknown error"}`
                );
              }, 500);
            }
          } catch (exportError) {
            console.error("Lỗi khi tự động xuất Excel:", exportError);
            setProgressMessage(
              `⚠️ Đã gặp lỗi! Có ${currentData.length} hóa đơn đã tải được. Vui lòng nhấn "Kết xuất trước" để xuất Excel.`
            );
            alert(
              `⚠️ Đã gặp lỗi trong quá trình tải dữ liệu!\n\n` +
                `Có ${currentData.length} hóa đơn đã tải được.\n\n` +
                `Vui lòng nhấn nút "Kết xuất trước" để xuất Excel ngay.\n\n` +
                `Lỗi: ${error.message || "Unknown error"}`
            );
          }
          // Không đóng modal, để người dùng có thể thấy thông báo
        } else {
          // Nếu không có dữ liệu, thông báo lỗi
          setProgressMessage("Có lỗi xảy ra khi lấy dữ liệu!");
          alert(
            "Có lỗi xảy ra khi lấy dữ liệu. Vui lòng thử lại!\n\n" +
              "Lỗi: " +
              (error.message || "Unknown error")
          );
        }
      } finally {
        setLoadingData(false);
        // Reset progress sau 5 giây (tăng thời gian để người dùng đọc thông báo)
        setTimeout(() => {
          setProgress(0);
          setProgressMessage("");
        }, 5000);
      }
    })();
  };

  return (
    <div className="card">
      <Dialog
        header="Bảng kê hoá đơn"
        visible={props.visible}
        position={position}
        onShow={() => show("top")}
        style={{ width: "40vw" }}
        onHide={() => {
          if (!props.visible) return;
          props.setVisible(false);
        }}
        footer={footerContent}
        draggable={false}
        resizable={false}
        modal={true}
        dismissableMask={false}
      >
        {/* Chọn loại báo cáo - Tạm thời ẩn, chỉ dùng Bảng kê bán ra */}
        {/* <div className="card flex-row pb-3">
          <div className="flex flex-column w-full mt-10">
            <label htmlFor="reportType" className="mb-3">
              Chọn loại báo cáo:
            </label>
            <div className="flex flex-row gap-4">
              {reportTypes.map((type) => (
                <div key={type.value} className="flex align-items-center">
                  <RadioButton
                    inputId={type.value}
                    name="reportType"
                    value={type.value}
                    onChange={(e) => {
                      setSelectedReportType(e.value);
                      if (props.setReportType) {
                        props.setReportType(e.value);
                      }
                    }}
                    checked={selectedReportType === type.value}
                  />
                  <label htmlFor={type.value} className="ml-2">
                    {type.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div> */}

        {/* Mã số thuế */}
        <div className="card flex-row pb-3">
          <div className="flex flex-row justify-content-between w-full mt-10">
            <label htmlFor="taxcode">Mã số thuế</label>
            <Dropdown
              style={{ width: "326px" }}
              value={selectedTaxCode}
              onChange={(e) => setSelectedTaxCode(e.value)}
              options={taxCodes}
              optionLabel="name"
              placeholder="Chọn mã số thuế"
            />
          </div>
        </div>

        {/* Từ ngày */}
        <div className="card flex-row ">
          <div className="flex flex-row justify-content-between w-full mt-10">
            <label htmlFor="username">Từ ngày</label>
            <Calendar
              style={{ width: "326px" }}
              value={fromDate}
              onChange={(e) => setFromDate(e.value)}
              dateFormat="dd/mm/yy"
            />
          </div>
        </div>

        {/* Đến ngày */}
        <div
          className="flex flex-row justify-content-between w-full pt-10"
          style={{ marginTop: "15px" }}
        >
          <label htmlFor="username">Đến ngày</label>
          <Calendar
            style={{ width: "326px" }}
            value={toDate}
            onChange={(e) => setToDate(e.value)}
            dateFormat="dd/mm/yy"
          />
        </div>

        {/* Ký hiệu */}
        <div
          className="flex flex-row justify-content-between w-full pt-10"
          style={{ marginTop: "15px" }}
        >
          <label htmlFor="username">Ký hiệu</label>
          <div style={{ width: "326px" }}>
            <div className="flex flex-row align-items-center mb-2">
              {/* <input
                type="radio"
                id="dropdown"
                name="seriesType"
                checked={!useCustomSeries}
                onChange={() => setUseCustomSeries(false)}
                style={{ marginRight: "8px" }}
              />
              <label htmlFor="dropdown" style={{ marginRight: "15px" }}>
                Chọn từ danh sách
              </label>
              <input
                type="radio"
                id="custom"
                name="seriesType"
                checked={useCustomSeries}
                onChange={() => setUseCustomSeries(true)}
                style={{ marginRight: "8px" }}
              />
              <label htmlFor="custom">Nhập tùy chỉnh</label> */}
            </div>

            {!useCustomSeries ? (
              <div>
                <MultiSelect
                  style={{ width: "100%" }}
                  value={selectedSeries}
                  onChange={(e) => setSelectedSeries(e.value)}
                  options={seriesOptions}
                  optionLabel="name"
                  placeholder="Chọn ký hiệu"
                  loading={loadingSeries}
                  showSelectAll={true}
                  selectAllLabel="Chọn tất cả"
                  filter
                  filterPlaceholder="Tìm kiếm ký hiệu..."
                />
              </div>
            ) : (
              <InputText
                style={{ width: "100%" }}
                value={customSeries}
                onChange={(e) => setCustomSeries(e.target.value)}
                placeholder="Nhập ký hiệu"
              />
            )}
          </div>
        </div>

        {/* Trạng thái hoá đơn */}
        <div
          className="flex flex-row justify-content-between w-full pt-10"
          style={{ marginTop: "15px" }}
        >
          <label htmlFor="username">Trạng thái hoá đơn</label>
          <Dropdown
            style={{ width: "326px" }}
            options={trangthaiCQT}
            optionLabel="statusTax"
            onChange={(e) => setstatusTax(e.value)}
            value={statusTax}
          />
        </div>

        {/* Progress Bar khi đang tải dữ liệu */}
        {loadingData && (
          <div
            className="flex flex-column w-full pt-10"
            style={{ marginTop: "15px" }}
          >
            <div className="mb-2">
              <small className="text-muted">{progressMessage}</small>
            </div>
            <ProgressBar
              value={progress}
              style={{ height: "20px" }}
              showValue={true}
            />
          </div>
        )}
      </Dialog>
    </div>
  );
}
