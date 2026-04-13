// ============================================================
// profile.js — File-backed profile store, item catalog, and market
// ============================================================

export const ACTIVE_USER_KEY = 'sdcio_active_user_v1';
export const API_BASE = '/api';
export const SAFEBOX_CAPACITY = 4;
export const MIN_TRADE_TOTAL = 10;
export const AMMO_PACK_LIMIT = 999;

export const RARITY_ORDER = ['red', 'gold', 'purple', 'blue', 'green', 'white', 'gray'];

export const RARITY_META = {
    red: { label: 'Red', color: '#ff4d4d', multiplier: 3.2 },
    gold: { label: 'Gold', color: '#ffca28', multiplier: 2.5 },
    purple: { label: 'Purple', color: '#b388ff', multiplier: 1.95 },
    blue: { label: 'Blue', color: '#64b5f6', multiplier: 1.5 },
    green: { label: 'Green', color: '#81c784', multiplier: 1.15 },
    white: { label: 'White', color: '#eceff1', multiplier: 1 },
    gray: { label: 'Gray', color: '#9e9e9e', multiplier: 1 }
};

export const CRATE_RARITY_ORDER = ['white', 'green', 'blue', 'purple', 'gold', 'red'];

export const RAID_DIFFICULTIES = {
    easy: { id: 'easy', label: 'Easy' },
    advanced: { id: 'advanced', label: 'Advanced' },
    hell: { id: 'hell', label: 'Hell' }
};

export const LOADOUT_SLOTS = ['gun', 'melee', 'armor', 'helmet', 'shoes', 'backpack'];
export const AMMO_DEFINITION_IDS = ['ammo_red', 'ammo_gold', 'ammo_purple', 'ammo_blue', 'ammo_green', 'ammo_white'];

const LEGACY_AMMO_AMOUNTS = {
    ammo_white: 1,
    ammo_green: 2,
    ammo_blue: 5,
    ammo_purple: 10,
    ammo_gold: 100,
    ammo_red: 25000,
};

