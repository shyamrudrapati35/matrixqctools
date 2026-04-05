const DB_NAME = "sub-route-db";
const DB_VERSION = 2;
/** IndexedDB object store name (table) for saved QC rows */
const STORE_NAME = "matrix-qc-rg";
const LEGACY_STORE_NAME = "measurements";

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const { oldVersion } = event;

      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, {
            keyPath: "id",
            autoIncrement: true,
          });
        }
        if (db.objectStoreNames.contains(LEGACY_STORE_NAME)) {
          const tx = event.target.transaction;
          const oldStore = tx.objectStore(LEGACY_STORE_NAME);
          const newStore = tx.objectStore(STORE_NAME);
          const getAllReq = oldStore.getAll();
          getAllReq.onsuccess = () => {
            const items = getAllReq.result ?? [];
            if (items.length === 0) {
              db.deleteObjectStore(LEGACY_STORE_NAME);
              return;
            }
            let pending = items.length;
            for (const item of items) {
              const { id: _id, ...rest } = item;
              const addReq = newStore.add(rest);
              addReq.onsuccess = addReq.onerror = () => {
                pending -= 1;
                if (pending === 0) {
                  db.deleteObjectStore(LEGACY_STORE_NAME);
                }
              };
            }
          };
        }
        return;
      }

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Removes every row from the `matrix-qc-rg` store for a specific category. */
export async function clearAllMeasurements(category = null) {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    let req;
    
    if (category) {
      // Clear only items with matching category
      req = store.getAll();
      req.onsuccess = () => {
        const items = req.result ?? [];
        let pending = items.filter(item => item.category === category).length;
        
        if (pending === 0) {
          db.close();
          resolve();
          return;
        }
        
        for (const item of items) {
          if (item.category === category) {
            const deleteReq = store.delete(item.id);
            deleteReq.onsuccess = deleteReq.onerror = () => {
              pending -= 1;
              if (pending === 0) {
                db.close();
                resolve();
              }
            };
          }
        }
      };
      req.onerror = () => reject(req.error);
    } else {
      // Clear all items
      req = store.clear();
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
    }
    
    tx.onerror = () => {
      reject(tx.error ?? req.error);
      db.close();
    };
    tx.onabort = () => {
      reject(tx.error ?? req.error);
      db.close();
    };
  });
}

export async function addMeasurement(measurement, category = null) {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    
    // Add category to measurement if provided
    const measurementWithCategory = category ? { ...measurement, category } : measurement;
    
    const req = store.add(measurementWithCategory);

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);

    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      reject(tx.error ?? req.error);
      db.close();
    };
    tx.onabort = () => {
      reject(tx.error ?? req.error);
      db.close();
    };
  });
}

export async function listMeasurements(category = null) {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const allItems = req.result ?? [];
      const filteredItems = category 
        ? allItems.filter(item => item.category === category)
        : allItems;
      resolve(filteredItems);
    };
    req.onerror = () => reject(req.error);

    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      reject(tx.error ?? req.error);
      db.close();
    };
    tx.onabort = () => {
      reject(tx.error ?? req.error);
      db.close();
    };
  });
}
