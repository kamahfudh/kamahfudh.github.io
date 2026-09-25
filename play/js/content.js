// Copy mirrors mahfudh.art (mahfudh-portfolio-v2). Case study detail lives in case-data.js (generated).

export const PROFILE = {
  name: 'Mahfudh Khoiri Amran',
  role: 'Product UI/UX Designer',
  intro: 'Based in Medan, Indonesia. Currently UI/UX Designer at RiverLens in Selangor, Malaysia, with freelance and internship experience across Islamic-tech products since 2022, staying close to user research and testing rather than handing designs off and moving on.',
  stats: [
    ['Based', 'Medan, Indonesia'],
    ['Focus', 'Product UI/UX, Design Systems'],
    ['Experience', '3+ years, freelance & in-house'],
    ['Open for', 'Freelance and full-time roles'],
  ],
  education: ['Universiti Teknologi Malaysia', 'Bachelor of Computer Science, Software Engineering', 'GPA 3.7, graduated Nov 2023', "Dean's List Honors, 2023"],
  skills: ['Mobile & Website User Interface', 'User Experience & Research', 'Prototyping, Figma', 'Adaptability, Teamwork, Problem Solving'],
  languages: [['Bahasa Indonesia', 'Native'], ['English', 'Professional'], ['Bahasa Melayu', 'Professional']],
  email: 'mahfudhkhoiri2906@gmail.com',
  linkedin: 'https://www.linkedin.com/in/mahfudhkho/',
  location: 'Medan, Indonesia, open to remote work',
  response: 'Usually within one to two business days',
  notice: 'Notice period is one month.',
};

export const CAPABILITIES = [
  { title: 'Interface design', text: 'Mobile and web UI built in Figma, from low-fidelity wireframes through to production-ready screens.', tags: ['Mobile UI', 'Web UI', 'Design Systems', 'Prototyping'] },
  { title: 'Research & testing', text: 'Usability testing and lightweight field research, mostly focused on Indonesian and Malaysian users.', tags: ['User Research', 'Usability Testing', 'Cross-cultural Design'] },
  { title: 'Working with teams', text: 'Sitting inside product, tech, and marketing conversations, not just receiving a brief and disappearing.', tags: ['Stakeholder Alignment', 'Cross-functional Collaboration', 'Design Handoff'] },
];

export const SERVICES = [
  ['UI/UX Design', 'Mobile and web interfaces designed end to end, from early wireframes to production-ready screens in Figma.'],
  ['Design Systems', 'Reusable components, tokens, and interaction patterns that keep a product consistent as it grows.'],
  ['Research & Testing', 'Usability testing and lightweight field research, especially for Indonesian and Malaysian audiences.'],
  ['Prototyping & Handoff', 'Interactive prototypes for stakeholder review, plus clean, developer-ready specs and assets.'],
  ['Product Design Consulting', 'UX audits and design direction for early-stage teams that need a second pair of eyes.'],
  ['Islamic-Tech & Lifestyle Apps', 'Culturally considered UI for Muslim-audience products, from prayer and Qur\'an apps to Islamic fintech.'],
];

// Chronological order: the career-climb level jumps bottom to top.
export const EXPERIENCE = [
  {
    title: 'UI/UX Designer, Internship', org: 'Noor Luminous Sdn Bhd, TheNoor App', when: 'Oct 2022 - Feb 2023', where: 'Kuala Lumpur, Malaysia', short: ['2022 · Noor Luminous', 'Intern'],
    bullets: [
      "Worked with the CTO and CEO to implement the company's long and short-term product goals.",
      "Assisted the senior designer on Al-Qur'an, Apple TV, and Smartwatch widgets for the Muslim audience.",
      'Designed the system from a requirement specification document and delivered prototypes for every screen.',
    ],
  },
  {
    title: 'UI/UX Designer, Freelance', org: 'Seetru Studio', when: 'Aug 2023 - Nov 2023', where: 'Setiawangsa, Kuala Lumpur', short: ['2023 · Seetru Studio', 'Freelance'], caseKey: 'seda',
    bullets: [
      'Designed the SEDA Training and Registration System, a comprehensive web application.',
      'Collaborated with programmers, the Lead Designer, and the Project Manager on execution.',
      'Designed the system from a requirement specification document and delivered prototypes for every screen.',
    ],
  },
  {
    title: 'UI/UX Designer, Freelance', org: 'Noor Luminous Sdn Bhd, TheNoor App', when: 'Oct 2023 - Jan 2025', where: 'Kuala Lumpur, Malaysia', short: ['2023 · TheNoor', 'Freelance'], caseKey: 'thenoor',
    bullets: [
      'Led design for the E-Book, Hadith, Waking-Up Call, Noor Exchange, Noor Travel features, and the company website.',
      'Worked closely with the CEO and Tech Lead to deliver designs for mobile and web.',
      'Responsible for testing user experience and improving visual design.',
    ],
  },
  {
    title: 'UI/UX Designer, Freelance', org: 'NAPZ Holding Berhad', when: 'Aug 2024 - Oct 2024', where: 'Kuala Lumpur, Malaysia', short: ['2024 · NAPZ Holding', 'Freelance'], caseKey: 'napz',
    bullets: [
      'Designed the NapzBox System, a comprehensive web application.',
      'Designed the entire website based on client requirements, then handed off to the development team.',
    ],
  },
  {
    title: 'Creative Designer, Fulltime', org: 'RiverLens Sdn Bhd', when: 'Feb 2025 - Present', where: 'Selangor, Malaysia', short: ['2025 · RiverLens', 'Creative Designer'], caseKey: 'riverlens',
    bullets: [
      'Design user-friendly, visually compelling interfaces for web and mobile platforms.',
      'Conduct user research and usability testing focused on the Indonesian market.',
      'Create wireframes, prototypes, and mockups that reflect real user journeys and cultural norms.',
      'Collaborate with product, tech, and marketing teams to align design with business goals.',
      'Ensure UI/UX elements reflect Islamic values and are appropriate for the Muslim audience.',
    ],
  },
];

