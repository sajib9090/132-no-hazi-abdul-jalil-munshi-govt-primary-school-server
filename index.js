const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
require("dotenv").config();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// mongodb
//
//
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = process.env.DB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// validate jwt
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "Unauthorized Access" });
  }
  const token = authorization.split(" ")[1];
  //token verify
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "Unauthorized Access" });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    const postsCollection = client.db("primarySchoolDB").collection("posts");
    const promoCollection = client.db("primarySchoolDB").collection("promo");
    const usersCollection = client.db("primarySchoolDB").collection("users");
    const teachersCollection = client
      .db("primarySchoolDB")
      .collection("teachers");

    //----------------------------------------
    // generate json web token
    app.post("/jwt", async (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      // console.log(token);
      res.send({ token });
    });

    //----------------------------------------------------------------
    //Post related api
    app.get("/posts", async (req, res) => {
      const result = await postsCollection.find().toArray();
      res.send(result);
    });
    app.get("/posts/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: new ObjectId(id) };
      const data = await postsCollection.findOne(query);
      res.send(data);
    });
    //---------------------------------------
    app.get("/posts/teachers/:email", async (req, res) => {
      const email = req.params.email;
      // console.log(email);
      const query = { email: email };
      const result = await postsCollection.find(query).toArray();
      res.send(result);
    });
    //---------------------------------------
    app.post("/posts", async (req, res) => {
      const post = req.body;
      post.createdAt = new Date();
      const result = await postsCollection.insertOne(post);
      res.send(result);
    });
    ////////////////////////////////////////
    app.get("/promo", async (req, res) => {
      const result = await promoCollection
        .find()
        .sort({ newDate: -1 })
        .toArray();
      res.send(result);
    });
    ///////////////////////////////////////
    app.post("/promo", async (req, res) => {
      const post = req.body;
      post.createdAt = new Date();
      const result = await promoCollection.insertOne(post);
      res.send(result);
    });
    //
    // patch
    app.patch("/posts/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "approved",
          reason: "",
        },
      };
      const result = await postsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.patch("/posts/post/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "denied",
          reason: req.body.reason,
        },
      };
      const result = await postsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    //----------------------------------------------------------------
    //user related api
    // get api
    app.get("/users/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: new ObjectId(id) };
      const data = await usersCollection.findOne(query);
      res.send(data);
    });
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
    //post api
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User already exist" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    //----------------------------------------------------------------
    // patch
    app.patch("/users/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    app.patch("/users/user/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "user",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    //put
    //put
    app.put("/users/:id", async (req, res) => {
      const id = req.params.id;
      const user = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedUser = {
        $set: {
          subject: user.subject,
          role: user.position,
          joining_date: user.date,
          education_qualification: user.education_qualification,
          description: user.description,
        },
      };

      const result = await usersCollection.updateOne(
        filter,
        updatedUser,
        options
      );
      res.send(result);
    });

    //delete api
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });
    //
    app.delete("/posts/teachers/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await postsCollection.deleteOne(query);
      res.send(result);
    });

    //
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Primary server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port, ${port}`);
});
