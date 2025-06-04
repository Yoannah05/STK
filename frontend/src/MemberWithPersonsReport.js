import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./styles.css";

const MemberWithPersonsReport = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];
      
      const response = await fetch(
        `http://localhost:5000/api/member-persons-report?startDate=${start}&endDate=${end}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch member with persons report');
      }
      
      const data = await response.json();
      
      const processedData = data.map(item => ({
        ...item,
        total_amount_due: Number(item.total_amount_due),
        total_paid: Number(item.total_paid),
        remaining_balance: Number(item.remaining_balance)
      }));
      
      setReportData(processedData);
    } catch (err) {
      console.error("Error fetching report:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchReportData();
  };

  return (
    <div className="content-container">
      <h1 className="form-title">Member With Persons Report</h1>
      
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
            minDate={startDate}
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
        
        {!loading && reportData.length === 0 ? (
          <p className="empty-state">No report data available for the selected period</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Member ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Member Activities</th>
                <th>Persons Brought</th>
                <th>Total Due</th>
                <th>Total Paid</th>
                <th>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item) => (
                <tr key={item.member_id}>
                  <td>{item.member_id}</td>
                  <td>{item.first_name}</td>
                  <td>{item.last_name}</td>
                  <td>{item.member_activities}</td>
                  <td>{item.persons_brought}</td>
                  <td className="currency-cell">${item.total_amount_due?.toFixed(2)}</td>
                  <td className="currency-cell">${item.total_paid?.toFixed(2)}</td>
                  <td className="currency-cell">${item.remaining_balance?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MemberWithPersonsReport;