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

const jsonVerification = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(!authHeader) {
        res.status(401).send('Unauthorized Access without header');
    }
    const token = authHeader.split(' ')[1];
    jsonToken.verify(token, process.env.ACCESS_TOKEN, (err,decoded) => {
        if(err) {
            console.log(err);
            return res.status(403).send({message: 'Forbidden access'});
        }
        req.decoded = decoded;
        next();
    })
};


const connectMongoDb = async () => {
    try {
        const oldCarCategory = client.db('oldCarBebsha').collection('category');
        const oldCarProducts = client.db('oldCarBebsha').collection('products');
        const userDb = client.db('oldCarBebsha').collection('users');
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = {email: email};
            const result = await userDb.findOne(query);
            res.send({isAdmin: result.role === 'admin'})
        })
        app.post('/bookings', async (req, res) => {
            const doc = req.body;
            const document = {...doc, status: 'unpaid'}
            const result = await bookingDb.insertOne(document);
            res.send(result)
        })
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

        app.get('/dashboard/checkout/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)}
            const order = await bookingDb.findOne(query);
            res.send(order);
        })

        app.post("/create-payment-intent", async (req, res) => {
            try{
                const { price } = req.body;
            const total = price * 100;
            console.log('hiddddddd');

            const paymentIntent = await stripe.paymentIntents.create({
              amount: total,
              currency: "usd",
              "payment_method_types": [
                "card"
              ]
            });

            res.send({
              clientSecret: paymentIntent.client_secret,
            });
            }catch(error){
                console.log(error.message);
                res.send(error)
            }
          });

    }finally{}
}
connectMongoDb().catch(err => console.log(err.message))


app.get('/', (req, res) => {
    res.send('server is running')
})
app.listen(port, () => {
    console.log(`server is listening on port:${port}`);
})