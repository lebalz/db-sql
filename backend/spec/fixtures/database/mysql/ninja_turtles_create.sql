-- clean up
DROP DATABASE IF EXISTS ninja_turtles_db;

-- create database and user
CREATE DATABASE ninja_turtles_db;

USE ninja_turtles_db;

-- create tables
CREATE TABLE ninja_turtles (
    id INT PRIMARY KEY auto_increment,
    name TEXT
);
CREATE TABLE fights (
     id INT PRIMARY KEY auto_increment,
     date DATETIME,
     badass_turtle_id INT,
     kickass_turtle_id INT,
     FOREIGN KEY kickass_idx (kickass_turtle_id) REFERENCES ninja_turtles(id),
     FOREIGN KEY badass_idx (badass_turtle_id) REFERENCES ninja_turtles(id)
);

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