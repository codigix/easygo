import { connectDatabase, getDb } from "./src/config/database.js";

async function seedTestData() {
  await connectDatabase();
  const db = getDb();

  try {
    console.log("🌱 Seeding test data for hub operations...\n");

    const franchiseId = 6;
    const now = new Date();

    const shipmentCNs = [
      "SHP001",
      "SHP002",
      "SHP003",
      "SHP004",
      "SHP005",
    ];

    const shipmentIds = [];

    console.log("📦 Creating test shipments...");
    for (const cn of shipmentCNs) {
      const [result] = await db.query(
        `INSERT INTO shipments 
         (franchise_id, shipment_cn, shipment_source, sender_name, sender_phone, 
          sender_address, sender_pincode, receiver_name, receiver_phone, 
          receiver_address, receiver_pincode, weight, pieces, service_type, 
          freight_charge, fuel_surcharge, gst_amount, other_charges, total_charge, 
          status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          franchiseId,
          cn,
          "MANUAL",
          "Sender Name",
          "9876543210",
          "Sender Address",
          "411001",
          "Receiver Name",
          "9123456789",
          "Receiver Address",
          "400001",
          2.5,
          1,
          "EXPRESS",
          100,
          20,
          18,
          0,
          138,
          "CREATED",
          now,
          now,
        ]
      );
      shipmentIds.push(result.insertId);
      console.log(`  ✓ Created shipment: ${cn}`);
    }

    console.log(`\n📋 Creating manifest from ${shipmentIds.length} shipments...`);

    const manifestNumber = `MF-${franchiseId}-${now
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const [manifestResult] = await db.query(
      `INSERT INTO manifests 
       (franchise_id, manifest_number, courier_company_id, origin_hub_id, status, 
        total_shipments, total_weight, total_charge, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        franchiseId,
        manifestNumber,
        1,
        1,
        "OPEN",
        shipmentIds.length,
        shipmentIds.length * 2.5,
        shipmentIds.length * 138,
        now,
        now,
      ]
    );

    const manifestId = manifestResult.insertId;

    console.log(`\n🔗 Linking shipments to manifest...`);
    for (const shipmentId of shipmentIds) {
      await db.query(
        `INSERT INTO manifest_shipments (manifest_id, shipment_id, franchise_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [manifestId, shipmentId, franchiseId, now, now]
      );

      await db.query(
        `UPDATE shipments SET status = 'MANIFESTED', updated_at = ? WHERE id = ?`,
        [now, shipmentId]
      );
    }

    console.log("\n✅ Test data seeded successfully!");
    console.log("\n📊 Summary:");
    console.log(`   Franchise ID: ${franchiseId}`);
    console.log(`   Manifest No: ${manifestNumber}`);
    console.log(`   Manifest ID: ${manifestId}`);
    console.log(`   Shipments: ${shipmentIds.length}`);
    console.log(`   Status: OPEN`);
    console.log("\n👉 Go to Hub Operations → Manifest List to see the manifest!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

seedTestData();
