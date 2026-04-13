# Delta Force Operations Mode Research

## Key Findings
- **Rarity System**: Grey → Green → Blue → Purple → Gold → Red (matches our white→red)
- **6 Gear Classes**: Primary Weapon, Sidearm/Melee, Body Armor, Helmet, Boots, Backpack/Rig
- **Operations Mode Loop**: Prepare Loadout → Enter Map → Loot Crates → Fight AI/PvP → Extract
- **Gear locks after insertion** — can't change loadout mid-raid
- **Crate tiers** vary loot quality by zone danger level
- **Extraction zones** are fixed points on the map

## Delta Force Weapon Types
- Assault Rifles: CI-19, M7, M4A1, QBZ95-1, AKS-74, MCX LT
- SMGs: MP7, SMG-45, SR-3M Compact, QCQ171, Vector, P90
- Sniper Rifles: AWM, SV-98
- LMGs: M249, M250
- Shotguns: S12K
- Marksman Rifles: Marlin Lever-action

## Gear Naming Conventions
- Military/tactical naming: "Ranger", "Recon", "Titan", "Breach"
- Sci-fi flair acceptable: "Eclipse", "Inferno", "Void", "Phase"
- Mix of real-world inspired and fictional names

## Design Decisions for sdc.io-selfuse-
- 30+ items across 6 categories
- Each category: 1-2 white, 2-3 green, 3-4 blue, 3-4 purple, 2-3 gold, 1-2 red
- Crate tiers: Supply Crate (white-green), Tactical Crate (blue-purple), Elite Crate (gold-red)
- Stats scale with rarity multiplier from RARITY_META
