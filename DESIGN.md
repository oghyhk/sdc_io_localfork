# SDC.IO — Game Design Document

## 1. Core Gameplay Loop

**Prepare Loadout → Enter Raid → Open Crates → Take Items → Fight → Extract**

1. The player selects a six-slot loadout from the menu inventory.
2. The player deploys into a 2D top-down map with enemies, combat zones, loot-crate rooms, and extraction points.
3. Loot is no longer loose cash on the ground. Instead, the player must move beside a crate and press `F` to open or close it.
4. Each crate contains **1 to 4 items**. Items are shown in a centered loot panel and can be taken individually by clicking them.
5. Opened crates remain visually marked as already inspected even after they are closed.
6. The player survives combat, manages carry capacity, and decides which items are worth taking.
7. Standing inside an extraction zone for 3 seconds secures the carried items into the player stash for later trading.
8. Death still causes full run failure.

---

## 2. Item Model

### Six Equipment Classes
The current prototype now treats all major loot as one of these six categories:

1. **Guns**
2. **Melee Weapons**
3. **Armors**
4. **Helmets**
5. **Shoes**
6. **Backpacks**

The player inventory screen supports equipping one item from each class.

### Ammo
Ammo is a separate loot type (not equipment) with six rarity tiers from Gray to Red. Each tier has a distinct damage multiplier and sell value. Ammo is stored in a dedicated `stashAmmo` map rather than the equipment stash. See **Section 10** for full details.

### Example Items
The game includes 36 items across all six categories and rarity tiers:

- **Guns**: Militia Carbine (White), Ranger SMG (Green), Spectre Assault Rifle (Blue), Eclipse DMR (Purple), Aurora LMG (Gold), Inferno Railgun (Red)
- **Melee Weapons**: Field Knife (White), Breach Hatchet (Green), Ion Blade (Blue), Revenant Machete (Purple), Wraith Katana (Gold), Doom Cleaver (Red)
- **Armors**: Cloth Vest (White), Kevlar Weave (Green), Ranger Plate (Blue), Warden Vest (Purple), Titan Rig (Gold), Bastion Plate (Red)
- **Helmets**: Scout Cap (White), Recon Helmet (Green), Sentinel Helm (Blue), Eclipse Visor (Purple), Fortress Mask (Gold), Phantom Crown (Red)
- **Shoes**: Trail Shoes (White), Runner Boots (Green), Phase Greaves (Blue), Phantom Sprinters (Purple), Blitz Treads (Gold), Warp Drivers (Red)
- **Backpacks**: Sling Pack (White), Scout Pack (Green), Mule Pack (Blue), Siege Rucksack (Purple), Cargo Titan (Gold), Void Satchel (Red)
- **Consumables**: Field Bandage (White), Med Kit (Green), Stim Syringe (Blue), Combat Medic Pack (Purple), Regen Injector (Gold), Nano Serum (Red)

### Consumables System
Consumable items are picked up from loot crates during raids and stored in a separate consumable pouch (max 5). They do NOT take up backpack carry slots. Press **Q** to use a consumable. The HUD shows consumable count when any are held.

| Item | Rarity | Heal | Special |
|------|--------|------|---------|
| Field Bandage | White | 20 HP | — |
| Med Kit | Green | 35 HP | — |
| Stim Syringe | Blue | 50 HP | — |
| Combat Medic Pack | Purple | 70 HP | — |
| Regen Injector | Gold | 100 HP | +2 HP/sec for 15 sec |
| Nano Serum | Red | Full HP | + Full energy restore |

### Item Images
Each item has a 512x512 PNG image stored in `assets/items/`. Images are displayed in:
- **Inventory loadout cards** — 64px thumbnail alongside item name, description, and stats
- **Market cards** — full-width image above item details
- **Crate loot panel** — full-width image above item details when opening crates during a raid

The `getItemImagePath(definitionId)` function in `profile.js` returns the image path as `assets/items/<definitionId>.png`.

