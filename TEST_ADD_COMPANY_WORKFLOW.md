# 🧪 Test Add Company Workflow - Step by Step

## Prerequisites

- Backend is running on port 3000
- Frontend is running on port 5173 (Vite dev server)
- You're logged in as an admin user

---

## Test Scenario 1: Create Company & Add Dox Rates

### Step 1: Navigate to Add Company Page

1. Go to: `http://localhost:5173/ratemaster/add-company`
2. You should see the "Add Company" tab active
3. Form fields are editable (not blurred)

### Step 2: Fill Company Details

Fill in the form with sample data:

- **Company ID**: `DOX001`
- **Company Name**: `DOX Express Services`
- **Company Address**: `123 Main St, City`
- **Phone**: `9876543210`
- **Email**: `dox@example.com`
- **GST No**: `27AABCD1234F2Z0`
- Leave other fields as optional

### Step 3: Click "Save Company"

- Button should say "Save Company" (enabled)
- Click it
- You should see: `✅ Company created successfully!`

  ```
  ✅ Company created successfully!

  DOX Express Services is now ready to add rates.

  Switch to courier type tabs to add rates for different slabs.
  ```

### Step 4: Verify Form State After Creation

- **Company details should now be:**
  - Blurred (opacity-50)
  - Not interactive (pointer-events-none)
  - Still visible as reference
- **Green banner should show:**
  ```
  ✅ Company Created Successfully!
  DOX Express Services has been created and is ready for rate configuration.
  ```
- **Buttons should be:**
  - "Save Company" → disabled, showing "✅ Company Created"
  - "Add New Company" → enabled (new button that appeared)

### Step 5: Switch to "Dox" Tab

1. Click on "Dox" tab
2. You should see:
   - Green banner: `✅ Company Selected: DOX Express Services`
   - Text: "Enter rates below for different slabs and save each slab independently."
   - "Dox Rate Configuration" section
   - Slab selection radio buttons (Slab 2, Slab 3, Slab 4)
   - "Slab 2" should be selected by default

### Step 6: Enter Dox Rates for Slab 2

- Table has columns: Destination, Upto Kg, Additional Kg
- Enter rates for DOX_RATE_ROWS destinations (Within City, Within State, etc.):
  ```
  Within City         | 100 | 20
  Within State        | 150 | 25
  Special Destination | 200 | 30
  Metro               | 250 | 35
  Rest of India       | 300 | 40
  Pune                | 120 | 22
  ```

### Step 7: Click "Save Slab 2" Button

- You should see three buttons: "Save Slab 2", "Save Slab 3", "Save Slab 4"
- Click "Save Slab 2"
- Button should show loading state: "Saving Slab 2..."
- You should see success alert:
  ```
  ✅ Slab 2 saved successfully!
  6 rate records added.
  ```

### Step 8: Add Slab 3

1. Click radio button for "Slab 3"
2. Table should now have 3 columns: Destination, Upto Kg, Upto Kg, Additional Kg
3. Previous Slab 2 data should NOT be visible (different slab)
4. Enter new rates with 3 columns:
   ```
   Within City         | 100 | 150 | 20
   Within State        | 150 | 200 | 25
   Special Destination | 200 | 250 | 30
   Metro               | 250 | 300 | 35
   Rest of India       | 300 | 350 | 40
   Pune                | 120 | 170 | 22
   ```

### Step 9: Click "Save Slab 3" Button

- Click "Save Slab 3"
- You should see success alert:
  ```
  ✅ Slab 3 saved successfully!
  6 rate records added.
  ```

### Step 10: Try Slab 4 (Optional)

- Click radio button for "Slab 4"
- Enter 4 columns of data
- Click "Save Slab 4"
- Verify success message

---

## Test Scenario 2: Create Another Company Without Reset

### Step 1: Click "Add New Company" Button

- Go back to "Add Company" tab
- Click "Add New Company" button (it was next to the ✅ Company Created button)
- All form fields should be cleared
- Company details section should become editable again (no blur)
- "Save Company" button should be enabled again

### Step 2: Fill New Company Details

- **Company ID**: `DTDC001`
- **Company Name**: `DTDC Courier Services`
- **Phone**: `9876543211`
- **Email**: `dtdc@example.com`
- **GST No**: `27AABCD1234F2Z1`

