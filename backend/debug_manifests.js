import { connectDatabase, getDb } from "./src/config/database.js";

async function debugManifests() {
  await connectDatabase();
  const db = getDb();

  try {
    console.log("=== MANIFESTS ===");
    const [manifests] = await db.query(
      "SELECT id, manifest_number, total_shipments, total_weight, status FROM manifests WHERE franchise_id = 6 ORDER BY created_at DESC"
    );
    console.log(manifests);

    for (const manifest of manifests) {
      const [shipments] = await db.query(
        "SELECT id, shipment_cn, status FROM shipments WHERE id IN (SELECT shipment_id FROM manifest_shipments WHERE manifest_id = ?)",
        [manifest.id]
      );
      console.log(`\nManifest ${manifest.manifest_number} (${manifest.id}):`);
      console.log(`  Total Shipments: ${manifest.total_shipments}`);
      console.log(`  Linked Shipments: ${shipments.length}`);
      shipments.forEach(s => console.log(`    - ${s.shipment_cn} (${s.status})`));
    }

    console.log("\n=== MANIFEST_SHIPMENTS LINKS ===");
    const [links] = await db.query(
      "SELECT manifest_id, COUNT(*) as count FROM manifest_shipments GROUP BY manifest_id"
    );
    console.log(links);

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    process.exit(0);
  }
}

debugManifests();
