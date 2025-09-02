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

export default getInvoices;
