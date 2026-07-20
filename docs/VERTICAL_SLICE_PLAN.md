# RyanGuard_Prototype - Vertical Slice Plan (Blueprint-First)

This plan targets a **tiny, playable first slice** built from the Unreal Third Person template only.

## Slice Goal

Ship one short loop (2-5 minutes):
1. Spawn in a small fantasy zone.
2. Find and open one loot chest.
3. Pick up exactly one item.
4. Reach extraction.
5. Confirm the item persists in a stash after extraction (via `SaveGame`).

## Guardrails

- Blueprint-first only (no C++).
- Single-player offline only.
- No multiplayer, Steam, blockchain, or marketplace.
- Favor speed and feel over scalability.
- Keep logic modular so Blueprint classes can later be replaced by C++ class-by-class.

---

## 1. Project setup

1. Create new Unreal project `RyanGuard_Prototype` from **Third Person** template (Blueprint).
2. Create folders:
   - `Content/Blueprints/Core`
   - `Content/Blueprints/Interaction`
   - `Content/Blueprints/Loot`
   - `Content/Blueprints/Extraction`
   - `Content/Blueprints/UI`
   - `Content/Blueprints/Save`
   - `Content/Maps`
3. Create map `LV_Prototype_Zone` and set it as Editor + Game default map.
4. Create `BP_RG_GameMode` (child of `GameModeBase`) and set as map GameMode override.
5. Create `BP_RG_GameInstance` (child of `GameInstance`) and set as project Game Instance.
6. Input mappings:
   - Keep default movement/camera/jump.
   - Add one interaction action input: `IA_Interact` (keyboard `E`).
7. Add placeholder UI font/colors and one short fantasy ambience audio loop (optional but recommended for feel).

---

## 2. Required Blueprint classes

Keep each class focused on one responsibility.

### Core
- `BP_RG_GameMode`
  - Handles run start/end routing.
- `BP_RG_GameInstance`
  - Runtime holder for stash data during session.
  - `SaveGame` load/save helper functions.
- `BP_RG_SaveGame` (`SaveGame`)
  - Persistent stash container.
  - Variables:
    - `StashItemIDs` (`Array<Name>`)

### Player/interaction
- `BPI_Interactable` (Blueprint Interface)
  - `GetInteractPrompt` (returns text)
  - `Interact` (called by player)
- `BP_InteractionComponent` (Actor Component for player)
  - Trace for interactables.
  - Shows prompt widget.
  - Calls `Interact` on target.

### Loot
- `ST_ItemData` (Blueprint Struct)
  - `ItemID` (`Name`)
  - `DisplayName` (`Text`)
  - `Description` (`Text`, optional)
- `BP_LootChest`
  - Implements `BPI_Interactable`.
  - One-time open behavior.
  - Picks/spawns one loot actor from a tiny list.
- `BP_LootPickup`
  - Implements `BPI_Interactable`.
  - Contains one `ST_ItemData`.
  - On pickup: assigns item to player carry slot, destroys self.

### Extraction
- `BP_ExtractionZone`
  - Trigger volume + VFX.
  - If player carries item, allow extraction on interact.
  - If empty-handed, show failure prompt.

### UI
- `WBP_InteractPrompt` (small center/bottom prompt).
- `WBP_CarrySlot` (shows currently carried item or "Empty").
- `WBP_ExtractionResult` ("Extracted: <ItemName>" + "Saved to stash").
- `WBP_StashDebug` (temporary simple list of stash item IDs for validation).

> C++-replacement-friendly rule: keep data passing via interface calls + structs, avoid hard-coded cross-casts except to player character for carry slot access.

---

## 3. Map/blockout

Build one compact path with clear fantasy mood:

1. `PlayerStart` at safe ruin/camp area.
2. Chest area ~20-30 seconds from spawn.
3. Extraction shrine/portal ~30-45 seconds after chest.
4. Add obvious guiding landmarks (torch lights, banners, glowing crystals).
5. Keep encounter space simple:
   - No enemies in slice 1.
   - No branching dungeons.
6. Place only:
   - 1 chest (`BP_LootChest`)
   - 1 extraction zone (`BP_ExtractionZone`)
7. Add basic post-process/fog/light color for emotional tone.

Target: first complete run should take under 2 minutes once path is known.

---

## 4. Loot chest interaction

1. Player looks at chest and presses `E`.
2. Chest checks `bHasBeenOpened`:
   - `false`: play open animation/sound, spawn one `BP_LootPickup`, set `bHasBeenOpened = true`.
   - `true`: show prompt "Chest is empty."
3. Spawn location:
   - Socket or offset above chest lid.
