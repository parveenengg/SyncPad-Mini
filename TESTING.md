# SyncPad Testing Checklist

## Text Formatting Tests

### Test 1: Bold/Italic/Underline (No Selection)
- [ ] Click **Bold** button (should turn blue/active)
- [ ] Type "Hello" - should appear bold
- [ ] Click **Bold** again (should turn off)
- [ ] Type " World" - should appear normal
- [ ] Repeat for **Italic** and **Underline**

### Test 2: Bold/Italic/Underline (With Selection)
- [ ] Type "Test text"
- [ ] Select the text
- [ ] Click **Bold** - text should become bold
- [ ] Click **Bold** again - should remove bold

### Test 3: Font Size
- [ ] Change font size to 20 using +/- buttons
- [ ] Type text - should appear in size 20
- [ ] Select existing text
- [ ] Change size to 16 - selected text should resize

### Test 4: Font Color
- [ ] Click red color circle
- [ ] Type text - should appear red
- [ ] Select existing text
- [ ] Click blue - selected text should turn blue

### Test 5: Font Family
- [ ] Select "Inter" from dropdown
- [ ] Type text - should use Inter font
- [ ] Change to "Arial"
- [ ] New text should use Arial

### Test 6: Text Alignment
- [ ] Click center align button
- [ ] Type text - should be centered
- [ ] Click right align
- [ ] Text should move to right

## Collaboration Tests

### Test 7: Room Creation
- [ ] Open http://localhost:3000
- [ ] Click "SyncPad" in navbar
- [ ] URL should change to include ?collab=xxxxx
- [ ] User list should show 1 user

### Test 8: Multi-User Collaboration
- [ ] Copy the collaboration URL
- [ ] Open in new tab/incognito window
- [ ] Should show 2 users in user list
- [ ] Type in Tab 1 - should appear in Tab 2 instantly
- [ ] Type in Tab 2 - should appear in Tab 1 instantly

### Test 9: User Limit (Max 3)
- [ ] Open collaboration URL in 3 tabs
- [ ] All 3 should connect successfully
- [ ] Open in 4th tab
- [ ] Should show "Room Full" alert
- [ ] Should redirect to home page

### Test 10: Username Editing
- [ ] In collaboration mode, click on your name input
- [ ] Type "Alice"
- [ ] Name should update in other users' lists
- [ ] Other users can edit their names too

## Drawing Tests

### Test 11: Freehand Drawing
- [ ] Switch to "Draw" mode
- [ ] Select freehand tool (pencil icon)
- [ ] Draw on canvas
- [ ] Drawing should appear
- [ ] In collaboration: drawing should sync to other users

### Test 12: Drawing Colors
- [ ] In draw mode, select red color
- [ ] Draw - should be red
- [ ] Select blue
- [ ] Draw - should be blue

### Test 13: Stroke Size
- [ ] In draw mode, increase stroke size with + button
- [ ] Draw - line should be thicker
- [ ] Decrease with - button
- [ ] Draw - line should be thinner

### Test 14: Shape Containers (Rectangle)
- [ ] In draw mode, click rectangle button
- [ ] Click and drag on canvas to create rectangle
- [ ] Rectangle container should appear in text editor
- [ ] Should be able to draw inside it
- [ ] Text should flow around it

### Test 15: Shape Containers (Circle)
- [ ] Click circle button
- [ ] Click and drag to create circle
- [ ] Circle container should appear
- [ ] Should be draggable

## PDF Export Tests

### Test 16: Text Export
- [ ] Type some formatted text
- [ ] Click Download button
- [ ] PDF should download
- [ ] Open PDF - should contain all text

### Test 17: Drawing Export
- [ ] Switch to draw mode
- [ ] Draw something
- [ ] Click Download
- [ ] PDF should contain drawing

## UI/UX Tests

### Test 18: Mobile Responsive
- [ ] Resize browser to mobile width
- [ ] All controls should be visible
- [ ] Editor should be usable
- [ ] Collaboration should work

### Test 19: Clear Content
- [ ] Type some text
- [ ] Click Clear button (trash icon)
- [ ] Confirm dialog
- [ ] Content should clear
- [ ] In collaboration: should clear for all users

### Test 20: Page Navigation
- [ ] Click "SyncPad" to go to collaboration
- [ ] Click "SyncPad" again to return home
- [ ] Should switch between pages smoothly

## Known Issues to Check

- [ ] Formatting applies to future text when nothing selected ✅ FIXED
- [ ] Bold/Italic/Underline buttons toggle properly ✅ FIXED
- [ ] Real-time sync works without lag
- [ ] No console errors in browser
- [ ] Server doesn't crash with multiple users

## Pass/Fail Summary

Total Tests: 20
Passed: ___
Failed: ___
Issues Found: ___

---

**Testing Notes:**
- Test on Chrome, Firefox, and Safari if possible
- Test with 2-3 simultaneous users
- Check browser console for errors (F12)
- Note any performance issues
