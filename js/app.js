// ============================================================
// app.js — DOM UI for menu, inventory, auth, market, and crate loot panel
// ============================================================

import { Game, GAME_STATE } from './game.js';
import {
    ProfileStore,
    AMMO_PACK_LIMIT,
    AMMO_DEFINITION_IDS,
    LOADOUT_SLOTS,
    ITEM_DEFS,
    RARITY_ORDER,
    STARTER_LOADOUT,
    getOwnedItemsByCategory,
    getRarityMeta,
    getSlotLabel,
    summarizeProfile,
    getProfileInventoryValue,
    getStashSummary,
    getItemImagePath,
    getSafeboxSummary,
    SAFEBOX_CAPACITY,
    isEquipmentCategory,
    isAmmoDefinition,
    getAmmoAmountForEntry,
    getAmmoCountForProfile,
    getBuyTradeTotal,
    getSellTradeTotal,
    getMinimumTradeQuantity,
    MIN_TRADE_TOTAL
} from './profile.js';

const store = new ProfileStore();

const canvas = document.getElementById('gameCanvas');
const loading = document.getElementById('loading');
const topBar = document.getElementById('topBar');
const redeemButton = document.getElementById('redeemButton');
const authButton = document.getElementById('authButton');
const menuScreen = document.getElementById('menuScreen');
const inventoryScreen = document.getElementById('inventoryScreen');
const marketScreen = document.getElementById('marketScreen');
const menuSummary = document.getElementById('menuSummary');
const inventoryCoins = document.getElementById('inventoryCoins');
const inventoryStats = document.getElementById('inventoryStats');
const loadoutSections = document.getElementById('loadoutSections');
const stashSummary = document.getElementById('stashSummary');
const prepBackpackStats = document.getElementById('prepBackpackStats');
const prepBackpackCollection = document.getElementById('prepBackpackCollection');
const safeboxStats = document.getElementById('safeboxStats');
const safeboxCollection = document.getElementById('safeboxCollection');
const itemCollection = document.getElementById('itemCollection');
const equipmentCollection = document.getElementById('equipmentCollection');
const marketCoins = document.getElementById('marketCoins');
const marketTypeNav = document.getElementById('marketTypeNav');
const marketSections = document.getElementById('marketSections');
const marketMessage = document.getElementById('marketMessage');
const difficultySelect = document.getElementById('difficultySelect');
const startButton = document.getElementById('startButton');
const inventoryButton = document.getElementById('inventoryButton');
const marketButton = document.getElementById('marketButton');
const backButton = document.getElementById('backButton');
const marketBackButton = document.getElementById('marketBackButton');
const authModal = document.getElementById('authModal');
const authTitle = document.getElementById('authTitle');
const authMessage = document.getElementById('authMessage');
const authForm = document.getElementById('authForm');
const authUsername = document.getElementById('authUsername');
const authPassword = document.getElementById('authPassword');
const authSubmit = document.getElementById('authSubmit');
const loginModeButton = document.getElementById('loginModeButton');
const signupModeButton = document.getElementById('signupModeButton');
const authModeToggle = loginModeButton.parentElement;
const authClose = document.getElementById('authClose');
const logoutButton = document.getElementById('logoutButton');
const accountActions = document.getElementById('accountActions');
const equipmentDetailModal = document.getElementById('equipmentDetailModal');
const detailType = document.getElementById('detailType');
const detailName = document.getElementById('detailName');
const detailImage = document.getElementById('detailImage');
const detailDescription = document.getElementById('detailDescription');
const detailMeta = document.getElementById('detailMeta');
const detailActions = document.getElementById('detailActions');
const detailMessage = document.getElementById('detailMessage');
const detailClose = document.getElementById('detailClose');
const cratePanel = document.getElementById('cratePanel');
const cratePrompt = document.getElementById('cratePrompt');
const crateItems = document.getElementById('crateItems');
const crateMessage = document.getElementById('crateMessage');
const raidLoadoutPanel = document.getElementById('raidLoadoutPanel');
const raidLoadoutItems = document.getElementById('raidLoadoutItems');
const raidBackpackPanel = document.getElementById('raidBackpackPanel');
const raidBackpackStats = document.getElementById('raidBackpackStats');
const raidBackpackItems = document.getElementById('raidBackpackItems');
const raidSafeboxStats = document.getElementById('raidSafeboxStats');
const raidSafeboxItems = document.getElementById('raidSafeboxItems');
const raidDetailModal = document.getElementById('raidDetailModal');
const raidDetailType = document.getElementById('raidDetailType');
const raidDetailName = document.getElementById('raidDetailName');
const raidDetailImage = document.getElementById('raidDetailImage');
const raidDetailDescription = document.getElementById('raidDetailDescription');
const raidDetailMeta = document.getElementById('raidDetailMeta');
const raidDetailActions = document.getElementById('raidDetailActions');
const raidDetailMessage = document.getElementById('raidDetailMessage');
const raidDetailClose = document.getElementById('raidDetailClose');
const tradeModal = document.getElementById('tradeModal');
const tradeTitle = document.getElementById('tradeTitle');
const tradeSubtitle = document.getElementById('tradeSubtitle');
const tradeForm = document.getElementById('tradeForm');
const tradeQuantity = document.getElementById('tradeQuantity');
const tradeHint = document.getElementById('tradeHint');
const tradeSubmit = document.getElementById('tradeSubmit');
const tradeClose = document.getElementById('tradeClose');
const tradeMessage = document.getElementById('tradeMessage');

let currentView = 'menu';
let authMode = 'login';
const DISPLAY_RARITY_ORDER = [...RARITY_ORDER].reverse();
let activeDetailDefinitionId = null;
let activeDetailSource = 'stash';
let activeDetailEntryIndex = null;
let activeRaidDetail = null;
let activeTradeRequest = null;

const MARKET_CATEGORY_ORDER = ['loot', 'gun', 'melee', 'armor', 'helmet', 'shoes', 'backpack'];

const game = new Game(canvas, {
    onStateChange: handleGameState,
    onRunComplete: async (result) => {
        await store.applyRaidOutcome(result);
        renderAll();
    }
});

