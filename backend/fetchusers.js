const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://Divyam:<NMDR2phsbQ2b59w1>@cluster01.mongodb.net/EduSagemongodb+srv://Divyam:<NMDR2phsbQ2b59w1>@cluster01.j6yaq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster01";
const client = new MongoClient(uri);

async function fetchUsers() {
  try {
    // Connect to MongoDB
    await client.connect();
    const database = client.db("Users");  // Replace with your actual database name
    const users = database.collection("EduSage");  // Replace with your collection name
    const userList = await users.find({}).toArray();  // Fetch all users

    // Log users to console
    console.log("Users in the database:");
    console.log(userList);
  } catch (error) {
    console.error("Error fetching users:", error);
  } finally {
    // Close the connection
    await client.close();
  }
}

fetchUsers().catch(console.dir);
