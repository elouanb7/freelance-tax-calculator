import './globals.css';

const siteUrl = 'https://ae.elouanb7.com';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Calculateur Auto-Entrepreneur 2026 - Simulez votre revenu net freelance',
  description: 'Simulateur gratuit pour auto-entrepreneurs : calculez votre revenu net, cotisations sociales, impôts (versement libératoire ou IR), ACRE, charges et frais professionnels en temps réel.',
  keywords: ['auto-entrepreneur', 'simulateur', 'calculateur', 'freelance', 'micro-entreprise', 'cotisations sociales', 'versement libératoire', 'ACRE', 'TJM', 'revenu net'],
  authors: [{ name: 'Elouan B.', url: 'https://elouanb7.com' }],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: 'Calculateur Auto-Entrepreneur 2026 - Simulez votre revenu net',
    description: 'Simulateur gratuit : calculez votre revenu net auto-entrepreneur avec cotisations, impôts, ACRE et frais professionnels.',
    type: 'website',
    locale: 'fr_FR',
    url: siteUrl,
    siteName: 'Calculateur Auto-Entrepreneur',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calculateur Auto-Entrepreneur 2026',
    description: 'Simulez votre revenu net freelance en temps réel : TJM, cotisations, impôts, ACRE.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Calculateur Auto-Entrepreneur',
    description: 'Simulateur de revenus pour auto-entrepreneurs et freelances en France',
    applicationCategory: 'FinanceApplication',
    url: siteUrl,
    operatingSystem: 'All',
    author: {
      '@type': 'Person',
      name: 'Elouan B.',
      url: 'https://elouanb7.com',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
  };

  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
