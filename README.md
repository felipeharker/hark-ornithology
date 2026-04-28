# Hark Ornithology

Personal birding project; primarily using Cornell Labs tools and services.

## Setup & Local Development

This project includes a Next.js frontend application in the `web/` directory that visualizes observation data onto a Mapbox map.

1. **Prerequisites**: Ensure you have Node.js and npm installed.
2. **Environment Variables**: Navigate to the `web/` directory and copy `.env.example` to `.env.local`. Insert your Mapbox API token into `.env.local` for the `NEXT_PUBLIC_MAPBOX_TOKEN` variable.
   ```
   cd web
   cp .env.example .env.local
   ```
3. **Start Development Server**:
   ```
   npm install
   npm run start-dev
   ```
   Open `http://localhost:3000` to view it in your browser. (Note: use `npm run dev` to actually run the command)

## Build for Production

You can build the static application by running:
```
cd web
npm run build
```
Or you can use the convenient build script:
```
cd web
./build.sh
```
