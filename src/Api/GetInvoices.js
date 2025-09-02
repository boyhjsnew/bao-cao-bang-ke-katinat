import axios from "axios";

const getInvoices = async (taxCode, tuNgay, denngay, khieu) => {
  const url = `https://${taxCode}.minvoice.app/api/InvoiceApi78/GetInvoices`;

  const headers = {
    Authorization: "Bearer O87316arj5+Od3Fqyy5hzdBfIuPk73eKqpAzBSvv8sY=",
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

      const response = await axios.post(url, body, { headers });
      const resData = response?.data?.data || [];

      if (!Array.isArray(resData) || resData.length === 0) break;

      allData.push(...resData);

      if (resData.length < limit) break;
      start += limit;
    }

    allData.sort((a, b) => a.inv_invoiceNumber - b.inv_invoiceNumber);
    return allData;
  } catch (error) {
    console.error("Error calling API:", error.message);
    if (error.response) console.error("Response error:", error.response.data);
    return [];
  }
};

// API mới để lấy danh sách ký hiệu
const getInvoiceSeries = async (taxCode) => {
  const url = `https://${taxCode}.minvoice.app/api/Invoice68/GetTypeInvoiceSeries`;

  const headers = {
    Authorization: "Bearer O87316arj5+Od3Fqyy5hzdBfIuPk73eKqpAzBSvv8sY=",
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.get(url, { headers });
    const data = response?.data?.data || [];

    // Chuyển đổi dữ liệu để phù hợp với MultiSelect
    // Chỉ lấy những ký hiệu bắt đầu từ "5C25"
    return data
      .filter((item) => item.value && item.value.startsWith("5C25"))
      .map((item) => ({
        name: item.value,
        code: item.value,
        id: item.id,
        invoiceTypeName: item.invoiceTypeName,
      }));
  } catch (error) {
    console.error("Error fetching invoice series:", error.message);
    if (error.response) console.error("Response error:", error.response.data);
    return [];
  }
};

// API mới để lấy dữ liệu theo danh sách ký hiệu
const getInvoicesBySeriesList = async (
  taxCode,
  tuNgay,
  denngay,
  seriesList,
  progressCallback
) => {
  const url = `https://${taxCode}.minvoice.app/api/InvoiceApi78/GetInvoices`;

  const headers = {
    Authorization: "Bearer O87316arj5+Od3Fqyy5hzdBfIuPk73eKqpAzBSvv8sY=",
    "Content-Type": "application/json",
  };

  let allData = [];
  const limit = 300;

  try {
    // Lấy danh sách các ký hiệu đã chọn
    const selectedSeriesCodes = seriesList.map((series) => series.code);
    console.log("Danh sách ký hiệu đã chọn:", selectedSeriesCodes);

    // Gọi API cho từng ký hiệu trong danh sách
    for (let i = 0; i < selectedSeriesCodes.length; i++) {
      const khieu = selectedSeriesCodes[i];

      // Gọi callback để cập nhật tiến trình
      if (progressCallback) {
        progressCallback(i + 1, selectedSeriesCodes.length);
      }

      console.log(`Đang lấy dữ liệu cho ký hiệu: ${khieu}`);
      let start = 0; // Reset start cho mỗi ký hiệu mới
      let hasMoreData = true;

      while (hasMoreData) {
        const body = {
          tuNgay,
          denngay,
          khieu,
          start,
          coChiTiet: true,
        };

        const response = await axios.post(url, body, { headers });
        const resData = response?.data?.data || [];

        if (!Array.isArray(resData) || resData.length === 0) {
          hasMoreData = false;
          break;
        }

        // Thêm dữ liệu vào mảng tổng
        allData.push(...resData);
        console.log(
          `Đã lấy ${resData.length} hóa đơn cho ký hiệu ${khieu}, tổng cộng: ${allData.length} hóa đơn`
        );

        // Kiểm tra xem còn dữ liệu không
        if (resData.length < limit) {
          hasMoreData = false;
        } else {
          start += limit;
        }
      }
    }

    // Sắp xếp lại toàn bộ dữ liệu theo số hóa đơn
    allData.sort((a, b) => a.inv_invoiceNumber - b.inv_invoiceNumber);
    console.log(`Tổng số hóa đơn đã lấy: ${allData.length}`);
    return allData;
  } catch (error) {
    console.error("Error fetching invoices by series list:", error);
    return [];
  }
};

export { getInvoiceSeries, getInvoicesBySeriesList };
export default getInvoices;
