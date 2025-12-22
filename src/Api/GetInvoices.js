import axios from "axios";

// Helper function để kiểm tra hóa đơn có bị thay thế không (InvoiceStatus === 6)
const isInvoiceReplaced = (invoice) => {
  const status =
    invoice.trang_thai_hd !== undefined
      ? invoice.trang_thai_hd
      : invoice.invoiceStatus;
  return status === 6;
};

// Helper function để kiểm tra hóa đơn có trang_thai lỗi không
const isInvoiceError = (invoice) => {
  // Kiểm tra trang_thai (nếu có)
  const trangThai = invoice.trang_thai;
  
  // Nếu trang_thai là null, undefined, hoặc có giá trị không hợp lệ thì coi là lỗi
  // Có thể mở rộng logic này để kiểm tra các giá trị cụ thể khác
  if (trangThai === null || trangThai === undefined) {
    return false; // Không có trang_thai thì không coi là lỗi (có thể dùng trang_thai_hd)
  }
  
  // Loại bỏ hóa đơn có trang_thai === 5 (hóa đơn có lỗi)
  if (trangThai === 5 || trangThai === "5") {
    return true;
  }
  
  // Nếu trang_thai là chuỗi rỗng hoặc có giá trị "lỗi", "error", "fail" thì coi là lỗi
  if (typeof trangThai === 'string') {
    const lowerTrangThai = trangThai.toLowerCase().trim();
    if (lowerTrangThai === '' || 
        lowerTrangThai === 'lỗi' || 
        lowerTrangThai === 'error' || 
        lowerTrangThai === 'fail' ||
        lowerTrangThai === 'false') {
      return true;
    }
  }
  
  // Nếu trang_thai là boolean false thì coi là lỗi
  if (trangThai === false) {
    return true;
  }
  
  return false;
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
          inv_sellerTaxCode: taxCode, // Lưu MST người bán (seller) - đây là MST được nhập vào
        }))
        .filter((item) => !isInvoiceReplaced(item) && !isInvoiceError(item)); // Loại bỏ hóa đơn bị thay thế và hóa đơn có trang_thai lỗi

      allData.push(...processedData);

      if (resData.length < limit) break;
      start += limit;
    }

    // Lọc bỏ hóa đơn bị thay thế và hóa đơn có trang_thai lỗi trước khi sắp xếp (đảm bảo an toàn)
    allData = allData.filter((item) => !isInvoiceReplaced(item) && !isInvoiceError(item));

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
    const excludedSeries = [];

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
        // Trả về cả data và total từ response
        return {
          data: response?.data?.data || [],
          total: response?.data?.total || 0,
        };
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
    return { data: [], total: 0 };
  };

  try {
    // Lấy danh sách các ký hiệu đã chọn
    const selectedSeriesCodes = seriesList.map((series) => series.code);
    // console.log("Danh sách ký hiệu đã chọn:", selectedSeriesCodes);

    // Tổng số hóa đơn từ tất cả các ký hiệu (sẽ được cập nhật khi lấy được total từ API)
    let grandTotalInvoices = 0;
    const seriesTotals = {}; // Lưu total của từng ký hiệu

    // Gọi API cho từng ký hiệu trong danh sách
    for (let i = 0; i < selectedSeriesCodes.length; i++) {
      const khieu = selectedSeriesCodes[i];

      // console.log(`Đang lấy dữ liệu cho ký hiệu: ${khieu}`);
      let start = 0; // Reset start cho mỗi ký hiệu
      let totalInvoicesForThisSeries = 0; // Tổng số hóa đơn cho ký hiệu hiện tại
      let seriesTotal = 0; // Total từ API cho ký hiệu này

      while (true) {
        const body = {
          tuNgay,
          denngay,
          khieu,
          start,
          coChiTiet: true,
        };

        let responseResult = { data: [], total: 0 };
        let success = false;

        // Retry logic khi gặp lỗi
        try {
          responseResult = await fetchWithRetry(url, body, headers, khieu);
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

        const resData = responseResult.data;
        const resTotal = responseResult.total;

        // Lấy total từ response đầu tiên của mỗi ký hiệu
        if (start === 0 && resTotal > 0) {
          seriesTotal = resTotal;
          seriesTotals[khieu] = resTotal;
          // Cập nhật tổng số hóa đơn (chỉ cộng thêm nếu chưa có trong seriesTotals)
          grandTotalInvoices += resTotal;
        }

        if (!Array.isArray(resData) || resData.length === 0) break;

        // Thêm ký hiệu vào mỗi record để đảm bảo mapping đúng
        const processedData = resData
          .map((item) => ({
            ...item,
            inv_invoiceSeries: khieu, // Đảm bảo ký hiệu được gán đúng
            inv_sellerTaxCode: taxCode, // Lưu MST người bán (seller) - đây là MST được nhập vào
          }))
          .filter((item) => !isInvoiceReplaced(item) && !isInvoiceError(item)); // Loại bỏ hóa đơn bị thay thế và hóa đơn có trang_thai lỗi

        allData.push(...processedData);
        totalInvoicesForThisSeries += processedData.length;

        // Gọi callback để cập nhật tiến trình với số hóa đơn đã lấy
        if (progressCallback) {
          progressCallback(
            allData.length, // Tổng số hóa đơn đã lấy
            grandTotalInvoices, // Tổng số hóa đơn từ API (total)
            i + 1, // Ký hiệu hiện tại
            selectedSeriesCodes.length, // Tổng số ký hiệu
            khieu, // Ký hiệu đang xử lý
            totalInvoicesForThisSeries, // Số hóa đơn đã lấy cho ký hiệu này
            seriesTotal // Total từ API cho ký hiệu này
          );
        }

        // Cập nhật dữ liệu từng phần sau mỗi batch thành công
        if (dataUpdateCallback && allData.length > 0) {
          // Lọc lại để đảm bảo không có hóa đơn bị thay thế và hóa đơn có trang_thai lỗi
          const filteredData = allData.filter(
            (item) => !isInvoiceReplaced(item) && !isInvoiceError(item)
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
        // Lọc lại để đảm bảo không có hóa đơn bị thay thế và hóa đơn có trang_thai lỗi
        const filteredData = allData.filter((item) => !isInvoiceReplaced(item) && !isInvoiceError(item));
        // Sắp xếp tạm thời dữ liệu hiện có
        const sortedData = [...filteredData].sort(
          (a, b) => a.inv_invoiceNumber - b.inv_invoiceNumber
        );
        dataUpdateCallback(sortedData, taxCode);
      }
    }

    // Lọc bỏ hóa đơn bị thay thế và hóa đơn có trang_thai lỗi trước khi sắp xếp
    allData = allData.filter((item) => !isInvoiceReplaced(item) && !isInvoiceError(item));

    // Sắp xếp lại toàn bộ dữ liệu theo số hóa đơn
    allData.sort((a, b) => a.inv_invoiceNumber - b.inv_invoiceNumber);

    // Gọi callback cuối cùng để set progress = 100%
    if (progressCallback) {
      progressCallback(
        allData.length, // Tổng số hóa đơn đã lấy
        grandTotalInvoices, // Tổng số hóa đơn từ API (total)
        selectedSeriesCodes.length, // Tổng số ký hiệu
        selectedSeriesCodes.length, // Tổng số ký hiệu
        "", // Không có ký hiệu đang xử lý
        allData.length, // Tổng số hóa đơn đã lấy
        grandTotalInvoices // Total
      );
    }

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

      // Lọc bỏ hóa đơn bị thay thế và hóa đơn có trang_thai lỗi trước khi trả về
      const filteredData = allData.filter((item) => !isInvoiceReplaced(item) && !isInvoiceError(item));

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
