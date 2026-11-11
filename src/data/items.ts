export type ItemCategory = 'Laptops & Tech' | 'Bags & Backpacks' | 'Audio & Wearables' | 'Wallets & IDs' | 'Bottles & Tumblers' | 'Keys & Accessories';
export type ItemStatus = 'Lost' | 'Found' | 'Claim Under Review' | 'Reunited';

export interface CampusLocation {
  id: string;
  name: string;
  zone: 'Academic' | 'Residential' | 'Recreation' | 'Dining';
}

export interface ColorDefinition {
  name: string;
  hex: string;
  rgb: [number, number, number];
}

export interface LostFoundItem {
  id: string;
  trackingCode: string;
  title: string;
  category: ItemCategory;
  status: ItemStatus;
  primaryColor: ColorDefinition;
  location: string;
  locationZone: 'Academic' | 'Residential' | 'Recreation' | 'Dining';
  reportedDate: string; // ISO or relative
  daysAgo: number;
  reportedBy: string;
  contactMasked: string;
  description: string;
  secretVerificationHint: string;
  imageUrl?: string;
  matchPairId?: string; // id of corresponding found/lost item if matched
}

export const COLOR_PALETTE: ColorDefinition[] = [
  { name: 'Space Grey / Dark Slate', hex: '#334155', rgb: [51, 65, 85] },
  { name: 'Midnight Black', hex: '#0f172a', rgb: [15, 23, 42] },
  { name: 'Navy Blue', hex: '#1e3a8a', rgb: [30, 58, 138] },
  { name: 'Silver / White', hex: '#f8fafc', rgb: [248, 250, 252] },
  { name: 'Forest / Sage Green', hex: '#15803d', rgb: [21, 128, 61] },
  { name: 'Tan / Leather Brown', hex: '#92400e', rgb: [146, 64, 14] },
  { name: 'Crimson Red', hex: '#b91c1c', rgb: [185, 28, 28] },
  { name: 'Sunset Amber / Yellow', hex: '#d97706', rgb: [217, 119, 6] },
];

export const CAMPUS_LOCATIONS: CampusLocation[] = [
  { id: 'loc-lib', name: 'Central Library (2nd Floor & Silent Zone)', zone: 'Academic' },
  { id: 'loc-audi', name: 'Main Auditorium (Balcony & Foyer)', zone: 'Recreation' },
  { id: 'loc-cos', name: 'COS Complex & Food Court', zone: 'Dining' },
  { id: 'loc-csed', name: 'CSED Building & Computer Labs', zone: 'Academic' },
  { id: 'loc-sports', name: 'Sports Complex & Athletic Track', zone: 'Recreation' },
  { id: 'loc-hostel-j', name: 'Hostel J Courtyard & Mess', zone: 'Residential' },
  { id: 'loc-hostel-pg', name: 'Hostel PG Quad & Lawn', zone: 'Residential' },
  { id: 'loc-jaggi', name: 'Jaggi Market & Verka Canteen', zone: 'Dining' },
];

