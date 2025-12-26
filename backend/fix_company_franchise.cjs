const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const args = process.argv.slice(2);
const options = args.reduce((acc, arg) => {
  if (!arg.startsWith("--")) {
    return acc;
  }
  const [key, value] = arg.slice(2).split("=");
  acc[key] = value ?? true;
  return acc;
}, {});

const companyCode =
  options["company-id"] || options.company || options.c || options.id;
const targetFranchiseId = parseInt(
  options["target-franchise-id"] || options.target || options.t,
  10
);
const sourceFranchiseId = options["source-franchise-id"]
  ? parseInt(options["source-franchise-id"], 10)
  : null;

if (!companyCode || Number.isNaN(targetFranchiseId)) {
  console.error(
    "Usage: node fix_company_franchise.cjs --company-id=DTDC01 --target-franchise-id=7 [--source-franchise-id=6]"
  );
  process.exit(1);
}

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT || "3306", 10),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "Backend",
    database: process.env.MYSQL_DATABASE || "frbilling",
  });

  let transactionStarted = false;

  try {
    const whereClause = sourceFranchiseId
      ? "WHERE company_id = ? AND franchise_id = ?"
      : "WHERE company_id = ?";
    const params = sourceFranchiseId
      ? [companyCode, sourceFranchiseId]
      : [companyCode];

    const [companies] = await connection.query(
      `SELECT id, company_id, company_name, franchise_id
       FROM company_rate_master ${whereClause}`,
      params
    );

    if (companies.length === 0) {
      throw new Error(
        `No company records found for ID "${companyCode}"${
          sourceFranchiseId ? ` in franchise ${sourceFranchiseId}` : ""
        }`
      );
    }

    const companyDbIds = companies.map((row) => row.id);
    console.log(
      `Realigning ${companyDbIds.length} company record(s) for "${companyCode}" to franchise ${targetFranchiseId}`
    );

    await connection.beginTransaction();
    transactionStarted = true;

    const updateCompanySql = sourceFranchiseId
      ? `UPDATE company_rate_master SET franchise_id = ? WHERE company_id = ? AND franchise_id = ?`
      : `UPDATE company_rate_master SET franchise_id = ? WHERE company_id = ?`;
    const updateCompanyParams = sourceFranchiseId
      ? [targetFranchiseId, companyCode, sourceFranchiseId]
      : [targetFranchiseId, companyCode];

    const [companyUpdateResult] = await connection.query(
      updateCompanySql,
      updateCompanyParams
    );

    let ratesUpdated = 0;
    if (companyDbIds.length > 0) {
      const placeholders = companyDbIds.map(() => "?").join(", ");
      const [ratesUpdateResult] = await connection.query(
        `UPDATE courier_company_rates SET franchise_id = ? WHERE company_id IN (${placeholders})`,
        [targetFranchiseId, ...companyDbIds]
      );
      ratesUpdated = ratesUpdateResult.affectedRows;
    }

    await connection.commit();
    transactionStarted = false;

    console.log("✅ Franchise realignment complete. Summary:");
    console.table(
      companies.map((row) => ({
        company_db_id: row.id,
        company_id: row.company_id,
        name: row.company_name,
        previous_franchise: row.franchise_id,
        new_franchise: targetFranchiseId,
      }))
    );
    console.log(
      `Updated ${companyUpdateResult.affectedRows} company record(s) and ${ratesUpdated} courier rate row(s).`
    );
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback();
    }
    throw error;
  } finally {
    await connection.end();
  }
})().catch((error) => {
  console.error("❌ Failed to realign franchise:", error.message);
  process.exit(1);
});
