-- =================================================================
-- VUE 1: Comptage des invités amenés par chaque membre par activité
-- =================================================================
CREATE MATERIALIZED VIEW mv_member_guest_counts AS
SELECT 
    ap.id_member,
    ap.id_activity,
    COUNT(*) AS nb_guests_brought
FROM ActivityPresence ap
WHERE ap.id_person IS NOT NULL  -- Seulement les invités (pas le membre)
GROUP BY ap.id_member, ap.id_activity;

-- Index pour optimiser les jointures
CREATE INDEX idx_member_guest_counts_member_activity 
ON mv_member_guest_counts(id_member, id_activity);

-- =================================================================
-- VUE 2: Éligibilité des membres à la remise
-- =================================================================
CREATE MATERIALIZED VIEW mv_member_discount_eligibility AS
SELECT 
    mgc.id_member,
    mgc.id_activity,
    mgc.nb_guests_brought,
    c.nbpersonne AS discount_threshold,
    c.remise AS discount_rate,
    (mgc.nb_guests_brought >= c.nbpersonne) AS is_eligible_for_discount
FROM mv_member_guest_counts mgc
CROSS JOIN Constant c;

-- Index pour optimiser les jointures
CREATE INDEX idx_member_discount_eligibility_member_activity 
ON mv_member_discount_eligibility(id_member, id_activity);

-- =================================================================
-- VUE 3: Détails des présences avec identification des personnes
-- =================================================================
CREATE MATERIALIZED VIEW mv_presence_details AS
SELECT 
    ap.id AS presence_id,
    ap.id_member,
    ap.id_activity,
    CASE 
        WHEN ap.id_person IS NULL THEN 
            -- C'est le membre lui-même
            (SELECT m.id_person FROM Members m WHERE m.id = ap.id_member)
        ELSE 
            -- C'est un invité
            ap.id_person
    END AS person_id,
    CASE 
        WHEN ap.id_person IS NULL THEN 'member'
        ELSE 'guest'
    END AS person_type
FROM ActivityPresence ap;

-- Index pour optimiser les jointures
CREATE INDEX idx_presence_details_activity ON mv_presence_details(id_activity);
CREATE INDEX idx_presence_details_member ON mv_presence_details(id_member);
CREATE INDEX idx_presence_details_person ON mv_presence_details(person_id);

-- =================================================================
-- VUE 4: Calcul des montants à payer (VUE FINALE)
-- =================================================================
CREATE MATERIALIZED VIEW mv_payment_amounts AS
SELECT 
    pd.presence_id,
    pd.id_activity,
    a.description AS activity_description,
    a.date AS activity_date,
    pd.person_id,
    p.first_name,
    p.last_name,
    pd.id_member,
    pd.person_type,
    a.price AS base_price,
    COALESCE(mde.nb_guests_brought, 0) AS guests_brought,
    COALESCE(mde.discount_threshold, 0) AS discount_threshold,
    COALESCE(mde.is_eligible_for_discount, FALSE) AS gets_discount,
    COALESCE(mde.discount_rate, 0) AS discount_rate,
    -- Calcul du montant final
    CASE 
        WHEN pd.person_type = 'member' 
             AND COALESCE(mde.is_eligible_for_discount, FALSE) = TRUE THEN
            -- Membre avec remise: prix - (prix * taux_remise)
            a.price * (1 - COALESCE(mde.discount_rate, 0))
        ELSE 
            -- Prix normal pour invités ou membres sans remise
            a.price
    END AS amount_to_pay
FROM mv_presence_details pd
JOIN Activities a ON pd.id_activity = a.id
JOIN Persons p ON pd.person_id = p.id
LEFT JOIN mv_member_discount_eligibility mde 
    ON pd.id_member = mde.id_member 
    AND pd.id_activity = mde.id_activity
ORDER BY pd.id_activity, pd.id_member, pd.person_type DESC;

-- Index pour la vue finale
CREATE INDEX idx_payment_amounts_activity ON mv_payment_amounts(id_activity);
CREATE INDEX idx_payment_amounts_person ON mv_payment_amounts(person_id);

-- =================================================================
-- FONCTIONS DE RAFRAÎCHISSEMENT
-- =================================================================

-- Rafraîchir toutes les vues dans le bon ordre
CREATE OR REPLACE FUNCTION refresh_all_payment_views()
RETURNS VOID AS $$
BEGIN
    -- Ordre important: des vues de base vers les vues dépendantes
    REFRESH MATERIALIZED VIEW mv_member_guest_counts;
    REFRESH MATERIALIZED VIEW mv_member_discount_eligibility;
    REFRESH MATERIALIZED VIEW mv_presence_details;
    REFRESH MATERIALIZED VIEW mv_payment_amounts;
    
    RAISE NOTICE 'Toutes les vues de paiement ont été rafraîchies';
END;
$$ LANGUAGE plpgsql;

-- Rafraîchir seulement une vue spécifique (pour les mises à jour partielles)
-- CREATE OR REPLACE FUNCTION refresh_payment_view(view_name TEXT)
-- RETURNS VOID AS $$
-- BEGIN
--     CASE view_name
--         WHEN 'guest_counts' THEN 
--             REFRESH MATERIALIZED VIEW mv_member_guest_counts;
--         WHEN 'discount_eligibility' THEN 
--             REFRESH MATERIALIZED VIEW mv_member_guest_counts;
--             REFRESH MATERIALIZED VIEW mv_member_discount_eligibility;
--         WHEN 'presence_details' THEN 
--             REFRESH MATERIALIZED VIEW mv_presence_details;
--         WHEN 'payment_amounts' THEN 
--             PERFORM refresh_all_payment_views();
--         ELSE 
--             RAISE EXCEPTION 'Vue inconnue: %', view_name;
--     END CASE;
-- END;
-- $$ LANGUAGE plpgsql;

-- =================================================================
-- EXEMPLES D'UTILISATION
-- =================================================================

-- Voir les comptages d'invités par membre
-- SELECT * FROM mv_member_guest_counts WHERE id_activity = 1;

-- Voir l'éligibilité aux remises
-- SELECT * FROM mv_member_discount_eligibility WHERE is_eligible_for_discount = TRUE;

-- Voir tous les montants à payer pour une activité
-- SELECT * FROM mv_payment_amounts WHERE id_activity = 1;

-- Résumé des paiements par personne
-- SELECT 
--     person_id, 
--     first_name, 
--     last_name, 
--     COUNT(*) as nb_activities,
--     SUM(amount_to_pay) as total_amount
-- FROM mv_payment_amounts 
-- GROUP BY person_id, first_name, last_name;

-- Rafraîchir toutes les vues
-- SELECT refresh_all_payment_views();