/**
 * FoodSave — Shared LocalStorage Database
 * ========================================
 * All pages import this file via <script src="db.js"></script>
 * It provides: FoodDB.prepared, FoodDB.consumed, FoodDB.waste, FoodDB.donations
 * Each namespace has: .getAll() .get(id) .add(obj) .update(id, obj) .delete(id)
 * All changes persist instantly to localStorage.
 */

const FoodDB = (() => {

  /* ── Seed data loaded once if the store is empty ── */
  const _today = new Date().toISOString().slice(0, 10);
  const _yday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);

  const SEEDS = {
    prepared: [
      { id: 'p1', name: 'Steamed Rice', notes: 'Long grain basmati', category: 'Grains', meal: 'Dinner', qty: 32, consumed: 24, date: _today, time: '18:00', staff: 'Ram Kumar', status: 'Served' },
      { id: 'p2', name: 'Dal Tadka', notes: 'Yellow moong dal', category: 'Dal', meal: 'Dinner', qty: 28, consumed: 24, date: _today, time: '18:00', staff: 'Sita Devi', status: 'Served' },
      { id: 'p3', name: 'Aloo Gobi', notes: 'Potato & cauliflower curry', category: 'Vegetables', meal: 'Lunch', qty: 22, consumed: 20, date: _today, time: '12:00', staff: 'Ram Kumar', status: 'Served' },
      { id: 'p4', name: 'Phulka Roti', notes: 'Whole wheat, fresh baked', category: 'Bread', meal: 'Lunch', qty: 30, consumed: 28, date: _today, time: '12:00', staff: 'Meena Rao', status: 'Served' },
      { id: 'p5', name: 'Poha', notes: 'Flattened rice with veggies', category: 'Grains', meal: 'Breakfast', qty: 20, consumed: 12, date: _today, time: '07:00', staff: 'Meena Rao', status: 'Partial' },
      { id: 'p6', name: 'Masala Chai', notes: 'Ginger cardamom tea', category: 'Drinks', meal: 'Breakfast', qty: 16, consumed: 16, date: _today, time: '07:00', staff: 'Sita Devi', status: 'Served' },
    ],
    consumed: [
      { id: 'c1', name: 'Poha', meal: 'Breakfast', preparedKg: 20, consumedKg: 12, students: 96, date: _today },
      { id: 'c2', name: 'Masala Chai', meal: 'Breakfast', preparedKg: 16, consumedKg: 16, students: 160, date: _today },
      { id: 'c3', name: 'Aloo Gobi', meal: 'Lunch', preparedKg: 22, consumedKg: 20, students: 210, date: _today },
      { id: 'c4', name: 'Phulka Roti', meal: 'Lunch', preparedKg: 30, consumedKg: 28, students: 280, date: _today },
      { id: 'c5', name: 'Steamed Rice', meal: 'Dinner', preparedKg: 32, consumedKg: 24, students: 240, date: _today },
      { id: 'c6', name: 'Dal Tadka', meal: 'Dinner', preparedKg: 28, consumedKg: 24, students: 240, date: _today },
    ],
    waste: [
      { id: 'w1', item: 'Leftover Poha', category: 'Grains', kg: 8, reason: 'Overproduced', date: _today, session: 'Breakfast', action: 'Donated', severity: 'Medium', recoverable: 3, time: '09:00', notes: '' },
      { id: 'w2', item: 'Cooked Rice', category: 'Grains', kg: 8, reason: 'Not consumed', date: _yday, session: 'Dinner', action: 'Discarded', severity: 'High', recoverable: 0, time: '21:00', notes: '' },
      { id: 'w3', item: 'Dal Tadka', category: 'Dal', kg: 4, reason: 'Overproduced', date: _today, session: 'Dinner', action: 'Donated', severity: 'Low', recoverable: 4, time: '21:00', notes: '' },
      { id: 'w4', item: 'Roti surplus', category: 'Bread', kg: 2, reason: 'End of service', date: _yday, session: 'Lunch', action: 'Donated', severity: 'Low', recoverable: 2, time: '14:00', notes: '' },
    ],
    donations: [
      { id: 'd1', ngo: 'Akshaya Patra', items: 'Rice, Dal', qty: 61, status: 'Complete', scheduledDate: _today, date: _today, contact: '9876543210' },
      { id: 'd2', ngo: 'Rotary Club', items: 'Poha', qty: 8, status: 'Pending', scheduledDate: _today, date: _today, contact: '9123456789' },
    ]
  };

  /* ── Core helpers ── */
  function _key(store) { return 'foodsave_' + store; }

  function _isStaleSeeds(store, data) {
    // Detect if data is the original hard-coded seed (old IDs, old date)
    const seedIds = { prepared: 'p1', consumed: 'c1', waste: 'w1', donations: 'd1' };
    const sid = seedIds[store];
    if (!sid) return false;
    const first = data.find(r => r.id === sid);
    if (!first) return false;
    const dateField = first.date || first.scheduledDate || '';
    return dateField !== _today;  // stale if not today
  }

  function _load(store) {
    try {
      const raw = localStorage.getItem(_key(store));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (_isStaleSeeds(store, parsed)) {
          // Auto-refresh stale seed data to today's dates
          _save(store, SEEDS[store] || []);
          return SEEDS[store] || [];
        }
        return parsed;
      }
    } catch (e) { }
    // First ever load — write seed data
    const seed = SEEDS[store] || [];
    _save(store, seed);
    return seed;
  }

  function _save(store, data) {
    localStorage.setItem(_key(store), JSON.stringify(data));
  }

  function _uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /* ── Factory: returns a namespace for a given store ── */
  function makeStore(store) {
    return {
      getAll() { return _load(store); },
      get(id) { return _load(store).find(r => r.id === id) || null; },
      add(obj) {
        const data = _load(store);
        const record = { id: _uid(), ...obj };
        data.unshift(record);           // newest first
        _save(store, data);
        return record;
      },
      update(id, changes) {
        const data = _load(store);
        const idx = data.findIndex(r => r.id === id);
        if (idx === -1) return null;
        data[idx] = { ...data[idx], ...changes };
        _save(store, data);
        return data[idx];
      },
      delete(id) {
        const data = _load(store).filter(r => r.id !== id);
        _save(store, data);
        return true;
      },
      /** Reset store to seed data (Danger Zone) */
      reset() { _save(store, SEEDS[store] || []); }
    };
  }

  return {
    prepared: makeStore('prepared'),
    consumed: makeStore('consumed'),
    waste: makeStore('waste'),
    donations: makeStore('donations'),
    /** Wipe all FoodSave stores */
    resetAll() {
      ['prepared', 'consumed', 'waste', 'donations'].forEach(s => makeStore(s).reset());
    }
  };
})();
