import React, { useEffect, useState } from "react";
import "./styles.css";

const ActivityStates = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:5000/api/activity-states");
        
        if (!response.ok) {
          throw new Error('Failed to fetch activity states');
        }
        
        const data = await response.json();
        const processedData = data.map(activity => ({
          ...activity,
          total_price: Number(activity.total_price),
          total_paid: Number(activity.total_paid),
          remaining_balance: Number(activity.remaining_balance)
        }));
        setActivities(processedData);
      } catch (error) {
        console.error("Error fetching activity states:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  return (
    <div className="content-container">
      <h1 className="form-title">Activity States</h1>
      
      {error && <p className="text-error">{error}</p>}

      <div className="data-table-container">
        {loading ? (
          <p className="loading-text">Loading activity data...</p>
        ) : activities.length === 0 ? (
          <p className="empty-state">No activity data available</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Date</th>
                <th>Members</th>
                <th>Non-Members</th>
                <th>Total Price</th>
                <th>Remaining</th>
                <th>Total Paid</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.activity_id}>
                  <td>{activity.activity_id}</td>
                  <td>{activity.description}</td>
                  <td>{activity.date}</td>
                  <td>{activity.member_count}</td>
                  <td>{activity.non_member_count}</td>
                  <td className="currency-cell">${activity.total_price.toFixed(2)}</td>
                  <td className="currency-cell">${activity.total_paid.toFixed(2)}</td>
                  <td className="currency-cell">${activity.remaining_balance.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ActivityStates;