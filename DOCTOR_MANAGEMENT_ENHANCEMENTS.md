# Doctor Management System Enhancements

This document outlines all the enhancements made to the Doctors Management system in the admin panel.

## Overview

Three major feature sets have been implemented:
1. **Image Upload for Doctor Profiles**
2. **Appointment Schedule Calendar**
3. **Enhanced Filters**

---

## 1. Image Upload for Doctor Profiles

### Backend Changes (`/home/daytona/codebase/src/convex/consultations.ts`)

#### New Mutations:
- **`generateUploadUrl`**: Generates a secure upload URL for image files
- **`deleteDoctorImage`**: Deletes doctor profile images from Convex storage

#### Updated Mutations:
- **`createDoctor`**: Now supports `imageStorageId` parameter to store uploaded images
- **`updateDoctor`**: Enhanced to handle both `imageStorageId` and `imageUrl` updates

### Schema Support
The `consultationDoctors` table already includes:
- `imageUrl`: String field for image URLs
- `imageStorageId`: Optional storage ID field for Convex file storage

### Frontend Implementation (`/home/daytona/codebase/src/pages/admin/AdminDoctors.tsx`)

#### New State Variables:
```typescript
const [uploadedImageId, setUploadedImageId] = useState<Id<"_storage"> | null>(null);
const [imagePreview, setImagePreview] = useState<string | null>(null);
const imageInputRef = useRef<HTMLInputElement>(null);
```

#### New Functions:
- **`handleImageUpload`**: Handles image file uploads with validation
  - Validates file type (images only)
  - Validates file size (max 5MB)
  - Uploads to Convex storage
  - Sets preview for immediate feedback

- **`handleRemoveImage`**: Removes uploaded image and clears preview

#### UI Features:
- File input with "Upload Image" button
- Image preview showing uploaded/existing images
- Remove button on preview
- Fallback to URL input for external images
- Visual feedback during upload process

---

## 2. Appointment Schedule Calendar

### Backend Changes (`/home/daytona/codebase/src/convex/consultations.ts`)

#### New Queries:
- **`getDoctorAppointments`**: Fetches appointments for a specific doctor
  - Supports date range filtering
  - Includes user details for each appointment
  - Parameters:
    - `doctorId`: Doctor's ID
    - `startDate`: Optional start date filter
    - `endDate`: Optional end date filter

- **`getDoctorAppointmentStats`**: Returns appointment statistics
  - Total appointments
  - Count by status (pending, confirmed, completed, cancelled)

#### New Mutations:
- **`updateAppointmentStatus`**: Updates appointment status and notes
  - Parameters:
    - `appointmentId`: Appointment ID
    - `status`: New status (pending/confirmed/completed/cancelled)
    - `notes`: Optional notes

### New Component (`/home/daytona/codebase/src/pages/admin/components/AppointmentCalendarDialog.tsx`)

#### Features:
- **Calendar View**:
  - Monthly calendar grid
  - Navigation between months
  - Visual indicators for appointments on dates
  - Color-coded dots by appointment status
  - Highlights selected date and today's date

- **Statistics Dashboard**:
  - Shows total appointments
  - Breakdown by status with color coding
  - Real-time updates

- **Appointment List**:
  - Lists all appointments for selected date
  - Shows patient name, time slot, consultation mode
  - Status badges with color coding
  - Click to view details

- **Appointment Details Panel**:
  - Patient information (name, phone, email)
  - Appointment time and consultation mode
  - Concern/reason for visit
  - Status update dropdown
  - Notes textarea for admin comments
  - Update button to save changes

#### UI Components Used:
- Dialog for modal display
- Card components for organized layout
- Calendar grid with date-fns for date handling
- Select dropdown for status updates
- Textarea for notes
- Badges for status display
- Icons from lucide-react

### Frontend Integration (`/home/daytona/codebase/src/pages/admin/AdminDoctors.tsx`)

#### New State:
```typescript
const [appointmentCalendarOpen, setAppointmentCalendarOpen] = useState(false);
const [selectedDoctorForCalendar, setSelectedDoctorForCalendar] = useState<{
  id: Id<"consultationDoctors">;
  name: string;
} | null>(null);
```

#### UI Changes:
- Added Calendar icon button in doctor table actions
- Button opens appointment calendar dialog
- Passes doctor ID and name to dialog

---

## 3. Enhanced Filters

### Backend Support (`/home/daytona/codebase/src/convex/consultations.ts`)

The `getPaginatedDoctors` query already supported filtering by:
- `specialization`: Filter by doctor specialization
- `city`: Filter by clinic city
- `experienceRange`: Filter by experience years (0-5, 5-10, 10+)

#### New Queries:
- **`getSpecializations`**: Returns all unique specializations from doctors
- **`getCities`**: Returns all unique cities from doctors

### Frontend Implementation (`/home/daytona/codebase/src/pages/admin/AdminDoctors.tsx`)

#### New State Variables:
```typescript
const [specializationFilter, setSpecializationFilter] = useState<string>("");
const [cityFilter, setCityFilter] = useState<string>("");
const [experienceFilter, setExperienceFilter] = useState<string>("");
```

#### New Queries:
```typescript
const specializations = useQuery(api.consultations.getSpecializations);
const cities = useQuery(api.consultations.getCities);
```

