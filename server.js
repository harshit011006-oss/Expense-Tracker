
const express = require("express");
const pool = require("./db")
const app = express();
const PORT = process.env.PORT || 3000;
const path = require("path");

app.use(express.json());

// Serve frontend files from the project root
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/style.css", (req, res) => {
    res.sendFile(path.join(__dirname, "style.css"));
});

app.get("/script.js", (req, res) => {
    res.sendFile(path.join(__dirname, "script.js"));
});
//Testing the route

//Fetching all the transactions

app.get("/api/transactions", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM public.transactions ORDER BY date DESC, id DESC"
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({
            error: "Failed to fetch transactions"
        });
    }
});

// Adding a new transaction

app.post("/api/transactions", async (req, res) => {
    try {
        const { description, amount, type, category, date } = req.body;
        if (typeof description !== "string" ||
            !description.trim() ||
            description.trim().length > 120 ||
            amount === "" ||
            amount === null ||
            amount === undefined ||
            !Number.isFinite(Number(amount)) ||
            Number(amount) <= 0 ||
            !["income", "expense"].includes(type) ||
            typeof category !== "string" ||
            !category.trim() ||
            !date) {
            return res.status(400).json({
                error: "Please provide valid transaction details"
            })
        }

        const result = await pool.query(
            `INSERT INTO transactions
            (description, amount, type, category, date)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                description.trim(),
                Number(amount),
                type,
                category.trim(),
                date
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error adding transaction:", error.message);
        res.status(500).json({ error: "Failed to add transaction" });
    }
}
);


// DELETE: Remove a transaction by ID
app.delete("/api/transactions/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({
                error: "Invalid transaction ID"
            });
        }

        const result = await pool.query(
            "DELETE FROM transactions WHERE id = $1 RETURNING id",
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: "Transaction not found"
            });
        }

        res.json({ message: "Transaction deleted successfully" });
    } catch (error) {
        console.error("Error deleting transaction:", error.message);
        res.status(500).json({ error: "Failed to delete transaction" });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});