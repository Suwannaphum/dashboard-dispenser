# Dashboard Frontend

Next.js App Router dashboard for the industrial fuel dispenser platform.

## Run

```powershell
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

By default the frontend talks to:

```text
http://localhost:8000
ws://localhost:8000
```

Override with:

```powershell
$env:NEXT_PUBLIC_API_BASE="http://localhost:8000"
$env:NEXT_PUBLIC_WS_BASE="ws://localhost:8000"
```
