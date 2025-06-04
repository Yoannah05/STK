import { useState, useEffect } from "react";
import "./styles.css";

function PersonForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [idSP, setIdSP] = useState("");
  const [spList, setSpList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSPs = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:5000/api/sp");
        const data = await response.json();
        setSpList(data);
      } catch (error) {
        setError("Error fetching SPs.");
      } finally {
        setLoading(false);
      }
    };

    fetchSPs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/person", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          birth_date: birthDate,
          id_sp: idSP
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`Person ${data.person?.first_name} added successfully!`);
        setFirstName("");
        setLastName("");
        setBirthDate("");
        setIdSP("");
      } else {
        setError(data.error || "Error adding person");
      }
    } catch (error) {
      setError("Error adding person.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-container">
      <div className="form-container">
        <h1 className="form-title">Add New Person</h1>
        
        {message && <p className="text-success">{message}</p>}
        {error && <p className="text-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Birth Date</label>
            <input
              type="date"
              className="form-control"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Select SP</label>
            <select
              className="form-control"
              value={idSP}
              onChange={(e) => setIdSP(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">--Select SP--</option>
              {spList.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.description} ({sp.region})
                </option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? "Processing..." : "Add Person"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PersonForm;