export const ITEM_DEFS = {
    // ─── GUNS ───────────────────────────────────────────────
    g17: {
        id: 'g17', category: 'gun', rarity: 'gray',
        name: 'G17', description: 'Sidearm with a steady rhythm, 17-round magazine, and light recoil drift.',
        sellValue: 120,
        stats: { damage: 14, cooldown: 0.27, bulletSpeed: 500, range: 340, clipSize: 17, reloadTime: 1, spread: 0.075 }
    },
    as_val: {
        id: 'as_val', category: 'gun', rarity: 'gray',
        name: 'AS VAL', description: 'Suppressed rifle with 900 RPM fire rate, 45-round magazine, and wider spray.',
        sellValue: 240,
        stats: { damage: 10, cooldown: 60 / 900, bulletSpeed: 540, range: 436, clipSize: 45, reloadTime: 2, spread: 0.11 }
    },

    // ─── LOOT / AMMO ───────────────────────────────────────
    ammo_white: {
        id: 'ammo_white', category: 'loot', lootType: 'ammo', rarity: 'gray',
        name: 'Gray Ammo', description: 'Low-grade gray ammo. Damage x0.8.',
        sellValue: 1,
        ammoAmount: 1,
        damageMultiplier: 0.8,
    },
    ammo_green: {
        id: 'ammo_green', category: 'loot', lootType: 'ammo', rarity: 'green',
        name: 'Green Ammo', description: 'Standard green ammo. Damage x1.0.',
        sellValue: 8,
        ammoAmount: 1,
        damageMultiplier: 1,
    },
    ammo_blue: {
        id: 'ammo_blue', category: 'loot', lootType: 'ammo', rarity: 'blue',
        name: 'Blue Ammo', description: 'Improved blue ammo. Damage x1.05.',
        sellValue: 250,
        ammoAmount: 1,
        damageMultiplier: 1.05,
    },
    ammo_purple: {
        id: 'ammo_purple', category: 'loot', lootType: 'ammo', rarity: 'purple',
        name: 'Purple Ammo', description: 'High-end purple ammo. Damage x1.2.',
        sellValue: 5000,
        ammoAmount: 1,
        damageMultiplier: 1.2,
    },
    ammo_gold: {
        id: 'ammo_gold', category: 'loot', lootType: 'ammo', rarity: 'gold',
        name: 'Gold Ammo', description: 'Elite gold ammo. Damage x1.4.',
        sellValue: 25000,
        ammoAmount: 1,
        damageMultiplier: 1.4,
    },
    ammo_red: {
        id: 'ammo_red', category: 'loot', lootType: 'ammo', rarity: 'red',
        name: 'Red Ammo', description: 'Experimental red ammo. Instantly kills any target.',
        sellValue: 1000000,
        ammoAmount: 1,
        damageMultiplier: 999999,
        instantKill: true,
    },

    // ─── MELEE ──────────────────────────────────────────────
    field_knife: {
        id: 'field_knife', category: 'melee', rarity: 'white',
        name: 'Field Knife', description: 'Basic close-quarters blade.',
        sellValue: 80,
        stats: { meleeDamage: 24, meleeCooldown: 0.42 }
    },
    breach_hatchet: {
        id: 'breach_hatchet', category: 'melee', rarity: 'green',
        name: 'Breach Hatchet', description: 'Reliable utility hatchet.',
        sellValue: 110,
        stats: { meleeDamage: 30, meleeCooldown: 0.4 }
    },
    ion_blade: {
        id: 'ion_blade', category: 'melee', rarity: 'blue',
        name: 'Ion Blade', description: 'Light blade with quick recovery.',
        sellValue: 180,
        stats: { meleeDamage: 34, meleeCooldown: 0.34 }
    },
    revenant_machete: {
        id: 'revenant_machete', category: 'melee', rarity: 'purple',
        name: 'Revenant Machete', description: 'Heavy finishing blade.',
        sellValue: 260,
        stats: { meleeDamage: 42, meleeCooldown: 0.36 }
    },
    wraith_katana: {
        id: 'wraith_katana', category: 'melee', rarity: 'gold',
        name: 'Wraith Katana', description: 'Elegant high-damage blade for elite operatives.',
        sellValue: 380,
        stats: { meleeDamage: 50, meleeCooldown: 0.3 }
    },
    doom_cleaver: {
        id: 'doom_cleaver', category: 'melee', rarity: 'red',
        name: 'Doom Cleaver', description: 'Prototype heavy weapon that obliterates anything in range.',
        sellValue: 550,
        stats: { meleeDamage: 68, meleeCooldown: 0.38 }
    },

    // ─── ARMOR ──────────────────────────────────────────────
    cloth_vest: {
        id: 'cloth_vest', category: 'armor', rarity: 'white',
        name: 'Cloth Vest', description: 'Minimal torso protection.',
        sellValue: 90,
        modifiers: { maxHp: 10 }
    },
    kevlar_weave: {
        id: 'kevlar_weave', category: 'armor', rarity: 'green',
        name: 'Kevlar Weave', description: 'Standard-issue ballistic protection.',
        sellValue: 150,
        modifiers: { maxHp: 18 }
    },
    ranger_plate: {
        id: 'ranger_plate', category: 'armor', rarity: 'blue',
        name: 'Ranger Plate', description: 'Balanced combat vest.',
        sellValue: 220,
        modifiers: { maxHp: 28 }
    },
    warden_vest: {
        id: 'warden_vest', category: 'armor', rarity: 'purple',
        name: 'Warden Vest', description: 'Heavy-duty protection for high-threat zones.',
        sellValue: 310,
        modifiers: { maxHp: 40 }
    },
    titan_rig: {
        id: 'titan_rig', category: 'armor', rarity: 'gold',
        name: 'Titan Rig', description: 'Heavy armor for frontline raids.',
        sellValue: 390,
        modifiers: { maxHp: 52 }
    },
    bastion_plate: {
        id: 'bastion_plate', category: 'armor', rarity: 'red',
        name: 'Bastion Plate', description: 'Experimental exo-armor with maximum protection.',
        sellValue: 580,
        modifiers: { maxHp: 72 }
    },

    // ─── HELMETS ────────────────────────────────────────────
    scout_cap: {
        id: 'scout_cap', category: 'helmet', rarity: 'white',
        name: 'Scout Cap', description: 'Light head cover.',
        sellValue: 70,
        modifiers: { maxHp: 6 }
    },
    recon_helmet: {
        id: 'recon_helmet', category: 'helmet', rarity: 'green',
        name: 'Recon Helmet', description: 'Standard issue tactical helmet.',
        sellValue: 140,
        modifiers: { maxHp: 14 }
    },
    sentinel_helm: {
        id: 'sentinel_helm', category: 'helmet', rarity: 'blue',
        name: 'Sentinel Helm', description: 'Reinforced helmet with side protection.',
        sellValue: 200,
        modifiers: { maxHp: 20 }
    },
    eclipse_visor: {
        id: 'eclipse_visor', category: 'helmet', rarity: 'purple',
        name: 'Eclipse Visor', description: 'Enhanced visor with reinforced shell.',
        sellValue: 250,
        modifiers: { maxHp: 24 }
    },
    fortress_mask: {
        id: 'fortress_mask', category: 'helmet', rarity: 'gold',
        name: 'Fortress Mask', description: 'Full-face tactical helmet with blast shielding.',
        sellValue: 360,
        modifiers: { maxHp: 36 }
    },
    phantom_crown: {
        id: 'phantom_crown', category: 'helmet', rarity: 'red',
        name: 'Phantom Crown', description: 'Prototype adaptive helmet with integrated HUD.',
        sellValue: 520,
        modifiers: { maxHp: 48 }
    },

    // ─── SHOES ──────────────────────────────────────────────
    trail_shoes: {
        id: 'trail_shoes', category: 'shoes', rarity: 'white',
        name: 'Trail Shoes', description: 'Plain footwear for basic mobility.',
        sellValue: 60,
        modifiers: { speed: 10 }
    },
    runner_boots: {
        id: 'runner_boots', category: 'shoes', rarity: 'green',
        name: 'Runner Boots', description: 'Reliable movement boost.',
        sellValue: 120,
        modifiers: { speed: 20 }
    },
    phase_greaves: {
        id: 'phase_greaves', category: 'shoes', rarity: 'blue',
        name: 'Phase Greaves', description: 'Fast boots for quick disengages.',
        sellValue: 200,
        modifiers: { speed: 32 }
    },
    phantom_sprinters: {
        id: 'phantom_sprinters', category: 'shoes', rarity: 'purple',
        name: 'Phantom Sprinters', description: 'Ultra-light boots for rapid extraction.',
        sellValue: 280,
        modifiers: { speed: 44 }
    },
    blitz_treads: {
        id: 'blitz_treads', category: 'shoes', rarity: 'gold',
        name: 'Blitz Treads', description: 'High-performance boots with shock absorption.',
        sellValue: 370,
        modifiers: { speed: 56 }
    },
    warp_drivers: {
        id: 'warp_drivers', category: 'shoes', rarity: 'red',
        name: 'Warp Drivers', description: 'Experimental exo-boots that defy physics.',
        sellValue: 520,
        modifiers: { speed: 72 }
    },

    // ─── BACKPACKS ──────────────────────────────────────────
    sling_pack: {
        id: 'sling_pack', category: 'backpack', rarity: 'white',
        name: 'Sling Pack', description: 'Small pack with limited carrying space.',
        sellValue: 75,
        modifiers: { carrySlots: 3 }
    },
    scout_pack: {
        id: 'scout_pack', category: 'backpack', rarity: 'green',
        name: 'Scout Pack', description: 'Compact backpack for efficient loot runs.',
        sellValue: 130,
        modifiers: { carrySlots: 5 }
    },
    mule_pack: {
        id: 'mule_pack', category: 'backpack', rarity: 'blue',
        name: 'Mule Pack', description: 'Larger backpack for bigger hauls.',
        sellValue: 220,
        modifiers: { carrySlots: 8 }
    },
    siege_rucksack: {
        id: 'siege_rucksack', category: 'backpack', rarity: 'purple',
        name: 'Siege Rucksack', description: 'Tactical rucksack built for extended operations.',
        sellValue: 300,
        modifiers: { carrySlots: 11 }
    },
    cargo_titan: {
        id: 'cargo_titan', category: 'backpack', rarity: 'gold',
        name: 'Cargo Titan', description: 'Heavy-duty hauler with reinforced compartments.',
        sellValue: 400,
        modifiers: { carrySlots: 14 }
    },
    void_satchel: {
        id: 'void_satchel', category: 'backpack', rarity: 'red',
        name: 'Void Satchel', description: 'Prototype pack with huge haul capacity.',
        sellValue: 480,
        modifiers: { carrySlots: 18 }
    },

    // ─── CONSUMABLES ────────────────────────────────────────
    field_bandage: {
        id: 'field_bandage', category: 'consumable', rarity: 'white',
        name: 'Field Bandage', description: 'Basic gauze wrap. Restores 20 HP.',
        sellValue: 30,
        healAmount: 20
    },
    med_kit: {
        id: 'med_kit', category: 'consumable', rarity: 'green',
        name: 'Med Kit', description: 'Standard first aid kit. Restores 35 HP.',
        sellValue: 80,
        healAmount: 35
    },
    stim_syringe: {
        id: 'stim_syringe', category: 'consumable', rarity: 'blue',
        name: 'Stim Syringe', description: 'Fast-acting combat stimulant. Restores 50 HP.',
        sellValue: 200,
        healAmount: 50
    },
    combat_medic_pack: {
        id: 'combat_medic_pack', category: 'consumable', rarity: 'purple',
        name: 'Combat Medic Pack', description: 'Advanced field surgical kit. Restores 70 HP.',
        sellValue: 400,
        healAmount: 70
    },
    regen_injector: {
        id: 'regen_injector', category: 'consumable', rarity: 'gold',
        name: 'Regen Injector', description: 'Nanobots that slowly regen health. Restores 100 HP + 2 HP/sec for 15 sec.',
        sellValue: 800,
        healAmount: 100,
        regenPerSecond: 2,
        regenDuration: 15
    },
    nano_serum: {
        id: 'nano_serum', category: 'consumable', rarity: 'red',
        name: 'Nano Serum', description: 'Experimental full-body nano-repair. Fully restores HP and energy.',
        sellValue: 5000,
        healAmount: -1,  // -1 = full heal
        restoreEnergy: true
    }
};

