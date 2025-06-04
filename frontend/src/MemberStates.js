import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./styles.css";

const MemberStates = () => {
  const [memberStates, setMemberStates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const fetchMemberStates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];
      
      const response = await fetch(
        `http://localhost:5000/api/member-states?startDate=${start}&endDate=${end}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch member states');
      }
      
      const data = await response.json();
      
      const processedData = data.map(member => ({
        ...member,
        total_amount_due: Number(member.total_amount_due),
        total_paid: Number(member.total_paid),
        remaining_balance: Number(member.remaining_balance)
      }));
      
      setMemberStates(processedData);
    } catch (err) {
      console.error("Error fetching member states:", err);
      setError('There was an issue fetching the member data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberStates();
  }, [startDate, endDate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchMemberStates();
  };

  return (
    <div className="content-container">
      <h1 className="form-title">Member States</h1>
      
      <div className="date-filter-container">
        <div className="date-filter-group">
          <label>Start Date:</label>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            className="form-control"
          />
        </div>
        
        <div className="date-filter-group">
          <label>End Date:</label>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate} // Ensures end date cannot be before start date
            className="form-control"
          />
        </div>
        
        <button 
          onClick={handleSubmit} 
          disabled={loading}
          className="submit-btn"
        >
          {loading ? "Loading..." : "Refresh Data"}
        </button>
      </div>

      {error && <p className="text-error">{error}</p>}

      <div className="data-table-container">
        {loading && <p className="loading-text">Loading data...</p>}
        
        {!loading && memberStates.length === 0 ? (
          <p className="empty-state">No member data available for the selected period</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Member ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Activities</th>
                <th>Total Due</th>
                <th>Total Paid</th>
                <th>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {memberStates.map((member) => (
                <tr key={member.member_id}>
                  <td>{member.member_id}</td>
                  <td>{member.first_name}</td>
                  <td>{member.last_name}</td>
                  <td>{member.activity_count}</td>
                  <td className="currency-cell">${member.total_amount_due?.toFixed(2)}</td>
                  <td className="currency-cell">${member.total_paid?.toFixed(2)}</td>
                  <td className="currency-cell">${member.remaining_balance?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MemberStates;
