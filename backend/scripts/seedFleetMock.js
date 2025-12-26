import { connectDatabase, getDb } from "../src/config/database.js";
import { createRoute, createVehicle, createDriver, createLoadPlan, updateVehicleTelemetry } from "../src/services/fleetService.js";

const encodeValue = (value) => {
  let current = value << 1;
  if (value < 0) {
    current = ~current;
  }
  let output = "";
  while (current >= 0x20) {
    output += String.fromCharCode((0x20 | (current & 0x1f)) + 63);
    current >>= 5;
  }
  output += String.fromCharCode(current + 63);
  return output;
};

const encodePolyline = (points = []) => {
  if (!points.length) {
    return "";
  }
  let lastLat = 0;
  let lastLng = 0;
  return points
    .map(([lat, lng]) => {
      const roundedLat = Math.round(lat * 1e5);
      const roundedLng = Math.round(lng * 1e5);
      const deltaLat = roundedLat - lastLat;
      const deltaLng = roundedLng - lastLng;
      lastLat = roundedLat;
      lastLng = roundedLng;
      return encodeValue(deltaLat) + encodeValue(deltaLng);
    })
    .join("");
};

const futureDate = (days) => {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
};

const insertShipments = async (db, franchiseId, shipments) => {
  const ids = [];
  for (const shipment of shipments) {
    const now = new Date();
    const [result] = await db.query(
      `INSERT INTO shipments (
        franchise_id,
        shipment_cn,
        pickup_id,
        shipment_source,
        sender_name,
        sender_phone,
        sender_address,
        sender_pincode,
        sender_city,
        sender_state,
        receiver_name,
        receiver_phone,
        receiver_address,
        receiver_pincode,
        receiver_city,
        receiver_state,
        weight,
        dimensions,
        pieces,
        content_description,
        declared_value,
        service_type,
        freight_charge,
        fuel_surcharge,
        gst_amount,
        other_charges,
        total_charge,
        status,
        manifested_at,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        franchiseId,
        shipment.shipment_cn,
        null,
        "MANUAL",
        shipment.sender_name,
        shipment.sender_phone,
        shipment.sender_address,
        shipment.sender_pincode,
        shipment.sender_city,
        shipment.sender_state,
        shipment.receiver_name,
        shipment.receiver_phone,
        shipment.receiver_address,
        shipment.receiver_pincode,
        shipment.receiver_city,
        shipment.receiver_state,
        shipment.weight,
        shipment.dimensions,
        shipment.pieces,
        shipment.content_description,
        shipment.declared_value,
        shipment.service_type,
        shipment.freight_charge,
        shipment.fuel_surcharge,
        shipment.gst_amount,
        shipment.other_charges,
        shipment.total_charge,
        "MANIFESTED",
        now,
        now,
        now,
      ]
    );
    ids.push(result.insertId);
  }
  return ids;
};

const run = async () => {
  await connectDatabase();
  const db = getDb();
  const [[franchise]] = await db.query("SELECT id FROM franchises ORDER BY id ASC LIMIT 1");
  if (!franchise) {
    throw new Error("Franchise data not found");
  }
  const [[adminUser]] = await db.query("SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1");
  if (!adminUser) {
    throw new Error("Admin user not found");
  }
  const franchiseId = franchise.id;
  const userId = adminUser.id;
  await db.query(
    `DELETE lps FROM load_plan_shipments lps
     JOIN load_plans lp ON lp.id = lps.load_plan_id
     WHERE lp.load_number = ? AND lp.franchise_id = ?`,
    ["LP-DEMO-LIVE", franchiseId]
  );
  await db.query("DELETE FROM load_plans WHERE load_number = ? AND franchise_id = ?", ["LP-DEMO-LIVE", franchiseId]);
  await db.query("DELETE FROM shipments WHERE franchise_id = ? AND shipment_cn LIKE 'FLEET-DEMO-%'", [franchiseId]);
  await db.query(
    "DELETE FROM fleet_routes WHERE franchise_id = ? AND route_code IN ('MH14_PUN_BLR')",
    [franchiseId]
  );
  await db.query(
    "DELETE FROM fleet_vehicles WHERE franchise_id = ? AND vehicle_number IN ('MH-14-JK-9217','MH-12-AB-5544')",
    [franchiseId]
  );
  await db.query(
    "DELETE FROM fleet_drivers WHERE franchise_id = ? AND driver_code IN ('DRV-SEJAL','DRV-RAGHAV')",
    [franchiseId]
  );
  const routePoints = [
    [18.5204, 73.8567],
    [17.6806, 73.9934],
    [16.7049, 74.2433],
    [15.8497, 74.4977],
    [15.3647, 75.124],
    [12.9716, 77.5946],
  ];
  const viaHubs = [
    { name: "Satara", lat: 17.6806, lng: 73.9934 },
    { name: "Kolhapur", lat: 16.7049, lng: 74.2433 },
    { name: "Belagavi", lat: 15.8497, lng: 74.4977 },
    { name: "Hubli", lat: 15.3647, lng: 75.124 },
  ];
  const route = await createRoute(franchiseId, {
    route_code: "MH14_PUN_BLR",
    origin_hub: "Pune",
    destination_hub: "Bangalore",
    via_hubs: viaHubs,
    distance_km: 840,
    expected_time_hours: 16,
    encoded_polyline: encodePolyline(routePoints),
    is_active: true,
  });
  const availableVehicle = await createVehicle(franchiseId, {
    vehicle_number: "MH-14-JK-9217",
    vehicle_type: "TRUCK",
    capacity_kg: 8500,
    volume_cuft: 520,
    fuel_type: "DIESEL",
    status: "AVAILABLE",
    current_hub: "Pune",
  });
  const liveVehicle = await createVehicle(franchiseId, {
    vehicle_number: "MH-12-AB-5544",
    vehicle_type: "TRUCK",
    capacity_kg: 12000,
    volume_cuft: 640,
    fuel_type: "DIESEL",
    status: "AVAILABLE",
    current_hub: "Pune",
  });
  await createDriver(franchiseId, {
    driver_code: "DRV-SEJAL",
    name: "Sejal Kale",
    phone: "+91 9876500001",
    license_number: "MH14-2027-XY1234",
    license_expiry: futureDate(365 * 2),
    assigned_vehicle_id: availableVehicle.id,
    current_hub: "Pune",
    status: "AVAILABLE",
  });
  const liveDriver = await createDriver(franchiseId, {
    driver_code: "DRV-RAGHAV",
    name: "Raghav Desai",
    phone: "+91 9876500002",
    license_number: "MH14-2027-XY5678",
    license_expiry: futureDate(365 * 3),
    current_hub: "Pune",
    status: "AVAILABLE",
  });
  const shipments = [
    {
      shipment_cn: "FLEET-DEMO-001",
      sender_name: "Nikhil Patil",
      sender_phone: "+91 9000000001",
      sender_address: "Warehouse 12, Pimpri",
      sender_pincode: "411018",
      sender_city: "Pune",
      sender_state: "Maharashtra",
      receiver_name: "Prakash Rao",
      receiver_phone: "+91 9000001001",
      receiver_address: "Indiranagar, Bangalore",
      receiver_pincode: "560038",
      receiver_city: "Bangalore",
      receiver_state: "Karnataka",
      weight: 250,
      dimensions: "80x40x40",
      pieces: 6,
      content_description: "Electronics",
      declared_value: 120000,
      service_type: "Surface",
      freight_charge: 4500,
      fuel_surcharge: 300,
      gst_amount: 810,
      other_charges: 0,
      total_charge: 5610,
    },
    {
      shipment_cn: "FLEET-DEMO-002",
      sender_name: "Vartak Foods",
      sender_phone: "+91 9000000002",
      sender_address: "MIDC Phase 2, Pune",
      sender_pincode: "411057",
      sender_city: "Pune",
      sender_state: "Maharashtra",
      receiver_name: "Meena Stores",
      receiver_phone: "+91 9000001002",
      receiver_address: "Whitefield, Bangalore",
      receiver_pincode: "560066",
      receiver_city: "Bangalore",
      receiver_state: "Karnataka",
      weight: 320,
      dimensions: "100x45x45",
      pieces: 8,
      content_description: "Packaged food",
      declared_value: 80000,
      service_type: "Surface",
      freight_charge: 3800,
      fuel_surcharge: 260,
      gst_amount: 729,
      other_charges: 0,
      total_charge: 4789,
    },
    {
      shipment_cn: "FLEET-DEMO-003",
      sender_name: "Suyog Textiles",
      sender_phone: "+91 9000000003",
      sender_address: "Shukrawar Peth, Pune",
      sender_pincode: "411002",
      sender_city: "Pune",
      sender_state: "Maharashtra",
      receiver_name: "Urban Threads",
      receiver_phone: "+91 9000001003",
      receiver_address: "BTM Layout, Bangalore",
      receiver_pincode: "560076",
      receiver_city: "Bangalore",
      receiver_state: "Karnataka",
      weight: 280,
      dimensions: "90x40x40",
      pieces: 5,
      content_description: "Fabric rolls",
      declared_value: 65000,
      service_type: "Surface",
      freight_charge: 3600,
      fuel_surcharge: 240,
      gst_amount: 691,
      other_charges: 0,
      total_charge: 4531,
    },
    {
      shipment_cn: "FLEET-DEMO-004",
      sender_name: "MaxChem Labs",
      sender_phone: "+91 9000000004",
      sender_address: "Hinjewadi Phase 3",
      sender_pincode: "411057",
      sender_city: "Pune",
      sender_state: "Maharashtra",
      receiver_name: "Apollo Diagnostics",
      receiver_phone: "+91 9000001004",
      receiver_address: "Hebbal, Bangalore",
      receiver_pincode: "560024",
      receiver_city: "Bangalore",
      receiver_state: "Karnataka",
      weight: 190,
      dimensions: "60x40x40",
      pieces: 4,
      content_description: "Lab supplies",
      declared_value: 48000,
      service_type: "Surface",
      freight_charge: 2900,
      fuel_surcharge: 210,
      gst_amount: 560,
      other_charges: 0,
      total_charge: 3670,
    },
    {
      shipment_cn: "FLEET-DEMO-005",
      sender_name: "Pixel Hub",
      sender_phone: "+91 9000000005",
      sender_address: "Baner Road, Pune",
      sender_pincode: "411045",
      sender_city: "Pune",
      sender_state: "Maharashtra",
      receiver_name: "Electron City",
      receiver_phone: "+91 9000001005",
      receiver_address: "Electronic City, Bangalore",
      receiver_pincode: "560100",
      receiver_city: "Bangalore",
      receiver_state: "Karnataka",
      weight: 310,
      dimensions: "85x45x45",
      pieces: 7,
      content_description: "IT hardware",
      declared_value: 95000,
      service_type: "Surface",
      freight_charge: 4200,
      fuel_surcharge: 280,
      gst_amount: 805,
      other_charges: 0,
      total_charge: 5285,
    },
  ];
  const shipmentIds = await insertShipments(db, franchiseId, shipments);
  const activeShipmentIds = shipmentIds.slice(0, 3);
  const plan = await createLoadPlan(
    franchiseId,
    {
      route_id: route.id,
      vehicle_id: liveVehicle.id,
      driver_id: liveDriver.id,
      shipment_ids: activeShipmentIds,
      notes: "Seeded demo load from Pune to Bangalore",
    },
    userId
  );
  await db.query("UPDATE load_plans SET load_number = ? WHERE id = ?", ["LP-DEMO-LIVE", plan.id]);
  await updateVehicleTelemetry(liveVehicle.id, franchiseId, {
    lat: 16.4,
    lng: 75.2,
    current_leg: "Kolhapur → Hubli",
  });
  console.log("Fleet demo data ready:", {
    franchiseId,
    route: route.route_code,
    availableVehicle: availableVehicle.vehicle_number,
    liveLoad: "LP-DEMO-LIVE",
    manifestedShipments: shipmentIds.length - activeShipmentIds.length,
  });
};

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
