const Logo = () => {
  return (
    <svg
      viewBox="0 0 600 300"
      xmlns="http://www.w3.org/2000/svg"
      width="200"   // change size as needed
      height="100"
      style={{ maxWidth: '100%' }}
    >
      {/* Guitar body */}
      <path
        d="M 150 100 Q 100 100, 80 150 Q 60 200, 100 250 Q 150 280, 200 280 Q 300 280, 350 250 Q 400 220, 400 180 Q 400 140, 350 120 Q 300 100, 250 100 L 150 100 Z"
        fill="black"
      />

      {/* Sound hole */}
      <circle cx="250" cy="180" r="30" fill="white" />

      {/* neck + headstock */}
      <rect x="350" y="140" width="180" height="40" fill="black" />
      <rect x="530" y="120" width="60" height="80" fill="black" />

      {/* Pegs */}
      <circle cx="550" cy="140" r="6" fill="white" />
      <circle cx="570" cy="140" r="6" fill="white" />
      <circle cx="550" cy="180" r="6" fill="white" />
      <circle cx="570" cy="180" r="6" fill="white" />

      {/* Strings (optional) */}
      <line x1="370" y1="150" x2="550" y2="140" stroke="white" strokeWidth="2" />
      <line x1="370" y1="160" x2="550" y2="160" stroke="white" strokeWidth="2" />
      <line x1="370" y1="170" x2="550" y2="180" stroke="white" strokeWidth="2" />
      <line x1="370" y1="180" x2="550" y2="200" stroke="white" strokeWidth="2" />

      {/* Waveform (sound bars) */}
      <g fill="white">
        <rect x="140" y="120" width="8" height="40" />
        <rect x="155" y="110" width="8" height="60" />
        <rect x="170" y="100" width="8" height="80" />
        <rect x="185" y="90" width="8" height="100" />
        <rect x="200" y="80" width="8" height="120" />
        <rect x="215" y="90" width="8" height="100" />
        <rect x="230" y="100" width="8" height="80" />
        <rect x="245" y="110" width="8" height="60" />
        <rect x="260" y="120" width="8" height="40" />
      </g>

      {/* Text */}
      <text
        x="300"
        y="260"
        fontFamily="Arial, sans-serif"
        fontSize="48"
        fontWeight="bold"
        fill="black"
        textAnchor="middle"
      >
        BQMUSIC
      </text>

      <text
        x="300"
        y="285"
        fontFamily="Arial, sans-serif"
        fontSize="14"
        fill="#666"
        textAnchor="middle"
      >
        GREAT TAGLINE HERE
      </text>
    </svg>
  );
};

export default Logo;