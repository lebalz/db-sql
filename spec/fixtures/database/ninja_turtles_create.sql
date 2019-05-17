-- clean up
DROP INDEX IF EXISTS badass_idx;
DROP DATABASE IF EXISTS ninja_turtles_db;
DROP USER IF EXISTS foo;
DROP SCHEMA IF EXISTS ninja_turtle;

-- create database and user
CREATE SCHEMA ninja_turtle;
CREATE DATABASE ninja_turtles_db;
CREATE USER foo WITH ENCRYPTED PASSWORD 'safe-db-password';

-- connect to new db
\c ninja_turtles_db;

-- create tables
CREATE TABLE ninja_turtles (
    id SERIAL PRIMARY KEY,
    name TEXT
);
CREATE TABLE fights (
     id SERIAL PRIMARY KEY,
     date TIMESTAMP,
     badass_turtle_id INTEGER REFERENCES ninja_turtles(id),
     kickass_turtle_id INTEGER REFERENCES ninja_turtles(id)
);
CREATE INDEX badass_idx ON fights (badass_turtle_id);
ALTER TABLE fights SET SCHEMA ninja_turtle;
ALTER TABLE ninja_turtles SET SCHEMA ninja_turtle;

-- insert some entries
INSERT INTO ninja_turtles (id, name)
VALUES
  (1, 'Ninja Reto'),
  (2, 'Warrior Maria'),
  (3, 'Mutant Holzkopf');

INSERT INTO fights (date, badass_turtle_id, kickass_turtle_id)
VALUES
  ('1969-01-18 10:15:00', 1, 2),
  ('1969-01-18 10:32:00', 1, 3),
  ('1969-01-18 10:48:00', 3, 2);

-- set ownership
ALTER DATABASE ninja_turtles_db OWNER TO foo;
ALTER TABLE ninja_turtles OWNER TO foo;
ALTER TABLE fights OWNER TO foo;
