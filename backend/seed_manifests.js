import { connectDatabase, getDb } from "./src/config/database.js";

async function seedManifests() {
  await connectDatabase();
  const db = getDb();

  try {
    console.log("Seeding manifest test data...");

    const franchiseId = 6;
    const now = new Date();

    const [shipments] = await db.query(
      `SELECT id, weight, total_charge FROM shipments 
       WHERE franchise_id = ? AND status = 'CREATED' LIMIT 5`,
      [franchiseId]
    );

    if (shipments.length === 0) {
      console.log("❌ No CREATED shipments found. Create shipments first.");
      process.exit(1);
    }

    console.log(`Found ${shipments.length} CREATED shipments`);

    const manifestNumber = `MF-${franchiseId}-${now
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const totalWeight = shipments.reduce((sum, s) => sum + parseFloat(s.weight), 0);
    const totalCharge = shipments.reduce((sum, s) => sum + parseFloat(s.total_charge), 0);

    const [manifestResult] = await db.query(
      `INSERT INTO manifests 
       (franchise_id, manifest_number, courier_company_id, origin_hub_id, status, total_shipments, total_weight, total_charge, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        franchiseId,
        manifestNumber,
        1,
        1,
        "OPEN",
        shipments.length,
        totalWeight,
        totalCharge,
        now,
        now,
      ]
    );

    const manifestId = manifestResult.insertId;

    for (const shipment of shipments) {
      await db.query(
        `INSERT INTO manifest_shipments (manifest_id, shipment_id, franchise_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [manifestId, shipment.id, franchiseId, now, now]
      );

      await db.query(`UPDATE shipments SET status = 'MANIFESTED', updated_at = ? WHERE id = ?`, [
        now,
        shipment.id,
      ]);
    }

    console.log(`✅ Manifest created: ${manifestNumber}`);
    console.log(`   - ID: ${manifestId}`);
    console.log(`   - Shipments: ${shipments.length}`);
    console.log(`   - Weight: ${totalWeight.toFixed(2)} kg`);
    console.log(`   - Total Charge: ₹${totalCharge.toFixed(2)}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

seedManifests();
