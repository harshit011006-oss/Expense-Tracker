const transactionForm = document.getElementById("transaction-form");

const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");

const totalBalanceElement = document.getElementById("total-balance");
const totalIncomeElement = document.getElementById("total-income");
const totalExpenseElement = document.getElementById("total-expenses");

const transactionList = document.getElementById("transaction-list");

/*...............Store Transaction................*/

let transactions = [];
let nextTransactionId = 1;

/*....................Current Date, Year, Time...........*/

function getTodayDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

/*..............Formatting Currency...................*/

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/*...............Formatting Dates................*/

function formatDate(datestring) {
    return new Date(`${datestring}T00:00:00`).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

/*..........Updating Summary Cards..................*/

function updateSummary() {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(function (transaction) {
        if (transaction.type === "income") {
            totalIncome += transaction.amount;
        } else {
            totalExpense += transaction.amount;
        }
    });

    const totalBalance = totalIncome - totalExpense;

    totalBalanceElement.textContent = formatCurrency(totalBalance);
    totalIncomeElement.textContent = formatCurrency(totalIncome);
    totalExpenseElement.textContent = formatCurrency(totalExpense);
}

/*........................Displaying Transactions.................*/

function renderTransactions() {
    transactionList.replaceChildren();

    if (transactions.length === 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.id = "empty-state";

        const emptyCell = document.createElement("td");
        emptyCell.colSpan = 6;
        emptyCell.textContent =
            "No transactions yet. Add your first transaction.";

        emptyRow.appendChild(emptyCell);
        transactionList.appendChild(emptyRow);

        return;
    }


    const sortedTransactions = [...transactions].sort(function (a, b) {
        return b.date.localeCompare(a.date) || b.id - a.id;
    });

    sortedTransactions.forEach(function (transaction) {
        const row = document.createElement("tr");

        const descriptionCell = document.createElement("td");
        descriptionCell.textContent = transaction.description;
        row.appendChild(descriptionCell);

        const categoryCell = document.createElement("td");
        categoryCell.textContent = transaction.category;
        row.appendChild(categoryCell);

        const dateCell = document.createElement("td");
        dateCell.textContent = formatDate(transaction.date);
        row.appendChild(dateCell);

        const typeCell = document.createElement("td");
        typeCell.textContent =
            transaction.type === "income" ? "Income" : "Expense";
        row.appendChild(typeCell);

        const amountCell = document.createElement("td");

        const sign = transaction.type === "income" ? "+" : "−";
        amountCell.textContent = sign + formatCurrency(transaction.amount);

        amountCell.style.color =
            transaction.type === "income" ? "#21865C" : "#D75B58";

        row.appendChild(amountCell);

        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-transaction-button";

        deleteButton.setAttribute(
            "aria-label",
            `Delete transaction: ${transaction.description}`
        );

        deleteButton.addEventListener("click", function () {
            deleteTransaction(transaction.id);
        });

        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);

        transactionList.appendChild(row);
    });
}

function normalizeTransaction(transaction){
    return{
        ...transaction,
        amount: Number(transaction.amount),
        date: String(transaction.date).slice(0,10)
    };
}

async function loadTransactions() {
    try{
        const response = await fetch("/api/transactions");
        const data = await response.json();

        if(!response.ok){
            throw new Error(data.error ||"Failed to load Transactions")
        }
        transactions=data.map(normalizeTransaction);
        renderTransactions();
        updateSummary();
    }catch(error){
           console.error("Error loading transactions:", error);
        alert("Could not load transactions. Check the server terminal.");
    }
}

/*....................Adding a Transaction................*/


transactionForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;
    const date = dateInput.value;

    if (!description) {
        alert("Please enter a transaction description.");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter an amount greater than zero.");
        return;
    }

    if (!category || !date) {
        alert("Please select a category and date.");
        return;
    }

    const submitButton = transactionForm.querySelector(
        'button[type="submit"]'
    );

    submitButton.disabled = true;

    try {
        const response = await fetch("/api/transactions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                description,
                amount,
                type,
                category,
                date
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to save transaction.");
        }

        // Add the record returned by the database.
        transactions.push(normalizeTransaction(data));

        renderTransactions();
        updateSummary();

        transactionForm.reset();
        dateInput.value = getTodayDate();
        descriptionInput.focus();
    } catch (error) {
        console.error("Error adding transaction:", error);
        alert(error.message || "Could not save transaction.");
    } finally {
        submitButton.disabled = false;
    }
});

/*....................Deleting a Transaction................*/


async function deleteTransaction(id) {
    try {
        const response = await fetch(
            `/api/transactions/${encodeURIComponent(id)}`,
            { method: "DELETE" }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to delete transaction.");
        }

        transactions = transactions.filter(function (transaction) {
            return String(transaction.id) !== String(id);
        });

        renderTransactions();
        updateSummary();
    } catch (error) {
        console.error("Error deleting transaction:", error);
        alert(error.message || "Could not delete transaction.");
    }
}

/* Initialize the page */

// Set today's date in the date input.
dateInput.value = getTodayDate();

// Load saved transactions from the database.
loadTransactions();