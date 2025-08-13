// Utility to import adventure.json format into D1 database
import { D1Database } from '@cloudflare/workers-types';
import { PresentationQueries, SlideQueries, stringifyJsonField } from '../db/queries';

interface AdventureNode {
  slideIndex: number;
  poll?: {
    question: string;
    options: Array<{ id: string; label: string; emoji?: string }>;
    routes: Record<string, string>;
  };
}

interface AdventureData {
  nodes: Record<string, AdventureNode>;
  defaultDuration?: number;
  startNode?: string;
}

// The hardcoded slide data from the original implementation
const SLIDE_DATA = [
  {
    title: 'Welcome to the Edge! ⚡',
    content: ['Cloudflare Workers: Choose Your Own Adventure'],
    bullets: []
  },
  {
    title: "Workers: Your Monolith's Best Friend ⚡",
    content: ['Offload heavy lifting without rewriting everything'],
    bullets: [
      '🎯 Deploy API endpoints in 5 seconds, globally',
      '💡 0ms cold starts - faster than Lambda\'s 100-1000ms',
      '🔥 Handle 10 million requests for ~$5',
      '✨ Perfect for: auth middleware, image optimization, API rate limiting'
    ]
  },
  {
    title: 'Durable Objects: Stateful Magic 🎯',
    content: ['Single-threaded JavaScript with guaranteed consistency'],
    bullets: [
      '🎯 Build real-time features WITHOUT Redis/Socket.io',
      '💡 Handles 1000+ WebSocket connections per object',
      '🔥 Automatic regional failover with state intact',
      '✨ This presentation runs on it - polls, votes, sync!'
    ]
  },
  {
    title: 'D1: SQLite Goes Global 💾',
    content: ["Your monolith's read-heavy queries, but faster"],
    bullets: [
      '🎯 5ms read latency from anywhere on Earth',
      '💡 Import your existing SQLite DB in one command',
      '🔥 Free tier: 5GB storage + 5 billion reads/month',
      '✨ Perfect for: user preferences, config, session data'
    ]
  },
  {
    title: 'Queues: Decouple Your Monolith 🚦',
    content: ['Process heavy tasks without blocking your main app'],
    bullets: [
      '🎯 Process up to 100 messages/second per queue',
      '💡 Automatic retries with exponential backoff built-in',
      '🔥 Batch up to 100 messages - save 90% on processing',
      '✨ Perfect for: email sending, PDF generation, webhooks'
    ]
  },
  {
    title: 'R2: Escape the AWS Egress Tax 🗄️',
    content: ['S3-compatible storage with ZERO egress fees'],
    bullets: [
      '🎯 Save 80%+ on storage costs vs S3',
      '💡 Automatic image resizing with Workers',
      '🔥 10GB free storage + 10M requests/month',
      '✨ One company saved $370k/year just by switching!'
    ]
  },
  {
    title: 'AI: No GPU Required 🤖',
    content: ['Add AI features without infrastructure headaches'],
    bullets: [
      '🎯 Run Llama, Mistral, Stable Diffusion at the edge',
      '💡 50ms inference latency globally',
      '🔥 $0.01 per 1000 neurons - 10x cheaper than OpenAI',
      '✨ Perfect for: content moderation, personalization, search'
    ]
  },
  {
    title: 'Workflows: Background Jobs That Actually Work 🎭',
    content: ['Replace your job queues with durable workflows'],
    bullets: [
      '🎯 Sleep for days/months without consuming resources',
      '💡 Automatic replay from any step on failure',
      '🔥 Built-in observability - see every step in UI',
      '✨ Perfect for: payment processing, data pipelines, onboarding'
    ]
  },
  {
    title: 'Containers: Your Monolith, But Global 📦',
    content: ['Run your existing Docker containers at the edge'],
    bullets: [
      '🎯 Deploy your monolith to 300+ cities instantly',
      '💡 GPU support - run AI models at the edge',
      '🔥 Mix Workers + Containers in same request',
      '✨ Perfect for: Python/Ruby apps, ML models, legacy code'
    ]
  },
  {
    title: 'Load Balancers: Smart Traffic Routing 🎮',
    content: ['Route users to the best server automatically'],
    bullets: [
      '🎯 Instant failover - 0 second downtime',
      '💡 Geo-steering: EU users → EU servers automatically',
      '🔥 Health checks every 15 seconds from 300+ locations',
      '✨ Perfect for: blue-green deployments, A/B testing'
    ]
  },
  {
    title: 'AI Models: OpenAI Alternative at the Edge 🧠',
    content: ['Run LLMs without API keys or rate limits'],
    bullets: [
      '🎯 Llama 3.1 70B, Mistral, and more built-in',
      '💡 Generate images in <2 seconds globally',
      '🔥 Embeddings API: 50M tokens for $1',
      '✨ No cold starts - models always warm'
    ]
  },
  {
    title: 'AI Agents: Autonomous Workers 🤖',
    content: ['Build agents that interact with your APIs'],
    bullets: [
      '🎯 Connect to your monolith APIs via tool calling',
      '💡 Built-in memory and context management',
      '🔥 Chain multiple models for complex tasks',
      '✨ Perfect for: customer support, data extraction, testing'
    ]
  },
  {
    title: 'Thanks for Joining! 🙏',
    content: ['Connect with me'],
    bullets: [],
    isBioSlide: true
  }
];

