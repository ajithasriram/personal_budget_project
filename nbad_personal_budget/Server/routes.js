const { response } = require("express");
const express = require("express");
const { requestBody, validationResult, body, header, param, query } = require('express-validator');
const user = require("./User");
const User = require("./User");
const NodeCache = require('node-cache');
const { request } = require("http");
const mongo = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs')
const cookieParser = require('cookie-parser');
var validator = require('validator');

const MongoClient = mongo.MongoClient;
const uri = "mongodb+srv://projectuser:personal_budget@nbadcluster.5waez.mongodb.net/personal_budget_project?retryWrites=true&w=majority";
var client;
var collection;
var pbCollection;
const { timeStamp } = require("console");
const tokenSecret = "wFq9+ssDbT#e2H9^";

var decoded = {};
var token;
const myCache = new NodeCache({ stdTTL: 3600, checkperiod: 60 });


var connectionDb = function (req, res, next) {
    client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    client.connect(err => {
        if (err) {
            closeConnection();
            return res.status(400).json({ "error": "Cannot connect to database: " + err });
        }
        collection = client.db("personal_budget_project").collection("userData");
        pbCollection = client.db("personal_budget_project").collection("budgetData");
        console.log("connected to database");
        next();
    });
}


var closeConnection = function () {
    client.close();
}

var verifyToken = function (req, res, next) {
    var headerValue = req.header("Authorization");
    console.log("in verify token "+headerValue)
    if (!headerValue) {
        closeConnection();
        return res.status(400).json({ "error": "Authorization header should be provided for using API" });
    }

    var authKey = headerValue.split(' ');

    if (authKey && authKey.length == 2 && authKey[0] === 'Bearer') {
        token = authKey[1];
        if (myCache.has(token)) {
            closeConnection();
            return res.status(400).json({ "error": "Cannot proceed. User is logged out" })
        }
        try {
            decoded = jwt.verify(token, tokenSecret);
            next();
        } catch (err) {
            closeConnection();
            return res.status(400).json({ "error": err });
        }
    }
    else {
        closeConnection();
        return res.status(400).json({ "error": "Appropriate authentication information needs to be provided" })
    }

}

const route = express.Router();

route.use(connectionDb);

route.use("/putBudget", verifyToken);
route.use("/deleteBudget", verifyToken);
route.use("/deleteBudgetByMonth",verifyToken);
route.use("/getBudget", verifyToken);
route.use("/putBudgetByMonth", verifyToken);
route.use("/getBudgetByMonth", verifyToken);
route.use("/editBudget", verifyToken);
route.use("/editBudgetByMonth", verifyToken);
route.use("/refreshToken", verifyToken);

route.post("/signup", [
    body("firstName", "First Name should be empty").notEmpty().trim().escape(),
    body("firstName", "First Name should have only alphabets").isAlpha().trim().escape(),
    body("lastName", "Last Name should not be empty").notEmpty().trim().escape(),
    body("lastName", "Last Name should have only alphabets").isAlpha().trim().escape(),
    body("gender", "Gender should be empty").notEmpty().trim().escape(),
    body("gender", "Gender should have only alphabets").isAlpha().trim().escape(),
    body("gender", "Gender should be Male or Female").isIn(["Male", "Female"]),
    body("age", "Age is required to create user").notEmpty(),
    body("age", "Please enter a valid age").isInt({ gt: 0 }),
    body("email", "Email cannot be empty").notEmpty().trim().escape(),
    body("email", "Invalid email format").isEmail(),
    body("password", "Password should be empty").notEmpty().trim(),
    body("password", "Password should have at least 6 and at max 20 characters").isLength({ min: 6, max: 20 })
], (request, response) => {
    const err = validationResult(request);
    if (!err.isEmpty()) {
        closeConnection();
        return response.status(400).json({ "error": err });
    }
    try {
        let pwd = request.body.password;
        var hash = bcrypt.hashSync(pwd, 10);
        var newUser = new User(request.body);
        newUser.password = hash;
        collection.insertOne(newUser, (err, res) => {
            var result = {};
            var responseCode = 200;
            if (err) {
                result = { "error": err };
                responseCode = 400;
            }
            else {
                if (res.ops.length > 0) {
                    var usr = res.ops[0].getUser();
                    usr.exp = Math.floor(Date.now() / 1000) + (60 * 60);
                    var token = jwt.sign(usr, tokenSecret);
                    result = res.ops[0].getUser();
                    result.token = token;
                }

            }
            closeConnection();
            return response.status(responseCode).json(result);
        });

    }
    catch (error) {
        closeConnection();
        return response.status(400).json({ "error": error });
    }
});

