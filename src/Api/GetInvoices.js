import axios from "axios";

const getInvoices = async (tuNgay, denngay, khieu) => {
  const url = "https://0314047055.minvoice.app/api/InvoiceApi78/GetInvoices";

  const headers = {
    Authorization: "Bear O87316arj5+Od3Fqyy5hzdBfIuPk73eKqpAzBSvv8sY=",
    "Content-Type": "application/json",
  };

  let allData = [];
  let start = 0;
  const limit = 300;

  try {
    while (true) {
      const body = {
        tuNgay,
        denngay,
        khieu,
        start,
        coChiTiet: true,
      };

      // Gọi API
      const response = await axios.post(url, body, { headers });
      console.log("Response data:", response.data);

      if (
        !response.data ||
        !response.data.data ||
        response.data.data.length === 0
      ) {
        break;
      }

      // Thêm dữ liệu vào mảng allData
      allData = [...allData, ...response.data.data];

      // Sắp xếp mảng allData theo thứ tự tăng dần của inv_invoiceNumber
      allData.sort((a, b) => a.inv_invoiceNumber - b.inv_invoiceNumber);

      // Nếu số lượng bản ghi trả về nhỏ hơn giới hạn, coi như đã lấy đủ dữ liệu
      if (response.data.data.length < limit) {
        break;
      }

      start += limit;
    }

    return allData; // Trả về toàn bộ dữ liệu sau khi gọi API đủ số lần
  } catch (error) {
    console.error("Error calling API:", error.message);
    if (error.response) {
      console.error("Response error:", error.response.data);
    }
  }
};

export default getInvoices;
