import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** Home screen icon for iOS, which ignores icon.svg. Full-bleed and opaque: iOS rounds the corners itself. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#F4EFFA' }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="180" height="180">
          <g transform="translate(0 6)">
            <path d="M13 40 18 6 44 24z" fill="#F0A45D" />
            <path d="M87 40 82 6 56 24z" fill="#F0A45D" />
            <path d="M20 31 22 15 34 24z" fill="#F4B8C5" />
            <path d="M80 31 78 15 66 24z" fill="#F4B8C5" />
            <ellipse cx="50" cy="54" rx="38" ry="32" fill="#F0A45D" />
            <path d="M50 23v9M41 25l2 8M59 25l-2 8" stroke="#CF7A33" strokeWidth="3" strokeLinecap="round" fill="none" />
            <ellipse cx="50" cy="66" rx="15" ry="10" fill="#fff" opacity=".85" />
            <ellipse cx="36" cy="46" rx="4.6" ry="5.6" fill="#2D2340" />
            <ellipse cx="64" cy="46" rx="4.6" ry="5.6" fill="#2D2340" />
            <circle cx="37.6" cy="44" r="1.5" fill="#fff" />
            <circle cx="65.6" cy="44" r="1.5" fill="#fff" />
            <path d="M46 58h8l-4 5z" fill="#A82D63" />
            <path d="M50 63q-3.5 5-8 2.5M50 63q3.5 5 8 2.5" stroke="#2D2340" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          </g>
        </svg>
      </div>
    ),
    { ...size },
  );
}
