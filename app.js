const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
require("dotenv/config");
const app = express();
const env = process.env;

app.use(bodyParser.json());
app.use(morgan("combined"));
app.use(cors());
app.options("*", cors());

app.get("/", (req, res) => {
    return res.status(404).send('sorry, cant find the server');
});

app.get('/watch/videos/:id',(request, response) =>{
    return response.json({
        videoId: request.params.id
    });
});

const hostname = env.HOSTNAME;
const port = env.PORT;

mongoose.connect(env.MONGODB_CONNECTION_STRING).then(() => {
    console.log("Connected to database");
}).catch((error) => {
    console.log(error);
})
//start server 

app.listen(port,hostname, () => {
    console.log(`Server running at http://"${hostname} :${port}`);
});

//CRUD
//create data
// app.post()
// //read data
// app.get()
// //update data
// app.put()
// //delete data
// app.delete()