import { connectDatabase, getDb } from "./src/config/database.js";

await connectDatabase();
const db = getDb();

const franchiseId = 6; // Your franchise

const ratesToInsert = [
  // Express rates
  { from: '*', to: '*', service: 'EXPRESS', weight_from: 0, weight_to: 30, rate: 250, gst: 18, fuel: 5 },
  { from: '412501', to: '*', service: 'EXPRESS', weight_from: 0, weight_to: 30, rate: 200, gst: 18, fuel: 5 },
  
  // Standard rates
  { from: '*', to: '*', service: 'STANDARD', weight_from: 0, weight_to: 30, rate: 150, gst: 18, fuel: 3 },
  { from: '412501', to: '*', service: 'STANDARD', weight_from: 0, weight_to: 30, rate: 120, gst: 18, fuel: 3 },
  
  // Economy rates
  { from: '*', to: '*', service: 'ECONOMY', weight_from: 0, weight_to: 30, rate: 100, gst: 18, fuel: 2 },
  { from: '412501', to: '*', service: 'ECONOMY', weight_from: 0, weight_to: 30, rate: 80, gst: 18, fuel: 2 },
];

try {
  for (const rate of ratesToInsert) {
    await db.query(
      `INSERT INTO rate_master 
       (franchise_id, from_pincode, to_pincode, service_type, weight_from, weight_to, rate, gst_percentage, fuel_surcharge, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
      [
        franchiseId,
        rate.from,
        rate.to,
        rate.service,
        rate.weight_from,
        rate.weight_to,
        rate.rate,
        rate.gst,
        rate.fuel,
      ]
    );
  }
  
  console.log(`✅ Added ${ratesToInsert.length} rates for franchise ${franchiseId}`);
  
  const [check] = await db.query(
    "SELECT COUNT(*) as count FROM rate_master WHERE franchise_id = ?",
    [franchiseId]
  );
  console.log(`📊 Total rates for franchise ${franchiseId}: ${check[0].count}`);
  
  process.exit(0);
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
