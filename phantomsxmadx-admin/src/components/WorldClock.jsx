import { useState, useEffect, useMemo, useRef } from "react";
import { FiClock, FiPlus, FiX, FiSearch, FiTrash2, FiGlobe } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

// Comprehensive worldwide cities database covering all major countries, capitals & timezones
const WORLD_CITIES = [
  // South Asia
  { id: "pk_isb", city: "Islamabad / Karachi", country: "Pakistan", flag: "🇵🇰", timezone: "Asia/Karachi", label: "Pakistan Standard Time (PKT)" },
  { id: "pk_lhr", city: "Lahore", country: "Pakistan", flag: "🇵🇰", timezone: "Asia/Karachi", label: "Pakistan Standard Time" },
  { id: "in_del", city: "New Delhi / Mumbai", country: "India", flag: "🇮🇳", timezone: "Asia/Kolkata", label: "India Standard Time (IST)" },
  { id: "bd_dha", city: "Dhaka", country: "Bangladesh", flag: "🇧🇩", timezone: "Asia/Dhaka", label: "Bangladesh Standard Time" },
  { id: "lk_cmb", city: "Colombo", country: "Sri Lanka", flag: "🇱🇰", timezone: "Asia/Colombo", label: "Sri Lanka Time" },
  { id: "np_ktm", city: "Kathmandu", country: "Nepal", flag: "🇳🇵", timezone: "Asia/Kathmandu", label: "Nepal Time" },
  { id: "af_kbl", city: "Kabul", country: "Afghanistan", flag: "🇦🇫", timezone: "Asia/Kabul", label: "Afghanistan Time" },

  // Middle East / Gulf
  { id: "ae_dxb", city: "Dubai", country: "United Arab Emirates", flag: "🇦🇪", timezone: "Asia/Dubai", label: "Gulf Standard Time (GST)" },
  { id: "ae_auh", city: "Abu Dhabi", country: "United Arab Emirates", flag: "🇦🇪", timezone: "Asia/Dubai", label: "Gulf Standard Time" },
  { id: "sa_ruh", city: "Riyadh", country: "Saudi Arabia", flag: "🇸🇦", timezone: "Asia/Riyadh", label: "Arabia Standard Time (AST)" },
  { id: "sa_jed", city: "Jeddah / Mecca", country: "Saudi Arabia", flag: "🇸🇦", timezone: "Asia/Riyadh", label: "Arabia Standard Time" },
  { id: "qa_doh", city: "Doha", country: "Qatar", flag: "🇶🇦", timezone: "Asia/Qatar", label: "Arabia Standard Time" },
  { id: "kw_kwt", city: "Kuwait City", country: "Kuwait", flag: "🇰🇼", timezone: "Asia/Kuwait", label: "Arabia Standard Time" },
  { id: "bh_bah", city: "Manama", country: "Bahrain", flag: "🇧🇭", timezone: "Asia/Bahrain", label: "Arabia Standard Time" },
  { id: "om_mct", city: "Muscat", country: "Oman", flag: "🇴🇲", timezone: "Asia/Muscat", label: "Gulf Standard Time" },
  { id: "tr_ist", city: "Istanbul / Ankara", country: "Turkey", flag: "🇹🇷", timezone: "Europe/Istanbul", label: "Turkey Time (TRT)" },
  { id: "jo_amm", city: "Amman", country: "Jordan", flag: "🇯🇴", timezone: "Asia/Amman", label: "Arabia Time" },
  { id: "lb_bey", city: "Beirut", country: "Lebanon", flag: "🇱🇧", timezone: "Asia/Beirut", label: "Eastern European Time" },
  { id: "iq_bgw", city: "Baghdad", country: "Iraq", flag: "🇮🇶", timezone: "Asia/Baghdad", label: "Arabia Standard Time" },
  { id: "ir_thr", city: "Tehran", country: "Iran", flag: "🇮🇷", timezone: "Asia/Tehran", label: "Iran Standard Time" },

  // East & Southeast Asia
  { id: "sg_sin", city: "Singapore", country: "Singapore", flag: "🇸🇬", timezone: "Asia/Singapore", label: "Singapore Standard Time (SGT)" },
  { id: "my_kul", city: "Kuala Lumpur", country: "Malaysia", flag: "🇲🇾", timezone: "Asia/Kuala_Lumpur", label: "Malaysia Time (MYT)" },
  { id: "jp_tyo", city: "Tokyo", country: "Japan", flag: "🇯🇵", timezone: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { id: "cn_bjs", city: "Beijing / Shanghai", country: "China", flag: "🇨🇳", timezone: "Asia/Shanghai", label: "China Standard Time (CST)" },
  { id: "cn_hkg", city: "Hong Kong", country: "Hong Kong", flag: "🇭🇰", timezone: "Asia/Hong_Kong", label: "Hong Kong Time (HKT)" },
  { id: "kr_sel", city: "Seoul", country: "South Korea", flag: "🇰🇷", timezone: "Asia/Seoul", label: "Korea Standard Time (KST)" },
  { id: "id_jkt", city: "Jakarta", country: "Indonesia", flag: "🇮🇩", timezone: "Asia/Jakarta", label: "Western Indonesia Time" },
  { id: "th_bkk", city: "Bangkok", country: "Thailand", flag: "🇹🇭", timezone: "Asia/Bangkok", label: "Indochina Time (ICT)" },
  { id: "ph_mnl", city: "Manila", country: "Philippines", flag: "🇵🇭", timezone: "Asia/Manila", label: "Philippine Time (PHT)" },
  { id: "vn_han", city: "Hanoi / Ho Chi Minh", country: "Vietnam", flag: "🇻🇳", timezone: "Asia/Ho_Chi_Minh", label: "Indochina Time" },
  { id: "tw_tpe", city: "Taipei", country: "Taiwan", flag: "🇹🇼", timezone: "Asia/Taipei", label: "Taipei Standard Time" },

  // Europe
  { id: "gb_lon", city: "London", country: "United Kingdom", flag: "🇬🇧", timezone: "Europe/London", label: "Greenwich Mean Time (GMT / BST)" },
  { id: "de_ber", city: "Berlin / Frankfurt", country: "Germany", flag: "🇩🇪", timezone: "Europe/Berlin", label: "Central European Time (CET)" },
  { id: "fr_par", city: "Paris", country: "France", flag: "🇫🇷", timezone: "Europe/Paris", label: "Central European Time (CET)" },
  { id: "it_rom", city: "Rome / Milan", country: "Italy", flag: "🇮🇹", timezone: "Europe/Rome", label: "Central European Time (CET)" },
  { id: "es_mad", city: "Madrid / Barcelona", country: "Spain", flag: "🇪🇸", timezone: "Europe/Madrid", label: "Central European Time (CET)" },
  { id: "nl_ams", city: "Amsterdam", country: "Netherlands", flag: "🇳🇱", timezone: "Europe/Amsterdam", label: "Central European Time (CET)" },
  { id: "ch_zur", city: "Zurich / Geneva", country: "Switzerland", flag: "🇨🇭", timezone: "Europe/Zurich", label: "Central European Time (CET)" },
  { id: "be_bru", city: "Brussels", country: "Belgium", flag: "🇧🇪", timezone: "Europe/Brussels", label: "Central European Time (CET)" },
  { id: "at_vie", city: "Vienna", country: "Austria", flag: "🇦🇹", timezone: "Europe/Vienna", label: "Central European Time (CET)" },
  { id: "se_sto", city: "Stockholm", country: "Sweden", flag: "🇸🇪", timezone: "Europe/Stockholm", label: "Central European Time (CET)" },
  { id: "no_osl", city: "Oslo", country: "Norway", flag: "🇳🇴", timezone: "Europe/Oslo", label: "Central European Time (CET)" },
  { id: "dk_cph", city: "Copenhagen", country: "Denmark", flag: "🇩🇰", timezone: "Europe/Copenhagen", label: "Central European Time (CET)" },
  { id: "fi_hel", city: "Helsinki", country: "Finland", flag: "🇫🇮", timezone: "Europe/Helsinki", label: "Eastern European Time (EET)" },
  { id: "ie_dub", city: "Dublin", country: "Ireland", flag: "🇮🇪", timezone: "Europe/Dublin", label: "Irish Standard Time (IST)" },
  { id: "pl_waw", city: "Warsaw", country: "Poland", flag: "🇵🇱", timezone: "Europe/Warsaw", label: "Central European Time (CET)" },
  { id: "pt_lis", city: "Lisbon", country: "Portugal", flag: "🇵🇹", timezone: "Europe/Lisbon", label: "Western European Time (WET)" },
  { id: "gr_ath", city: "Athens", country: "Greece", flag: "🇬🇷", timezone: "Europe/Athens", label: "Eastern European Time (EET)" },
  { id: "ru_mow", city: "Moscow", country: "Russia", flag: "🇷🇺", timezone: "Europe/Moscow", label: "Moscow Standard Time (MSK)" },
  { id: "ua_kyv", city: "Kyiv", country: "Ukraine", flag: "🇺🇦", timezone: "Europe/Kyiv", label: "Eastern European Time (EET)" },

  // North America
  { id: "us_nyc", city: "New York (EST)", country: "United States", flag: "🇺🇸", timezone: "America/New_York", label: "Eastern Standard Time (EST)" },
  { id: "us_lax", city: "Los Angeles / SF (PST)", country: "United States", flag: "🇺🇸", timezone: "America/Los_Angeles", label: "Pacific Standard Time (PST)" },
  { id: "us_chi", city: "Chicago (CST)", country: "United States", flag: "🇺🇸", timezone: "America/Chicago", label: "Central Standard Time (CST)" },
  { id: "us_den", city: "Denver (MST)", country: "United States", flag: "🇺🇸", timezone: "America/Denver", label: "Mountain Standard Time (MST)" },
  { id: "us_tx", city: "Dallas / Austin / Houston", country: "United States", flag: "🇺🇸", timezone: "America/Chicago", label: "Central Standard Time" },
  { id: "ca_tor", city: "Toronto / Montreal", country: "Canada", flag: "🇨🇦", timezone: "America/Toronto", label: "Eastern Standard Time (EST)" },
  { id: "ca_van", city: "Vancouver", country: "Canada", flag: "🇨🇦", timezone: "America/Vancouver", label: "Pacific Standard Time (PST)" },
  { id: "mx_mex", city: "Mexico City", country: "Mexico", flag: "🇲🇽", timezone: "America/Mexico_City", label: "Central Standard Time (CST)" },

  // Oceania
  { id: "au_syd", city: "Sydney", country: "Australia", flag: "🇦🇺", timezone: "Australia/Sydney", label: "Australian Eastern Time (AEST)" },
  { id: "au_mel", city: "Melbourne", country: "Australia", flag: "🇦🇺", timezone: "Australia/Melbourne", label: "Australian Eastern Time (AEST)" },
  { id: "au_bne", city: "Brisbane", country: "Australia", flag: "🇦🇺", timezone: "Australia/Brisbane", label: "Australian Eastern Time" },
  { id: "au_per", city: "Perth", country: "Australia", flag: "🇦🇺", timezone: "Australia/Perth", label: "Australian Western Time (AWST)" },
  { id: "nz_akl", city: "Auckland / Wellington", country: "New Zealand", flag: "🇳🇿", timezone: "Pacific/Auckland", label: "New Zealand Standard Time (NZST)" },

  // South America
  { id: "br_sao", city: "São Paulo / Rio", country: "Brazil", flag: "🇧🇷", timezone: "America/Sao_Paulo", label: "Brasília Time (BRT)" },
  { id: "ar_bue", city: "Buenos Aires", country: "Argentina", flag: "🇦🇷", timezone: "America/Argentina/Buenos_Aires", label: "Argentina Time (ART)" },
  { id: "cl_scl", city: "Santiago", country: "Chile", flag: "🇨🇱", timezone: "America/Santiago", label: "Chile Time (CLT)" },
  { id: "co_bog", city: "Bogotá", country: "Colombia", flag: "🇨🇴", timezone: "America/Bogota", label: "Colombia Time (COT)" },
  { id: "pe_lim", city: "Lima", country: "Peru", flag: "🇵🇪", timezone: "America/Lima", label: "Peru Time (PET)" },

  // Africa
  { id: "eg_cai", city: "Cairo", country: "Egypt", flag: "🇪🇬", timezone: "Africa/Cairo", label: "Eastern European Time (EET)" },
  { id: "za_jnb", city: "Johannesburg / Cape Town", country: "South Africa", flag: "🇿🇦", timezone: "Africa/Johannesburg", label: "South Africa Standard Time (SAST)" },
  { id: "ng_los", city: "Lagos", country: "Nigeria", flag: "🇳🇬", timezone: "Africa/Lagos", label: "West Africa Time (WAT)" },
  { id: "ke_nbo", city: "Nairobi", country: "Kenya", flag: "🇰🇪", timezone: "Africa/Nairobi", label: "East Africa Time (EAT)" },
  { id: "ma_cas", city: "Casablanca", country: "Morocco", flag: "🇲🇦", timezone: "Africa/Casablanca", label: "Western European Time (WET)" }
];

export default function WorldClock({ isLight = false }) {
  const [now, setNow] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedCityIds, setPinnedCityIds] = useState(() => {
    try {
      const saved = localStorage.getItem("admin_world_clocks");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default international clocks pinned below Pakistan
    return ["us_nyc", "gb_lon", "ae_dxb"];
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const savePinned = (ids) => {
    setPinnedCityIds(ids);
    try {
      localStorage.setItem("admin_world_clocks", JSON.stringify(ids));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCity = (cityId) => {
    if (!pinnedCityIds.includes(cityId)) {
      savePinned([...pinnedCityIds, cityId]);
    }
    setIsModalOpen(false);
    setSearchQuery("");
  };

  const handleRemoveCity = (cityId) => {
    savePinned(pinnedCityIds.filter(id => id !== cityId));
  };

  // Primary Pakistan Clock details
  const getPakistanTime = () => {
    try {
      const timeParts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Karachi",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      }).formatToParts(now);

      const hour = timeParts.find(p => p.type === "hour")?.value || "";
      const minute = timeParts.find(p => p.type === "minute")?.value || "";
      const second = timeParts.find(p => p.type === "second")?.value || "";
      const dayPeriod = timeParts.find(p => p.type === "dayPeriod")?.value || "";

      const dateStr = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Karachi",
        weekday: "short",
        month: "short",
        day: "numeric"
      }).format(now);

      return {
        timeNumber: `${hour}:${minute}:${second}`,
        dayPeriod,
        dateStr
      };
    } catch (e) {
      return { timeNumber: "--:--:--", dayPeriod: "", dateStr: "" };
    }
  };

  // Helper for secondary clocks
  const getCityClockInfo = (timezone) => {
    try {
      const timeStr = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      }).format(now);

      const hour24 = parseInt(
        new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          hour: "numeric",
          hour12: false
        }).format(now),
        10
      );

      const pktHour = parseInt(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Karachi",
          hour: "numeric",
          hour12: false
        }).format(now),
        10
      );

      let diff = hour24 - pktHour;
      if (diff > 12) diff -= 24;
      if (diff < -12) diff += 24;

      const diffStr = 
        diff === 0 
          ? "Same time as Pakistan" 
          : diff > 0 
            ? `${diff} ${diff === 1 ? 'hour' : 'hours'} ahead of Pakistan` 
            : `${Math.abs(diff)} ${Math.abs(diff) === 1 ? 'hour' : 'hours'} behind Pakistan`;

      return { timeStr, diffStr };
    } catch (e) {
      return { timeStr: "--:--", diffStr: "" };
    }
  };

  const pkTime = getPakistanTime();

  const pinnedList = useMemo(() => {
    return pinnedCityIds
      .map(id => WORLD_CITIES.find(c => c.id === id))
      .filter(Boolean);
  }, [pinnedCityIds]);

  const filteredSearchList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return WORLD_CITIES;
    return WORLD_CITIES.filter(
      c =>
        c.city.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.label.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className={`p-5 sm:p-6 rounded-3xl border transition-all duration-300 shadow-xl relative overflow-hidden flex flex-col justify-between h-full ${
      isLight 
        ? "bg-white border-slate-200 text-slate-900" 
        : "bg-gradient-to-br from-[#121629] to-[#090b14] border-slate-800 text-white"
    }`}>
      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-400">
            <FiClock size={16} />
          </div>
          <h2 className="text-sm font-black uppercase tracking-wider">
            World Clock
          </h2>
        </div>

        <button
          onClick={() => {
            setSearchQuery("");
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1 px-3 py-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
          title="Add City / Country"
        >
          <FiPlus size={14} />
          <span>Add Clock</span>
        </button>
      </div>

      {/* Main Primary Clock (Pakistan Standard Time) */}
      <div className="text-center py-4 bg-white/[0.025] rounded-2xl border border-white/5 mb-4">
        <div className="inline-flex items-baseline justify-center gap-1.5">
          <span className="font-mono text-3xl sm:text-4xl font-extralight tracking-tight text-white drop-shadow-sm">
            {pkTime.timeNumber}
          </span>
          <span className="text-xs sm:text-sm font-bold uppercase text-slate-400">
            {pkTime.dayPeriod}
          </span>
        </div>

        <div className="mt-1.5 space-y-0.5">
          <p className="text-xs font-medium text-slate-300">
            {pkTime.dateStr}
          </p>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
            Pakistan Standard Time (PKT)
          </p>
        </div>
      </div>

      {/* Pinned World Cities List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 px-1 uppercase tracking-wider">
          <span>Pinned Clocks ({pinnedList.length})</span>
        </div>

        <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1 custom-scrollbar">
          <AnimatePresence>
            {pinnedList.map(city => {
              const { timeStr, diffStr } = getCityClockInfo(city.timezone);

              return (
                <motion.div
                  key={city.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all group relative"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="text-lg shrink-0 select-none">{city.flag}</span>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-white truncate leading-tight">
                        {city.city}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate opacity-80">
                        {city.country} • {diffStr}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs font-medium text-white group-hover:text-blue-400 transition-colors">
                      {timeStr}
                    </span>
                    <button
                      onClick={() => handleRemoveCity(city.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Remove"
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {pinnedList.length === 0 && (
            <div className="text-center py-4 border border-dashed border-white/10 rounded-xl">
              <p className="text-[11px] text-slate-400">No international cities pinned</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-1 text-[11px] font-bold text-blue-400 hover:text-blue-300"
              >
                + Add your first world city
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Global City Search Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-[2rem] w-full max-w-lg p-6 shadow-2xl relative z-10 max-h-[85vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <FiGlobe size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-white">Add World Clock</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative my-4">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search city, country, or timezone..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* Cities List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar max-h-[360px]">
                {filteredSearchList.map((city) => {
                  const isAlreadyPinned = pinnedCityIds.includes(city.id);
                  const { timeStr } = getCityClockInfo(city.timezone);

                  return (
                    <button
                      key={city.id}
                      disabled={isAlreadyPinned}
                      onClick={() => handleAddCity(city.id)}
                      className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition cursor-pointer ${
                        isAlreadyPinned
                          ? "bg-slate-950/40 opacity-50 cursor-not-allowed"
                          : "bg-slate-950 hover:bg-blue-600/10 hover:border-blue-500/30 border border-slate-800/80"
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate pr-2">
                        <span className="text-2xl shrink-0">{city.flag}</span>
                        <div className="truncate">
                          <h4 className="text-xs font-bold text-white truncate">
                            {city.city}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate">
                            {city.country} • {city.label}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="font-mono text-xs font-semibold text-slate-300">
                          {timeStr}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                          isAlreadyPinned ? "bg-slate-800 text-slate-500" : "bg-blue-600 text-white"
                        }`}>
                          {isAlreadyPinned ? "Added" : "+ Add"}
                        </span>
                      </div>
                    </button>
                  );
                })}

                {filteredSearchList.length === 0 && (
                  <div className="text-center py-10 text-xs text-slate-500">
                    No matching country or city found
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

