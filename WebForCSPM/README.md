# CSPM Web Interface

A modern web interface for Cloud Security Posture Management (CSPM) that helps you monitor, assess, and secure your cloud environments.

## Features

- **Dashboard**: Overview of your cloud security status and recent activities
- **Assessment**: Run security assessments on your cloud environments
- **Log Collection**: Analyze security logs and events
- **Deploy**: Deploy security tools and configurations to your cloud environments

## Tech Stack

- React 18
- TypeScript
- Tailwind CSS
- Headless UI
- React Query
- React Router

## Getting Started

### Prerequisites

- Node.js 16 or later
- npm 7 or later

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd cspm-web
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Development

### Project Structure

```
src/
  ├── components/     # Reusable UI components
  ├── pages/         # Page components
  ├── App.tsx        # Main application component
  ├── main.tsx       # Application entry point
  └── index.css      # Global styles
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
