const { regionGetUrl } = require("../utils/constant");
const { default: axios } = require("axios");
const accountModel = require("../model/account.model");
const { getUserInfo } = require("./user.controller");
const userModel = require("../model/user.model");

const connectAccount = async (req, res) => {
  try {
    const userId = req?.user?._id;
    const { country, sellerId, code } = req.body;

    const tokenResponse = await axios.post(
      process.env.AUTH_LINK,
      {
        grant_type: "authorization_code",
        code,
        client_id: process.env.SELLER_CLIENT_ID,
        client_secret: process.env.SELLER_CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URL,
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const data = tokenResponse.data;

    if (data.error) {
      return res.status(403).json({
        error: data.error,
        message: "Something went wrong, please try again!",
        isSuccess: false,
      });
    }

    const matchedRegion = regionGetUrl.find(
      (region) => region.marketplace === country
    );

    if (!matchedRegion) {
      return res.status(400).json({
        message: "SP Report Marketplace not found",
        isSuccess: false,
      });
    }

    const url = matchedRegion.URL;

    const newData = await accountModel.findOneAndUpdate(
      { sellerId, userId },
      {
        $set: {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          tokenExpire: data.expires_in,
          userId,
          role: 2,
          baseURL: url,
          country,
          sellerId,
          marketplaceId: matchedRegion.marketplaceId,
        },
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      message: "Thank you for connecting account.",
      data: newData,
      isSuccess: true,
    });
  } catch (error) {
    return res.status(error?.status || 500).send({
      error: error?.response?.data?.error_description || error.message,
      message: "Something went wrong, please try again!",
      isSuccess: false,
    });
  }
};

const removeConnectedAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await accountModel.findByIdAndDelete(id);
    return res.status(200).json({
      message: "Account removed successfully.",
      data,
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

const getConnectedAccount = async (req, res) => {
  try {
    const userId = req?.user?._id;

    const data = await accountModel
      .find({ userId })
      .select("-updatedAt -__v -createdAt");
    return res.status(200).json({
      message: "Acoounts get successfully.",
      data,
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

const connectGoogleAccount = async (req, res) => {
  try {
    const { code, accountId } = req?.body;
    const { data: decodedToken, tokens } = await getUserInfo(
      code,
      `${process.env.GOOGLE_REDIRECT_URL}setting`
    );

    const account = await accountModel.findById(accountId);

    if (!account) {
      return res
        .status(404)
        .send({ message: "Account not found", isSuccess: false });
    }
    account.uid = decodedToken?.id;
    account.tokens = tokens;
    account.sellerEmail = decodedToken?.email;

    await account.save();

    return res.status(200).json({
      message: "Account connected successfully.",
      data: account,
      isSuccess: true,
    });
  } catch (error) {
    return res.status(error?.status || 500).json({
      error: error?.message,
      message: "Something went wrong, please try again!",
      isSuccess: false,
    });
  }
};

const removeGoogleAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await accountModel.findByIdAndUpdate(id, {
      uid: null,
      tokens: null,
      sellerEmail: "",
    });
    return res.status(200).json({
      message: "Account removed successfully.",
      data,
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

const handleAutomation = async (req, res) => {
  try {
    const updateAutomation = await userModel
      .findByIdAndUpdate(
        req?.user?._id,
        {
          $set: {
            customerSupportAutomation: req?.body?.isAutomationOn,
          },
        },
        { new: true, upsert: true }
      )
      .select("_id customerSupportAutomation email fullName role");

    return res.status(200).json({
      message: "Automation updated successfully.",
      data: updateAutomation,
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

module.exports = {
  connectAccount,
  getConnectedAccount,
  removeConnectedAccount,
  connectGoogleAccount,
  removeGoogleAccount,
  handleAutomation,
};