export const STARTER_LOADOUT = { gun: 'g17', melee: 'field_knife', armor: 'cloth_vest', helmet: 'scout_cap', shoes: 'trail_shoes', backpack: 'sling_pack' };
export const STARTER_STASH = Object.values(STARTER_LOADOUT).map((id) => ({ definitionId: id }));

// Crate tiers — each crate type draws from a weighted rarity pool
export const CRATE_TIERS = {
    supply: {
        label: 'Supply Crate',
        description: 'Common field supplies — mostly white and green gear.',
        pool: ['white', 'white', 'white', 'green', 'green', 'blue'],
        itemCount: { min: 2, max: 4 },
        color: '#8d6e63'
    },
    tactical: {
        label: 'Tactical Crate',
        description: 'Military-grade equipment — blue to purple quality.',
        pool: ['green', 'blue', 'blue', 'purple', 'purple', 'gold'],
        itemCount: { min: 2, max: 4 },
        color: '#5c6bc0'
    },
    elite: {
        label: 'Elite Crate',
        description: 'High-value cache — purple, gold, and rare red items.',
        pool: ['blue', 'purple', 'gold', 'gold', 'red', 'red'],
        itemCount: { min: 1, max: 3 },
        color: '#c62828'
    }
};

const LOOT_POOLS = {
    0: ['white', 'white', 'green', 'green', 'blue'],
    1: ['green', 'green', 'blue', 'blue', 'purple', 'gold'],
    2: ['blue', 'purple', 'purple', 'gold', 'gold', 'red']
};

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

async function apiFetch(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options
    });
    const data = await response.json();
    if (!response.ok || data.ok === false) {
        throw new Error(data.message || 'Request failed.');
    }
    return data;
}

export function getItemDefinition(id) {
    return ITEM_DEFS[id] || null;
}

export function getItemValue(definitionId) {
    return ITEM_DEFS[definitionId]?.sellValue || 0;
}

export function getBuyTradeTotal(definitionId, quantity = 1) {
    const amount = Math.max(1, Math.floor(Number(quantity) || 0));
    return Math.ceil(getItemValue(definitionId) * amount * 1.1);
}

export function getSellTradeTotal(definitionId, quantity = 1) {
    const amount = Math.max(1, Math.floor(Number(quantity) || 0));
    return Math.floor(getItemValue(definitionId) * amount * 0.9);
}

export function getMinimumTradeQuantity(definitionId, mode = 'buy') {
    const value = getItemValue(definitionId);
    if (value <= 0) return Infinity;
    for (let quantity = 1; quantity <= 100000; quantity++) {
        const total = mode === 'sell'
            ? getSellTradeTotal(definitionId, quantity)
            : getBuyTradeTotal(definitionId, quantity);
        if (total >= MIN_TRADE_TOTAL) return quantity;
    }
    return Infinity;
}

export function isEquipmentCategory(category) {
    return LOADOUT_SLOTS.includes(category);
}

export function isLootCategory(category) {
    return category === 'loot';
}

export function isAmmoDefinition(definitionId) {
    return definitionId in LEGACY_AMMO_AMOUNTS || ITEM_DEFS[definitionId]?.lootType === 'ammo';
}

export function getAmmoAmountForDefinition(definitionId) {
    return LEGACY_AMMO_AMOUNTS[definitionId] || ITEM_DEFS[definitionId]?.ammoAmount || 0;
}

export function getAmmoAmountForEntry(entry) {
    if (!entry || !isAmmoDefinition(entry.definitionId)) return 0;
    return Math.max(1, Math.floor(Number(entry.quantity) || getAmmoAmountForDefinition(entry.definitionId) || 1));
}

