import { useState } from "react";

function ActivityForm() {
  const [formData, setFormData] = useState({
    date: "",
    description: "",
    priority: 1,
    region: "",
    price: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setFormData({ date: "", description: "", priority: 1, region: "", price: "" });
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError("Error connecting to the server.");
    }
  };

  return (
    <div className="content-container">
      <div className="form-container">
        <h1 className="form-title">Insert New Activity</h1>
        {message && <p className="text-success">{message}</p>}
        {error && <p className="text-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Date:</label>
            <input 
              type="date" 
              name="date" 
              className="form-control"
              value={formData.date} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Description:</label>
            <input 
              type="text" 
              name="description" 
              className="form-control"
              value={formData.description} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Priority (1-10):</label>
            <input 
              type="number" 
              name="priority" 
              className="form-control"
              value={formData.priority} 
              min="1" 
              max="10" 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Region:</label>
            <input 
              type="text" 
              name="region" 
              className="form-control"
              value={formData.region} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Price:</label>
            <input 
              type="number" 
              name="price" 
              className="form-control"
              value={formData.price} 
              onChange={handleChange} 
              required 
            />
          </div>

          <button type="submit" className="submit-btn">Add Activity</button>
        </form>
      </div>
    </div>
  );
}

export default ActivityForm;