function formatDate(iso) {
    const date = new Date(iso);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function setView(view) {
    currentView = view;
    renderVisibility();
    if (view === 'inventory') renderInventory();
    else if (view === 'market') renderMarket();
    else renderMenu();
}

function renderVisibility() {
    const showOverlay = game.state === GAME_STATE.MENU;
    topBar.classList.toggle('hidden', !showOverlay);
    menuScreen.classList.toggle('hidden', !showOverlay || currentView !== 'menu');
    inventoryScreen.classList.toggle('hidden', !showOverlay || currentView !== 'inventory');
    marketScreen.classList.toggle('hidden', !showOverlay || currentView !== 'market');
    document.body.classList.toggle('playing', game.state === GAME_STATE.PLAYING);
}

function renderAuthButton() {
    const profile = store.getCurrentProfile();
    if (!store.isAuthenticated()) {
        authButton.classList.remove('auth-status-button');
        authButton.textContent = 'Login / Sign Up';
        return;
    }

    const inventoryValue = getProfileInventoryValue(profile);
    authButton.classList.add('auth-status-button');
    authButton.innerHTML = `
        <span class="auth-status-name">${profile.username} · ${profile.coins} coins</span>
        <span class="auth-status-value">Inv Value ${inventoryValue}c</span>
    `;
}

function renderMenu() {
    const profile = store.getCurrentProfile();
    const summary = summarizeProfile(profile);
    const loadoutText = LOADOUT_SLOTS.map((slot, index) => `${getSlotLabel(slot)}: ${summary.loadoutNames[index]}`).join(' · ');

    menuSummary.innerHTML = `
        <div class="summary-tile"><span class="summary-label">Operator</span><strong>${profile.username}</strong></div>
        <div class="summary-tile"><span class="summary-label">Coins</span><strong>${summary.coins}</strong></div>
        <div class="summary-tile"><span class="summary-label">Extractions</span><strong>${summary.extractedRuns}</strong></div>
        <div class="summary-tile"><span class="summary-label">Last Haul</span><strong>${summary.lastExtractItemCount} items</strong></div>
        <div class="summary-tile summary-wide"><span class="summary-label">Active Loadout</span><strong>${loadoutText}</strong></div>
    `;
}

function renderLoadoutSections(profile) {
    const slotOrder = ['helmet', 'armor', 'backpack', 'gun', 'melee', 'shoes'];
    loadoutSections.innerHTML = `
        <div class="loadout-visual">
            <div class="operator-layout">
                <div class="operator-silhouette">
                    <div class="operator-head"></div>
                    <div class="operator-body"></div>
                    <div class="operator-leg left"></div>
                    <div class="operator-leg right"></div>
                </div>
                ${slotOrder.map((slot) => {
                    const definition = ITEM_DEFS[profile.loadout[slot]];
                    const rarity = getRarityMeta(definition?.rarity || 'white');
                    return `
                        <button class="loadout-slot-card slot-${slot}" data-slot="${slot}" data-item-id="${definition.id}" title="${definition.name}">
                            <div class="loadout-slot-type" style="color:${rarity.color}">${getSlotLabel(slot)}</div>
                            <img class="loadout-slot-icon" src="${getItemImagePath(definition.id)}" alt="${definition.name}" style="border-color:${rarity.color}">
                            <div class="loadout-slot-name" style="color:${rarity.color}">${definition.name}</div>
                        </button>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function getOwnedCounts(profile) {
    const ownedCounts = {};
    for (const item of profile.stashItems || []) {
        ownedCounts[item.definitionId] = (ownedCounts[item.definitionId] || 0) + 1;
    }
    for (const definitionId of AMMO_DEFINITION_IDS) {
        const amount = getAmmoCountForProfile(profile, definitionId);
        if (amount > 0) {
            ownedCounts[definitionId] = amount;
        }
    }
    return ownedCounts;
}

function getAmmoPackLabel(definition, quantity) {
    return `${definition.name} x${quantity}`;
}

function getAmmoPackDescription(definition, quantity) {
    return `${definition.name} pack containing ${quantity} round${quantity === 1 ? '' : 's'}.`;
}

function getDetailSourceEntry(profile) {
    if (activeDetailEntryIndex == null) return null;
    if (activeDetailSource === 'safebox') {
        return (profile.safeboxItems || [])[activeDetailEntryIndex] || null;
    }
    if (activeDetailSource === 'prep-backpack') {
        return (profile.backpackItems || [])[activeDetailEntryIndex] || null;
    }
    return null;
}

function getReplacementItemId(profile, slot, excludedDefinitionId) {
    const ownedItems = getOwnedItemsByCategory(profile, slot);
    const alternative = ownedItems.find(({ definition }) => definition.id !== excludedDefinitionId);
    return alternative?.definition?.id || null;
}

function getUnequipTargetId(profile, slot, definitionId) {
    const replacementId = getReplacementItemId(profile, slot, definitionId);
    if (replacementId) return replacementId;
    const starterId = STARTER_LOADOUT[slot];
    return starterId && starterId !== definitionId ? starterId : null;
}

function openEquipmentDetail(definitionId, source = 'stash', entryIndex = null) {
    activeDetailDefinitionId = definitionId;
    activeDetailSource = source;
    activeDetailEntryIndex = entryIndex;
    renderEquipmentDetail();
    equipmentDetailModal.classList.remove('hidden');
}

function closeEquipmentDetail() {
    equipmentDetailModal.classList.add('hidden');
    detailMessage.textContent = '';
    activeDetailDefinitionId = null;
    activeDetailSource = 'stash';
    activeDetailEntryIndex = null;
}

function openTradeModal(config) {
    activeTradeRequest = config;
    tradeTitle.textContent = config.title;
    tradeSubtitle.textContent = config.subtitle;
    tradeQuantity.min = '1';
    tradeQuantity.max = String(config.maxQuantity);
    tradeQuantity.value = String(Math.max(1, Math.min(config.maxQuantity, config.initialQuantity || 1)));
    tradeHint.textContent = config.hint;
    tradeSubmit.textContent = config.confirmLabel;
    tradeMessage.textContent = '';
    tradeModal.classList.remove('hidden');
    tradeQuantity.focus();
    tradeQuantity.select();
}

function closeTradeModal() {
    tradeModal.classList.add('hidden');
    tradeMessage.textContent = '';
    activeTradeRequest = null;
}

function openRaidDetail(source, identifier) {
    activeRaidDetail = { source, identifier };
    renderRaidDetail();
    raidDetailModal.classList.remove('hidden');
}

function closeRaidDetail() {
    raidDetailModal.classList.add('hidden');
    raidDetailMessage.textContent = '';
    activeRaidDetail = null;
}

function renderRaidDetail(message = '') {
    const raidState = game.getRaidUiView();
    if (!activeRaidDetail || !raidState.visible) {
        closeRaidDetail();
        return;
    }

    let item = null;
    if (activeRaidDetail.source === 'backpack') {
        item = raidState.backpack.items.find((entry) => entry.id === activeRaidDetail.identifier) || null;
    } else if (activeRaidDetail.source === 'safebox') {
        item = raidState.safebox.items.find((entry) => entry.id === activeRaidDetail.identifier) || null;
    } else if (activeRaidDetail.source === 'loadout') {
        item = raidState.loadout.items.find((entry) => entry.slot === activeRaidDetail.identifier) || null;
    }
    if (!item) {
        closeRaidDetail();
        return;
    }

    raidDetailType.textContent = activeRaidDetail.source === 'loadout'
        ? `Equipped ${item.slotLabel}`
        : activeRaidDetail.source === 'safebox'
            ? `Safebox ${item.slotLabel}`
            : item.slotLabel;
    raidDetailType.style.color = item.rarityColor;
    raidDetailName.textContent = item.name;
    raidDetailName.style.color = item.rarityColor;
    raidDetailImage.src = getItemImagePath(item.definitionId);
    raidDetailDescription.textContent = item.description;
    raidDetailMeta.innerHTML = `
        <span style="color:${item.rarityColor}">${item.rarityLabel}</span>
        <span>Value ${item.sellValue}c</span>
        ${activeRaidDetail.source === 'backpack' ? '<span>Backpack item</span>' : activeRaidDetail.source === 'safebox' ? '<span>Safebox item</span>' : '<span>Equipped item</span>'}
    `;

    const actions = [];
    if (activeRaidDetail.source === 'backpack') {
        if (LOADOUT_SLOTS.includes(item.category)) {
            actions.push('<button class="primary-button" data-raid-action="equip">Equip</button>');
        }
        actions.push('<button class="secondary-button" data-raid-action="to-safebox">Move to Safebox</button>');
        actions.push('<button class="secondary-button" data-raid-action="abandon">Abandon</button>');
    } else if (activeRaidDetail.source === 'safebox') {
        actions.push('<button class="secondary-button" data-raid-action="to-backpack">Move to Backpack</button>');
    } else {
        actions.push('<button class="secondary-button" data-raid-action="unequip">Unequip</button>');
        actions.push('<button class="secondary-button" data-raid-action="abandon">Abandon</button>');
    }

    raidDetailActions.innerHTML = actions.join('');
    raidDetailMessage.textContent = message;
}

function renderEquipmentDetail(message = '') {
    const profile = store.getCurrentProfile();
    const definition = ITEM_DEFS[activeDetailDefinitionId];
    if (!definition) return;

    const rarity = getRarityMeta(definition.rarity);
    const ownedCounts = getOwnedCounts(profile);
    const sourceEntry = getDetailSourceEntry(profile);
    const sourceAmmoQuantity = sourceEntry && isAmmoDefinition(sourceEntry.definitionId)
        ? getAmmoAmountForEntry(sourceEntry)
        : 0;
    const owned = isAmmoDefinition(definition.id)
        ? (activeDetailSource === 'stash' ? getAmmoCountForProfile(profile, definition.id) : sourceAmmoQuantity)
        : (ownedCounts[definition.id] || 0);
    const isEquipment = isEquipmentCategory(definition.category);
    const equipped = isEquipment && profile.loadout[definition.category] === definition.id;
    const unequipTargetId = isEquipment ? getUnequipTargetId(profile, definition.category, definition.id) : null;

    detailType.textContent = getSlotLabel(definition.category);
    detailType.style.color = rarity.color;
    detailName.textContent = sourceAmmoQuantity ? getAmmoPackLabel(definition, sourceAmmoQuantity) : definition.name;
    detailName.style.color = rarity.color;
    detailImage.src = getItemImagePath(definition.id);
    detailDescription.textContent = sourceAmmoQuantity ? getAmmoPackDescription(definition, sourceAmmoQuantity) : definition.description;
    detailMeta.innerHTML = `
        <span style="color:${rarity.color}">${rarity.label}</span>
        <span>${sourceAmmoQuantity ? `Pack ${sourceAmmoQuantity}` : `Owned ${owned}`}</span>
        <span>Value ${sourceAmmoQuantity ? sourceAmmoQuantity : definition.sellValue}c</span>
        <span>Sell ${getSellTradeTotal(definition.id, 1)}c</span>
        <span>Buy ${getBuyTradeTotal(definition.id, 1)}c</span>
        ${equipped ? '<span>Equipped</span>' : ''}
        ${activeDetailSource === 'safebox' ? '<span>Stored in safebox</span>' : ''}
        ${activeDetailSource === 'prep-backpack' ? '<span>Packed for raid</span>' : ''}
    `;

    const prepBackpackCapacity = getInventoryBackpackCapacity(profile);
    const actions = [];
    if (activeDetailSource === 'safebox') {
        actions.push('<button class="primary-button" data-detail-action="stash">Move to Inventory</button>');
    } else if (activeDetailSource === 'prep-backpack') {
        actions.push('<button class="primary-button" data-detail-action="backpack-to-stash">Move to Inventory</button>');
    } else if (isEquipment && owned > 0 && !equipped) {
        actions.push('<button class="primary-button" data-detail-action="equip">Equip</button>');
    }
    if (activeDetailSource === 'stash' && getMovableToPrepBackpackCount(profile, definition.id) > 0 && (profile.backpackItems || []).length < prepBackpackCapacity) {
        actions.push('<button class="secondary-button" data-detail-action="prep-backpack">Put in Backpack</button>');
    }
    if (activeDetailSource === 'stash' && getMovableToSafeboxCount(profile, definition.id) > 0 && (profile.safeboxItems || []).length < SAFEBOX_CAPACITY) {
        actions.push('<button class="secondary-button" data-detail-action="safebox">Put in Safebox</button>');
    }
    if (activeDetailSource !== 'safebox' && activeDetailSource !== 'prep-backpack' && owned > 0 && definition.id !== 'ammo_white') {
        actions.push('<button class="secondary-button" data-detail-action="sell">Sell</button>');
    }
    if (activeDetailSource === 'stash' && isEquipment && equipped) {
        actions.push(`<button class="secondary-button" data-detail-action="unequip" ${unequipTargetId ? '' : 'disabled'}>Unequip</button>`);
    }
    detailActions.innerHTML = actions.join('') || '<div class="empty-state">Nothing available here.</div>';
    detailMessage.textContent = message || (activeDetailSource !== 'safebox' && equipped && !unequipTargetId ? 'No replacement item available for unequip.' : '');
}

function getSellableCount(profile, definitionId) {
    if (isAmmoDefinition(definitionId)) {
        return getAmmoCountForProfile(profile, definitionId);
    }
    const ownedCounts = getOwnedCounts(profile);
    const owned = ownedCounts[definitionId] || 0;
    const equipped = Object.values(profile.loadout).includes(definitionId);
    return Math.max(0, owned - (equipped ? 1 : 0));
}

function getMovableToSafeboxCount(profile, definitionId) {
    if (isAmmoDefinition(definitionId)) {
        return getAmmoCountForProfile(profile, definitionId);
    }
    const ownedCounts = getOwnedCounts(profile);
    const owned = ownedCounts[definitionId] || 0;
    const equipped = Object.values(profile.loadout).includes(definitionId);
    return Math.max(0, owned - (equipped ? 1 : 0));
}

function getInventoryBackpackCapacity(profile) {
    return LOADOUT_SLOTS.reduce((capacity, slot) => {
        const definition = ITEM_DEFS[profile.loadout[slot]];
        return capacity + (definition?.modifiers?.carrySlots || 0);
    }, 10);
}

function getMovableToPrepBackpackCount(profile, definitionId) {
    if (isAmmoDefinition(definitionId)) return getAmmoCountForProfile(profile, definitionId);
    const ownedCounts = getOwnedCounts(profile);
    const owned = ownedCounts[definitionId] || 0;
    const equipped = Object.values(profile.loadout).includes(definitionId);
    return Math.max(0, owned - (equipped ? 1 : 0));
}

function getMaxAffordableQuantity(profile, definitionId) {
    let low = 0;
    let high = 100000;
    while (low < high) {
        const mid = Math.floor((low + high + 1) / 2);
        if (getBuyTradeTotal(definitionId, mid) <= profile.coins) {
            low = mid;
        } else {
            high = mid - 1;
        }
    }
    return low;
}

function renderStash(profile) {
    const stash = getStashSummary(profile);
    const rarityTiles = RARITY_ORDER.map((rarity) => {
        const meta = getRarityMeta(rarity);
        return `<div class="summary-tile"><span class="summary-label">${meta.label}</span><strong style="color:${meta.color}">${stash[rarity]}</strong></div>`;
    }).join('');

    stashSummary.innerHTML = `
        <div class="summary-tile"><span class="summary-label">Coins</span><strong>${profile.coins}</strong></div>
        <div class="summary-tile"><span class="summary-label">Stored Items</span><strong>${stash.items}</strong></div>
        ${rarityTiles}
    `;

    inventoryCoins.textContent = `${profile.coins}c`;
    inventoryStats.textContent = `Runs ${profile.stats.totalExtractions} · Kills ${profile.stats.totalKills}`;
    const prepBackpackCapacity = getInventoryBackpackCapacity(profile);
    prepBackpackStats.textContent = `${(profile.backpackItems || []).length}/${prepBackpackCapacity} used`;
    const safebox = getSafeboxSummary(profile);
    safeboxStats.textContent = `${safebox.used}/${safebox.capacity} used`;

    const ownedCounts = getOwnedCounts(profile);

    const equipmentCategories = new Set(LOADOUT_SLOTS);
    const sortedDefinitions = Object.values(ITEM_DEFS).sort((a, b) => {
        const rarityOrder = DISPLAY_RARITY_ORDER.indexOf(a.rarity) - DISPLAY_RARITY_ORDER.indexOf(b.rarity);
        if (rarityOrder !== 0) return rarityOrder;
        const categoryOrder = getSlotLabel(a.category).localeCompare(getSlotLabel(b.category));
        if (categoryOrder !== 0) return categoryOrder;
        return a.name.localeCompare(b.name);
    });

    const renderCollection = (definitions) => {
        if (!definitions.length) {
            return '<div class="empty-state">No entries in this category yet.</div>';
        }

        return definitions.map((definition) => {
            const owned = ownedCounts[definition.id] || 0;
            const rarity = getRarityMeta(definition.rarity);
            const isEquipment = equipmentCategories.has(definition.category);
            const isEquipped = isEquipment && profile.loadout[definition.category] === definition.id;
            return `
                <div class="collection-icon-card ${owned ? '' : 'unowned'} ${isEquipment ? 'equipable' : ''} ${isEquipped ? 'equipped' : ''}" title="${definition.name}" data-item-id="${definition.id}" ${isEquipment ? `data-slot="${definition.category}"` : ''}>
                    <img class="collection-icon" src="${getItemImagePath(definition.id)}" alt="${definition.name}" loading="lazy">
                    <div class="collection-count" style="color:${owned ? rarity.color : 'transparent'}">${owned ? `x${owned}` : ''}</div>
                </div>
            `;
        }).join('');
    };

    safeboxCollection.innerHTML = (profile.safeboxItems || []).length
        ? profile.safeboxItems.map((entry, index) => {
            const definition = ITEM_DEFS[entry.definitionId];
            const rarity = getRarityMeta(definition.rarity);
            const ammoQuantity = isAmmoDefinition(entry.definitionId) ? getAmmoAmountForEntry(entry) : 0;
            return `
                <div class="collection-icon-card equipable" data-safebox-definition-id="${definition.id}" data-safebox-index="${index}" title="${definition.name}">
                    <img class="collection-icon" src="${getItemImagePath(definition.id)}" alt="${definition.name}" loading="lazy">
                    <div class="collection-count" style="color:${rarity.color}">${ammoQuantity ? `x${ammoQuantity}` : definition.name}</div>
                </div>
            `;
        }).join('')
        : '<div class="empty-state">Safebox is empty.</div>';

    prepBackpackCollection.innerHTML = (profile.backpackItems || []).length
        ? profile.backpackItems.map((entry, index) => {
            const definition = ITEM_DEFS[entry.definitionId];
            const rarity = getRarityMeta(definition.rarity);
            const ammoQuantity = isAmmoDefinition(entry.definitionId) ? getAmmoAmountForEntry(entry) : 0;
            return `
                <div class="collection-icon-card equipable" data-prep-backpack-definition-id="${definition.id}" data-prep-backpack-index="${index}" title="${definition.name}">
                    <img class="collection-icon" src="${getItemImagePath(definition.id)}" alt="${definition.name}" loading="lazy">
                    <div class="collection-count" style="color:${rarity.color}">${ammoQuantity ? `x${ammoQuantity}` : definition.name}</div>
                </div>
            `;
        }).join('')
        : '<div class="empty-state">Backpack is empty.</div>';

    itemCollection.innerHTML = renderCollection(sortedDefinitions.filter((definition) => !equipmentCategories.has(definition.category)));
    equipmentCollection.innerHTML = renderCollection(sortedDefinitions.filter((definition) => equipmentCategories.has(definition.category)));
}

function renderInventory() {
    const profile = store.getCurrentProfile();
    renderLoadoutSections(profile);
    renderStash(profile);
    if (!equipmentDetailModal.classList.contains('hidden') && activeDetailDefinitionId) {
        renderEquipmentDetail();
    }
}

function renderMarket() {
    const profile = store.getCurrentProfile();
    const ownedCounts = getOwnedCounts(profile);
    marketCoins.textContent = `${profile.coins}c`;
    const groupedItems = MARKET_CATEGORY_ORDER.map((category) => ({
        category,
        items: Object.values(ITEM_DEFS)
            .filter((item) => item.category === category)
            .sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity) || a.name.localeCompare(b.name))
    })).filter((group) => group.items.length);

    marketTypeNav.innerHTML = groupedItems.map((group) => `
        <button class="market-type-button" data-market-nav="${group.category}">${getSlotLabel(group.category)}</button>
    `).join('');

    marketSections.innerHTML = groupedItems.map((group) => `
        <section id="market-section-${group.category}" class="market-section">
            <h3>${getSlotLabel(group.category)}</h3>
            <div class="market-grid">
                ${group.items.map((item) => {
                    const rarity = getRarityMeta(item.rarity);
                    const owned = ownedCounts[item.id] || 0;
                    const marketLocked = item.id === 'ammo_white';
                    return `
                        <div class="market-card" style="border-left:4px solid ${rarity.color}">
                            <img class="item-card-img" src="${getItemImagePath(item.id)}" alt="${item.name}" loading="lazy">
                            <div class="item-card-header">
                                <strong>${item.name}</strong>
                                <span style="color:${rarity.color}">${rarity.label}</span>
                            </div>
                            <p>${item.description}</p>
                            <div class="item-stats">
                                <span>${getSlotLabel(item.category)}</span>
                                <span>Value ${item.sellValue}c</span>
                                <span>Buy ${getBuyTradeTotal(item.id, 1)}c</span>
                                <span>Sell ${getSellTradeTotal(item.id, 1)}c</span>
                                <span>Owned ${owned}</span>
                            </div>
                            <div class="market-actions">
                                <button class="secondary-button" data-market-action="sell" data-item-id="${item.id}" ${(!marketLocked && owned && getSellableCount(profile, item.id) >= getMinimumTradeQuantity(item.id, 'sell')) ? '' : 'disabled'}>${marketLocked ? 'Locked' : 'Sell'}</button>
                                <button class="primary-button" data-market-action="buy" data-item-id="${item.id}" ${(!marketLocked && getMaxAffordableQuantity(profile, item.id) >= getMinimumTradeQuantity(item.id, 'buy')) ? '' : 'disabled'}>${marketLocked ? 'Locked' : 'Buy'}</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </section>
    `).join('');
}

function renderAuthModal() {
    const profile = store.getCurrentProfile();
    authModeToggle.classList.add('hidden');

    if (store.isAuthenticated()) {
        authTitle.textContent = `Signed in as ${profile.username}`;
        authMessage.textContent = 'User data is stored in a local JSON file through the prototype API server.';
        authForm.classList.add('hidden');
        accountActions.classList.remove('hidden');
        return;
    }

    authTitle.textContent = 'Login / Sign Up';
    authMessage.textContent = 'Enter a username and password. Usernames may contain only English letters and the red heart emoji. Matching is not case-sensitive, but the registered casing is preserved.';
    authSubmit.textContent = 'Continue';
    authForm.classList.remove('hidden');
    accountActions.classList.add('hidden');
}

function openAuthModal(mode = 'login') {
    authMode = mode;
    authUsername.value = '';
    authPassword.value = '';
    authModal.classList.remove('hidden');
    renderAuthModal();
}

function closeAuthModal() {
    authModal.classList.add('hidden');
}

function setMarketMessage(message, isError = false) {
    marketMessage.textContent = message;
    marketMessage.dataset.error = isError ? 'true' : 'false';
}

function renderRuntimeUi() {
    const raidState = game.getRaidUiView();
    cratePanel.classList.toggle('hidden', !raidState.crateVisible);
    raidLoadoutPanel.classList.toggle('hidden', !raidState.visible);
    raidBackpackPanel.classList.toggle('hidden', !raidState.visible);

    if (!raidState.crateVisible) {
        cratePrompt.textContent = '';
        crateItems.innerHTML = '';
        crateMessage.textContent = '';
    } else {
        cratePrompt.textContent = `Crate open · ${raidState.crate.itemCount} item(s) · click an item to take it`;
        crateMessage.textContent = raidState.message || '';

        crateItems.innerHTML = raidState.crate.items.length
            ? raidState.crate.items.map((item) => `
                <button class="crate-item-card" data-crate-item-id="${item.id}" style="border-left:4px solid ${item.rarityColor}">
                    <img class="item-card-img" src="${getItemImagePath(item.definitionId)}" alt="${item.name}" loading="lazy">
                    <div class="item-card-header">
                        <strong>${item.name}</strong>
                        <span style="color:${item.rarityColor}">${item.rarityLabel}</span>
                    </div>
                    <p>${item.description}</p>
                    <div class="item-stats">
                        <span>${getSlotLabel(item.category)}</span>
                        <span>Value ${item.sellValue}c</span>
                        <span>Click to take</span>
                    </div>
                </button>
            `).join('')
            : '<div class="empty-state">Crate already cleared.</div>';
    }

    if (!raidState.visible) {
        raidLoadoutItems.innerHTML = '';
        raidBackpackItems.innerHTML = '';
        raidBackpackStats.textContent = '';
        raidSafeboxStats.textContent = 'Safebox';
        raidSafeboxItems.innerHTML = '';
        if (!raidDetailModal.classList.contains('hidden')) closeRaidDetail();
        return;
    }

    raidLoadoutItems.innerHTML = raidState.loadout.items.map((item) => `
        <button class="raid-icon-button" data-raid-source="loadout" data-slot="${item.slot}" style="border-left:4px solid ${item.rarityColor}">
            <img src="${getItemImagePath(item.definitionId)}" alt="${item.name}" loading="lazy">
            <div class="raid-icon-label">${item.slotLabel}</div>
            <div class="raid-icon-name" style="color:${item.rarityColor}">${item.name}</div>
        </button>
    `).join('');

    raidBackpackStats.textContent = `${raidState.backpack.itemCount}/${raidState.backpack.capacity} slots used`;
    raidBackpackItems.innerHTML = raidState.backpack.items.length
        ? raidState.backpack.items.map((item) => `
            <button class="raid-icon-button" data-raid-source="backpack" data-item-id="${item.id}" style="border-left:4px solid ${item.rarityColor}">
                <img src="${getItemImagePath(item.definitionId)}" alt="${item.name}" loading="lazy">
                <div class="raid-icon-label">${item.slotLabel}</div>
                <div class="raid-icon-name" style="color:${item.rarityColor}">${item.name}</div>
            </button>
        `).join('')
        : '<div class="empty-state" style="grid-column:1/-1;">Backpack is empty.</div>';

    raidSafeboxStats.textContent = `Safebox ${raidState.safebox.itemCount}/${raidState.safebox.capacity}`;
    raidSafeboxItems.innerHTML = raidState.safebox.items.length
        ? raidState.safebox.items.map((item) => `
            <button class="raid-icon-button" data-raid-source="safebox" data-item-id="${item.id}" style="border-left:4px solid ${item.rarityColor}">
                <img src="${getItemImagePath(item.definitionId)}" alt="${item.name}" loading="lazy">
                <div class="raid-icon-label">${item.slotLabel}</div>
                <div class="raid-icon-name" style="color:${item.rarityColor}">${item.name}</div>
            </button>
        `).join('')
        : '<div class="empty-state" style="grid-column:1/-1;">Safebox is empty.</div>';

    if (!raidDetailModal.classList.contains('hidden') && activeRaidDetail) {
        renderRaidDetail();
    }
}

function renderAll() {
    renderAuthButton();
    renderMenu();
    renderInventory();
    renderMarket();
    renderVisibility();
    if (!authModal.classList.contains('hidden')) {
        renderAuthModal();
    }
}

function handleGameState(state) {
    if (state === GAME_STATE.MENU) {
        currentView = 'menu';
    }
    renderAll();
}

function parseWholeNumberInput(value) {
    const text = String(value || '').trim();
    if (!/^\d+$/.test(text)) return null;
    return Math.floor(Number(text));
}

startButton.addEventListener('click', () => {
    game.startGame(store.getCurrentProfile(), { difficulty: difficultySelect.value });
    renderVisibility();
});

inventoryButton.addEventListener('click', () => setView('inventory'));
marketButton.addEventListener('click', () => setView('market'));
backButton.addEventListener('click', () => setView('menu'));
marketBackButton.addEventListener('click', () => setView('menu'));

redeemButton.addEventListener('click', async () => {
    const code = window.prompt('Enter redeem code:');
    if (code == null) return;

    const normalized = String(code).trim();
    if (normalized === 'oghyhk') {
        await store.addCoins(10000);
        renderAll();
        window.alert('Redeemed 10000 coins.');
        return;
    }

    if (normalized === '2598') {
        const amountInput = window.prompt('How many coins do you want to get?');
        if (amountInput == null) return;
        const amount = parseWholeNumberInput(amountInput);
        if (amount == null) {
            window.alert('Enter a whole number with no decimal places.');
            return;
        }
        await store.addCoins(amount);
        renderAll();
        window.alert(`Redeemed ${amount} coins.`);
        return;
    }

    window.alert('Invalid redeem code.');
});

authButton.addEventListener('click', () => openAuthModal('login'));
loginModeButton.addEventListener('click', () => {
    authMode = 'login';
    renderAuthModal();
});
signupModeButton.addEventListener('click', () => {
    authMode = 'signup';
    renderAuthModal();
});
authClose.addEventListener('click', closeAuthModal);
logoutButton.addEventListener('click', async () => {
    await store.logout();
    closeAuthModal();
    renderAll();
});

authModal.addEventListener('click', (event) => {
    if (event.target === authModal) closeAuthModal();
});

authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = authUsername.value.trim();
    const password = authPassword.value;
    try {
        await store.authenticate(username, password);
        closeAuthModal();
        renderAll();
    } catch (error) {
        authMessage.textContent = error.message;
    }
});

loadoutSections.addEventListener('click', (event) => {
    const button = event.target.closest('[data-slot][data-item-id]');
    if (!button) return;
    openEquipmentDetail(button.dataset.itemId, 'stash');
});

equipmentCollection.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-slot][data-item-id]');
    if (!button) return;
    openEquipmentDetail(button.dataset.itemId, 'stash');
});

itemCollection.addEventListener('click', (event) => {
    const button = event.target.closest('[data-item-id]');
    if (!button) return;
    openEquipmentDetail(button.dataset.itemId, 'stash');
});

safeboxCollection.addEventListener('click', (event) => {
    const button = event.target.closest('[data-safebox-definition-id]');
    if (!button) return;
    openEquipmentDetail(button.dataset.safeboxDefinitionId, 'safebox', Number(button.dataset.safeboxIndex));
});

prepBackpackCollection.addEventListener('click', (event) => {
    const button = event.target.closest('[data-prep-backpack-definition-id]');
    if (!button) return;
    openEquipmentDetail(button.dataset.prepBackpackDefinitionId, 'prep-backpack', Number(button.dataset.prepBackpackIndex));
});

detailClose.addEventListener('click', closeEquipmentDetail);
equipmentDetailModal.addEventListener('click', (event) => {
    if (event.target === equipmentDetailModal) closeEquipmentDetail();
});

detailActions.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-detail-action]');
    if (!button || !activeDetailDefinitionId) return;

    const profile = store.getCurrentProfile();
    const definition = ITEM_DEFS[activeDetailDefinitionId];
    if (!definition) return;

    try {
        if (button.dataset.detailAction === 'equip') {
            await store.updateLoadout(definition.category, definition.id);
            renderAll();
            renderEquipmentDetail('Equipped.');
            return;
        }

        if (button.dataset.detailAction === 'sell') {
            const maxQuantity = getSellableCount(profile, definition.id);
            if (maxQuantity <= 0) {
                renderEquipmentDetail(isAmmoDefinition(definition.id) ? 'No ammo available.' : 'Equip another item first.');
                return;
            }
            const minQuantity = getMinimumTradeQuantity(definition.id, 'sell');
            if (maxQuantity < minQuantity) {
                renderEquipmentDetail(`Trade total must be at least ${MIN_TRADE_TOTAL} coins.`);
                return;
            }
            openTradeModal({
                type: 'inventory-sell',
                definitionId: definition.id,
                title: `Sell ${definition.name}`,
                subtitle: 'Choose how many copies to sell from your stash.',
                maxQuantity,
                initialQuantity: minQuantity,
                hint: `Available to sell: ${maxQuantity} · sells for ${getSellTradeTotal(definition.id, 1)}c each · minimum trade ${MIN_TRADE_TOTAL}c`,
                confirmLabel: 'Sell'
            });
            return;
        }

        if (button.dataset.detailAction === 'safebox') {
            if (isAmmoDefinition(definition.id)) {
                openTradeModal({
                    type: 'stash-to-safebox',
                    definitionId: definition.id,
                    title: 'Pack Ammo into Safebox',
                    subtitle: 'Choose how many rounds to store. Packs are automatically split into bundles of up to 999 rounds.',
                    maxQuantity: getAmmoCountForProfile(profile, definition.id),
                    initialQuantity: Math.min(getAmmoCountForProfile(profile, definition.id), AMMO_PACK_LIMIT),
                    hint: `Available ${definition.name}: ${getAmmoCountForProfile(profile, definition.id)} · 1 safebox slot per 1-${AMMO_PACK_LIMIT} rounds`,
                    confirmLabel: 'Pack'
                });
                return;
            }
            await store.moveItemToSafebox(definition.id);
            renderAll();
            renderEquipmentDetail(`${definition.name} moved to safebox.`);
            return;
        }

        if (button.dataset.detailAction === 'prep-backpack') {
            if (isAmmoDefinition(definition.id)) {
                openTradeModal({
                    type: 'stash-to-backpack',
                    definitionId: definition.id,
                    title: 'Pack Ammo into Backpack',
                    subtitle: 'Choose how many rounds to bring. Packs are automatically split into bundles of up to 999 rounds.',
                    maxQuantity: getAmmoCountForProfile(profile, definition.id),
                    capacity: getInventoryBackpackCapacity(profile),
                    initialQuantity: Math.min(getAmmoCountForProfile(profile, definition.id), AMMO_PACK_LIMIT),
                    hint: `Available ${definition.name}: ${getAmmoCountForProfile(profile, definition.id)} · 1 backpack slot per 1-${AMMO_PACK_LIMIT} rounds`,
                    confirmLabel: 'Pack'
                });
                return;
            }
            await store.moveItemToBackpack(definition.id, getInventoryBackpackCapacity(profile));
            renderAll();
            renderEquipmentDetail(`${definition.name} put in backpack.`);
            return;
        }

        if (button.dataset.detailAction === 'stash') {
            await store.moveSafeboxItemToStash(definition.id, activeDetailEntryIndex);
            renderAll();
            closeEquipmentDetail();
            return;
        }

        if (button.dataset.detailAction === 'backpack-to-stash') {
            await store.moveBackpackItemToStash(definition.id, activeDetailEntryIndex);
            renderAll();
            closeEquipmentDetail();
            return;
        }

        if (button.dataset.detailAction === 'unequip') {
            const unequipTargetId = getUnequipTargetId(profile, definition.category, definition.id);
            if (!unequipTargetId) {
                renderEquipmentDetail('No replacement item available.');
                return;
            }
            await store.updateLoadout(definition.category, unequipTargetId);
            renderAll();
            renderEquipmentDetail('Unequipped.');
        }
    } catch (error) {
        renderEquipmentDetail(error.message);
    }
});

marketSections.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-market-action][data-item-id]');
    if (!button) return;
    const profile = store.getCurrentProfile();
    const definition = ITEM_DEFS[button.dataset.itemId];
    if (!definition) return;

    if (button.dataset.marketAction === 'buy') {
        const maxQuantity = getMaxAffordableQuantity(profile, definition.id);
        const minQuantity = getMinimumTradeQuantity(definition.id, 'buy');
        if (maxQuantity < minQuantity) {
            setMarketMessage('Not enough coins.', true);
            return;
        }
        openTradeModal({
            type: 'market-buy',
            definitionId: definition.id,
            title: `Buy ${definition.name}`,
            subtitle: 'Enter how many copies to purchase.',
            maxQuantity,
            initialQuantity: minQuantity,
            hint: `Budget allows up to ${maxQuantity} · costs ${getBuyTradeTotal(definition.id, 1)}c each · minimum trade ${MIN_TRADE_TOTAL}c`,
            confirmLabel: 'Buy'
        });
    } else {
        const maxQuantity = getSellableCount(profile, definition.id);
        const minQuantity = getMinimumTradeQuantity(definition.id, 'sell');
        if (maxQuantity < minQuantity) {
            setMarketMessage('Nothing available to sell.', true);
            return;
        }
        openTradeModal({
            type: 'market-sell',
            definitionId: definition.id,
            title: `Sell ${definition.name}`,
            subtitle: 'Enter how many copies to sell.',
            maxQuantity,
            initialQuantity: minQuantity,
            hint: `Available to sell: ${maxQuantity} · sells for ${getSellTradeTotal(definition.id, 1)}c each · minimum trade ${MIN_TRADE_TOTAL}c`,
            confirmLabel: 'Sell'
        });
    }
});

marketTypeNav.addEventListener('click', (event) => {
    const button = event.target.closest('[data-market-nav]');
    if (!button) return;
    const section = document.getElementById(`market-section-${button.dataset.marketNav}`);
    if (!section) return;
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

tradeClose.addEventListener('click', closeTradeModal);
tradeModal.addEventListener('click', (event) => {
    if (event.target === tradeModal) closeTradeModal();
});

tradeForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!activeTradeRequest) return;

    const quantity = Math.max(1, Math.floor(Number(tradeQuantity.value) || 0));
    if (quantity > activeTradeRequest.maxQuantity) {
        tradeMessage.textContent = `Maximum allowed is ${activeTradeRequest.maxQuantity}.`;
        return;
    }

    try {
        const definition = ITEM_DEFS[activeTradeRequest.definitionId];
        if (!definition) throw new Error('Item not found.');

        if (activeTradeRequest.type === 'market-buy') {
            await store.buyItem(activeTradeRequest.definitionId, quantity);
            setMarketMessage(`Purchased x${quantity} ${definition.name}.`);
            renderAll();
            closeTradeModal();
            return;
        }

        if (activeTradeRequest.type === 'market-sell') {
            await store.sellItem(activeTradeRequest.definitionId, quantity);
            setMarketMessage(`Sold x${quantity} ${definition.name}.`);
            renderAll();
            closeTradeModal();
            return;
        }

        if (activeTradeRequest.type === 'inventory-sell') {
            await store.sellItem(activeTradeRequest.definitionId, quantity);
            renderAll();
            closeTradeModal();
            if (!equipmentDetailModal.classList.contains('hidden') && activeDetailDefinitionId === activeTradeRequest.definitionId) {
                renderEquipmentDetail(`Sold x${quantity} ${definition.name}.`);
            }
            return;
        }

        if (activeTradeRequest.type === 'stash-to-backpack') {
            await store.moveItemToBackpack(activeTradeRequest.definitionId, activeTradeRequest.capacity, quantity);
            renderAll();
            closeTradeModal();
            if (!equipmentDetailModal.classList.contains('hidden') && activeDetailDefinitionId === activeTradeRequest.definitionId) {
                renderEquipmentDetail(`Packed ${quantity} ammo into backpack (${Math.ceil(quantity / AMMO_PACK_LIMIT)} slot${Math.ceil(quantity / AMMO_PACK_LIMIT) === 1 ? '' : 's'}).`);
            }
            return;
        }

        if (activeTradeRequest.type === 'stash-to-safebox') {
            await store.moveItemToSafebox(activeTradeRequest.definitionId, quantity);
            renderAll();
            closeTradeModal();
            if (!equipmentDetailModal.classList.contains('hidden') && activeDetailDefinitionId === activeTradeRequest.definitionId) {
                renderEquipmentDetail(`Packed ${quantity} ammo into safebox (${Math.ceil(quantity / AMMO_PACK_LIMIT)} slot${Math.ceil(quantity / AMMO_PACK_LIMIT) === 1 ? '' : 's'}).`);
            }
            return;
        }
    } catch (error) {
        tradeMessage.textContent = error.message;
    }
});

crateItems.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const button = event.target.closest('[data-crate-item-id]');
    if (!button) return;
    game.takeItemFromOpenCrate(button.dataset.crateItemId);
    renderRuntimeUi();
});

raidLoadoutItems.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const button = event.target.closest('[data-raid-source="loadout"][data-slot]');
    if (!button) return;
    openRaidDetail('loadout', button.dataset.slot);
});

raidBackpackItems.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const button = event.target.closest('[data-raid-source="backpack"][data-item-id]');
    if (!button) return;
    openRaidDetail('backpack', button.dataset.itemId);
});

raidSafeboxItems.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const button = event.target.closest('[data-raid-source="safebox"][data-item-id]');
    if (!button) return;
    openRaidDetail('safebox', button.dataset.itemId);
});

raidDetailClose.addEventListener('click', closeRaidDetail);
raidDetailModal.addEventListener('click', (event) => {
    if (event.target === raidDetailModal) closeRaidDetail();
});

raidDetailActions.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const button = event.target.closest('[data-raid-action]');
    if (!button || !activeRaidDetail) return;

    let result = null;
    if (activeRaidDetail.source === 'backpack') {
        if (button.dataset.raidAction === 'equip') {
            result = game.equipBackpackItem(activeRaidDetail.identifier);
        } else if (button.dataset.raidAction === 'to-safebox') {
            result = game.moveBackpackItemToSafebox(activeRaidDetail.identifier);
        } else if (button.dataset.raidAction === 'abandon') {
            result = game.abandonBackpackItem(activeRaidDetail.identifier);
        }
    } else if (activeRaidDetail.source === 'safebox') {
        if (button.dataset.raidAction === 'to-backpack') {
            result = game.moveSafeboxItemToBackpack(activeRaidDetail.identifier);
        }
    } else {
        if (button.dataset.raidAction === 'unequip') {
            result = game.unequipLoadoutItem(activeRaidDetail.identifier);
        } else if (button.dataset.raidAction === 'abandon') {
            result = game.abandonLoadoutItem(activeRaidDetail.identifier);
        }
    }

    renderRuntimeUi();
    if (!result) return;
    if (result.ok) {
        closeRaidDetail();
    } else {
        renderRaidDetail(result.message);
    }
});

function uiLoop() {
    renderRuntimeUi();
    requestAnimationFrame(uiLoop);
}

window.addEventListener('DOMContentLoaded', async () => {
    await store.init();
    renderAll();
    uiLoop();
    setTimeout(() => {
        loading.classList.add('hidden');
        setTimeout(() => loading.remove(), 300);
    }, 200);
});
