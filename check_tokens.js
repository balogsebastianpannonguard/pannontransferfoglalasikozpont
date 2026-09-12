const { MongoClient } = require("mongodb");

async function run() {
  const uri = "mongodb+srv://sebimbalog_db_user:sebimbalog_db_user@cluster0.svk5lpn.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("pannontransferfoglalasikozpont");
  const users = await db.collection("ecopro_portal_users").find().toArray();
  console.log("ECOPRO users:", users.map(u => ({ email: u.email, token: u.inviteRawToken })));
  
  const catlUsers = await db.collection("catl_portal_users").find().toArray();
  console.log("CATL users:", catlUsers.map(u => ({ email: u.email, token: u.inviteRawToken })));
  
  await client.close();
}
run().catch(console.error);