export function getAmmoCountForProfile(profile, definitionId) {
    if (isFreeFallbackAmmo(definitionId)) {
        return 0;
    }
    const stashAmmo = profile?.stashAmmo;
    if (typeof stashAmmo === 'number') {
        return 0;
    }
    if (!stashAmmo || typeof stashAmmo !== 'object') {
        return 0;
    }
    return Math.max(0, Math.floor(Number(stashAmmo[definitionId]) || 0));
}

export function getStashAmmoMap(profile) {
    const ammoMap = {};
    for (const definitionId of AMMO_DEFINITION_IDS) {
        const count = getAmmoCountForProfile(profile, definitionId);
        if (count > 0) {
            ammoMap[definitionId] = count;
        }
    }
    return ammoMap;
}

export function getAmmoAmountForEntries(entries = []) {
    return entries.reduce((sum, entry) => sum + getAmmoAmountForEntry(entry), 0);
}

export function packAmmoAmount(definitionId, amount) {
    let remaining = Math.max(0, Math.floor(amount || 0));
    const packed = [];
    while (remaining > 0) {
        const quantity = Math.min(AMMO_PACK_LIMIT, remaining);
        packed.push({ definitionId, quantity });
        remaining -= quantity;
    }
    return packed;
}

export function getTotalAmmoForProfile(profile) {
    return Object.values(getStashAmmoMap(profile)).reduce((sum, count) => sum + count, 0);
}

export function getRarityMeta(rarity) {
    return RARITY_META[rarity] || RARITY_META.white;
}

export function getCrateTierMeta(rarity) {
    const meta = getRarityMeta(rarity);
    return {
        key: rarity,
        label: `${meta.label} Crate`,
        color: meta.color,
    };
}

export function getSlotLabel(slot) {
    return slot.charAt(0).toUpperCase() + slot.slice(1);
}

export function getOwnedCounts(profile) {
    const counts = {};
    for (const entry of profile.stashItems || []) {
        counts[entry.definitionId] = (counts[entry.definitionId] || 0) + 1;
    }
    const stashAmmoMap = getStashAmmoMap(profile);
    for (const [definitionId, amount] of Object.entries(stashAmmoMap)) {
        counts[definitionId] = (counts[definitionId] || 0) + amount;
    }
    return counts;
}

export function getOwnedItemsByCategory(profile, category) {
    const counts = getOwnedCounts(profile);
    return Object.entries(counts)
        .map(([definitionId, count]) => ({ definition: ITEM_DEFS[definitionId], count }))
        .filter(({ definition }) => definition?.category === category)
        .sort((a, b) => RARITY_ORDER.indexOf(a.definition.rarity) - RARITY_ORDER.indexOf(b.definition.rarity));
}

export function getItemImagePath(definitionId) {
    return `assets/items/${definitionId}.png`;
}

function defaultLoadout() {
    return { ...STARTER_LOADOUT };
}

function defaultStash() {
    return clone(STARTER_STASH);
}

export function createDefaultProfile(username = 'Guest Operative', isGuest = false) {
    return {
        username,
        isGuest,
        password: '',
        coins: 0,
        loadout: defaultLoadout(),
        stashItems: defaultStash(),
        stashAmmo: {},
        backpackItems: [],
        safeboxItems: [],
        extractedRuns: [],
        stats: { totalRuns: 0, totalExtractions: 0, totalKills: 0, totalCoinsEarned: 0, totalMarketTrades: 0 }
    };
}

function normalizePersistentEntry(entry) {
    if (!entry) return [];
    const definitionId = entry.definitionId || entry;
    if (isAmmoDefinition(definitionId)) {
        if (isFreeFallbackAmmo(definitionId)) return [];
        return packAmmoAmount(definitionId, getAmmoAmountForEntry({ definitionId, quantity: entry.quantity }));
    }
    if (!ITEM_DEFS[definitionId]) return [];
    return [{ definitionId }];
}

function normalizePersistentEntries(entries = [], maxLength = Infinity) {
    const normalized = [];
    for (const entry of entries) {
        normalized.push(...normalizePersistentEntry(entry));
        if (normalized.length >= maxLength) break;
    }
    return normalized.slice(0, maxLength);
}

function getLegacyAmmoFromStashEntries(entries = []) {
    const ammoMap = {};
    for (const entry of entries) {
        if (!isAmmoDefinition(entry.definitionId)) continue;
        const definitionId = ITEM_DEFS[entry.definitionId] ? entry.definitionId : 'ammo_white';
        ammoMap[definitionId] = (ammoMap[definitionId] || 0) + getAmmoAmountForEntry(entry);
    }
    return ammoMap;
}

function normalizeStashAmmo(stashAmmo, legacyEntries = []) {
    const normalized = {};
    if (stashAmmo && typeof stashAmmo === 'object') {
        for (const definitionId of AMMO_DEFINITION_IDS) {
            if (isFreeFallbackAmmo(definitionId)) continue;
            const count = Math.max(0, Math.floor(Number(stashAmmo[definitionId]) || 0));
            if (count > 0) {
                normalized[definitionId] = count;
            }
        }
    }

    const legacyAmmo = getLegacyAmmoFromStashEntries(legacyEntries);
    for (const [definitionId, count] of Object.entries(legacyAmmo)) {
        if (isFreeFallbackAmmo(definitionId)) continue;
        normalized[definitionId] = (normalized[definitionId] || 0) + count;
    }
    return normalized;
}

function addAmmoToProfile(profile, definitionId, amount) {
    if (!isAmmoDefinition(definitionId) || isFreeFallbackAmmo(definitionId)) return;
    const nextAmount = Math.max(0, Math.floor(Number(amount) || 0));
    const current = getAmmoCountForProfile(profile, definitionId);
    profile.stashAmmo = { ...getStashAmmoMap(profile), [definitionId]: current + nextAmount };
}

function removeAmmoFromProfile(profile, definitionId, amount) {
    if (!isAmmoDefinition(definitionId) || isFreeFallbackAmmo(definitionId)) return;
    const nextMap = { ...getStashAmmoMap(profile) };
    const current = nextMap[definitionId] || 0;
    const remaining = Math.max(0, current - Math.max(0, Math.floor(Number(amount) || 0)));
    if (remaining > 0) {
        nextMap[definitionId] = remaining;
    } else {
        delete nextMap[definitionId];
    }
    profile.stashAmmo = nextMap;
}

