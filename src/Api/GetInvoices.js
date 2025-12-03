import axios from "axios";

// Helper function để kiểm tra hóa đơn có bị thay thế không (InvoiceStatus === 6)
const isInvoiceReplaced = (invoice) => {
  const status =
    invoice.trang_thai_hd !== undefined
      ? invoice.trang_thai_hd
      : invoice.invoiceStatus;
  return status === 6;
};

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

      // Đảm bảo ký hiệu được gán đúng cho mỗi record
      const processedData = resData
        .map((item) => ({
        ...item,
        inv_invoiceSeries: khieu,
        inv_buyerTaxCode: taxCode, // Đảm bảo mã số thuế được gán đúng
        }))
        .filter((item) => !isInvoiceReplaced(item)); // Loại bỏ hóa đơn bị thay thế (InvoiceStatus === 6)

      allData.push(...processedData);

      if (resData.length < limit) break;
      start += limit;
    }

    // Lọc bỏ hóa đơn bị thay thế trước khi sắp xếp (đảm bảo an toàn)
    allData = allData.filter((item) => !isInvoiceReplaced(item));

    allData.sort((a, b) => a.inv_invoiceNumber - b.inv_invoiceNumber);

    // Log để debug
    // console.log(`=== API: Ký hiệu ${khieu} ===`);
    // console.log(`Tổng số hóa đơn: ${allData.length}`);
    // if (allData.length > 0) {
    //   console.log(
    //     `Mẫu dữ liệu (3 hóa đơn đầu):`,
    //     allData.slice(0, 3).map((item) => ({
    //       series: item.inv_invoiceSeries,
    //       number: item.inv_invoiceNumber,
    //       date: item.inv_invoiceIssuedDate,
    //       total: item.inv_TotalAmount,
    //     }))
    //   );
    // }

    return allData;
  } catch (error) {
    // console.error("Error calling API:", error.message);
    // if (error.response) console.error("Response error:", error.response.data);
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

    // console.log("API Response - Danh sách ký hiệu:", data);

    // Danh sách ký hiệu cần filter (loại bỏ)
    const excludedSeries = [
      "1C25MEA",
      "1C25MCS",
      "1C25MEK",
      "1C25MEI",
      "1C25MDV",
      "1C25MCY",
      "1C25MEE",
      "1C25MDG",
      "1C25MBY",
      "1C25MDA",
      "1C25MDC",
      "1C25MDE",
      "1C25MDH",
      "1C25MDL",
      "1C25MDO",
      "1C25MDU",
      "1C25MAC",
      "1C25MAM",
      "1C25MAP",
      "1C25MAQ",
      "1C25MAT",
      "1C25MDN",
      "1C25MAG",
      "1C25MAI",
      "1C25MAL",
      "1C25MAO",
      "1C25MAR",
      "1C25MDP",
      "1C25MDQ",
      "1C25MDY",
      "1C25MEB",
      "1C25MEV",
      "1C25MAD",
      "1C25MAE",
      "1C25MAH",
      "1C25MAK",
      "1C25MAS",
      "1C25MAU",
      "1C25MBA",
      "1C25MBB",
      "1C25MBC",
      "1C25MBH",
      "1C25MBI",
      "1C25MBO",
      "1C25MBR",
      "1C25MBS",
      "1C25MBU",
      "1C25MBV",
      "1C25MCI",
      "1C25MEH",
      "1C25MEM",
      "1C25MEO",
      "1C25MER",
      "1C25MES",
      "1C25MET",
      "1C25MEY",
      "1C25MGB",
      "1C25MGG",
      "1C25MGM",
      "1C25MGN",
      "1C25MGT",
      "1C25MGX",
      "1C25MHE",
      "1C25TVP",
      "1C25TVQ",
      "1C25TVR",
      "1C25TVS",
      "1C25TVT",
      "1C25TVU",
      "1C25TVV",
      "1C25TVW",
      "1C25MAX",
      "1C25MAY",
      "1C25MBK",
      "1C25MBL",
      "1C25MBN",
      "1C25MBX",
      "1C25MCB",
      "1C25MCC",
      "1C25MCG",
      "1C25MCK",
      "1C25MCL",
      "1C25MCM",
      "1C25MCQ",
      "1C25MDS",
      "1C25MEN",
      "1C25MEQ",
      "1C25MEU",
      "1C25MEX",
      "1C25MGA",
      "1C25MGC",
      "1C25MGR",
      "1C25MGU",
    ];

    // Chuyển đổi dữ liệu để phù hợp với MultiSelect
    // Hiển thị tất cả ký hiệu có giá trị, nhưng loại bỏ các ký hiệu trong excludedSeries
    const result = data
      .filter(
        (item) =>
          item.value &&
          item.value.trim() !== "" &&
          !excludedSeries.includes(item.value)
      )
      .map((item) => ({
        name: item.value,
        code: item.value,
        id: item.id,
        invoiceTypeName: item.invoiceTypeName,
      }));

    // console.log("Danh sách ký hiệu sau khi xử lý:", result);
    // console.log(
    //   `Đã loại bỏ ${data.length - result.length} ký hiệu (tổng ${
    //     data.length
    //   } ký hiệu)`
    // );
    return result;
  } catch (error) {
    // console.error("Error fetching invoice series:", error.message);
    // if (error.response) console.error("Response error:", error.response.data);
    return [];
  }
};