export class PresentationImporter {
  private presentationQueries: PresentationQueries;
  private slideQueries: SlideQueries;

  constructor(private db: D1Database) {
    this.presentationQueries = new PresentationQueries(db);
    this.slideQueries = new SlideQueries(db);
  }

  async importAdventureJson(
    adventureData: AdventureData,
    presentationName: string,
    description?: string,
    createdBy?: string
  ): Promise<string> {
    // Create the presentation
    const presentationId = await this.presentationQueries.createPresentation(
      presentationName,
      description,
      createdBy,
      adventureData
    );

    // Create a map to track node to slide mapping
    const nodeToSlideId: Record<string, string> = {};
    const slides: Array<{
      nodeId?: string;
      slideIndex: number;
      pollData?: any;
    }> = [];

    // First pass: collect all slides from the adventure nodes
    const processedIndices = new Set<number>();
    for (const [nodeId, node] of Object.entries(adventureData.nodes)) {
      if (!processedIndices.has(node.slideIndex)) {
        processedIndices.add(node.slideIndex);
        slides.push({
          nodeId,
          slideIndex: node.slideIndex,
          pollData: node.poll
        });
      }
    }

    // Sort slides by index
    slides.sort((a, b) => a.slideIndex - b.slideIndex);

    // Second pass: create slides in the database
    const createdSlideIds: string[] = [];
    for (const slideInfo of slides) {
      const slideData = SLIDE_DATA[slideInfo.slideIndex];
      if (!slideData) continue;

      const slideId = await this.slideQueries.createSlide({
        presentation_id: presentationId,
        order_number: slideInfo.slideIndex,
        title: slideData.title,
        content: stringifyJsonField(slideData.content),
        bullets: stringifyJsonField(slideData.bullets),
        slide_type: slideInfo.pollData ? 'poll' : (slideData.isBioSlide ? 'bio' : 'standard'),
        poll_question: slideInfo.pollData?.question || null,
        poll_options: slideInfo.pollData ? stringifyJsonField(slideInfo.pollData.options) : null,
        poll_routes: slideInfo.pollData ? stringifyJsonField(slideInfo.pollData.routes) : null,
        is_bio_slide: slideData.isBioSlide ? 1 : 0
      });

      createdSlideIds.push(slideId);
      
      // Map node to slide ID for route references
      if (slideInfo.nodeId) {
        nodeToSlideId[slideInfo.nodeId] = slideId;
      }
    }

    // Third pass: update poll routes to use slide IDs instead of node IDs
    for (const slideInfo of slides) {
      if (slideInfo.pollData?.routes && slideInfo.nodeId) {
        const slideId = nodeToSlideId[slideInfo.nodeId];
        if (!slideId) continue;

        // Convert node routes to slide ID routes
        const slideRoutes: Record<string, string> = {};
        for (const [optionId, targetNodeId] of Object.entries(slideInfo.pollData.routes)) {
          const targetNode = adventureData.nodes[targetNodeId as string];
          if (targetNode) {
            // Find the slide that corresponds to this node's slideIndex
            const targetSlide = await this.slideQueries.getSlideByOrder(
              presentationId,
              targetNode.slideIndex
            );
            if (targetSlide) {
              slideRoutes[optionId] = targetSlide.id;
            }
          }
        }

        // Update the slide with the corrected routes
        await this.slideQueries.updateSlide(slideId, {
          poll_routes: stringifyJsonField(slideRoutes)
        });
      }
    }

    return presentationId;
  }

