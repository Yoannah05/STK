import React, { useEffect, useState } from "react";

const ActivitySituation = () => {
  const [situationData, setSituationData] = useState(null);
  const [region, setRegion] = useState("");
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch available regions on mount
  useEffect(() => {
  fetch("http://localhost:5000/api/sp")
    .then(response => response.json())
    .then(data => {
      const uniqueRegions = [...new Set(data.map(sp => sp.region))];
      setRegions(uniqueRegions);
    })
    .catch(error => {
      console.error("Erreur lors de la récupération des régions :", error);
    });
}, []);


  // Fetch activity situation data
  useEffect(() => {
    const url = region
      ? `http://localhost:5000/api/activities/situation?region=${encodeURIComponent(region)}`
      : "http://localhost:5000/api/activities/situation";

    setLoading(true);
    setError(null);
    
    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then(data => {
        setSituationData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching activity situation:", error);
        setError(error.message);
        setLoading(false);
      });
  }, [region]);

  // Refresh payment views
  const handleRefreshViews = async () => {
    setRefreshing(true);
    try {
      const response = await fetch("http://localhost:5000/api/payments/refresh", {
        method: "POST"
      });
      if (response.ok) {
        // Reload data after refresh
        window.location.reload();
      } else {
        throw new Error("Failed to refresh views");
      }
    } catch (error) {
      console.error("Error refreshing views:", error);
      alert("Erreur lors du rafraîchissement des vues");
    } finally {
      setRefreshing(false);
    }
  };

 const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
};

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div className="content-container">
      <div className="page-header">
        <h2>Situation Générale des Activités</h2>
        <button 
          onClick={handleRefreshViews}
          disabled={refreshing}
          className="refresh-button"
        >
          {refreshing ? "Rafraîchissement..." : "Rafraîchir les données"}
        </button>
      </div>

      <div className="filter-container">
        <label htmlFor="region-select">Filtrer par région : </label>
        <select
          id="region-select"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        >
          <option value="">Toutes les régions</option>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {loading && <div className="loading-text">Chargement de la situation des activités...</div>}
      {error && <div className="text-error">Erreur: {error}</div>}

      {!loading && !error && situationData && (
        <>
          {/* Overall Statistics Section */}
          <div className="statistics-section">
            <h3>Statistiques Globales - {situationData.region_filter === 'all_regions' ? 'Toutes les régions' : situationData.region_filter}</h3>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{situationData.overall_statistics.total_activities}</div>
                <div className="stat-label">Activités Totales</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">{situationData.overall_statistics.total_participants}</div>
                <div className="stat-label">Participants Totaux</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">{situationData.overall_statistics.total_members}</div>
                <div className="stat-label">Membres</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">{situationData.overall_statistics.total_guests}</div>
                <div className="stat-label">Non-Membre</div>
              </div>
              
              <div className="stat-card revenue">
                <div className="stat-value">{formatCurrency(situationData.overall_statistics.total_revenue)}</div>
                <div className="stat-label">Revenus Totaux</div>
              </div>

            </div>
          </div>

          {/* Activities Detail Section */}
          <div className="activities-section">
            <h3>Détail des Activités par Région</h3>
            
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Activité</th>
                    <th>Date</th>
                    <th>Participants</th>
                    <th>Membres</th>
                    <th>Non-Membre</th>
                    <th>Prix de Base</th>
                    <th>Revenus Totaux</th>
                    <th>Total déja Payer</th>
                    <th>Reste</th>
                    <th>Remises Accordées</th>
                  </tr>
                </thead>
                <tbody>
                  {situationData.activities_detail.map((activity) => (
                    <tr key={activity.id_activity}>
                      <td>{activity.id_activity}</td>
                      <td className="activity-name">{activity.activity_description}</td>
                      <td>{formatDate(activity.activity_date)}</td>
                      <td className="text-center">
                        <span className="participant-badge">{activity.total_participants}</span>
                      </td>
                      <td className="text-center">
                        <span className="member-badge">{activity.total_members}</span>
                      </td>
                      <td className="text-center">
                        <span className="guest-badge">{activity.total_guests}</span>
                      </td>
                      <td className="currency-cell">{formatCurrency(activity.avg_base_price)}</td>
                      <td className="currency-cell revenue">{formatCurrency(activity.total_revenue)}</td>
                      <td className="currency-cell revenue">{formatCurrency(activity.total_paid)}</td>
                      <td className="currency-cell revenue">{formatCurrency(activity.remaining_balance)}</td>
                      <td className="currency-cell discount">{formatCurrency(activity.total_discount_given)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {situationData.activities_detail.length === 0 && (
                <div className="empty-state">
                  Aucune activité trouvée pour cette région
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .content-container {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .refresh-button {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
        }

        .refresh-button:hover {
          background: #0056b3;
        }

        .refresh-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .filter-container {
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 5px;
        }

        .filter-container select {
          margin-left: 10px;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .statistics-section {
          margin-bottom: 30px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
          border-left: 4px solid #007bff;
        }

        .stat-card.revenue {
          border-left-color: #28a745;
        }

        .stat-card.discount {
          border-left-color: #ffc107;
        }

        .stat-value {
          font-size: 2em;
          font-weight: bold;
          color: #333;
        }

        .stat-label {
          font-size: 0.9em;
          color: #666;
          margin-top: 5px;
        }

        .activities-section {
          margin-top: 30px;
        }

        .data-table-container {
          overflow-x: auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .data-table th,
        .data-table td {
          padding: 12px 8px;
          border-bottom: 1px solid #dee2e6;
          text-align: left;
        }

        .data-table th {
          background: #f8f9fa;
          font-weight: 600;
          color: #495057;
        }

        .data-table tr:hover {
          background: #f8f9fa;
        }

        .text-center {
          text-align: center;
        }

        .currency-cell {
          text-align: right;
          font-weight: 500;
        }

        .currency-cell.revenue {
          color: #28a745;
        }

        .currency-cell.discount {
          color: #ffc107;
        }

        .activity-name {
          font-weight: 500;
          max-width: 200px;
        }

        .participant-badge,
        .member-badge,
        .guest-badge,
        .discount-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .participant-badge {
          background: #e3f2fd;
          color: #1976d2;
        }

        .member-badge {
          background: #e8f5e8;
          color: #2e7d32;
        }

        .guest-badge {
          background: #fff3e0;
          color: #f57c00;
        }

        .discount-badge {
          background: #fff8e1;
          color: #f9a825;
        }

        .loading-text {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .text-error {
          color: #dc3545;
          background: #f8d7da;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: #666;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default ActivitySituation;