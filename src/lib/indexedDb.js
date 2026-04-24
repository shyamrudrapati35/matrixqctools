const DB_NAME = "sub-route-db";
const DB_VERSION = 4;
const DEFAULT_CATEGORY = "rg";
const CATEGORIES = ["wtr", "rg", "temp", "dgu"];
const LEGACY_STORE_NAME = "measurements";
const DGU_MATERIAL_STORES = {
  "silinde mf 882": "dgu-material-silinde",
  "silande mf 882": "dgu-material-silinde",
  silinde: "dgu-material-silinde",
  silande: "dgu-material-silinde",
  "dowsil 982": "dgu-material-dowsil",
  dowsil: "dgu-material-dowsil",
};

function getStoreName(category) {
  const normalized = typeof category === "string" && category.trim() !== ""
    ? category.trim().toLowerCase()
    : DEFAULT_CATEGORY;
  return `matrix-qc-${normalized}`;
}

function getAllStoreNames() {
  return CATEGORIES.map(getStoreName);
}

function getDguMaterialStoreName(make) {
  const normalizedMake = (make || "").trim().toLowerCase();
  return DGU_MATERIAL_STORES[normalizedMake] || DGU_MATERIAL_STORES["silinde mf 882"];
}

function getAllDguMaterialStoreNames() {
  return Object.values(DGU_MATERIAL_STORES);
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const { oldVersion } = event;

      if (oldVersion < 2) {
        const defaultStore = getStoreName(DEFAULT_CATEGORY);
        if (!db.objectStoreNames.contains(defaultStore)) {
          db.createObjectStore(defaultStore, {
            keyPath: "id",
            autoIncrement: true,
          });
        }

        if (db.objectStoreNames.contains(LEGACY_STORE_NAME)) {
          const tx = event.target.transaction;
          const oldStore = tx.objectStore(LEGACY_STORE_NAME);
          const newStore = tx.objectStore(defaultStore);
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
      }

      if (oldVersion < 3) {
        for (const storeName of getAllStoreNames()) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, {
              keyPath: "id",
              autoIncrement: true,
            });
          }
        }
      }

      if (oldVersion < 4) {
        for (const storeName of getAllDguMaterialStoreNames()) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, {
              keyPath: "id",
              autoIncrement: true,
            });
          }
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllMeasurements(category = null) {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    if (category) {
      const storeName = getStoreName(category);
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const req = store.clear();

      req.onerror = () => reject(req.error);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        reject(tx.error ?? req.error);
        db.close();
      };
      tx.onabort = () => {
        reject(tx.error ?? req.error);
        db.close();
      };
      return;
    }

    const storeNames = getAllStoreNames();
    const tx = db.transaction(storeNames, "readwrite");

    for (const storeName of storeNames) {
      tx.objectStore(storeName).clear();
    }

    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      reject(tx.error);
      db.close();
    };
    tx.onabort = () => {
      reject(tx.error);
      db.close();
    };
  });
}

export async function deleteMeasurementsByIds(ids, category = null) {
  if (!Array.isArray(ids) || ids.length === 0) return;

  const db = await openDb();

  return new Promise((resolve, reject) => {
    const storeName = getStoreName(category);
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    for (const id of ids) {
      store.delete(id);
    }

    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      reject(tx.error);
      db.close();
    };
    tx.onabort = () => {
      reject(tx.error);
      db.close();
    };
  });
}

export async function addMeasurement(measurement, category = null) {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const storeName = getStoreName(category);
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const measurementWithCategory = category
      ? { ...measurement, category: category.trim().toLowerCase() }
      : measurement;

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
    if (category) {
      const storeName = getStoreName(category);
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result ?? []);
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
      return;
    }

    const storeNames = getAllStoreNames();
    const promises = storeNames.map((storeName) => {
      return new Promise((resolveStore, rejectStore) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.getAll();

        req.onsuccess = () => resolveStore(req.result ?? []);
        req.onerror = () => rejectStore(req.error);
      });
    });

    Promise.all(promises)
      .then((results) => {
        db.close();
        resolve(results.flat());
      })
      .catch((err) => {
        db.close();
        reject(err);
      });
  });
}

export async function saveDguMaterialBatch(make, values) {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const storeName = getDguMaterialStoreName(make);
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.add({
      time: new Date().toISOString(),
      make: make || "Silinde MF 882",
      base: values?.base?.trim?.() ?? "",
      catlist: values?.catlist?.trim?.() ?? "",
    });

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

export async function getLatestDguMaterialBatch(make) {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const storeName = getDguMaterialStoreName(make);
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.getAll();

    req.onsuccess = () => {
      const rows = req.result ?? [];
      if (rows.length === 0) {
        resolve(null);
        return;
      }

      const latest = [...rows].sort((a, b) => {
        const timeA = new Date(a.time).getTime();
        const timeB = new Date(b.time).getTime();
        return (Number.isNaN(timeB) ? 0 : timeB) - (Number.isNaN(timeA) ? 0 : timeA);
      })[0];

      resolve(latest ?? null);
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