4. Item source:
   - Hardcode tiny array of 3 item structs in chest for speed (example IDs: `itm_relic_leaf`, `itm_ring_ash`, `itm_totem_dawn`).
   - Randomly pick one.
5. Add small reward feedback:
   - Chest glow pulse + short stinger.

---

## 5. Item pickup

Use one-item carry rule for tension and clarity.

1. Player interacts with `BP_LootPickup`.
2. Player character has variable:
   - `CarriedItem` (`ST_ItemData`)
   - `bHasCarriedItem` (`bool`)
3. Pickup logic:
   - If `bHasCarriedItem` is `false`: assign item, set bool true, destroy pickup actor, update carry UI.
   - If `true`: block pickup and show "You can only carry one item."
4. Feedback on successful pickup:
   - Sound cue
   - Small screen message: "Picked up: <DisplayName>"

---

## 6. Extraction zone

1. Extraction zone uses overlap + interact:
   - When player enters trigger, show prompt.
2. On `Interact`:
   - If `bHasCarriedItem == false`: show "You need loot to extract."
   - If `true`:
     1. Call `BP_RG_GameInstance::AddItemToStash(CarriedItem.ItemID)`
     2. Call `BP_RG_GameInstance::SaveStashToDisk()`
     3. Clear player carried slot
     4. Show extraction success UI
     5. Optional: reload level to simulate new run
3. Zone feedback:
   - Constant magical VFX ring + hum audio.
   - Brighter pulse when extraction succeeds.

---

## 7. Stash persistence using SaveGame

Implement minimal and explicit persistence:

1. On game start (`GameInstance Init`):
   - Try load slot `RG_StashSlot`.
   - If missing, create new `BP_RG_SaveGame` and save once.
   - Cache loaded `StashItemIDs` in `BP_RG_GameInstance`.
2. `AddItemToStash(ItemID)`:
   - Append `ItemID` to array (allow duplicates for now).
3. `SaveStashToDisk()`:
   - Copy runtime array into `BP_RG_SaveGame`.
   - `SaveGameToSlot`.
4. `LoadStashFromDisk()`:
   - `LoadGameFromSlot`.
5. Validation surface:
   - `WBP_StashDebug` bound to GameInstance stash array.
   - Toggle via simple key (for dev verification only).

Scope decision: no item stack limits, sorting, rarity tiers, or stash UI polish in slice 1.

---

## 8. Test checklist

Run this checklist before calling slice complete.

### Core loop
- [ ] Spawn works in `LV_Prototype_Zone`.
- [ ] Chest shows interact prompt.
- [ ] First chest interact opens chest and spawns exactly one pickup.
- [ ] Second chest interact shows empty message.
- [ ] Pickup can be collected once.
- [ ] Carry UI updates with item name.
- [ ] Cannot pick second item while carrying one.
- [ ] Extraction denies when no item carried.
- [ ] Extraction succeeds when item carried.
- [ ] Success UI appears.

### Persistence
- [ ] After successful extraction, item ID appears in stash debug view.
- [ ] Quit to menu / restart PIE, reload map.
- [ ] Stash still contains extracted item (proves `SaveGame` persistence).

### Feel/clarity
- [ ] Player can understand objective without written tutorial.
- [ ] Visual landmarks clearly guide spawn -> chest -> extraction.
- [ ] Key interactions all have audio or visual feedback.

---

## 9. Exact build order

Follow this order to stay fast and avoid rework:

1. **Project wiring**
   - Create folders, map, GameMode, GameInstance, SaveGame class, input action.
2. **Player interaction foundation**
   - Build `BPI_Interactable` + `BP_InteractionComponent`.
   - Confirm player can call `Interact` on a simple test actor.
3. **Carry slot**
   - Add `CarriedItem` + `bHasCarriedItem` to player.
   - Add `WBP_CarrySlot` and update binding.
4. **Loot chest**
   - Build chest open state + random item selection.
   - Spawn `BP_LootPickup`.
5. **Pickup actor**
   - Implement pickup success/fail (one-item limit).
6. **Extraction zone**
   - Implement deny/succeed logic.
   - Hook to GameInstance stash add + save.
7. **Save/load pass**
   - Finalize load on startup and save on extraction.
   - Add temporary stash debug widget.
8. **Map polish pass**
   - Final blockout, guiding lights, VFX/audio cues.
9. **Playtest pass**
   - Run checklist from section 8 until fully green.
10. **Vertical slice freeze**
   - Stop scope expansion.
   - Capture short video of one successful full run for internal milestone proof.

---

## Definition of done (slice 1)

The slice is done when a fresh player can complete spawn -> chest -> pickup -> extraction in one sitting, and the extracted item still appears after restarting the session.
