<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1MVLIXBI55xiQHMQy0DnrO-r0u_0uzYHb

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   ```bash
   npm install
   ```
2. Set the `API_KEY` in [.env.local](.env.local) to your Google GenAI API key
   ```
   API_KEY=your_google_genai_api_key
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the URL shown in the terminal (typically http://localhost:5173/)

## Build for Production

To build the application for production:

```bash
npm run build
```

This will create a `dist` directory with the production build files.

## Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

This will start a local server to serve the production build files.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm install` | Installs all project dependencies |
| `npm run dev` | Starts the development server |
| `npm run build` | Builds the application for production |
| `npm run preview` | Previews the production build locally |

## Server-Side Setup

The project includes a backend server located in the `server/` directory. Here's how to set it up and run it:

### Prerequisites
- Node.js
- MongoDB (local or remote instance)

### Setup Steps

1. **Navigate to the server directory**:
   ```bash
   cd server
   ```

2. **Install server dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   # The .env file has already been created with default values
   # You can edit the .env file to customize your configuration
   ```

4. **Start the server**:
   - For development (with nodemon):
     ```bash
     npm run dev
     ```
   - For production:
     ```bash
     npm start
     ```

### Server Configuration

The server uses the following environment variables (configured in `server/.env`):

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `PORT` | The port on which the server will run | 5000 |
| `MONGODB_URI` | The MongoDB connection string | mongodb://localhost:27017/investsync |
| `JWT_SECRET` | Secret key for JWT token generation | your_jwt_secret_key_here |

### API Endpoints

The server provides the following API endpoints:

- **Auth**: `/api/auth/*`
- **Rooms**: `/api/rooms/*`
- **Holdings**: `/api/holdings/*`

### Testing the Server

Once the server is running, you can test it by visiting:
```
http://localhost:5000/
```

You should see the message: `InvestSync API is running`
