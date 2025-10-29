import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight } from "lucide-react";

const RATE_ROWS = ["SPECIAL DESTINATION", "METRO", "REST OF INDIA", "PUNE"];
const DOX_RATE_ROWS = [
  "Within City",
  "Within State",
  "Special Destination",
  "Metro",
  "Rest of India",
  "Pune",
];
const DTDC_PLUS_COLUMNS = [
  "Upto 500gm",
  "Add 500gm",
  "10 To 25kg",
  "25 To 50kg",
  "50 To 100kg",
  "Add 100kg",
];
const DTDC_PLUS_ROWS = ["City", "Zonal", "Metro", "National", "Regional"];
const EXPRESS_CARGO_COLUMNS = ["UpTo(50)", "Above(50)"];
const EXPRESS_CARGO_ROWS = ["SPECIAL DESTINATION", "METRO"];
const PRIORITY_GEC_COLUMNS = ["Upto (1 Kg)", "Additional (1 Kg)"];
const PRIORITY_GEC_ROWS = ["SPECIAL DESTINATION", "METRO"];
const PRIORITY_GEC_SLABS = [2, 3, 4];
const ECOMMERCE_SLABS = [2, 3, 4];

// ========== SLAB CONFIGURATION WITH DYNAMIC COLUMNS ==========
const SLAB_CONFIG = {
  "Slab 2": {
    columns: ["Upto Kg", "Additional Kg"],
    count: 2,
  },
  "Slab 3": {
    columns: ["Upto Kg", "Upto Kg", "Additional Kg"],
    count: 3,
  },
  "Slab 4": {
    columns: ["Upto Kg", "Upto Kg", "Upto Kg", "Additional Kg"],
    count: 4,
  },
};

// Helper function to generate columns based on slab
const generateColumnsForSlab = (slabName) => {
  if (typeof slabName === "number") {
    // For numeric slabs (Priority, E-Commerce): slabNum = total columns
    const slabNum = slabName;
    const columns = [];
    for (let i = 0; i < slabNum - 1; i++) {
      columns.push(`Upto Kg`);
    }
    columns.push("Additional Kg");
    return columns;
  } else {
    // For string slabs
    return SLAB_CONFIG[slabName]?.columns || ["Upto Kg", "Additional Kg"];
  }
};

