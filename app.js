const GAS_URL = "https://script.google.com/macros/s/AKfycbzLjhIp3nTTqykzGUozOt3V58svfZxysLqApgc5qLPK2yFc6vKYbHOulk-82dndbwjx/exec"; // Replace with your URL

// Initialize IndexedDB
const DB_NAME = "DrugDB";
const STORE_NAME = "Drugs";

function initDB() {
  return new Promise((resolve, reject) => {
    let request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      let db = event.target.result;
      db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Fetch and store data
async function fetchData() {
  try {
    let response = await fetch(GAS_URL);
    let data = await response.json();

    let db = await initDB();
    let tx = db.transaction(STORE_NAME, "readwrite");
    let store = tx.objectStore(STORE_NAME);
    store.clear(); // Clear old data
    store.put(data, "drugData");
  } catch (error) {
    console.log("Failed to fetch online. Using offline data.");
  }
}

// Search Function
async function searchDrug() {
  let searchInput = document.getElementById("search").value.trim().toLowerCase();
  if (!searchInput) return;

  let db = await initDB();
  let tx = db.transaction(STORE_NAME, "readonly");
  let store = tx.objectStore(STORE_NAME);
  let request = store.get("drugData");

  request.onsuccess = () => {
    let data = request.result;
    let result = data && data[searchInput] ? data[searchInput] : "Not Found";
    document.getElementById("result").innerHTML = formatResult(result);
  };
}

function formatResult(data) {
  if (data === "Not Found") return "<p>Drug not found.</p>";
  return Object.entries(data)
    .map(([key, value]) => `<p><b>${key}:</b> ${value}</p>`)
    .join("");
}

// Update data on load
fetchData();
