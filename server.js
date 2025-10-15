// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const Transaction = require("./models/Transaction");

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log(err));

// Home route — list all transactions
app.get("/", async (req, res) => {
  const transactions = await Transaction.find().sort({ date: -1 });
  const totalIncome = await Transaction.aggregate([
    { $match: { type: "income" } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const totalExpense = await Transaction.aggregate([
    { $match: { type: "expense" } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const income = totalIncome[0]?.total || 0;
  const expense = totalExpense[0]?.total || 0;
  const balance = income - expense;

  res.render("index", { transactions, income, expense, balance });
});

// Add transaction page
app.get("/add", (req, res) => {
  res.render("add");
});

// Handle adding new transaction
app.post("/add", async (req, res) => {
  const { type, category, amount, description } = req.body;
  await Transaction.create({ type, category, amount, description });
  res.redirect("/");
});

// Delete transaction
app.post("/delete/:id", async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting transaction");
  }
});

app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${process.env.PORT}`);
});
