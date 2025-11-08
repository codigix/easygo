import { ChevronDown, Menu, MessageCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

export function TopBar({ onOpenChat, onToggleMobileSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const daysRemaining = user?.subscription_end_date
    ? dayjs(user.subscription_end_date).diff(dayjs(), "day")
    : 0;

  return (
    <header className="sticky top-0 z-10 flex h-auto flex-none flex-wrap items-center gap-2 bg-white px-2 py-2 shadow md:px-6 md:py-3 md:gap-3">
      <div className="flex w-full items-center justify-between gap-2 md:gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="rounded-lg p-1 md:p-2 transition hover:bg-emerald-50 md:hidden flex-shrink-0"
            title="Toggle navigation menu"
          >
            <Menu className="h-5 w-5 text-emerald-600" />
          </button>
          <nav className="hidden items-center gap-4 text-sm font-medium text-slate-600 md:flex">
            <button
              type="button"
              onClick={() => navigate("/booking/add")}
              className="rounded-md border border-transparent px-3 py-2 hover:bg-emerald-50 transition"
            >
              Booking
            </button>
            <button
              type="button"
              onClick={() => navigate("/invoices/generate")}
              className="rounded-md border border-transparent px-3 py-2 hover:bg-emerald-50 transition"
            >
              Generate Invoice
            </button>
          </nav>
        </div>
        <div className="hidden md:flex items-center gap-3 text-xs text-slate-500">
          <span>
            Support WhatsApp No:
            <a
              className="ml-1 font-semibold text-emerald-600"
              href="tel:8830991572"
            >
              8830991572
            </a>
          </span>
          <span>|</span>
          <span>
            Franchise:{" "}
            <span className="font-semibold text-emerald-600">
              {user?.franchise_code || "N/A"}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-1 md:gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onOpenChat}
            className="flex items-center gap-1 md:gap-2 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 md:px-3 md:py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition flex-shrink-0"
            title="Open AI Assistant"
          >
            <MessageCircle size={14} className="md:w-4 md:h-4" />
            <span className="hidden sm:inline">AI</span>
          </button>
          <span className="text-xs md:text-sm font-medium text-slate-600 hidden sm:inline max-w-[100px] truncate">
            {user?.full_name || user?.username}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-slate-200 px-2 py-0.5 md:px-3 md:py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 flex-shrink-0"
          >
            Sign Out
          </button>
        </div>
      </div>
      <div className="flex w-full items-center justify-between rounded-md bg-emerald-50 px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm text-emerald-700 gap-2">
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <span className="font-semibold truncate max-w-[120px] md:max-w-none">
            {user?.franchise_name || "FR Dashboard"}
          </span>
          <ChevronDown className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
        </div>
        <div className="flex items-center gap-1 md:gap-2 text-emerald-600 flex-shrink-0">
          <span className="whitespace-nowrap">{daysRemaining}d left</span>
          <span className="hidden md:inline">|</span>
          <span className="hidden sm:inline whitespace-nowrap">
            <strong>
              {user?.subscription_end_date
                ? dayjs(user.subscription_end_date).format("DD/MM")
                : "N/A"}
            </strong>
          </span>
        </div>
      </div>
    </header>
  );
}
