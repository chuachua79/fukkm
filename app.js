const SHEET_URL = "https://script.google.com/macros/s/AKfycbxIA4NATK_KkNcgeqIZx9S_WCbJVbUQ2HYc1PgEvufUFyGHQ0PiIlAwvafgNSxOuP1p/exec";

let db;

// Initialize IndexedDB
const request = indexedDB.open("PWAData", 1);
request.onupgradeneeded = event => {
    db = event.target.result;
    db.createObjectStore("data", { keyPath: "index" });
};
request.onsuccess = event => {
    db = event.target.result;
};
request.onerror = () => console.error("Failed to open IndexedDB");

// Fetch Data (Online → Save to IndexedDB → Return Data)
async function fetchData() {
    try {
        const response = await fetch(SHEET_URL);
        const data = await response.json();
        storeDataInIndexedDB(data);
        return data;
    } catch (error) {
        console.warn("Fetching online failed. Using offline data.", error);
        return getOfflineData();
    }
}

// Store Data in IndexedDB
function storeDataInIndexedDB(data) {
    if (!db) return console.warn("IndexedDB not ready yet.");
    const transaction = db.transaction("data", "readwrite");
    const store = transaction.objectStore("data");
    store.clear();
    data.forEach(row => store.put({ index: row[0], content: row }));
}

// Retrieve Data from IndexedDB (Offline Mode)
function getOfflineData() {
    return new Promise(resolve => {
        if (!db) return resolve([]);
        const transaction = db.transaction("data", "readonly");
        const store = transaction.objectStore("data");
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result.map(entry => entry.content));
        request.onerror = () => resolve([]);
    });
}

// Search Functionality
async function search(query) {
    const data = await fetchData();
    if (!data.length) {
        document.getElementById("searchResults").innerHTML = "<li>No data available</li>";
        return;
    }

    // Find closest match in column A (Index)
    const results = data.filter(row => row[1]?.toLowerCase().includes(query.toLowerCase())); // Adjust index if needed
    displayResults(results);
}

// Display Search Results
function displayResults(results) {
    const resultsList = document.getElementById("searchResults");
    resultsList.innerHTML = "";
    
    if (!results.length) {
        resultsList.innerHTML = "<li>No matches found</li>";
        return;
    }

    results.forEach(row => {
        const li = document.createElement("li");
        li.textContent = row[1]; // Assuming name is in column B
        li.onclick = () => displayData(row);
        resultsList.appendChild(li);
    });
}

// Display Full Data (A to N) When User Selects an Item
function displayData(row) {
    const display = document.getElementById("dataDisplay");
    display.innerHTML = "";

    const columnTitles = ["Index", "Name", "Field 3", "Field 4", "Field 5", "Field 6", "Field 7", "Field 8", "Field 9", "Field 10", "Field 11", "Field 12", "Field 13", "Field 14"]; // Adjust column names as needed

    row.forEach((item, index) => {
        const section = document.createElement("div");
        section.innerHTML = `<p><strong>${columnTitles[index]}:</strong></p><p>${item}</p><hr>`;
        display.appendChild(section);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const searchBox = document.getElementById("searchBox");
    if (searchBox) {
        searchBox.addEventListener("input", event => {
            search(event.target.value);
        });
    } else {
        console.error("Error: #searchBox element not found in HTML.");
    }
});