  // Import the default Cloudflare presentation
  async importDefaultPresentation(): Promise<string> {
    // Load the adventure.json data
    const adventureData: AdventureData = {
      nodes: {
        "start": {
          "slideIndex": 0,
          "poll": {
            "question": "Where should we explore first in the Cloudflare universe?",
            "options": [
              { "id": "edge-compute", "label": "Edge Computing Magic ⚡", "emoji": "⚡" },
              { "id": "data-layer", "label": "Data & Storage 💾", "emoji": "💾" },
              { "id": "ai-adventure", "label": "AI at the Edge 🤖", "emoji": "🤖" }
            ],
            "routes": {
              "edge-compute": "workers-intro",
              "data-layer": "d1-intro",
              "ai-adventure": "ai-intro"
            }
          }
        },
        "workers-intro": {
          "slideIndex": 1,
          "poll": {
            "question": "Workers are like baristas everywhere. What feature excites you most?",
            "options": [
              { "id": "durable", "label": "Durable Objects (Stateful Magic) 🎯", "emoji": "🎯" },
              { "id": "queues", "label": "Queues (The Bouncer) 🚦", "emoji": "🚦" },
              { "id": "containers", "label": "Containers (Heavy Lifting) 📦", "emoji": "📦" }
            ],
            "routes": {
              "durable": "durable-objects",
              "queues": "queues-deep",
              "containers": "containers-demo"
            }
          }
        },
        "durable-objects": { "slideIndex": 2 },
        "d1-intro": {
          "slideIndex": 3,
          "poll": {
            "question": "D1 = SQLite everywhere. What's your data challenge?",
            "options": [
              { "id": "migration", "label": "Migrating from Postgres 🔄", "emoji": "🔄" },
              { "id": "geo", "label": "Geo-distributed Data 🌍", "emoji": "🌍" },
              { "id": "r2-combo", "label": "Combine with R2 Storage 🗄️", "emoji": "🗄️" }
            ],
            "routes": {
              "migration": "queues-deep",
              "geo": "workers-intro",
              "r2-combo": "r2-intro"
            }
          }
        },
        "queues-deep": { "slideIndex": 4 },
        "r2-intro": {
          "slideIndex": 5,
          "poll": {
            "question": "R2 = Your attic with zero egress fees. What will you store?",
            "options": [
              { "id": "media", "label": "Images & Videos 📸", "emoji": "📸" },
              { "id": "backups", "label": "Backups & Archives 💾", "emoji": "💾" },
              { "id": "datasets", "label": "ML Datasets 🧠", "emoji": "🧠" }
            ],
            "routes": {
              "media": "ai-intro",
              "backups": "workflows-intro",
              "datasets": "ai-intro"
            }
          }
        },
        "ai-intro": {
          "slideIndex": 6,
          "poll": {
            "question": "AI at the Edge = Smart neighbor next door. Your AI need?",
            "options": [
              { "id": "moderate", "label": "Content Moderation 🛡️", "emoji": "🛡️" },
              { "id": "personalize", "label": "Personalization 🎯", "emoji": "🎯" },
              { "id": "analyze", "label": "Sentiment Analysis 📊", "emoji": "📊" }
            ],
            "routes": {
              "moderate": "ai-models",
              "personalize": "ai-agents",
              "analyze": "workflows-intro"
            }
          }
        },
        "workflows-intro": { "slideIndex": 7 },
        "containers-demo": { "slideIndex": 8 },
        "loadbalancers": { "slideIndex": 9 },
        "ai-models": { "slideIndex": 10 },
        "ai-agents": { "slideIndex": 11 },
        "finale": { "slideIndex": 12 }
      },
      "defaultDuration": 20000,
      "startNode": "start"
    };

    return await this.importAdventureJson(
      adventureData,
      "Cloudflare Tech Talk: Choose Your Own Adventure",
      "An interactive presentation showcasing Cloudflare's edge computing platform",
      "system"
    );
  }
}

// CLI script for importing (can be run via wrangler)
export async function runImport(db: D1Database) {
  const importer = new PresentationImporter(db);
  const presentationId = await importer.importDefaultPresentation();
  console.log(`Successfully imported presentation with ID: ${presentationId}`);
  return presentationId;
}