route.get("/refreshToken", (request, response) => {
    console.log(decoded);
    
    if(decoded._id == undefined){
        return response.status(400).send({"error":"token not generated"});
    }

    decoded.exp = Math.floor(Date.now() / 1000) + (1 * 60);
    var token = jwt.sign(decoded, tokenSecret);
    return response.status(200).send({"token":token});
});

route.get("/login", [
    header("Authorization", "Authorization header required to login").notEmpty().trim()
], (request, response) => {

    const err = validationResult(request);
    if (!err.isEmpty()) {
        closeConnection();
        return response.status(400).json({ "error": err });
    }

    try {
        var data = request.header('Authorization');
        var authData = data.split(' ');

        if (authData && authData.length == 2 && authData[0] === 'Basic') {
            let buff = new Buffer(authData[1], 'base64');
            let loginInfo = buff.toString('ascii').split(":");
            var result = {};

            if (loginInfo != undefined && loginInfo != null && loginInfo.length == 2) {
                var query = { "email": loginInfo[0] };
                collection.find(query).toArray((err, res) => {
                    var responseCode = 400;
                    if (err) {
                        result = { "error": err };
                    }
                    else if (res.length <= 0) {
                        result = { "error": "no such user present" };
                    }
                    else {
                        var user = new User(res[0]);
                        if (bcrypt.compareSync(loginInfo[1], user.password)) {
                            result = user.getUser();
                            user = user.getUser();
                            user.exp = Math.floor(Date.now() / 1000) + (60 * 60);
                            var token = jwt.sign(user, tokenSecret);
                            result.token = token;
                            responseCode = 200;
                        }
                        else {
                            result = { "error": "Username or password is incorrect" };
                        }
                    }
                    closeConnection();
                    return response.status(responseCode).json(result);

                });
            }
            else {
                closeConnection();
                return response.status(400).json({ "error": "credentials not provided for login" });
            }
        }
        else {
            closeConnection();
            return response.status(400).json({ "error": "Desired authentication type and value required for login" })
        }
    }
    catch (error) {
        closeConnection();
        return response.status(400).json({ "error": error.toString() });
    }

});

route.get("/test", (request, response) => {
    return response.status(200).json({ "result": "Hello there.. I think it is connected to the database!" });
});

route.get("/users/profile", (request, response) => {
    try {
        var query = { "_id": new mongo.ObjectID(decoded._id) };
        var result = {};
        var responseCode = 400;
        collection.find(query, { projection: { password: 0 } }).toArray((err, res) => {
            if (err) {
                result = { "error": err };
            }
            else {
                if (res.length <= 0) {
                    result = { "error": "no user found with id " + decoded._id };
                }
                else {
                    result = res[0];
                    responseCode = 200;
                }
            }
            closeConnection();
            return response.status(responseCode).json(result);
        });
    }
    catch (error) {
        closeConnection();
        return response.status(400).json({ "error": error.toString() });
    }
});

route.get("/users/logout", (request, response) => {
    const expiryTime = ((decoded.exp * 1000) - Date.now()) / 1000;

    if (expiryTime > 0) {
        var result = myCache.set(token, decoded.exp, expiryTime);
        if (!result) {
            closeConnection();
            return response.status(400).json({ "error": "could not logout user" });
        }
        closeConnection();
        return response.status(200).json({ "result": "user logged out" });
    }
    else {
        closeConnection();
        return response.status(400).json({ "error": "token expired" });
    }
});

