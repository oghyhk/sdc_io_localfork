// ============================================================
// player.js — Player entity
// ============================================================

import {
    PLAYER_RADIUS, PLAYER_SPEED, PLAYER_MAX_HP,
    PLAYER_SHOOT_DAMAGE, PLAYER_SHOOT_COOLDOWN, PLAYER_BULLET_SPEED, PLAYER_BULLET_RANGE,
    PLAYER_DASH_SPEED, PLAYER_DASH_DURATION, PLAYER_DASH_COOLDOWN, PLAYER_MELEE_DAMAGE, PLAYER_MELEE_COOLDOWN,
    MAP_WIDTH, MAP_HEIGHT, PLAYER_BASE_CARRY_CAPACITY, PLAYER_MAX_ENERGY,
    PLAYER_ENERGY_DRAIN_PER_SECOND, PLAYER_ENERGY_RECOVERY_PER_SECOND, PLAYER_ENERGY_IDLE_RECOVERY_PER_SECOND,
    PLAYER_SLOW_SPEED_MULTIPLIER, PLAYER_ENERGY_RETURN_THRESHOLD
} from './constants.js';
import { clamp, normalize, generateId, angleBetween } from './utils.js';
import { createLootItem, getAmmoAmountForEntry, getItemDefinition, getRarityMeta, LOADOUT_SLOTS, RARITY_ORDER, STARTER_LOADOUT, isAmmoDefinition } from './profile.js';

export class Player {
    constructor(x, y, loadout = {}, backpackItems = [], safeboxItems = []) {
        this.id = generateId();
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = PLAYER_RADIUS;
        this.alive = true;
        this.angle = 0; // facing direction

        this.loadout = {
            gun: getItemDefinition(loadout.gun)?.category === 'gun' ? loadout.gun : 'g17',
            melee: getItemDefinition(loadout.melee)?.category === 'melee' ? loadout.melee : 'field_knife',
            armor: getItemDefinition(loadout.armor)?.category === 'armor' ? loadout.armor : 'cloth_vest',
            helmet: getItemDefinition(loadout.helmet)?.category === 'helmet' ? loadout.helmet : 'scout_cap',
            shoes: getItemDefinition(loadout.shoes)?.category === 'shoes' ? loadout.shoes : 'trail_shoes',
            backpack: getItemDefinition(loadout.backpack)?.category === 'backpack' ? loadout.backpack : 'sling_pack'
        };

        this.weaponId = this.loadout.gun;
        this.weapon = getItemDefinition(this.weaponId);
        this.melee = getItemDefinition(this.loadout.melee);
        this.armor = getItemDefinition(this.loadout.armor);
        this.helmet = getItemDefinition(this.loadout.helmet);
        this.shoes = getItemDefinition(this.loadout.shoes);
        this.backpack = getItemDefinition(this.loadout.backpack);

        this.moveSpeed = PLAYER_SPEED;
        this.carryCapacity = PLAYER_BASE_CARRY_CAPACITY;
        this.baseMoveSpeed = PLAYER_SPEED;
        this.energyMax = PLAYER_MAX_ENERGY;
        this.energy = this.energyMax;
        this.manualSlowMode = false;
        this.forcedSlowMode = false;
        this.isSlowMode = false;

        // Shooting
        this.shootCooldown = 0;
        this.ammoCapacity = 0;
        this.currentAmmo = 0;
        this.loadedAmmoQueue = [];
        this.reloadDuration = 0;
        this.reloadTimer = 0;
        this.isReloading = false;
        this.bulletSpread = 0;

        // Dash
        this.dashing = false;
        this.dashTimer = 0;
        this.dashCooldown = 0;
        this.dashDirX = 0;
        this.dashDirY = 0;

        // Loot
        this.loot = 0;
        this.inventoryItems = backpackItems
            .map((entry) => createLootItem(entry.definitionId || entry, { quantity: entry.quantity }))
            .filter(Boolean);
        this.safeboxItems = safeboxItems
            .map((entry) => createLootItem(entry.definitionId || entry, { quantity: entry.quantity }))
            .filter(Boolean)
            .slice(0, 4);

        // Consumables inventory (picked up from loot, used with Q)
        this.consumables = [];

        // Active regen effect
        this.regenPerSecond = 0;
        this.regenTimer = 0;

        // Extraction
        this.extracting = false;
        this.extractTimer = 0;

        // Damage flash
        this.damageFlash = 0;

        // Invincibility frames after taking damage
        this.invincible = 0;

        this._applyLoadoutStats(true);
        this._recalculateLootValue();
        this.reloadBestAvailableAmmo(true);
    }

