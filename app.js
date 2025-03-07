const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
require("dotenv/config");
const authjwt = require("./middlewares/jwt");
const errorHandler = require("./middlewares/error_handler");

const app = express();
const env = process.env;
const API = env.API_URL;

app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(cors());
app.options("*", cors());
app.use(authjwt());
app.use(errorHandler);

const authRouter = require("./routes/auth");
const usersRouter = require("./routes/users");
const adminRouter = require("./routes/admin");
const categoriesRouter = require("./routes/categories");  
const productsRouter = require("./routes/products");  


app.use(`${API}/`, authRouter);
app.use(`${API}/users`, usersRouter);
app.use(`${API}/admin`, adminRouter);
app.use(`${API}/categories`, categoriesRouter);
app.use(`${API}/products`, productsRouter);
app.use('/public', express.static(__dirname + '/public'));




const hostname = env.HOST;
const port = env.PORT;
require('./helpers/cron_job');

mongoose.connect(env.MONGODB_CONNECTION_STRING).then(() => {
    console.log("Connected to database");
}).catch((error) => {
    console.log(error);
})
//start server 

app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}`);
});

