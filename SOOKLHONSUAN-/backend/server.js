require('dotenv').config();
const app = require('./app'); 
const pool = require('./src/db'); 
const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    const client = await pool.connect();
    console.log(" Database connected successfully! :)");
    client.release(); 
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Failed to connect to database T^T:", error.message);
    process.exit(1);
  }
}
startServer();