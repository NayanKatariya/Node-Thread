const axios = require("axios");
const accountModel = require("../model/account.model");
const productModel = require("../model/product.model");
const orderItemModel = require("../model/orderItem.model");

const getProducts = async () => {
  try {
    const checkConfigAds = await accountModel.find();

    await Promise.all(
      checkConfigAds.map(async (user) => {
        let products = [];
        let bulkProducts = [];
        let bulkOrderItems = [];
        const orderItems = await orderItemModel
          .find({
            userId: user?.userId,
            $or: [{ mainImage: { $exists: false } }, { mainImage: "" }],
          })
          .select("asin");

        const productAsin = [...new Set(orderItems.map((item) => item.asin))];
        const batch = 10;
        const getAllProducts = async () => {
          const asin = productAsin.splice(0, batch);
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
              },
            });

            products = [...products, ...(response?.data?.items || [])];

            if (productAsin.length > 0) {
              await sleep(3000);
              await getAllProducts();
            }
          } catch (error) {
            console.error(
              `Error fetching orders for user ${user?.userId}:`,
              error?.response?.data
            );
            throw error;
          }
        };
        if (orderItems?.length > 0) await getAllProducts();

        for (const product of products) {
          const image = product?.images[0]?.images?.find(
            (image) => image?.variant === "MAIN"
          )?.link;
          const newProduct = {
            marketplaceId: product?.summaries[0]?.marketplaceId,
            userId: user?.userId,
            brand: product?.summaries[0]?.brand,
            itemName: product?.summaries[0]?.itemName,
            asin: product?.asin,
            image: image,
            itemClassification: product?.summaries[0]?.itemClassification,
            manufacturer: product?.summaries[0]?.manufacturer,
          };

          bulkProducts.push({
            updateOne: {
              filter: {
                marketplaceId: product?.summaries[0]?.marketplaceId,
                userId: user?.userId,
                asin: product?.asin,
              },
              update: newProduct,
              upsert: true,
            },
          });

          bulkOrderItems.push({
            updateMany: {
              filter: {
                userId: user?.userId,
                asin: product?.asin,
              },
              update: {
                mainImage: image,
              },
              upsert: true,
            },
          });

          if (bulkProducts.length >= 2000) {
            await productModel.bulkWrite(bulkProducts);
            await orderItemModel.bulkWrite(bulkOrderItems);
            bulkProducts = [];
            bulkOrderItems = [];
          }
        }

        if (bulkProducts.length > 0) {
          await productModel.bulkWrite(bulkProducts);
          await orderItemModel.bulkWrite(bulkOrderItems);
          bulkProducts = [];
          bulkOrderItems = [];
        }
      })
    );
  } catch (error) {
    console.error("Error during getOrders:", error?.response?.data);
  }
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { getProducts };