route.put("/users", [
    body("_id", "User id should be updated").isEmpty(),
    body("firstName", "First Name should have only alphabets").optional().isAlpha().trim().escape(),
    body("lastName", "Last Name should have only alphabets").optional().isAlpha().trim().escape(),
    body("gender", "Gender should only be Male or Female").optional().isIn(["Male", "Female"]),
    body("age", "Please enter a valid age").optional().isInt({ gt: 0 }),
    body("email", "Email cannot be updated").isEmpty(),
    body("password", "password cannot be updated").isEmpty()
], (request, response) => {
    var err = validationResult(request);
    if (!err.isEmpty()) {
        closeConnection();
        return response.status(400).json({ "error": err });
    }
    try {
        var updateData = {};
        if (request.body.firstName) {
            updateData.firstName = request.body.firstName;
        }
        if (request.body.lastName) {
            updateData.lastName = request.body.lastName;
        }
        if (request.body.gender) {
            updateData.gender = request.body.gender;
        }
        if (request.body.age) {
            updateData.age = request.body.age;
        }
        if (updateData.firstName || updateData.lastName || updateData.gender || updateData.age) {
            var query = { "_id": mongo.ObjectID(decoded._id) };

            collection.find(query, { projection: { _id: 1 } }).toArray((err, res) => {
                if (err) {
                    closeConnection();
                    return response.status(400).json({ "error": err });
                }
                if (res.length <= 0) {
                    closeConnection();
                    return response.status(400).json({ "error": "no user found with id " + decoded._id });
                }

                var newQuery = { $set: updateData };

                var result = {};
                var responseCode = 400;
                collection.updateOne(query, newQuery, (err, res) => {
                    if (err) {
                        result = { "error": err };
                    }
                    else {
                        result = { "result": "user updated" };
                        responseCode = 200;
                    }
                    closeConnection();
                    return response.status(responseCode).json(result);
                });
            });

        }
        else {
            closeConnection();
            return response.status(200).json({ "result": "nothing to update" });
        }
    }
    catch (error) {
        closeConnection();
        return response.status(400).json({ "error": error.toString() });
    }
});

route.get('/getBudget', (request, response) => {
    var query = { "userId": decoded._id };
    console.log(query);
    pbCollection.find(query).toArray((err, result) => {
        if (err) {
            closeConnection();
            return response.status(400).json({ "error": err });
        } else {
            console.log(result);
            closeConnection();
            if (result.length <= 0) {
                console.log("Budget Details Found");
                var userBudget = [];
                return response.status(200).json({"user_budget": userBudget});
            } else {
                console.log("alloted Budget");
                var userBudget = result[0];
                return response.status(200).json( {"user_budget": userBudget});
            }
        }
});
});

route.put('/putBudgetByMonth', (request, response) => {
    var query = { "userId": decoded._id };
    console.log(query);
    console.log(request.body.color.includes("#"));
    if (!request.body.color.includes("#")) {
        closeConnection();
        return response.status(400).send("Color must include # value");
    }
    if (request.body.color.length != 7) {
        closeConnection();
        return response.status(400).send("Color length must be at least 6");
    }
    if (!validator.isHexColor(request.body.color)) {
        closeConnection();
        return response.status(400).send("Color must be a Hexadecimal value");
    }

    pbCollection.find(query).toArray((err, result) => {
        if (err) {
            closeConnection();
            return response.status(400).json({ "error": err });
        } else {
            console.log(result);
            if (result.length <= 0) {
                console.log("no data found");
                return response.status(400).json({"error":"Please add the constant budget first"});
            } else {
                userBudget = result[0];
                var monthlyBudget = [];
                var length = userBudget.allotedBudget.length;

                var text = {};
                text.title = request.body.title;
                text.budget = request.body.budget;
                text.color = request.body.color;

                var month = request.body.month;
                if(userBudget.monthlyBudget == undefined){
                    var budget = [];
                    budget[0] = text
                    monthlyBudget[month] = budget;
                    userBudget.monthlyBudget = monthlyBudget;
                }else{
                    if(userBudget.monthlyBudget[month] == undefined || userBudget.monthlyBudget[month] == null){
                        var budget = [];
                        budget[0] = text;
                        monthlyBudget = userBudget.monthlyBudget;
                        monthlyBudget[month] = budget;
                        userBudget.monthlyBudget = monthlyBudget;
                    }else{
                        var length = userBudget.monthlyBudget[month].length;
                        console.log("length : "+length);
                        var budget = userBudget.monthlyBudget[month];
                        monthlyBudget = userBudget.monthlyBudget;
                        budget[length] = text;
                        monthlyBudget[month] = budget;
                        userBudget.monthlyBudget = monthlyBudget;
                    }
                }
        
                console.log("after modification "+userBudget.monthlyBudget);

                var newQuery={$set:{"monthlyBudget":userBudget.monthlyBudget}};

                pbCollection.updateOne(query,newQuery,(e,result)=>{
                    if(e){
                        closeConnection();
                        return response.status(400).json({"error":err});
                    }
                    else{
                        closeConnection();
                        return response.status(200).json({"result":"monthly budget updated"});
                    }
                });   
            }
        }
    });
});