// Level 2 build order. tex = 3D frame texture (downscaled copy).
export const WEB = [
  { key: 'riverlens', name: 'RiverLens', tags: ['Web platform', 'Design system', '2025-present'], blurb: 'Studio site + UI for nine shipped client products', tex: 'screens/riverlens-dashboard-dark.png', video: 'case/riverlens-tour.mp4' },
  { key: 'arafa', name: 'Arafa', tags: ['Fintech', 'Islamic finance'], blurb: 'A structured, Shariah-compliant way to save for Umrah', tex: 'screens/arafa-hero.png' },
  { key: 'seda', name: 'SEDA STAR', tags: ['Government', 'Freelance'], blurb: 'Five-role training platform for Malaysia\'s energy authority', tex: 'screens/seda-public-dashboard.png' },
  { key: 'napz', name: 'NapzBox', tags: ['Hospitality', 'Freelance'], blurb: 'Self-check-in booking for a smart pod hotel', tex: 'screens/napz-home.png' },
  { key: 'noorcoffee', name: 'TheNoor & NoorCoffee', tags: ['Marketing site', 'Freelance'], blurb: 'Company website plus a coffee-franchise sub-brand', tex: 'tex/thenoor-web-hero.jpg' },
];

export const MOBILE = [
  { key: 'alafasy', name: 'Alafasy', tags: ['Cross-platform', 'Live on 3 app stores'], blurb: 'Prayer companion with sky-toned theming', tex: 'screens/alafasy-mockup-dark.png', orbit: ['alafasy-home-blue', 'alafasy-home-gold', 'alafasy-qiblah-compass2', 'alafasy-quran-surah2', 'alafasy-ai-result2'] },
  { key: 'ommri', name: 'Ommri', tags: ['Two-sided marketplace'], blurb: 'Badal Umrah, performed on your behalf, verified end to end', tex: 'screens/ommri-homepage-mockup.png', orbit: ['ommri-marketplace-packages', 'ommri-booking-confirm', 'ommri-tracking-taskdetail', 'ommri-ritual-tawaftimer', 'ommri-certificate-clean'] },
  { key: 'thenoor', name: 'TheNoor', tags: ['Muslim lifestyle', 'Freelance'], blurb: 'Lifestyle app with an AI Qur\'an memorization checker', tex: 'screens/thenoor-mockup.png', orbit: ['thenoor-dashboard-2', 'thenoor-qibla', 'thenoor-quran', 'thenoor-hifz-checker', 'thenoor-mood'] },
];

// block = index into CASES.exploratory.blocks
export const EXPLORATORY = [
  { name: 'SneakersHub', type: 'Website', blurb: 'Sneaker e-commerce storefront', tex: 'exp-sneakershub-web', wide: true, block: 0 },
  { name: 'SneakersHub, mobile', type: 'Mobile app', blurb: 'Browse-to-checkout sneaker app', tex: 'exp-sneakershub-app-home', block: 1 },
  { name: 'On The Go', type: 'Mobile app', blurb: 'Travel & hotel-booking app', tex: 'exp-onthego-home', block: 2 },
  { name: 'Toy store', type: 'Mobile app', blurb: 'Funko Pop collectibles storefront', tex: 'exp-toystore-home', block: 3 },
  { name: 'ReadMe', type: 'Mobile app', blurb: 'E-book reader and store', tex: 'exp-readme-mybook', block: 4 },
  { name: 'Weebo', type: 'Website', blurb: 'Anime-streaming site', tex: 'exp-weebo', wide: true, block: 5 },
  { name: 'Event For You', type: 'Mobile app', blurb: 'Event discovery & ticketing', tex: 'exp-eventforyou-home', block: 6 },
];
