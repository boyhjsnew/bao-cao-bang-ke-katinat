import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { addLocale, locale } from "primereact/api";
import "../Api/GetInvoices";
import getInvoices from "../Api/GetInvoices";

export default function Modal(props) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState("center");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [selectedSeri, setSelectedSeri] = useState(null);
  const [statusTax, setstatusTax] = useState(null);
  const [taxCode, setTaxCode] = useState(""); // Thêm state cho mã số thuế
  const [customSeries, setCustomSeries] = useState(""); // Thêm state cho ký hiệu tùy chỉnh
  const [useCustomSeries, setUseCustomSeries] = useState(false); // Flag để chọn giữa dropdown và input

  const series = [
    { name: "1C25MSS", code: "1C25MSS" },
    { name: "1C25MTT", code: "1C25MTT" },
  ];

  const trangthaiCQT = [{ statusTax: "Gốc", code: "1" }];
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
      />
    </div>
  );

  const show = (position) => {
    setPosition(position);
    setVisible(true);
  };
  const getAllInvoice = async () => {
    if (!fromDate || !toDate || (!selectedSeri && !customSeries) || !taxCode) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }

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
    const khieu = useCustomSeries ? customSeries : selectedSeri.code;

    try {
      const invoices = await getInvoices(taxCode, tuNgay, denngay, khieu);
      console.log("Get all data:", invoices);
      props.setInvoices(Array.isArray(invoices) ? invoices : []);
      props.setVisible(false);
    } catch (error) {
      console.error("Error fetching invoices:", error);
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
        <div
          className="flex flex-row justify-content-between w-full pt-10"
          style={{ marginTop: "15px" }}
        >
          <label htmlFor="username">Mã số thuế</label>
          <InputText
            style={{ width: "326px" }}
            value={taxCode}
            onChange={(e) => setTaxCode(e.target.value)}
            placeholder="Nhập mã số thuế"
          />
        </div>
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
              <Dropdown
                style={{ width: "100%" }}
                value={selectedSeri}
                onChange={(e) => setSelectedSeri(e.value)}
                options={series}
                optionLabel="name"
                placeholder="Chọn ký hiệu"
              />
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
      </Dialog>
    </div>
  );
}
