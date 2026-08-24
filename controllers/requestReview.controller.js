const moment = require("moment");

const scheduleReviewModel = require("../model/scheduleReview.model");
const orderModel = require("../model/order.model");

const createScheduleReviewRequest = async (req, res) => {
  try {
    const { orderId, afterDays, isAutomated } = req.body;
    const userId = req?.user?._id;

    const order = await orderModel.find({ orderId: { $in: orderId } });
    if (!order) {
      return res.status(203).json({
        message: "Order not found!",
        isSuccess: false,
      });
    }

    const scheduleDate = moment(order?.shipDate).add(afterDays, "days");
    const orders = orderId.map((id) => {
      return {
        updateOne: {
          filter: { userId, orderId: id },
          update: {
            userId,
            orderId: id,
            afterDays,
            isActive: true,
            isAutomated,
            scheduleDate,
          },
          upsert: true,
        },
      };
    });

    await scheduleReviewModel.bulkWrite(orders);

    return res.status(201).json({
      message: "Schedule review updated successfully",

      isSuccess: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong!",
      error: error.message,
      isSuccess: false,
    });
  }
};

const removeAutomation = async (req, res) => {
  try {
    const { orderId, afterDays, isAutomated } = req.body;

    await scheduleReviewModel.deleteMany({ orderId: { $in: orderId } });

    return res.status(200).json({
      message: "Automation removed successfully",
      isSuccess: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong!",
      error: error?.message,
      isSuccess: false,
    });
  }
};

module.exports = { createScheduleReviewRequest, removeAutomation };