// API mới để lấy dữ liệu theo danh sách ký hiệu
const getInvoicesBySeriesList = async (
  taxCode,
  tuNgay,
  denngay,
  seriesList,
  progressCallback,
  dataUpdateCallback, // Callback để cập nhật dữ liệu từng phần
  errorCallback // Callback khi gặp lỗi nghiêm trọng (để tự động xuất Excel)
) => {
  const url = `https://${taxCode}.minvoice.app/api/InvoiceApi78/GetInvoices`;

  const headers = {
    Authorization: "Bearer O87316arj5+Od3Fqyy5hzdBfIuPk73eKqpAzBSvv8sY=",
    "Content-Type": "application/json",
  };

  let allData = [];
  const limit = 300;

  // Helper function để retry API call (đặt ngoài vòng lặp để tránh linter warning)
  const fetchWithRetry = async (
    apiUrl,
    bodyParams,
    apiHeaders,
    seriesCode,
    maxRetries = 3
  ) => {
    let retryCount = 0;
    while (retryCount < maxRetries) {
      try {
        const response = await axios.post(apiUrl, bodyParams, {
          headers: apiHeaders,
        });
        return response?.data?.data || [];
      } catch (error) {
        retryCount++;
        // console.warn(
        //   `Lỗi khi lấy dữ liệu cho ký hiệu ${seriesCode}, start=${bodyParams.start}, lần thử ${retryCount}/${maxRetries}:`,
        //   error.message
        // );

        if (retryCount >= maxRetries) {
          // console.error(
          //   `Đã thử ${maxRetries} lần nhưng vẫn lỗi. Bỏ qua batch này và tiếp tục với batch tiếp theo.`
          // );
          throw error; // Throw để bên ngoài xử lý
        }

        // Đợi một chút trước khi retry (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
      }
    }
    return [];
  };

  try {
    // Lấy danh sách các ký hiệu đã chọn
    const selectedSeriesCodes = seriesList.map((series) => series.code);
    // console.log("Danh sách ký hiệu đã chọn:", selectedSeriesCodes);

    // Gọi API cho từng ký hiệu trong danh sách
    for (let i = 0; i < selectedSeriesCodes.length; i++) {
      const khieu = selectedSeriesCodes[i];

      // Gọi callback để cập nhật tiến trình
      if (progressCallback) {
        progressCallback(i + 1, selectedSeriesCodes.length);
      }

      // console.log(`Đang lấy dữ liệu cho ký hiệu: ${khieu}`);
      let start = 0; // Reset start cho mỗi ký hiệu

      while (true) {
        const body = {
          tuNgay,
          denngay,
          khieu,
          start,
          coChiTiet: true,
        };

        let resData = [];
        let success = false;

        // Retry logic khi gặp lỗi
        try {
          resData = await fetchWithRetry(url, body, headers, khieu);
          success = true;
        } catch (error) {
          // Đã thử hết số lần, bỏ qua batch này
          success = false;
        }

        // Nếu không thành công sau khi retry, bỏ qua batch này
        if (!success) {
          // console.warn(
          //   `Bỏ qua batch start=${start} cho ký hiệu ${khieu}, tiếp tục với batch tiếp theo...`
          // );
          // Tăng start để thử batch tiếp theo
          start += limit;
          // Nếu đã retry nhiều lần mà vẫn lỗi, có thể đã hết dữ liệu hoặc lỗi nghiêm trọng
          // Thử tiếp tục với batch tiếp theo thay vì break hoàn toàn
          if (start > 10000) {
            // Giới hạn để tránh vòng lặp vô hạn
            // console.warn(
            //   `Đã thử quá nhiều batch cho ký hiệu ${khieu}, chuyển sang ký hiệu tiếp theo`
            // );
            break;
          }
          continue;
        }

        if (!Array.isArray(resData) || resData.length === 0) break;

        // Thêm ký hiệu vào mỗi record để đảm bảo mapping đúng
        const processedData = resData
          .map((item) => ({
          ...item,
          inv_invoiceSeries: khieu, // Đảm bảo ký hiệu được gán đúng
          inv_buyerTaxCode: taxCode, // Đảm bảo mã số thuế được gán đúng
          }))
          .filter((item) => !isInvoiceReplaced(item)); // Loại bỏ hóa đơn bị thay thế (InvoiceStatus === 6)

        allData.push(...processedData);

        // Cập nhật dữ liệu từng phần sau mỗi batch thành công
        if (dataUpdateCallback && allData.length > 0) {
          // Lọc lại để đảm bảo không có hóa đơn bị thay thế
          const filteredData = allData.filter(
            (item) => !isInvoiceReplaced(item)
          );
          const sortedData = [...filteredData].sort(
            (a, b) => a.inv_invoiceNumber - b.inv_invoiceNumber
          );
          dataUpdateCallback(sortedData, taxCode);
        }

        if (resData.length < limit) break;
        start += limit;
      }

      // Cập nhật dữ liệu từng phần sau mỗi ký hiệu (nếu chưa được cập nhật trong vòng lặp)
      if (dataUpdateCallback && allData.length > 0) {
        // Lọc lại để đảm bảo không có hóa đơn bị thay thế
        const filteredData = allData.filter(
          (item) => !isInvoiceReplaced(item)
        );
        // Sắp xếp tạm thời dữ liệu hiện có
        const sortedData = [...filteredData].sort(
          (a, b) => a.inv_invoiceNumber - b.inv_invoiceNumber
        );
        dataUpdateCallback(sortedData, taxCode);
      }
    }

    // Lọc bỏ hóa đơn bị thay thế trước khi sắp xếp
    allData = allData.filter((item) => !isInvoiceReplaced(item));

    // Sắp xếp lại toàn bộ dữ liệu theo số hóa đơn
    allData.sort((a, b) => a.inv_invoiceNumber - b.inv_invoiceNumber);

    // Log để debug
    // console.log("=== API: Tổng hợp tất cả ký hiệu ===");
    // console.log(`Tổng số hóa đơn: ${allData.length}`);
    // console.log(`Số ký hiệu đã xử lý: ${selectedSeriesCodes.length}`);
    // if (allData.length > 0) {
    //   console.log(
    //     "Mẫu dữ liệu (5 hóa đơn đầu):",
    //     allData.slice(0, 5).map((item) => ({
    //       series: item.inv_invoiceSeries,
    //       number: item.inv_invoiceNumber,
    //       date: item.inv_invoiceIssuedDate,
    //       total: item.inv_TotalAmount,
    //     }))
    //   );
    // }

    return allData;
  } catch (error) {
    // console.error("Error fetching invoices by series list:", error);
    // Trả về dữ liệu đã tải được thay vì mảng rỗng
    if (allData.length > 0) {
      // console.warn(
      //   `⚠️ Đã gặp lỗi nghiêm trọng nhưng vẫn trả về ${allData.length} hóa đơn đã tải được`
      // );

      // Lọc bỏ hóa đơn bị thay thế trước khi trả về
      const filteredData = allData.filter((item) => !isInvoiceReplaced(item));

      // Gọi callback để thông báo lỗi nghiêm trọng (để tự động xuất Excel)
      if (errorCallback && typeof errorCallback === "function") {
        try {
          errorCallback(error, filteredData, taxCode);
        } catch (callbackError) {
          // console.error("Lỗi khi gọi errorCallback:", callbackError);
        }
      }

      return filteredData;
    }

    // Nếu không có dữ liệu và có errorCallback, vẫn gọi để thông báo
    if (errorCallback && typeof errorCallback === "function") {
      try {
        errorCallback(error, [], taxCode);
      } catch (callbackError) {
        // console.error("Lỗi khi gọi errorCallback:", callbackError);
      }
    }

    return [];
  }
};

export { getInvoiceSeries, getInvoicesBySeriesList };
export default getInvoices;
