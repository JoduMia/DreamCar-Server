const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jsonToken = require('jsonwebtoken');
const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 5000;


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.cxn7suc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });





app.get('/', (req, res) => {
    res.send('server is running')
})
app.listen(port, () => {
    console.log(`server is listening on port:${port}`);
})