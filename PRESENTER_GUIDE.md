# 🎤 Cloudflare Tech Talk - Presenter Guide

## 🚀 Quick Start

### 1. Start the Development Server
```bash
npx wrangler dev --port 8787
```

### 2. Open Presenter View
Navigate to: http://localhost:8787/slides

### 3. Check Your Room ID
Look at the top-right corner of the presenter view:
- You'll see: `🏠 123456` (your unique 6-digit room ID)
- This room ID is automatically generated and saved

### 4. Share with Audience
The QR code on your slides now points to:
```
http://localhost:8787/audience/123456
```
(Replace 123456 with your actual room ID)

## 🎮 Presenter Controls

### Navigation
- **→ / Space** - Next slide
- **←** - Previous slide
- **F** - Jump to final bio slide

### Polling
- **P** - Start a poll (audience votes on next topic)
- **L** - Lucky pick (random winner for ties)
- **S** - Simulate votes (for testing)

### Advanced
- **C** - Container demo
- **1/2/3** - Pick specific poll option

## 📱 Audience Features

### Joining a Presentation
1. Scan the QR code on the presenter's screen
2. Or navigate to: `http://localhost:8787/audience/[ROOM-ID]`
3. The audience view will automatically sync with the presenter

### During the Presentation
- **Live Sync** - Slides update automatically
- **Polling** - Vote on what topic to explore next
- **Persistent Connection** - Reconnects automatically if disconnected
- **Bio Slide** - See presenter contact info at the end

## 🔧 Room Management

### Your Room ID
- **Automatically generated** when you first open `/slides`
- **Stored in localStorage** - persists across browser sessions
- **6-digit format** - easy to share (e.g., 547823)

### Starting a New Presentation
To generate a new room ID:
1. Open browser console (F12)
2. Run: `localStorage.removeItem('presentationRoomId')`
3. Refresh the presenter view
4. A new room ID will be generated

### Room Isolation
- Each room ID creates a separate presentation instance
- Multiple presentations can run simultaneously
- Audience members only see their specific room's content

## 🎯 Best Practices

1. **Test Before Presenting**
   - Open presenter view first
   - Test QR code with your phone
   - Run a poll to ensure voting works

2. **During Presentation**
   - Keep presenter view visible
   - Watch participant count (👥 indicator)
   - Use polls to engage audience

3. **Connection Issues**
   - Audience automatically reconnects
   - Room state is preserved
   - Polls continue even if some disconnect

## 📊 Testing Tools

### Test Dashboard
Open: http://localhost:8787/test-presentation.html

This provides:
- Quick access to presenter view
- Room ID display
- Audience simulator
- Multiple window testing

### Manual Testing
1. Open presenter view
2. Note the room ID
3. Open multiple incognito windows
4. Join as audience using the room ID
5. Navigate slides and run polls

## 🛠️ Troubleshooting

### Audience Not Syncing
- Verify room ID matches
- Check WebSocket connection in console
- Ensure wrangler is running

### QR Code Not Working
- QR code uses the room-specific URL
- Verify the URL format: `/audience/123456`
- Check network connectivity

### Polls Not Appearing
- Ensure at least one audience member is connected
- Check browser console for errors
- Verify room ID is consistent

## 📝 Slide Content

You have 13 slides covering:
1. Welcome
2. Workers
3. Durable Objects
4. D1 Database
5. Queues
6. R2 Storage
7. AI
8. Workflows
9. Containers
10. Load Balancers
11. AI Models
12. AI Agents
13. Bio/Contact (Press F)

## 🎉 Have a Great Presentation!

Your unique room system ensures:
- ✅ Persistent connections
- ✅ Automatic reconnection
- ✅ Room isolation
- ✅ Real-time synchronization
- ✅ Interactive polling