    _calculateCarryCapacity(loadout) {
        let capacity = PLAYER_BASE_CARRY_CAPACITY;
        for (const slot of LOADOUT_SLOTS) {
            const definition = getItemDefinition(loadout?.[slot]);
            capacity += definition?.modifiers?.carrySlots || 0;
        }
        return capacity;
    }

    _applyLoadoutStats(resetHp = false) {
        this.weaponId = this.loadout.gun;
        this.weapon = getItemDefinition(this.weaponId);
        this.melee = getItemDefinition(this.loadout.melee);
        this.armor = getItemDefinition(this.loadout.armor);
        this.helmet = getItemDefinition(this.loadout.helmet);
        this.shoes = getItemDefinition(this.loadout.shoes);
        this.backpack = getItemDefinition(this.loadout.backpack);

        this.shootDamage = this.weapon?.stats?.damage ?? PLAYER_SHOOT_DAMAGE;
        this.shootCooldownDuration = this.weapon?.stats?.cooldown ?? PLAYER_SHOOT_COOLDOWN;
        this.bulletSpeed = this.weapon?.stats?.bulletSpeed ?? PLAYER_BULLET_SPEED;
        this.bulletRange = this.weapon?.stats?.range ?? PLAYER_BULLET_RANGE;
        this.ammoCapacity = this.weapon?.stats?.clipSize ?? 1;
        this.reloadDuration = this.weapon?.stats?.reloadTime ?? 0.8;
        this.bulletSpread = this.weapon?.stats?.spread ?? 0.03;
        this.loadedAmmoQueue = [];
        this.currentAmmo = 0;
        this.reloadTimer = 0;
        this.isReloading = false;
        this.meleeDamage = this.melee?.stats?.meleeDamage ?? PLAYER_MELEE_DAMAGE;
        this.meleeCooldown = this.melee?.stats?.meleeCooldown ?? PLAYER_MELEE_COOLDOWN;
        this.baseMoveSpeed = PLAYER_SPEED;
        this.carryCapacity = PLAYER_BASE_CARRY_CAPACITY;

        let bonusHp = 0;
        for (const item of [this.armor, this.helmet, this.shoes, this.backpack]) {
            if (!item) continue;
            bonusHp += item.modifiers?.maxHp || 0;
            this.baseMoveSpeed += item.modifiers?.speed || 0;
            this.carryCapacity += item.modifiers?.carrySlots || 0;
            if (item.modifiers?.shootCooldownMultiplier) {
                this.shootCooldownDuration *= item.modifiers.shootCooldownMultiplier;
            }
        }

        this.maxHp = PLAYER_MAX_HP + bonusHp;
        this.hp = resetHp ? this.maxHp : Math.min(this.hp, this.maxHp);
        this.moveSpeed = this.baseMoveSpeed * (this.isSlowMode ? PLAYER_SLOW_SPEED_MULTIPLIER : 1);
    }

    _recalculateLootValue() {
        this.loot = this.inventoryItems.reduce((sum, item) => sum + (item.sellValue || 0), 0);
    }

    getLoadoutView() {
        return LOADOUT_SLOTS.map((slot) => {
            const definition = getItemDefinition(this.loadout[slot]);
            return {
                slot,
                definitionId: definition?.id || null,
                name: definition?.name || 'Empty',
                category: slot,
                rarity: definition?.rarity || 'white',
                sellValue: definition?.sellValue || 0,
                description: definition?.description || '',
            };
        });
    }

    getBackpackView() {
        return this.inventoryItems.map((item) => ({ ...item }));
    }

    getSafeboxView() {
        return this.safeboxItems.map((item) => ({ ...item }));
    }

    getBackpackAmmoCount() {
        return this.inventoryItems.reduce((sum, item) => sum + getAmmoAmountForEntry(item), 0);
    }

    _hasFallbackAmmo() {
        return this.getBackpackAmmoCount() <= 0;
    }

    _getAmmoPriority(definitionId) {
        const rarity = getItemDefinition(definitionId)?.rarity || 'white';
        const orderIndex = RARITY_ORDER.indexOf(rarity);
        return orderIndex === -1 ? RARITY_ORDER.length : orderIndex;
    }