### Rarity Ladder
All items, including equipment, follow this rarity order from highest to lowest:

**Red > Gold > Purple > Blue > Green > White**

Rarity affects:
- visual color coding
- crate excitement/readability
- market value
- equipment quality and stat expectations

---

## 3. Loot Crates

### Crate Behavior
- Crates are distributed across safe, combat, and high-value zones.
- The player must be within interaction range.
- Pressing `F` toggles the nearest crate open or closed.
- Once opened at least once, a crate is marked as **inspected** visually.
- Crates may become empty after all items are taken.

### Crate Tiers
Crates come in three tiers that determine loot quality:
- **Supply** — green and below, found in safe zones
- **Tactical** — blue and below, found in combat zones
- **Elite** — red and below, found in high-value zones

Each tier has its own image (`crate_supply.png`, `crate_tactical.png`, `crate_elite.png`) and the crate is colored to match its tier.

### Crate UI Direction
The prototype now uses a **centered loot panel** while raiding.
This is aligned with the general readability goal of extraction shooters:
- nearby crate prompt
- visible item list
- click-to-take behavior
- rarity color indicators
- clear empty-state feedback

This is conceptually similar to modern extraction-mode inventory interactions without copying proprietary UI assets.

---

## 4. Visual Direction

- Minimalist geometric art remains intact.
- The map, enemies, and player use simple readable shapes.
- Loot crates are rendered as simple boxes with different states:
  - unopened
  - opened
  - inspected/opened-before
- Rarity is emphasized through strong color accents in the loot panel and item markers.

---

## 5. Technical Structure

```
index.html          — Entry point + DOM overlays
assets/
  items/            — 512x512 PNG images for all 36 items + 3 crate tiers
js/
  app.js            — Menu, inventory, auth, and crate-panel UI
  game.js           — Main loop, raid state, extraction summary, crate interaction
  player.js         — Player movement, loadout stats, carried items
  enemy.js          — AI enemies
  map.js            — Procedural map generation and crate placement
  renderer.js       — Canvas rendering for world, crates, HUD, minimap
  profile.js        — Item catalog, rarity data, stash persistence, loadout logic, item image paths
  input.js          — Keyboard/mouse commands including `F` interaction
  audio.js          — Procedural sound
  constants.js      — Shared config
  utils.js          — Math and collision helpers
```

---

## 6. Inventory and Persistence

### Menu Layer
The front page now supports:
- **Start Game**
- **Inventory**
- **Market**
- **Login / Sign Up** button

### Inventory Layer
The inventory page allows the player to:
- view saved coins
- inspect extracted loot history
- equip one item for each of the six categories
- review stash totals by rarity

### Market Layer
The market page allows the player to:
- buy any currently defined item for coins
- sell owned items back for coins
- compare rarity, category, and owned counts in one place

### Persistence
For the prototype, account and stash data are stored in a **local JSON file** served through a lightweight local API.
Saved data includes:
- username/password (prototype only)
- equipped loadout
- stash items
- extracted run history
- total coins

---

## 7. Gameplay Consequences of Gear

The prototype currently uses equipment to affect the raid by modifying:
- gun damage / fire rate / range
- melee damage / melee cooldown
- armor and helmet max HP
- shoes movement speed
- backpack carry capacity

### Carry Space
- base carry capacity is now **10** without a backpack
- backpacks add extra carry space on top of that base value

### Energy and Pace Control
- the bottom-center status area contains health, carry, and a thinner white energy bar
- moving in **normal mode** drains energy
- pressing `R` toggles between **normal** and **slow** mode
- while in **slow mode**, energy regenerates
- if energy is depleted, the player is forced into slow mode
- the player can only switch back to normal mode once energy is above **20%**

This gives the inventory page direct gameplay relevance.

---

## 8. Multiplayer-Ready Considerations

The new crate system is still designed with future multiplayer in mind.

