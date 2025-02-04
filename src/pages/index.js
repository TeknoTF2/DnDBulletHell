import dynamic from 'next/dynamic'

// Import GameBoard with no SSR
const GameBoard = dynamic(
  () => import('../components/GameBoard'),
  { ssr: false }
)

export default function Home() {
  return (
    <div className="p-4">
      <GameBoard />
    </div>
  );
}
