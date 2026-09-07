# Footer Toggle - Testing Guide

## Quick Test Steps

### Test 1: Toggle Works for Regular Members
1. **Login as Superadmin**
   - Username: `monesh`
   - Password: `admin91466`

2. **Open Members Panel**
   - Go to Studio → Members
   - Click "Permissions" button for any doctor (e.g., Dr. Shruti Choudhary)

3. **Toggle Footer Visibility**
   - Find "Show in website footer" toggle
   - Toggle it OFF
   - You should see a toast: "Dr. Shruti Choudhary — Show in footer revoked"

4. **Check Footer**
   - Scroll to the bottom of any page
   - Dr. Shruti Choudhary should NOT appear in the footer
   - Other doctors should still appear

5. **Toggle Back ON**
   - Go back to Members → Permissions
   - Toggle "Show in website footer" ON
   - Dr. Shruti Choudhary should reappear in the footer

### Test 2: Root Account Protection
1. **Try to Toggle Root Account**
   - In Members panel, click "Permissions" for Monesh (the founder)
   - The "Show in website footer" toggle should be DISABLED (greyed out)
   - This prevents accidentally hiding the founder

### Test 3: Activity Log
1. **Check Activity Log**
   - After toggling, go to Studio → Activity
   - You should see an entry like: "granted/revoked 'Show in footer' for [Doctor Name]"

### Test 4: Multiple Doctors
1. **Test with Multiple Doctors**
   - Toggle OFF for Dr. Shruti
   - Toggle OFF for Dr. Bhagyesh
   - Check footer - only Dr. Shivani and Monesh should appear
   - Toggle them back ON one by one
   - Verify each appears immediately

### Test 5: Persistence
1. **Refresh the Page**
   - After toggling a doctor OFF
   - Refresh the browser (F5)
   - The doctor should still be hidden
   - The setting persists in localStorage

## Expected Behavior

### When Toggle is ON (default):
- Doctor appears in the footer
- Footer shows: "Dr. [Name]" with their monogram
- Activity log shows: "granted 'Show in footer' for [Name]"

### When Toggle is OFF:
- Doctor is hidden from the footer
- Other doctors still appear
- Activity log shows: "revoked 'Show in footer' for [Name]"

### Special Cases:
- **Root account (Monesh)**: Toggle is always disabled, always shows in footer
- **New members**: Default to showing in footer (toggle is ON by default)
- **Suspended members**: Still respect the footer toggle setting

## Troubleshooting

### Toggle Not Working?
1. **Clear browser cache** and refresh
2. **Check localStorage**: Open DevTools → Application → Local Storage
   - Look for `vaidyagan_studio_users_v1`
   - Check if `showInFooter` field exists for the user
3. **Check console for errors**: Open DevTools → Console tab
4. **Verify you're logged in as superadmin**: Only superadmins can toggle

### Footer Not Updating?
1. **Wait 1-2 seconds** - the footer updates via polling
2. **Refresh the page** - forces a complete re-render
3. **Check if doctor is suspended** - suspended doctors might not show

### Toggle Greyed Out?
- This is normal for the root account (Monesh)
- Only superadmins can toggle other members
- Check your login credentials

## Technical Details

### How It Works:
1. **Toggle in UI**: User clicks toggle in Members panel
2. **Update localStorage**: `auth.setPerms()` updates user data
3. **Footer polls**: Footer checks `isDoctorListed()` every second
4. **ID mapping**: Function checks both user ID and username
5. **Filter applied**: Footer filters out doctors with `showInFooter: false`

### Data Flow:
```
Members Panel → auth.setPerms() → localStorage → isDoctorListed() → Footer Filter
```

### ID Mapping:
- AUTHORS array: `"monesh"` (Dr. Monesh L Ghuge)
- Auth system: `"root"` with username `"monesh"`
- `isDoctorListed()` checks both: `u.id === userId || u.username === userId`

## Success Criteria

✅ Toggle appears in Members panel  
✅ Toggle can be switched ON/OFF  
✅ Changes reflect immediately in footer  
✅ Activity log records all changes  
✅ Root account cannot be hidden  
✅ Settings persist after page refresh  
✅ Multiple doctors can be toggled independently  
✅ Build passes without errors  
✅ No console errors  
✅ Toast notifications appear  

## Report Issues

If the toggle still doesn't work after following these steps:
1. Note the exact steps you took
2. Check browser console for errors
3. Check localStorage data
4. Note which browser you're using
5. Report with screenshots if possible
