export default function RainbowText({ text }: { text: string }) {
  const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];

  return (
    <p>
      {text.split('').map((char, index) => (
        <span key={index} style={{ color: colors[index % colors.length], fontWeight: 'bold' }}>
          {char}
        </span>
      ))}
    </p>
  );
}
