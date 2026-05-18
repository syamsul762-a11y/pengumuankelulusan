import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Home from '@/pages/Home';
import CheckResult from '@/pages/CheckResult';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import { Toaster } from '@/components/ui/sonner';
import { useState, useEffect, useRef } from 'react';
import { Music, Music2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function App() {
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.log("Music play blocked by browser", e));
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cek" element={<CheckResult />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
        <Toaster position="top-center" richColors />

        {/* Music Controller (Floating) */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button 
            variant="secondary" 
            size="icon" 
            className="rounded-full h-12 w-12 shadow-lg border border-primary/20 bg-background/80 backdrop-blur"
            onClick={toggleMusic}
          >
            {isMusicPlaying ? <Volume2 className="h-5 w-5 text-primary" /> : <VolumeX className="h-5 w-5 text-muted-foreground" />}
          </Button>
          <audio 
            ref={audioRef} 
            src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" 
            loop 
          />
        </div>
      </div>
    </Router>
  );
}
