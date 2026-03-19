interface ShortcutDisplayProps {
  shortcut: string;
  color: string;
  fontSize: string;
  letterSpacing?: string;
  fontWeight?: number;
}

const sharedTokenStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
  minHeight: "1em",
  verticalAlign: "middle" as const,
  fontFamily: "'SF Pro Text', 'SF Pro Symbols', -apple-system, BlinkMacSystemFont, sans-serif",
};

const keyStyle = {
  ...sharedTokenStyle,
};

const symbolStyle = {
  ...sharedTokenStyle,
  transform: "translateY(-0.04em)",
};

function isSymbolToken(token: string) {
  return ["⌘", "⌥", "⌃", "⇧", "⏎"].includes(token);
}

export default function ShortcutDisplay({
  shortcut,
  color,
  fontSize,
  letterSpacing = "0",
  fontWeight = 500,
}: ShortcutDisplayProps) {
  const tokens = shortcut.trim().split(/\s+/).filter(Boolean);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.18em",
        color,
        fontSize,
        fontWeight,
        letterSpacing,
        lineHeight: 1,
        fontFamily: "'SF Pro Text', 'SF Pro Symbols', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {tokens.map((token, index) => (
        <span
          key={`${token}-${index}`}
          style={isSymbolToken(token) ? symbolStyle : keyStyle}
        >
          {token}
        </span>
      ))}
    </span>
  );
}
