const axios = require('axios');
const accountModel = require('../model/account.model');

const scheduleReviewModel = require('../model/scheduleReview.model');

const getSolicitationAction = async () => {
  try {
    const checkConfigAds = await accountModel.find();
    await Promise.all(
      checkConfigAds.map(async (user) => {
        const today = moment();

        const startOfDay = today.startOf('day').toISOString();  
        const endOfDay = today.endOf('day').toISOString();

        const scheduleReviews = await scheduleReviewModel.find({
          scheduleDate: {
            $gte: startOfDay,
            $lte: endOfDay
          },
          reviewStatus: "Pending",
          userId: user?.userId  
        }).select("orderId");
        
        for (const scheduleReview of scheduleReviews) {
          const url = `${process.env.SP_API_URL}solicitations/v1/orders/${scheduleReview.orderId}`;
          const response = await axios.get(url, {
            headers: {
              'x-amz-access-token': user?.accessToken,
            },
            params: {
              marketplaceIds: user?.marketplaceId,
            },
          });

          const solicitationAction = response?.data?._links?.actions?.find(action => action?.name === 'productReviewAndSellerFeedback');

          if (!solicitationAction) {
            continue;
          }
          const reviewurl = `${process.env.SP_API_URL}${solicitationAction?.href}`;
          const reviewResponse = await axios.post(reviewurl, {}, {
            headers: {
              'x-amz-access-token': user?.accessToken,
            },

          });

          if (reviewResponse?.data?.errors) {
           
            scheduleReview.reviewStatus = "Failed";
            scheduleReview.reviewCancelReason = reviewResponse?.data?.errors[0]?.message;
            await scheduleReview.save();

          } else {
            scheduleReview.reviewStatus = "Success";
            await scheduleReview.save();
          }
        
          sleep(1000);


        }
      })
    );
   
  } catch (error) {
    console.error("Error during getOrders:", error.response.data);
  }
};


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { getProducts };