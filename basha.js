const express = require("express");
const app = express();
app.use(express.json());

const bcrypt = require("bcrypt");

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
// console.log(dbPath);

let db;

const initializing = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server is Running...! # Basha");
    });
  } catch (e) {
    console.log(`Database Error: ${e.message}`);
    process.exit(1);
  }
};

initializing();

// sample api

/* app.get("/", (request, response) => {
  response.send("Given code is successfully running..!");
}); */

// API one - creating User details
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  // const hashedPassword = await bcrypt.hash(password, 10);

  const selectUserQuery = `select * from user where username like '${username}';`;

  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    // create user

    const hashedPassword = await bcrypt.hash(password, 10);

    const createUserQuery = `insert into user(username,name,password,gender,location)
    values(
        '${username}',
        '${name}',
        '${hashedPassword}',
        '${gender}',
        '${location}'
    )`;
    // await db.run(createUserQuery);
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too Short");
    } else {
      const createUser = await db.run(createUserQuery);
      response.status(200);
      response.send("User created Successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// API two - user login

app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const selectUserQuery = `select * from user where username like '${username}';`;

  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordCheck = await bcrypt.compare(password, dbUser.password);
    if (isPasswordCheck) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// API three - change-password

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const selectUserQuery = `select * from user where username = '${username}';`;

  const dbUser = await db.get(selectUserQuery);

  // const hashedPassword = await bcrypt.hash(oldPassword, 10);

  if (dbUser === undefined) {
    response.send("Invalid user");
    response.status(400);
  } else {
    const passwordCheck = await bcrypt.compare(oldPassword, dbUser.password);
    const a = await bcrypt.hash(newPassword, 10);
    if (passwordCheck) {
      let l = newPassword.length;
      if (l < 5) {
        response.send("Password is too short");
        response.status(400);
      } else {
        const userDetails = `update user set password = '${a}' where username = '${username}';`;
        await db.run(userDetails);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
