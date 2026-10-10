# EventKit — Bulk Event Document Automation Platform

> **100% Client-Side • Zero External Server Uploads • ₹0 Budget Architecture**

EventKit is a modern, high-performance browser-based platform that automates bulk document creation for event organizers, colleges, NGOs, workshops, hackathons, and training institutes.

Transform participant spreadsheets into personalized documents in bulk:
- **Participation & Winner Certificates**
- **Appreciation & Achievement Letters**
- **Speaker, Mentor, Judge, and Volunteer Letters**
- **Participant & Volunteer ID Cards (CR80 standard)**
- **Attendance-Related Vouchers and Documents**
- **Custom Document Types using user-provided templates (PDF / PNG / JPEG)**

---

## Key Features

1. **Client-Side Document Engine:**
   - In-browser PDF modification and overlay using `pdf-lib`.
   - Preserves existing vector PDF designs without rasterization.
   - Text auto-wrapping and dynamic font scaling to prevent overflow on long recipient names.
   - Standard PDF fonts supported out of the box (Helvetica, Times, Courier, and Bold variants).
   - Supports embedded signatures, logos, and custom vector backgrounds.

2. **Spreadsheet Parser & Validator:**
   - Ingests `.xlsx`, `.xls`, and `.csv` files via SheetJS (`xlsx`).
   - Multi-sheet workbook selection.
   - Intelligent column type inference (`full_name`, `email`, `role`, `award`, `attendance`, etc.).
   - Duplicate detection, missing name detection, and email syntax checks.
   - Inline row editing and non-destructive record exclusion toggling.

3. **Multi-Document Type Management:**
   - Configure multiple document types for a single event dataset.
   - Reorder, duplicate, rename, enable/disable, or delete document types.

4. **Visual Drag-and-Drop Template Canvas:**
   - Normalized coordinate system (0 to 1) mapped accurately to bottom-left PDF coordinate origins.
   - Real-time drag and resize controls with responsive zoom.
   - Live sample data preview binding values directly onto the canvas.
   - Instant "Preview PDF" modal rendering actual vector PDFs client-side.

5. **Visual Conditional Generation Rules:**
   - AND combinator rule builder (`equals`, `not_equals`, `contains`, `is_not_empty`, `is_empty`).
   - Live match counter indicators showing how many recipients meet criteria.

6. **Pre-Generation Quality Audit:**
   - Pre-flight validation separating blocking errors from non-blocking warnings.
   - 1-click exclusion of problematic or flagged attendee rows.
   - Pre-generation summary with total expected output count.

7. **Bulk Generation & Batch ZIP Export:**
   - Chunked batch processing with event-loop yielding to guarantee a responsive UI.
   - Deterministic, filesystem-safe filename sanitization.
   - Structured ZIP archives (`EventName/Certificates/`, `Letters/`, `ID-Cards/`, `reports/`).
   - Auditable CSV generation report with row-by-row status breakdown.

8. **Local Persistence & Privacy:**
   - Local persistence via IndexedDB (`idb-keyval`) with localStorage fallback.
   - JSON project configuration export and import.
   - Zero telemetry, zero tracking, zero cloud data transmission.

---

## Technology Stack

- **Framework:** React 18 with TypeScript (Strict mode)
- **Bundler:** Vite 5
- **Styling:** Tailwind CSS (Tailwind v3 with customized typography & palette)
- **Icons:** Lucide React
- **Document Processing:** `pdf-lib`
- **Spreadsheet Processing:** SheetJS (`xlsx`)
- **Packaging:** `jszip`
- **Persistence:** IndexedDB (`idb-keyval`)
- **Testing:** Vitest

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```
Open `http://localhost:3000` in your web browser.

### Automated Testing

Run the Vitest test suite:
```bash
npm test
```

### Production Build

```bash
npm run build
```
This generates the optimized static bundle in the `dist/` directory.

To preview the production build locally:
```bash
npm run preview
```

---

## Free Static Deployment Options

EventKit contains no backend dependencies and can be deployed for **₹0** to any static hosting provider:

### 1. Vercel (Recommended)
1. Push your repository to GitHub.
2. Sign in to [Vercel](https://vercel.com) and click **Add New > Project**.
3. Import the repository. Vercel automatically detects Vite.
4. Click **Deploy**.

### 2. GitHub Pages
1. In `vite.config.ts`, set `base: './'`.
2. Add a GitHub Actions workflow `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [main]
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
         - run: npm ci
         - run: npm run build
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

### 3. Cloudflare Pages
1. Connect repository in Cloudflare Dashboard under **Workers & Pages**.
2. Build command: `npm run build`
3. Output directory: `dist`

### 4. Netlify
1. Connect repository in Netlify.
2. Build command: `npm run build`
3. Publish directory: `dist`
