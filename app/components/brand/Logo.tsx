type LogoProps = {
  className?: string;
  width?: number;
  primary?: string;
  accent?: string;
};

const PRIMARY = '#2B4C6B';
const ACCENT = '#C9A961';
const SERIF = 'var(--font-cormorant), Georgia, serif';

export function LogoTextOnly({
  className,
  width = 320,
  primary = PRIMARY,
  accent = ACCENT,
}: LogoProps) {
  const height = (width / 320) * 140;
  return (
    <svg
      viewBox="0 0 320 140"
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label="Della Pace"
    >
      <text
        x="160"
        y="70"
        textAnchor="middle"
        fontFamily={SERIF}
        fontStyle="italic"
        fontWeight={500}
        fontSize="46"
        fill={primary}
        letterSpacing="1"
      >
        DELLA PACE
      </text>
      <line x1="120" y1="88" x2="200" y2="88" stroke={accent} strokeWidth="1" />
      <text
        x="160"
        y="112"
        textAnchor="middle"
        fontFamily={SERIF}
        fontSize="11"
        fill={accent}
        letterSpacing="6"
      >
        PIZZERIA ARTIGIANALE
      </text>
    </svg>
  );
}

export function LogoMonogram({
  className,
  width = 180,
  primary = PRIMARY,
  accent = ACCENT,
}: LogoProps) {
  return (
    <svg
      viewBox="0 0 180 180"
      width={width}
      height={width}
      className={className}
      role="img"
      aria-label="Della Pace - Monograma DP"
    >
      <circle cx="90" cy="90" r="78" stroke={accent} strokeWidth="1.5" fill="none" />
      <circle cx="90" cy="90" r="72" stroke={primary} strokeWidth="0.5" fill="none" opacity="0.4" />
      <text
        x="90"
        y="108"
        textAnchor="middle"
        fontFamily={SERIF}
        fontStyle="italic"
        fontWeight={500}
        fontSize="76"
        fill={primary}
        letterSpacing="-2"
      >
        DP
      </text>
      <text
        x="90"
        y="148"
        textAnchor="middle"
        fontFamily={SERIF}
        fontSize="9"
        fill={accent}
        letterSpacing="4"
      >
        DELLA PACE
      </text>
      <circle cx="32" cy="90" r="1.5" fill={accent} />
      <circle cx="148" cy="90" r="1.5" fill={accent} />
    </svg>
  );
}

export function LogoArch({
  className,
  width = 320,
  primary = PRIMARY,
  accent = ACCENT,
}: LogoProps) {
  const height = (width / 320) * 180;
  return (
    <svg
      viewBox="0 0 320 180"
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label="Della Pace - Forno"
    >
      <path
        d="M 100 70 Q 100 28 160 28 Q 220 28 220 70 L 220 80 L 100 80 Z"
        stroke={primary}
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M 110 75 Q 110 38 160 38 Q 210 38 210 75"
        stroke={accent}
        strokeWidth="0.8"
        fill="none"
      />
      <path
        d="M 152 56 Q 156 48 160 56 Q 164 48 168 56 Q 164 62 160 60 Q 156 62 152 56 Z"
        fill={accent}
        opacity="0.7"
      />
      <text
        x="160"
        y="116"
        textAnchor="middle"
        fontFamily={SERIF}
        fontStyle="italic"
        fontWeight={500}
        fontSize="34"
        fill={primary}
        letterSpacing="1"
      >
        DELLA PACE
      </text>
      <line x1="130" y1="128" x2="190" y2="128" stroke={accent} strokeWidth="0.8" />
      <text
        x="160"
        y="148"
        textAnchor="middle"
        fontFamily={SERIF}
        fontSize="10"
        fill={accent}
        letterSpacing="5"
      >
        PIZZERIA ARTIGIANALE
      </text>
    </svg>
  );
}

export function LogoDove({
  className,
  width = 320,
  primary = PRIMARY,
  accent = ACCENT,
}: LogoProps) {
  const height = (width / 320) * 180;
  return (
    <svg
      viewBox="0 0 320 180"
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label="Della Pace - Pomba"
    >
      <path
        d="M 120 60 C 130 48 150 42 170 48 C 184 52 192 60 200 56 L 210 52 L 204 62 C 200 66 196 67 192 66 C 196 72 198 78 196 84 C 192 80 186 76 180 76 C 168 76 156 72 148 64 C 140 60 130 60 122 64 Z"
        fill={accent}
      />
      <circle cx="195" cy="58" r="1.2" fill={primary} />
      <path
        d="M 145 62 Q 158 50 174 56"
        stroke={primary}
        strokeWidth="0.6"
        fill="none"
        opacity="0.6"
      />
      <text
        x="160"
        y="118"
        textAnchor="middle"
        fontFamily={SERIF}
        fontStyle="italic"
        fontWeight={500}
        fontSize="36"
        fill={primary}
        letterSpacing="1"
      >
        DELLA PACE
      </text>
      <text
        x="160"
        y="148"
        textAnchor="middle"
        fontFamily={SERIF}
        fontSize="10"
        fill={accent}
        letterSpacing="5"
      >
        PIZZERIA ARTIGIANALE
      </text>
    </svg>
  );
}
