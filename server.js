const fs = require('fs');
const path = require('path');

const express = require("express");

const { animals } = require("./data/animals")

const PORT = process.env.PORT || 3001;

const app = express();    ///these two steps instantiate the server then tell it to listen for requests 

//parse incoming string or array data
app.use(express.urlencoded({ extended: true }))  // Express.js method that takes incoming POST data and converts to key/value parirings that can be accssed in the req.body object. 
// parse incoming JSON data
app.use(express.json()); // the express.json method takes incoming POST data in JSON form and parses it into the req.body 

function filterByQuery(query, animalsArray) {
    let personalityTraitsArray = [];
    // Note that we save the animalsArray as filteredResults here:
    let filteredResults = animalsArray;
    if (query.personalityTraits) {
        // Save personalityTraits as a dedicated array.
        // If personalityTraits is a string, place it into a new array and save.
        if (typeof query.personalityTraits === 'string') {
            personalityTraitsArray = [query.personalityTraits];
        } else {
            personalityTraitsArray = query.personalityTraits;
        }
        // Loop through each trait in the personalityTraits array:
        personalityTraitsArray.forEach(trait => {
            // Check the trait against each animal in the filteredResults array.
            // Remember, it is initially a copy of the animalsArray,
            // but here we're updating it for each trait in the .forEach() loop.
            // For each trait being targeted by the filter, the filteredResults
            // array will then contain only the entries that contain the trait,
            // so at the end we'll have an array of animals that have every one 
            // of the traits when the .forEach() loop is finished.
            filteredResults = filteredResults.filter(
                animal => animal.personalityTraits.indexOf(trait) !== -1
            );
        });
    }
    if (query.diet) {
        filteredResults = filteredResults.filter(animal => animal.diet === query.diet);
    }
    if (query.species) {
        filteredResults = filteredResults.filter(animal => animal.species === query.species);
    }
    if (query.name) {
        filteredResults = filteredResults.filter(animal => animal.name === query.name);
    }
    // return the filtered results:
    return filteredResults;
}

function findById(id, animalsArray) {
    const result = animalsArray.filter(animal => animal.id === id)[0];
    return result;
}

function createNewAnimal(body, animalsArray) {

    // our function's main code will go here!
    const animal = body;
    animalsArray.push(animal);
    fs.writeFileSync(
        path.join(__dirname, "./data/animals.json"),
        JSON.stringify({ animals: animalsArray }, null, 2)  // the null argument means we don't want to edit any of our existing data. If we did, we could pass something in there 
    );


    // return finished code to post route for response
    return animal;
}


// adding the routes here /// 
app.get('/api/animals', (req, res) => {
    let results = animals;
    if (req.query) {
        results = filterByQuery(req.query, results);
    }
    res.json(results);
});

app.get('/api/animals/:id', (req, res) => {
    const result = findById(req.params.id, animals);
    if (result) {
        res.json(result);
    } else {
        res.send(404);
    }
});

app.post('/api/animals', (req, res) => {
    // set id based on what the next index of the array will be
    req.body.id = animals.length.toString();  // req.body property is where we can access that data on the server side and do something with it

    // if any data in req.body is incorrect, send 400 error back 
    if (!validateAnimal(req.body)) {
        res.status(400).send("The animal is not properly formatted");  // res.status().send(); is a response method to relay a message to the client making a request. We send them an http status code and message explaining what went wrong. 400 range means user error not server error... 
    } else {
        const animal = createNewAnimal(req.body, animals);

        res.json(animal);

    }


});


function validateAnimal(animal) {
    if (!animal.name || typeof animal.name !== 'string') {
        return false;
    }
    if (!animal.species || typeof animal.species !== 'string') {
        return false;
    }
    if (!animal.diet || typeof animal.diet !== 'string') {
        return false;
    }
    if (!animal.personalityTraits || !Array.isArray(animal.personalityTraits)) {
        return false;
    }
    return true;
}

app.listen(PORT, () => {
    console.log(`API server now on ${PORT}!`);
});

