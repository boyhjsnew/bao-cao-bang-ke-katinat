import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { ProgressBar } from "primereact/progressbar";
import { addLocale, locale } from "primereact/api";
import "../Api/GetInvoices";
import getInvoices, {
  getInvoiceSeries,
  getInvoicesBySeriesList,
} from "../Api/GetInvoices";

export default function Modal(props) {
  const [visible, setVisible] = useState(false);
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

  const taxCodes = [
    { name: "3500676761", code: "3500676761" },
    { name: "3500676761-001", code: "3500676761-001" },
  ];

  const trangthaiCQT = [{ statusTax: "Gốc", code: "1" }];

  // Effect để load danh sách ký hiệu khi chọn mã số thuế
  useEffect(() => {
    if (selectedTaxCode) {
      loadInvoiceSeries(selectedTaxCode.code);
    }
  }, [selectedTaxCode]);

  const loadInvoiceSeries = async (taxCode) => {
    setLoadingSeries(true);
    try {
      const series = await getInvoiceSeries(taxCode);
      setSeriesOptions(series);
    } catch (error) {
      console.error("Error loading series:", error);
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
    <div>
      <Button
        label="Huỷ bỏ"
        icon="pi pi-times"
        onClick={() => props.setVisible(false)}
        className="p-button-text"
      />
      <Button
        label="Nhận"
        icon="pi pi-check"
        onClick={() => getAllInvoice()}
        autoFocus
        loading={loadingData}
      />
    </div>
  );

  const show = (position) => {
    setPosition(position);
    setVisible(true);
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
          (currentIndex, total) => {
            const percentage = Math.round((currentIndex / total) * 100);
            setProgress(percentage);
            setProgressMessage(
              `Đang xử lý ký hiệu ${currentIndex}/${total}...`
            );
          }
        );

        setProgress(100);
        setProgressMessage("Hoàn thành!");
      }

      console.log("Tổng số hóa đơn nhận được:", allInvoices.length);
      props.setInvoices(Array.isArray(allInvoices) ? allInvoices : []);
      props.setVisible(false);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setProgressMessage("Có lỗi xảy ra khi lấy dữ liệu!");
      alert("Có lỗi xảy ra khi lấy dữ liệu. Vui lòng thử lại!");
    } finally {
      setLoadingData(false);
      // Reset progress sau 2 giây
      setTimeout(() => {
        setProgress(0);
        setProgressMessage("");
      }, 2000);
    }
  };

  return (
    <div className="card">
      <Dialog
        header="Báo cáo chi tiết hoá đơn"
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
      >
        {/* Mã số thuế - Đặt trên cùng */}
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
              <input
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
              <label htmlFor="custom">Nhập tùy chỉnh</label>
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
