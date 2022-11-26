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


const connectMongoDb = async () => {
    try {
        const oldCarCategory = client.db('oldCarBebsha').collection('category');
        const oldCarProducts = client.db('oldCarBebsha').collection('products');
        const userDb = client.db('oldCarBebsha').collection('users');


        app.post('/bookings', async (req, res) => {
            const doc = req.body;
            const document = {...doc, status: 'unpaid'}
            const result = await bookingDb.insertOne(document);
            res.send(result)
        })
        app.get('/category', async (req, res) => {
            const result = await oldCarCategory.find({}).toArray();
            res.send(result);
        })
        app.get('/category/:id',async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = {category: id};
            const result = await oldCarProducts.find(query).toArray();
            res.send(result);
        })

    }finally{}
}
connectMongoDb().catch(err => console.log(err.message))


app.get('/', (req, res) => {
    res.send('server is running')
})
app.listen(port, () => {
    console.log(`server is listening on port:${port}`);
})