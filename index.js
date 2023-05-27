const express = require("express");
const cors = require("cors");
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

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    const database = client.db("SchoolsDB");
    const schoolsData = database.collection("teachers");
    const postsData = database.collection("posts");

    //get/read
    app.get("/teachers", async (req, res) => {
      const cursor = schoolsData.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //
    app.get("/posts", async (req, res) => {
      const cursor = postsData.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //
    app.get("/titleFind/:text", async (req, res) => {
      if (req.params.text == "Headmaster") {
        const result = await schoolsData
          .find({ title: req.params.text })
          .toArray();
        return res.send(result);
      }
      const result = await schoolsData
        .find({ title: req.params.text })
        .toArray();
      res.send(result);
    });

    // post
    app.post("/teachers", async (req, res) => {
      const teacher = req.body;
      teacher.createdAt = new Date();
      const result = await schoolsData.insertOne(teacher);
      res.send(result);
    });
    //posts
    app.post("/posts", async (req, res) => {
      const post = req.body;
      post.createdAt = new Date();
      const result = await postsData.insertOne(post);
      res.send(result);
    });

    // delete
    app.delete("/posts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await postsData.deleteOne(query);
      res.send(result);
    });
    app.delete("/teachers/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await schoolsData.deleteOne(query);
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
