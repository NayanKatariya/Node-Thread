const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { google } = require("googleapis");
const userModel = require("../model/user.model");
const { findOneRecord } = require("../service/common/findOne");

const adminRegister = async (req, res) => {
  const { fullName, email, password, phoneNumber } = req.body;
  try {
    const findEmail = await findOneRecord(userModel, { email });
    if (findEmail) {
      return res
        .status(400)
        .send({ message: "Email is already existing!", isSuccess: false });
    } else {
      const Password = await bcrypt.hash(password, 10);
      const newCustomer = await userModel({
        fullName,
        email,
        password: Password,
        phoneNumber,
        role: 2,
      });
      newCustomer.save();
      return res.status(200).send({
        message: "Registration successfully.",
        isSuccess: true,
        newCustomer,
      });
    }
  } catch (error) {
    return res.status(400).send({
      error: error.message,
      message: "Something went wrong, please try again!",
      isSuccess: false,
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await findOneRecord(userModel, { email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Email not found!", isSuccess: false });
    }
    if (user?.uid && user?.source === "google" && !user?.password) {
      return res
        .status(400)
        .json({ message: "Please login with google!", isSuccess: false });
    }
    const isMatch = await bcrypt.compare(password, user?.password || "");
    if (isMatch) {
      const authToken = jwt.sign(
        {
          _id: user._id,
          email,
        },
        process.env.JWT_SECRET
      );
      return res.status(200).json({
        message: "Login successfully.",
        authToken,
        user: {
          _id: user?._id,
          email: user?.email,
          role: user?.role,
          fullName: user?.fullName,
        },
        isSuccess: true,
      });
    } else {
      return res
        .status(400)
        .json({ message: "Invalid password!", isSuccess: false });
    }
  } catch (error) {
    return res.status(400).json({
      error: error.message,
      message: "Something went wrong, please try again!",
      isSuccess: false,
    });
  }
};

const getOAuth2Client = (redirect_uri) => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri
  );
};

async function getUserInfo(code, redirect_uri) {
  const OAuth2Client = getOAuth2Client(redirect_uri);
  const { tokens } = await OAuth2Client.getToken(code);

  if (!tokens) {
    return { isSuccess: false, message: "Tokens not received!" };
  }

  OAuth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ auth: OAuth2Client, version: "v2" });
  const { data } = await oauth2.userinfo.get();

  return { data, tokens };
}

const googleSignUp = async (req, res) => {
  try {
    const { code } = req?.body;
    const { data: decodedToken, tokens } = await getUserInfo(
      code,
      `${process.env.GOOGLE_REDIRECT_URL}signup`
    );

    const uid = decodedToken?.id;

    const userExists = await findOneRecord(userModel, {
      email: decodedToken?.email,
    });
    if (userExists) {
      return res
        .status(404)
        .send({ message: "User Already Exists", isSuccess: false });
    }

    const user = await userModel({
      fullName: `${decodedToken?.name.split(" ")[0]} ${
        decodedToken?.name.split(" ")[1]
      }`,
      email: decodedToken?.email,
      role: 2,
      uid: uid,
      source: "google",
      tokens,
    });

    await user.save();
    if (user) {
      const authToken = jwt.sign(
        { _id: user?._id, email: user?.email, role: user?.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).send({
        message: "User SignUp successfully",
        isFirstLogin: true,
        authToken: authToken,
        user: {
          _id: user?._id,
          email: user?.email,
          role: user?.role,
          fullName: user?.fullName,
        },
        isSuccess: true,
      });
    }
  } catch (error) {
    return res.status(401).send({
      message: "Something went wrong",
      error: error.message,
      isSuccess: false,
    });
  }
};

const googleSignIn = async (req, res) => {
  try {
    const { code } = req?.body;
    const { data: decodedToken, tokens } = await getUserInfo(
      code,
      `${process.env.GOOGLE_REDIRECT_URL}signin`
    );

    const user = await findOneRecord(userModel, { email: decodedToken?.email });
    if (!user) {
      return res
        .status(404)
        .send({ message: "User not found", isSuccess: false });
    }

    user.tokens = tokens;
    user.source = "google";
    user.uid = decodedToken?.id;
    await user.save();
    const authToken = jwt.sign(
      {
        _id: user?._id,
        email: user?.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).send({
      message: "Token verified successfully",
      user: {
        _id: user?._id,
        email: user?.email,
        role: user?.role,
        fullName: user?.fullName,
      },
      authToken: authToken,
      isSuccess: true,
    });
  } catch (error) {
    return res.status(401).send({
      message: "Something went wrong",
      error: error.message,
      isSuccess: false,
    });
  }
};

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

const sendVerificationCode = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (user && user?.isVerified) {
      return res.status(404).json({ message: "User is already register" });
    }

    const code = generateVerificationCode();
    const expiry = Date.now() + 5 * 60 * 1000;
    const hashPassword = await bcrypt.hash(password, 10);
    let newUser = user;
    if (!user) {
      newUser = new userModel({ email, password: hashPassword });
    }
    newUser.verificationCode = code;
    newUser.verificationExpireIn = expiry;
    await newUser.save();


    return res.status(200).json({
      message: "Verification code sent successfully",
      isSuccess: true,
    });
  } catch (err) {
    console.error("Error sending verification code:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user?.isVerified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    const code = generateVerificationCode();
    const expiry = Date.now() + 5 * 60 * 1000;

    user.verificationCode = code;
    user.verificationExpireIn = expiry;
    await user.save();

    // Simulate sending

    return res.status(200).json({
      message: "Verification code resent successfully",
      isSuccess: true,
    });
  } catch (err) {
    console.error("Error resending verification code:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const verifyCode = async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        isSuccess: false,
      });
    }

    if (
      !user.verificationCode ||
      !user.verificationExpireIn ||
      parseInt(code) !== user.verificationCode
    ) {
      return res.status(400).json({
        message: "Invalid or incorrect verification code",
        isSuccess: false,
      });
    }

    if (Date.now() > user.verificationExpireIn) {
      return res.status(400).json({
        message: "Verification code has expired",
        isSuccess: false,
      });
    }

    const authToken = jwt.sign(
      {
        _id: user._id,
        email,
      },
      process.env.JWT_SECRET
    );
    // Optionally: Clear the verificationCode fields after successful verification
    user.verificationCode = null;
    user.verificationExpireIn = null;
    user.isVerified = true;
    await user.save();

    return res.status(200).json({
      message: "Verification successful",
      isSuccess: true,
      user: {
        _id: user?._id,
        email: user?.email,
        role: user?.role,
        fullName: user?.fullName,
      },
      authToken: authToken,
    });
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({
      message: "Server error",
      isSuccess: false,
    });
  }
};

module.exports = {
  adminRegister,
  login,
  googleSignUp,
  googleSignIn,
  getUserInfo,
  sendVerificationCode,
  verifyCode,
  resendVerificationCode,
};
