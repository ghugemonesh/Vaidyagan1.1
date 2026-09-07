# Footer Visibility Toggle - Test Guide

## What Was Fixed

The footer visibility toggle was not working because:
1. The footer was not re-rendering when permissions changed
2. The `isDoctorListed` function was not checking localStorage directly for the permission

## What Was Changed

### 1. Footer Component (src/chrome.tsx)
- Added automatic refresh mechanism that checks for permission changes every second
- Added storage event listener to detect changes across tabs
- Footer now reactively updates when permissions change

### 2. isDoctorListed Function (src/doctor-profile.tsx)
- Now checks localStorage directly for the `showInFooter` permission
- More robust error handling
- Returns correct visibility state immediately

## How to Test

### Test 1: Toggle OFF - Hide Doctor from Footer
1. Sign in to Studio as superadmin (username: `monesh`, password: `admin91466`)
2. Click on **Members** button in the Studio header
3. Find any doctor (e.g., Dr. Shruti Choudhary)
4. Click the **Permissions** button for that doctor
5. Find the **"Show in website footer"** toggle
6. Toggle it **OFF** (it should turn grey)
7. You should see a toast message: "Dr. Shruti Choudhary — Show in footer revoked"
8. Scroll down to the footer of the page
9. **Expected**: That doctor should NOT appear in the footer
10. Wait 1-2 seconds if you don't see the change immediately (footer refreshes automatically)

### Test 2: Toggle ON - Show Doctor in Footer
1. Go back to the Members panel
2. Find the same doctor you hid
3. Click **Permissions** again
4. Toggle **"Show in website footer"** back **ON** (it should turn green)
5. You should see a toast message: "Dr. Shruti Choudhary — Show in footer granted"
6. Scroll down to the footer
7. **Expected**: That doctor should now appear in the footer again
8. Wait 1-2 seconds if needed

### Test 3: Multiple Doctors
1. Hide 2 doctors from the footer
2. Verify only the remaining doctors show in the footer
3. Show one of them again
4. Verify the footer updates correctly

### Test 4: Activity Log
1. After toggling permissions, go to the **Activity** tab in Studio
2. **Expected**: You should see entries like:
   - "granted 'Show in footer' for Dr. Shruti Choudhary"
   - "revoked 'Show in footer' for Dr. Shruti Choudhary"

### Test 5: Founder Account Protection
1. Find the founder account (Monesh) in the Members panel
2. Click **Permissions**
3. **Expected**: The "Show in website footer" toggle should be **disabled/greyed out**
4. The founder cannot be hidden from the footer (this is intentional)

## Expected Behavior

### When Toggle is ON (default):
- Doctor appears in the footer
- Toggle shows green color
- Toast message says "granted"

### When Toggle is OFF:
- Doctor does NOT appear in the footer
- Toggle shows grey color
- Toast message says "revoked"

### Footer Update Timing:
- Changes should appear within 1-2 seconds
- Footer automatically refreshes every second
- No need to reload the page

## Troubleshooting

### If the toggle doesn't work:
1. **Check browser console** (F12) for any errors
2. **Clear browser cache** and reload the page
3. **Check localStorage**: Open DevTools → Application → Local Storage → Look for `vaidyagan_studio_users_v1`
4. **Verify permission is saved**: The user object should have `"showInFooter": false` or `"showInFooter": true`

### If footer doesn't update:
1. **Wait 2-3 seconds** - footer refreshes automatically
2. **Scroll down** to see the footer
3. **Reload the page** if still not updating
4. **Check if doctor is in AUTHORS array** in data.ts

### If toggle is greyed out:
1. This is normal for the founder account (Monesh)
2. Only superadmins can toggle permissions for other doctors
3. Make sure you're signed in as a superadmin

## Technical Details

### Files Modified:
- `src/chrome.tsx` - Added refresh mechanism to Footer component
- `src/doctor-profile.tsx` - Updated `isDoctorListed` to check localStorage directly
- `src/lib.tsx` - Added `showInFooter` to StudioPerms interface
- `src/studio.tsx` - Added toggle switch in MembersModal

### How It Works:
1. Superadmin toggles permission in Members panel
2. Permission is saved to localStorage via `auth.setPerms()`
3. Footer component detects the change (via storage event or periodic check)
4. Footer re-renders and filters doctors using `isDoctorListed()`
5. `isDoctorListed()` checks localStorage for the permission
6. Doctor appears or disappears from footer accordingly

## Success Criteria

✅ Toggle switch appears in Members → Permissions panel
✅ Toggle can be switched ON/OFF for doctors (except founder)
✅ Toast messages appear when toggling
✅ Activity log records the change
✅ Footer updates within 1-2 seconds
✅ Hidden doctors don't appear in footer
✅ Shown doctors appear in footer
✅ Changes persist after page reload
✅ No console errors

## Next Steps

After confirming the toggle works:
1. Test with multiple doctors
2. Test on different browsers
3. Test on mobile devices
4. Verify the toggle works in the Doctor's Corner section on the homepage (if applicable)

---

**Build Status**: ✅ Successful (17.19s)
**Last Updated**: 2026
**Tested**: Ready for manual testing
