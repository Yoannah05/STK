const pool = require("../db");
const { QueryHelpers } = require("../utils/queryHelpers");
const { PriceCalculator } = require("../utils/priceCalculator");

const getActivityStates = async (req, res) => {
  try {
    const basicResult = await QueryHelpers.getActivitiesWithBasicCounts();
    const processedResults = [];
    
    for (const activity of basicResult.rows) {
      const presences = await QueryHelpers.getActivityPresences(activity.activity_id);
      
      const totalExpectedPrice = await PriceCalculator.calculateTotalExpectedPrice(
        presences, 
        parseFloat(activity.price)
      );
      
      const remainingBalance = totalExpectedPrice - parseFloat(activity.total_paid);
      
      const result = {
        activity_id: activity.activity_id,
        description: activity.description,
        date: activity.date,
        member_count: parseInt(activity.member_count),
        non_member_count: parseInt(activity.non_member_count),
        total_price: totalExpectedPrice,
        total_paid: parseFloat(activity.total_paid),
        remaining_balance: remainingBalance
      };
      
      processedResults.push(PriceCalculator.formatFinancialResult(result));
    }
    
    res.json(processedResults);
  } catch (error) {
    console.error("Error fetching activity states:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getActivityStates };
