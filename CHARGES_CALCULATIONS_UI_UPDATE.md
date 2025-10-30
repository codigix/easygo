# Charges & Calculations UI Update

## 🎯 What Changed

The **Generate Single Invoice** page has been completely restructured to match the YouTube video reference for proper charge breakdown and invoice option handling.

## 📊 New Layout Structure

### Before (Old Format)

```
Invoice Summary
┌─────────────────┬──────────────┬──────────┬───────┐
│ Subtotal        │ Fuel Charge  │ Royalty  │ GST   │
│ ₹30000.01       │ ₹1500        │ ₹600     │ ₹5760 │
└─────────────────┴──────────────┴──────────┴───────┘
Net Amount: ₹35400.01
```

### After (New Format) ✅

```
Charges & Calculations
────────────────────────────────────────
Total                    ₹30000.01
Fuel/Surcharge Tax (5%)   ₹1500.00
────────────────────────────────────────
Sub Total                ₹31500.01    ← Highlighted
────────────────────────────────────────
GST 18%                  ₹5670.00
Royalty Charge (2%)      ₹630.00
Docket Charge (1%)       ₹315.00
Other Charge             ₹0.00
Invoice Discount         -₹500.00     ← If enabled
Reverse Charge           +₹250.00     ← If enabled
────────────────────────────────────────
Net Amount               ₹35865.00    ← Highlighted
────────────────────────────────────────
```

## 🆕 New Features

### 1. **Comprehensive Charge Breakdown**

- **Total**: Starting subtotal from all consignments
- **Fuel/Surcharge Tax (%)**: Shows with percentage if > 0
- **Sub Total**: Subtotal after adding fuel surcharge (highlighted)
- **GST**: Always shown with configured percentage
- **Royalty Charge (%)**: Shows only if > 0
- **Docket Charge (%)**: Shows only if > 0
- **Other Charge**: Shows only if > 0
- **Net Amount**: Final amount (highlighted in green)

### 2. **Invoice Options Section** (NEW)

A dedicated section with conditional input fields:

#### ✅ Invoice Discount

```
☐ Invoice Discount
  [Shows only when checked ↓]
  ├─ Discount Amount (₹): [Input field]
  └─ Effect: Reduces chargeable amount BEFORE GST calculation
```

**When enabled:**

- User enters discount amount in rupees
- Discount is deducted from sub-total
- GST is calculated on the discounted amount
- Shows in calculation as: `-₹{amount}` (red text)

#### ✅ Reverse Charge

```
☐ Reverse Charge
  [Shows only when checked ↓]
  ├─ Reverse Charge Amount (₹): [Input field]
  └─ Effect: Adds to final net amount AFTER all calculations
```

**When enabled:**

- User enters reverse charge amount in rupees
- Added to final amount after GST
- Shows in calculation as: `+₹{amount}` (blue text)

## 📐 Calculation Formula

### Step-by-Step Calculation:

```
1. Calculate Charges:
   Fuel Surcharge = Subtotal × (Fuel Surcharge % / 100)
   Royalty = Subtotal × (Royalty % / 100)
   Docket = Subtotal × (Docket % / 100)
   Other = Other Charge (flat amount)

2. Get Sub Total (Chargeable Amount):
   Sub Total = Subtotal + Fuel Surcharge + Royalty + Docket + Other

3. Apply Invoice Discount (if enabled):
   Amount After Discount = Sub Total - Invoice Discount Value

4. Calculate GST:
   GST = Amount After Discount × (GST % / 100)

5. Calculate Intermediate Total:
   Intermediate = Amount After Discount + GST

6. Apply Reverse Charge (if enabled):
   Net Amount = Intermediate + Reverse Charge Value
```

### Example Calculation:

```
Customer: CODIGIIX INFOTECH
Consignments: 3 packages
───────────────────────────────────────
Subtotal (base amount):         30000.00

Fuel/Surcharge Tax (5%):         1500.00
───────────────────────────────────────
Sub Total:                       31500.00 ← Key milestone

GST 18%:                         5670.00
Royalty Charge (2%):              630.00
Docket Charge (1%):               315.00
Other Charge:                        0.00
───────────────────────────────────────
[Invoice Discount -500.00]   ← Only if enabled
[Reverse Charge +250.00]     ← Only if enabled
───────────────────────────────────────
Net Amount:                      37365.00 ← Final amount
───────────────────────────────────────
```

## 🎨 Visual Design

### Card Layout

- **White card** with rounded borders
- **Two-column grid** for each line item (label | amount)
- **Highlighted sections**: Sub Total (gray background), Net Amount (green background)
- **Color coding**:
  - Regular charges: slate gray
  - Invoice Discount: red (-₹)
  - Reverse Charge: blue (+₹)
  - Net Amount: emerald green

### Invoice Options Card

- **Separate section** below charges
- **Checkbox + Label** for each option
- **Conditional input fields** that appear when checked
- **Indented input fields** under the checkbox

## 📝 Form State

### New Form Fields Added

