# Column Alignment Fix - Auto-Population Issue

## Problem Identified

When moving from Slab 2 to Slab 3, the auto-populated data had misaligned columns because the logic was copying **all columns** from the previous slab and adding one more, rather than respecting the SLAB_CONFIG structure.

### What Was Happening (Before Fix)

- **Slab 2** has **2 columns** (Upto Kg, Additional Kg)
- **Slab 3** has **3 columns** (Upto Kg, Upto Kg, Additional Kg)
- **Slab 4** has **4 columns** (Upto Kg, Upto Kg, Upto Kg, Additional Kg)

But if a user added extra columns manually in Slab 2, the auto-population would copy all those extra columns plus add another empty one, creating misalignment.

**Result**: Data ended up in wrong columns!

## Solution Implemented

Modified all 5 auto-population hooks to:

1. **Get the expected column count** for previous slab from `SLAB_CONFIG`
2. **Slice only that many columns** from previous slab rows
3. **Fill remaining columns** with empty strings to match current slab's expected column count

### Files Modified

- `c:\Users\admin\Desktop\easygo\frontend\src\pages\AddCompanyPage.jsx`

### Changes Made

#### 1. **Dox Auto-Population** (Lines 207-237)

```javascript
// Before: prevData.map((row) => [...row, ""])
// After: Only copies first 2 columns from Slab 2, adds 1 empty for Slab 3
[
  ...row.slice(0, prevSlabColumnCount),
  ...Array(currentSlabColumnCount - prevSlabColumnCount).fill(""),
];
```

#### 2. **Dtdc PLUS Auto-Population** (Lines 239-269)

Same fix as Dox - respects SLAB_CONFIG column structure

#### 3. **Express Cargo Auto-Population** (Lines 319-351)

Same fix as Dox - respects SLAB_CONFIG column structure

#### 4. **Priority Auto-Population** (Lines 353-382)

Uses numeric slabs (2, 3, 4) which directly equal column counts:

```javascript
const prevSlabColumnCount = prevSlab; // 2, 3, or 4
const currentSlabColumnCount = currentSlab; // 2, 3, or 4
```

#### 5. **Dtdc PTP Auto-Population** (Lines 271-317)

Handles two sub-tables (ptp and ptp2) with proper column alignment for both

## Column Structure Now

- **Slab 2 → Slab 3**: Takes first 2 columns, adds 1 empty = 3 total columns ✅
- **Slab 3 → Slab 4**: Takes first 3 columns, adds 1 empty = 4 total columns ✅
- **All columns now align correctly** in each slab

## Testing Steps

1. Create a company
2. Go to **Dox** tab
3. Fill in **Slab 2** with data (e.g., 50, 100)
4. Click **Save Slab 2** button
5. Switch to **Slab 3**
6. Verify that:
   - Previous data appears in first 2 columns ✅
   - Third column is empty (for new value) ✅
   - No data misalignment between columns ✅
7. Repeat for other slabs (3→4)
8. Test with other courier types: Express Cargo, Priority, Dtdc PLUS, Dtdc PTP

## Expected Behavior After Fix

- ✅ Slab 2 (2 columns) → Slab 3 auto-populated with 3 columns
- ✅ Slab 3 (3 columns) → Slab 4 auto-populated with 4 columns
- ✅ Each column in new slab has corresponding data from previous slab in same position
- ✅ Newest column is empty for user to add new values
- ✅ Works consistently across all 5 courier types

## Technical Details

**Key Change**: Using `row.slice(0, prevSlabColumnCount)` ensures we only copy the expected number of columns from the previous slab, ignoring any extra columns that might have been added manually.

This respects the fixed SLAB_CONFIG structure:

```javascript
SLAB_CONFIG = {
  "Slab 2": { columns: [...], count: 2 },
  "Slab 3": { columns: [...], count: 3 },
  "Slab 4": { columns: [...], count: 4 },
}
```
