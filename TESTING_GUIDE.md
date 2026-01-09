# Doctor Management Features - Testing Guide

## Pre-Testing Setup

1. Ensure your development server is running:
   ```bash
   npm run dev
   ```

2. Ensure Convex is deployed and running:
   ```bash
   npx convex dev
   ```

3. Navigate to the admin panel: `/admin/doctors`

4. Ensure you have test data:
   - At least 3-5 doctors in the system
   - Doctors with different specializations and cities
   - Some appointment bookings for testing calendar

---

## Feature 1: Image Upload Testing

### Test Case 1: Upload Valid Image
**Steps**:
1. Click "Add Doctor" button
2. Fill in required fields (name, specialization, credentials, etc.)
3. Click "Upload Image" button
4. Select a valid image file (JPG, PNG, etc., under 5MB)
5. Verify preview appears
6. Click "Create Doctor"

**Expected Result**:
- ✅ Image preview shows immediately after selection
- ✅ Success toast notification appears
- ✅ Doctor created with image visible in table
- ✅ No console errors

### Test Case 2: Upload Invalid File Type
**Steps**:
1. Click "Add Doctor"
2. Click "Upload Image"
3. Try to select a non-image file (PDF, TXT, etc.)

**Expected Result**:
- ✅ Error toast: "Please upload an image file"
- ✅ No file uploaded

### Test Case 3: Upload Oversized Image
**Steps**:
1. Click "Add Doctor"
2. Click "Upload Image"
3. Select an image larger than 5MB

**Expected Result**:
- ✅ Error toast: "Image size must be less than 5MB"
- ✅ Upload rejected

### Test Case 4: Remove Uploaded Image
**Steps**:
1. Click "Add Doctor"
2. Upload an image
3. Click the X button on preview
4. Verify image removed

**Expected Result**:
- ✅ Preview disappears
- ✅ Can upload a different image
- ✅ Form can still be submitted

### Test Case 5: Edit Doctor with Existing Image
**Steps**:
1. Click Edit icon on a doctor with an image
2. Verify existing image shows
3. Upload a new image
4. Save changes

**Expected Result**:
- ✅ Existing image displays in preview
- ✅ Can upload new image to replace
- ✅ Updated image shows after save

### Test Case 6: Use Image URL Instead of Upload
**Steps**:
1. Click "Add Doctor"
2. Don't upload image
3. Paste URL in "Image URL" field
4. Save doctor

**Expected Result**:
- ✅ Doctor created with URL image
- ✅ Image displays in table

---

## Feature 2: Appointment Calendar Testing

### Test Case 7: Open Calendar View
**Steps**:
1. Click calendar icon next to any doctor
2. Verify calendar dialog opens

**Expected Result**:
- ✅ Calendar displays current month
- ✅ Statistics show at top (total, pending, confirmed, etc.)
- ✅ Days with appointments show colored dots
- ✅ Today's date highlighted

### Test Case 8: Navigate Calendar Months
**Steps**:
1. Open calendar for a doctor
2. Click "Next" button
3. Verify month changes
4. Click "Previous" button
5. Verify month changes back

**Expected Result**:
- ✅ Month title updates
- ✅ Calendar grid updates
- ✅ Appointments load for new month
- ✅ Smooth navigation

### Test Case 9: View Appointments on Date
**Steps**:
1. Open calendar
2. Click on a date with appointment indicators (colored dots)
3. Verify appointments list appears

**Expected Result**:
- ✅ Appointments list shows on right panel
- ✅ Each appointment shows patient name, time, status
- ✅ Status badges color-coded correctly
- ✅ Consultation mode displayed

### Test Case 10: View Empty Date
**Steps**:
1. Open calendar
2. Click on a date with no appointments

**Expected Result**:
- ✅ Message: "No appointments on this date"
- ✅ No errors in console

### Test Case 11: View Appointment Details
**Steps**:
1. Open calendar
2. Click on a date with appointments
3. Click on an appointment card

**Expected Result**:
- ✅ Details panel shows below
- ✅ Patient name, phone, email displayed
- ✅ Time slot and concern shown
- ✅ Status dropdown shows current status
- ✅ Notes field populated if exists

### Test Case 12: Update Appointment Status
**Steps**:
1. Open calendar and select appointment
2. Change status in dropdown (e.g., pending → confirmed)
3. Add notes in textarea
4. Click "Update Appointment"

**Expected Result**:
- ✅ Success toast notification
- ✅ Status updates in list immediately
- ✅ Badge color changes to match new status
- ✅ Calendar dots update colors

### Test Case 13: Update Appointment Notes Only
**Steps**:
1. Select an appointment
2. Keep status same
3. Add/edit notes
4. Click "Update Appointment"

