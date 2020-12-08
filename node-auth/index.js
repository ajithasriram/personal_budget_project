const express = require('express');
const app = express();

const jwt = require('jsonwebtoken');
// const exjwt = require('express-jwt');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const db = require('./config').get(process.env.NODE_ENV);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());

//database connection
mongoose.connect(db.DATABASE, { useNewUrlParser: true, useUnifiedTopology: true}, function(err){
    if(err) console.log(err);
    console.log("database is connected");
})

app.get('/', function(req, res){
    res.status(200).send(`Welcome to login/sign-up api`);
});

//listening port
const PORT = process.env.PORT||300;
app.listen(PORT, ()=>{
    console.log(`app is live at ${PORT}`);
});