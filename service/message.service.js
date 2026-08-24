const { default: axios } = require("axios");
const messageModel = require("../model/message.model");
const accountModel = require("../model/account.model");
const { google } = require("googleapis");
const userModel = require("../model/user.model");
const orderModel = require("../model/order.model");
const { findOneRecord } = require("./common/findOne");
const { generateAnswerFromManual } = require("../controllers/chat.controller");
const orderItemModel = require("../model/orderItem.model");
const { default: mongoose } = require("mongoose");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL
);

const createMessage = async (data) => {
  try {
    const findMessage = await findOneRecord(messageModel, {
      orderId: data?.orderId,
      type: data?.type,
      message: data?.message,
      sender: data?.sender,
      receiver: data?.receiver,
      messageDate: data?.messageDate,
    });
    if (findMessage) {
      return "Message is already existing!";
    }
    const newMessage = new messageModel(data);
    return await newMessage.save();
  } catch (error) {
    throw new Error(`Failed to create message: ${error.message}`);
  }
};

const getMessageAction = async () => {
  try {
    const checkConfigAds = await accountModel.find();

    await Promise.all(
      checkConfigAds.map(async (user) => {
        const messages = await messageModel.find({ userId: user?.userId });
        for (const message of messages) {
          if (!message?.orderId) {
            continue;
          }
          const url = `${process.env.SP_API_URL}messaging/v1/orders/${message?.orderId}`;
          const response = await axios.get(url, {
            headers: {
              "x-amz-access-token": user?.accessToken,
            },
            params: {
              marketplaceIds: user?.marketplaceId,
            },
          });
          message.actions = response?.data?._links?.actions;
          await message.save();
        }
      })
    );
  } catch (error) {
    console.error(" getMessageAction ~ error:", error?.response?.data);
  }
};

const createMessageForBuyer = async (req, res) => {
  try {
    const { href, message } = req?.body;
    const userId = req?.user?._id;
    const config = await findOneRecord(accountModel, { userId });
    const response = await axios.post(
      `${process.env.SP_API_URL}${href}`,
      { text: message },
      {
        headers: {
          "x-amz-access-token": config?.accessToken,
        },
      }
    );
  } catch (error) {
    console.error(" createMessageForBuyer ~ error:", error?.response?.data);
  }
};

function extractMessage(decodedText) {
  const messageStart = "------------- Message:  -------------";
  const messageEnd = "------------- End message -------------";

  const startIndex = decodedText.indexOf(messageStart);
  const endIndex = decodedText.indexOf(messageEnd);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return null;
  }

  const message = decodedText
    .substring(startIndex + messageStart.length, endIndex)
    .trim();

  return message;
}

const convertToText = (base64UrlString) => {
  let base64 = base64UrlString.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const decoded = Buffer.from(base64, "base64").toString("utf-8");
  return extractMessage(decoded);
};

const getGmailMessages = async () => {
  try {
    const accounts = await accountModel
      .find({ isActive: true })
      .populate("userId");
    for (const account of accounts) {
      const usr = await findOneRecord(userModel, {
        email: account?.userId?.email,
      });
      const tokens = account?.tokens?.access_token
        ? account?.tokens
        : usr?.tokens?.access_token
        ? usr?.tokens
        : null;
      if (tokens) {
        oauth2Client.setCredentials(tokens);
        const gmail = google.gmail({ version: "v1", auth: oauth2Client });
        const res = await gmail.users.messages.list({
          userId: "me",
        });
        const labels = res?.data?.messages;
        labels.map(async (msg) => {
          const message = await gmail.users.messages.get({
            userId: "me",
            id: msg?.id,
          });
          const headers = message?.data?.payload?.headers;
          const part = message?.data?.payload?.parts?.find(
            (part) => part?.mimeType === "text/plain"
          );
          const sub = headers?.find(
            (header) =>
              (header?.name === "Subject" &&
                (header?.value?.includes("Order ID") ||
                  header?.value?.includes("Amazon customer"))) ||
              (message?.data?.snippet?.includes("Order ID") &&
                message?.data?.snippet?.includes("Amazon.com"))
          );
          const subMerge = headers?.find(
            (header) =>
              header?.name === "Subject" &&
              message?.data?.snippet?.includes("Order ID") &&
              message?.data?.snippet?.includes("Amazon.com") &&
              header?.name === "Subject" &&
              !header?.value?.includes("Order ID")
          );
          if (sub) {
            if (subMerge) {
              console.dir(message, { depth: null });
            }
            let text = "";
            if (!part) {
            } else {
              text = convertToText(part?.body?.data);
            }

            const date = headers?.find((header) => header?.name === "Date");
            const from = headers?.find(
              (header) => header?.name === "From"
            )?.value;

            const to = headers?.find((header) => header?.name === "To")?.value;
            const messageReceiver = to?.includes(usr?.email) ? from : to;

            const mail = {
              type: sub?.value,
              messageDate: date?.value,
              sender: from,
              receiver: messageReceiver,
              message: text || message?.data?.snippet,
              orderId: extractAmazonOrderId(
                sub?.value?.includes("Order")
                  ? sub?.value
                  : message?.data?.snippet
              ),
              isFetched: true,
              replied: from?.includes(
                usr?.email || '"Amazon.com" <donotreply@amazon.com>'
              ),
              userId: usr?._id,
              accountId: account?._id,
            };

            await createMessage(mail);
          }
        });
      }
    }
  } catch (error) {
    console.error(" getGmailMessages ~ error:", error);
  }
};

