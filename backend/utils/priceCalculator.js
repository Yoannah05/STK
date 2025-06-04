// utils/priceCalculator.js
const { DiscountService } = require('./discountService');

class PriceCalculator {
  static async calculateTotalExpectedPrice(presences, originalPrice) {
    let total = 0;
    
    for (const presence of presences) {
      const actualPrice = await DiscountService.calculateActualPrice(
        originalPrice,
        presence.id_member,
        presence.id_activity,
        presence.person_id
      );
      total += actualPrice;
    }
    
    return total;
  }

  static formatFinancialResult(result) {
    return {
      ...result,
      total_price: Number(result.total_price?.toFixed(2) || 0),
      total_paid: Number(result.total_paid || 0),
      remaining_balance: Number(result.remaining_balance?.toFixed(2) || 0)
    };
  }
}
module.exports = { PriceCalculator };