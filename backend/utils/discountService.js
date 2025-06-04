const pool = require("../db");

class DiscountService {
  static async getDiscountConstants() {
    try {
      const { rows } = await pool.query('SELECT remise, nbpersonne FROM Constant LIMIT 1');
      return rows[0] || { remise: 0, nbpersonne: 0 };
    } catch (error) {
      console.error("Error fetching constants:", error);
      return { remise: 0, nbpersonne: 0 };
    }
  }

  static async countPeopleBroughtByMember(memberId, activityId) {
    try {
      const { rows } = await pool.query(
        `SELECT COUNT(*) as count 
         FROM ActivityPresence ap
         WHERE ap.id_member = $1 AND ap.id_activity = $2 AND ap.id_person IS NOT NULL`,
        [memberId, activityId]
      );
      return parseInt(rows[0].count) || 0;
    } catch (error) {
      console.error("Error counting people brought by member:", error);
      return 0;
    }
  }

  static async isPersonMember(personId) {
    try {
      const { rows } = await pool.query(
        'SELECT id FROM Members WHERE id_person = $1',
        [personId]
      );
      return rows.length > 0;
    } catch (error) {
      console.error("Error checking if person is member:", error);
      return false;
    }
  }

  static async calculateDiscountedPrice(originalPrice, memberId, activityId, personId) {
    const isMember = await this.isPersonMember(personId);
    
    if (!isMember) {
      return {
        originalPrice,
        discountedPrice: originalPrice,
        discount: 0,
        peopleBrought: 0,
        minimumRequired: 0,
        hasDiscount: false,
        isMember: false
      };
    }

    const constants = await this.getDiscountConstants();
    const peopleBrought = await this.countPeopleBroughtByMember(memberId, activityId);
    
    const hasDiscount = peopleBrought >= constants.nbpersonne && constants.remise > 0;
    const discountAmount = hasDiscount ? originalPrice * constants.remise : 0;
    
    return {
      originalPrice,
      discountedPrice: originalPrice - discountAmount,
      discount: constants.remise,
      peopleBrought,
      minimumRequired: constants.nbpersonne,
      hasDiscount,
      isMember: true
    };
  }

  static async calculateActualPrice(originalPrice, memberId, activityId, personId) {
    const priceInfo = await this.calculateDiscountedPrice(originalPrice, memberId, activityId, personId);
    return priceInfo.discountedPrice;
  }
}

module.exports = { DiscountService };