async function sendEmail(
  from,
  to,
  subject,
  message,
  userId,
  orderId,
  tokens,
  id
) {
  try {
    oauth2Client.setCredentials(tokens);

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const rawMessage = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      "",
      message,
    ].join("\n");

    // Gmail API requires base64url encoding
    const encodedMessage = Buffer.from(rawMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    if (res?.data?.id) {
      const mail = {
        type: subject,
        messageDate: new Date(),
        sender: from,
        receiver: to,
        message: message,
        orderId: orderId,
        isFetched: true,
        replied: true,
        userId: userId,
        accountId: id,
      };

      await createMessage(mail);
    }
  } catch (error) {
    console.error("Error sending email:", error || error?.response?.data);
  }
}

const sendMessageToBuyer = async () => {
  try {
    const automationUser = await userModel
      .find({
        isVerified: true,
        customerSupportAutomation: true,
      })
      .select("_id");
    const userIds = automationUser?.map((user) => user?._id);
    const accounts = await accountModel
      .find({ isActive: true, userId: { $in: userIds } })
      .populate("userId", "tokens");
    for (const account of accounts) {
      const messages = await messageModel.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(account?.userId) } },
        { $sort: { messageDate: -1 } },
        {
          $group: {
            _id: { receiver: "$receiver", type: "$type", orderId: "$orderId" },
            messages: {
              $push: {
                _id: "$_id",
                messageDate: "$messageDate",
                accountId: "$accountId",
                message: "$message",
                sender: "$sender",
                receiver: "$receiver",
              },
            },
          },
        },
        {
          $lookup: {
            from: "orderitems",
            localField: "_id.orderId",
            foreignField: "orderId",
            as: "items",
            pipeline: [
              { $limit: 1 },
              { $project: { asin: 1, title: 1, quantity: 1 } },
            ],
          },
        },
        { $sort: { messageDate: -1 } },
        {
          $project: {
            receiver: "$_id.receiver",
            orderId: "$_id.orderId",
            type: "$_id.type",
            items: {
              $arrayElemAt: ["$items", 0],
            },
            messages: "$messages",
            _id: 0,
          },
        },
      ]);
      for (const message of messages) {
        let messagePrompt = "";
        const asin = message?.items?.asin;
        if (!asin) continue;
        for (const msg of message?.messages) {
          
          if (msg?.receiver !== msg?.sender) {
            break;
          }

          messagePrompt = messagePrompt + " \n" + msg?.message;
        }

        if (messagePrompt === "") continue;

        const aiMessage = await generateAnswerFromManual(messagePrompt, asin);
        const tokens = account?.tokens?.access_token
          ? account?.tokens
          : account?.userId?.tokens?.access_token
          ? account?.userId?.tokens
          : null;
        await sendEmail(
          message?.sender || account?.userId?.email,
          message?.receiver,
          message?.type,
          aiMessage,
          message?.userId,
          message?.orderId,
          tokens,
          account?._id
        );
      }
    }
  } catch (error) {
    console.error(" sendMessageToBuyer ~ error:", error, error?.response?.data);
  }
};
function extractAmazonOrderId(text) {
  const regex = /Order(?: ID|):?\s*(\d{3}-\d{7}-\d{7})/i;
  const match = text.match(regex);
  return match ? match[1] : null;
}

module.exports = {
  createMessage,
  getMessageAction,
  createMessageForBuyer,
  getGmailMessages,
  sendMessageToBuyer,
  sendEmail,
};