    _updateAmmoPackPresentation(item) {
        if (!isAmmoDefinition(item.definitionId)) return;
        const definition = getItemDefinition(item.definitionId);
        const quantity = getAmmoAmountForEntry(item);
        item.quantity = quantity;
        item.name = `${definition?.name || 'Ammo'} x${quantity}`;
        item.sellValue = quantity;
        item.description = `${definition?.name || 'Ammo'} pack containing ${quantity} round${quantity === 1 ? '' : 's'}.`;
    }

    _pushAmmoPackToBackpack(definitionId, quantity) {
        let remaining = Math.max(0, Math.floor(quantity || 0));
        while (remaining > 0) {
            const packSize = Math.min(999, remaining);
            this.inventoryItems.push(createLootItem(definitionId, { quantity: packSize }));
            remaining -= packSize;
        }
    }

    _returnLoadedAmmoToBackpack() {
        const ammoCounts = {};
        for (const definitionId of this.loadedAmmoQueue) {
            if (definitionId === 'ammo_white') continue;
            ammoCounts[definitionId] = (ammoCounts[definitionId] || 0) + 1;
        }
        for (const [definitionId, quantity] of Object.entries(ammoCounts)) {
            this._pushAmmoPackToBackpack(definitionId, quantity);
        }
        this.loadedAmmoQueue = [];
        this.currentAmmo = 0;
    }

    _getCurrentAmmoDefinitionId() {
        if (this.loadedAmmoQueue.length > 0) {
            return this.loadedAmmoQueue[0];
        }
        const backpackAmmo = this.inventoryItems
            .filter((item) => isAmmoDefinition(item.definitionId) && getAmmoAmountForEntry(item) > 0)
            .sort((a, b) => this._getAmmoPriority(a.definitionId) - this._getAmmoPriority(b.definitionId));
        return backpackAmmo[0]?.definitionId || 'ammo_white';
    }

    _takeAmmoFromBackpack(amount) {
        let remaining = Math.max(0, Math.floor(amount || 0));
        const loadedRounds = [];

        if (this.getBackpackAmmoCount() <= 0) {
            return Array.from({ length: remaining }, () => 'ammo_white');
        }

        while (remaining > 0) {
            const ammoEntries = this.inventoryItems
                .map((item, index) => ({ item, index }))
                .filter(({ item }) => isAmmoDefinition(item.definitionId) && getAmmoAmountForEntry(item) > 0)
                .sort((a, b) => this._getAmmoPriority(a.item.definitionId) - this._getAmmoPriority(b.item.definitionId));

            const nextAmmo = ammoEntries[0];
            if (!nextAmmo) break;

            const { item, index } = nextAmmo;
            const available = getAmmoAmountForEntry(item);
            const used = Math.min(available, remaining);
            for (let i = 0; i < used; i++) {
                loadedRounds.push(item.definitionId);
            }

            const left = available - used;
            if (left <= 0) {
                this.inventoryItems.splice(index, 1);
            } else {
                item.quantity = left;
                this._updateAmmoPackPresentation(item);
            }
            remaining -= used;
        }

        if (remaining > 0) {
            loadedRounds.push(...Array.from({ length: remaining }, () => 'ammo_white'));
        }

        return loadedRounds;
    }

    reloadBestAvailableAmmo(forceReplace = false) {
        if (forceReplace) {
            this._returnLoadedAmmoToBackpack();
        }
        const ammoNeeded = this.ammoCapacity - this.currentAmmo;
        if (ammoNeeded <= 0) return false;
        const loadedRounds = this._takeAmmoFromBackpack(ammoNeeded);
        this.loadedAmmoQueue = [...this.loadedAmmoQueue, ...loadedRounds]
            .sort((a, b) => this._getAmmoPriority(a) - this._getAmmoPriority(b));
        this.currentAmmo = this.loadedAmmoQueue.length;
        this.isReloading = false;
        this.reloadTimer = 0;
        this._recalculateLootValue();
        return loadedRounds.length > 0;
    }

