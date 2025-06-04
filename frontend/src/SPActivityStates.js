import React, { useEffect, useState } from "react";

const SPActivityStates = () => {
  const [spActivities, setSPActivities] = useState([]);
  const [region, setRegion] = useState("");
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch regions on mount
  useEffect(() => {
    fetch("http://localhost:5000/api/sp")
      .then(response => response.json())
      .then(data => {
        // Extract unique regions
        const uniqueRegions = [...new Set(data.map(sp => sp.region))].sort();
        setRegions(uniqueRegions);
      })
      .catch(error => {
        console.error("Error fetching SPs:", error);
      });
  }, []);

  // Fetch activity data
  useEffect(() => {
    const url = region
      ? `http://localhost:5000/api/sp-activity-states?region=${encodeURIComponent(region)}`
      : "http://localhost:5000/api/sp-activity-states";

    setLoading(true);
    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then(data => {
        setSPActivities(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching SP activity states:", error);
        setError(error.message);
        setLoading(false);
      });
  }, [region]);

  return (
    <div className="content-container">
      <h2>SP Activity States</h2>

      <div className="filter-container">
        <label htmlFor="region-select">Filter by Region: </label>
        <select
          id="region-select"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        >
          <option value="">All Regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {loading && <div className="loading-text">Loading SP activity states...</div>}
      {error && <div className="text-error">Error: {error}</div>}

      {!loading && !error && (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>SP ID</th>
                <th>SP Region</th>
                <th>SP Desc</th>
                <th>Activity ID</th>
                <th>Activity Description</th>
                <th>Date</th>
                <th>Persons Present</th>
                <th>Total Price</th>
                <th>Total Paid</th>
                <th>Remaining Balance</th>
              </tr>
            </thead>
            <tbody>
              {spActivities.map((activity) => (
                <tr key={`${activity.sp_id}-${activity.activity_id}`}>
                  <td>{activity.sp_id}</td>
                  <td>{activity.sp_region}</td>
                  <td>{activity.sp_desc}</td>
                  <td>{activity.activity_id}</td>
                  <td>{activity.activity_description}</td>
                  <td>{activity.activity_date}</td>
                  <td>{activity.person_count}</td>
                  <td className="currency-cell">${activity.total_price?.toFixed(2)}</td>
                  <td className="currency-cell">${activity.total_paid?.toFixed(2)}</td>
                  <td className="currency-cell">${activity.remaining_balance?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {spActivities.length === 0 && <div className="empty-state">No activity data available</div>}
        </div>
      )}
    </div>
  );
};

export default SPActivityStates;
