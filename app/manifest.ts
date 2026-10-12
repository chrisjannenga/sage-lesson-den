import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sage's Lesson Den",
    short_name: 'Lesson Den',
    description: "Sage's daily IXL lessons, check-offs, and weekly plan.",
    start_url: '/',
    display: 'standalone',
    background_color: '#F4EFFA',
    theme_color: '#F4EFFA',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