export const INITIAL_ITEMS: LostFoundItem[] = [
  {
    id: 'item-1',
    trackingCode: 'TIET-LF-1042',
    title: 'Apple MacBook Air M2 13-inch (Space Grey)',
    category: 'Laptops & Tech',
    status: 'Lost',
    primaryColor: COLOR_PALETTE[0], // Space Grey
    location: 'Central Library (2nd Floor & Silent Zone)',
    locationZone: 'Academic',
    reportedDate: '11 Feb 2026, 14:30',
    daysAgo: 1,
    reportedBy: 'Kavya Singhal',
    contactMasked: '1022*****@thapar.edu',
    description: 'Left on desk near the IEEE Journal shelves. Has an Octocat sticker and a Rust programming sticker on top lid.',
    secretVerificationHint: 'What specific sticker is located beside the trackpad?'
  },
  {
    id: 'item-2',
    trackingCode: 'TIET-LF-1043',
    title: 'MacBook Air M2 with Stickers in Black Sleeve',
    category: 'Laptops & Tech',
    status: 'Found',
    primaryColor: COLOR_PALETTE[0], // Space Grey
    location: 'Central Library (2nd Floor & Silent Zone)',
    locationZone: 'Academic',
    reportedDate: '11 Feb 2026, 16:15',
    daysAgo: 1,
    reportedBy: 'Library Security Desk',
    contactMasked: 'library-security@thapar.edu',
    description: 'Handed over by student custodian. Space grey laptop with multiple tech stickers in a zipped sleeve.',
    secretVerificationHint: 'Verify device lock screen name or serial number.',
    matchPairId: 'item-1'
  },
  {
    id: 'item-3',
    trackingCode: 'TIET-LF-1038',
    title: 'Navy Blue Wildcraft 30L Laptop Backpack',
    category: 'Bags & Backpacks',
    status: 'Found',
    primaryColor: COLOR_PALETTE[2], // Navy Blue
    location: 'COS Complex & Food Court',
    locationZone: 'Dining',
    reportedDate: '10 Feb 2026, 18:20',
    daysAgo: 2,
    reportedBy: 'COS Canteen Staff',
    contactMasked: 'dosa-support@thapar.edu',
    description: 'Found on the outdoor concrete bench near the fruit juice stall. Contains spiral notebooks and scientific calculator.',
    secretVerificationHint: 'Name the model number of the calculator inside.'
  },
  {
    id: 'item-4',
    trackingCode: 'TIET-LF-1039',
    title: 'Blue Decathlon Daypack with College ID',
    category: 'Bags & Backpacks',
    status: 'Lost',
    primaryColor: COLOR_PALETTE[2], // Navy Blue
    location: 'COS Complex & Food Court',
    locationZone: 'Dining',
    reportedDate: '10 Feb 2026, 19:00',
    daysAgo: 2,
    reportedBy: 'Pratham Verma',
    contactMasked: '1023*****@thapar.edu',
    description: 'Forgot near the juice bar during evening snack. Contains my TIET Identity card in the small front zip.',
    secretVerificationHint: 'What is the roll number on the ID card?'
  },
  {
    id: 'item-5',
    trackingCode: 'TIET-LF-1025',
    title: 'Sony WH-1000XM4 Wireless Headphones (Black)',
    category: 'Audio & Wearables',
    status: 'Lost',
    primaryColor: COLOR_PALETTE[1], // Black
    location: 'CSED Building & Computer Labs',
    locationZone: 'Academic',
    reportedDate: '09 Feb 2026, 11:15',
    daysAgo: 3,
    reportedBy: 'Aniket Roy',
    contactMasked: '1021*****@thapar.edu',
    description: 'In hard zipper case with gold accent cables. Lost during Lab Exam in CSED Lab 4.',
    secretVerificationHint: 'Custom name shown in Bluetooth pairing menu.'
  },
  {
    id: 'item-6',
    trackingCode: 'TIET-LF-1026',
    title: 'Over-Ear Noise Cancelling Headphones in Black Case',
    category: 'Audio & Wearables',
    status: 'Found',
    primaryColor: COLOR_PALETTE[1], // Black
    location: 'CSED Building & Computer Labs',
    locationZone: 'Academic',
    reportedDate: '09 Feb 2026, 13:45',
    daysAgo: 3,
    reportedBy: 'Lab Technician R. Singh',
    contactMasked: 'csed-labs@thapar.edu',
    description: 'Deposited at CSED Lab Office. In premium black zippered pouch.',
    secretVerificationHint: 'Pairing device name verification required.'
  },
  {
    id: 'item-7',
    trackingCode: 'TIET-LF-1019',
    title: 'Tan Leather Bifold Wallet with Cards',
    category: 'Wallets & IDs',
    status: 'Found',
    primaryColor: COLOR_PALETTE[5], // Tan Brown
    location: 'Main Auditorium (Balcony & Foyer)',
    locationZone: 'Recreation',
    reportedDate: '08 Feb 2026, 21:00',
    daysAgo: 4,
    reportedBy: 'Auditorium Operations',
    contactMasked: 'audi-admin@thapar.edu',
    description: 'Found under row G seats after dramatic society rehearsal. Contains SBI Global debit card and Metro card.',
    secretVerificationHint: 'State the cardholder name on the debit card.'
  },
  {
    id: 'item-8',
    trackingCode: 'TIET-LF-1012',
    title: 'Hydro Flask 32oz Insulated Water Bottle',
    category: 'Bottles & Tumblers',
    status: 'Reunited',
    primaryColor: COLOR_PALETTE[4], // Sage Green
    location: 'Sports Complex & Athletic Track',
    locationZone: 'Recreation',
    reportedDate: '07 Feb 2026, 08:30',
    daysAgo: 5,
    reportedBy: 'Track Coach Sharma',
    contactMasked: 'sports-desk@thapar.edu',
    description: 'Sage green with dent on bottom rim and vinyl mountain sticker. Successfully claimed by owner.',
    secretVerificationHint: 'Owner identified exact sticker location.'
  }
];
