import React, { useState, useEffect } from "react";
import "./styles.css";

function ActivityPresenceForm() {
  const [members, setMembers] = useState([]);
  const [persons, setPersons] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [selectedPerson, setSelectedPerson] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersData, personsData, activitiesData] = await Promise.all([
        fetch("http://localhost:5000/api/members").then((res) => res.json()),
        fetch("http://localhost:5000/api/persons").then((res) => res.json()),
        fetch("http://localhost:5000/api/activities").then((res) => res.json()),
      ]);

      setMembers(membersData);
      setPersons(personsData);
      setActivities(activitiesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPersons = persons.filter((person) =>
    !members.some((member) => member.id === person.id)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/activity-presence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_member: selectedMember,
          id_person: selectedPerson || null,
          id_activity: selectedActivity
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("Activity Presence added successfully!");
        setSelectedMember("");
        setSelectedPerson("");
        setSelectedActivity("");
      } else {
        setError(data.error || "Error adding Activity Presence.");
      }
    } catch (error) {
      setError("Error adding Activity Presence.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-container">
      <div className="form-container">
        <h1 className="form-title">Add Activity Presence</h1>
        
        {message && <p className="text-success">{message}</p>}
        {error && <p className="text-error">{error}</p>}

        {loading && members.length === 0 ? (
          <p className="loading-text">Loading form data...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Member</label>
              <select
                className="form-control"
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                required
                disabled={loading}
              >
                <option value="">Select a member</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.first_name} {member.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Person (Optional)</label>
              <select
                className="form-control"
                value={selectedPerson}
                onChange={(e) => setSelectedPerson(e.target.value)}
                disabled={loading}
              >
                <option value="">Select a person</option>
                {filteredPersons.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.first_name} {person.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Activity</label>
              <select
                className="form-control"
                value={selectedActivity}
                onChange={(e) => setSelectedActivity(e.target.value)}
                required
                disabled={loading}
              >
                <option value="">Select an activity</option>
                {activities.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.description} ({activity.date})
                  </option>
                ))}
              </select>
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? "Processing..." : "Submit"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ActivityPresenceForm;