**Expected Result**:
- ✅ Notes saved successfully
- ✅ Success notification
- ✅ Notes persist when reopening appointment

### Test Case 14: Cancel Appointment
**Steps**:
1. Select appointment
2. Change status to "Cancelled"
3. Add cancellation reason in notes
4. Update

**Expected Result**:
- ✅ Status changes to cancelled
- ✅ Badge turns red
- ✅ Statistics update (cancelled count increases)

### Test Case 15: Calendar Statistics Accuracy
**Steps**:
1. Open calendar
2. Note the statistics (total, pending, confirmed, etc.)
3. Count manually from different dates
4. Verify accuracy

**Expected Result**:
- ✅ Total count matches actual appointments
- ✅ Status breakdown accurate
- ✅ Updates in real-time after status changes

---

## Feature 3: Enhanced Filters Testing

### Test Case 16: Filter by Specialization
**Steps**:
1. Click specialization dropdown
2. Select a specialization (e.g., "Dermatology")
3. Verify filtered results

**Expected Result**:
- ✅ Only doctors with selected specialization show
- ✅ Results update immediately
- ✅ Pagination works with filter

### Test Case 17: Filter by City
**Steps**:
1. Click city dropdown
2. Select a city (e.g., "Mumbai")
3. Verify filtered results

**Expected Result**:
- ✅ Only doctors in selected city show
- ✅ Results update immediately

### Test Case 18: Filter by Experience
**Steps**:
1. Click experience dropdown
2. Select "5-10 years"
3. Verify filtered results

**Expected Result**:
- ✅ Only doctors with 5-10 years experience show
- ✅ Results accurate

### Test Case 19: Combine Multiple Filters
**Steps**:
1. Select specialization: "Pediatrics"
2. Select city: "Bangalore"
3. Select experience: "10+ years"
4. Verify results

**Expected Result**:
- ✅ Results match ALL filter criteria
- ✅ Filters combine correctly (AND logic)
- ✅ Empty state if no matches

### Test Case 20: Filter with Search
**Steps**:
1. Type doctor name in search
2. Also select a specialization filter
3. Verify results

**Expected Result**:
- ✅ Results match both search and filter
- ✅ Combines properly

### Test Case 21: Clear Filters
**Steps**:
1. Apply multiple filters
2. Click "Clear Filters" button
3. Verify all cleared

**Expected Result**:
- ✅ All filter dropdowns reset to "All..."
- ✅ Full doctor list shows again
- ✅ Button disappears after clearing

### Test Case 22: Filter Dropdown Population
**Steps**:
1. Open specialization dropdown
2. Verify all specializations listed
3. Open city dropdown
4. Verify all cities listed

**Expected Result**:
- ✅ All unique specializations show
- ✅ All unique cities show
- ✅ Sorted alphabetically
- ✅ "All" option at top

### Test Case 23: Filter Persistence During Actions
**Steps**:
1. Apply filters
2. Edit a doctor
3. Save changes
4. Verify filters still applied

**Expected Result**:
- ✅ Filters remain active after edit
- ✅ Filtered view maintained

---

## Integration Testing

### Test Case 24: Image Upload + Filter
**Steps**:
1. Create doctor with uploaded image
2. Apply filter to find that doctor
3. Verify image shows

**Expected Result**:
- ✅ Uploaded image displays in filtered results
- ✅ No image loading issues

### Test Case 25: Calendar + Filter
**Steps**:
1. Apply filters to show specific doctor
2. Open calendar for filtered doctor
3. Verify appointments load

**Expected Result**:
- ✅ Calendar opens correctly
- ✅ Appointments display properly
- ✅ No filter interference

### Test Case 26: All Features Together
**Steps**:
1. Create doctor with image upload
2. Apply filters to find doctor
3. Open appointment calendar
4. Update an appointment status
5. Close calendar
6. Verify doctor still in filtered list

**Expected Result**:
- ✅ All features work together seamlessly
- ✅ No conflicts or errors
- ✅ Data consistency maintained

---

## Error Handling Testing

### Test Case 27: Network Error During Upload
**Steps**:
1. Disable network (simulate offline)
2. Try to upload image
3. Re-enable network

**Expected Result**:
- ✅ Error toast notification
- ✅ Graceful failure
- ✅ Can retry after network restored

### Test Case 28: Invalid Date in Calendar
**Steps**:
1. Open calendar
2. Navigate to future/past months
3. Verify no errors

**Expected Result**:
- ✅ Calendar handles all date ranges
- ✅ No JavaScript errors