### Step 3: Save New Company

- Click "Save Company"
- Should see success for "DTDC Courier Services"
- Form should blur again, ready for rates

### Step 4: Try Dtdc PLUS Tab

1. Click "Dtdc PLUS" tab
2. Should see green banner: "✅ Company Selected: DTDC Courier Services"
3. Enter rates and save per slab

---

## Test Scenario 3: Error Handling

### Test Empty Rates

1. In "Dox" tab with company selected
2. Leave all rate fields empty
3. Click "Save Slab 2"
4. Should see error:
   ```
   ❌ Failed to save Slab 2:
   No valid rates entered for Dox Slab 2. Please enter at least one positive rate value.
   ```

### Test No Company Selected

1. Clear the session (reload page or different browser tab)
2. Click "Dox" tab without creating company
3. Should see yellow banner: "⚠️ No Company Selected"
4. All "Save Slab X" buttons should be disabled (grayed out)
5. Try clicking a button - should see alert: "Please create a company first!"

### Test Invalid Email

1. In "Add Company" tab
2. Fill all fields except Email
3. Put invalid email like "notanemail"
4. Click "Save Company"
5. Should get error: "Please enter a valid email address"

---

## Database Verification

After saving rates, verify data in database:

```sql
-- Check company was created
SELECT id, company_name, created_at FROM company_rate_master
WHERE company_name = 'DOX Express Services';

-- Check rates were saved
SELECT courier_type, row_name, slab_type, rates
FROM courier_company_rates
WHERE company_id = 1
ORDER BY slab_type, row_name;

-- Should see:
-- Dox | Within City | Slab 2 | {"rate_1":"100","rate_2":"20"}
-- Dox | Within City | Slab 3 | {"rate_1":"100","rate_2":"150","rate_3":"20"}
-- etc.
```

---

## Expected Outcomes

✅ **Company Creation:**

- Form stays visible
- Company details blurred but readable
- Clear success message
- Add New Company button appears

✅ **Rate Saving:**

- Per-slab save buttons work
- Individual success messages show count
- No automatic clearing after save
- Can save multiple slabs sequentially

✅ **Company Selection:**

- Courier type tabs show company selection status
- Disabled buttons when no company
- Enabled buttons when company created

✅ **Error Handling:**

- Proper error messages
- No data loss on error
- Can retry after error

✅ **Data Persistence:**

- Rates saved to database
- Proper slab_type values
- Correct courier_type association
- All rate columns present

---

## Troubleshooting

### Issue: "Please create a company first!" when company is created

- **Cause**: `createdCompanyId` state not being set
- **Solution**: Check browser console for errors in handleSubmit

### Issue: Buttons still showing "Save Rates" instead of "Save Slab 2"

- **Cause**: Code not updated or frontend not reloaded
- **Solution**: Hard refresh (Ctrl+Shift+R) or rebuild frontend

### Issue: Form not blurring after company creation

- **Cause**: CSS class not applied
- **Solution**: Check if `opacity-50 pointer-events-none` classes are on the div

### Issue: Rates not saving to database

- **Cause**: Backend endpoint issue or rates not being formatted correctly
- **Solution**: Check browser DevTools network tab for error response

### Issue: "No valid rates" error but rates are entered

- **Cause**: Rate values being treated as strings, not numbers
- **Solution**: Ensure parseFloat() is working correctly, check backend logs

---

## Success Criteria

You'll know it's working correctly when:

1. ✅ Company form doesn't clear after "Save Company"
2. ✅ Company details are blurred but visible
3. ✅ "Add New Company" button appears after creation
4. ✅ Each courier type tab shows company selection status
5. ✅ "Save Slab X" buttons are available for each slab
6. ✅ Each slab save shows individual success message
7. ✅ Rates persist in database after page refresh
8. ✅ No automatic form reset between operations
9. ✅ Error messages are specific and helpful
10. ✅ Multiple companies can be created in sequence

---

## Next Steps

After successful testing:

1. Test with multiple courier types (NonDox, Express Cargo, Priority, E-Commerce)
2. Test Slab 2, 3, and 4 for each courier type
3. Verify database relationships are correct
4. Test concurrent rate updates
5. Document any edge cases or additional improvements needed
