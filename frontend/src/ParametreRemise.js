import { useState, useEffect } from "react";

function ParametreRemise() {
  const [formData, setFormData] = useState({
    remise: "",     // affiché en % (ex: 20)
    nbpersonne: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/parametre-remise")
      .then((res) => {
        if (!res.ok) throw new Error("Erreur lors du chargement des paramètres");
        return res.json();
      })
      .then((data) => {
        setFormData({
          remise: data.remise !== null && data.remise !== undefined ? (data.remise * 100).toFixed(2) : "",
          nbpersonne: data.nbpersonne ?? "",
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    // Convertir remise en décimal avant envoi (ex: 20 => 0.2)
    const remiseDecimal = parseFloat(formData.remise) / 100;

    try {
      const response = await fetch("http://localhost:5000/api/parametre-remise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remise: remiseDecimal,
          nbpersonne: parseInt(formData.nbpersonne, 10),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
      } else {
        setError(data.error || "Erreur lors de la mise à jour");
      }
    } catch {
      setError("Erreur de connexion au serveur.");
    }
  };

  if (loading) return <div>Chargement des paramètres...</div>;

  return (
    <div className="content-container">
      <div className="form-container">
        <h1 className="form-title">Modifier Remise</h1>

        {message && <p className="text-success">{message}</p>}
        {error && <p className="text-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre de personne</label>
            <input
              type="number"
              name="nbpersonne"
              className="form-control"
              value={formData.nbpersonne}
              min="1"
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Remise en pourcentage :</label>
            <input
              type="number"
              name="remise"
              className="form-control"
              value={formData.remise}
              onChange={handleChange}
              step="0.01"
              min="0"
              max="100"
              required
            />
          </div>

          <button type="submit" className="submit-btn">
            Modifier
          </button>
        </form>
      </div>
    </div>
  );
}

export default ParametreRemise;
