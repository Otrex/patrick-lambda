import axios from 'axios';
import express from 'express';
import { join } from 'path';
import fs from 'fs';

import {FILE_NAME, uploadMiddleware, __dirname, paystackWebHookValidator, sendMail, SERVER_IP, writeError, PAYSTACK_KEY, PAYSTACK_KEY_TEST} from './utility.mjs';

const PORT = (process.env.PORT || 3000);

const app = express();

app.use(express.json({limit: '50mb'}));

app.use(express.urlencoded({ extended: true }));

/**
 * Routes
 */

const router = express.Router();

router.all('/paystack-webhook', paystackWebHookValidator(PAYSTACK_KEY), async ({ body }) => {
  try {
    console.log('Recieving payment info')
    const { event, data } = body;
    console.log(event, data.customer);
    if (event.includes('success')) {
      await sendMail(data?.customer, {
        link: `http://${SERVER_IP}/book`
      });
    }
  } catch (error) {
    writeError(error)
  }
})

router.all('/paystack-webhook/test', paystackWebHookValidator(PAYSTACK_KEY_TEST), async ({ body }) => {
  try {
    console.log('Recieving payment info')
    const { event, data } = body;
    console.log(event, data.customer);
    if (event.includes('success')) {
      await sendMail(data?.customer, {
        link: `${SERVER_IP}/book`
      });
    }
  } catch (error) {
    writeError(error)
  }
})


router.post('/file-upload', uploadMiddleware, (req, res, next) => {
  res.status(201).send('OK')
});


router.get('/book', (req, res, next) => {
  try {
    const filePath = join(__dirname, '..', 'safe')
    const file = FILE_NAME;

    if (fs.existsSync(filePath)) {   
      res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Disposition" : "attachment; filename=" + file});
      fs.createReadStream(join(filePath, file)).pipe(res);
    } else {
      res.writeHead(400, {"Content-Type": "text/plain"});
      res.end("ERROR File does NOT Exists");
    }
  } catch (error) {
    next(error)
  }
});



app.use('/v1', router);
app.use('/', express.static(join(__dirname, '..', 'public')));

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err) res.status(500).send('something went wrong')
})

app.use('*', (req, res, next) => {
  res.status(404).send('page not found');
});

app.listen(PORT, () => {
  console.log(`Server connected at port: ${PORT}`)
});