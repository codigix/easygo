import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { LoginPage } from "./LoginPage.jsx";
import { SignupPage } from "./SignupPage.jsx";
import { DashboardLayout } from "../layouts/DashboardLayout.jsx";
import { DashboardPage } from "./DashboardPage.jsx";
import FranchiseListPage from "./FranchiseListPage.jsx";
import FranchiseFormPage from "./FranchiseFormPage.jsx";
import BookingFormPage from "./BookingFormPage.jsx";
import InvoiceGeneratePage from "./InvoiceGeneratePage.jsx";
import GenerateInvoicePage from "./GenerateInvoicePage.jsx";
import MultipleInvoicePage from "./MultipleInvoicePage.jsx";
import ViewInvoicePage from "./ViewInvoicePage.jsx";
import GenerateSingleInvoicePage from "./GenerateSingleInvoicePage.jsx";
import ViewSingleInvoicePage from "./ViewSingleInvoicePage.jsx";
import GenerateInvoiceWithoutGSTPage from "./GenerateInvoiceWithoutGSTPage.jsx";
import ViewInvoiceWithoutGSTPage from "./ViewInvoiceWithoutGSTPage.jsx";
import StationaryAddPage from "./StationaryAddPage.jsx";
import StationaryRemainingPage from "./StationaryRemainingPage.jsx";
import StationaryBulkBarcodePage from "./StationaryBulkBarcodePage.jsx";
import AddCompanyPage from "./AddCompanyPage.jsx";
import EditCompanyPage from "./EditCompanyPage.jsx";
import ImportCompanyExcelPage from "./ImportCompanyExcelPage.jsx";
import BookConsignmentPage from "./BookConsignmentPage.jsx";
import EditConsignmentPage from "./EditConsignmentPage.jsx";
import UpdateRatePage from "./UpdateRatePage.jsx";
import CheckBookingListPage from "./CheckBookingListPage.jsx";
import NoBookingListPage from "./NoBookingListPage.jsx";
import MultipleBookingPage from "./MultipleBookingPage.jsx";
import ImportFromCashCounterPage from "./ImportFromCashCounterPage.jsx";
import ImportLimitlessPage from "./ImportLimitlessPage.jsx";
import ImportFromExcelBookingPage from "./ImportFromExcelBookingPage.jsx";
import AddPaymentGSTPage from "./AddPaymentGSTPage.jsx";
import AddPaymentNonGSTPage from "./AddPaymentNonGSTPage.jsx";
import PaymentTrackPage from "./PaymentTrackPage.jsx";
import CustomerCreditPage from "./CustomerCreditPage.jsx";
import CreditorsReportPage from "./CreditorsReportPage.jsx";
import SaleReportBeforeInvoicePage from "./SaleReportBeforeInvoicePage.jsx";
import TaxReportPage from "./TaxReportPage.jsx";
import BilledUnbilledListPage from "./BilledUnbilledListPage.jsx";
import BusinessAnalysisPage from "./BusinessAnalysisPage.jsx";
import CustomerSalesComparisonPage from "./CustomerSalesComparisonPage.jsx";
import PrintReceiptPage from "./PrintReceiptPage.jsx";
import PrintBulkCashReceiptPage from "./PrintBulkCashReceiptPage.jsx";
import DeleteCashConsignmentPage from "./DeleteCashConsignmentPage.jsx";
import AddExpensesPage from "./AddExpensesPage.jsx";
import AddPaymentsPage from "./AddPaymentsPage.jsx";
import SalesReportPage from "./SalesReportPage.jsx";
import DailyReportPage from "./DailyReportPage.jsx";
import CashCreditorsReportPage from "./CashCreditorsReportPage.jsx";
import RecycleConsignmentPage from "./RecycleConsignmentPage.jsx";
import RecycleInvoicePage from "./RecycleInvoicePage.jsx";
import SettingsPage from "./SettingsPage.jsx";
import ChangePasswordPage from "./ChangePasswordPage.jsx";
import TrackingPage from "./TrackingPage.jsx";
import PickupCreatePage from "./PickupCreatePage.jsx";
import PickupSchedulePage from "./PickupSchedulePage.jsx";
import PickupAssignmentPage from "./PickupAssignmentPage.jsx";
import PickupStatusPage from "./PickupStatusPage.jsx";
import ShipmentCreatePage from "./ShipmentCreatePage.jsx";
import ShipmentBulkUploadPage from "./ShipmentBulkUploadPage.jsx";
import ShipmentListPage from "./ShipmentListPage.jsx";
import ShipmentExceptionsPage from "./ShipmentExceptionsPage.jsx";
import HubCreateManifestPage from "./HubCreateManifestPage.jsx";
import HubManifestListPage from "./HubManifestListPage.jsx";
import HubReManifestPage from "./HubReManifestPage.jsx";
import HubInScanPage from "./HubInScanPage.jsx";
import HubOutScanPage from "./HubOutScanPage.jsx";
import DeliveryAssignPage from "./DeliveryAssignPage.jsx";
import DeliveryOutForDeliveryPage from "./DeliveryOutForDeliveryPage.jsx";
import DeliveryPODPage from "./DeliveryPODPage.jsx";
import DeliveryFailedRTOPage from "./DeliveryFailedRTOPage.jsx";
import DeliveryPerformancePage from "./DeliveryPerformancePage.jsx";
import WalletCustomerWalletPage from "./WalletCustomerWalletPage.jsx";
import WalletRechargePage from "./WalletRechargePage.jsx";
import WalletCouponsPage from "./WalletCouponsPage.jsx";
import WalletDiscountRulesPage from "./WalletDiscountRulesPage.jsx";
import CRMLeadsPage from "./CRMLeadsPage.jsx";
import CRMCustomersPage from "./CRMCustomersPage.jsx";
import CRMSupportTicketsPage from "./CRMSupportTicketsPage.jsx";
import CRMSLAMonitoringPage from "./CRMSLAMonitoringPage.jsx";
import CRMInteractionLogPage from "./CRMInteractionLogPage.jsx";
import HRMSEmployeesPage from "./HRMSEmployeesPage.jsx";
import HRMSAttendancePage from "./HRMSAttendancePage.jsx";
import HRMSLeavePage from "./HRMSLeavePage.jsx";
import HRMSPayrollPage from "./HRMSPayrollPage.jsx";
import HRMSRolesPage from "./HRMSRolesPage.jsx";
import NotificationSMSTemplatesPage from "./NotificationSMSTemplatesPage.jsx";
import NotificationWhatsAppTemplatesPage from "./NotificationWhatsAppTemplatesPage.jsx";
import NotificationEmailTemplatesPage from "./NotificationEmailTemplatesPage.jsx";
import NotificationTriggerConfigPage from "./NotificationTriggerConfigPage.jsx";
import NotificationLogsPage from "./NotificationLogsPage.jsx";
import AnalyticsRouteOptimizationPage from "./AnalyticsRouteOptimizationPage.jsx";
import AnalyticsDemandForecastPage from "./AnalyticsDemandForecastPage.jsx";
import AnalyticsSLAAlertPage from "./AnalyticsSLAAlertPage.jsx";
import AnalyticsPerformanceInsightsPage from "./AnalyticsPerformanceInsightsPage.jsx";
import IntegrationAPIKeysPage from "./IntegrationAPIKeysPage.jsx";
import IntegrationPartnerAPIsPage from "./IntegrationPartnerAPIsPage.jsx";
import IntegrationWebhooksPage from "./IntegrationWebhooksPage.jsx";
import IntegrationAPIUsageLogsPage from "./IntegrationAPIUsageLogsPage.jsx";
import FleetVehiclesPage from "./FleetVehiclesPage.jsx";
import FleetDriversPage from "./FleetDriversPage.jsx";
import FleetRoutesMasterPage from "./FleetRoutesMasterPage.jsx";
import FleetLoadPlanningPage from "./FleetLoadPlanningPage.jsx";

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mx-auto"></div>
            <p className="mt-2 text-slate-600">Loading...</p>
          </div>
        </div>
      }
    >
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} 
        />
        <Route 
          path="/signup" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <SignupPage />} 
        />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />

          {/* Franchise Routes */}
          <Route path="franchises" element={<FranchiseListPage />} />
          <Route path="franchises/create" element={<FranchiseFormPage />} />
          <Route path="franchises/edit/:id" element={<FranchiseFormPage />} />

          {/* Stationary Routes */}
          <Route path="stationary/add" element={<StationaryAddPage />} />
          <Route
            path="stationary/remaining"
            element={<StationaryRemainingPage />}
          />
          <Route
            path="stationary/bulk-barcode"
            element={<StationaryBulkBarcodePage />}
          />

          {/* Rate Master Company Routes */}
          <Route path="ratemaster/add-company" element={<AddCompanyPage />} />
          <Route path="ratemaster/edit-company" element={<EditCompanyPage />} />
          <Route
            path="ratemaster/import-excel"
            element={<ImportCompanyExcelPage />}
          />

          {/* Booking Routes */}
          <Route path="bookings/create" element={<BookingFormPage />} />
          <Route path="booking/add" element={<BookConsignmentPage />} />
          <Route path="booking/modify" element={<EditConsignmentPage />} />
          <Route path="booking/update-rate" element={<UpdateRatePage />} />
          <Route path="booking/check-list" element={<CheckBookingListPage />} />
          <Route
            path="booking/no-booking-data"
            element={<NoBookingListPage />}
          />
          <Route path="booking/multiple" element={<MultipleBookingPage />} />
          <Route
            path="booking/import-cashcounter"
            element={<ImportFromCashCounterPage />}
          />
          <Route
            path="booking/import-limitless"
            element={<ImportLimitlessPage />}
          />
          <Route
            path="booking/import-excel"
            element={<ImportFromExcelBookingPage />}
          />
          <Route path="booking/recycle" element={<RecycleConsignmentPage />} />

          {/* Invoice Routes */}
          <Route path="invoices/generate" element={<GenerateInvoicePage />} />
          <Route path="invoices/multiple" element={<MultipleInvoicePage />} />
          <Route path="invoices/view" element={<ViewInvoicePage />} />
          <Route
            path="invoices/generate-single"
            element={<GenerateSingleInvoicePage />}
          />
          <Route
            path="invoices/view-single"
            element={<ViewSingleInvoicePage />}
          />
          <Route
            path="invoices/generate-without-gst"
            element={<GenerateInvoiceWithoutGSTPage />}
          />
          <Route
            path="invoices/view-without-gst"
            element={<ViewInvoiceWithoutGSTPage />}
          />
          <Route path="invoices/recycle" element={<RecycleInvoicePage />} />

          {/* Payment Routes */}
          <Route path="payments/gst" element={<AddPaymentGSTPage />} />
          <Route path="payments/non-gst" element={<AddPaymentNonGSTPage />} />
          <Route path="payments/track" element={<PaymentTrackPage />} />
          <Route path="payments/credit" element={<CustomerCreditPage />} />

          {/* Billing Reports Routes */}
          <Route path="reports/creditors" element={<CreditorsReportPage />} />
          <Route
            path="reports/sale-before-invoice"
            element={<SaleReportBeforeInvoicePage />}
          />
          <Route path="reports/tax" element={<TaxReportPage />} />
          <Route
            path="reports/billed-unbilled"
            element={<BilledUnbilledListPage />}
          />
          <Route
            path="reports/business-analysis"
            element={<BusinessAnalysisPage />}
          />
          <Route
            path="reports/customer-sales"
            element={<CustomerSalesComparisonPage />}
          />

          {/* CashCounter Routes */}
          <Route
            path="cashcounter/print-receipt"
            element={<PrintReceiptPage />}
          />
          <Route
            path="cashcounter/print-bulk"
            element={<PrintBulkCashReceiptPage />}
          />
          <Route
            path="cashcounter/delete-consignment"
            element={<DeleteCashConsignmentPage />}
          />

          {/* Daily Expenses Routes */}
          <Route path="daily-expenses/add" element={<AddExpensesPage />} />
          <Route
            path="daily-expenses/add-payment"
            element={<AddPaymentsPage />}
          />

          {/* Cashcounter Reports Routes */}
          <Route
            path="cashcounter-reports/sale-report"
            element={<SalesReportPage />}
          />
          <Route
            path="cashcounter-reports/daily-report"
            element={<DailyReportPage />}
          />
          <Route
            path="cashcounter-reports/creditors-report"
            element={<CashCreditorsReportPage />}
          />

          {/* Tracking Route */}
          <Route path="tracking" element={<TrackingPage />} />

          {/* Pickup Management Routes */}
          <Route path="pickup/create" element={<PickupCreatePage />} />
          <Route path="pickup/schedule" element={<PickupSchedulePage />} />
          <Route path="pickup/assignment" element={<PickupAssignmentPage />} />
          <Route path="pickup/status" element={<PickupStatusPage />} />

          {/* Shipment Routes */}
          <Route path="shipments/create" element={<ShipmentCreatePage />} />
          <Route path="shipments/bulk-upload" element={<ShipmentBulkUploadPage />} />
          <Route path="shipments/list" element={<ShipmentListPage />} />
          <Route path="shipments/exceptions" element={<ShipmentExceptionsPage />} />

          {/* Hub Operations Routes */}
          <Route path="hub/create-manifest" element={<HubCreateManifestPage />} />
          <Route path="hub/manifest-list" element={<HubManifestListPage />} />
          <Route path="hub/re-manifest" element={<HubReManifestPage />} />
          <Route path="hub/in-scan" element={<HubInScanPage />} />
          <Route path="hub/out-scan" element={<HubOutScanPage />} />

          {/* Delivery Routes */}
          <Route path="delivery/assign" element={<DeliveryAssignPage />} />
          <Route path="delivery/out-for-delivery" element={<DeliveryOutForDeliveryPage />} />
          <Route path="delivery/pod" element={<DeliveryPODPage />} />
          <Route path="delivery/failed-rto" element={<DeliveryFailedRTOPage />} />
          <Route path="delivery/performance" element={<DeliveryPerformancePage />} />

          {/* Wallet & Offers Routes */}
          <Route path="wallet/customer-wallet" element={<WalletCustomerWalletPage />} />
          <Route path="wallet/recharge" element={<WalletRechargePage />} />
          <Route path="wallet/coupons" element={<WalletCouponsPage />} />
          <Route path="wallet/discount-rules" element={<WalletDiscountRulesPage />} />

          {/* CRM & Support Routes */}
          <Route path="crm/leads" element={<CRMLeadsPage />} />
          <Route path="crm/customers" element={<CRMCustomersPage />} />
          <Route path="crm/support-tickets" element={<CRMSupportTicketsPage />} />
          <Route path="crm/sla-monitoring" element={<CRMSLAMonitoringPage />} />
          <Route path="crm/interaction-log" element={<CRMInteractionLogPage />} />

          {/* HRMS Routes */}
          <Route path="hrms/employees" element={<HRMSEmployeesPage />} />
          <Route path="hrms/attendance" element={<HRMSAttendancePage />} />
          <Route path="hrms/leave" element={<HRMSLeavePage />} />
          <Route path="hrms/payroll" element={<HRMSPayrollPage />} />
          <Route path="hrms/roles" element={<HRMSRolesPage />} />

          {/* Notifications Routes */}
          <Route path="notifications/sms-templates" element={<NotificationSMSTemplatesPage />} />
          <Route path="notifications/whatsapp-templates" element={<NotificationWhatsAppTemplatesPage />} />
          <Route path="notifications/email-templates" element={<NotificationEmailTemplatesPage />} />
          <Route path="notifications/trigger-config" element={<NotificationTriggerConfigPage />} />
          <Route path="notifications/logs" element={<NotificationLogsPage />} />

          {/* Analytics & AI Routes */}
          <Route path="analytics/route-optimization" element={<AnalyticsRouteOptimizationPage />} />
          <Route path="analytics/demand-forecast" element={<AnalyticsDemandForecastPage />} />
          <Route path="analytics/sla-alerts" element={<AnalyticsSLAAlertPage />} />
          <Route path="analytics/performance" element={<AnalyticsPerformanceInsightsPage />} />

          {/* Integrations Routes */}
          <Route path="integrations/api-keys" element={<IntegrationAPIKeysPage />} />
          <Route path="integrations/partner-apis" element={<IntegrationPartnerAPIsPage />} />
          <Route path="integrations/webhooks" element={<IntegrationWebhooksPage />} />
          <Route path="integrations/usage-logs" element={<IntegrationAPIUsageLogsPage />} />

          {/* Fleet & Routes */}
          <Route path="fleet/vehicles" element={<FleetVehiclesPage />} />
          <Route path="fleet/drivers" element={<FleetDriversPage />} />
          <Route path="fleet/routes" element={<FleetRoutesMasterPage />} />
          <Route path="fleet/load-planning" element={<FleetLoadPlanningPage />} />

          {/* Settings Route */}
          <Route path="settings" element={<SettingsPage />} />

          {/* Change Password Route */}
          <Route path="change-password" element={<ChangePasswordPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
