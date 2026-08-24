const { default: mongoose } = require("mongoose");
const messageModel = require("../model/message.model");
const { OpenAI } = require("openai");
const { sendEmail } = require("../service/message.service");
const accountModel = require("../model/account.model");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const getCustomerMessages = async (req, res) => {
  try {
    const userId = req?.user?._id;
    const messages = await messageModel.find({ userId });

    return res.status(200).json({
      message: "Messages get successfully.",
      isSuccess: true,
      data: messages,
    });
  } catch (error) {
    res.status(500).send({
      message: "Something went wrong, please try again!",
      isSuccess: false,
      error: error.message,
    });
  }
};

const getUserMessages = async (req, res) => {
  try {
    const userId = req?.user?._id;
    const userEmail = req?.body?.email;
    const type = req?.body?.type;
    const messages = await messageModel
      .find({
        receiver: userEmail,
        userId,
        type,
      })
      .populate("accountId", "sellerEmail")
      .select("message messageDate receiver sender type accountId")
      .sort({ messageDate: 1 });

    return res.status(200).json({
      message: "Messages get successfully.",
      isSuccess: true,
      data: messages,
    });
  } catch (error) {
    res.status(500).send({
      message: "Something went wrong, please try again!",
      isSuccess: false,
      error: error.message,
    });
  }
};

const getCustomerForMessages = async (req, res) => {
  try {
    const userId = req?.user?._id;
    const messages = await messageModel.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $sort: { messageDate: -1 } },
      {
        $group: {
          _id: { receiver: "$receiver", type: "$type" },
          messageDate: { $first: "$messageDate" },
          accountId: { $first: "$accountId" },
          orderId: { $first: "$orderId" },
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "accountId",
          foreignField: "_id",
          as: "account",
          pipeline: [{ $project: { sellerEmail: 1 } }],
        },
      },
      { $unwind: "$account" },
      { $sort: { messageDate: -1 } },
      {
        $project: {
          receiver: "$_id.receiver",
          type: "$_id.type",
          messageDate: 1,
          account: 1,
          orderId: 1,
          _id: 0,
        },
      },
    ]);

    return res.status(200).json({
      message: "Messages get successfully.",
      isSuccess: true,
      data: messages,
    });
  } catch (error) {
    res.status(500).send({
      message: "Something went wrong, please try again!",
      isSuccess: false,
      error: error.message,
    });
  }
};

const generateMessage = async (prompt) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // You can use other models such as 'gpt-4'
      messages: [{ role: "user", content: prompt }],
    });

    return response?.choices?.[0]?.message?.content?.trim();
  } catch (error) {
    return error;
  }
};
const generateMessageWithHistory = async (req, res) => {
  try {
    const messages = req?.body;
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // You can use other models such as 'gpt-4'
      messages,
    });
    res.status(200).json({
      message: "Message generated successfully.",
      isSuccess: true,
      data: {
        role: "assistant",
        content: [
          {
            type: "text",
            text: response?.choices?.[0]?.message?.content?.trim(),
          },
        ],
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong, please try again!",
      isSuccess: false,
      error: error.message,
    });
  }
};

const generateAutomaticMessage = async (req, res) => {
  try {
    const { prompt } = req?.body;
    const message = await generateMessage(prompt);
    return res.status(200).json({
      message: "Message generated successfully.",
      isSuccess: true,
      data: message,
    });
  } catch (error) {
    res.status(500).send({
      message: "Something went wrong, please try again!",
      isSuccess: false,
      error: error.message,
    });
  }
};

const sendAmazonMessage = async (req, res) => {
  try {
    const userId = req?.user?._id;
    const { message, sender, receiver, orderId, type, accountId } = req?.body;
    const account = await accountModel
      .findOne({ userId })
      .populate("userId", "tokens email");
    const tokens = account?.tokens?.access_token
      ? account?.tokens
      : account?.userId?.tokens?.access_token
      ? account?.userId?.tokens
      : null;
    await sendEmail(
      sender || account?.userId?.email,
      receiver,
      type,
      message,
      userId,
      orderId,
      tokens,
      accountId
    );

    return res.status(200).json({
      message: "Message sent successfully.",
      isSuccess: true,
    });
  } catch (error) {
    res.status(500).send({
      message: "Something went wrong, please try again!",
      isSuccess: false,
      error: error.message,
    });
  }
};

module.exports = {
  getCustomerMessages,
  getCustomerForMessages,
  getUserMessages,
  generateMessage,
  sendAmazonMessage,
  generateAutomaticMessage,
  generateMessageWithHistory,
};