function removeOneDefinitionFromStash(profile, definitionId) {
    const stash = profile.stashItems || [];
    const index = stash.findIndex((item) => item.definitionId === definitionId);
    if (index !== -1) {
        stash.splice(index, 1);
        return true;
    }
    return false;
}

function rollLoss(probability) {
    return Math.random() < probability;
}

function isMarketLockedAmmo(definitionId) {
    return definitionId === 'ammo_white';
}

function isFreeFallbackAmmo(definitionId) {
    return definitionId === 'ammo_white';
}

function applyDeathLosses(profile, difficulty = 'advanced') {
    if (!profile) return;

    if (difficulty === 'easy') {
        return;
    }

    const equippedDefinitions = LOADOUT_SLOTS.reduce((entries, slot) => {
        const definitionId = profile.loadout?.[slot];
        if (!definitionId || !ITEM_DEFS[definitionId]) return entries;
        entries.push({ slot, definitionId });
        return entries;
    }, []);

    if (difficulty === 'hell') {
        for (const { definitionId } of equippedDefinitions) {
            removeOneDefinitionFromStash(profile, definitionId);
        }
        return;
    }

    const gunEntry = equippedDefinitions.find((entry) => entry.slot === 'gun');
    if (gunEntry) {
        removeOneDefinitionFromStash(profile, gunEntry.definitionId);
    }

    for (const entry of equippedDefinitions) {
        if (entry.slot === 'gun') continue;
        if (rollLoss(0.15)) {
            removeOneDefinitionFromStash(profile, entry.definitionId);
        }
    }
}

function normalizeLoadout(loadout, stashItems) {
    const counts = {};
    for (const item of stashItems) counts[item.definitionId] = (counts[item.definitionId] || 0) + 1;

    const next = {};
    for (const slot of LOADOUT_SLOTS) {
        const candidate = loadout?.[slot];
        const fallback = STARTER_LOADOUT[slot];
        next[slot] = ITEM_DEFS[candidate]?.category === slot && counts[candidate] > 0 ? candidate : fallback;
        if (!counts[next[slot]]) {
            stashItems.push({ definitionId: next[slot] });
            counts[next[slot]] = 1;
        }
    }
    return next;
}

export function normalizeProfile(profile, fallbackName = 'Guest Operative', isGuest = false) {
    const base = createDefaultProfile(fallbackName, isGuest);
    const rawStashItems = Array.isArray(profile?.stashItems) && profile.stashItems.length
        ? profile.stashItems
        : defaultStash();
    const stashItems = rawStashItems.filter((entry) => ITEM_DEFS[entry.definitionId] && !isAmmoDefinition(entry.definitionId));
    const stashAmmo = normalizeStashAmmo(profile?.stashAmmo, rawStashItems.filter((entry) => isAmmoDefinition(entry.definitionId)));
    const backpackItems = Array.isArray(profile?.backpackItems)
        ? normalizePersistentEntries(profile.backpackItems)
        : [];
    const safeboxItems = Array.isArray(profile?.safeboxItems)
        ? normalizePersistentEntries(profile.safeboxItems, SAFEBOX_CAPACITY)
        : [];

    return {
        ...base,
        ...profile,
        isGuest,
        stashItems,
        stashAmmo,
        backpackItems,
        safeboxItems,
        loadout: normalizeLoadout(profile?.loadout, stashItems),
        extractedRuns: Array.isArray(profile?.extractedRuns) ? profile.extractedRuns : [],
        stats: { ...base.stats, ...(profile?.stats || {}) }
    };
}

export function summarizeProfile(profile) {
    const lastRun = profile.extractedRuns[0] || null;
    return {
        coins: profile.coins,
        extractedRuns: profile.extractedRuns.length,
        lastExtractItemCount: lastRun?.items?.length || 0,
        loadoutNames: LOADOUT_SLOTS.map((slot) => ITEM_DEFS[profile.loadout[slot]]?.name || 'Empty')
    };
}

export function getProfileInventoryValue(profile) {
    const sumEntryValues = (entries = []) => entries.reduce((sum, entry) => {
        const definition = ITEM_DEFS[entry.definitionId];
        if (!definition) return sum;
        if (isAmmoDefinition(entry.definitionId)) {
            return sum + (definition.sellValue * getAmmoAmountForEntry(entry));
        }
        return sum + definition.sellValue;
    }, 0);

    const stashAmmoValue = Object.entries(getStashAmmoMap(profile)).reduce((sum, [definitionId, count]) => {
        const definition = ITEM_DEFS[definitionId];
        return sum + ((definition?.sellValue || 0) * count);
    }, 0);

    return (profile?.coins || 0)
        + sumEntryValues(profile?.stashItems || [])
        + stashAmmoValue
        + sumEntryValues(profile?.backpackItems || [])
        + sumEntryValues(profile?.safeboxItems || []);
}

export function getStashSummary(profile) {
    const summary = { items: 0 };
    for (const rarity of RARITY_ORDER) summary[rarity] = 0;
    for (const item of profile.stashItems || []) {
        const definition = ITEM_DEFS[item.definitionId];
        if (!definition) continue;
        summary.items += 1;
        summary[definition.rarity] += 1;
    }
    const stashAmmoMap = getStashAmmoMap(profile);
    for (const [definitionId, amount] of Object.entries(stashAmmoMap)) {
        const definition = ITEM_DEFS[definitionId];
        if (!definition || amount <= 0) continue;
        summary.items += amount;
        summary[definition.rarity] += amount;
    }
    return summary;
}

export function getSafeboxSummary(profile) {
    return {
        used: (profile.safeboxItems || []).length,
        capacity: SAFEBOX_CAPACITY,
    };
}