### Server-Authoritative Targets Later
The following actions would need server validation in multiplayer:
- login and profile saves
- crate open / close state
- crate contents
- item pickup from crates
- player carry inventory
- extraction result calculation
- stash rewards after raid
- market trades and coin balances

### Why Current Structure Helps
The current architecture already separates:
- input commands
- world state
- UI rendering
- persistent player profile data

That makes it easier later to move raid logic to an authoritative backend while keeping menu/inventory UI on the client.

---

## 9. Current MVP Rules

### Win
- Extract alive with carried items.

### Lose
- Die before extraction.
- Death penalties vary by difficulty — see **Section 12** for details.

### Controls
- `WASD` / arrow keys: move
- mouse: aim
- left click: shoot
- `Space`: dash
- `R`: toggle normal / slow movement mode
- `F`: open / close nearby crate
- click loot entries in the crate panel: take item

---

## 10. Ammo Rarity System

### Ammo Tiers
Ammo is a distinct loot type split into six rarity tiers, each stored as a separate pack:

| Rarity | Definition ID | Damage Multiplier | Sell Value | Color |
|--------|---------------|-------------------|------------|-------|
| **Gray (White)** | `ammo_white` | ×0.2 (free fallback) | 1 | `#aaa` (gray) |
| **Green** | `ammo_green` | ×1.0 | 8 | green |
| **Blue** | `ammo_blue` | ×1.05 | 250 | blue |
| **Purple** | `ammo_purple` | ×1.2 | 5,000 | purple |
| **Gold** | `ammo_gold` | ×1.4 | 25,000 | gold |
| **Red** | `ammo_red` | Instant Kill | 1,000,000 | red |

Ammo definitions live in `ITEM_DEFS` in `profile.js`. The priority ordering (highest → lowest) is maintained in `AMMO_DEFINITION_IDS`: `['ammo_red', 'ammo_gold', 'ammo_purple', 'ammo_blue', 'ammo_green', 'ammo_white']`.

### Stash Ammo Storage
Ammo is persisted separately from equipment in a `stashAmmo` map (`{ [definitionId]: count }`), not in `stashItems`. On profile load, `normalizeStashAmmo()` migrates any legacy ammo entries from the items array into this map.

### Priority-based Loading
- On raid start, the gun magazine starts **empty**.
- `reloadBestAvailableAmmo(forceReplace)` draws ammo from the backpack, filling the magazine with the **highest-rarity ammo first** using `_getAmmoPriority()` (lower index in `AMMO_DEFINITION_IDS` = higher priority).
- When all non-gray backpack ammo is exhausted, the remaining magazine slots are filled with free gray ammo.
- Each round in the magazine tracks its own `ammoDefinitionId`, so a single magazine can contain mixed-rarity rounds sorted by priority.

### Gray Ammo — Free Unlimited Fallback
Gray ammo (`ammo_white`) is a special tier with these rules:
- **Unlimited & free**: always available as a fallback; never runs out.
- **Damage ×0.2**: significantly weaker than any purchased ammo.
- **Cannot be persisted**: `addAmmoToProfile()` and `removeAmmoFromProfile()` silently skip it; `createPersistentEntryFromLootItem()` returns `null` for it.
- **Cannot be extracted**: `recordExtraction()` skips gray ammo items.
- **Cannot be stored**: `moveItemToSafebox()` and `moveItemToBackpack()` throw errors for gray ammo.
- **Cannot be traded**: the market UI shows "Locked" for gray ammo; buy/sell operations throw errors.
- **Reserve shows ∞**: when no non-gray ammo is in the backpack, the HUD reserve counter displays `∞`.

Guard functions:
- `isFreeFallbackAmmo(definitionId)` — returns `true` for `ammo_white`.
- `isMarketLockedAmmo(definitionId)` — returns `true` for `ammo_white`.

