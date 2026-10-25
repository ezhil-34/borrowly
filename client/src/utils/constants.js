/**
 * Global Constants & Configurations for Borrowly
 */

export const CATEGORIES = [
  ['Electronics', 'electronics', 'Projectors, speakers, gaming gear & tech gadgets'],
  ['Cameras & Photography', 'camera', 'DSLRs, mirrorless cameras, lenses & tripods'],
  ['Tools & DIY', 'tools', 'Power drills, saws, sanders & home repair kits'],
  ['Sports & Fitness', 'sports', 'Rackets, gym equipment, cycles & rollerblades'],
  ['Travel & Camping', 'camping', 'Tents, sleeping bags, backpacks & trekking gear'],
  ['Home & Kitchen', 'kitchen', 'Pressure washers, vacuum cleaners & party appliances'],
  ['Books & Study', 'books', 'Textbooks, novels, exam guides & reference material'],
  ['Events & Party Supplies', 'party', 'Audio speakers, decorative lighting & projection kits']
];

export const AREAS = {
  Adyar: [13.0067, 80.2574],
  'T. Nagar': [13.0418, 80.2341],
  Velachery: [12.9815, 80.2180],
  'Anna Nagar': [13.0850, 80.2101],
  Guindy: [13.0067, 80.2206],
  Tambaram: [12.9249, 80.1000]
};

export const DEFAULT_LOCATION = {
  lat: 13.0067,
  lng: 80.2574,
  label: 'Adyar'
};

export const BOOKING_STATUS_CONFIG = {
  requested: {
    label: 'Requested',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-200'
  },
  approved: {
    label: 'Approved',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  ready_for_pickup: {
    label: 'Ready for Pickup',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-200'
  },
  borrowed: {
    label: 'Borrowed (Active)',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  due_soon: {
    label: 'Return Due Soon',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  overdue: {
    label: 'Overdue',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200 font-semibold'
  },
  returned: {
    label: 'Returned',
    badgeClass: 'bg-lime-100 text-lime-900 border-lime-200'
  },
  completed: {
    label: 'Completed',
    badgeClass: 'bg-stone-100 text-stone-700 border-stone-200'
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'bg-gray-100 text-gray-500 border-gray-200'
  },
  disputed: {
    label: 'Disputed',
    badgeClass: 'bg-red-100 text-red-800 border-red-200'
  }
};

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'distance', label: 'Closest to Me' },
  { value: 'price', label: 'Lowest Price' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' }
];
