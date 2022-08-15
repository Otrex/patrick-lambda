import multer from 'multer';
import { join } from 'path';
import Handlebars from 'handlebars';
import { source } from './template.mjs';
import crypto from 'crypto';
import Mailjet from 'node-mailjet';

import path from 'path';
import { fileURLToPath } from 'url';
import { writeFile } from 'fs'
import dotenv from 'dotenv';

dotenv.config();

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

export const SERVER_IP = process.env.SERVER_IP;
export const PAYSTACK_KEY = process.env.PAYSTACK_KEY;
export const PAYSTACK_KEY_TEST = process.env.PAYSTACK_KEY_TEST;
export const EMAIL_FROM = process.env.EMAIL_FROM;
export const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME;
export const MAILJET_API_KEY = process.env.MAILJET_API_KEY;
export const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY;

export const FILE_PATH = join(__dirname, '..', 'safe');
export const FILE_NAME = 'book.pdf'
export const FIELD_NAME = 'file';

const mailjet = new Mailjet({
  apiKey: MAILJET_API_KEY,
  apiSecret: MAILJET_SECRET_KEY
})

export const paystackWebHookValidator = (secret) => (req, res, next) => {
  try {
    const hash = crypto
      .createHmac('sha512', secret) //
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash === req.headers['x-paystack-signature']) {
      res.sendStatus(200);
      next();
    } else {
      res.sendStatus(401);
    }
  } catch (err) {
    console.log(err);
    res.sendStatus(400);
  }
};

export const writeError = (error) => {
  const filePath = join(__dirname, '..', 'logs');
  const logfile = 'error.log';
  console.log(error)
  writeFile(join(filePath, logfile), JSON.stringify({ error, timestamp: new Date() }));
}

export const sendMail = async (customer, payload) => {
  const template = Handlebars.compile(source);
  const res = await mailjet.post('send', { version: 'v3.1' }).request({
    Messages: [
      {
        From: {
          Email: EMAIL_FROM,
          Name: EMAIL_FROM_NAME,
        },
        To: [
          {
            Email: customer.email,
          },
        ],
        "Subject": "Congratulations on your Forex Course Purchase",
        "HTMLPart": template({ ...payload, ...customer }),
        "CustomID": "AppGettingStartedTest"
      },
    ],
  })
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, FILE_PATH)
  },
  filename: function (req, file, cb) {
    cb(null, FILE_NAME)
  }
})


export const lockEndpoint = (req, res, next) => {
  const { pass_code } = req.body;
  if (pass_code !== process.env.PASS_CODE) return next(Error('not authorized'))
  next()
}

export const uploadMiddleware = multer({ storage: storage }).single(FIELD_NAME)