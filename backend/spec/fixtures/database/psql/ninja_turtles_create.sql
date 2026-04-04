-- clean up
DROP INDEX IF EXISTS badass_idx;
DROP DATABASE IF EXISTS ninja_turtles_db;

-- create database and user
CREATE DATABASE ninja_turtles_db;

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
CREATE INDEX kickass_idx ON fights (kickass_turtle_id);
CREATE INDEX badass_idx ON fights (badass_turtle_id);

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

