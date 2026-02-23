# RentWise

RentWise is a map-based rental decision app. Enter an address or click on the map to get AI-generated ratings and short insights across three dimensions:

- **Safety**
- **Accessibility**
- **Convenience & Lifestyle**

This helps renters quickly evaluate neighborhoods and make more confident housing decisions.

A deployed version of RentWise is accessible at https://rentwise.regenerativeaitool.dev/

## Features

- 🗺️ **Interactive map**: search by address or click directly on the map.
- 🤖 **AI analysis**: get structured JSON ratings (1–5) from OpenAI.
- 🌐 **Multilingual UI**: supports English, Simplified Chinese, and Spanish.
- ⭐ **Star-based visualization**: convert numeric ratings into easy-to-scan stars.

## Tech Stack

- Frontend: HTML / CSS / Vanilla JavaScript
- Maps: Google Maps JavaScript API (with Places)
- Backend (serverless): Cloudflare Pages Functions
- AI: OpenAI Chat Completions API

## Project Structure

```text
RentWise/
├── index.html                 # Page structure and Google Maps SDK script
├── style.css                  # Styles
├── script.js                  # Map interaction, i18n switching, API calls
├── functions/
│   └── api/
│       └── analyze.js         # Cloudflare Function that calls OpenAI and returns JSON
└── README.md
```

## Quick Start

### 1) Clone the project

```bash
git clone <your-repo-url>
cd RentWise
```

### 2) Configure your Google Maps API key

`index.html` loads Google Maps via:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=...&callback=initMap&libraries=places" async defer></script>
```

Replace `key` with your own Google Maps API key and make sure these APIs are enabled:

- Maps JavaScript API
- Places API

### 3) Configure your OpenAI key (Cloudflare Secret)

`functions/api/analyze.js` reads the key from `env.OPENAI_API_KEY`.

In your Cloudflare Pages project, add:

- Key: `OPENAI_API_KEY`
- Value: your OpenAI API key

If you run locally with Wrangler, you can also set this as a Wrangler secret.

### 4) Run locally (recommended: Wrangler)

To test static files + Functions together:

```bash
npm install -g wrangler
wrangler pages dev .
```

Then open the local URL from terminal output (commonly `http://127.0.0.1:8788`).

> You can still open static files directly and see the UI/map, but `/api/analyze` will not return real AI results without a Functions runtime.

## API

### `POST /api/analyze`

Request body example:

```json
{
  "address": "1600 Amphitheatre Parkway, Mountain View, CA",
  "language": "en"
}
```

Response example:

```json
{
  "safety": {
    "rating": 4,
    "description": "Generally safe area with moderate evening foot traffic."
  },
  "accessibility": {
    "rating": 5,
    "description": "Excellent transit options and road connectivity."
  },
  "convenience": {
    "rating": 4,
    "description": "Strong mix of groceries, cafes, and daily amenities nearby."
  }
}
```

## Deployment (Cloudflare Pages)

1. Connect this repository to Cloudflare Pages.
2. Build command can be empty (static files + Functions).
3. Set output directory to repository root (`.`), or adjust based on your build setup.
4. Configure the `OPENAI_API_KEY` secret in Pages settings.
5. Deploy and verify `/api/analyze` is responding correctly.

## FAQ

### 1) Why is the map not showing?

- Invalid API key or quota issues.
- Missing Maps JavaScript API / Places API enablement.
- HTTP referrer restrictions do not match your domain.

### 2) Why does the analysis API fail?

- `OPENAI_API_KEY` is missing or incorrect.
- OpenAI usage limits/quota are exceeded.
- The model occasionally returns non-JSON output (basic fallback handling is already included).

### 3) Why do I only see demo/fallback text?

Usually because `/api/analyze` is unavailable, failed, or backend environment variables are not configured.

## Roadmap (Optional)

- [ ] Add search history and saved locations
- [ ] Add commuting-time dimension (to work/school)
- [ ] Add rental price range and value-for-money scoring
- [ ] Add stricter JSON schema validation
- [ ] Replace hardcoded frontend map key with environment-based injection

## License

Add your preferred license (for example, MIT).
