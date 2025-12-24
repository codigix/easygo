import { connectDatabase, getDb } from "./src/config/database.js";

async function seedRTOData() {
  await connectDatabase();
  const db = getDb();

  try {
    console.log("🌱 Seeding RTO test data...\n");

    const franchiseId = 6;
    const now = new Date();

    console.log("1️⃣  Creating test shipments for RTO...");
    const rtoShipments = [
      { cn: "RTO001", reason: "DELIVERY_FAILED", status: "OUT_FOR_DELIVERY" },
      { cn: "RTO002", reason: "CUSTOMER_REFUSED", status: "OUT_FOR_DELIVERY" },
      { cn: "RTO003", reason: "ADDRESS_UNSERVICEABLE", status: "OUT_FOR_DELIVERY" },
    ];

    const rtoShipmentIds = [];

    for (const shipment of rtoShipments) {
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
          shipment.cn,
          "MANUAL",
          "Sender Name",
          "9876543210",
          "Sender Address",
          "411001",
          "Receiver Name",
          "9123456789",
          "Receiver Address",
          "400001",
          3.5,
          1,
          "EXPRESS",
          120,
          25,
          20,
          0,
          165,
          shipment.status,
          now,
          now,
        ]
      );
      rtoShipmentIds.push(result.insertId);
      console.log(`  ✓ Created ${shipment.cn} (status: ${shipment.status})`);
    }

    console.log(`\n2️⃣  Creating RTO manifest from ${rtoShipmentIds.length} shipments...`);

    const rtoManifestNumber = `RTO-${franchiseId}-${now
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const [rtoResult] = await db.query(
      `INSERT INTO rto_manifests 
       (franchise_id, rto_manifest_number, rto_reason, status, total_shipments, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        franchiseId,
        rtoManifestNumber,
        "DELIVERY_FAILED",
        "INITIATED",
        rtoShipmentIds.length,
        "Test RTO manifest for delivery failed shipments",
        now,
        now,
      ]
    );

    const rtoId = rtoResult.insertId;
    console.log(`  ✓ Created RTO: ${rtoManifestNumber}`);

    console.log("\n✅ RTO test data seeded successfully!");
    console.log("\n📊 Summary:");
    console.log(`   Franchise ID: ${franchiseId}`);
    console.log(`   RTO Manifest No: ${rtoManifestNumber}`);
    console.log(`   RTO ID: ${rtoId}`);
    console.log(`   Shipments: ${rtoShipmentIds.length}`);
    console.log(`   Status: INITIATED`);
    console.log("\n👉 Go to Hub Operations → RTO Management to see the RTO manifest!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

seedRTOData();
