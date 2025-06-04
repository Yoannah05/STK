-- Clear existing data if needed (be careful with this in production)
TRUNCATE TABLE ActivityPresence CASCADE;
TRUNCATE TABLE ActivityPayment CASCADE;
TRUNCATE TABLE Members CASCADE;
TRUNCATE TABLE Activities CASCADE;
TRUNCATE TABLE Persons CASCADE;
TRUNCATE TABLE SP CASCADE;
TRUNCATE TABLE Constant CASCADE;


-- Insert data into SP table (using custom IDs as shown in screenshot)
INSERT INTO SP (id, description, region) VALUES
(1, 'STK Antananarivo', 'analamanga'),
(2, 'STK ankaratra', 'vakinankaratra');

-- Insert data into Persons table
INSERT INTO Persons (id, first_name, last_name, birth_date, id_sp) VALUES
(1, 'koto', 'rabe', '2000-01-15', 1),
(2, 'angela', 'rakotonandrasana', '1995-08-28', 1),
(3, 'john', 'rabary', '1999-02-03', 2),
(4, 'Ony', 'rakoto', '2003-03-23', 2),
(5, 'bob', 'Andrianirina', '1998-06-14', 1),
(6, 'jean', 'ralay', '2001-05-21', 2);

-- Insert data into Members table
INSERT INTO Members (id,id_person, affiliation_date) VALUES
(1,3, '2012-01-01'),  -- P003 is member M001
(2,4,'2021-01-01');  -- P004 is member M002

-- Insert data into Activities table
INSERT INTO Activities (id, date, description, priority, region, price) VALUES
(1, '2025-12-12', 'excursion', 6, 'analamanga', 6000),
(2, '2025-06-27', 'fihaonambe', 8, 'vakinankaratra', 10000);

-- Insert data into ActivityPresence table
INSERT INTO ActivityPresence (id, id_member, id_person, id_activity) VALUES
(1, 1, 2, 1),  -- R001: M001  with P002 for A001
(2, 1, 1, 1),  -- R002: M001 with P001 for A001
(3, 1, NULL, 1),  -- R003: M001 alone for A001
(4, 2, NULL, 2),  -- R004: M002 alone for A002
(5, 2, 5, 2),  -- R005: M002 with P005 for A002
(6, 2, 6, 2);  -- R006: M002 with P006 for A002

-- Insert data into Constant table (from "causation" table in screenshot)
INSERT INTO Constant VALUES
(5000, 10000, 0.1, 2);




