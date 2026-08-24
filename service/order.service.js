const { default: axios } = require("axios");
const moment = require("moment");
const accountModel = require("../model/account.model");
const orderModel = require("../model/order.model");
const orderItemModel = require("../model/orderItem.model");
const messageModel = require("../model/message.model");

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const getOrders = async (messageOrder) => {
  try {
    const checkConfigAds = await accountModel.find();

    await Promise.all(
      checkConfigAds.map(async (user) => {
        let orders = [];
        let bulkOrders = [];
        let orderIds = [];
        if (messageOrder) {
          const messages = await messageModel
            .find({ userId: user?.userId, orderId:{$nin:[null,""]},})
            .select("orderId");
          orderIds = messages.map((message) => message?.orderId);
        }
        const getAllOrders = async (nextToken = "") => {
          const url = `${process.env.SP_API_URL}orders/v0/orders`;
          const date = moment().subtract(4, "hours").toISOString(); // Use toISOString for consistency in date formatting

          try {
            const response = await axios.get(url, {
              headers: {
                "x-amz-access-token": user?.accessToken,
              },
              params: {
                MarketplaceIds: user?.marketplaceId,
                CreatedAfter: date,
                AmazonOrderIds: orderIds.join(","),
                OrderStatuses: "Shipped",
                NextToken: nextToken,
              },
            });

            orders = [...orders, ...(response?.data?.payload?.Orders || [])];

            const next = response?.data?.payload?.NextToken;
            if (next) {
              await sleep(10000);
              await getAllOrders(next);
            }
          } catch (error) {
            console.error(
              `Error fetching orders for user ${user?.userId}:`,
              error?.response?.data
            );
            throw error;
          }
        };

        await getAllOrders();

        for (const order of orders) {
          const newOrder = {
            marketplaceId: order?.MarketplaceId,
            userId: user?.userId,
            orderId: order?.AmazonOrderId,
            shipDate: order?.LatestShipDate,
            deliveryDate: moment(order?.LatestShipDate).add(6, "days"),
            buyerEmail: order?.BuyerInfo?.BuyerEmail,
            numberOfItemsShipped: order?.NumberOfItemsShipped,
            orderTotal: {
              amount: order?.OrderTotal?.Amount,
              currencyCode: order?.OrderTotal?.CurrencyCode,
            },
            shippingAddress: {
              stateOrRegion: order?.ShippingAddress?.StateOrRegion,
              postalCode: order?.ShippingAddress?.PostalCode,
              city: order?.ShippingAddress?.City,
              CountryCode: order?.ShippingAddress?.CountryCode,
            },
            shipmentServiceLevelCategory: order?.shipmentServiceLevelCategory,
          };
          await getOrdersItem(
            order?.AmazonOrderId,
            user?.accessToken,
            user?.userId
          );

          bulkOrders.push({
            updateOne: {
              filter: {
                marketplaceId: order?.MarketplaceId,
                userId: user?.userId,
                orderId: order?.AmazonOrderId,
              },
              update: newOrder,
              upsert: true,
            },
          });

          if (bulkOrders.length >= 2000) {
            await orderModel.bulkWrite(bulkOrders);
            bulkOrders = [];
          }
        }

        if (bulkOrders.length > 0) {
          await orderModel.bulkWrite(bulkOrders);
        }
      })
    );
  } catch (error) {
    console.error("Error during getOrders:", error?.response?.data||error?.message);
  }
};

const getOrdersItem = async (orderId, accessToken, userId) => {
  try {
    let orderItems = [];
    let bulkOrderItems = [];
    let nextToken = "";

    while (nextToken !== undefined) {
      const url = `${process.env.SP_API_URL}orders/v0/orders/${orderId}/orderItems`;

      const response = await axios.get(url, {
        headers: {
          "x-amz-access-token": accessToken,
        },
        params: {
          NextToken: nextToken,
        },
      });

      orderItems = [
        ...orderItems,
        ...(response?.data?.payload?.OrderItems || []),
      ];

      nextToken = response?.data?.payload?.NextToken;

      if (nextToken) {
        await sleep(3000);
      }
    }

    for (const orderItem of orderItems) {
      const orderItemData = {
        userId: userId,
        orderId: orderId,
        asin: orderItem?.ASIN,
        sellerSKU: orderItem?.SellerSKU,
        title: orderItem?.Title,
        orderItemId: orderItem?.OrderItemId,
      };

      bulkOrderItems.push({
        updateOne: {
          filter: {
            userId: userId,
            orderId: orderId,
            asin: orderItem?.ASIN,
          },
          update: orderItemData,
          upsert: true,
        },
      });

      if (bulkOrderItems.length >= 2000) {
        await orderItemModel.bulkWrite(bulkOrderItems);
        bulkOrderItems = [];
      }
    }

    if (bulkOrderItems.length > 0) {
      await orderItemModel.bulkWrite(bulkOrderItems);
    }
  } catch (error) {
    console.error(
      `Error processing order items for Order ID ${orderId}:`,
      error?.response?.data
    );
  }
};

module.exports = { getOrders };
