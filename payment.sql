-- Insert data into ActivityPayment table
INSERT INTO ActivityPayment (id, date, id_activity, amount, id_presenceactivity) VALUES
(1, '2025-08-07', 1, 2000, 3),   -- T001 for R003 (M001 alone for A001)
(2, '2025-10-10', 1, 3500, 3),    -- T002 for R003 (M001 alone for A001)
(3, '2025-05-04', 1, 5000, 2),    -- T003 for R002 (M001 with P001 for A001)
(4, '2025-06-05', 1, 6000, 1),    -- T004 for R001 (M001 with P002 for A001)
(5, '2025-04-11', 2, 9500, 4),    -- T005 for R004 (M002 alone for A002)
(6, '2025-06-12', 2, 10000, 5),   -- T006 for R005 (M002 with P005 for A002)
(7, '2025-06-25', 2, 8000, 6);    -- T007 for R006 (M002 with P006 for A002)
