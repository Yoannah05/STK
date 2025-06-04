CREATE DATABASE stk;
\c stk;  -- Connect to the STK database

-- Table SP
CREATE TABLE SP (
    id SERIAL PRIMARY KEY,
    description VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL
);

-- Table Persons
CREATE TABLE Persons (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    birth_date DATE NOT NULL,
    id_sp INT,
    FOREIGN KEY (id_sp) REFERENCES SP(id) ON DELETE SET NULL
);

-- Table Members (Extends Persons)
CREATE TABLE Members (
    id INT PRIMARY KEY,
    id_person INT NOT NULL REFERENCES Persons(id) ON DELETE CASCADE,
    affiliation_date DATE NOT NULL
);

-- Table Activities
CREATE TABLE Activities (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(10) CHECK (priority IN ('Low', 'Medium', 'High')) NOT NULL,
    region VARCHAR(100) NOT NULL,
    price NUMERIC(10,2) NOT NULL
);

-- Table ActivityPresence
CREATE TABLE ActivityPresence (
    id SERIAL PRIMARY KEY,
    id_member INT NOT NULL,
    id_person INT, 
    id_activity INT NOT NULL,
    FOREIGN KEY (id_member) REFERENCES Members(id) ON DELETE CASCADE,
    FOREIGN KEY (id_person) REFERENCES Persons(id) ON DELETE SET NULL,
    FOREIGN KEY (id_activity) REFERENCES Activities(id) ON DELETE CASCADE
);

-- Table ActivityPayment
CREATE TABLE ActivityPayment (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    id_activity INT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    id_presenceactivity INT NOT NULL REFERENCES ActivityPresence(id) ON DELETE CASCADE,
    FOREIGN KEY (id_activity) REFERENCES Activities(id) ON DELETE CASCADE
);

-- Table Constant
CREATE TABLE Constant (
    minimum_price NUMERIC(10,2) NOT NULL,
    maximum_price NUMERIC(10,2) NOT NULL,
    remise NUMERIC(10,2),
    nbpersonne INT NOT NULL
);

ALTER TABLE Activities DROP CONSTRAINT activities_priority_check;
ALTER TABLE Activities ALTER COLUMN priority TYPE INTEGER USING priority::integer;
ALTER TABLE Activities ADD CONSTRAINT activities_priority_check CHECK (priority BETWEEN 1 AND 10);