route.put('/putBudget', (request, response) => {
    var query = { "userId": decoded._id };
    console.log(query);
    console.log(request.body.color.includes("#"));
    if (!request.body.color.includes("#")) {
        closeConnection();
        return response.status(400).send("Color must include # value");
    }
    if (request.body.color.length != 7) {
        closeConnection();
        return response.status(400).send("Color length must be atleast 6");
    }
    if (!validator.isHexColor(request.body.color)) {
        closeConnection();
        return response.status(400).send("Color must be a Hexadecimal value");
    }

    pbCollection.find(query).toArray((err, result) => {
        if (err) {
            closeConnection();
            return response.status(400).json({ "error": err });
        } else {
            console.log(result);
            if (result.length <= 0) {
                console.log("no data found");
                var data = {};
                var allotedBudget = [];
                var text = {};
                data.userId = decoded._id;
                text.title = request.body.title;
                text.budget = request.body.budget;
                text.color = request.body.color;
                allotedBudget[0] = text;
                data.allotedBudget = allotedBudget;
                console.log(data);
                pbCollection.insertOne(data, (e, result) => {
                    if (e) {
                        closeConnection();
                        return response.status(400).json({ "error": err });
                    }
                    else {
                        closeConnection();
                        return response.status(200).json({ "result": "alloted budget added" });
                    }
                });
            } else {
                console.log("already present");
                var userBudget = result[0];
                var length = userBudget.allotedBudget.length;

                var text = {};
                text.title = request.body.title;
                text.budget = request.body.budget;
                text.color = request.body.color;

                for(let i=0; i<length; i++){
                    if(text.title == userBudget.allotedBudget[i].title){
                        return response.status(400).json({"error":"Budget with same name already present. Please edit that"});
                    }
                }

                console.log(length);
                
                userBudget.allotedBudget[length] = text;

                console.log("after modification "+userBudget.allotedBudget);

                var newQuery={$set:{"allotedBudget":userBudget.allotedBudget}};

                pbCollection.updateOne(query,newQuery,(e,result)=>{
                    if(e){
                        closeConnection();
                        return response.status(400).json({"error":err});
                    }
                    else{
                        closeConnection();
                        return response.status(200).json({"result":"alloted budget updated"});
                    }
                });   
            }
        }
    });
});

route.put('/deleteBudget', (request, response) => {

    var query = { "userId": decoded._id };
    console.log(query);
    pbCollection.find(query).toArray((err, result) => {
        if (err) {
            closeConnection();
            return response.status(400).json({ "error": err });
        } else {
            console.log(result);
            if (result.length <= 0) {
                console.log("no data found");
            } else {
                console.log("already present");
                var budget_name = request.body.title;
                var userBudget = result[0];
                var length = userBudget.allotedBudget.length;
                let i=0;
                for(i=0; i<length; i++){
                    if(budget_name == userBudget.allotedBudget[i].title){
                        break;
                    }
                }
                userBudget.allotedBudget.splice(i, 1);

                console.log("after modification "+userBudget.allotedBudget);

                var newQuery={$set:{"allotedBudget":userBudget.allotedBudget}};

                pbCollection.updateOne(query,newQuery,(e,result)=>{
                    if(e){
                        closeConnection();
                        return response.status(400).json({"error":err});
                    }
                    else{
                        closeConnection();
                        return response.status(200).json({"result":"Budget Deleted"});
                    }
                });
            }
        }
    });
});