export function createLootItem(definitionId, options = {}) {
    const definition = ITEM_DEFS[definitionId];
    if (!definition) return null;
    const quantity = isAmmoDefinition(definitionId)
        ? Math.max(1, Math.min(AMMO_PACK_LIMIT, Math.floor(Number(options.quantity) || 1)))
        : null;
    return {
        id: `${definitionId}-${Math.floor(Math.random() * 1000000000)}`,
        definitionId,
        name: quantity ? `${definition.name} x${quantity}` : definition.name,
        category: definition.category,
        rarity: definition.rarity,
        sellValue: quantity ? definition.sellValue * quantity : definition.sellValue,
        description: quantity ? `${definition.name} pack containing ${quantity} round${quantity === 1 ? '' : 's'}.` : definition.description,
        quantity: quantity || undefined,
        stats: clone(definition.stats || {}),
        modifiers: clone(definition.modifiers || {})
    };
}

export function createPersistentEntryFromLootItem(item) {
    if (!item?.definitionId || !ITEM_DEFS[item.definitionId]) return null;
    if (isAmmoDefinition(item.definitionId)) {
        if (isFreeFallbackAmmo(item.definitionId)) return null;
        return { definitionId: item.definitionId, quantity: getAmmoAmountForEntry(item) };
    }
    return { definitionId: item.definitionId };
}

export function createLootItemsForCrateTier(tierKey) {
    const tier = CRATE_TIERS[tierKey];
    if (!tier) return createLootItemsForZone(0, 3);
    const itemIds = Object.keys(ITEM_DEFS);
    const count = tier.itemCount.min + Math.floor(Math.random() * (tier.itemCount.max - tier.itemCount.min + 1));
    const items = [];
    for (let i = 0; i < count; i++) {
        const rarity = tier.pool[Math.floor(Math.random() * tier.pool.length)];
        const candidates = itemIds.filter((id) => ITEM_DEFS[id].rarity === rarity);
        const picked = candidates[Math.floor(Math.random() * candidates.length)] || itemIds[0];
        items.push(createLootItem(picked));
    }
    return items.filter(Boolean);
}

function pickWeighted(items) {
    const total = items.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * total;
    for (const entry of items) {
        roll -= entry.weight;
        if (roll <= 0) return entry.value;
    }
    return items[items.length - 1]?.value;
}

function getCrateItemCount(crateRarity) {
    switch (crateRarity) {
        case 'white': return { min: 2, max: 4 };
        case 'green': return { min: 2, max: 4 };
        case 'blue': return { min: 2, max: 4 };
        case 'purple': return { min: 2, max: 4 };
        case 'gold': return { min: 1, max: 3 };
        case 'red': return { min: 1, max: 2 };
        default: return { min: 2, max: 4 };
    }
}

function getCrateDropRarity(crateRarity) {
    if (crateRarity === 'red') {
        return pickWeighted([
            { value: 'red', weight: 0.9 },
            { value: 'gold', weight: 0.1 }
        ]);
    }

    const baseIndex = CRATE_RARITY_ORDER.indexOf(crateRarity);
    if (baseIndex === -1) return crateRarity;

    const weighted = [{ value: crateRarity, weight: 0.88 }];
    if (CRATE_RARITY_ORDER[baseIndex + 1]) {
        weighted.push({ value: CRATE_RARITY_ORDER[baseIndex + 1], weight: 0.1 });
    }
    if (CRATE_RARITY_ORDER[baseIndex + 2]) {
        weighted.push({ value: CRATE_RARITY_ORDER[baseIndex + 2], weight: 0.02 });
    }
    return pickWeighted(weighted);
}

export function createLootItemsForCrateRarity(crateRarity) {
    const countRange = getCrateItemCount(crateRarity);
    const count = countRange.min + Math.floor(Math.random() * (countRange.max - countRange.min + 1));
    const itemIds = Object.keys(ITEM_DEFS).filter((id) => ITEM_DEFS[id].category !== 'loot');
    const items = [];

    for (let i = 0; i < count; i++) {
        const rarity = getCrateDropRarity(crateRarity);
        const candidates = itemIds.filter((id) => ITEM_DEFS[id].rarity === rarity);
        const picked = candidates[Math.floor(Math.random() * candidates.length)] || itemIds[0];
        items.push(createLootItem(picked));
    }

    return items.filter(Boolean);
}

export function createLootItemsForZone(zone, count) {
    const pool = LOOT_POOLS[zone] || LOOT_POOLS[0];
    const itemIds = Object.keys(ITEM_DEFS);
    const items = [];
    for (let i = 0; i < count; i++) {
        const rarity = pool[Math.floor(Math.random() * pool.length)];
        const candidates = itemIds.filter((id) => ITEM_DEFS[id].rarity === rarity);
        const picked = candidates[Math.floor(Math.random() * candidates.length)] || itemIds[0];
        items.push(createLootItem(picked));
    }
    return items.filter(Boolean);
}

export class ProfileStore {
    constructor() {
        this.activeUsername = localStorage.getItem(ACTIVE_USER_KEY) || null;
        this.currentProfile = normalizeProfile(createDefaultProfile(), 'Guest Operative', true);
    }

    async init() {
        if (!this.activeUsername) {
            this.currentProfile = normalizeProfile(createDefaultProfile(), 'Guest Operative', true);
            return this.getCurrentProfile();
        }
        try {
            const result = await apiFetch(`/profile?username=${encodeURIComponent(this.activeUsername)}`);
            this.activeUsername = result.profile.username;
            localStorage.setItem(ACTIVE_USER_KEY, this.activeUsername);
            this.currentProfile = normalizeProfile(result.profile, this.activeUsername, false);
        } catch {
            this.activeUsername = null;
            localStorage.removeItem(ACTIVE_USER_KEY);
            this.currentProfile = normalizeProfile(createDefaultProfile(), 'Guest Operative', true);
        }
        return this.getCurrentProfile();
    }

    getCurrentProfile() {
        return clone(this.currentProfile);
    }

    isAuthenticated() {
        return Boolean(this.activeUsername);
    }