    equipItemFromBackpack(itemId) {
        const index = this.inventoryItems.findIndex((item) => item.id === itemId);
        if (index === -1) return { ok: false, message: 'Item not found in backpack.' };

        const item = this.inventoryItems[index];
        if (!LOADOUT_SLOTS.includes(item.category)) return { ok: false, message: 'This item cannot be equipped.' };

        const currentDefinitionId = this.loadout[item.category];
        const nextLoadout = { ...this.loadout, [item.category]: item.definitionId };
        const nextCapacity = this._calculateCarryCapacity(nextLoadout);
        const resultingCount = this.inventoryItems.length - 1 + (currentDefinitionId ? 1 : 0);
        if (resultingCount > nextCapacity) {
            return { ok: false, message: 'Not enough backpack space for the swap.' };
        }

        this.inventoryItems.splice(index, 1);
        if (currentDefinitionId) {
            this.inventoryItems.push(createLootItem(currentDefinitionId));
        }
        this.loadout[item.category] = item.definitionId;
        this._applyLoadoutStats();
        this._recalculateLootValue();
        return { ok: true, message: `${item.name} equipped.` };
    }

    dropBackpackItem(itemId) {
        const index = this.inventoryItems.findIndex((item) => item.id === itemId);
        if (index === -1) return { ok: false, message: 'Item not found in backpack.' };
        const [item] = this.inventoryItems.splice(index, 1);
        this._recalculateLootValue();
        return { ok: true, message: `${item.name} abandoned.` };
    }

    moveBackpackItemToSafebox(itemId) {
        if (this.safeboxItems.length >= 4) {
            return { ok: false, message: 'Safebox is full.' };
        }
        const index = this.inventoryItems.findIndex((item) => item.id === itemId);
        if (index === -1) return { ok: false, message: 'Item not found in backpack.' };
        const [item] = this.inventoryItems.splice(index, 1);
        this.safeboxItems.push(item);
        this._recalculateLootValue();
        return { ok: true, message: `${item.name} moved to safebox.` };
    }

    moveSafeboxItemToBackpack(itemId) {
        if (this.inventoryItems.length >= this.carryCapacity) {
            return { ok: false, message: 'Backpack full.' };
        }
        const index = this.safeboxItems.findIndex((item) => item.id === itemId);
        if (index === -1) return { ok: false, message: 'Item not found in safebox.' };
        const [item] = this.safeboxItems.splice(index, 1);
        this.inventoryItems.push(item);
        if (isAmmoDefinition(item.definitionId) && (this.currentAmmo <= 0 || this._getAmmoPriority(item.definitionId) < this._getAmmoPriority(this._getCurrentAmmoDefinitionId()))) {
            this.reloadBestAvailableAmmo(true);
        }
        this._recalculateLootValue();
        return { ok: true, message: `${item.name} moved to backpack.` };
    }

    unequipLoadoutItem(slot) {
        const currentDefinitionId = this.loadout[slot];
        const fallbackId = STARTER_LOADOUT[slot];
        if (!currentDefinitionId || currentDefinitionId === fallbackId) {
            return { ok: false, message: 'Nothing to unequip here.' };
        }

        const nextLoadout = { ...this.loadout, [slot]: fallbackId };
        const nextCapacity = this._calculateCarryCapacity(nextLoadout);
        if (this.inventoryItems.length + 1 > nextCapacity) {
            return { ok: false, message: 'Backpack is too full to unequip this item.' };
        }

        const currentDefinition = getItemDefinition(currentDefinitionId);
        this.inventoryItems.push(createLootItem(currentDefinitionId));
        this.loadout[slot] = fallbackId;
        this._applyLoadoutStats();
        this._recalculateLootValue();
        return { ok: true, message: `${currentDefinition?.name || 'Item'} moved to backpack.` };
    }

    abandonLoadoutItem(slot) {
        const currentDefinitionId = this.loadout[slot];
        const fallbackId = STARTER_LOADOUT[slot];
        if (!currentDefinitionId || currentDefinitionId === fallbackId) {
            return { ok: false, message: 'Nothing to abandon here.' };
        }
        const currentDefinition = getItemDefinition(currentDefinitionId);
        this.loadout[slot] = fallbackId;
        this._applyLoadoutStats();
        return { ok: true, message: `${currentDefinition?.name || 'Item'} abandoned.` };
    }

