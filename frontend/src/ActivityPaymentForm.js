import React, { useState, useEffect } from "react";
import "./styles.css";
import "./payment.css";

function ActivityPaymentForm() {
  const [presences, setPresences] = useState([]);
  const [selectedPresence, setSelectedPresence] = useState("");
  const [amount, setAmount] = useState("");
  const [balanceInfo, setBalanceInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchPresences = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:5000/api/presences");
        const data = await response.json();
        setPresences(data);
      } catch (error) {
        setError("Failed to load presence records.");
      } finally {
        setLoading(false);
      }
    };

    fetchPresences();
  }, []);

  useEffect(() => {
    if (selectedPresence) {
      setLoading(true);
      fetch(`http://localhost:5000/api/presence-balance?presence=${selectedPresence}`)
        .then((res) => res.json())
        .then((data) => {
          setBalanceInfo(data);
        })
        .catch((err) => {
          console.error("Error fetching balance:", err);
          setBalanceInfo(null);
        })
        .finally(() => setLoading(false));
    } else {
      setBalanceInfo(null);
    }
  }, [selectedPresence]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setError("Amount must be a valid number greater than 0.");
      setLoading(false);
      return;
    }

    if (balanceInfo && paymentAmount > balanceInfo.remaining_balance) {
      setError(`You cannot pay more than the remaining balance ($${balanceInfo.remaining_balance.toFixed(2)}).`);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/activity-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_presenceactivity: selectedPresence,
          amount: paymentAmount,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        let successMessage = "Payment successful!";
        if (data.discount_applied) {
          successMessage += ` (Discount applied: ${(data.discount_info.discount_percentage * 100).toFixed(0)}%)`;
        }
        setMessage(successMessage);
        setAmount("");
        setSelectedPresence("");
        setBalanceInfo(null);
        const refreshResponse = await fetch("http://localhost:5000/api/presences");
        const refreshData = await refreshResponse.json();
        setPresences(refreshData);
      } else {
        setError(data.error || "Error processing payment.");
      }
    } catch (error) {
      setError("Error processing payment.");
    } finally {
      setLoading(false);
    }
  };

  const renderDiscountInfo = () => {
    if (!balanceInfo?.discount_info) return null;

    const { discount_info } = balanceInfo;
    
    if (!discount_info.is_member) {
      return (
        <div className="discount-info discount-not-applicable">
          <h4>Discount Information</h4>
          <p className="discount-info-text">
            🚫 Discounts are only available for members
          </p>
        </div>
      );
    }
    
    return (
      <div className={`discount-info ${discount_info.has_discount ? 'discount-active' : 'discount-inactive'}`}>
        <h4>Member Discount Information</h4>
        <p>People brought: <strong>{discount_info.people_brought}</strong></p>
        <p>Minimum required: <strong>{discount_info.minimum_required}</strong></p>
        
        {discount_info.has_discount ? (
          <>
            <p className="discount-success">
              ✅ Discount Applied: <strong>{(discount_info.discount_percentage * 100).toFixed(0)}%</strong>
            </p>
            <p>Discount amount: <strong>-${discount_info.discount_amount.toFixed(2)}</strong></p>
          </>
        ) : (
          <p className="discount-info-text">
            {discount_info.people_brought > 0 
              ? `Need ${discount_info.minimum_required - discount_info.people_brought} more people for discount`
              : "Bring people to get discount"
            }
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="content-container">
      <div className="form-container">
        <h1 className="form-title">Activity Payment</h1>
        {message && <p className="text-success">{message}</p>}
        {error && <p className="text-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Presence Record</label>
            <select
              className="form-control"
              value={selectedPresence}
              onChange={(e) => setSelectedPresence(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">Select a presence record</option>
              {presences.map((presence) => (
                <option key={presence.presence_id} value={presence.presence_id}>
                  {presence.first_name} {presence.last_name} - {presence.activity_description} ({new Date(presence.activity_date).toLocaleDateString()})
                  {presence.is_member ? " [Member]" : " [Non-member]"}
                </option>
              ))}
            </select>
          </div>

          {balanceInfo && (
            <div className="balance-info">
              {balanceInfo.discount_info?.has_discount && (
                <p>Original Price: <span className="strikethrough">${balanceInfo.original_price.toFixed(2)}</span></p>
              )}
              <p>Activity Price: <strong>${balanceInfo.total_price.toFixed(2)}</strong></p>
              <p>Total Paid: <strong>${balanceInfo.total_paid.toFixed(2)}</strong></p>
              <p>Remaining Balance: <strong>${balanceInfo.remaining_balance.toFixed(2)}</strong></p>
            </div>
          )}

          {renderDiscountInfo()}

          <div className="form-group">
            <label>Payment Amount</label>
            <input
              type="number"
              className="form-control"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.01"
              step="0.01"
              max={balanceInfo ? balanceInfo.remaining_balance : undefined}
              required
              disabled={loading || !selectedPresence}
            />
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading || !selectedPresence}
          >
            {loading ? "Processing..." : "Submit Payment"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ActivityPaymentForm;