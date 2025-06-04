import React, { useEffect, useState } from "react";

const ActivitySituation = () => {
  const [situationData, setSituationData] = useState(null);
  const [selectedSP, setSelectedSP] = useState("");
  const [spList, setSPList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch available SP on mount
  useEffect(() => {
    fetch("http://localhost:5000/api/sp")
      .then(response => response.json())
      .then(data => {
        setSPList(data.sp_list || data); // Adapter selon la structure de réponse de votre API
      })
      .catch(error => {
        console.error("Erreur lors de la récupération des SP :", error);
      });
  }, []);

  // Fetch activity situation data
  useEffect(() => {
    const url = selectedSP
      ? `http://localhost:5000/api/activities/situation?sp_id=${encodeURIComponent(selectedSP)}`
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
  }, [selectedSP]);

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

  // Get selected SP description for display
  const getSelectedSPDescription = () => {
    if (!selectedSP) return "Toutes les SP";
    const sp = spList.find(sp => sp.id === parseInt(selectedSP));
    return sp ? `${sp.description} (${sp.region})` : selectedSP;
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
        <label htmlFor="sp-select">Filtrer par SP : </label>
        <select
          id="sp-select"
          value={selectedSP}
          onChange={(e) => setSelectedSP(e.target.value)}
        >
          <option value="">Toutes les SP</option>
          {spList.map((sp) => (
            <option key={sp.id} value={sp.id}>
              {sp.description} - {sp.region}
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="loading-text">Chargement de la situation des activités...</div>}
      {error && <div className="text-error">Erreur: {error}</div>}

      {!loading && !error && situationData && (
        <>
          {/* Overall Statistics Section */}
          <div className="statistics-section">
            <h3>Statistiques Globales - {getSelectedSPDescription()}</h3>
            
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

              <div className="stat-card revenue">
                <div className="stat-value">{formatCurrency(situationData.overall_statistics.total_paid)}</div>
                <div className="stat-label">Total Payé</div>
              </div>

              <div className="stat-card discount">
                <div className="stat-value">{formatCurrency(situationData.overall_statistics.remaining_balance)}</div>
                <div className="stat-label">Reste</div>
              </div>
            </div>
          </div>

          {/* Activities Detail Section */}
          <div className="activities-section">
            <h3>Détail des Activités {selectedSP ? `pour ${getSelectedSPDescription()}` : 'pour toutes les SP'}</h3>
            
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
                    <th>Total Déjà Payé</th>
                    <th>Solde Restant</th>
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
                      <td className={`currency-cell ${activity.remaining_balance > 0 ? 'discount' : 'revenue'}`}>
                        {formatCurrency(activity.remaining_balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {situationData.activities_detail.length === 0 && (
                <div className="empty-state">
                  {selectedSP ? 
                    `Aucune activité trouvée pour la SP sélectionnée` : 
                    `Aucune activité trouvée`
                  }
                </div>
              )}
            </div>
          </div>

          {/* Fully Paid Persons Section */}
          <div className="fully-paid-section">
            <h3>Personnes Ayant Payé en Totalité {selectedSP ? `- ${getSelectedSPDescription()}` : ''}</h3>
            
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nom</th>
                    <th>Prénom</th>
                    <th>Type</th>
                    <th>SP</th>
                    <th>Région</th>
                    <th>Nb Activités</th>
                    <th>Montant Total</th>
                    <th>Montant Payé</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {situationData.fully_paid_persons.map((person) => (
                    <tr key={person.person_id}>
                      <td>{person.person_id}</td>
                      <td className="person-name">{person.last_name}</td>
                      <td className="person-name">{person.first_name}</td>
                      <td className="text-center">
                        <span className={`person-type-badge ${person.person_type}`}>
                          {person.person_type === 'member' ? 'Membre' : 'Non-Membre'}
                        </span>
                      </td>
                      <td>{person.sp_description || 'N/A'}</td>
                      <td>{person.sp_region || 'N/A'}</td>
                      <td className="text-center">
                        <span className="activity-count-badge">{person.activities_count}</span>
                      </td>
                      <td className="currency-cell">{formatCurrency(person.total_amount_to_pay)}</td>
                      <td className="currency-cell revenue">{formatCurrency(person.total_amount_paid)}</td>
                      <td className="text-center">
                        <span className="status-badge paid">
                          ✓ Payé
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {situationData.fully_paid_persons.length === 0 && (
                <div className="empty-state">
                  {selectedSP ? 
                    `Aucune personne n'a payé en totalité pour la SP sélectionnée` : 
                    `Aucune personne n'a payé en totalité`
                  }
                </div>
              )}
            </div>

            <div className="summary-info">
              <p><strong>{situationData.fully_paid_persons.length}</strong> personne(s) ont payé en totalité toutes leurs activités</p>
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
          min-width: 300px;
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

        .activities-section,
        .fully-paid-section {
          margin-top: 30px;
        }

        .data-table-container {
          overflow-x: auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
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
          color: #dc3545;
        }

        .activity-name,
        .person-name {
          font-weight: 500;
          max-width: 200px;
        }

        .participant-badge,
        .member-badge,
        .guest-badge,
        .person-type-badge,
        .activity-count-badge,
        .status-badge {
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

        .member-badge,
        .person-type-badge.member {
          background: #e8f5e8;
          color: #2e7d32;
        }

        .guest-badge,
        .person-type-badge.guest {
          background: #fff3e0;
          color: #f57c00;
        }

        .activity-count-badge {
          background: #f3e5f5;
          color: #7b1fa2;
        }

        .status-badge.paid {
          background: #e8f5e8;
          color: #2e7d32;
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

        .summary-info {
          background: #e8f5e8;
          padding: 15px;
          border-radius: 5px;
          border-left: 4px solid #28a745;
          margin-top: 15px;
        }

        .summary-info p {
          margin: 0;
          color: #2e7d32;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default ActivitySituation;