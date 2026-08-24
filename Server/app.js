// const express = require("express");

// const userRoutes = require("./routes/userRoutes.js");

// const app = express();
// const PORT = 8080;

// // Mount routers
// app.use("/userLogin", userRoutes);

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });


const express = require("express");
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
// increase limit to handle base64-encoded profile images
app.use(express.json({ limit: '5mb' }));

// import routes
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");

// use routes
app.use(userRoutes);
app.use(productRoutes);
app.use(orderRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).send("Not Found");
});

app.listen(8080, () => {
  console.log("Server running on port 8080");
});