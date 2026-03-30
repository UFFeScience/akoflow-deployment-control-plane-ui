# akoflow-deployment-control-plane-ui

**akoflow-deployment-control-plane-ui** is the frontend of AkoFlow — a multi-cloud infrastructure provisioning and management platform. It provides a web interface for managing organizations, projects, cloud providers, environment templates, deployments, and real-time Terraform provisioning logs.

## Tech Stack

- **Next.js 16** (React 19 + TypeScript)
- **Tailwind CSS 4** + **Radix UI** — styling and headless components
- **React Hook Form** + **Zod** — forms and validation
- **Recharts** — resource monitoring charts
- **Sonner** — toast notifications
- **next-themes** — light/dark mode

## Features

- **Authentication** — Login, register, password recovery and onboarding flow
- **Organization Management** — Manage members, roles, and cloud provider credentials
- **Project Management** — Create and organize projects within an organization
- **Environment Templates** — Build versioned templates with Terraform modules per provider
- **Environment Provisioning** — Multi-step wizard to configure and launch environments
- **Real-time Logs** — Stream Terraform run logs directly in the browser
- **Provider Health** — Monitor cloud provider connectivity status
- **Dark/Light Mode** — Full theme support

## Getting Started

### Prerequisites

- Node.js 20+
- The backend ([akoflow-deployment-control-plane](https://github.com/ovvesley/akoflow-deployment-control-plane)) running at `http://localhost:8080`

### Running with Docker

```bash
docker compose up -d
```

### Environment Variables

Copy `.env.example` to `.env.local` and adjust:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Project Structure

```
app/
  (auth)/         # Login, register, onboarding, lost-password
  (dashboard)/    # Dashboard, projects, environments, organization, user
components/       # Shared UI components
contexts/         # Auth context
hooks/            # Custom React hooks
lib/
  api/            # API client modules
  utils/          # Utility functions
```

## Related

- [akoflow-deployment-control-plane](https://github.com/ovvesley/akoflow-deployment-control-plane) — Backend (Laravel 12)

## License

MIT
