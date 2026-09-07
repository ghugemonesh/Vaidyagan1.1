# Footer Visibility Toggle - Implementation Summary

## Overview
Added a toggle switch in the Studio Members panel to control whether each member appears in the website footer section. This feature was previously available but has been re-implemented as part of the member permissions system.

## Changes Made

### 1. Updated StudioPerms Interface (src/lib.tsx)
- Added `showInFooter: boolean` field to the `StudioPerms` interface
- Updated `DEFAULT_PERMS` to include `showInFooter: true` (members show in footer by default)

### 2. Added Permission Toggle in MembersModal (src/studio.tsx)
- Added a new `PermSwitch` component in the permissions grid (line 279)
- Label: "Show in website footer"
- Description: "Display this doctor in the footer section."
- Disabled for the root/founder account (always shows)
- Logs activity when toggled: "granted/revoked 'Show in footer' for [name]"

### 3. Updated isDoctorListed Function (src/doctor-profile.tsx)
- Imported `auth` from "./lib" to access user permissions
- Updated the function to check both:
  1. The doctor profile's `listed` field (existing behavior)
  2. The user's `showInFooter` permission (new behavior)
- Returns `false` if either check fails
- Includes error handling for cases where auth is not available

## How It Works

### For Superadmins
1. Go to Studio → Members
2. Click "Permissions" button for any member
3. Toggle "Show in website footer" switch
4. Changes apply immediately to the website footer

### For the Footer
The footer now filters doctors using `isDoctorListed(a.id)` which checks:
- Is the doctor's profile marked as listed? (existing)
- Does the user have `showInFooter` permission? (new)

Both must be true for the doctor to appear in the footer.

## Default Behavior
- All new members have `showInFooter: true` by default
- Existing members will get this permission via the `normalizeUser` function
- The root/founder account cannot have this permission toggled off

## Bug Fix Applied

**Issue:** The toggle was not working because of an ID mismatch:
- The `AUTHORS` array in `data.ts` uses ID `"monesh"` for Dr. Monesh L Ghuge
- The auth system in `lib.tsx` uses ID `"root"` with username `"monesh"`
- When the footer checked `isDoctorListed("monesh")`, it couldn't find a matching user

**Solution:** Updated `isDoctorListed` to check both user ID and username:
```typescript
const user = users.find((u) => u.id === userId || u.username === userId);
```
This allows the function to find users whether they're referenced by their ID or username.

## Testing Checklist
- [x] Build passes without errors
- [x] Permission toggle appears in Members panel
- [x] Toggle is disabled for root account
- [x] Toggling off removes doctor from footer
- [x] Toggling on adds doctor back to footer
- [x] Activity log records the change
- [x] Toast notification confirms the action
- [x] ID mismatch bug fixed (monesh/root mapping works)

## Files Modified
1. `src/lib.tsx` - Added permission field and default value
2. `src/studio.tsx` - Added toggle switch in MembersModal
3. `src/doctor-profile.tsx` - Updated visibility check logic

## Security Considerations
- Only superadmins can modify this permission (via Members panel)
- The root account is protected from being hidden
- Changes are logged in the activity log for audit trail
- Permission is checked on every footer render

## Future Enhancements
- Could add bulk toggle for all members
- Could add preview of footer before saving
- Could add permission to control visibility in other sections (e.g., Doctor's Corner on homepage)
