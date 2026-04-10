/**
 * Organization-wide contact and social presence metadata.
 *
 * Centralized so the website URL, Instagram handle, email etc. can
 * be updated in one place and propagate to every screen that
 * renders them (Profile, Home hero, About, etc.).
 *
 * Instagram deep-link strategy:
 *   Tapping the Instagram card opens `https://www.instagram.com/<handle>/`
 *   in a new tab. On mobile this is intercepted by the installed
 *   Instagram app thanks to the Android intent / iOS Universal Link
 *   handler — no `instagram://` scheme required.
 *
 *   A deeper (real-time post sync) integration would need the
 *   Instagram Graph API + a backend proxy to hold the long-lived
 *   token; that is intentionally NOT done here.
 */
export const ORGANIZATION = {
  name:        'Diskalkuli Derneği',
  nameEn:      'Dyscalculia Association of Türkiye',
  tagline:     'Herkes Matematik Öğrenebilir',
  taglineEn:   'Everyone Can Learn Mathematics',
  foundedYear: 2017,

  website: {
    url:         'https://diskalkulidernegi.org',
    label:       'diskalkulidernegi.org',
    description: 'Resmi web sitesi',
    descriptionEn: 'Official website',
  },

  email: {
    primary: 'info@diskalkulidernegi.org',
    support: 'destek@diskalkulidernegi.org',
  },

  /**
   * Social media presence. Handle is stored without the leading @
   * so we can build both display strings and URLs cleanly.
   */
  social: [
    {
      id:          'instagram',
      name:        'Instagram',
      handle:      'diskalkulider',
      url:         'https://www.instagram.com/diskalkulider/',
      displayName: '@diskalkulider',
      color:       '#E1306C',
      bg:          'linear-gradient(135deg, #F58529 0%, #DD2A7B 50%, #8134AF 100%)',
      description: 'Son gönderiler ve duyurular',
      descriptionEn: 'Latest posts and announcements',
      // SVG path for a clean Instagram glyph (1 path, 24x24 viewBox)
      iconPath:    'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm5.5-2.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5z',
    },
    {
      id:          'website',
      name:        'Web Sitesi',
      nameEn:      'Website',
      handle:      'diskalkulidernegi.org',
      url:         'https://diskalkulidernegi.org',
      displayName: 'diskalkulidernegi.org',
      color:       '#1B5E20',
      bg:          'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
      description: 'Resmi web sitesi',
      descriptionEn: 'Official website',
      iconPath:    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2c1.53 0 3.32 2.08 4.22 6H7.78C8.68 6.08 10.47 4 12 4zm-6.32 6h1.74c-.1.64-.16 1.31-.16 2s.06 1.36.16 2H5.68A7.98 7.98 0 0 1 5 12c0-.68.1-1.35.28-2h.4zm3.78 0h5.08c.1.64.16 1.31.16 2s-.06 1.36-.16 2H9.46c-.1-.64-.16-1.31-.16-2s.06-1.36.16-2zm7.12 0h1.74c.18.65.28 1.32.28 2s-.1 1.35-.28 2h-1.74c.1-.64.16-1.31.16-2s-.06-1.36-.16-2zM7.78 16h8.44c-.9 3.92-2.69 6-4.22 6s-3.32-2.08-4.22-6z',
    },
  ],
};

/** Quick lookup by id. */
export const SOCIAL_BY_ID = Object.fromEntries(
  ORGANIZATION.social.map((s) => [s.id, s])
);