```javascript
formData = {
  // Existing fields
  invoice_date: "2025-01-15",
  period_from: "2024-12-01",
  period_to: "2024-12-31",

  // Charges
  gst_percent: 18,
  fuel_surcharge_percent: 5,
  royalty_charge: 2,
  docket_charge: 1,
  other_charge: 0,

  // NEW: Invoice Options
  invoice_discount: false, // Checkbox state
  invoice_discount_value: 0, // Discount amount (if enabled)
  reverse_charge: false, // Checkbox state
  reverse_charge_value: 0, // Reverse charge amount (if enabled)
};
```

## 🔄 Real-Time Updates

All calculations update in real-time as user changes:

- Customer search
- Period dates
- Charge percentages
- Invoice discount amount (when enabled)
- Reverse charge amount (when enabled)

## ✅ Testing Scenarios

### Scenario 1: Basic Invoice with Auto-Filled Rates

```
1. Search for customer: "CODIGIIX INFOTECH"
2. System auto-fills from company rate master:
   - GST: 18%
   - Fuel Surcharge: 5%
   - Royalty: 2%
   - Docket: 1%
   - Other: 0
3. Verify breakdown shows all values
4. Net Amount: ₹37365.00
```

### Scenario 2: Invoice with Discount

```
1. Search for customer with rates
2. Enable "Invoice Discount" checkbox
3. Enter discount: 500
4. Verify:
   - Shows "Invoice Discount -₹500.00" in red
   - GST calculated on discounted amount
   - Net Amount reduced accordingly
```

### Scenario 3: Invoice with Reverse Charge

```
1. Search for customer with rates
2. Enable "Reverse Charge" checkbox
3. Enter reverse charge: 250
4. Verify:
   - Shows "Reverse Charge +₹250.00" in blue
   - Added to final net amount
   - Net Amount increased by 250
```

### Scenario 4: Invoice with Both Discount & Reverse Charge

```
1. Search customer
2. Enable both options:
   - Discount: 500
   - Reverse Charge: 250
3. Verify calculations follow correct order:
   - Discount applied to sub-total
   - GST on discounted amount
   - Reverse charge added at the end
```

## 🎯 User Experience Flow

```
USER ENTERS CUSTOMER ID
        ↓
SYSTEM SEARCHES & FINDS UNBILLED CONSIGNMENTS
        ↓
SYSTEM AUTO-FILLS COMPANY RATE MASTER CHARGES
        ↓
USER SEES DETAILED BREAKDOWN IN "Charges & Calculations"
        ↓
USER OPTIONALLY ENABLES:
├─ Invoice Discount (enters amount if needed)
└─ Reverse Charge (enters amount if needed)
        ↓
REAL-TIME UPDATES IN BREAKDOWN
        ↓
USER SETS INVOICE DATES
        ↓
USER CLICKS "Generate Invoice"
```

## 📱 Responsive Design

- **Desktop**: All charges visible, proper column alignment
- **Tablet**: Stacked layout, values right-aligned
- **Mobile**: Full-width cards, easy to read

## 🔐 Data Validation

Before generating invoice:

1. ✅ Customer ID required
2. ✅ Must have unbilled consignments
3. ✅ Period from & to dates required
4. ✅ Invoice discount value must be positive (if enabled)
5. ✅ Reverse charge value must be positive (if enabled)

## 🐛 Edge Cases Handled

| Case                                | Behavior                           |
| ----------------------------------- | ---------------------------------- |
| No discount enabled                 | Field hidden, not included in calc |
| Discount = 0 (enabled but no value) | Shows 0, no impact on calculation  |
| No reverse charge                   | Field hidden, not included in calc |
| Reverse charge = 0                  | Shows 0, no impact on calculation  |
| All charges = 0                     | Still shows structure, all zeros   |
| Missing company rates               | Uses defaults (18% GST, others 0%) |

## 📊 Data Sent to Backend

When generating invoice, form includes:

```json
{
  "customer_id": "CODIGIIX INFOTECH",
  "invoice_date": "2025-01-15",
  "period_from": "2024-12-01",
  "period_to": "2024-12-31",
  "gst_percent": 18,
  "fuel_surcharge_percent": 5,
  "royalty_charge": 2,
  "docket_charge": 1,
  "other_charge": 0,
  "invoice_discount": true,
  "invoice_discount_value": 500,
  "reverse_charge": true,
  "reverse_charge_value": 250
}
```

## 🎓 Summary

| Feature           | Old           | New                 | Notes                    |
| ----------------- | ------------- | ------------------- | ------------------------ |
| Charge breakdown  | Limited       | Full ✅             | Shows all steps          |
| Invoice Discount  | Checkbox only | Checkbox + Input ✅ | Can specify amount       |
| Reverse Charge    | Checkbox only | Checkbox + Input ✅ | Can specify amount       |
| Real-time updates | Partial       | Full ✅             | All changes reflected    |
| Visual hierarchy  | Basic         | Enhanced ✅         | Highlighted key sections |
| Mobile responsive | Basic         | Full ✅             | Works on all screens     |

---

**Last Updated**: January 2025
**Status**: ✅ Complete - Ready for Testing
