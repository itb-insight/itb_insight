export const COLORS = {
  bg: "rgba(76, 76, 76, 1)",
  bandGray: "rgba(217, 217, 217, 1)",
  white: "rgba(255, 255, 255, 1)",
};

export const FONT = "'Roboto Mono', monospace";

export type Hex = {
  fx: number;
  fy: number;
  fr: number;
  type: "gradient" | "outline";
};

export const HERO_HEXES: Hex[] = [
  { fx: 0.90, fy: 0.51, fr: 0.033, type: "outline" },
  { fx: 0.965, fy: 0.735, fr: 0.066, type: "outline" },
  { fx: 0.90, fy: 0.775, fr: 0.069, type: "gradient" },
  { fx: 0.795, fy: 0.685, fr: 0.066, type: "gradient" },
  { fx: 0.645, fy: 0.755, fr: 0.066, type: "gradient" },
  { fx: 0.72, fy: 0.845, fr: 0.069, type: "gradient" },
  { fx: 0.80, fy: 0.885, fr: 0.062, type: "outline" },
  { fx: 0.575, fy: 0.885, fr: 0.069, type: "gradient" },
  { fx: 0.475, fy: 0.845, fr: 0.033, type: "outline" },
  { fx: 0.335, fy: 0.885, fr: 0.069, type: "gradient" },
  { fx: 0.235, fy: 0.72, fr: 0.062, type: "outline" },
  { fx: 0.145, fy: 0.885, fr: 0.069, type: "gradient" },
  { fx: 0.055, fy: 0.955, fr: 0.062, type: "gradient" },
  { fx: 0.06, fy: 0.955, fr: 0.033, type: "outline" },
];

export const CONTENT_TOP_HEXES: Hex[] = [
  { fx: 0.03, fy: 0.02, fr: 0.028, type: "gradient" },
  { fx: 0.10, fy: 0.04, fr: 0.05, type: "gradient" },
  { fx: 0.21, fy: 0.02, fr: 0.045, type: "gradient" },
  { fx: 0.335, fy: 0.045, fr: 0.017, type: "outline" },
  { fx: 0.40, fy: 0.03, fr: 0.045, type: "gradient" },
  { fx: 0.52, fy: 0.05, fr: 0.05, type: "gradient" },
  { fx: 0.63, fy: 0.01, fr: 0.028, type: "outline" },
  { fx: 0.735, fy: 0.03, fr: 0.05, type: "outline" },
  { fx: 0.87, fy: 0.02, fr: 0.028, type: "outline" },
];

export const CONTENT_BOTTOM_HEXES: Hex[] = [
  { fx: 0.04, fy: 0.97, fr: 0.028, type: "gradient" },
  { fx: 0.12, fy: 0.95, fr: 0.05, type: "gradient" },
  { fx: 0.24, fy: 0.975, fr: 0.045, type: "gradient" },
  { fx: 0.40, fy: 0.955, fr: 0.05, type: "gradient" },
  { fx: 0.52, fy: 0.975, fr: 0.028, type: "outline" },
  { fx: 0.63, fy: 0.955, fr: 0.05, type: "outline" },
  { fx: 0.79, fy: 0.975, fr: 0.045, type: "outline" },
  { fx: 0.90, fy: 0.955, fr: 0.028, type: "gradient" },
];

export const END_PAGE_HEXES: Hex[] = [
  { fx: 0.02, fy: 0.06, fr: 0.045, type: "gradient" },
  { fx: 0.07, fy: 0.12, fr: 0.045, type: "outline" },
  { fx: 0.17, fy: 0.05, fr: 0.09, type: "outline" },
  { fx: 0.185, fy: 0.28, fr: 0.06, type: "outline" },
  { fx: 0.30, fy: 0.055, fr: 0.045, type: "outline" },
  { fx: 0.34, fy: 0.14, fr: 0.06, type: "gradient" },
  { fx: 0.10, fy: 0.35, fr: 0.06, type: "gradient" },
  { fx: 0.055, fy: 0.55, fr: 0.06, type: "gradient" },
  { fx: 0.16, fy: 0.66, fr: 0.09, type: "outline" },
  { fx: 0.02, fy: 0.75, fr: 0.06, type: "gradient" },
  { fx: 0.12, fy: 0.87, fr: 0.06, type: "gradient" },
  { fx: 0.03, fy: 0.98, fr: 0.028, type: "gradient" },
  { fx: 0.15, fy: 1.0, fr: 0.028, type: "outline" },
  { fx: 0.24, fy: 0.98, fr: 0.045, type: "gradient" },
  { fx: 0.58, fy: 0.09, fr: 0.06, type: "gradient" },
  { fx: 0.71, fy: 0.045, fr: 0.03, type: "outline" },
  { fx: 0.81, fy: 0.13, fr: 0.06, type: "outline" },
  { fx: 0.90, fy: 0.20, fr: 0.09, type: "gradient" },
  { fx: 0.96, fy: 0.06, fr: 0.045, type: "outline" },
  { fx: 0.885, fy: 0.36, fr: 0.06, type: "gradient" },
  { fx: 0.79, fy: 0.44, fr: 0.045, type: "outline" },
  { fx: 0.90, fy: 0.49, fr: 0.045, type: "outline" },
  { fx: 0.97, fy: 0.62, fr: 0.09, type: "gradient" },
  { fx: 0.95, fy: 0.78, fr: 0.06, type: "gradient" },
  { fx: 0.775, fy: 0.79, fr: 0.09, type: "gradient" },
  { fx: 0.895, fy: 0.90, fr: 0.06, type: "gradient" },
  { fx: 0.55, fy: 0.83, fr: 0.06, type: "outline" },
  { fx: 0.45, fy: 0.62, fr: 0.045, type: "outline" },
  { fx: 0.09, fy: 0.005, fr: 0.045, type: "gradient" },
];

export type SeminarCard = {
  id: string;
  title: string;
  description: string;
};

export const SEMINAR_CARDS: SeminarCard[] = [
  {
    id: "tech-seminar-1",
    title: "AI in Industry",
    description: "How machine learning models move from research notebooks into production systems.",
  },
  {
    id: "tech-seminar-2",
    title: "Sustainable Engineering",
    description: "Designing hardware and infrastructure with a smaller environmental footprint.",
  },
  {
    id: "tech-seminar-3",
    title: "From Campus to Startup",
    description: "Lessons from ITB alumni who turned a class project into a funded company.",
  },
  {
    id: "tech-seminar-4",
    title: "Cybersecurity Fundamentals",
    description: "A practical look at the threats every student developer should know about.",
  },
  {
    id: "tech-seminar-5",
    title: "Careers in Robotics",
    description: "What hiring managers at robotics companies actually look for in new graduates.",
  },
  {
    id: "tech-seminar-6",
    title: "Human-Robot Interaction",
    description: "Designing interfaces that make autonomous machines easier to trust and work with.",
  },
];

export const DETAIL_CONTENT = {
  title: "Tech Seminar",
  subtitle: "Talks worth showing up for",
  description:
    "A series of short, focused sessions led by industry practitioners and researchers, covering the tools and ideas shaping the next few years of engineering.",
  endDescription:
    "Seats are limited and fill up fast — reserve your spot early and bring your questions for the Q&A after each talk.",
};