# 🚀 Cloudflare Tech Talk - Interactive Presentation Platform

A fully-featured, interactive presentation platform built on Cloudflare Workers with real-time audience participation, choose-your-own-adventure polling, and live container demos.

## ✨ Features

- **16:9 PowerPoint-styled slides** with your custom template background
- **Real-time audience participation** via WebSockets
- **Choose-your-own-adventure polling** - audience votes determine the presentation flow
- **Live container demo** with progress visualization
- **QR codes** on every slide for easy audience joining
- **Offline resilience** with simulation modes
- **Mobile-optimized** audience interface
- **Confetti celebrations** on poll results

## 🏗️ Architecture

- **Cloudflare Workers** - Edge compute platform
- **Hono.js** - Lightweight web framework
- **Durable Objects** - Stateful coordination (SlideRoom, PollRoom, ContainerStatus)
- **D1 Database** - SQLite at the edge for vote persistence
- **Queues** - Reliable vote processing with burst protection
- **R2 Storage** - Static assets and exports
- **WebSockets** - Real-time bidirectional communication

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Cloudflare account (free tier works)
- Wrangler CLI (installed via npm)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/cloudflare-tech-talk.git
cd cloudflare-tech-talk

# Install dependencies
npm install

# Create D1 database
wrangler d1 create tech-talk-db

# Update wrangler.toml with your database ID
# Replace "tech-talk-db-id" with the ID from the previous command

# Apply database schema
wrangler d1 execute tech-talk-db --local --file=./schema.sql

# Create R2 bucket
wrangler r2 bucket create tech-talk-assets

# Upload static files to R2
wrangler r2 object put tech-talk-assets/slides.html --file=./public/slides.html
wrangler r2 object put tech-talk-assets/audience.html --file=./public/audience.html
wrangler r2 object put tech-talk-assets/slides.css --file=./public/slides.css
wrangler r2 object put tech-talk-assets/audience.css --file=./public/audience.css
wrangler r2 object put tech-talk-assets/slides.js --file=./public/slides.js
wrangler r2 object put tech-talk-assets/audience.js --file=./public/audience.js
wrangler r2 object put tech-talk-assets/adventure.json --file=./public/adventure.json
wrangler r2 object put tech-talk-assets/powerpoint-bg.png --file=./public/powerpoint-bg.png
```

### Local Development

```bash
# Start the development server
npm run dev

# Open presenter view
open http://localhost:8787/slides?admin=1

# Scan the QR code or open audience view
open http://localhost:8787/audience
```

## 🎮 Presenter Controls

### Keyboard Shortcuts

- **Space** or **→** - Next slide
- **←** - Previous slide
- **P** - Start poll for current adventure node
- **1**, **2**, **3** - Force pick poll option
- **L** - "I'm Feeling Lucky" random pick
- **S** - Simulate offline poll with dummy votes
- **C** - Start container demo
- **F** - Trigger finale

### Admin Controls

The presenter view includes on-screen buttons for all controls when `?admin=1` is in the URL.

## 📊 Choose Your Own Adventure Flow

The presentation flow is defined in `public/adventure.json`:

```json
{
  "nodes": {
    "start": {
      "slideIndex": 0,
      "poll": {
        "question": "Where should we explore first?",
        "options": [
          { "id": "workers", "label": "Workers & Edge Computing" },
          { "id": "data", "label": "Data & Storage" },
          { "id": "ai", "label": "AI at the Edge" }
        ],
        "routes": {
          "workers": "workers-intro",
          "data": "d1-intro",
          "ai": "ai-intro"
        }
      }
    }
  }
}
```

## 🎨 Customization

### Slide Content

Edit the slide content in `public/slides.js` in the `generateSlides()` method. Each slide includes:
- Title
- Content with HTML formatting
- Analogies for complex concepts
- Code snippets
- Interactive elements

### Styling

- `public/slides.css` - Presenter view styles
- `public/audience.css` - Mobile audience styles
- PowerPoint template background: `public/powerpoint-bg.png`

### Adventure Flow

Modify `public/adventure.json` to change:
- Poll questions and options
- Slide routing based on votes
- Node connections

## 📦 Container Demo

The container demo simulates heavy processing:

```bash
# Build container locally
cd container
docker build -t vote-exporter .

# Run container
docker run --rm vote-exporter
```

During the presentation, press **C** to trigger the container demo and show real-time progress.

## 🚀 Deployment

```bash
# Deploy to Cloudflare Workers
npm run deploy

# Your app will be available at:
# https://cloudflare-tech-talk.<your-subdomain>.workers.dev
```

## 📱 Audience Experience

Audience members can:
- Scan QR code to join instantly
- See presenter's slides in real-time
- Vote on polls with single tap
- Experience confetti on poll results
- Receive presenter's contact card at finale

## 🛠️ Testing

### Generate Dummy Votes

```bash
curl -X POST http://localhost:8787/api/dummy-votes \
  -H "Content-Type: application/json" \
  -d '{"count": 100, "pollId": "current"}'
```

### Manual Poll Control

```bash
# Start a poll
curl -X POST http://localhost:8787/api/poll/start \
  -H "X-Admin-Key: tech-talk-2025" \
  -H "Content-Type: application/json" \
  -d '{"nodeId": "start", "duration": 30000}'

# Pick a winner
curl -X POST http://localhost:8787/api/poll/pick \
  -H "X-Admin-Key: tech-talk-2025" \
  -H "Content-Type: application/json" \
  -d '{"strategy": "random"}'
```

## 🎯 Best Practices for Your Talk

1. **Test everything beforehand** - Run through the entire flow at least once
2. **Have backup plans** - Use simulation mode if internet fails
3. **Keep polls short** - 30 seconds is ideal
4. **Engage early** - Start with a warm-up poll
5. **Practice transitions** - Know your keyboard shortcuts
6. **Monitor participation** - Watch the participant count

## 🐛 Troubleshooting

### WebSocket Connection Issues
- Check that Durable Objects are properly configured
- Ensure WebSocket upgrade headers are passed through

### Votes Not Recording
- Verify D1 database is created and schema applied
- Check Queue consumer is running
- Look for errors in `wrangler tail`

### Static Assets Not Loading
- Ensure files are uploaded to R2
- Check R2 bucket bindings in wrangler.toml

## 📄 License

MIT

## 🤝 Contributing

Pull requests welcome! Please open an issue first to discuss major changes.

## 🙏 Acknowledgments

Built with:
- [Cloudflare Workers](https://workers.cloudflare.com)
- [Hono](https://hono.dev)
- [Your amazing audience](http://localhost:8787/audience)

---

**Ready to rock your tech talk?** 🎤 Start with `npm run dev` and knock 'em dead!