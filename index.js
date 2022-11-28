const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jsonToken = require('jsonwebtoken');
const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 5000;

const stripe = require("stripe")(process.env.STRIPE_KEY);

// jsonVerification middlewares
const jsonVerification = async (req, res, next) => {
    try{
        const authHeader = req.headers.authorization;
    if(!authHeader) {
        return res.status(401).send('Unauthorized Access without header');
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
    } catch {
        res.status(403).send({message: "Error Happened"});
    }
};


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.cxn7suc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const connectMongoDb = async () => {
    try {
        const oldCarCategory = client.db('oldCarBebsha').collection('category');
        const oldCarProducts = client.db('oldCarBebsha').collection('products');
        const userDb = client.db('oldCarBebsha').collection('users');
        const bookingDb = client.db('oldCarBebsha').collection('bookings');
        const paymentDb = client.db('oldCarBebsha').collection('payments');

        app.put('/users', async (req, res) => {
            const seller = req.query.seller;
            const email = req.query.email;
            const updateDoc = {
                $set: {
                    user_type: seller
                }
            }
            const result = await userDb.updateOne({email: email}, updateDoc, {upsert: true});
            const data = await userDb.findOne({email:email});
            res.send(data)

        })


        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = {email: email};
            const result = await userDb.findOne(query);
            res.send({isAdmin: result.role === 'admin'})
        })

        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = {email: email};
            const result = await userDb.findOne(query);
            res.send({isSeller: result.role === 'seller'})

        })

        app.get('/users/buyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = {email: email};
            const result = await userDb.findOne(query);
            res.send({isBuyer: result.role === 'buyer'})
        })

        app.get('/mybookings', async (req, res) => {
            const email = req.query.email;
            const bookings = await bookingDb.find({email:email}).toArray();
            res.send(bookings)
        })



        app.post('/bookings', async (req, res) => {
            const doc = req.body;
            const document = {...doc, status: 'unpaid'}
            const result = await bookingDb.insertOne(document);
            res.send(result)
        })


        app.get('/bookings',jsonVerification, async (req, res) => {
            const bookings = await bookingDb.find({}).toArray();
            res.send(bookings)
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


          app.post('/payment', async (req, res) => {
            const paymentInfo = req.body;
            const {id,matchby} = paymentInfo;
            const query = {_id: ObjectId(id)};
            const updateDoc = {$set: {status: 'paid'}}
            const updateStatus = await bookingDb.updateOne(query, updateDoc, {upsert:true});
            const result = await paymentDb.insertOne(paymentInfo);

            const queryforAd = {_id: ObjectId(matchby)};
            const productSellStatusUpdateDoc = {$set: {sell_status: 'sold'}};
            const updateSellstatus = await oldCarProducts.updateOne(queryforAd,productSellStatusUpdateDoc,{upsert: true});

            res.send(result);
          })


          app.get('/onlycategory', async (req, res) => {
            const result = await oldCarCategory.find().project({category: 1}).toArray();
            res.send(result);
          })

          app.post('/addproduct', async (req, res) => {
            const addproduct = req.body;
            const {seller_email} = req.body;
            const user = await userDb.findOne({email:seller_email});
            let isValid_seller = false;
            if(user.isVerified){
                isValid_seller = true;
            }
            const addproductswithVerifyStatus = {...addproduct, isValid_seller}
            const result = await oldCarProducts.insertOne(addproductswithVerifyStatus);
            console.log(result);
            res.send(result)
          })


        app.get('/users', async (req, res) => {
            const users = await userDb.find({}).toArray();
            res.send(users)
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await userDb.insertOne(user);
            res.send(result);
        })

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const user = await userDb.findOne({email: email});
            if(user) {
                const token = jsonToken.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '1h'});
                return res.send({token : token});
            }
            res.status(403).send(`Unauthorized access`)
        })

        app.get('/category', async (req, res) => {
            const result = await oldCarCategory.find({}).toArray();
            res.send(result);
        })

        app.get('/category/:id',async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = {category: id, sell_status: 'available'};
            const result = await oldCarProducts.find(query).toArray();
            res.send(result);
        })

        //advertise.....

        app.get('/advetise', async (req, res) => {
            const query = {sell_status: 'available', ad:true}
            const result = await oldCarProducts.find(query).toArray();
            res.send(result);
        })

        //myproduct

        app.get('/myproducts', async (req, res) => {
            const email = req.query.email;
            const myproduct = await oldCarProducts.find({seller_email: email}).toArray();
            res.send(myproduct);
        })

        app.put('/addtoads/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const updateDoc = {$set: {ad:true}};
            const result = await oldCarProducts.updateOne(query, updateDoc, {upsert: true});
            console.log(result);
            res.send(result);
        })

        app.delete('/deleteproduct/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await oldCarProducts.deleteOne(query);
            console.log(result);
        })

        //get the sellers...
        app.get('/sellers', async (req, res) => {
            const result = await userDb.find({role: 'seller'}).toArray();
            res.send(result)
        })

        app.get('/buyers', async (req, res) => {
            const result = await userDb.find({role: 'buyer'}).toArray();
            res.send(result)
        })

        app.put('/verifyuser/:id', async (req, res) => {
            const id = req.params.id;
            const email = req.query.email;
            const query = {_id: ObjectId(id)};
            const updateDoc = {$set: {isVerified:true}};
            const result = await userDb.updateOne(query, updateDoc, {upsert: true});

            const querytoproduct = {seller_email: email};
            const updatePorductDoc = {$set: {isValid_seller:true}};
            const updateProductvalidSeller = await oldCarProducts.updateMany(querytoproduct, updatePorductDoc, {upsert: true});
            console.log(updateProductvalidSeller);
            res.send(result);
        })

        app.delete('/deleteseller/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await userDb.deleteOne(query);
            console.log(result);
        })

        app.delete('/deletebuyer/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await userDb.deleteOne(query);
            console.log(result);
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