### Shooting & Bullet Behavior
- Each shot shifts one round from `loadedAmmoQueue`.
- The bullet inherits the round's `damageMultiplier`, `instantKill` flag, and rarity **color**.
- `game.js` applies instant-kill logic: if `b.instantKill` is true, the bullet deals `e.maxHp` damage, killing any enemy in one hit.
- Bullets are rendered on canvas in the color of their ammo rarity via `b.color` in `renderer.js`.

### Auto-reload Triggers
1. **Raid start** — `reloadBestAvailableAmmo(true)` is called when the player spawns.
2. **Safebox → Backpack transfer** — if the moved item is ammo with higher priority than the currently loaded round, `reloadBestAvailableAmmo(true)` is called to upgrade the magazine.
3. **Manual reload** — standard reload timer applies as before.

---

## 11. Dynamic HUD Coloring

The weapon HUD text at the bottom of the screen dynamically changes color based on the highest-priority ammo currently loaded:
- `player.getWeaponHudInfo()` returns `{ text, color, ammoDefinitionId }` instead of the old plain-text function.
- `renderer.js` renders the HUD text with `weaponHud.color` at 16px bold with an 8px shadow glow for readability.
- When reloading, the color reflects the next round's rarity. When the magazine is empty and only gray fallback remains, the HUD color is gray.

---

## 12. Difficulty-based Death Penalties

On death, penalties are determined by the raid difficulty setting:

| Difficulty | Backpack Lost | Gun Lost | Other Equipped Slots | Safebox |
|------------|---------------|----------|----------------------|---------|
| **Easy** | Yes (always) | No | No | Safe |
| **Advanced** | Yes (always) | Always | 15% chance each | Safe |
| **Hell** | Yes (always) | Always | Always | Safe |

Implementation: `applyDeathLosses(profile, difficulty)` in `profile.js`:
- `easy` — returns immediately; only backpack contents are lost (handled separately by `applyRaidOutcome`).
- `advanced` — always removes the equipped gun from stash; each other equipped slot has a 15% independent chance of removal.
- `hell` — removes all equipped items from stash (every slot).
- The **safebox** is never touched regardless of difficulty.

`ProfileStore.applyRaidOutcome()` accepts a `difficulty` parameter from `game.js` (`this.activeDifficulty`).

---

## 13. Safebox

- The safebox is a protected storage area (capacity: `SAFEBOX_CAPACITY`) separate from the main stash.
- Items in the safebox are **never lost on death**, regardless of difficulty.
- Safebox ammo is **not auto-moved** to the backpack on raid start — the player must explicitly move items via a "Move to Backpack" action.
- Moving ammo from safebox to backpack can trigger an auto-reload if the transferred ammo has higher priority than the currently loaded round.
- Gray ammo cannot be placed in the safebox (it's free and unlimited).

---

## 14. Inventory Value Display

The top-right corner of the screen shows account information including:
- Username/login status
- **Inv Value** — displayed below the account info in gold (`#ffca28`), 13px, font-weight 900.
- Inv Value = total coins + the sum of `sellValue` for every item in stash, backpack, and safebox.
- Calculated by `getProfileInventoryValue(profile)` in `profile.js`.
- Rendered via an `.auth-status-value` span in the `.auth-status-button` container.

---

## 15. Redeem Code System

A **Redeem** button is displayed in the top-left bar next to the game brand. It opens a prompt for entering redemption codes:

| Code | Reward |
|------|--------|
| `oghyhk` | +10,000 coins |
| `2598` | Prompts for a custom coin amount to add |

Implementation: `redeemButton` click handler in `app.js` calls `ProfileStore.addCoins()` and re-renders the auth status.

---

## 16. Next Refinement Opportunities

Recommended next passes:
1. add true melee attack input and enemy stagger
2. add item size / slot weight instead of simple carry count
3. add stash filtering and sorting tools in inventory
4. harden the local API auth model before any wider release
5. add multiplayer-safe server authority for crate ownership, item pickup, and market sync
