#!/usr/bin/env node

// Test script for courier rates API
import fetch from "node-fetch";

const API_URL = "http://localhost:5000/api/rates/courier";
const TOKEN = "your-token-here"; // You'll need to update this

const testData = {
  company_id: 10,
  rates_data: [
    {
      courier_type: "Dox",
      row_name: "Within City",
      slab_type: "Slab 2",
      rates: { rate_1: "1", rate_2: "1" },
    },
    {
      courier_type: "Dox",
      row_name: "Within State",
      slab_type: "Slab 2",
      rates: { rate_1: "1", rate_2: "1" },
    },
    {
      courier_type: "Dox",
      row_name: "Special Destination",
      slab_type: "Slab 2",
      rates: { rate_1: "1", rate_2: "1" },
    },
    {
      courier_type: "Dox",
      row_name: "Metro",
      slab_type: "Slab 2",
      rates: { rate_1: "1", rate_2: "1" },
    },
    {
      courier_type: "Dox",
      row_name: "Rest of India",
      slab_type: "Slab 2",
      rates: { rate_1: "1", rate_2: "1" },
    },
    {
      courier_type: "Dox",
      row_name: "Pune",
      slab_type: "Slab 2",
      rates: { rate_1: "1", rate_2: "1" },
    },
  ],
};

async function testCourierRates() {
  try {
    console.log("📤 Sending request to:", API_URL);
    console.log("📋 Data:", JSON.stringify(testData, null, 2));

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    console.log("\n📥 Response Status:", response.status);
    console.log("📥 Response Body:", JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error("\n❌ Error Details:");
      console.error("   Status:", response.status);
      console.error("   Message:", result.message);
      if (result.error) {
        console.error("   Error:", result.error);
      }
      if (result.errors) {
        console.error("   Validation Errors:", result.errors);
      }
    } else {
      console.log("\n✅ Success!");
    }
  } catch (error) {
    console.error("❌ Request failed:", error.message);
  }
}

testCourierRates();
