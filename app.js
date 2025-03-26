const SHEET_URL = "https://script.google.com/macros/s/AKfycbxIA4NATK_KkNcgeqIZx9S_WCbJVbUQ2HYc1PgEvufUFyGHQ0PiIlAwvafgNSxOuP1p/exec";

// IndexedDB setup
let db;
const request = indexedDB.open("PWAData", 1);
request.onupgradeneeded = event => {
    db = event.target.result;
    db.createObjectStore("data", { keyPath: "index" });
};
request.onsuccess = event => {
    db = event.target.result;
};

// Fetch and store data
async function fetchData() {
    try {
        const response = await fetch(SHEET_URL);
        const data = await response.json();
        storeDataInIndexedDB(data);
        return data;
    } catch {
        return getOfflineData();
    }
}

function storeDataInIndexedDB(data) {
    const transaction = db.transaction("data", "readwrite");
    const store = transaction.objectStore("data");
    store.clear();
    data.forEach(row => {
        store.put({ index: row[0], content: row });
    });
}

function getOfflineData() {
    return new Promise(resolve => {
        const transaction = db.transaction("data", "readonly");
        const store = transaction.objectStore("data");
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result.map(entry => entry.content));
    });
}

// Search functionality
async function search(query) {
    const data = await fetchData();
    const results = data.filter(row => row[1].toLowerCase().includes(query.toLowerCase()));
    displayResults(results);
}

function displayResults(results) {
    const resultsList = document.getElementById("searchResults");
    resultsList.innerHTML = "";
    results.forEach(row => {
        const li = document.createElement("li");
        li.textContent = row[1];
        li.onclick = () => displayData(row);
        resultsList.appendChild(li);
    });
}

function displayData(row) {
    const display = document.getElementById("dataDisplay");
    display.innerHTML = row.map((item, index) => `<p><strong>Column ${index + 1}:</strong> ${item}</p>`).join("<hr>");
}

document.getElementById("searchBox").addEventListener("input", event => {
    search(event.target.value);
});