route.put('/deleteBudgetByMonth', (request, response) => {

    var query = { "userId": decoded._id };
    console.log(query);
    pbCollection.find(query).toArray((err, result) => {
        if (err) {
            closeConnection();
            return response.status(400).json({ "error": err });
        } else {
            console.log(result);
            if (result.length <= 0) {
                console.log("no data found");
            } else {
                console.log("already present");
                var budget_name = request.body.title;
                var userBudget = result[0];
                var month = request.body.month;
                var length = userBudget.monthlyBudget[month].length;
                var monthlyBudget = userBudget.monthlyBudget;
                var user_month_budget = userBudget.monthlyBudget[month];
                let i=0;
                for(i=0; i<length; i++){
                    if(budget_name ==  user_month_budget[i].title){
                        break;
                    }
                }
                user_month_budget.splice(i, 1);

                monthlyBudget[month] = user_month_budget;

                console.log("after modification "+monthlyBudget);

                var newQuery={$set:{"monthlyBudget":monthlyBudget}};

                pbCollection.updateOne(query,newQuery,(e,result)=>{
                    if(e){
                        closeConnection();
                        return response.status(400).json({"error":err});
                    }
                    else{
                        closeConnection();
                        return response.status(200).json({"result":"Budget Deleted"});
                    }
                });
            }
        }
    });
});

route.put('/editBudget', (request, response) => {

    var query = { "userId": decoded._id };
    console.log(query);
    pbCollection.find(query).toArray((err, result) => {
        if (err) {
            closeConnection();
            return response.status(400).json({ "error": err });
        } else {
            console.log(result);
            if (result.length <= 0) {
                console.log("no data found");
            } else {
                console.log("already present");
                var budget_name = request.body.title;
                var userBudget = result[0];
                var length = userBudget.allotedBudget.length;
                let i=0;
                for(i=0; i<length; i++){
                    if(budget_name == userBudget.allotedBudget[i].title){
                        break;
                    }
                }
                userBudget.allotedBudget[i].color = request.body.color;
                userBudget.allotedBudget[i].budget = request.body.budget;

                console.log("after modification "+userBudget.allotedBudget);

                var newQuery={$set:{"allotedBudget":userBudget.allotedBudget}};

                pbCollection.updateOne(query,newQuery,(e,result)=>{
                    if(e){
                        closeConnection();
                        return response.status(400).json({"error":err});
                    }
                    else{
                        closeConnection();
                        return response.status(200).json({"result":"Budget Updated"});
                    }
                });
            }
        }
    });
});

route.put('/editBudgetByMonth', (request, response) => {

    var query = { "userId": decoded._id };
    console.log(query);
    pbCollection.find(query).toArray((err, result) => {
        if (err) {
            closeConnection();
            return response.status(400).json({ "error": err });
        } else {
            console.log(result);
            if (result.length <= 0) {
                console.log("no data found");
            } else {
                console.log("already present");
                var budget_name = request.body.title;
                var userBudget = result[0];
                var month = request.body.month;
                var length = userBudget.monthlyBudget[month].length;
                var monthlyBudget = userBudget.monthlyBudget;
                var user_month_budget = userBudget.monthlyBudget[month];
                let i=0;
                for(i=0; i<length; i++){
                    if(budget_name ==  user_month_budget[i].title){
                        break;
                    }
                }
                user_month_budget[i].color = request.body.color;
                user_month_budget[i].budget = request.body.budget;

                monthlyBudget[month] = user_month_budget;

                console.log("after modification "+monthlyBudget);

                var newQuery={$set:{"monthlyBudget":monthlyBudget}};

                pbCollection.updateOne(query,newQuery,(e,result)=>{
                    if(e){
                        closeConnection();
                        return response.status(400).json({"error":err});
                    }
                    else{
                        closeConnection();
                        return response.status(200).json({"result":"Budget Updated"});
                    }
                });
            }
        }
    });
});

route.get('/getBudgetByMonth/:month', (request, response) => {
    var query = { "userId": decoded._id };
    console.log(query);
    const month = request.params.month;
    console.log(month)
    pbCollection.find(query).toArray((err, result) => {
        if (err) {
            closeConnection();
            return response.status(400).json({ "error": err });
        } else {
            console.log(result);
            closeConnection();
            if (result.length <= 0) {
                console.log("Budget Details Not Found");
                var userBudget = [];
                return response.status(200).json({"user_budget": userBudget});
            } else {
                console.log("Budget Details Found");
                var userBudget = result[0];
                if(userBudget.monthlyBudget == undefined || userBudget.monthlyBudget[month] == undefined){
                    return response.status(200).json( {"user_budget": []});
                }
                return response.status(200).json( {"user_budget": userBudget.monthlyBudget[month]});
            }
        }
});
});

module.exports = route; 