#### Updated Pagination Query:
Now passes filter parameters:
```typescript
const { results: doctors, status, loadMore, isLoading } = usePaginatedQuery(
  api.consultations.getPaginatedDoctors,
  {
    search: search || undefined,
    specialization: specializationFilter || undefined,
    city: cityFilter || undefined,
    experienceRange: experienceFilter || undefined,
  },
  { initialNumItems: 10 }
);
```

#### UI Components:
- **Specialization Filter**: Dropdown populated with all specializations
- **City Filter**: Dropdown populated with all cities
- **Experience Filter**: Dropdown with predefined ranges
  - Less than 5 years
  - 5-10 years
  - More than 10 years
- **Clear Filters Button**: Appears when any filter is active

#### Filter Layout:
All filters are displayed in a horizontal row with the search bar, creating a comprehensive filtering interface.

---

## Technical Implementation Details

### Dependencies Used:
- **date-fns**: Date manipulation and formatting for calendar
- **lucide-react**: Icons (Calendar, User, Phone, Mail, Clock, etc.)
- **Convex**: Backend queries and mutations
- **shadcn/ui**: UI components (Dialog, Select, Card, Badge, etc.)

### File Structure:
```
src/
├── convex/
│   ├── consultations.ts          # Enhanced with new queries/mutations
│   └── schema.ts                 # Already had imageStorageId field
├── pages/
│   └── admin/
│       ├── AdminDoctors.tsx      # Main component with all features
│       └── components/
│           └── AppointmentCalendarDialog.tsx  # New calendar component
```

### Key Features:
1. **Responsive Design**: All components work on mobile and desktop
2. **Real-time Updates**: Uses Convex reactive queries
3. **Validation**: File size and type validation for uploads
4. **Error Handling**: Toast notifications for success/error states
5. **Loading States**: Proper loading indicators throughout
6. **Accessibility**: Proper labels, titles, and semantic HTML

---

## Usage Guide

### Uploading Doctor Images:
1. Click "Add Doctor" or edit existing doctor
2. Click "Upload Image" button in the form
3. Select an image file (max 5MB)
4. Preview appears immediately
5. Can remove and re-upload if needed
6. Alternative: paste image URL in the URL field

### Managing Appointments:
1. Click the calendar icon next to any doctor in the table
2. View monthly calendar with appointment indicators
3. Click on any date to see appointments
4. Click on appointment to view/edit details
5. Update status and add notes
6. Click "Update Appointment" to save

### Filtering Doctors:
1. Use search bar for name-based search
2. Select specialization from dropdown
3. Select city from dropdown
4. Select experience range from dropdown
5. Filters combine for precise results
6. Click "Clear Filters" to reset

---

## API Reference

### Convex Mutations

#### `generateUploadUrl()`
Generates a secure URL for file uploads.

**Returns**: Upload URL string

#### `deleteDoctorImage({ storageId })`
Deletes an image from storage.

**Parameters**:
- `storageId`: ID of the stored file

#### `updateAppointmentStatus({ appointmentId, status, notes? })`
Updates appointment status and optional notes.

**Parameters**:
- `appointmentId`: Appointment ID
- `status`: "pending" | "confirmed" | "completed" | "cancelled"
- `notes`: Optional string

### Convex Queries

#### `getDoctorAppointments({ doctorId, startDate?, endDate? })`
Fetches doctor's appointments with optional date filtering.

**Returns**: Array of appointments with user details

#### `getDoctorAppointmentStats({ doctorId })`
Gets appointment statistics for a doctor.

**Returns**: Object with counts by status

#### `getSpecializations()`
Fetches all unique specializations.

**Returns**: Sorted array of strings

#### `getCities()`
Fetches all unique cities.

**Returns**: Sorted array of strings

---

## Testing Checklist

- [x] Image upload works with file selection
- [x] Image preview displays correctly
- [x] Image can be removed and re-uploaded
- [x] Form submits with image storage ID
- [x] Calendar displays current month correctly
- [x] Calendar navigation (prev/next month) works
- [x] Appointment indicators appear on dates
- [x] Clicking date shows appointments
- [x] Appointment details display correctly
- [x] Status update saves successfully
- [x] Filters populate with correct data
- [x] Specialization filter works
- [x] City filter works
- [x] Experience filter works
- [x] Multiple filters combine correctly
- [x] Clear filters resets all selections
- [x] Search works with filters

---

## Future Enhancements (Optional)

1. **Image Cropping**: Add image cropper before upload
2. **Bulk Image Upload**: Upload multiple doctor images at once
3. **Appointment Creation**: Create appointments from admin panel
4. **Calendar Export**: Export appointments to ICS format
5. **Advanced Filters**: Add rating, availability, services filters
6. **Filter Presets**: Save and load filter combinations
7. **Doctor Analytics**: Show appointment trends and statistics

---

## Troubleshooting

### Image Upload Issues:
- Ensure file is under 5MB
- Only image formats are accepted
- Check network connection for upload

### Calendar Not Loading:
- Verify doctor has appointments
- Check date range filters
- Ensure consultationBookings table has data

### Filters Not Working:
- Clear browser cache
- Verify filter data is populated
- Check console for errors

---

## Conclusion

All three feature sets have been successfully implemented and integrated into the existing Doctors Management system. The enhancements provide a comprehensive solution for:
- Managing doctor profile images
- Viewing and managing appointments through an intuitive calendar interface
- Filtering doctors by multiple criteria for quick access

The implementation follows best practices with proper error handling, loading states, and responsive design.