    async authenticate(username, password) {
        const result = await apiFetch('/auth', {
            method: 'POST',
            body: JSON.stringify({
                username,
                password,
                profile: createDefaultProfile(username, false)
            })
        });
        this.activeUsername = result.profile.username;
        localStorage.setItem(ACTIVE_USER_KEY, this.activeUsername);
        this.currentProfile = normalizeProfile(result.profile, this.activeUsername, false);
        return { ok: true, created: Boolean(result.created), profile: this.getCurrentProfile() };
    }

    async login(username, password) {
        const result = await apiFetch('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        this.activeUsername = result.profile.username;
        localStorage.setItem(ACTIVE_USER_KEY, this.activeUsername);
        this.currentProfile = normalizeProfile(result.profile, this.activeUsername, false);
        return { ok: true, profile: this.getCurrentProfile() };
    }

    async signUp(username, password) {
        const result = await apiFetch('/signup', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        this.activeUsername = result.profile.username;
        localStorage.setItem(ACTIVE_USER_KEY, this.activeUsername);
        this.currentProfile = normalizeProfile(result.profile, this.activeUsername, false);
        return { ok: true, profile: this.getCurrentProfile() };
    }

    async logout() {
        this.activeUsername = null;
        localStorage.removeItem(ACTIVE_USER_KEY);
        this.currentProfile = normalizeProfile(createDefaultProfile(), 'Guest Operative', true);
        return this.getCurrentProfile();
    }

    async saveCurrentProfile() {
        if (!this.activeUsername) return this.getCurrentProfile();
        const result = await apiFetch('/save-profile', {
            method: 'POST',
            body: JSON.stringify({ username: this.activeUsername, profile: this.currentProfile })
        });
        this.currentProfile = normalizeProfile(result.profile, this.activeUsername, false);
        return this.getCurrentProfile();
    }

    async updateLoadout(slot, definitionId) {
        const definition = ITEM_DEFS[definitionId];
        if (!definition || definition.category !== slot) return this.getCurrentProfile();
        const owned = (this.currentProfile.stashItems || []).some((item) => item.definitionId === definitionId);
        if (!owned) return this.getCurrentProfile();
        this.currentProfile.loadout[slot] = definitionId;
        return this.saveCurrentProfile();
    }

    async recordExtraction(summary) {
        const runSummary = {
            id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            createdAt: new Date().toISOString(),
            ...clone(summary)
        };
        for (const item of runSummary.items || []) {
            if (isAmmoDefinition(item.definitionId)) {
                if (isFreeFallbackAmmo(item.definitionId)) continue;
                addAmmoToProfile(this.currentProfile, item.definitionId, getAmmoAmountForEntry(item));
            } else if (ITEM_DEFS[item.definitionId]) {
                this.currentProfile.stashItems.push({ definitionId: item.definitionId });
            }
        }
        this.currentProfile.extractedRuns.unshift(runSummary);
        this.currentProfile.extractedRuns = this.currentProfile.extractedRuns.slice(0, 20);
        this.currentProfile.stats.totalRuns += 1;
        this.currentProfile.stats.totalExtractions += 1;
        this.currentProfile.stats.totalKills += runSummary.kills || 0;
        return this.saveCurrentProfile();
    }

    async applyRaidOutcome(result) {
        const difficulty = result?.difficulty || 'advanced';
        this.currentProfile.backpackItems = [];
        this.currentProfile.safeboxItems = normalizePersistentEntries(result?.safeboxItems || [], SAFEBOX_CAPACITY);

        if (result?.status === 'extracted') {
            return this.recordExtraction({
                ...result.summary,
                items: Array.isArray(result.summary?.items) ? result.summary.items : []
            });
        }

        if (result?.status === 'dead') {
            this.currentProfile.stats.totalRuns += 1;
            applyDeathLosses(this.currentProfile, difficulty);
        }

        return this.saveCurrentProfile();
    }

    async moveItemToSafebox(definitionId, quantity = 1) {
        const amount = Math.max(1, Math.floor(Number(quantity) || 1));

        if (isAmmoDefinition(definitionId)) {
            if (isFreeFallbackAmmo(definitionId)) {
                throw new Error('Gray ammo is free and unlimited, so it cannot be stored.');
            }
            const availableAmmo = getAmmoCountForProfile(this.currentProfile, definitionId);
            if (amount > availableAmmo) {
                throw new Error(`You only have ${availableAmmo} ${ITEM_DEFS[definitionId].name}.`);
            }
            const requiredSlots = Math.ceil(amount / AMMO_PACK_LIMIT);
            if ((this.currentProfile.safeboxItems || []).length + requiredSlots > SAFEBOX_CAPACITY) {
                throw new Error('Safebox does not have enough space for that ammo.');
            }
            removeAmmoFromProfile(this.currentProfile, definitionId, amount);
            this.currentProfile.safeboxItems.push(...packAmmoAmount(definitionId, amount));
            return this.saveCurrentProfile();
        }

        if ((this.currentProfile.safeboxItems || []).length >= SAFEBOX_CAPACITY) {
            throw new Error('Safebox is full.');
        }

        const stash = this.currentProfile.stashItems || [];
        const ownedCount = stash.filter((item) => item.definitionId === definitionId).length;
        const equipped = Object.values(this.currentProfile.loadout).includes(definitionId);
        const movableCount = Math.max(0, ownedCount - (equipped ? 1 : 0));
        if (movableCount <= 0) {
            throw new Error('No movable copy available.');
        }

        const index = stash.findIndex((item) => item.definitionId === definitionId);
        if (index === -1) {
            throw new Error('Item not found in inventory.');
        }

        stash.splice(index, 1);
        this.currentProfile.safeboxItems.push({ definitionId });
        return this.saveCurrentProfile();
    }

    async moveItemToBackpack(definitionId, capacity, quantity = 1) {
        const amount = Math.max(1, Math.floor(Number(quantity) || 1));

        if (isAmmoDefinition(definitionId)) {
            if (isFreeFallbackAmmo(definitionId)) {
                throw new Error('Gray ammo is free and unlimited, so it cannot be stored.');
            }
            const availableAmmo = getAmmoCountForProfile(this.currentProfile, definitionId);
            if (amount > availableAmmo) {
                throw new Error(`You only have ${availableAmmo} ${ITEM_DEFS[definitionId].name}.`);
            }
            const requiredSlots = Math.ceil(amount / AMMO_PACK_LIMIT);
            if ((this.currentProfile.backpackItems || []).length + requiredSlots > capacity) {
                throw new Error('Backpack does not have enough space for that ammo.');
            }
            removeAmmoFromProfile(this.currentProfile, definitionId, amount);
            this.currentProfile.backpackItems.push(...packAmmoAmount(definitionId, amount));
            return this.saveCurrentProfile();
        }

        if ((this.currentProfile.backpackItems || []).length >= capacity) {
            throw new Error('Backpack is full.');
        }

        const stash = this.currentProfile.stashItems || [];
        const ownedCount = stash.filter((item) => item.definitionId === definitionId).length;
        const equipped = Object.values(this.currentProfile.loadout).includes(definitionId);
        const movableCount = Math.max(0, ownedCount - (equipped ? 1 : 0));
        if (movableCount <= 0) {
            throw new Error('No movable copy available.');
        }

        const index = stash.findIndex((item) => item.definitionId === definitionId);
        if (index === -1) {
            throw new Error('Item not found in inventory.');
        }

        stash.splice(index, 1);
        this.currentProfile.backpackItems.push({ definitionId });
        return this.saveCurrentProfile();
    }

    async moveBackpackItemToStash(definitionId, entryIndex = null) {
        const backpack = this.currentProfile.backpackItems || [];
        const resolvedIndex = entryIndex == null
            ? backpack.findIndex((item) => item.definitionId === definitionId)
            : Number(entryIndex);
        if (!Number.isInteger(resolvedIndex) || resolvedIndex < 0 || resolvedIndex >= backpack.length) {
            throw new Error('Item not found in backpack.');
        }

        const [entry] = backpack.splice(resolvedIndex, 1);
        if (isAmmoDefinition(entry.definitionId)) {
            addAmmoToProfile(this.currentProfile, entry.definitionId, getAmmoAmountForEntry(entry));
        } else {
            this.currentProfile.stashItems.push({ definitionId: entry.definitionId });
        }
        return this.saveCurrentProfile();
    }

    async moveSafeboxItemToStash(definitionId, entryIndex = null) {
        const safebox = this.currentProfile.safeboxItems || [];
        const resolvedIndex = entryIndex == null
            ? safebox.findIndex((item) => item.definitionId === definitionId)
            : Number(entryIndex);
        if (!Number.isInteger(resolvedIndex) || resolvedIndex < 0 || resolvedIndex >= safebox.length) {
            throw new Error('Item not found in safebox.');
        }

        const [entry] = safebox.splice(resolvedIndex, 1);
        if (isAmmoDefinition(entry.definitionId)) {
            addAmmoToProfile(this.currentProfile, entry.definitionId, getAmmoAmountForEntry(entry));
        } else {
            this.currentProfile.stashItems.push({ definitionId: entry.definitionId });
        }
        return this.saveCurrentProfile();
    }

    async buyItem(definitionId, quantity = 1) {
        const definition = ITEM_DEFS[definitionId];
        if (!definition) throw new Error('Item not found.');
        if (isMarketLockedAmmo(definitionId)) throw new Error('Gray ammo cannot be traded in the market.');
        const amount = Math.max(1, Math.floor(Number(quantity) || 0));
        const totalCost = getBuyTradeTotal(definitionId, amount);
        if (totalCost < MIN_TRADE_TOTAL) throw new Error(`Trades must be at least ${MIN_TRADE_TOTAL} coins.`);
        if (this.currentProfile.coins < totalCost) throw new Error('Not enough coins.');
        this.currentProfile.coins -= totalCost;
        if (isAmmoDefinition(definitionId)) {
            addAmmoToProfile(this.currentProfile, definitionId, amount);
        } else {
            for (let i = 0; i < amount; i++) {
                this.currentProfile.stashItems.push({ definitionId });
            }
        }
        this.currentProfile.stats.totalMarketTrades += amount;
        return this.saveCurrentProfile();
    }

    async sellItem(definitionId, quantity = 1) {
        const definition = ITEM_DEFS[definitionId];
        if (!definition) throw new Error('Item not found.');
        if (isMarketLockedAmmo(definitionId)) throw new Error('Gray ammo cannot be traded in the market.');
        const stash = this.currentProfile.stashItems || [];
        const ownedCount = isAmmoDefinition(definitionId)
            ? getAmmoCountForProfile(this.currentProfile, definitionId)
            : stash.filter((item) => item.definitionId === definitionId).length;
        const equipped = Object.values(this.currentProfile.loadout).includes(definitionId);
        if (ownedCount <= 0) throw new Error('You do not own this item.');
        const amount = Math.max(1, Math.floor(Number(quantity) || 0));
        const sellableCount = isAmmoDefinition(definitionId) ? ownedCount : (equipped ? ownedCount - 1 : ownedCount);
        if (sellableCount <= 0) throw new Error('Equip another item first.');
        if (amount > sellableCount) throw new Error(`You can sell at most ${sellableCount}.`);
        const totalValue = getSellTradeTotal(definitionId, amount);
        if (totalValue < MIN_TRADE_TOTAL) throw new Error(`Trades must be at least ${MIN_TRADE_TOTAL} coins.`);
        if (isAmmoDefinition(definitionId)) {
            removeAmmoFromProfile(this.currentProfile, definitionId, amount);
        } else {
            for (let i = 0; i < amount; i++) {
                const index = stash.findIndex((item) => item.definitionId === definitionId);
                if (index === -1) throw new Error('You do not own this item.');
                stash.splice(index, 1);
            }
        }
        this.currentProfile.coins += totalValue;
        this.currentProfile.stats.totalCoinsEarned += totalValue;
        this.currentProfile.stats.totalMarketTrades += amount;
        return this.saveCurrentProfile();
    }

    async addCoins(amount = 0) {
        const coins = Math.max(0, Math.floor(Number(amount) || 0));
        this.currentProfile.coins += coins;
        return this.saveCurrentProfile();
    }
}
