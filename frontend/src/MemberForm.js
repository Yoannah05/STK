import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import "./styles.css";

function MemberForm() {
  const [persons, setPersons] = useState([]);
  const [personId, setPersonId] = useState("");
  const [affiliationDate, setAffiliationDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPersons = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:5000/api/persons");
        const data = await response.json();
        setPersons(data);
      } catch (error) {
        setError("Error fetching persons.");
      } finally {
        setLoading(false);
      }
    };

    fetchPersons();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_id: personId,
          affiliation_date: affiliationDate
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("Member added successfully!");
        setPersonId("");
        setAffiliationDate("");
      } else {
        setError(data.error || "Error adding member");
      }
    } catch (error) {
      setError("Error adding member.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-container">
      <div className="form-container">
        <h1 className="form-title">Add New Member</h1>
        
        {message && <p className="text-success">{message}</p>}
        {error && <p className="text-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Person</label>
            <select
              className="form-control"
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">Select a Person</option>
              {persons.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.first_name} {person.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Affiliation Date</label>
            <input
              type="date"
              className="form-control"
              value={affiliationDate}
              onChange={(e) => setAffiliationDate(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? "Processing..." : "Add Member"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default MemberForm;