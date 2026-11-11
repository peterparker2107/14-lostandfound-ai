import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Sparkles,
  ShieldCheck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Tag,
  Filter,
  Layers,
  ArrowRight,
  Sun,
  Moon,
  ChevronRight,
  Copy,
  Check,
  HelpCircle,
  Laptop,
  Briefcase,
  Headphones,
  CreditCard,
  Key,
  FolderOpen
} from 'lucide-react';
import {
  INITIAL_ITEMS,
  COLOR_PALETTE,
  CAMPUS_LOCATIONS,
  LostFoundItem,
  ItemCategory,
  ItemStatus,
  ColorDefinition
} from './data/items';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  const [activeTab, setActiveTab] = useState<'gallery' | 'matcher' | 'report' | 'claim'>('gallery');

  const [items, setItems] = useState<LostFoundItem[]>(INITIAL_ITEMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedTargetItem, setSelectedTargetItem] = useState<LostFoundItem>(INITIAL_ITEMS[0]);

  // Report Item Form State
  const [reportType, setReportType] = useState<'Lost' | 'Found'>('Lost');
  const [reportTitle, setReportTitle] = useState('');
  const [reportCategory, setReportCategory] = useState<ItemCategory>('Laptops & Tech');
  const [reportColor, setReportColor] = useState<ColorDefinition>(COLOR_PALETTE[0]);
  const [reportLocation, setReportLocation] = useState(CAMPUS_LOCATIONS[0].name);
  const [reportDescription, setReportDescription] = useState('');
  const [reportSecret, setReportSecret] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  // Claim Handshake state
  const [claimAnswer, setClaimAnswer] = useState('');
  const [claimRollNo, setClaimRollNo] = useState('102203491');
  const [claimVerified, setClaimVerified] = useState(false);
  const [copiedClaimToken, setCopiedClaimToken] = useState(false);

  // Vector similarity math between two items
  const computeVectorSimilarity = (itemA: {
    category: ItemCategory;
    primaryColor: ColorDefinition;
    location: string;
    daysAgo: number;
  }, itemB: LostFoundItem) => {
    // 1. Category similarity (Weight: 0.35)
    const categoryScore = itemA.category === itemB.category ? 1.0 : 0.1;

    // 2. Location proximity (Weight: 0.25)
    let locationScore = 0.2;
    if (itemA.location === itemB.location) {
      locationScore = 1.0;
    } else {
      const locA = CAMPUS_LOCATIONS.find(l => l.name === itemA.location);
      const locB = CAMPUS_LOCATIONS.find(l => l.name === itemB.location);
      if (locA && locB && locA.zone === locB.zone) {
        locationScore = 0.65;
      }
    }

    // 3. Color Euclidean Distance in RGB (Weight: 0.20)
    const [r1, g1, b1] = itemA.primaryColor.rgb;
    const [r2, g2, b2] = itemB.primaryColor.rgb;
    const colorDist = Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
    const maxDist = Math.sqrt(3 * (255 ** 2)); // ~441.67
    const colorScore = Math.max(0, 1 - (colorDist / maxDist));

    // 4. Temporal Proximity (Weight: 0.20)
    const dayDiff = Math.abs(itemA.daysAgo - itemB.daysAgo);
    const timeScore = Math.max(0.1, 1 - (dayDiff / 10));

    // Combined Weighted Score
    const total = (categoryScore * 0.35) + (locationScore * 0.25) + (colorScore * 0.20) + (timeScore * 0.20);
    const percent = Math.round(total * 100);

    return {
      total: Math.min(99, percent),
      categoryScore: Math.round(categoryScore * 100),
      locationScore: Math.round(locationScore * 100),
      colorScore: Math.round(colorScore * 100),
      timeScore: Math.round(timeScore * 100),
    };
  };

  // Filtered Items for Gallery
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.trackingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [items, searchQuery, statusFilter, categoryFilter]);

  // Ranked vector matches for target item
  const vectorMatches = useMemo(() => {
    // We want items that have the opposite status (e.g. if target is Lost, search Found items, and vice versa)
    const oppositeStatus = selectedTargetItem.status === 'Lost' ? 'Found' : 'Lost';
    const candidates = items.filter(i => i.id !== selectedTargetItem.id && i.status === oppositeStatus);

    return candidates.map(cand => {
      const sim = computeVectorSimilarity(selectedTargetItem, cand);
      return {
        item: cand,
        similarity: sim
      };
    }).sort((a, b) => b.similarity.total - a.similarity.total);
  }, [items, selectedTargetItem]);

  // Live auto-match preview during reporting
  const reportAutoMatches = useMemo(() => {
    if (!reportTitle && !reportCategory) return [];
    const query = {
      category: reportCategory,
      primaryColor: reportColor,
      location: reportLocation,
      daysAgo: 0,
    };
    const targetStatus = reportType === 'Lost' ? 'Found' : 'Lost';
    return items
      .filter(i => i.status === targetStatus)
      .map(cand => ({
        item: cand,
        sim: computeVectorSimilarity(query, cand)
      }))
      .sort((a, b) => b.sim.total - a.sim.total)
      .slice(0, 2);
  }, [items, reportType, reportCategory, reportColor, reportLocation]);

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim()) return;

    const newItem: LostFoundItem = {
      id: `item-${Date.now()}`,
      trackingCode: `TIET-LF-${Math.floor(1000 + Math.random() * 9000)}`,
      title: reportTitle,
      category: reportCategory,
      status: reportType,
      primaryColor: reportColor,
      location: reportLocation,
      locationZone: 'Academic',
      reportedDate: 'Just now',
      daysAgo: 0,
      reportedBy: 'You (Armaan Singh)',
      contactMasked: '1022*****@thapar.edu',
      description: reportDescription || 'No public notes provided.',
      secretVerificationHint: reportSecret || 'Unspecified identifier',
    };

    setItems(prev => [newItem, ...prev]);
    setSelectedTargetItem(newItem);
    setReportSuccess(true);
    setTimeout(() => {
      setReportSuccess(false);
      setActiveTab('matcher');
    }, 1500);
  };

  const copyClaimToken = () => {
    navigator.clipboard.writeText(`TIET-CLAIM-PASS:SEC-0x9F41-${selectedTargetItem.trackingCode}-AUTHORIZED`);
    setCopiedClaimToken(true);
    setTimeout(() => setCopiedClaimToken(false), 2000);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-[#090d16] text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors duration-200`}>
      {/* Frosted Sticky Top Navigation */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-[#0f172a]/80 border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Brand & Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                    LostAndFound AI
                  </h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                    VECTOR AI v2.8
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  TIET Visual Clearinghouse & Multi-Attribute Similarity Matcher
                </p>
              </div>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* Center Tabs */}
          <nav className="flex items-center overflow-x-auto gap-1 p-1 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-medium">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeTab === 'gallery'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Item Gallery
            </button>

            <button
              onClick={() => setActiveTab('matcher')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeTab === 'matcher'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Vector Matcher
              {vectorMatches.length > 0 && vectorMatches[0].similarity.total >= 85 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeTab === 'report'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              Report Item
            </button>

            <button
              onClick={() => setActiveTab('claim')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeTab === 'claim'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Claim Verification
            </button>
          </nav>

          {/* Right Status */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-xs font-mono font-medium text-indigo-700 dark:text-indigo-300">
                CLEARINGHOUSE ACTIVE
              </span>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Bento Grid KPI Stat Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Items Tracked */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Items In Clearinghouse
              </span>
              <span className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                <FolderOpen className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
                184
              </span>
              <span className="text-xs text-slate-400">registered items</span>
            </div>
            <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">
              Across Library, Audi, COS & Labs
            </p>
          </div>

          {/* Card 2: Reunited */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Reunited With Owners
              </span>
              <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                142
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-500 font-semibold">(77.2%)</span>
            </div>
            <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">
              Zero unclaimed items discarded
            </p>
          </div>

          {/* Card 3: AI Vector Matches */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                High-Confidence AI Pairs
              </span>
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-indigo-600 dark:text-indigo-400">
                6 Pairs
              </span>
              <span className="text-xs text-slate-400">&gt; 85% similarity</span>
            </div>
            <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">
              Auto-matched via color & coordinate vector
            </p>
          </div>

          {/* Card 4: Turnaround Time */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Avg. Handshake Resolution
              </span>
              <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
                4.2
              </span>
              <span className="text-xs text-slate-400">Hours Turnaround</span>
            </div>
            <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">
              Via Gate 1 Main Security Control
            </p>
          </div>
        </div>

        {/* TAB 1: ITEM GALLERY */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            {/* Search & Filters */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by item title, brand, tracking ID (e.g. TIET-LF-1042), or location..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs">
                  <span className="text-slate-400">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Lost">Lost</option>
                    <option value="Found">Found</option>
                    <option value="Reunited">Reunited</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs">
                  <span className="text-slate-400">Category:</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-transparent font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Categories</option>
                    <option value="Laptops & Tech">Laptops & Tech</option>
                    <option value="Bags & Backpacks">Bags & Backpacks</option>
                    <option value="Audio & Wearables">Audio & Wearables</option>
                    <option value="Wallets & IDs">Wallets & IDs</option>
                    <option value="Bottles & Tumblers">Bottles & Tumblers</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems.map(item => {
                const isTarget = selectedTargetItem.id === item.id;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-5 transition-all duration-200 space-y-4 ${
                      isTarget
                        ? 'bg-white dark:bg-slate-900 border-indigo-500/60 shadow-md shadow-indigo-500/5 ring-1 ring-indigo-500/30'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {item.trackingCode}
                        </span>
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-sm"
                          style={{ backgroundColor: item.primaryColor.hex }}
                          title={`Color: ${item.primaryColor.name}`}
                        />
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                        item.status === 'Found'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : item.status === 'Lost'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                      }`}>
                        {item.status.toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.category}
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-[11px] font-mono text-slate-500 dark:text-slate-400 space-y-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{item.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{item.reportedDate}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <button
                        onClick={() => {
                          setSelectedTargetItem(item);
                          setActiveTab('matcher');
                        }}
                        className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Match Vector
                      </button>

                      <button
                        onClick={() => {
                          setSelectedTargetItem(item);
                          setActiveTab('claim');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-medium transition"
                      >
                        Claim / Verify
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: AI VECTOR MATCHER */}
        {activeTab === 'matcher' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Target Item Left Card (1 Col) */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold uppercase">
                    Query Reference Vector
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedTargetItem.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs text-slate-500">
                      {selectedTargetItem.trackingCode}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      selectedTargetItem.status === 'Lost' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {selectedTargetItem.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Category:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedTargetItem.category}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Color RGB:</span>
                    <span className="font-semibold flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedTargetItem.primaryColor.hex }} />
                      {selectedTargetItem.primaryColor.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Location:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{selectedTargetItem.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reported:</span>
                    <span className="font-semibold">{selectedTargetItem.reportedDate}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200">
                  <span className="font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Vector Dimension Weights:
                  </span>
                  <div className="mt-1.5 space-y-0.5 font-mono text-[10px]">
                    <div>Category: 35%</div>
                    <div>Geo Proximity: 25%</div>
                    <div>RGB Color Distance: 20%</div>
                    <div>Temporal Window: 20%</div>
                  </div>
                </div>
              </div>

              {/* Vector Match Candidates (2 Cols) */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      Ranked AI Similarity Matches
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Searching corresponding {selectedTargetItem.status === 'Lost' ? 'FOUND' : 'LOST'} entries in database
                    </p>
                  </div>
                  <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
                    {vectorMatches.length} Potential Matches
                  </span>
                </div>

                <div className="space-y-4">
                  {vectorMatches.map(({ item, similarity }) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-3 hover:border-indigo-400 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-slate-500">{item.trackingCode}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                              {item.category}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                            {item.title}
                          </h4>
                        </div>

                        {/* Total Score Badge */}
                        <div className="text-right">
                          <span className={`inline-block px-3 py-1 rounded-full font-mono font-bold text-xs ${
                            similarity.total >= 85
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : similarity.total >= 60
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {similarity.total}% Vector Match
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {item.description}
                      </p>

                      {/* Vector Dimension Breakdown Bars */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <span>Category: {similarity.categoryScore}%</span>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                            <div className="bg-indigo-500 h-full" style={{ width: `${similarity.categoryScore}%` }} />
                          </div>
                        </div>
                        <div>
                          <span>Location: {similarity.locationScore}%</span>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                            <div className="bg-teal-500 h-full" style={{ width: `${similarity.locationScore}%` }} />
                          </div>
                        </div>
                        <div>
                          <span>Color RGB: {similarity.colorScore}%</span>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                            <div className="bg-purple-500 h-full" style={{ width: `${similarity.colorScore}%` }} />
                          </div>
                        </div>
                        <div>
                          <span>Time Window: {similarity.timeScore}%</span>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                            <div className="bg-emerald-500 h-full" style={{ width: `${similarity.timeScore}%` }} />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => {
                            setSelectedTargetItem(item);
                            setActiveTab('claim');
                          }}
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          Initiate Ownership Handshake
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: REPORT ITEM */}
        {activeTab === 'report' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-lg space-y-6">
              <div>
                <span className="text-[11px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                  TIET SECURITY & CLEARINGHOUSE DISPATCH
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  Report a Lost or Found Campus Article
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Our client-side vector engine will immediately scan existing catalog for identical matches.
                </p>
              </div>

              {/* Lost vs Found Switcher */}
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setReportType('Lost')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                    reportType === 'Lost'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  I Lost An Item
                </button>
                <button
                  type="button"
                  onClick={() => setReportType('Found')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                    reportType === 'Found'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  I Found An Item
                </button>
              </div>

              <form onSubmit={handleCreateReport} className="space-y-4 text-xs">
                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300">Item Title & Model</label>
                  <input
                    type="text"
                    required
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="e.g. Apple MacBook Air M2 13-inch or Decathlon Navy Backpack"
                    className="mt-1 w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium text-slate-700 dark:text-slate-300">Category</label>
                    <select
                      value={reportCategory}
                      onChange={(e) => setReportCategory(e.target.value as ItemCategory)}
                      className="mt-1 w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
                    >
                      <option value="Laptops & Tech">Laptops & Tech</option>
                      <option value="Bags & Backpacks">Bags & Backpacks</option>
                      <option value="Audio & Wearables">Audio & Wearables</option>
                      <option value="Wallets & IDs">Wallets & IDs</option>
                      <option value="Bottles & Tumblers">Bottles & Tumblers</option>
                      <option value="Keys & Accessories">Keys & Accessories</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-medium text-slate-700 dark:text-slate-300">Campus Location</label>
                    <select
                      value={reportLocation}
                      onChange={(e) => setReportLocation(e.target.value)}
                      className="mt-1 w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
                    >
                      {CAMPUS_LOCATIONS.map(loc => (
                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Color Selector */}
                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300">Primary Color Vector</label>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {COLOR_PALETTE.map(col => (
                      <button
                        key={col.name}
                        type="button"
                        onClick={() => setReportColor(col)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono transition ${
                          reportColor.name === col.name
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 font-bold'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: col.hex }} />
                        <span>{col.name.split('/')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300">Public Description / Visible Marks</label>
                  <textarea
                    rows={2}
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Provide non-sensitive observations (e.g. slight scratch on bottom right, zipper sticker)"
                    className="mt-1 w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300">
                    Secret Verification Detail (Confidential — kept secret from public)
                  </label>
                  <input
                    type="text"
                    value={reportSecret}
                    onChange={(e) => setReportSecret(e.target.value)}
                    placeholder="e.g. Wallpaper image, exact roll number on ID, key chain mascot"
                    className="mt-1 w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Instant Match Notification Banner */}
                {reportAutoMatches.length > 0 && reportAutoMatches[0].sim.total >= 70 && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 space-y-1">
                    <span className="font-bold flex items-center gap-1.5 text-xs">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      Live Vector Match Found: {reportAutoMatches[0].sim.total}% match with "{reportAutoMatches[0].item.title}"!
                    </span>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      Already cataloged at {reportAutoMatches[0].item.location}. Submitting will link your record directly to this candidate.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  {reportSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      Report Logged & Vector Indexed!
                    </>
                  ) : (
                    <>
                      <Tag className="w-4 h-4" />
                      Dispatch Report to Clearinghouse Mesh
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: OWNERSHIP VERIFICATION & CLAIM PASS */}
        {activeTab === 'claim' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-6">
              <div className="border-b border-dashed border-slate-200 dark:border-slate-800 pb-4">
                <span className="text-[11px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                  TIET DOSA SECURITY DIVISION
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  Three-Step Ownership Verification Protocol
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verifying claim for: <strong className="text-slate-800 dark:text-slate-200">{selectedTargetItem.title}</strong> ({selectedTargetItem.trackingCode})
                </p>
              </div>

              {!claimVerified ? (
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-indigo-700 dark:text-indigo-300 block mb-1">
                      Step 1: Security Challenge
                    </span>
                    <p className="font-medium">
                      {selectedTargetItem.secretVerificationHint || 'Please describe any distinctive markings or secret contents.'}
                    </p>
                  </div>

                  <div>
                    <label className="font-medium text-slate-700 dark:text-slate-300">Your Verification Answer / Proof</label>
                    <input
                      type="text"
                      value={claimAnswer}
                      onChange={(e) => setClaimAnswer(e.target.value)}
                      placeholder="e.g. Stickers are Rust and Linux; wallpaper is anime character"
                      className="mt-1 w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-slate-700 dark:text-slate-300">Student Roll Number</label>
                    <input
                      type="text"
                      value={claimRollNo}
                      onChange={(e) => setClaimRollNo(e.target.value)}
                      className="mt-1 w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={() => setClaimVerified(true)}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Verify Ownership & Issue Claim Token
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                    <div className="text-xs">
                      <span className="font-bold block">Handshake Successfully Authenticated!</span>
                      <span>Security desk clearance token generated for student ID {claimRollNo}.</span>
                    </div>
                  </div>

                  {/* Claim Badge with QR */}
                  <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center gap-5">
                    <div className="w-24 h-24 bg-slate-900 dark:bg-white rounded-xl p-2 flex items-center justify-center shrink-0">
                      <QrCode className="w-20 h-20 text-white dark:text-slate-900" />
                    </div>
                    <div className="text-xs space-y-1">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        TIET CLAIM TOKEN: #SEC-9821-APPROVED
                      </span>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Present this barcode at <strong>Main Security Control Booth (Gate 1)</strong> along with your physical TIET Student ID card.
                      </p>
                      <p className="font-mono text-[10px] text-slate-400">
                        Item: {selectedTargetItem.trackingCode} • Authorized until 18 Feb 2026
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={copyClaimToken}
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    {copiedClaimToken ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied Claim Clearance Token!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Cryptographic Claim Token
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
