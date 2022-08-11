import express from 'express';
// import cron from 'node-cron';
import compression from 'compression';
import { json, urlencoded } from 'body-parser';
import cors from 'cors';
import 'dotenv/config'
import root_router from './routes/root_router';
const app = express();
app.use(
    compression({threshold: 0}),
    urlencoded({extended:true}),
    json(),
    cors({
        origin: '*',
        optionsSuccessStatus: 200,
    }),
)

app.use("/",root_router)
app.listen(3000, () => {
    console.log(`Application is running on port 3000`);
});


// cronjob.start();