### Test Case 29: Missing Appointment Data
**Steps**:
1. Open calendar for doctor with no appointments
2. Verify empty state

**Expected Result**:
- ✅ Empty state message shown
- ✅ No errors or crashes
- ✅ Calendar still functional

---

## Performance Testing

### Test Case 30: Large Doctor List
**Steps**:
1. Import 50+ doctors via CSV
2. Test filter performance
3. Test pagination

**Expected Result**:
- ✅ Filters respond quickly (<500ms)
- ✅ Pagination smooth
- ✅ No UI lag

### Test Case 31: Calendar with Many Appointments
**Steps**:
1. Select doctor with 50+ appointments in a month
2. Open calendar
3. Navigate dates

**Expected Result**:
- ✅ Calendar loads quickly
- ✅ Date clicking responsive
- ✅ No performance degradation

---

## Accessibility Testing

### Test Case 32: Keyboard Navigation
**Steps**:
1. Use Tab key to navigate filters
2. Use Enter to open dropdowns
3. Use arrow keys in dropdowns
4. Test calendar navigation

**Expected Result**:
- ✅ All elements keyboard accessible
- ✅ Logical tab order
- ✅ Dropdowns work with keyboard

### Test Case 33: Screen Reader Testing
**Steps**:
1. Enable screen reader
2. Navigate through filters
3. Open calendar dialog
4. Navigate appointments

**Expected Result**:
- ✅ All labels read correctly
- ✅ Form fields have proper labels
- ✅ Buttons have descriptive text

---

## Mobile Responsiveness Testing

### Test Case 34: Mobile View - Filters
**Steps**:
1. Open on mobile device or resize browser
2. Test filter dropdowns
3. Test clear filters

**Expected Result**:
- ✅ Filters stack vertically on small screens
- ✅ Dropdowns touch-friendly
- ✅ Readable and usable

### Test Case 35: Mobile View - Calendar
**Steps**:
1. Open calendar on mobile
2. Navigate months
3. Select dates and appointments

**Expected Result**:
- ✅ Calendar grid readable
- ✅ Dialog fits screen
- ✅ Touch targets adequate size
- ✅ Scrollable content

---

## Test Results Log

Use this checklist to track your testing progress:

```
[ ] Test Case 1: Upload Valid Image
[ ] Test Case 2: Upload Invalid File Type
[ ] Test Case 3: Upload Oversized Image
[ ] Test Case 4: Remove Uploaded Image
[ ] Test Case 5: Edit Doctor with Existing Image
[ ] Test Case 6: Use Image URL Instead of Upload
[ ] Test Case 7: Open Calendar View
[ ] Test Case 8: Navigate Calendar Months
[ ] Test Case 9: View Appointments on Date
[ ] Test Case 10: View Empty Date
[ ] Test Case 11: View Appointment Details
[ ] Test Case 12: Update Appointment Status
[ ] Test Case 13: Update Appointment Notes Only
[ ] Test Case 14: Cancel Appointment
[ ] Test Case 15: Calendar Statistics Accuracy
[ ] Test Case 16: Filter by Specialization
[ ] Test Case 17: Filter by City
[ ] Test Case 18: Filter by Experience
[ ] Test Case 19: Combine Multiple Filters
[ ] Test Case 20: Filter with Search
[ ] Test Case 21: Clear Filters
[ ] Test Case 22: Filter Dropdown Population
[ ] Test Case 23: Filter Persistence During Actions
[ ] Test Case 24: Image Upload + Filter
[ ] Test Case 25: Calendar + Filter
[ ] Test Case 26: All Features Together
[ ] Test Case 27: Network Error During Upload
[ ] Test Case 28: Invalid Date in Calendar
[ ] Test Case 29: Missing Appointment Data
[ ] Test Case 30: Large Doctor List
[ ] Test Case 31: Calendar with Many Appointments
[ ] Test Case 32: Keyboard Navigation
[ ] Test Case 33: Screen Reader Testing
[ ] Test Case 34: Mobile View - Filters
[ ] Test Case 35: Mobile View - Calendar
```

---

## Known Issues & Limitations

Document any issues found during testing:

1. **Issue**: [Description]
   - **Severity**: High/Medium/Low
   - **Steps to Reproduce**: [Steps]
   - **Expected**: [Expected behavior]
   - **Actual**: [Actual behavior]

---

## Test Environment

- **Browser**: Chrome/Firefox/Safari
- **OS**: Windows/Mac/Linux
- **Node Version**:
- **Convex Version**:
- **Test Date**:

---

## Sign-off

- **Tested By**: ____________
- **Date**: ____________
- **Status**: Pass / Fail / Needs Review
- **Notes**: ____________
