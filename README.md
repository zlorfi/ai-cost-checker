# AI API Cost Tracker

A sleek, modern dashboard for tracking your monthly OpenAI and Anthropic API usage costs. Built with Svelte + Tailwind CSS, optimized for Docker deployment on your local LAN.

## Features

- Real-time cost tracking for OpenAI and Anthropic APIs
- Clean, responsive dashboard interface
- Historical data visualization
- Dark mode support
- Docker-ready for easy deployment on local network
- Lightweight and fast with Svelte

## Tech Stack

- **Frontend Framework**: Svelte + Vite
- **CSS Framework**: Tailwind CSS
- **Component Library**: shadcn-svelte compatible
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Node.js 20+ (for local development)
- Docker & Docker Compose (for containerized deployment)

## Quick Start

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

### Docker Deployment (Production)

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Access the dashboard**
   - From the host machine: `http://localhost:5173`
   - From other devices on LAN: `http://YOUR_SERVER_IP:5173`

### Docker Deployment (Development Mode)

For development with hot-reload in Docker:

```bash
docker-compose --profile dev up ai-cost-checker-dev
```

## Project Structure

```
ai-cost-checker/
├── src/
│   ├── lib/
│   │   ├── Dashboard.svelte    # Main dashboard component
│   │   └── utils.ts            # Utility functions
│   ├── App.svelte              # Root component
│   ├── main.js                 # App entry point
│   └── app.css                 # Tailwind directives
├── public/                     # Static assets
├── Dockerfile                  # Production Docker config
├── docker-compose.yml          # Docker Compose configuration
├── vite.config.js             # Vite configuration
├── tailwind.config.js         # Tailwind CSS configuration
└── package.json               # Dependencies
```

## Configuration

### Vite Server Settings

The Vite dev server is configured to listen on `0.0.0.0:5173` for LAN access. See [vite.config.js](vite.config.js#L8-L11).

### Environment Variables

Create a `.env` file with your API keys:

```env
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Docker Commands

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

## Network Access

To access from other devices on your LAN:

1. Find your server's IP address:
   ```bash
   # On Linux/Mac
   ip addr show
   # or
   ifconfig

   # On Windows
   ipconfig
   ```

2. Access the dashboard from any device on the same network:
   ```
   http://YOUR_SERVER_IP:5173
   ```

## Customization

### Adding Components

The project is set up to work with shadcn-svelte components. To add components:

```bash
npx shadcn-svelte@latest add button
```

### Styling

Tailwind CSS is configured and ready to use. Edit [tailwind.config.js](tailwind.config.js) to customize the theme.

## Future Enhancements

- [ ] Connect to actual OpenAI and Anthropic APIs
- [ ] Add charts for visual data representation
- [ ] Export data to CSV/Excel
- [ ] Set up cost alerts and budgets
- [ ] Add usage breakdown by model
- [ ] Implement authentication

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
