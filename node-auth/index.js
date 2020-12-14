const express = require('express');
const app = express();

const jwt = require('jsonwebtoken');
// const exjwt = require('express-jwt');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const db = require('./config').get(process.env.NODE_ENV);

var collection;

const User = require('./user');
const {auth} = require('./auth');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());

//database connection
const MongoClient = require('mongodb').MongoClient;
//const user = require('./user');
const uri = "mongodb+srv://projectuser:personal_budget@nbadcluster.5waez.mongodb.net/personal_budget_project?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useUnifiedTopology: true, useNewUrlParser: true });
var connectDB = function(req, res){
    console.log('ConnectDB called');
    client.connect(err => {
        if(err){
           console.log(err);
        }
        else{
            console.log("database is connected");
            collection = client.db("personal_budget_project").collection("userData");
        }
    });
}

app.get('/', function(req, res){
    res.status(200).send(`Welcome to login/sign-up api`);
});

//listening port
const PORT = process.env.PORT||300;
app.listen(PORT, ()=>{
    console.log(`app is live at ${PORT}`);
});

//adding new user (sign-up route)
app.post('/api/register', function(req, res){
    // taking a user
    console.log("entering register endpoint");
    const newUser = new User(req.body);
    connectDB(req, res);
    if(newUser.password != newUser.password2) return res.status(400).json({message: "password not match"});
    // if(newUser.firstName == '' || newUser.lastName == '' || newUser.)
    client.connect(err => {
        if(err) console.log(err);
        collection = client.db("personal_budget_project").collection("userData");
        console.log("database is connected");
        collection.findOne({email:newUser.email},function(err, user){
            if(user) return res.status(400).json({auth: false, message: "email exists"});
            newUser.save((err, user)=>{
                collection.insertOne(newUser)
                .then(function(){
                    message = "Successfully inserted document into collection"
                    console.log(message) 
                    return res.status(200).json({
                        success: true,
                        user: newUser._id
                    });                  
                })
                .catch(function(err){
                    console.log('failure to insert!');
                    console.log(err.message)
                    res.send(err.message)   
                    return res.status(400).json({success: false});
                })
            });
      });
   
    });
});

// login user
app.post('/api/login', function(req, res){
    let token = req.cookies.auth;
    const newUser = new User(req.body);
    client.connect(err => {
        if(err) console.log(err);
        collection = client.db("personal_budget_project").collection("userData");
        console.log("database is connected");
        // collection.findByToken(token, (err, user) => {
        //     if(err) console.log(err);
        //     if(user) return res.status(400).json({
        //         error: true,
        //         message:"You are already logged in"
        //     });

            // else{
                collection.findOne({'email': req.body.email}, function(err, user){
                    console.log(user);
                    if(!user) return res.json({isAuth: false, message: 'Auth failed, email not found'});
                        console.log("Inside index.js "+req.body.password);
                        newUser.comparepassword(user,req.body.password, (err, isMatch) => {
                            console.log(isMatch);
                            if(!isMatch) {                            
                                return res.json({isAuth: false, message: "password does not match"});
                            }
                            else{
                                return res.json({isAuth: true, message: "login success"});
                            }
                            
                            // newUser.generateToken((err, user) => {
                            //     if(err) return res.status(400).send(err);
                            //     res.cookie('auth', user.token).json({
                            //         isAuth: true,
                            //         id: user._id,
                            //         email: user.email                            
                            //     });
                            // });
                        });    
            
                });

                //     user.comparePassword(req.body.password, (err, isMatch) => {
                //         if(!isMatch) return res.json({isAuth: false, message: "password does not match"});

                //     user.generateToken((err, user)=>{
                //         if(err) return res.status(400).send(err);
                //         res.cookie('auth', user.token).json({
                //             isAuth: true,
                //             id: user._id,
                //             email: user.email
                //         });
                //     });
                // });
            })
            // }
        // });
    });
// });

// get logged in user
app.get('/api/profile', auth,function(req, res){
    res.json({
        isAuth: true,
        id: req.user._id,
        email: req.user.email,
        name: req.user.firstName + req.user.lastName
    })
});

// logout user
app.get('/api/logout', auth, function(req, res){
    req.user.deleteToken(req.token, (err, user) => {
        if(err) return res.status(400).send(err);
        res.sendStatus(200);
    });
});