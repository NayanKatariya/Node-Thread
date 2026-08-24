const { default: axios } = require("axios");
const productModel = require("../model/product.model");


const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getAllSellerProducts = async (
  token,
  asin,
  user,
  products = [],
  nextToken = ""
) => {
  const url = `${process.env.SP_API_URL}catalog/2022-04-01/items`;

  try {
    const response = await axios.get(url, {
      headers: {
        "x-amz-access-token": user?.accessToken,
      },
      params: {
        marketplaceIds: user?.marketplaceId,
        includedData: "images,summaries",
        identifiersType: "asin",
        identifiers: asin.join(","),
        nextToken,
      },
    });

    products = [...products, ...(response?.data?.items || [])];

    if (response?.data?.nextToken) {
      await sleep(3000);

      return getAllProducts(asin, user, products, response.data.nextToken);
    }

    return products;
  } catch (error) {
    console.error(`Error fetching products for user ${user?.userId}:`, error);
    throw error;
  }
};

const asin = ["B08XYZ1234", "B08XYZ5678"];

const getProducts = async (req, res) => {
  try {
    const { token } = req?.query;
    const products = await getAllSellerProducts(token, asin, user);
    res.status(200).json({ products });
  } catch (error) {
    console.error("Error in fetching products:", error);
    res.status(500).json({ error: "Error in fetching products" });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const userId = req?.user?._id;
    const products = await productModel.find({ userId });
    res.status(200).json({ data:products,isSuccess: true,message: "Products fetched successfully." });
  } catch (error) {
    res.status(500).json({ error: "Error in fetching products" });
  }
};

module.exports = { getProducts ,getAllProducts};
