const API_URL = 'https://script.google.com/macros/s/AKfycbxwPYG9X2yVvvuJ2-HM9q1S8ouRroysoreYBLFtwv4xKb7Qtt-6sG2IKBu0gEjstbvf/exec'; 
let drugData = [];

// IndexedDB setup
const dbRequest = indexedDB.open("DrugInfoDB", 1);
dbRequest.onupgradeneeded = function(event) {
    let db = event.target.result;
    db.createObjectStore("drugs", { keyPath: "genericName" });
};
dbRequest.onsuccess = function(event) {
    loadFromIndexedDB();
};

// Fetch data from Google Sheets (Online Mode)
async function fetchData() {
    try {
        let response = await fetch(API_URL);
        drugData = await response.json();
        saveToIndexedDB(drugData);
    } catch (error) {
        console.error("Offline mode: Using IndexedDB");
    }
}

// Save data to IndexedDB
function saveToIndexedDB(data) {
    let db = dbRequest.result;
    let tx = db.transaction("drugs", "readwrite");
    let store = tx.objectStore("drugs");
    store.clear();
    data.forEach(item => store.put(item));
}

// Load data from IndexedDB (Offline Mode)
function loadFromIndexedDB() {
    let db = dbRequest.result;
    let tx = db.transaction("drugs", "readonly");
    let store = tx.objectStore("drugs");
    let request = store.getAll();
    request.onsuccess = function() {
        drugData = request.result;
    };
}

// Search Function
document.getElementById("searchBox").addEventListener("input", function() {
    let searchText = this.value.toLowerCase();
    let result = drugData.find(item => item.genericName.toLowerCase().includes(searchText));
    displayResult(result);
});

// Display Data
function displayResult(data) {
    if (!data) {
        document.getElementById("results").innerHTML = "No results found.";
        return;
    }
    document.getElementById("results").innerHTML = `
        <h2>${data.genericName}</h2>
        <p><strong>Brand:</strong> ${data.brand}</p>
        <p><strong>System/Group:</strong> ${data.systemGroup}</p>
        <p><strong>MDC:</strong> ${data.mdc}</p>
        <p><strong>NEML:</strong> ${data.neml}</p>
        <p><strong>Method of Purchase:</strong> ${data.purchaseMethod}</p>
        <p><strong>Category:</strong> ${data.category}</p>
        <p><strong>Indications:</strong> ${data.indications}</p>
        <p><strong>Prescribing Restrictions:</strong> ${data.restrictions}</p>
        <p><strong>Dosage:</strong> ${data.dosage}</p>
        <p><strong>Adverse Reactions:</strong> ${data.adverseReactions}</p>
        <p><strong>Contraindications:</strong> ${data.contraindications}</p>
        <p><strong>Interactions:</strong> ${data.interactions}</p>
        <p><strong>Precautions:</strong> ${data.precautions}</p>
    `;
}

// Load data on startup
fetchData();