    update(dt, input, wallGrid, bullets) {
        if (!this.alive) return;

        // Timers
        this.shootCooldown = Math.max(0, this.shootCooldown - dt);
        if (this.isReloading) {
            this.reloadTimer = Math.max(0, this.reloadTimer - dt);
            if (this.reloadTimer <= 0) {
                this.isReloading = false;
                this.reloadBestAvailableAmmo(false);
            }
        }
        this.dashCooldown = Math.max(0, this.dashCooldown - dt);
        this.damageFlash = Math.max(0, this.damageFlash - dt);
        this.invincible = Math.max(0, this.invincible - dt);

        // Regen effect
        if (this.regenTimer > 0) {
            this.regenTimer = Math.max(0, this.regenTimer - dt);
            this.heal(this.regenPerSecond * dt);
            if (this.regenTimer <= 0) {
                this.regenPerSecond = 0;
            }
        }

        // Aim angle
        this.angle = angleBetween(this.x, this.y, input.aimWorld.x, input.aimWorld.y);

        const isMoving = input.moveDir.x !== 0 || input.moveDir.y !== 0;
        const energyRatio = this.energy / this.energyMax;

        if (input.modeToggleRequested) {
            if (energyRatio > PLAYER_ENERGY_RETURN_THRESHOLD && !this.forcedSlowMode) {
                this.manualSlowMode = !this.manualSlowMode;
            }
        }

        if (!this.dashing) {
            if (!this.manualSlowMode && !this.forcedSlowMode && isMoving) {
                this.energy = Math.max(0, this.energy - PLAYER_ENERGY_DRAIN_PER_SECOND * dt);
            } else {
                const recoveryRate = isMoving ? PLAYER_ENERGY_RECOVERY_PER_SECOND : PLAYER_ENERGY_IDLE_RECOVERY_PER_SECOND;
                this.energy = Math.min(this.energyMax, this.energy + recoveryRate * dt);
            }
        }

        if (this.energy <= 0) {
            this.energy = 0;
            this.forcedSlowMode = true;
        }

        const nextEnergyRatio = this.energy / this.energyMax;
        if (this.forcedSlowMode && nextEnergyRatio >= PLAYER_ENERGY_RETURN_THRESHOLD) {
            this.forcedSlowMode = false;
        }

        this.isSlowMode = this.forcedSlowMode || this.manualSlowMode;

        this.moveSpeed = this.baseMoveSpeed * (this.isSlowMode ? PLAYER_SLOW_SPEED_MULTIPLIER : 1);

        // Dash initiation
        if (input.dashRequested && !this.dashing && this.dashCooldown <= 0) {
            const dir = input.moveDir;
            if (dir.x !== 0 || dir.y !== 0) {
                this.dashing = true;
                this.dashTimer = PLAYER_DASH_DURATION;
                this.dashCooldown = PLAYER_DASH_COOLDOWN;
                const n = normalize(dir.x, dir.y);
                this.dashDirX = n.x;
                this.dashDirY = n.y;
                this.invincible = PLAYER_DASH_DURATION; // i-frames during dash
            }
        }

        // Movement
        let speed = PLAYER_SPEED;
        let moveX, moveY;

        if (this.dashing) {
            this.dashTimer -= dt;
            if (this.dashTimer <= 0) {
                this.dashing = false;
            }
            moveX = this.dashDirX * PLAYER_DASH_SPEED;
            moveY = this.dashDirY * PLAYER_DASH_SPEED;
        } else {
            moveX = input.moveDir.x * this.moveSpeed;
            moveY = input.moveDir.y * this.moveSpeed;
        }

        this.x += moveX * dt;
        this.y += moveY * dt;

        // Wall collision
        this._resolveWalls(wallGrid);

        // Map bounds
        this.x = clamp(this.x, this.radius, MAP_WIDTH - this.radius);
        this.y = clamp(this.y, this.radius, MAP_HEIGHT - this.radius);

        if (!input.shooting && !this.isReloading && this.currentAmmo < this.ammoCapacity && (this.getBackpackAmmoCount() > 0 || this._hasFallbackAmmo())) {
            this.startReload();
        }

        if (input.shooting && this.isReloading && this.currentAmmo > 0) {
            this.isReloading = false;
            this.reloadTimer = 0;
        }

        // Shooting
        if (input.shooting && this.shootCooldown <= 0 && !this.dashing) {
            if (this.isReloading) {
                return;
            }
            if (this.currentAmmo <= 0) {
                this.startReload();
                return;
            }
            this._shoot(input.aimWorld, bullets);
            this.currentAmmo = this.loadedAmmoQueue.length;
            this.shootCooldown = this.shootCooldownDuration;
        }
    }

    startReload() {
        if (this.isReloading || this.currentAmmo >= this.ammoCapacity) return false;
        this.isReloading = true;
        this.reloadTimer = this.reloadDuration;
        return true;
    }

