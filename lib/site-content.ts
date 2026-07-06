export const FREE_DAILY_POINTS = 100;
export const LOW_QUALITY_COST = 10;
export const HIGH_QUALITY_COST = 20;

export const subscriptionPlans = [
  {
    id: "free",
    name: "Free",
    cadence: "Daily",
    price: "$0",
    badge: "Starter",
    points: `${FREE_DAILY_POINTS} points / day`,
    description:
      "Best for testing ideas, lightweight prompts, and daily prototyping.",
    features: [
      "100 free points every day",
      "Project name + image attachment support",
      "Prompt history and downloadable code",
      "Access to standard generation queue",
    ],
  },
  {
    id: "pro-monthly",
    name: "Pro",
    cadence: "Monthly",
    price: "$19 / month",
    badge: "Popular",
    points: "4,500 points / month",
    description:
      "For makers shipping products every week and needing more iterations.",
    features: [
      "Priority generation queue",
      "Advanced prompt presets",
      "Longer chat history",
      "Access to premium model mix",
    ],
  },
  {
    id: "pro-yearly",
    name: "Pro",
    cadence: "Yearly",
    price: "$190 / year",
    badge: "Save 2 months",
    points: "54,000 points / year",
    description:
      "The yearly Pro package for consistent builders and small teams.",
    features: [
      "Everything in Pro monthly",
      "Yearly discount included",
      "Usage trend overview",
      "Priority email support",
    ],
  },
  {
    id: "professional-monthly",
    name: "Professional",
    cadence: "Monthly",
    price: "$49 / month",
    badge: "Power users",
    points: "12,000 points / month",
    description:
      "For agencies, product teams, and advanced developers managing multiple apps.",
    features: [
      "Highest priority queue",
      "Premium models and export options",
      "Extended asset upload workflow",
      "Dedicated developer tools access",
    ],
  },
  {
    id: "professional-yearly",
    name: "Professional",
    cadence: "Yearly",
    price: "$490 / year",
    badge: "Best value",
    points: "144,000 points / year",
    description:
      "Full yearly access for companies that need scale, speed, and advanced control.",
    features: [
      "Everything in Professional monthly",
      "Yearly savings included",
      "Launch support for internal teams",
      "Advanced code package management",
    ],
  },
] as const;

export const paymentMethods = [
  {
    id: "paypal",
    name: "PayPal",
    summary: "Fast checkout for international payments and subscriptions.",
  },
  {
    id: "visa",
    name: "Visa",
    summary: "Card payments for monthly or yearly subscriptions.",
  },
  {
    id: "redotpay",
    name: "RedotPay",
    summary: "Alternative digital card checkout for supported users.",
  },
  {
    id: "code",
    name: "Payment by Code",
    summary: "Redeem subscription or balance using prepaid access codes.",
  },
] as const;

export const platformHighlights = [
  {
    title: "Complete project parameters",
    description:
      "Users can now add a project name and clearly see the uploaded image name before generation starts.",
  },
  {
    title: "Free daily points",
    description:
      "The homepage now tracks a daily free balance with automatic reset for guest usage.",
  },
  {
    title: "Subscriptions and payments",
    description:
      "Dedicated pricing and payment sections were added for Free, Pro, and Professional plans.",
  },
  {
    title: "Developer access",
    description:
      "A new developer area lists 10 full-access accounts that can manage codes and advanced features.",
  },
] as const;

export const developerAccounts = [
  {
    name: "Dev Alpha",
    email: "dev.alpha@warhex.dev",
    role: "Lead Developer",
    tempPassword: "Warhex!Alpha01",
    accessCode: "WH-ALPHA-001",
    canCreateCodes: true,
  },
  {
    name: "Dev Beta",
    email: "dev.beta@warhex.dev",
    role: "Platform Engineer",
    tempPassword: "Warhex!Beta02",
    accessCode: "WH-BETA-002",
    canCreateCodes: true,
  },
  {
    name: "Dev Gamma",
    email: "dev.gamma@warhex.dev",
    role: "Product Engineer",
    tempPassword: "Warhex!Gamma03",
    accessCode: "WH-GAMMA-003",
    canCreateCodes: true,
  },
  {
    name: "Dev Delta",
    email: "dev.delta@warhex.dev",
    role: "Growth Engineer",
    tempPassword: "Warhex!Delta04",
    accessCode: "WH-DELTA-004",
    canCreateCodes: true,
  },
  {
    name: "Dev Epsilon",
    email: "dev.epsilon@warhex.dev",
    role: "Payments Engineer",
    tempPassword: "Warhex!Epsilon05",
    accessCode: "WH-EPSILON-005",
    canCreateCodes: true,
  },
  {
    name: "Dev Zeta",
    email: "dev.zeta@warhex.dev",
    role: "Infrastructure Engineer",
    tempPassword: "Warhex!Zeta06",
    accessCode: "WH-ZETA-006",
    canCreateCodes: true,
  },
  {
    name: "Dev Eta",
    email: "dev.eta@warhex.dev",
    role: "AI Integration Engineer",
    tempPassword: "Warhex!Eta07",
    accessCode: "WH-ETA-007",
    canCreateCodes: true,
  },
  {
    name: "Dev Theta",
    email: "dev.theta@warhex.dev",
    role: "Code Marketplace Manager",
    tempPassword: "Warhex!Theta08",
    accessCode: "WH-THETA-008",
    canCreateCodes: true,
  },
  {
    name: "Dev Iota",
    email: "dev.iota@warhex.dev",
    role: "Security Engineer",
    tempPassword: "Warhex!Iota09",
    accessCode: "WH-IOTA-009",
    canCreateCodes: true,
  },
  {
    name: "Dev Kappa",
    email: "dev.kappa@warhex.dev",
    role: "Release Engineer",
    tempPassword: "Warhex!Kappa10",
    accessCode: "WH-KAPPA-010",
    canCreateCodes: true,
  },
] as const;

export const contactLinks = {
  whatsapp: "https://wa.me/213779109990",
  instagram: "https://www.instagram.com/wh.s.8",
  facebook: "https://www.facebook.com/profile.php?id=61570663858487",
  email: "mailto:Warhexwh@gmail.com",
  emailLabel: "Warhexwh@gmail.com",
} as const;
