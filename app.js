const express = require("express");
const mustacheExpress = require("mustache-express");
const bodyParser = require("body-parser");
const session = require("express-session");
const sessionConfig = require("./sessionConfig");
const fs = require("file-system");
const expressValidator = require("express-validator");
const app = express();
const words = fs.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");


app.engine("mustache", mustacheExpress());
app.set("views", "./views");
app.set("view engine", "mustache");


app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(expressValidator());
app.use(session(sessionConfig));

function gameValidator(req, res, next) {
  if (game.guessAmount == 0 && game.displayArray.indexOf("_") >= 0) {
    game.displayArray = game.mysteryWord.join(" ");
    game.endingMessage = "You Lose";
    res.redirect("/gameover");
  } else if (game.guessAmount >= 1 && game.displayArray.indexOf("_") < 0) {
    game.displayArray = game.mysteryWord.join(" ");
    game.endingMessage = "You Win!";
    res.redirect("/gameover");
  } else {
    next();
  }
}

function affirmativeWords() {
  const affirmations = [
    "EXCELLENT",
    "NAILD IT",
    "YUP!",
    "CORRECT",
    "NICE!",
    "TRUE!",
    "LUCKY GUESS",
    "GOOD GUESS"
  ];
  return affirmations[Math.floor(Math.random() * 8)];
}

function consolationWords() {
  const consolations = [
    "NOT FOUND",
    "TRY AGAIN",
    "NOPE",
    "INCORRECT",
    "FALSE"
  ];
  return consolations[Math.floor(Math.random() * 5)];
}

function mysteryWordGen() {
  return words[Math.floor(Math.random() * 10000)].toUpperCase().split("");
}

let game = {};
let mysteryWord;
let specialChars = "<>!@#$%^&*()_+[]{}?:;|'\"\\,./~`-=";

function gameGenerator() {
  mysteryWord = mysteryWordGen();

  let displayArray = (function() {
    let dummyArray = [];
    let arrayLength = mysteryWord.length;
    for (let i = 0; i < arrayLength; i++) {
      dummyArray.push("_");
    }
    return dummyArray;
  })();

  game = {
    guessAmount: 8,
    mysteryWord: mysteryWord,
    lettersGuessed: [],
    userDisplayGuessed: " ",
    displayArray: displayArray,
    userDisplayString: displayArray.join(" "),
    statusMessage: "Type To Begin",
    endingMessage: ""
  };

}

function gameReset() {
  game.GuessAmount = 8;
  game.mysteryWord = mysteryWord;
  game.lettersGuessed = [];
  game.userDisplayGuessed = " ";
  game.statusMessage = "Type To Begin";
  game.endingMessage = "";
}

app.get("/", function(req, res) {
  gameGenerator();
  res.render("index");
});

app.get("/game", gameValidator, function(req, res) {
  res.render("game", {
    game: game
  });
});

app.post("/game", function(req, res) {
  let userGuess = req.body.guess.toUpperCase();
  game.statusMessage = " ";

  function alreadyGuessed() {
    if (game.lettersGuessed.indexOf(userGuess) > -1) {
      return true;
    } else {
      return false;
    }
  }

  function gameEngine() {
    if (userGuess.length == 0) {
      game.statusMessage = "You Must Enter A Character.";
      res.redirect("/game");
    } else if (specialChars.indexOf(userGuess) >= 0) {
      game.statusMessage = "Special Characters Not Permitted!";
    } else if (alreadyGuessed() == true) {
      game.statusMessage = "Letter Already Guessed";
      res.redirect("/game");
    } else if (mysteryWord.indexOf(userGuess) < 0) {
      game.guessAmount -= 1;
      game.lettersGuessed.push(userGuess);
      game.statusMessage = consolationWords();
      res.redirect("/game");
    } else {
      mysteryWord.forEach(function(letter, index) {
        if (userGuess === letter) {
          game.displayArray[index] = mysteryWord[index];
        }
      });
      game.lettersGuessed.push(userGuess);
      game.statusMessage = affirmativeWords();
    }

    let errors = req.validationErrors();
  }

  gameEngine();
  game.userDisplayString = game.displayArray.join(" ");
  game.userDisplayGuessed = game.lettersGuessed.join(" ");
  res.redirect("/game");
});

app.get("/gameover", function(req, res) {
  res.render("gameover", {
    game: game
  });
});

app.get("/gamereset", function(req, res) {
  mysteryWordGen();
  gameGenerator();
  gameReset();
  res.redirect("/game");
});

app.listen(3000);
