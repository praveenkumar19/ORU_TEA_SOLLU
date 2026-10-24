# ☕ Oru Tea Sollu!

### A Modern Digital Experience for a Traditional Tea Shop

**Oru Tea Sollu!** is a modern, responsive tea shop web application built to bring the traditional tea kadai experience into the digital world. It offers an interactive menu, convenient online ordering, dining and parcel options, billing, order tracking, and administrative management.

🌐 **Live Website:** [Oru Tea Sollu!](https://oru-tea-sollu-sbvy.vercel.app/)

---

## ✨ Features

- ☕ **Interactive Menu** — Browse tea, beverages, and South Indian snacks.
- 🛒 **Online Ordering** — Select menu items and place orders through an intuitive interface.
- 🍽️ **Dining & Parcel Orders** — Choose between dining at the shop and takeaway.
- 🧾 **Digital Bill Receipt** — View order details, item totals, applicable GST, and delivery charges.
- 🆔 **Unique Order IDs** — Identify and track individual orders.
- 🚚 **Delivery Details** — Collect customer contact and address information for delivery orders.
- 📦 **Order Tracking** — View order status and order information.
- 🛠️ **Admin Dashboard** — Access administrative tools for managing shop operations.
- 📝 **Menu Management** — Configure menu items through the menu management interface.
- 👤 **Customer Profile** — Access customer profile features.
- ⭐ **Customer Reviews** — Display customer feedback and reviews.
- 📍 **Location Section** — Present shop location information.
- 📱 **Responsive Design** — Designed for desktop, tablet, and mobile screens.
- 🎨 **Modern UI** — Rich visuals, tea shop imagery, and dedicated sections for the shop experience.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React | Component-based user interface |
| TypeScript | Type-safe application development |
| Vite | Development server and build tooling |
| CSS | Styling and responsive layouts |
| Bun | Dependency management, based on the included `bun.lock` |
| Node.js | Server-side JavaScript runtime |
| Database | Persistent data storage through the server/database layer |

*Note: The exact database engine and any additional libraries should be confirmed from the project configuration and database implementation.*

## 📂 Project Structure

```text
oru-tea-sollu/
├── data/
│   └── oru_tea_sollu.db-wal
├── public/
│   └── assets/
├── src/
│   ├── assets/
│   │   └── images/
│   ├── components/
│   │   ├── AdminDashboardModal.tsx
│   │   ├── BillReceiptModal.tsx
│   │   ├── CheckoutModal.tsx
│   │   ├── CustomerProfileModal.tsx
│   │   ├── ExperienceSection.tsx
│   │   ├── Footer.tsx
│   │   ├── HowToOrderSection.tsx
│   │   ├── LocationSection.tsx
│   │   ├── MenuConfigModal.tsx
│   │   ├── MenuSection.tsx
│   │   ├── Navbar.tsx
│   │   ├── OrderDrawer.tsx
│   │   ├── OrderTrackingView.tsx
│   │   ├── ReviewsSection.tsx
│   │   ├── ThreeHeroCanvas.tsx
│   │   └── WhyUsSection.tsx
│   ├── data/
│   ├── server/
│   │   ├── db.ts
│   │   └── routes.ts
│   ├── services/
│   │   └── api.ts
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── index.html
├── metadata.json
├── package.json
├── bun.lock
├── server.ts
├── tsconfig.json
└── vite.config.ts
```

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites

Install the following:

- [Node.js](https://nodejs.org/)
- npm (included with Node.js), or [Bun](https://bun.sh/)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
```

Replace the URL with your actual GitHub repository URL.

### 2. Navigate to the Project

```bash
cd YOUR_REPOSITORY
```

### 3. Install Dependencies

Using Bun:

```bash
bun install
```

Or using npm:

```bash
npm install
```

### 4. Start the Development Server

```bash
bun run dev
```

Or:

```bash
npm run dev
```

Open the local URL displayed in the terminal, typically `http://localhost:5173`.

### 5. Start the Backend Server

This project includes `server.ts` and server-side route and database files. Check the available scripts in `package.json` to determine the correct backend startup command.

For example, if the project defines a `start` script:

```bash
npm run start
```

The actual command depends on the scripts configured in your project.

## 🧾 Ordering & Billing Workflow

1. Browse the menu and select items.
2. Add items to the order.
3. Choose dining or parcel.
4. Enter the required customer details.
5. Review the order summary and applicable charges.
6. Confirm the order and view the bill receipt.
7. Use the order ID to identify the order and access available tracking features.

**Billing:** Dining orders should exclude delivery charges. Parcel orders may include delivery charges. GST should be calculated according to the application's configured billing rules.

## 🗄️ Database & Backend

The project includes a dedicated server layer and database-related files:

- `server.ts` — Main server entry point.
- `src/server/db.ts` — Database-related logic.
- `src/server/routes.ts` — Server routes and request handling.
- `src/services/api.ts` — API communication from the frontend.
- `data/oru_tea_sollu.db-wal` — SQLite write-ahead log file, if SQLite is the configured database.

The actual database schema, supported API endpoints, and persistence behavior depend on the implementation in these files.

**Important:** Do not commit live customer data, credentials, environment files containing secrets, or production database files to a public repository.

## 🔐 Security Recommendations

- Validate and sanitize incoming customer and order data on the server.
- Protect administrative features with proper authentication and authorization.
- Keep secrets in environment variables.
- Validate prices, GST, and delivery charges on the server instead of trusting frontend calculations.
- Avoid exposing customer contact details and delivery addresses.
- Configure production CORS rules and HTTPS appropriately.
- Use a suitable persistent database and storage strategy for production.

## 🌍 Deployment

The project is available online:

**Live Demo:** https://oru-tea-sollu-sbvy.vercel.app/

For deployment, ensure that both the frontend and backend are configured correctly. If the backend uses SQLite, verify that the hosting environment supports persistent storage; temporary server filesystems may not retain database changes between deployments.

## 🔮 Future Improvements

- Online payment gateway integration.
- Real-time order status updates.
- WhatsApp order notifications.
- Inventory and stock management.
- Sales reports and analytics.
- Customer order history.
- QR-code-based table ordering.
- Improved authentication and role-based admin access.

## 👨‍💻 Author

**Praveen Kumar A**

Cyber Security Student | Frontend Developer | Exploring Full-Stack Development

- GitHub: [@praveenkumar19](https://github.com/praveenkumar19)
- Portfolio: [Visit My Portfolio](https://praveenkumar19.github.io/PORTFOLIO/)

## 📄 License

Choose and add an appropriate open-source license before distributing this project. If no license has been added, all rights remain reserved by default.

---

**Oru Tea Sollu! — Every great conversation starts with a cup of tea. ☕**
