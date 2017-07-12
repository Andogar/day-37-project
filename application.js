const express = require('express');
const fs = require('file-system');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const expressHandlebars = require('express-handlebars');
const session = require('express-session');
const data = require('./models/data.json');
const salt = "secretsalt";

const application = express();

application.engine('handlebars', expressHandlebars());
application.set('view engine', 'handlebars');

application.use(session({
    secret: 'secretcookiekey',
    resave: false,
    saveUninitialized: true
}));

application.use('/public', express.static('./public'));

application.use(bodyParser.urlencoded());

// GET A REGISTRATION PAGE
application.get('/register', (request, response) => {
    response.status(200).render('register');
});

// POST A NEW USER
application.post('/register', (request, response) => {
    var username = request.body.username;
    var password = request.body.password;

    if (!username && !password) {
        response.render("register");
    } else {
        var hashed = crypto.pbkdf2Sync(password, salt, 10, 512, "sha512").toString("base64");

        var newUser = {
            id: data.length + 1,
            username: username,
            password: hashed,
            decks: []
        }

        var addUser = data.push(newUser);

        var saveJSONData = JSON.stringify(data);
        fs.writeFile('./data.json', saveJSONData, function (err) { });

        response.status(200).redirect('/login')
    }
});

//GET A LOGIN
application.get('/login', (request, response) => {
    response.status(200).render('login');
});

// POST A LOGIN
application.post('/login', (request, response) => {
    var username = request.body.username;
    var password = request.body.password;

    if (!username && !password) {
        // render error page
        response.status(401).render('login');
    } else {
        var findUser = data.find(q => q.username === username);
        var hashed = crypto.pbkdf2Sync(password, salt, 10, 512, "sha512").toString("base64");

        if (findUser && findUser.password === hashed) {
            request.session.isAuthenticated = true;
            response.status(200).redirect('/decks');
        } else {
            response.status(401).render('login');
        }
    }
});

// GET LOGOUT BY DESTROYING SESSION
application.get('/logout', (request, response) => {
    request.session.destroy();
    response.redirect('/login');
});

// GET ALL DECKS
application.get('/user/:userId/decks', (request, response) => {
    var userId = parseInt(request.params.userId);

    var findUser = data.find(q => q.id === userId);
    var userDecks = findUser.decks;

    response.json(userDecks);
});

// POST NEW DECK
application.post('/user/:userId/decks', (request, response) => {
    var userId = parseInt(request.params.userId);
    var deckName = request.body.deckName;

    if (!deckName) {
        // return error page
        response.json("Please enter in the appropriate information");
    } else {
        var findUser = data.find(q => q.id === userId);
        var userDecks = findUser.decks;

        var newDeck = {
            deckId: userDecks.length + 1,
            deckName: deckName,
            cards: []
        }

        var addDeck = userDecks.push(newDeck);

        var saveJSONData = JSON.stringify(data);
        fs.writeFile('./data.json', saveJSONData, function (err) { });

        response.json(userDecks);
    }
});

// GET CARDS IN ONE DECK
application.get('/user/:userId/decks/:deckId', (request, response) => {
    var userId = parseInt(request.params.userId);
    var deckId = parseInt(request.params.deckId);

    var findUser = data.find(q => q.id === userId);
    var findDeck = findUser.decks.find(q => q.deckId === deckId);

    response.json(findDeck);
});

// ADD CARD TO DECK
application.post('/user/:userId/decks/:deckId/card', (request, response) => {
    var cardQuestion = request.body.question;
    var cardAnswer = request.body.answer;

    if (!cardQuestion && !cardAnswer) {
        // return error page
        response.json("Please enter in the appropriate information");
    } else {
        var userId = parseInt(request.params.userId);
        var deckId = parseInt(request.params.deckId);

        var findUser = data.find(q => q.id === userId);
        var findDeck = findUser.decks.find(q => q.deckId === deckId);

        var newCard = {
            cardId: findDeck.cards.length + 1,
            question: cardQuestion,
            answer: cardAnswer
        }

        var addCard = findDeck.push(newCard);

        response.json(findDeck);
    }
});

// EDIT CARD IN DECK
application.put('/user/:userId/decks/:deckId/card/:cardId', (request, response) => {
    var cardQuestion = request.body.question;
    var cardAnswer = request.body.answer;

    if (!cardQuestion && !cardAnswer) {
        // return error page
        response.json("Please enter in the appropriate information");
    } else {
        var userId = parseInt(request.params.userId);
        var deckId = parseInt(request.params.deckId);

        var findUser = data.find(q => q.id === userId);
        var findDeck = findUser.decks.find(q => q.deckId === deckId);
        var findCard = findDeck.cards.findIndex(q => q.cardId === cardId);

        var cardUpdate = {
            cardId: findCard - 1,
            question: cardQuestion,
            answer: cardAnswer
        }

        findDeck.cards[findCard] = cardUpdate;

        response.json(findDeck);
    }
});

// DELETE CARD FROM DECK
application.delete('/user/:userId/decks/:deckId/card/:cardId', (request, response) => {
    var userId = parseInt(request.params.userId);
    var deckId = parseInt(request.params.deckId);
    var cardId = parseInt(request.params.cardId);


    var findUser = data.find(q => q.id === userId);
    var findDeck = findUser.decks.find(q => q.deckId === deckId);
    var findCard = findDeck.cards.findIndex(q => q.cardId === cardId);

    // This breaks in test environment but will work in database
    // Currently have ID's incrementing based off the array length, which will break if you try to
    // delete any card but the last card in the deck. In a database structured environment, the ID
    // will always be unique and increment in some way, preventing this from happening

    var deleteCard = findDeck.cards.splace(findCard, 1);

    response.json(findDeck);

});

// START QUIZ FOR DECK
application.get('/user/:userId/decks/:deckId/quiz', (request, response) => {
    request.session.numberRight = 0;
    var userId = parseInt(request.params.userId);
    var deckId = parseInt(request.params.deckId);
    var findUser = data.find(q => q.id === userId);
    var findDeck = findUser.decks.find(q => q.deckId === deckId);

    var randomCardIndex = Math.floor(Math.random() * findDeck.cards.length);
    var randomCard = findDeck.cards[randomCardIndex];

    response.json(randomCard);
});

// SEND CORRECT ANSWER FOR QUIZ
application.post('/user/:userId/decks/:deckId/quiz/correct', (request, response) => {
    request.session.numberRight += 1;
    var userId = parseInt(request.params.userId);
    var deckId = parseInt(request.params.deckId);
    var findUser = data.find(q => q.id === userId);
    var findDeck = findUser.decks.find(q => q.deckId === deckId);

    var randomCardIndex = Math.floor(Math.random() * findDeck.cards.length);
    var randomCard = findDeck.cards[randomCardIndex];

    response.json(randomCard);
});

// SEND INCORRECT ANSWER FOR QUIZ
application.post('/user/:userId/decks/:deckId/quiz/incorrect', (request, response) => {
    var userId = parseInt(request.params.userId);
    var deckId = parseInt(request.params.deckId);
    var findUser = data.find(q => q.id === userId);
    var findDeck = findUser.decks.find(q => q.deckId === deckId);

    var randomCardIndex = Math.floor(Math.random() * findDeck.cards.length);
    var randomCard = findDeck.cards[randomCardIndex];

    response.json(randomCard);
});

application.listen(3000);

module.exports = application;