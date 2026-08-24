const { default: axios } = require("axios");
const accountModel = require("../model/account.model");
const userModel = require("../model/user.model");


const updateTokens = async () => {
  try {
    
    const checkConfigAds = await accountModel.find();

    await Promise.all(
      checkConfigAds.map(async (user) => {
        try {
           
          const response = await axios.post(
            process.env.AUTH_LINK,
           {
              grant_type: "refresh_token",
              client_id: process.env.SELLER_CLIENT_ID,
              refresh_token: user.refreshToken,
              client_secret: process.env.SELLER_CLIENT_SECRET,
            },
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            }
          );
          const data = response.data;

          await accountModel.findByIdAndUpdate(
            user._id,
            {
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
            },
            { new: true }
          );
        } catch (error) {
          console.error(" checkConfigAds.map ~ error:", error)
          
        }
      })
    );
  } catch (error) {
   console.error(" updateAdsTokens ~ error:", error)
   
  }
};
const updateGoogleTokens = async () => {
  try {
    const users = await userModel.find();

    await Promise.all(
      users.map(async (user) => {
        try {
           
          const response = await axios.post(
            process.env.AUTH_LINK,
           {
              grant_type: "refresh_token",
              client_id: process.env.SELLER_CLIENT_ID,
              refresh_token: user.refreshToken,
              client_secret: process.env.SELLER_CLIENT_SECRET,
            },
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            }
          );
           

          const data = response.data;

          await accountModel.findByIdAndUpdate(
            user._id,
            {
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
            },
            { new: true }
          );

        
        } catch (error) {
          console.error(" checkConfigAds.map ~ error:", error)
          
        }
      })
    );
  } catch (error) {
   console.error(" updateAdsTokens ~ error:", error)
   
  }
};

module.exports = { updateTokens };