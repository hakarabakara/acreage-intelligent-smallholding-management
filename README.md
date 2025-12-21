# Acreage - Intelligent Smallholding Management

[cloudflarebutton]

Acreage is a comprehensive, visually stunning, and intuitive progressive web application designed to modernize smallholding and farm management. It serves as a central command center for farmers, integrating land management, crop tracking, livestock monitoring, and financial planning into a cohesive interface.

## Overview

Acreage is built to be the premium, all-in-one farm management platform for smallholders. The UI prioritizes clarity and efficiency, using a 'Nature-First' aesthetic with calming greens, earthy neutrals, and high-contrast data visualization. It is built for resilience, designed to work seamlessly on tablets in the field and desktops in the office.

## Key Features

- **Mission Control Dashboard**: Real-time insights into farm operations, weather conditions, and urgent tasks.
- **Land & Fields Registry**: A visual registry of land parcels with crop history and soil status.
- **Crop Operations**: Lifecycle tracking from seeding to harvest, including yield estimation.
- **Livestock Hub**: Herd health tracking, grazing rotation logs, and breeding records.
- **Task Force**: A robust task management system assigning work to fields, crops, or machinery.
- **Barn & Inventory**: Resource tracking for feeds, seeds, chemicals, and equipment maintenance.
- **Financial Ledger**: Income and expense tracking with visual profit/loss charts and category breakdowns.

## Technology Stack

This project is built on a high-performance, modern stack designed for the edge.

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + ShadCN UI
- **Icons**: Lucide React
- **Visualization**: Recharts
- **Animations**: Framer Motion
- **State Management**: Zustand + React Query
- **Routing**: React Router 6

### Backend & Infrastructure
- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Storage**: Cloudflare Durable Objects (Single Global Entity Pattern)
- **Language**: TypeScript

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Bun](https://bun.sh/) (v1.0 or higher)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (Cloudflare CLI)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/acreage-manager.git
   cd acreage-manager
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

## Development

To start the development server:

```bash
bun run dev
```

This command starts the Vite development server. The application uses a proxy configuration to route API requests to the Cloudflare Worker backend.

## Architecture

Acreage uses a **Global Durable Object** architecture.
- **Data Flow**: The frontend communicates with a Hono-based API running on Cloudflare Workers.
- **Persistence**: A single `GlobalDurableObject` acts as the storage engine, managing disjoint entities (Fields, Crops, Tasks) using an Entity/Index pattern.
- **API**: Routes are defined in `worker/user-routes.ts` and utilize helper classes in `worker/entities.ts` to interact with the Durable Object storage.

## Deployment

You can deploy this application to Cloudflare's global network with a single click:

[cloudflarebutton]

Alternatively, you can deploy manually using the command line:

1. Authenticate with Cloudflare:
   ```bash
   npx wrangler login
   ```

2. Deploy the application:
   ```bash
   bun run deploy
   ```

This will build the frontend assets and deploy the Worker with the static assets.

## License

This project is licensed under the MIT License.