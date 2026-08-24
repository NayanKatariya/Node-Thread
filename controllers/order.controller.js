const { default: mongoose } = require("mongoose");
const accountModel = require("../model/account.model");
const orderModel = require("../model/order.model");

const getAllOrders = async (req, res) => {
  try {
    const userId = req?.user?._id;
    const { search, filter, page, limit } = req?.body; // Get the search term from the query parameters
    // Build the search condition
    const matchConditions = {};

    if (search) {
      matchConditions["$or"] = [
        { asin: { $regex: search, $options: "i" } }, // Search for asin
        { title: { $regex: search, $options: "i" } }, // Search for product name
      ];
    }

    const orderFilter = { userId: new mongoose.Types.ObjectId(userId) };
    if (filter?.marketplace) {
      orderFilter["marketplaceId"] = filter?.marketplace;
    }

    const data = await orderModel.aggregate([
      {
        $match: orderFilter, // Apply the dynamic match condition here
      },
      {
        $lookup: {
          from: "orderitems",
          localField: "orderId",
          foreignField: "orderId",
          as: "result",
          pipeline: [
            {
              $project: {
                title: 1,
                mainImage: 1,
                asin: 1,
              },
            },
            {
              $match: matchConditions, // Apply the dynamic match condition here
            },
          ],
        },
      },
      {
        $lookup: {
          from: "schedulereviews",
          localField: "orderId",
          foreignField: "orderId",
          as: "review",
          pipeline: [
            {
              $project: {
                isActive: 1,
                isAutomated: 1,
                afterDays: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$result",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: { $toDate: "$shipDate" }, // Convert shipDate to Date if it's stored as a string
            },
          },
          data: {
            $push: {
              orderId: "$orderId",
              productName: "$result.title",
              productImage: "$result.mainImage",
              shipDate: "$shipDate",
              asin: "$result.asin",
              orderTotal: "$orderTotal",
              isSchedule: {
                $first: "$review",
              },
            },
          },
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
      {
        $facet: {
          data: [
            {
              $skip: (page - 1) * limit,
            },
            {
              $limit: limit,
            },
            {
              $project: {
                shipDate: "$_id",
                _id: 0,
                data: 1,
              },
            },
          ],
          total: [
            {
              $count: "count",
            },
          ],
        },
      },
    ]);

    return res.status(200).json({
      message: "Orders fetched successfully.",
      data: {
        orders: data?.[0]?.data || [],
        total: data?.[0]?.total?.[0]?.count || 0,
      },
      isSuccess: true,
    });
  } catch (error) {
    return res.status(error?.status || 500).send({
      error: error?.message,
      message: "Something went wrong, please try again!",
      isSuccess: false,
    });
  }
};

// const

module.exports = { getAllOrders };
