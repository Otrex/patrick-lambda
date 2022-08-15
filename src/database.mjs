import express from 'express';
import mysql from 'mysql2/promise';

// interface Payload {
//   full_name: string;
//   email: string;
//   phone_number: string;
//   country_of_residence: string;
// }

const createDatabaseIfNotExists = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    multipleStatements: true,
  });

  await connection.query(`
CREATE DATABASE IF NOT EXISTS ${process.env.DB_DATABASE || 'patrick_contact_form'};

USE ${process.env.DB_DATABASE || 'patrick_contact_form'};

CREATE TABLE IF NOT EXISTS contacts (
    id int(11) NOT NULL auto_increment,
    full_name varchar(255) NOT NULL,
    email varchar(255) NOT NULL,
    phone_number varchar(255) NOT NULL,
    country_of_residence varchar(255) NOT NULL,
    PRIMARY KEY (id)
);
  `);

  await connection.end();
};

const createDatabaseRecord = async (payload) => {
  await createDatabaseIfNotExists();

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    database: process.env.DB_DATABASE || 'patrick_contact_form',
  });

  const { full_name, email, phone_number, country_of_residence } = payload;

  const [rows, fields] = await connection.execute(
    'INSERT INTO contacts (full_name, email, phone_number, country_of_residence) VALUES (?, ?, ?, ?)',
    [full_name, email, phone_number, country_of_residence],
  );

  await connection.end();

  return [rows, fields];
};

export default (app) => {
  app.use(express.json());

  app.post('/submit-form', async (req, res) => {
    try {
      const { full_name, email, phone_number, country_of_residence } = req.body;
      if (!full_name || !email || !phone_number || !country_of_residence) {
        return res.status(400).send({
          status: 'error',
          message: 'all fields are required',
        });
      }

      const result = await createDatabaseRecord(req.body);

      return res.status(200).send({
        status: 'success',
        message: 'form submitted',
        data: result,
      });
    } catch (e) {
      return res.status(400).send({
        status: 'error',
        message: 'unable to submit form',
      });
    }
  });
};