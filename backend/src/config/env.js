import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file in project root directory
const envPath = path.join(__dirname, "../../../.env");
console.log("📍 Loading .env from:", envPath);
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.warn("⚠️  .env file not found:", envPath);
} else {
  console.log("✅ .env file loaded successfully");
}

const {
  NODE_ENV = "development",
  PORT = 5000,
  MYSQL_HOST = "localhost",
  MYSQL_PORT = 3306,
  MYSQL_USER = "root",
  MYSQL_PASSWORD = "Backend",
  MYSQL_DATABASE = "frbilling",
  JWT_SECRET = "change_me",
  JWT_EXPIRATION = "1d",
  CORS_ORIGIN = "http://localhost:3000",
  SMTP_HOST = "",
  SMTP_PORT = "",
  SMTP_EMAIL = "",
  SMTP_PASSWORD = "",
  WALLET_WEBHOOK_SECRET = "wallet-webhook-secret",
} = process.env;

// Debug logging for SMTP
console.log("🔍 Environment variables loaded:");
console.log("   SMTP_HOST:", SMTP_HOST || "❌ NOT SET");
console.log("   SMTP_PORT:", SMTP_PORT || "❌ NOT SET");
console.log("   SMTP_EMAIL:", SMTP_EMAIL || "❌ NOT SET");
console.log("   SMTP_PASSWORD:", SMTP_PASSWORD ? "✅ SET" : "❌ NOT SET");

export const env = {
  nodeEnv: NODE_ENV,
  port: Number(PORT),
  mysql: {
    host: MYSQL_HOST,
    port: Number(MYSQL_PORT),
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
  },
  jwtSecret: JWT_SECRET,
  jwtExpiration: JWT_EXPIRATION,
  corsOrigin: CORS_ORIGIN,
  smtp: {
    host: SMTP_HOST,
    port: SMTP_PORT,
    email: SMTP_EMAIL,
    password: SMTP_PASSWORD,
  },
  walletWebhookSecret: WALLET_WEBHOOK_SECRET,
};