const AddCompanyPage = () => {
  // Courier company types
  const COURIER_TYPES = [
    "Add Company",
    "Dox",
    "NonDox",
    "Dtdc PLUS",
    "Dtdc PTP",
    "Express Cargo",
    "Priority",
    "E-Commerce",
  ];

  const [activeTab, setActiveTab] = useState("Add Company");
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const tabScrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [createdCompanyId, setCreatedCompanyId] = useState(null);
  const [createdCompanyName, setCreatedCompanyName] = useState(null);
  const [savingSlabs, setSavingSlabs] = useState({});

  // Separate slab state for each courier type
  const [slabState, setSlabState] = useState({
    Dox: "Slab 2",
    NonDox: { air: "Slab 2", surface: "Slab 2" },
    "Dtdc PLUS": "Slab 2",
    "Dtdc PTP": { air: "Slab 2", surface: "Slab 2" },
    "Express Cargo": "Slab 2",
    Priority: 2,
    "E-Commerce": 2,
  });

  // Helper to initialize table data with correct column count
  const initializeTableData = (rows, colCount) => {
    return rows.map(() => Array(colCount).fill(""));
  };

  // DOX table data state - DYNAMIC COLUMNS BY SLAB
  const [doxTableData, setDoxTableData] = useState({
    "Slab 2": DOX_RATE_ROWS.map(() => ["", ""]), // 2 columns
    "Slab 3": DOX_RATE_ROWS.map(() => ["", "", ""]), // 3 columns
    "Slab 4": DOX_RATE_ROWS.map(() => ["", "", "", ""]), // 4 columns
  });

  // DTDC PLUS table data state - DYNAMIC COLUMNS BY SLAB
  const [dtdcPlusTableData, setDtdcPlusTableData] = useState({
    "Slab 2": DTDC_PLUS_ROWS.map(() => Array(2).fill("")), // 2 columns
    "Slab 3": DTDC_PLUS_ROWS.map(() => Array(3).fill("")), // 3 columns
    "Slab 4": DTDC_PLUS_ROWS.map(() => Array(4).fill("")), // 4 columns
  });

  // DTDC PTP table data state - DYNAMIC COLUMNS BY SLAB (two tables)
  const [dtdcPtpTableData, setDtdcPtpTableData] = useState({
    "Slab 2": {
      ptp: DTDC_PLUS_ROWS.map(() => Array(2).fill("")), // 2 columns
      ptp2: DTDC_PLUS_ROWS.map(() => Array(2).fill("")), // 2 columns
    },
    "Slab 3": {
      ptp: DTDC_PLUS_ROWS.map(() => Array(3).fill("")), // 3 columns
      ptp2: DTDC_PLUS_ROWS.map(() => Array(3).fill("")), // 3 columns
    },
    "Slab 4": {
      ptp: DTDC_PLUS_ROWS.map(() => Array(4).fill("")), // 4 columns
      ptp2: DTDC_PLUS_ROWS.map(() => Array(4).fill("")), // 4 columns
    },
  });

  // Express Cargo table data state - DYNAMIC COLUMNS BY SLAB
  const [expressCargoTableData, setExpressCargoTableData] = useState({
    "Slab 2": EXPRESS_CARGO_ROWS.map(() => Array(2).fill("")), // 2 columns
    "Slab 3": EXPRESS_CARGO_ROWS.map(() => Array(3).fill("")), // 3 columns
    "Slab 4": EXPRESS_CARGO_ROWS.map(() => Array(4).fill("")), // 4 columns
  });

  // Priority GEC table data state - DYNAMIC COLUMNS BY SLAB
  const [priorityGecTableData, setPriorityGecTableData] = useState({
    2: PRIORITY_GEC_ROWS.map(() => Array(2).fill("")), // Slab 2: 1 Upto + 1 Additional = 2
    3: PRIORITY_GEC_ROWS.map(() => Array(3).fill("")), // Slab 3: 2 Upto + 1 Additional = 3
    4: PRIORITY_GEC_ROWS.map(() => Array(4).fill("")), // Slab 4: 3 Upto + 1 Additional = 4
  });

  // E-Commerce table data state
  const [ecommerceTableData, setEcommerceTableData] = useState([
    { city: "PUNE", upto: "1", additional: "1" },
  ]);

  // E-Commerce weight ranges state
  const [ecommerceWeightRanges, setEcommerceWeightRanges] = useState({
    upto: "1",
    additional: "1",
  });

  // NonDox (Air & Surface) table data state - DYNAMIC COLUMNS BY SLAB
  const [nonDoxTableData, setNonDoxTableData] = useState({
    "Slab 2": {
      air: RATE_ROWS.map(() => Array(2).fill("")), // 2 columns
      surface: RATE_ROWS.map(() => Array(2).fill("")), // 2 columns
    },
    "Slab 3": {
      air: RATE_ROWS.map(() => Array(3).fill("")), // 3 columns
      surface: RATE_ROWS.map(() => Array(3).fill("")), // 3 columns
    },
    "Slab 4": {
      air: RATE_ROWS.map(() => Array(4).fill("")), // 4 columns
      surface: RATE_ROWS.map(() => Array(4).fill("")), // 4 columns
    },
  });

  const [formData, setFormData] = useState({
    company_id: "",
    company_name: "",
    company_address: "",
    phone: "",
    email: "",
    gst_no: "",
    insurance_percent: "",
    minimum_risk_surcharge: "",
    other_details: "",
    topay_charge: "",
    cod_charge: "",
    fuel_surcharge_percent: "",
    gec_fuel_surcharge_percent: "",
    royalty_charges_percent: "",
    pan_no: "",
    due_days: "",
    field_d: "",
    field_m: "",
    field_e: "",
    field_v: "",
    field_i: "",
    field_n: "",
    field_g: "",
    field_b: "",
  });

  // Fetch companies on mount and tab change
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Auto-populate Dox slab data from previous slab
  useEffect(() => {
    if (createdCompanyId && slabState.Dox) {
      const currentSlab = slabState.Dox;
      const slabs = ["Slab 2", "Slab 3", "Slab 4"];
      const currentIndex = slabs.indexOf(currentSlab);

      if (currentIndex > 0) {
        const prevSlab = slabs[currentIndex - 1];
        const prevData = doxTableData[prevSlab];
        const prevSlabColumnCount = SLAB_CONFIG[prevSlab]?.count || 2;
        const currentSlabColumnCount = SLAB_CONFIG[currentSlab]?.count || 2;

        if (
          prevData &&
          (!doxTableData[currentSlab] ||
            doxTableData[currentSlab].some((row) => row.every((v) => !v)))
        ) {
          setDoxTableData((prev) => ({
            ...prev,
            [currentSlab]: prevData.map((row) => [
              // Copy all "Upto Kg" columns (all but last) from previous slab
              ...row.slice(0, -1),
              // Add empty "Upto Kg" columns for new slab
              ...Array(currentSlabColumnCount - prevSlabColumnCount).fill(""),
              // Keep "Additional Kg" as the last column
              row[row.length - 1],
            ]),
          }));
        }
      }
    }
  }, [slabState.Dox, createdCompanyId]);

  // Auto-populate Dtdc PLUS slab data from previous slab
  useEffect(() => {
    if (createdCompanyId && slabState["Dtdc PLUS"]) {
      const currentSlab = slabState["Dtdc PLUS"];
      const slabs = ["Slab 2", "Slab 3", "Slab 4"];
      const currentIndex = slabs.indexOf(currentSlab);

      if (currentIndex > 0) {
        const prevSlab = slabs[currentIndex - 1];
        const prevData = dtdcPlusTableData[prevSlab];
        const prevSlabColumnCount = SLAB_CONFIG[prevSlab]?.count || 2;
        const currentSlabColumnCount = SLAB_CONFIG[currentSlab]?.count || 2;

        if (
          prevData &&
          (!dtdcPlusTableData[currentSlab] ||
            dtdcPlusTableData[currentSlab].some((row) => row.every((v) => !v)))
        ) {
          setDtdcPlusTableData((prev) => ({
            ...prev,
            [currentSlab]: prevData.map((row) => [
              // Copy all "Upto Kg" columns (all but last) from previous slab
              ...row.slice(0, -1),
              // Add empty "Upto Kg" columns for new slab
              ...Array(currentSlabColumnCount - prevSlabColumnCount).fill(""),
              // Keep "Additional Kg" as the last column
              row[row.length - 1],
            ]),
          }));
        }
      }
    }
  }, [slabState["Dtdc PLUS"], createdCompanyId]);

  // Auto-populate Dtdc PTP slab data from previous slab
  useEffect(() => {
    if (createdCompanyId && slabState["Dtdc PTP"]?.air) {
      const currentSlab = slabState["Dtdc PTP"].air;
      const slabs = ["Slab 2", "Slab 3", "Slab 4"];
      const currentIndex = slabs.indexOf(currentSlab);

      if (currentIndex > 0) {
        const prevSlab = slabs[currentIndex - 1];
        const prevData = dtdcPtpTableData[prevSlab];
        const prevSlabColumnCount = SLAB_CONFIG[prevSlab]?.count || 2;
        const currentSlabColumnCount = SLAB_CONFIG[currentSlab]?.count || 2;

        if (prevData) {
          setDtdcPtpTableData((prev) => ({
            ...prev,
            [currentSlab]: {
              ptp:
                prev[currentSlab]?.ptp?.some((row) => row.every((v) => !v)) ||
                !prev[currentSlab]
                  ? prevData.ptp.map((row) => [
                      // Copy all "Upto Kg" columns (all but last) from previous slab
                      ...row.slice(0, -1),
                      // Add empty "Upto Kg" columns for new slab
                      ...Array(
                        currentSlabColumnCount - prevSlabColumnCount
                      ).fill(""),
                      // Keep "Additional Kg" as the last column
                      row[row.length - 1],
                    ])
                  : prev[currentSlab].ptp,
              ptp2:
                prev[currentSlab]?.ptp2?.some((row) => row.every((v) => !v)) ||
                !prev[currentSlab]
                  ? prevData.ptp2.map((row) => [
                      // Copy all "Upto Kg" columns (all but last) from previous slab
                      ...row.slice(0, -1),
                      // Add empty "Upto Kg" columns for new slab
                      ...Array(
                        currentSlabColumnCount - prevSlabColumnCount
                      ).fill(""),
                      // Keep "Additional Kg" as the last column
                      row[row.length - 1],
                    ])
                  : prev[currentSlab].ptp2,
            },
          }));
        }
      }
    }
  }, [slabState["Dtdc PTP"]?.air, createdCompanyId]);

  // Auto-populate Express Cargo slab data from previous slab
  useEffect(() => {
    if (createdCompanyId && slabState["Express Cargo"]) {
      const currentSlab = slabState["Express Cargo"];
      const slabs = ["Slab 2", "Slab 3", "Slab 4"];
      const currentIndex = slabs.indexOf(currentSlab);

      if (currentIndex > 0) {
        const prevSlab = slabs[currentIndex - 1];
        const prevData = expressCargoTableData[prevSlab];
        const prevSlabColumnCount = SLAB_CONFIG[prevSlab]?.count || 2;
        const currentSlabColumnCount = SLAB_CONFIG[currentSlab]?.count || 2;

        if (
          prevData &&
          (!expressCargoTableData[currentSlab] ||
            expressCargoTableData[currentSlab].some((row) =>
              row.every((v) => !v)
            ))
        ) {
          setExpressCargoTableData((prev) => ({
            ...prev,
            [currentSlab]: prevData.map((row) => [
              // Copy all "Upto Kg" columns (all but last) from previous slab
              ...row.slice(0, -1),
              // Add empty "Upto Kg" columns for new slab
              ...Array(currentSlabColumnCount - prevSlabColumnCount).fill(""),
              // Keep "Additional Kg" as the last column
              row[row.length - 1],
            ]),
          }));
        }
      }
    }
  }, [slabState["Express Cargo"], createdCompanyId]);

  // Auto-populate Priority slab data from previous slab
  useEffect(() => {
    if (createdCompanyId && slabState.Priority) {
      const currentSlab = slabState.Priority;
      const slabs = [2, 3, 4];
      const currentIndex = slabs.indexOf(currentSlab);

      if (currentIndex > 0) {
        const prevSlab = slabs[currentIndex - 1];
        const prevData = priorityGecTableData[prevSlab];
        const prevSlabColumnCount = prevSlab; // Numeric slab = column count
        const currentSlabColumnCount = currentSlab; // Numeric slab = column count

        if (
          prevData &&
          (!priorityGecTableData[currentSlab] ||
            priorityGecTableData[currentSlab].some((row) =>
              row.every((v) => !v)
            ))
        ) {
          setPriorityGecTableData((prev) => ({
            ...prev,
            [currentSlab]: prevData.map((row) => [
              // Copy all "Upto Kg" columns (all but last) from previous slab
              ...row.slice(0, -1),
              // Add empty "Upto Kg" columns for new slab
              ...Array(currentSlabColumnCount - prevSlabColumnCount).fill(""),
              // Keep "Additional Kg" as the last column
              row[row.length - 1],
            ]),
          }));
        }
      }
    }
  }, [slabState.Priority, createdCompanyId]);

  // Note: E-Commerce uses a different structure (flat array), no auto-population needed

  const fetchCompanies = async () => {
    try {
      setFetchLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/rates/company`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setCompanies(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Helper function to format rate tables into database format
  const formatRatesData = (companyId) => {
    const ratesData = [];
    let skippedCount = 0;

    // Helper to check if rates object has at least one positive value
    const hasPositiveRate = (rates) => {
      return Object.values(rates).some((val) => {
        const numVal = parseFloat(val);
        return !isNaN(numVal) && numVal > 0;
      });
    };

    // Format Dox rates
    Object.entries(doxTableData).forEach(([slab, rows]) => {
      rows.forEach((rowData, rowIndex) => {
        const rowName = DOX_RATE_ROWS[rowIndex];
        const rates = {};
        const hasValidData = rowData.some((val) => val && val !== "");

        rowData.forEach((value, colIndex) => {
          // Convert to number and validate
          const numValue = parseFloat(value);
          // Only include non-empty, non-zero values OR include "0" if explicitly entered
          if (!isNaN(numValue) && numValue >= 0) {
            rates[`rate_${colIndex + 1}`] = numValue.toString();
          } else if (value && value !== "") {
            // Non-numeric value
            rates[`rate_${colIndex + 1}`] = "0";
          } else {
            rates[`rate_${colIndex + 1}`] = "";
          }
        });

        // Only add if has at least one valid rate value
        if (hasValidData && hasPositiveRate(rates)) {
          ratesData.push({
            courier_type: "Dox",
            row_name: rowName,
            slab_type: slab,
            rates,
          });
        } else if (hasValidData) {
          skippedCount++;
          console.warn(
            `Skipped Dox ${rowName} [${slab}] - no positive rate values`
          );
        }
      });
    });

    // Format NonDox rates (Air & Surface)
    Object.entries(nonDoxTableData).forEach(([slab, slabData]) => {
      // Air rates
      slabData.air.forEach((rowData, rowIndex) => {
        const rowName = RATE_ROWS[rowIndex];
        const rates = {};
        const hasValidData = rowData.some((val) => val && val !== "");

        rowData.forEach((value, colIndex) => {
          const numValue = parseFloat(value);
          if (!isNaN(numValue) && numValue >= 0) {
            rates[`rate_${colIndex + 1}`] = numValue.toString();
          } else if (value && value !== "") {
            rates[`rate_${colIndex + 1}`] = "0";
          } else {
            rates[`rate_${colIndex + 1}`] = "";
          }
        });

        if (hasValidData && hasPositiveRate(rates)) {
          ratesData.push({
            courier_type: "NonDox",
            row_name: rowName,
            sub_type: "air",
            slab_type: slab,
            rates,
          });
        } else if (hasValidData) {
          skippedCount++;
          console.warn(
            `Skipped NonDox Air ${rowName} [${slab}] - no positive rate values`
          );
        }
      });
      // Surface rates
      slabData.surface.forEach((rowData, rowIndex) => {
        const rowName = RATE_ROWS[rowIndex];
        const rates = {};
        const hasValidData = rowData.some((val) => val && val !== "");

        rowData.forEach((value, colIndex) => {
          const numValue = parseFloat(value);
          if (!isNaN(numValue) && numValue >= 0) {
            rates[`rate_${colIndex + 1}`] = numValue.toString();
          } else if (value && value !== "") {
            rates[`rate_${colIndex + 1}`] = "0";
          } else {
            rates[`rate_${colIndex + 1}`] = "";
          }
        });

        if (hasValidData && hasPositiveRate(rates)) {
          ratesData.push({
            courier_type: "NonDox",
            row_name: rowName,
            sub_type: "surface",
            slab_type: slab,
            rates,
          });
        } else if (hasValidData) {
          skippedCount++;
          console.warn(
            `Skipped NonDox Surface ${rowName} [${slab}] - no positive rate values`
          );
        }
      });
    });

    // Format Dtdc PLUS rates
    Object.entries(dtdcPlusTableData).forEach(([slab, rows]) => {
      rows.forEach((rowData, rowIndex) => {
        const rowName = DTDC_PLUS_ROWS[rowIndex];
        const rates = {};
        const hasValidData = rowData.some((val) => val && val !== "");

        rowData.forEach((value, colIndex) => {
          const numValue = parseFloat(value);
          if (!isNaN(numValue) && numValue >= 0) {
            rates[`rate_${colIndex + 1}`] = numValue.toString();
          } else if (value && value !== "") {
            rates[`rate_${colIndex + 1}`] = "0";
          } else {
            rates[`rate_${colIndex + 1}`] = "";
          }
        });

        if (hasValidData && hasPositiveRate(rates)) {
          ratesData.push({
            courier_type: "Dtdc PLUS",
            row_name: rowName,
            slab_type: slab,
            rates,
          });
        } else if (hasValidData) {
          skippedCount++;
          console.warn(
            `Skipped Dtdc PLUS ${rowName} [${slab}] - no positive rate values`
          );
        }
      });
    });

    // Format Dtdc PTP rates
    Object.entries(dtdcPtpTableData).forEach(([slab, slabData]) => {
      // PTP rates
      slabData.ptp.forEach((rowData, rowIndex) => {
        const rowName = DTDC_PLUS_ROWS[rowIndex];
        const rates = {};
        const hasValidData = rowData.some((val) => val && val !== "");

        rowData.forEach((value, colIndex) => {
          const numValue = parseFloat(value);
          if (!isNaN(numValue) && numValue >= 0) {
            rates[`rate_${colIndex + 1}`] = numValue.toString();
          } else if (value && value !== "") {
            rates[`rate_${colIndex + 1}`] = "0";
          } else {
            rates[`rate_${colIndex + 1}`] = "";
          }
        });

        if (hasValidData && hasPositiveRate(rates)) {
          ratesData.push({
            courier_type: "Dtdc PTP",
            row_name: rowName,
            sub_type: "ptp",
            slab_type: slab,
            rates,
          });
        } else if (hasValidData) {
          skippedCount++;
          console.warn(
            `Skipped Dtdc PTP ${rowName} [${slab}] - no positive rate values`
          );
        }
      });
      // PTP2 rates
      slabData.ptp2.forEach((rowData, rowIndex) => {
        const rowName = DTDC_PLUS_ROWS[rowIndex];
        const rates = {};
        const hasValidData = rowData.some((val) => val && val !== "");

        rowData.forEach((value, colIndex) => {
          const numValue = parseFloat(value);
          if (!isNaN(numValue) && numValue >= 0) {
            rates[`rate_${colIndex + 1}`] = numValue.toString();
          } else if (value && value !== "") {
            rates[`rate_${colIndex + 1}`] = "0";
          } else {
            rates[`rate_${colIndex + 1}`] = "";
          }
        });

        if (hasValidData && hasPositiveRate(rates)) {
          ratesData.push({
            courier_type: "Dtdc PTP",
            row_name: rowName,
            sub_type: "ptp2",
            slab_type: slab,
            rates,
          });
        } else if (hasValidData) {
          skippedCount++;
          console.warn(
            `Skipped Dtdc PTP2 ${rowName} [${slab}] - no positive rate values`
          );
        }
      });
    });

    // Format Express Cargo rates
    Object.entries(expressCargoTableData).forEach(([slab, rows]) => {
      rows.forEach((rowData, rowIndex) => {
        const rowName = EXPRESS_CARGO_ROWS[rowIndex];
        const rates = {};
        const hasValidData = rowData.some((val) => val && val !== "");

        rowData.forEach((value, colIndex) => {
          const numValue = parseFloat(value);
          if (!isNaN(numValue) && numValue >= 0) {
            rates[`rate_${colIndex + 1}`] = numValue.toString();
          } else if (value && value !== "") {
            rates[`rate_${colIndex + 1}`] = "0";
          } else {
            rates[`rate_${colIndex + 1}`] = "";
          }
        });

        if (hasValidData && hasPositiveRate(rates)) {
          ratesData.push({
            courier_type: "Express Cargo",
            row_name: rowName,
            slab_type: slab,
            rates,
          });
        } else if (hasValidData) {
          skippedCount++;
          console.warn(
            `Skipped Express Cargo ${rowName} [${slab}] - no positive rate values`
          );
        }
      });
    });

    // Format Priority GEC rates
    Object.entries(priorityGecTableData).forEach(([slab, rows]) => {
      rows.forEach((rowData, rowIndex) => {
        const rowName = PRIORITY_GEC_ROWS[rowIndex];
        const rates = {};
        const hasValidData = rowData.some((val) => val && val !== "");

        rowData.forEach((value, colIndex) => {
          const numValue = parseFloat(value);
          if (!isNaN(numValue) && numValue >= 0) {
            rates[`rate_${colIndex + 1}`] = numValue.toString();
          } else if (value && value !== "") {
            rates[`rate_${colIndex + 1}`] = "0";
          } else {
            rates[`rate_${colIndex + 1}`] = "";
          }
        });

        if (hasValidData && hasPositiveRate(rates)) {
          ratesData.push({
            courier_type: "Priority",
            row_name: rowName,
            slab_type: `Slab ${slab}`,
            rates,
          });
        } else if (hasValidData) {
          skippedCount++;
          console.warn(
            `Skipped Priority ${rowName} [Slab ${slab}] - no positive rate values`
          );
        }
      });
    });

    // Format E-Commerce rates
    ecommerceTableData.forEach((cityData) => {
      const uptoVal = parseFloat(cityData.upto);
      const additionalVal = parseFloat(cityData.additional);
      const uptoNum = !isNaN(uptoVal) ? uptoVal : 0;
      const additionalNum = !isNaN(additionalVal) ? additionalVal : 0;
      const hasValidData = uptoNum > 0 || additionalNum > 0;

      if (hasValidData && cityData.city) {
        const rates = {
          rate_1: Math.max(0, uptoNum).toString(),
          rate_2: Math.max(0, additionalNum).toString(),
        };
        if (hasPositiveRate(rates)) {
          ratesData.push({
            courier_type: "E-Commerce",
            row_name: cityData.city,
            slab_type: "Slab 2", // E-Commerce only has 2 rates
            rates,
          });
        } else {
          skippedCount++;
          console.warn(
            `Skipped E-Commerce ${cityData.city} - no positive rate values`
          );
        }
      }
    });

    if (skippedCount > 0) {
      console.warn(
        `⚠️ ${skippedCount} rows were skipped because they contained only zero/empty values`
      );
    }

    return ratesData;
  };

  // Save courier rates to database
  // Save rates for a specific slab
  const saveSlabRates = async (
    companyId,
    courierType,
    slabType,
    subType = null
  ) => {
    console.log(
      `💾 Saving ${courierType} ${slabType} rates for company ${companyId}`
    );

    let slabRatesData = [];
    let rowsToProcess = [];
    let dataSource = null;

    // Determine which data source and rows to use based on courier type
    if (courierType === "Dox") {
      dataSource = doxTableData[slabType];
      rowsToProcess = DOX_RATE_ROWS;
    } else if (courierType === "NonDox") {
      dataSource = nonDoxTableData[slabType]?.[subType];
      rowsToProcess = RATE_ROWS;
    } else if (courierType === "Dtdc PLUS") {
      dataSource = dtdcPlusTableData[slabType];
      rowsToProcess = DTDC_PLUS_ROWS;
    } else if (courierType === "Dtdc PTP") {
      dataSource = dtdcPtpTableData[slabType]?.[subType];
      rowsToProcess = DTDC_PLUS_ROWS;
    } else if (courierType === "Express Cargo") {
      dataSource = expressCargoTableData[slabType];
      rowsToProcess = EXPRESS_CARGO_ROWS;
    } else if (courierType === "Priority") {
      dataSource = priorityGecTableData[slabType];
      rowsToProcess = PRIORITY_GEC_ROWS;
    } else if (courierType === "E-Commerce") {
      // Handle E-Commerce specially - it's a flat structure
      if (Array.isArray(ecommerceTableData)) {
        ecommerceTableData.forEach((cityData) => {
          if (!cityData.city) return;
          const uptoVal = parseFloat(cityData.upto) || 0;
          const additionalVal = parseFloat(cityData.additional) || 0;

          if (uptoVal > 0 || additionalVal > 0) {
            slabRatesData.push({
              courier_type: "E-Commerce",
              row_name: cityData.city,
              slab_type: `Slab ${slabType}`,
              rates: {
                rate_1: uptoVal.toString(),
                rate_2: additionalVal.toString(),
              },
            });
          }
        });

        if (slabRatesData.length === 0) {
          throw new Error(
            `No valid rates entered for E-Commerce Slab ${slabType}. Please enter at least one positive rate value.`
          );
        }

        try {
          const token = localStorage.getItem("token");
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/rates/courier`,
            {
              company_id: companyId,
              rates_data: slabRatesData,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          console.log("✅ Slab rates saved:", response.data);
          return {
            success: true,
            inserted: response.data.data?.inserted || 0,
          };
        } catch (error) {
          console.error("❌ Error saving slab rates:", error);
          throw error;
        }
      }
    }

    if (!dataSource && courierType !== "E-Commerce") {
      throw new Error(`No data found for ${courierType} ${slabType}`);
    }

    // Format rates data for this slab only (for non-E-Commerce types)
    if (courierType !== "E-Commerce" && Array.isArray(dataSource)) {
      dataSource.forEach((rowData, rowIndex) => {
        const rowName = rowsToProcess[rowIndex];
        const rates = {};
        const hasValidData = rowData.some((val) => val && val !== "");

        rowData.forEach((value, colIndex) => {
          const numValue = parseFloat(value);
          if (!isNaN(numValue) && numValue >= 0) {
            rates[`rate_${colIndex + 1}`] = numValue.toString();
          } else if (value && value !== "") {
            rates[`rate_${colIndex + 1}`] = "0";
          } else {
            rates[`rate_${colIndex + 1}`] = "";
          }
        });

        const hasPositiveRate = Object.values(rates).some((val) => {
          const numVal = parseFloat(val);
          return !isNaN(numVal) && numVal > 0;
        });

        if (hasValidData && hasPositiveRate) {
          slabRatesData.push({
            courier_type: courierType,
            row_name: rowName,
            slab_type:
              courierType === "Priority" ? `Slab ${slabType}` : slabType,
            rates,
            ...(subType && { sub_type: subType }),
          });
        }
      });
    }

    if (slabRatesData.length === 0) {
      throw new Error(
        `No valid rates entered for ${courierType} ${slabType}. Please enter at least one positive rate value.`
      );
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/rates/courier`,
        {
          company_id: companyId,
          rates_data: slabRatesData,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Slab rates saved:", response.data);
      return {
        success: true,
        inserted: response.data.data?.inserted || 0,
      };
    } catch (error) {
      console.error("❌ Error saving slab rates:", error);
      throw error;
    }
  };

  const saveCourierRates = async (companyId, ratesData) => {
    try {
      const token = localStorage.getItem("token");
      console.log("📤 Sending rates to backend...");
      console.log("Company ID:", companyId);
      console.log("Rates data count:", ratesData.length);
      console.log("API URL:", `${import.meta.env.VITE_API_URL}/rates/courier`);

      // Log sample rates
      if (ratesData.length > 0) {
        console.log(
          "📊 Sample rate record:",
          JSON.stringify(ratesData[0], null, 2)
        );
        console.log("📊 All rates being sent:");
        ratesData.forEach((rate, idx) => {
          console.log(`[${idx}]`, {
            courier_type: rate.courier_type,
            row_name: rate.row_name,
            slab_type: rate.slab_type,
            rates: rate.rates,
            sub_type: rate.sub_type || "N/A",
          });
        });
      }

      // Validate token exists
      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/rates/courier`,
        {
          company_id: companyId,
          rates_data: ratesData,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Rates saved successfully:", response.data);
      if (response.data.data?.errors && response.data.data.errors.length > 0) {
        console.warn(
          "⚠️ Warnings during rate save:",
          response.data.data.errors
        );
      }
      return {
        success: true,
        inserted: response.data.data?.inserted || 0,
        warnings: response.data.data?.errors || [],
      };
    } catch (error) {
      console.error("❌ Error saving courier rates:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error message:", error.message);

      // Re-throw with better error info
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        error.message;
      const errorObj = new Error(errorMsg);
      errorObj.status = error.response?.status;
      errorObj.errors = error.response?.data?.errors;
      throw errorObj;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🚀 Form submission started");

    // Frontend validation
    if (
      !formData.company_id ||
      !formData.company_name ||
      !formData.company_address ||
      !formData.phone ||
      !formData.email ||
      !formData.gst_no
    ) {
      console.error("❌ Validation failed - Missing required fields");
      const missingFields = [];
      if (!formData.company_id) missingFields.push("Company ID");
      if (!formData.company_name) missingFields.push("Company Name");
      if (!formData.company_address) missingFields.push("Company Address");
      if (!formData.phone) missingFields.push("Phone Number");
      if (!formData.email) missingFields.push("Email");
      if (!formData.gst_no) missingFields.push("GST No");

      alert(`Missing required fields:\n${missingFields.join(", ")}`);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      console.error("❌ Invalid email format");
      alert("Please enter a valid email address");
      return;
    }

    console.log("✅ Validation passed");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      console.log("📤 Posting company data to /rates/company");
      console.log("Company data:", {
        company_id: formData.company_id,
        company_name: formData.company_name,
        email: formData.email,
        phone: formData.phone,
      });

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/rates/company`,
        { ...formData, courier_type: activeTab },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Company created:", response.data);
      if (response.data.success) {
        const companyId = response.data.data.id;
        const companyName = formData.company_name;
        console.log("📌 Company ID:", companyId);

        // Store company ID and name to keep form visible
        setCreatedCompanyId(companyId);
        setCreatedCompanyName(companyName);

        // Show success message
        alert(
          `✅ Company created successfully!\n\n${companyName} is now ready to add rates.\n\nSwitch to courier type tabs to add rates for different slabs.`
        );

        // DO NOT reset form - keep it visible with blur effect
        // DO NOT save rates automatically - let users save per slab
        fetchCompanies();
      }
    } catch (error) {
      console.error("❌ Error adding company:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error message:", error.message);

      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to add company";
      alert(`❌ Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Tab scrolling functions
  const scroll = (direction) => {
    if (tabScrollRef.current) {
      const scrollAmount = 300;
      if (direction === "left") {
        tabScrollRef.current.scrollBy({
          left: -scrollAmount,
          behavior: "smooth",
        });
      } else {
        tabScrollRef.current.scrollBy({
          left: scrollAmount,
          behavior: "smooth",
        });
      }
    }
  };

  // Handle Excel file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    const formDataToSend = new FormData();
    formDataToSend.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/rates/company/import-excel`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        alert(
          `Successfully imported! ${
            response.data.data?.successCount || 0
          } companies added.`
        );
        fetchCompanies();
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert(
        error.response?.data?.message || "Failed to upload companies from Excel"
      );
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Rate Master - Add Company</h1>
            <p className="text-blue-100 mt-1">
              Manage courier company rates and charges
            </p>
          </div>
          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploadLoading}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadLoading}
              className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold flex items-center gap-2 whitespace-nowrap"
            >
              {uploadLoading ? "Uploading..." : "📤 Upload From Excel"}
            </button>
          </div>
        </div>

        {/* Tab Navigation with Scroll */}
        <div className="border-b border-gray-200 px-6 py-0 flex items-center gap-2 bg-gray-50">
          <button
            onClick={() => scroll("left")}
            className="p-2 hover:bg-gray-200 rounded transition"
            title="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div
            ref={tabScrollRef}
            className="flex-1 overflow-x-auto scroll-smooth no-scrollbar"
            style={{ scrollBehavior: "smooth" }}
          >
            <div className="flex gap-1 min-w-min pb-0">
              {COURIER_TYPES.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-all border-b-2 ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600 bg-blue-50"
                      : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => scroll("right")}
            className="p-2 hover:bg-gray-200 rounded transition"
            title="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {activeTab === "Add Company" ? (
            // Add Company Form
            <form onSubmit={handleSubmit} className="space-y-6">
              {createdCompanyId && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-green-900 font-semibold">
                    ✅ Company Created Successfully!
                  </p>
                  <p className="text-green-700 text-sm mt-1">
                    <strong>{createdCompanyName}</strong> has been created and
                    is ready for rate configuration. Switch to the courier type
                    tabs to add rates for different slabs.
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-900 font-semibold">
                  📋 Company Details
                </p>
                <p className="text-blue-700 text-sm mt-1">
                  {createdCompanyId
                    ? "Company information below (read-only). Edit rates in courier type tabs."
                    : "Add your courier company details below. Fill all required fields marked with *"}
                </p>
              </div>

              {/* Blur overlay for company details after creation */}
              <div
                className={`space-y-6 ${
                  createdCompanyId ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {/* Company ID and Company Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Id <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="company_id"
                      value={formData.company_id}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter company ID (e.g., DX01)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter company name"
                    />
                  </div>
                </div>

                {/* Company Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="company_address"
                    value={formData.company_address}
                    onChange={handleChange}
                    required
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter complete company address"
                  />
                </div>

                {/* Phone and Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                {/* GST and Insurance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GST No <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="gst_no"
                      value={formData.gst_no}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter GST number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance %
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="insurance_percent"
                      value={formData.insurance_percent}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Minimum Risk Surcharge and Other Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Risk Surcharge
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="minimum_risk_surcharge"
                      value={formData.minimum_risk_surcharge}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Other Details
                    </label>
                    <input
                      type="text"
                      name="other_details"
                      value={formData.other_details}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Additional details"
                    />
                  </div>
                </div>

                {/* Charges */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Topay Charge
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="topay_charge"
                      value={formData.topay_charge}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      COD Charge
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="cod_charge"
                      value={formData.cod_charge}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Fuel Surcharges */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fuel Surcharge %
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="fuel_surcharge_percent"
                      value={formData.fuel_surcharge_percent}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GEC Fuel Surcharge %
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="gec_fuel_surcharge_percent"
                      value={formData.gec_fuel_surcharge_percent}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Royalty and PAN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Royalty Charges %
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="royalty_charges_percent"
                      value={formData.royalty_charges_percent}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pan No
                    </label>
                    <input
                      type="text"
                      name="pan_no"
                      value={formData.pan_no}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter PAN number"
                    />
                  </div>
                </div>

                {/* Due Days */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Days
                    </label>
                    <input
                      type="number"
                      name="due_days"
                      value={formData.due_days}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Additional Fields: D, M, E, V, I, N, G, B */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Additional Fields
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    {[
                      { key: "field_d", label: "D" },
                      { key: "field_m", label: "M" },
                      { key: "field_e", label: "E" },
                      { key: "field_v", label: "V" },
                      { key: "field_i", label: "I" },
                      { key: "field_n", label: "N" },
                      { key: "field_g", label: "G" },
                      { key: "field_b", label: "B" },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {label}
                        </label>
                        <input
                          type="text"
                          name={key}
                          value={formData[key]}
                          onChange={handleChange}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={label}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                {createdCompanyId && (
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedCompanyId(null);
                      setCreatedCompanyName(null);
                      setFormData({
                        company_id: "",
                        company_name: "",
                        company_address: "",
                        phone: "",
                        email: "",
                        gst_no: "",
                        insurance_percent: "",
                        minimum_risk_surcharge: "",
                        other_details: "",
                        topay_charge: "",
                        cod_charge: "",
                        fuel_surcharge_percent: "",
                        gec_fuel_surcharge_percent: "",
                        royalty_charges_percent: "",
                        pan_no: "",
                        due_days: "",
                        field_d: "",
                        field_m: "",
                        field_e: "",
                        field_v: "",
                        field_i: "",
                        field_n: "",
                        field_g: "",
                        field_b: "",
                      });
                    }}
                    className="px-8 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
                  >
                    Add New Company
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading || createdCompanyId}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading
                    ? "Saving..."
                    : createdCompanyId
                    ? "✅ Company Created"
                    : "Save Company"}
                </button>
              </div>
            </form>
          ) : activeTab === "Dox" ? (
            // ========== DOX UI - DYNAMIC COLUMNS BY SLAB ==========
            <div className="w-full">
              {!createdCompanyId && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-yellow-900 font-semibold">
                    ⚠️ No Company Selected
                  </p>
                  <p className="text-yellow-700 text-sm mt-1">
                    Please create a company first in the "Add Company" tab to
                    configure rates.
                  </p>
                </div>
              )}

              {createdCompanyId && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-green-900 font-semibold">
                    ✅ Company Selected: {createdCompanyName}
                  </p>
                  <p className="text-green-700 text-sm mt-1">
                    Enter rates below for different slabs and save each slab
                    independently.
                  </p>
                </div>
              )}

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-6">
                  {activeTab} Rate Configuration
                </h2>

                {/* Slab Selection */}
                <div className="flex flex-wrap gap-4 mb-6">
                  {["Slab 2", "Slab 3", "Slab 4"].map((slab) => (
                    <label
                      key={slab}
                      className="flex items-center gap-2 text-gray-700 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded"
                    >
                      <input
                        type="radio"
                        name="doxSlab"
                        value={slab}
                        checked={slabState.Dox === slab}
                        onChange={() =>
                          setSlabState((prev) => ({ ...prev, Dox: slab }))
                        }
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="font-medium">{slab}</span>
                    </label>
                  ))}
                </div>

                {/* Rate Table with Dynamic Columns */}
                <div className="overflow-x-auto mb-6">
                  <table className="w-full border border-gray-300 text-sm text-center">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="border px-4 py-2 text-left font-semibold">
                          Destination
                        </th>
                        {SLAB_CONFIG[slabState.Dox]?.columns.map(
                          (column, idx) => (
                            <th
                              key={idx}
                              className="border px-4 py-2 font-semibold"
                            >
                              {column}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {DOX_RATE_ROWS.map((row, rowIdx) => (
                        <tr key={row} className="hover:bg-gray-50">
                          <td className="border px-4 py-2 text-left font-medium">
                            {row}
                          </td>
                          {doxTableData[slabState.Dox][rowIdx]?.map(
                            (value, colIdx) => (
                              <td key={colIdx} className="border px-2 py-2">
                                <input
                                  type="number"
                                  value={value}
                                  onChange={(e) => {
                                    const newData = JSON.parse(
                                      JSON.stringify(doxTableData)
                                    );
                                    newData[slabState.Dox][rowIdx][colIdx] =
                                      e.target.value;
                                    setDoxTableData(newData);
                                  }}
                                  placeholder="0.00"
                                  className="w-full border rounded-md px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                            )
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-6">
                  <p className="text-sm text-blue-800">
                    ℹ️ {slabState.Dox} has{" "}
                    <strong>{SLAB_CONFIG[slabState.Dox]?.count} columns</strong>
                    . Select a slab and enter rates, then click the save button
                    for that slab.
                  </p>
                </div>

                {/* Save Button for current slab only */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={async () => {
                      if (!createdCompanyId) {
                        alert("Please create a company first!");
                        return;
                      }
                      try {
                        setSavingSlabs((prev) => ({
                          ...prev,
                          [`Dox-${slabState.Dox}`]: true,
                        }));
                        const result = await saveSlabRates(
                          createdCompanyId,
                          "Dox",
                          slabState.Dox
                        );
                        alert(
                          `✅ ${slabState.Dox} saved successfully!\n${result.inserted} rate records added.`
                        );
                      } catch (error) {
                        alert(
                          `❌ Failed to save ${slabState.Dox}:\n${error.message}`
                        );
                      } finally {
                        setSavingSlabs((prev) => ({
                          ...prev,
                          [`Dox-${slabState.Dox}`]: false,
                        }));
                      }
                    }}
                    disabled={
                      savingSlabs[`Dox-${slabState.Dox}`] || !createdCompanyId
                    }
                    className={`px-6 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors font-medium ${
                      savingSlabs[`Dox-${slabState.Dox}`]
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : createdCompanyId
                        ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                        : "bg-gray-400 text-white cursor-not-allowed"
                    }`}
                  >
                    {savingSlabs[`Dox-${slabState.Dox}`]
                      ? `Saving ${slabState.Dox}...`
                      : `Save ${slabState.Dox}`}
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === "Dtdc PLUS" ? (
            // ========== DTDC PLUS UI ==========
            <div className="w-full">
              {!createdCompanyId && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-yellow-900 font-semibold">
                    ⚠️ No Company Selected
                  </p>
                  <p className="text-yellow-700 text-sm mt-1">
                    Please create a company first in the "Add Company" tab to
                    configure rates.
                  </p>
                </div>
              )}

              {createdCompanyId && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-green-900 font-semibold">
                    ✅ Company Selected: {createdCompanyName}
                  </p>
                  <p className="text-green-700 text-sm mt-1">
                    Enter rates below for different slabs and save each slab
                    independently.
                  </p>
                </div>
              )}

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-6">
                  {activeTab} Rate Configuration
                </h2>

                {/* Slab Selection */}
                <div className="flex flex-wrap gap-4 mb-6">
                  {["Slab 2", "Slab 3", "Slab 4"].map((slab) => (
                    <label
                      key={slab}
                      className="flex items-center gap-2 text-gray-700 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="dtdcPlusSlab"
                        value={slab}
                        checked={slabState["Dtdc PLUS"] === slab}
                        onChange={() =>
                          setSlabState((prev) => ({
                            ...prev,
                            "Dtdc PLUS": slab,
                          }))
                        }
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="font-medium">{slab}</span>
                    </label>
                  ))}
                </div>

                {/* Rate Table with Dynamic Columns */}
                <div className="overflow-x-auto mb-6">
                  <table className="w-full border border-gray-300 text-sm text-center">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border px-4 py-2 text-left">Zone</th>
                        {generateColumnsForSlab(slabState["Dtdc PLUS"]).map(
                          (col, idx) => (
                            <th key={idx} className="border px-4 py-2">
                              {col}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {DTDC_PLUS_ROWS.map((row, rIndex) => (
                        <tr key={row} className="hover:bg-gray-50">
                          <td className="border px-4 py-2 text-left font-medium">
                            {row}
                          </td>
                          {dtdcPlusTableData[slabState["Dtdc PLUS"]]?.[
                            rIndex
                          ]?.map((value, cIndex) => (
                            <td key={cIndex} className="border px-2 py-2">
                              <input
                                type="number"
                                value={value}
                                onChange={(e) => {
                                  const updated = JSON.parse(
                                    JSON.stringify(dtdcPlusTableData)
                                  );
                                  updated[slabState["Dtdc PLUS"]][rIndex][
                                    cIndex
                                  ] = e.target.value;
                                  setDtdcPlusTableData(updated);
                                }}
                                placeholder="0.00"
                                className="w-20 border rounded-md px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-6">
                  <p className="text-sm text-blue-800">
                    ℹ️ {slabState["Dtdc PLUS"]} has{" "}
                    <strong>
                      {generateColumnsForSlab(slabState["Dtdc PLUS"]).length}{" "}
                      columns
                    </strong>
                    . Select a slab and enter rates, then click the save button
                    for that slab.
                  </p>
                </div>

                {/* Save Button for current slab only */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={async () => {
                      if (!createdCompanyId) {
                        alert("Please create a company first!");
                        return;
                      }
                      try {
                        setSavingSlabs((prev) => ({
                          ...prev,
                          [`DtdcPLUS-${slabState["Dtdc PLUS"]}`]: true,
                        }));
                        const result = await saveSlabRates(
                          createdCompanyId,
                          "Dtdc PLUS",
                          slabState["Dtdc PLUS"]
                        );
                        alert(
                          `✅ ${slabState["Dtdc PLUS"]} saved successfully!\n${result.inserted} rate records added.`
                        );
                      } catch (error) {
                        alert(
                          `❌ Failed to save ${slabState["Dtdc PLUS"]}:\n${error.message}`
                        );
                      } finally {
                        setSavingSlabs((prev) => ({
                          ...prev,
                          [`DtdcPLUS-${slabState["Dtdc PLUS"]}`]: false,
                        }));
                      }
                    }}
                    disabled={
                      savingSlabs[`DtdcPLUS-${slabState["Dtdc PLUS"]}`] ||
                      !createdCompanyId
                    }
                    className={`px-6 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors font-medium ${
                      savingSlabs[`DtdcPLUS-${slabState["Dtdc PLUS"]}`]
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : createdCompanyId
                        ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                        : "bg-gray-400 text-white cursor-not-allowed"
                    }`}
                  >
                    {savingSlabs[`DtdcPLUS-${slabState["Dtdc PLUS"]}`]
                      ? `Saving ${slabState["Dtdc PLUS"]}...`
                      : `Save ${slabState["Dtdc PLUS"]}`}
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === "Dtdc PTP" ? (
            // ========== DTDC PTP UI - TWO TABLES ==========
            <div className="w-full">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-8">
                <div>
                  <h2 className="text-lg font-semibold text-gray-700 mb-6">
                    {activeTab} Rate Configuration
                  </h2>

                  {/* Company Selection Indicator */}
                  <div
                    className={`p-3 rounded-md mb-6 ${
                      createdCompanyId
                        ? "bg-green-50 border border-green-200"
                        : "bg-yellow-50 border border-yellow-200"
                    }`}
                  >
                    <p
                      className={`text-sm font-medium ${
                        createdCompanyId ? "text-green-800" : "text-yellow-800"
                      }`}
                    >
                      {createdCompanyId ? (
                        <>
                          ✅ Company Selected:{" "}
                          <strong>{createdCompanyName}</strong>
                        </>
                      ) : (
                        <>⚠️ No Company Selected</>
                      )}
                    </p>
                  </div>
                </div>

                {/* Slab Selection */}
                <div className="flex flex-wrap gap-4">
                  {["Slab 2", "Slab 3", "Slab 4"].map((slab) => (
                    <label
                      key={slab}
                      className="flex items-center gap-2 text-gray-700 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="dtdcPtpSlab"
                        value={slab}
                        checked={slabState["Dtdc PTP"]?.air === slab}
                        onChange={() =>
                          setSlabState((prev) => ({
                            ...prev,
                            "Dtdc PTP": {
                              ...prev["Dtdc PTP"],
                              air: slab,
                            },
                          }))
                        }
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="font-medium">{slab}</span>
                    </label>
                  ))}
                </div>

                {/* PTP Table 1 */}
                <div>
                  <h3 className="text-base font-semibold text-gray-700 mb-4">
                    PTP
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-300 text-sm text-center">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border px-4 py-2 text-left">Zone</th>
                          {generateColumnsForSlab(
                            slabState["Dtdc PTP"]?.air
                          ).map((col, idx) => (
                            <th key={idx} className="border px-4 py-2">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DTDC_PLUS_ROWS.map((row, rIndex) => (
                          <tr key={row} className="even:bg-gray-50">
                            <td className="border px-4 py-2 text-left font-medium">
                              {row}
                            </td>
                            {dtdcPtpTableData[
                              slabState["Dtdc PTP"]?.air
                            ]?.ptp?.[rIndex]?.map((value, cIndex) => (
                              <td key={cIndex} className="border px-2 py-2">
                                <input
                                  type="number"
                                  value={value}
                                  onChange={(e) => {
                                    const updated = JSON.parse(
                                      JSON.stringify(dtdcPtpTableData)
                                    );
                                    updated[slabState["Dtdc PTP"]?.air].ptp[
                                      rIndex
                                    ][cIndex] = e.target.value;
                                    setDtdcPtpTableData(updated);
                                  }}
                                  placeholder="0.00"
                                  className="w-20 border rounded-md px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* PTP Table 2 */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-base font-semibold text-gray-700 mb-4">
                    PTP 2
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-300 text-sm text-center">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border px-4 py-2 text-left">Zone</th>
                          {generateColumnsForSlab(
                            slabState["Dtdc PTP"]?.air
                          ).map((col, idx) => (
                            <th key={idx} className="border px-4 py-2">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DTDC_PLUS_ROWS.map((row, rIndex) => (
                          <tr key={row} className="even:bg-gray-50">
                            <td className="border px-4 py-2 text-left font-medium">
                              {row}
                            </td>
                            {dtdcPtpTableData[
                              slabState["Dtdc PTP"]?.air
                            ]?.ptp2?.[rIndex]?.map((value, cIndex) => (
                              <td key={cIndex} className="border px-2 py-2">
                                <input
                                  type="number"
                                  value={value}
                                  onChange={(e) => {
                                    const updated = JSON.parse(
                                      JSON.stringify(dtdcPtpTableData)
                                    );
                                    updated[slabState["Dtdc PTP"]?.air].ptp2[
                                      rIndex
                                    ][cIndex] = e.target.value;
                                    setDtdcPtpTableData(updated);
                                  }}
                                  placeholder="0.00"
                                  className="w-20 border rounded-md px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Per-Slab Save Buttons */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      PTP Slabs:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={async () => {
                          if (!createdCompanyId) {
                            alert("Please create a company first!");
                            return;
                          }
                          try {
                            setSavingSlabs((prev) => ({
                              ...prev,
                              [`Dtdc PTP-ptp-${slabState["Dtdc PTP"].air}`]: true,
                            }));
                            await saveSlabRates(
                              createdCompanyId,
                              "Dtdc PTP",
                              slabState["Dtdc PTP"].air,
                              "ptp"
                            );
                            alert(
                              `✅ ${slabState["Dtdc PTP"].air} (PTP) saved successfully!`
                            );
                          } catch (error) {
                            alert(
                              `❌ Failed to save ${slabState["Dtdc PTP"].air} (PTP):\n${error.message}`
                            );
                          } finally {
                            setSavingSlabs((prev) => ({
                              ...prev,
                              [`Dtdc PTP-ptp-${slabState["Dtdc PTP"].air}`]: false,
                            }));
                          }
                        }}
                        disabled={
                          !createdCompanyId ||
                          savingSlabs[
                            `Dtdc PTP-ptp-${slabState["Dtdc PTP"].air}`
                          ]
                        }
                        className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        {savingSlabs[
                          `Dtdc PTP-ptp-${slabState["Dtdc PTP"].air}`
                        ]
                          ? `Saving...`
                          : `Save ${slabState["Dtdc PTP"].air}`}
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      PTP 2 Slabs:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={async () => {
                          if (!createdCompanyId) {
                            alert("Please create a company first!");
                            return;
                          }
                          try {
                            setSavingSlabs((prev) => ({
                              ...prev,
                              [`Dtdc PTP-ptp2-${slabState["Dtdc PTP"].surface}`]: true,
                            }));
                            await saveSlabRates(
                              createdCompanyId,
                              "Dtdc PTP",
                              slabState["Dtdc PTP"].surface,
                              "ptp2"
                            );
                            alert(
                              `✅ ${slabState["Dtdc PTP"].surface} (PTP 2) saved successfully!`
                            );
                          } catch (error) {
                            alert(
                              `❌ Failed to save ${slabState["Dtdc PTP"].surface} (PTP 2):\n${error.message}`
                            );
                          } finally {
                            setSavingSlabs((prev) => ({
                              ...prev,
                              [`Dtdc PTP-ptp2-${slabState["Dtdc PTP"].surface}`]: false,
                            }));
                          }
                        }}
                        disabled={
                          !createdCompanyId ||
                          savingSlabs[
                            `Dtdc PTP-ptp2-${slabState["Dtdc PTP"].surface}`
                          ]
                        }
                        className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        {savingSlabs[
                          `Dtdc PTP-ptp2-${slabState["Dtdc PTP"].surface}`
                        ]
                          ? `Saving...`
                          : `Save ${slabState["Dtdc PTP"].surface}`}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === "Express Cargo" ? (
            // ========== EXPRESS CARGO UI ==========
            <div className="w-full">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-6">
                  {activeTab} Rate Configuration
                </h2>

                {/* Company Selection Indicator */}
                <div
                  className={`p-3 rounded-md mb-6 ${
                    createdCompanyId
                      ? "bg-green-50 border border-green-200"
                      : "bg-yellow-50 border border-yellow-200"
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      createdCompanyId ? "text-green-800" : "text-yellow-800"
                    }`}
                  >
                    {createdCompanyId ? (
                      <>
                        ✅ Company Selected:{" "}
                        <strong>{createdCompanyName}</strong>
                      </>
                    ) : (
                      <>⚠️ No Company Selected</>
                    )}
                  </p>
                </div>

                {/* Slab Selection */}
                <div className="flex flex-wrap gap-4 mb-6">
                  {["Slab 2", "Slab 3", "Slab 4"].map((slab) => (
                    <label
                      key={slab}
                      className="flex items-center gap-2 text-gray-700 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="expressCargoSlab"
                        value={slab}
                        checked={slabState["Express Cargo"] === slab}
                        onChange={() =>
                          setSlabState((prev) => ({
                            ...prev,
                            "Express Cargo": slab,
                          }))
                        }
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="font-medium">{slab}</span>
                    </label>
                  ))}
                </div>

                {/* Rate Table with Dynamic Columns */}
                <div className="overflow-x-auto mb-6">
                  <table className="w-full border border-gray-300 text-sm text-center">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border px-4 py-2 text-left">Zone</th>
                        {generateColumnsForSlab(slabState["Express Cargo"]).map(
                          (col, idx) => (
                            <th key={idx} className="border px-4 py-2">
                              {col}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {EXPRESS_CARGO_ROWS.map((row, rIndex) => (
                        <tr key={row} className="hover:bg-gray-50">
                          <td className="border px-4 py-2 text-left font-medium">
                            {row}
                          </td>
                          {expressCargoTableData[slabState["Express Cargo"]]?.[
                            rIndex
                          ]?.map((value, cIndex) => (
                            <td key={cIndex} className="border px-2 py-2">
                              <input
                                type="number"
                                value={value}
                                onChange={(e) => {
                                  const updated = JSON.parse(
                                    JSON.stringify(expressCargoTableData)
                                  );
                                  updated[slabState["Express Cargo"]][rIndex][
                                    cIndex
                                  ] = e.target.value;
                                  setExpressCargoTableData(updated);
                                }}
                                placeholder="0.00"
                                className="w-20 border rounded-md px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-6">
                  <p className="text-sm text-blue-800">
                    ℹ️ {slabState["Express Cargo"]} has{" "}
                    <strong>
                      {
                        generateColumnsForSlab(slabState["Express Cargo"])
                          .length
                      }{" "}
                      columns
                    </strong>
                    . Click on different slabs to see different column counts.
                  </p>
                </div>

                {/* Save Button for current slab only */}
                <div className="flex flex-wrap gap-3 justify-end">
                  <button
                    onClick={async () => {
                      if (!createdCompanyId) {
                        alert("Please create a company first!");
                        return;
                      }
                      try {
                        setSavingSlabs((prev) => ({
                          ...prev,
                          [`Express Cargo-${slabState["Express Cargo"]}`]: true,
                        }));
                        await saveSlabRates(
                          createdCompanyId,
                          "Express Cargo",
                          slabState["Express Cargo"]
                        );
                        alert(
                          `✅ ${slabState["Express Cargo"]} saved successfully!`
                        );
                      } catch (error) {
                        alert(
                          `❌ Failed to save ${slabState["Express Cargo"]}:\n${error.message}`
                        );
                      } finally {
                        setSavingSlabs((prev) => ({
                          ...prev,
                          [`Express Cargo-${slabState["Express Cargo"]}`]: false,
                        }));
                      }
                    }}
                    disabled={
                      !createdCompanyId ||
                      savingSlabs[`Express Cargo-${slabState["Express Cargo"]}`]
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium text-sm"
                  >
                    {savingSlabs[`Express Cargo-${slabState["Express Cargo"]}`]
                      ? `Saving ${slabState["Express Cargo"]}...`
                      : `Save ${slabState["Express Cargo"]}`}
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === "Priority" ? (
            // ========== PRIORITY GEC UI ==========
            <div className="w-full">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-6">
                  {activeTab} - GEC
                </h2>

                {/* Company Selection Indicator */}
                <div
                  className={`p-3 rounded-md mb-6 ${
                    createdCompanyId
                      ? "bg-green-50 border border-green-200"
                      : "bg-yellow-50 border border-yellow-200"
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      createdCompanyId ? "text-green-800" : "text-yellow-800"
                    }`}
                  >
                    {createdCompanyId ? (
                      <>
                        ✅ Company Selected:{" "}
                        <strong>{createdCompanyName}</strong>
                      </>
                    ) : (
                      <>⚠️ No Company Selected</>
                    )}
                  </p>
                </div>

                {/* Slab Selection */}
                <div className="flex flex-wrap gap-4 mb-6">
                  {PRIORITY_GEC_SLABS.map((slab) => (
                    <label
                      key={slab}
                      className="flex items-center gap-2 text-gray-700 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="priorityGecSlab"
                        value={slab}
                        checked={slabState["Priority"] === slab}
                        onChange={() =>
                          setSlabState((prev) => ({
                            ...prev,
                            Priority: slab,
                          }))
                        }
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="font-medium">Slab {slab}</span>
                    </label>
                  ))}
                </div>

                {/* Rate Table with Dynamic Columns */}
                <div className="overflow-x-auto mb-6">
                  <table className="w-full border border-gray-300 text-sm text-center">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border px-4 py-2 text-left">Zone</th>
                        {generateColumnsForSlab(slabState["Priority"]).map(
                          (col, idx) => (
                            <th key={idx} className="border px-4 py-2">
                              {col}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {PRIORITY_GEC_ROWS.map((row, rIndex) => (
                        <tr key={row} className="hover:bg-gray-50">
                          <td className="border px-4 py-2 text-left font-medium">
                            {row}
                          </td>
                          {priorityGecTableData[slabState["Priority"]]?.[
                            rIndex
                          ]?.map((value, cIndex) => (
                            <td key={cIndex} className="border px-2 py-2">
                              <input
                                type="number"
                                value={value}
                                onChange={(e) => {
                                  const updated = JSON.parse(
                                    JSON.stringify(priorityGecTableData)
                                  );
                                  updated[slabState["Priority"]][rIndex][
                                    cIndex
                                  ] = e.target.value;
                                  setPriorityGecTableData(updated);
                                }}
                                placeholder="0.00"
                                className="w-20 border rounded-md px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-6">
                  <p className="text-sm text-blue-800">
                    ℹ️ Slab {slabState["Priority"]} has{" "}
                    <strong>
                      {generateColumnsForSlab(slabState["Priority"]).length}{" "}
                      columns
                    </strong>
                    . Click on different slabs to see different column counts.
                  </p>
                </div>

                {/* Save Button for current slab only */}
                <div className="flex flex-wrap gap-3 justify-end">
                  <button
                    onClick={async () => {
                      if (!createdCompanyId) {
                        alert("Please create a company first!");
                        return;
                      }
                      try {
                        setSavingSlabs((prev) => ({
                          ...prev,
                          [`Priority-${slabState.Priority}`]: true,
                        }));
                        await saveSlabRates(
                          createdCompanyId,
                          "Priority",
                          slabState.Priority
                        );
                        alert(
                          `✅ Slab ${slabState.Priority} saved successfully!`
                        );
                      } catch (error) {
                        alert(
                          `❌ Failed to save Slab ${slabState.Priority}:\n${error.message}`
                        );
                      } finally {
                        setSavingSlabs((prev) => ({
                          ...prev,
                          [`Priority-${slabState.Priority}`]: false,
                        }));
                      }
                    }}
                    disabled={
                      !createdCompanyId ||
                      savingSlabs[`Priority-${slabState.Priority}`]
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium text-sm"
                  >
                    {savingSlabs[`Priority-${slabState.Priority}`]
                      ? `Saving Slab ${slabState.Priority}...`
                      : `Save Slab ${slabState.Priority}`}
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === "E-Commerce" ? (
            // ========== E-COMMERCE PRIORITY 7X UI ==========
            <div className="w-full">
              <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 max-w-4xl mx-auto">
                <h2 className="text-lg font-semibold text-center mb-4">
                  Ecommerce Priority - 7X
                </h2>

                {/* Company Selection Indicator */}
                <div
                  className={`p-3 rounded-md mb-6 ${
                    createdCompanyId
                      ? "bg-green-50 border border-green-200"
                      : "bg-yellow-50 border border-yellow-200"
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      createdCompanyId ? "text-green-800" : "text-yellow-800"
                    }`}
                  >
                    {createdCompanyId ? (
                      <>
                        ✅ Company Selected:{" "}
                        <strong>{createdCompanyName}</strong>
                      </>
                    ) : (
                      <>⚠️ No Company Selected</>
                    )}
                  </p>
                </div>

                {/* Slab Selection */}
                <div className="flex justify-center gap-8 mb-6">
                  {ECOMMERCE_SLABS.map((slab) => (
                    <label key={slab} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="ecommerceSlab"
                        value={slab}
                        checked={slabState["E-Commerce"] === slab}
                        onChange={() =>
                          setSlabState((prev) => ({
                            ...prev,
                            "E-Commerce": slab,
                          }))
                        }
                        className="accent-blue-600 w-4 h-4"
                      />
                      <span className="font-medium text-gray-700">
                        Slab {slab}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-gray-300 rounded-md">
                  <table className="w-full text-sm text-gray-800">
                    <thead className="bg-blue-50 text-gray-800">
                      <tr>
                        <th className="border border-gray-300 p-2 text-left w-1/3">
                          Zone / City
                        </th>
                        <th className="border border-gray-300 p-2 text-center">
                          Upto{" "}
                          <input
                            type="number"
                            value={ecommerceWeightRanges.upto}
                            onChange={(e) =>
                              setEcommerceWeightRanges((prev) => ({
                                ...prev,
                                upto: e.target.value,
                              }))
                            }
                            className="w-14 border border-gray-300 rounded-md text-center mx-1 py-0.5"
                          />{" "}
                          Kg
                        </th>
                        <th className="border border-gray-300 p-2 text-center">
                          Additional{" "}
                          <input
                            type="number"
                            value={ecommerceWeightRanges.additional}
                            onChange={(e) =>
                              setEcommerceWeightRanges((prev) => ({
                                ...prev,
                                additional: e.target.value,
                              }))
                            }
                            className="w-14 border border-gray-300 rounded-md text-center mx-1 py-0.5"
                          />{" "}
                          Kg
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ecommerceTableData.map((row, index) => (
                        <tr key={index} className="even:bg-gray-50">
                          <td className="border border-gray-300 p-2 font-medium">
                            {row.city}
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            <input
                              type="number"
                              value={row.upto}
                              onChange={(e) => {
                                const updated = [...ecommerceTableData];
                                updated[index].upto = e.target.value;
                                setEcommerceTableData(updated);
                              }}
                              className="w-20 border border-gray-300 rounded-md text-center py-1"
                            />
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            <input
                              type="number"
                              value={row.additional}
                              onChange={(e) => {
                                const updated = [...ecommerceTableData];
                                updated[index].additional = e.target.value;
                                setEcommerceTableData(updated);
                              }}
                              className="w-20 border border-gray-300 rounded-md text-center py-1"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* No Data Found */}
                {ecommerceTableData.length === 0 && (
                  <div className="text-center text-gray-500 text-sm mt-4">
                    No Data Found
                  </div>
                )}

                {/* Save Button for current slab only */}
                <div className="flex flex-wrap gap-3 justify-end mt-6">
                  <button
                    onClick={async () => {
                      if (!createdCompanyId) {
                        alert("Please create a company first!");
                        return;
                      }
                      try {
                        setSavingSlabs((prev) => ({
                          ...prev,
                          [`E-Commerce-${slabState["E-Commerce"]}`]: true,
                        }));
                        await saveSlabRates(
                          createdCompanyId,
                          "E-Commerce",
                          slabState["E-Commerce"]
                        );
                        alert(
                          `✅ Slab ${slabState["E-Commerce"]} saved successfully!`
                        );
                      } catch (error) {
                        alert(
                          `❌ Failed to save Slab ${slabState["E-Commerce"]}:\n${error.message}`
                        );
                      } finally {
                        setSavingSlabs((prev) => ({
                          ...prev,
                          [`E-Commerce-${slabState["E-Commerce"]}`]: false,
                        }));
                      }
                    }}
                    disabled={
                      !createdCompanyId ||
                      savingSlabs[`E-Commerce-${slabState["E-Commerce"]}`]
                    }
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
                  >
                    {savingSlabs[`E-Commerce-${slabState["E-Commerce"]}`]
                      ? `Saving Slab ${slabState["E-Commerce"]}...`
                      : `Save Slab ${slabState["E-Commerce"]}`}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // ========== OTHER COURIER TYPES - AIR & SURFACE SECTIONS ==========
            <div className="w-full">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm space-y-10">
                <div className="px-6 pt-6">
                  <h2 className="text-lg font-semibold text-gray-700 mb-6">
                    {activeTab} Rate Configuration
                  </h2>

                  {/* Company Selection Indicator */}
                  <div
                    className={`p-3 rounded-md ${
                      createdCompanyId
                        ? "bg-green-50 border border-green-200"
                        : "bg-yellow-50 border border-yellow-200"
                    }`}
                  >
                    <p
                      className={`text-sm font-medium ${
                        createdCompanyId ? "text-green-800" : "text-yellow-800"
                      }`}
                    >
                      {createdCompanyId ? (
                        <>
                          ✅ Company Selected:{" "}
                          <strong>{createdCompanyName}</strong>
                        </>
                      ) : (
                        <>⚠️ No Company Selected</>
                      )}
                    </p>
                  </div>
                </div>

                {/* ========== AIR RATE CARGO SECTION ========== */}
                <section className="p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    Air Rate Cargo
                  </h3>

                  {/* Slab Selection */}
                  <div className="flex gap-6 mb-6">
                    {["Slab 2", "Slab 3", "Slab 4"].map((slab) => (
                      <label
                        key={slab}
                        className="flex items-center gap-2 text-gray-700 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="airSlab"
                          value={slab}
                          checked={slabState[activeTab]?.air === slab}
                          onChange={() =>
                            setSlabState((prev) => ({
                              ...prev,
                              [activeTab]: {
                                ...prev[activeTab],
                                air: slab,
                              },
                            }))
                          }
                          className="w-4 h-4 accent-blue-600"
                        />
                        <span className="font-medium">{slab}</span>
                      </label>
                    ))}
                  </div>

                  {/* Table with Dynamic Columns */}
                  <div className="overflow-x-auto">
                    <table className="w-full border text-sm text-center">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="border px-4 py-3 text-left font-semibold text-gray-700">
                            Zone
                          </th>
                          {generateColumnsForSlab(
                            slabState[activeTab]?.air
                          ).map((col, idx) => (
                            <th
                              key={idx}
                              className="border px-4 py-3 font-semibold text-gray-700"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {RATE_ROWS.map((row, rIndex) => (
                          <tr key={row} className="hover:bg-gray-50">
                            <td className="border px-4 py-2 text-left font-medium text-gray-900">
                              {row}
                            </td>
                            {nonDoxTableData[slabState[activeTab]?.air]?.air?.[
                              rIndex
                            ]?.map((value, cIndex) => (
                              <td key={cIndex} className="border px-2 py-2">
                                <input
                                  type="number"
                                  value={value}
                                  onChange={(e) => {
                                    const updated = JSON.parse(
                                      JSON.stringify(nonDoxTableData)
                                    );
                                    updated[slabState[activeTab]?.air].air[
                                      rIndex
                                    ][cIndex] = e.target.value;
                                    setNonDoxTableData(updated);
                                  }}
                                  placeholder="0.00"
                                  className="w-20 border rounded-md px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* ========== RATE SURFACE CARGO SECTION ========== */}
                <section className="p-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    Rate Surface Cargo
                  </h3>

                  {/* Slab Selection */}
                  <div className="flex gap-6 mb-6">
                    {["Slab 2", "Slab 3", "Slab 4"].map((slab) => (
                      <label
                        key={slab}
                        className="flex items-center gap-2 text-gray-700 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="surfaceSlab"
                          value={slab}
                          checked={slabState[activeTab]?.surface === slab}
                          onChange={() =>
                            setSlabState((prev) => ({
                              ...prev,
                              [activeTab]: {
                                ...prev[activeTab],
                                surface: slab,
                              },
                            }))
                          }
                          className="w-4 h-4 accent-blue-600"
                        />
                        <span className="font-medium">{slab}</span>
                      </label>
                    ))}
                  </div>

                  {/* Table with Dynamic Columns */}
                  <div className="overflow-x-auto">
                    <table className="w-full border text-sm text-center">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="border px-4 py-3 text-left font-semibold text-gray-700">
                            Zone
                          </th>
                          {generateColumnsForSlab(
                            slabState[activeTab]?.surface
                          ).map((col, idx) => (
                            <th
                              key={idx}
                              className="border px-4 py-3 font-semibold text-gray-700"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {RATE_ROWS.map((row, rIndex) => (
                          <tr key={row} className="hover:bg-gray-50">
                            <td className="border px-4 py-2 text-left font-medium text-gray-900">
                              {row}
                            </td>
                            {nonDoxTableData[
                              slabState[activeTab]?.surface
                            ]?.surface?.[rIndex]?.map((value, cIndex) => (
                              <td key={cIndex} className="border px-2 py-2">
                                <input
                                  type="number"
                                  value={value}
                                  onChange={(e) => {
                                    const updated = JSON.parse(
                                      JSON.stringify(nonDoxTableData)
                                    );
                                    updated[
                                      slabState[activeTab]?.surface
                                    ].surface[rIndex][cIndex] = e.target.value;
                                    setNonDoxTableData(updated);
                                  }}
                                  placeholder="0.00"
                                  className="w-20 border rounded-md px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Per-Slab Save Buttons */}
                <div className="p-6 border-t border-gray-200">
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Air Rate Cargo Slabs:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={async () => {
                          if (!createdCompanyId) {
                            alert("Please create a company first!");
                            return;
                          }
                          try {
                            setSavingSlabs((prev) => ({
                              ...prev,
                              [`${activeTab}-air-${slabState[activeTab].air}`]: true,
                            }));
                            await saveSlabRates(
                              createdCompanyId,
                              activeTab,
                              slabState[activeTab].air,
                              "air"
                            );
                            alert(
                              `✅ ${slabState[activeTab].air} (Air) saved successfully!`
                            );
                          } catch (error) {
                            alert(
                              `❌ Failed to save ${slabState[activeTab].air} (Air):\n${error.message}`
                            );
                          } finally {
                            setSavingSlabs((prev) => ({
                              ...prev,
                              [`${activeTab}-air-${slabState[activeTab].air}`]: false,
                            }));
                          }
                        }}
                        disabled={
                          !createdCompanyId ||
                          savingSlabs[
                            `${activeTab}-air-${slabState[activeTab].air}`
                          ]
                        }
                        className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        {savingSlabs[
                          `${activeTab}-air-${slabState[activeTab].air}`
                        ]
                          ? `Saving...`
                          : `Save ${slabState[activeTab].air}`}
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Rate Surface Cargo Slabs:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={async () => {
                          if (!createdCompanyId) {
                            alert("Please create a company first!");
                            return;
                          }
                          try {
                            setSavingSlabs((prev) => ({
                              ...prev,
                              [`${activeTab}-surface-${slabState[activeTab].surface}`]: true,
                            }));
                            await saveSlabRates(
                              createdCompanyId,
                              activeTab,
                              slabState[activeTab].surface,
                              "surface"
                            );
                            alert(
                              `✅ ${slabState[activeTab].surface} (Surface) saved successfully!`
                            );
                          } catch (error) {
                            alert(
                              `❌ Failed to save ${slabState[activeTab].surface} (Surface):\n${error.message}`
                            );
                          } finally {
                            setSavingSlabs((prev) => ({
                              ...prev,
                              [`${activeTab}-surface-${slabState[activeTab].surface}`]: false,
                            }));
                          }
                        }}
                        disabled={
                          !createdCompanyId ||
                          savingSlabs[
                            `${activeTab}-surface-${slabState[activeTab].surface}`
                          ]
                        }
                        className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        {savingSlabs[
                          `${activeTab}-surface-${slabState[activeTab].surface}`
                        ]
                          ? `Saving...`
                          : `Save ${slabState[activeTab].surface}`}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddCompanyPage;
