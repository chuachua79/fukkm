// Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(registration => console.log('SW registered'))
    .catch(err => console.log('SW registration failed: ', err));
}

// Cache the data from Google Sheets
let medicineData = [];

// Fetch data from Google Apps Script URL (replace with your URL)
async function fetchData() {
  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbyc0Q_Ydn75a4R0GJ0PBtjgAb6SVlnMddgThelHyVaDlWJCBrQ2aj-OinhmW3b5dnSo/exec');
    medicineData = await response.json();
    
    // Store in IndexedDB for offline use
    if ('indexedDB' in window) {
      const dbRequest = indexedDB.open('MedicineDB', 1);
      
      dbRequest.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('medicines')) {
          db.createObjectStore('medicines', { keyPath: 'Generic Name' });
        }
      };
      
      dbRequest.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction('medicines', 'readwrite');
        const store = transaction.objectStore('medicines');
        
        medicineData.forEach(item => {
          store.put(item);
        });
      };
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    // Try to load from IndexedDB if online fetch fails
    loadFromIndexedDB();
  }
}

function loadFromIndexedDB() {
  if ('indexedDB' in window) {
    const dbRequest = indexedDB.open('MedicineDB', 1);
    
    dbRequest.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction('medicines', 'readonly');
      const store = transaction.objectStore('medicines');
      const request = store.getAll();
      
      request.onsuccess = () => {
        medicineData = request.result;
      };
    };
  }
}

// Search function
function searchMedicine() {
  const searchTerm = document.getElementById('searchInput').value.trim();
  const resultsDiv = document.getElementById('results');
  
  if (!searchTerm) {
    resultsDiv.innerHTML = '<p>Please enter a generic name</p>';
    return;
  }
  
  const result = medicineData.find(item => 
    item['Generic Name'].toLowerCase() === searchTerm.toLowerCase()
  );
  
  if (result) {
    let html = '<div class="medicine-card">';
    for (const key in result) {
      if (key !== 'Generic Name' && result[key]) {
        html += `<p><strong>${key}:</strong> ${result[key]}</p>`;
      }
    }
    html += '</div>';
    resultsDiv.innerHTML = html;
  } else {
    resultsDiv.innerHTML = '<p>No medicine found with that generic name</p>';
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  fetchData();
  document.getElementById('searchBtn').addEventListener('click', searchMedicine);
});
