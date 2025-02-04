import '../styles/globals.css';  // Add this at the top
import GameBoard from '../components/GameBoard';

export default function Home() {
  return (
    <div className="p-4">
      <GameBoard />
    </div>
  );
}