    _shoot(aimWorld, bullets) {
        const ammoDefinitionId = this.loadedAmmoQueue.shift() || this._getCurrentAmmoDefinitionId();
        const ammoDefinition = getItemDefinition(ammoDefinitionId);
        const ammoColor = getRarityMeta(ammoDefinition?.rarity || 'white').color;
        const damageMultiplier = ammoDefinition?.damageMultiplier ?? 1;
        const angle = angleBetween(this.x, this.y, aimWorld.x, aimWorld.y) + ((Math.random() * 2) - 1) * this.bulletSpread;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        bullets.push({
            id: generateId(),
            x: this.x + cos * (this.radius + 4),
            y: this.y + sin * (this.radius + 4),
            vx: cos * this.bulletSpeed,
            vy: sin * this.bulletSpeed,
            damage: this.shootDamage * damageMultiplier,
            owner: 'player',
            ammoDefinitionId,
            color: ammoColor,
            instantKill: Boolean(ammoDefinition?.instantKill),
            radius: 4,
            life: this.bulletRange / this.bulletSpeed,
            maxLife: this.bulletRange / this.bulletSpeed
        });
    }

    _resolveWalls(wallGrid) {
        const nearby = wallGrid.getNearby(this.x, this.y, this.radius + 10);
        for (const w of nearby) {
            const closestX = clamp(this.x, w.x, w.x + w.w);
            const closestY = clamp(this.y, w.y, w.y + w.h);
            const dx = this.x - closestX;
            const dy = this.y - closestY;
            const dSq = dx * dx + dy * dy;
            if (dSq < this.radius * this.radius && dSq > 0) {
                const d = Math.sqrt(dSq);
                const overlap = this.radius - d;
                this.x += (dx / d) * overlap;
                this.y += (dy / d) * overlap;
            } else if (dSq === 0) {
                // Inside wall — push out
                this.x += 1;
                this.y += 1;
            }
        }
    }

    takeDamage(amount) {
        if (this.invincible > 0) return;
        this.hp -= amount;
        this.damageFlash = 0.15;
        this.invincible = 0.2;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    addConsumable(definitionId) {
        const def = getItemDefinition(definitionId);
        if (!def || def.category !== 'consumable') return false;
        this.consumables.push(definitionId);
        return true;
    }

    getConsumableCount() {
        return this.consumables.length;
    }

    useConsumable() {
        if (this.consumables.length === 0) return false;
        const definitionId = this.consumables.shift();
        const def = getItemDefinition(definitionId);
        if (!def) return false;

        if (def.healAmount === -1) {
            // Full heal
            this.hp = this.maxHp;
        } else if (def.healAmount > 0) {
            this.heal(def.healAmount);
        }

        if (def.restoreEnergy) {
            this.energy = this.energyMax;
        }

        if (def.regenPerSecond && def.regenDuration) {
            this.regenPerSecond = def.regenPerSecond;
            this.regenTimer = def.regenDuration;
        }

        return { definitionId, name: def.name };
    }

    addItem(item) {
        if (this.inventoryItems.length >= this.carryCapacity) {
            return false;
        }
        this.inventoryItems.push(item);
        this.loot += item.sellValue || 0;
        return true;
    }

    getCarriedItemCount() {
        return this.inventoryItems.length;
    }

    canReturnToNormalMode() {
        return !this.forcedSlowMode && this.energy / this.energyMax > PLAYER_ENERGY_RETURN_THRESHOLD;
    }

    getWeaponHudInfo() {
        const reserveAmmo = this.getBackpackAmmoCount();
        const ammoDefinitionId = this._getCurrentAmmoDefinitionId();
        const ammoMeta = getRarityMeta(getItemDefinition(ammoDefinitionId)?.rarity || 'white');
        if (this.isReloading) {
            return {
                text: `${this.weapon?.name || 'Gun'} · RELOADING ${this.reloadTimer.toFixed(1)}s · RESERVE ${reserveAmmo > 0 ? reserveAmmo : '∞'}`,
                color: ammoMeta.color,
                ammoDefinitionId,
            };
        }
        return {
            text: `${this.weapon?.name || 'Gun'} · AMMO ${this.currentAmmo}/${this.ammoCapacity} · RESERVE ${reserveAmmo > 0 ? reserveAmmo : '∞'}`,
            color: ammoMeta.color,
            ammoDefinitionId,
        };
    }
}
