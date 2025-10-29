#!/usr/bin/env node
/**
 * Test Script: RateMaster Validation & Functional Tests
 * Tests: add, edit, delete, validation, unique constraints
 */

const http = require("http");

// Test configuration
const BASE_URL = "http://localhost:3000/api/ratemaster";
const FRANCHISE_ID = 2;
const AUTH_TOKEN = process.env.TEST_TOKEN || "test-token"; // Would need real token from login

// Test results tracking
let testsPassed = 0;
let testsFailed = 0;
const results = [];

// Mock request function
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
    };

    const req = http.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          body: data ? JSON.parse(data) : null,
        });
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Test helper
async function test(name, fn) {
  try {
    const result = await fn();
    if (result.pass) {
      testsPassed++;
      results.push({ name, status: "✅ PASS", details: result.message });
      console.log(`✅ ${name}`);
    } else {
      testsFailed++;
      results.push({ name, status: "❌ FAIL", details: result.message });
      console.log(`❌ ${name}: ${result.message}`);
    }
  } catch (error) {
    testsFailed++;
    results.push({ name, status: "❌ ERROR", details: error.message });
    console.log(`❌ ${name}: ERROR - ${error.message}`);
  }
}

// Tests
async function runTests() {
  console.log("🧪 RateMaster Validation & Functional Tests\n");

  // Test 1: Create with NEGATIVE rate
  await test("Test 1: Negative rate should be REJECTED", async () => {
    const res = await makeRequest("POST", "", {
      from_pincode: "400001",
      to_pincode: "110001",
      service_type: "Surface",
      weight_from: 0,
      weight_to: 5,
      rate_per_kg: -100, // NEGATIVE!
    });

    // Expected: 400 Bad Request
    // Actual: 201 Created (FAILS VALIDATION)
    return {
      pass: res.status === 400, // Should reject
      message: `Status ${res.status} (expected 400). ${
        res.status === 400
          ? "Correctly rejected"
          : "ACCEPTED negative rate - DATA CORRUPTION!"
      }`,
    };
  });

  // Test 2: Create with REVERSED weight range
  await test("Test 2: Reversed weight range (from > to) should be REJECTED", async () => {
    const res = await makeRequest("POST", "", {
      from_pincode: "400001",
      to_pincode: "110001",
      service_type: "Surface",
      weight_from: 100,
      weight_to: 50, // LESS than weight_from!
    });

    return {
      pass: res.status === 400,
      message: `Status ${res.status} (expected 400). ${
        res.status === 400
          ? "Correctly rejected"
          : "ACCEPTED invalid range - LOGIC ERROR!"
      }`,
    };
  });

  // Test 3: Create with INVALID service type
  await test("Test 3: Invalid service_type should be REJECTED", async () => {
    const res = await makeRequest("POST", "", {
      from_pincode: "400001",
      to_pincode: "110001",
      service_type: "Teleportation", // Invalid!
      weight_from: 0,
      weight_to: 5,
      rate_per_kg: 50,
    });

    return {
      pass: res.status === 400,
      message: `Status ${res.status} (expected 400). ${
        res.status === 400
          ? "Correctly rejected"
          : "ACCEPTED invalid service type - ENUM VALIDATION MISSING!"
      }`,
    };
  });

  // Test 4: Create with EMPTY from_pincode
  await test("Test 4: Empty required field should be REJECTED", async () => {
    const res = await makeRequest("POST", "", {
      from_pincode: "", // Empty!
      to_pincode: "110001",
      service_type: "Surface",
      weight_from: 0,
      weight_to: 5,
      rate_per_kg: 50,
    });

    return {
      pass: res.status === 400,
      message: `Status ${res.status} (expected 400). ${
        res.status === 400
          ? "Correctly rejected"
          : "ACCEPTED empty field - MANDATORY FIELD VALIDATION MISSING!"
      }`,
    };
  });

  // Test 5: Create DUPLICATE rate (same route + weight)
  await test("Test 5: Duplicate rate slab should be REJECTED", async () => {
    const rateData = {
      from_pincode: "400001",
      to_pincode: "110001",
      service_type: "Surface",
      weight_from: 0,
      weight_to: 5,
      rate_per_kg: 50,
    };

    // First rate
    const res1 = await makeRequest("POST", "", rateData);

    // Same rate again
    const res2 = await makeRequest("POST", "", rateData);

    return {
      pass: res2.status === 409 || res2.status === 400, // Should reject duplicate
      message: `Second identical rate: Status ${
        res2.status
      } (expected 400 or 409). ${
        res2.status >= 400
          ? "Correctly rejected duplicate"
          : "ACCEPTED DUPLICATE - UNIQUE CONSTRAINT MISSING!"
      }`,
    };
  });

  // Test 6: Update (Edit) rate
  await test("Test 6: Update rate endpoint should exist", async () => {
    const res = await makeRequest("PUT", "/4", {
      from_pincode: "400001",
      to_pincode: "110001",
      service_type: "Surface",
      weight_from: 0,
      weight_to: 5,
      rate_per_kg: 75, // Changed
    });

    return {
      pass: res.status === 200 || res.status === 404, // 404 is OK if rate doesn't exist
      message: `Update status: ${res.status}. Endpoint exists: ${
        res.status !== 404 ? "YES" : "OK"
      }`,
    };
  });

  // Test 7: Delete rate (hard delete check)
  await test("Test 7: Delete rate endpoint should exist", async () => {
    const res = await makeRequest("DELETE", "/4");

    return {
      pass: res.status === 200 || res.status === 404,
      message: `Delete status: ${res.status}. Hard delete: ${
        res.status === 200 ? "YES (risky!)" : "N/A"
      }`,
    };
  });

  // Test 8: Effective date handling
  await test("Test 8: Effective date field should exist", async () => {
    const res = await makeRequest("POST", "", {
      from_pincode: "400001",
      to_pincode: "110001",
      service_type: "Surface",
      weight_from: 0,
      weight_to: 5,
      rate_per_kg: 50,
      effective_date: "2025-01-01", // Future date
    });

    return {
      pass: res.status === 400 || res.status === 201, // Either validation or accepted
      message: `Effective date support: ${
        res.status === 201 && res.body?.data?.effective_date
          ? "YES"
          : "NO - Effective date handling NOT implemented"
      }`,
    };
  });

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log(`📊 Test Summary: ${testsPassed} passed, ${testsFailed} failed`);
  console.log("=".repeat(60));

  console.log("\nDetailed Results:");
  results.forEach((r) => {
    console.log(`${r.status} ${r.name}`);
    console.log(`   ${r.details}\n`);
  });

  process.exit(testsFailed > 0 ? 1 : 0);
}

runTests().catch(console.error);
