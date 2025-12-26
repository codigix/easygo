import path from "path";
import dotenv from "dotenv";
import { connectDatabase, getDb } from "../src/config/database.js";
import { calculateBookingRate } from "../src/services/rateCalculationService.js";

const envPath = path.join(process.cwd(), "backend", ".env");
dotenv.config({ path: envPath });

process.env.MYSQL_HOST = process.env.MYSQL_HOST || "localhost";
process.env.MYSQL_PORT = process.env.MYSQL_PORT || "3306";
process.env.MYSQL_USER = process.env.MYSQL_USER || "root";
process.env.MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || "backend";
process.env.MYSQL_DATABASE = process.env.MYSQL_DATABASE || "easygo_db";

const scenario = {
  franchiseId: 7,
  fromPincode: "411001",
  toPincode: "560001",
  serviceType: "Air",
  weight: 4,
  quantity: 1,
  otherCharges: 0,
};

(async () => {
  await connectDatabase();
  const calculation = await calculateBookingRate(
    scenario.franchiseId,
    scenario.fromPincode,
    scenario.toPincode,
    scenario.serviceType,
    scenario.weight,
    scenario.quantity,
    scenario.otherCharges
  );

  if (!calculation) {
    console.error("❌ Rate calculation returned null. Check rate master data.");
    process.exit(1);
  }

  console.log("✅ Rate calculation successful for scenario:");
  console.table([
    { key: "Franchise", value: scenario.franchiseId },
    { key: "Service", value: scenario.serviceType },
    { key: "Weight", value: scenario.weight },
    { key: "Line Amount", value: calculation.lineAmount },
    { key: "Tax Amount", value: calculation.taxAmount },
    { key: "Fuel Amount", value: calculation.fuelAmount },
    { key: "Net Amount", value: calculation.netAmount },
    { key: "GST %", value: calculation.gstPercent },
    { key: "Fuel %", value: calculation.fuelPercent },
  ]);

  const pool = getDb();
  await pool.end();
})();
