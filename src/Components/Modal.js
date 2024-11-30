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

  const series = [
    { name: "2C24MMK", code: "2C24MMK" },
    { name: "2C24MYY", code: "2C24MYY" },
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
    if (!fromDate || !toDate || !selectedSeri) {
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
    const khieu = selectedSeri.code;

    try {
      const invoices = await getInvoices(tuNgay, denngay, khieu);
      console.log("Get all data:", invoices);
      props.setInvoices(invoices);
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
        style={{ width: "35vw" }}
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
              style={{ width: "396px" }}
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
            style={{ width: "396px" }}
            value={toDate}
            onChange={(e) => setToDate(e.value)}
            dateFormat="dd/mm/yy"
          />
        </div>
        <div
          className="flex flex-row justify-content-between w-full pt-10"
          style={{ marginTop: "15px" }}
        >
          <label htmlFor="username">Ký hiệu</label>

          <Dropdown
            style={{ width: "396px" }}
            value={selectedSeri}
            onChange={(e) => setSelectedSeri(e.value)}
            options={series}
            optionLabel="name"
          />
        </div>
        <div
          className="flex flex-row justify-content-between w-full pt-10"
          style={{ marginTop: "15px" }}
        >
          <label htmlFor="username">Trạng thái hoá đơn</label>

          <Dropdown
            style={{ width: "396px" }}
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
