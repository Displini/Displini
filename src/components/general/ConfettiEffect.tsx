import { useEffect, useState, useRef } from 'react';

interface ConfettiEffectProps {
  trigger: boolean;
  onComplete?: () => void;
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  velocityX: number;
  velocityY: number;
  rotationSpeed: number;
}

export function ConfettiEffect({ trigger, onComplete }: ConfettiEffectProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const animationFrameRef = useRef<number>();
  const piecesRef = useRef<ConfettiPiece[]>([]);
  const onCompleteRef = useRef(onComplete);
  const hasStartedRef = useRef(false);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Update ref when onComplete changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!trigger) {
      hasStartedRef.current = false;
      return;
    }
    
    if (hasStartedRef.current) {
      return;
    }
    
    hasStartedRef.current = true;
    
    // Create confetti pieces - reduced count for better performance
    const colors = [
      'hsl(var(--primary))',
      'hsl(var(--secondary))',
      '#FFD700', // gold
      '#FF69B4', // pink
      '#00CED1', // turquoise
      '#FF6347', // tomato
      '#9370DB', // purple
      '#32CD32', // lime
    ];
    
    const pieces: ConfettiPiece[] = [];
    for (let i = 0; i < 50; i++) {
      pieces.push({
        id: i,
        x: Math.random() * 100,
        y: 0,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 12 + 8,
        velocityX: (Math.random() - 0.5) * 2,
        velocityY: Math.random() * 2 + 1,
        rotationSpeed: (Math.random() - 0.5) * 8,
      });
    }
    
    piecesRef.current = pieces;
    setConfetti(pieces);
    
    // Animation
    const startTime = Date.now();
    const duration = 3000; // Shorter duration
    let lastUpdateTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const deltaTime = Date.now() - lastUpdateTime;
      lastUpdateTime = Date.now();
      
      if (elapsed >= duration) {
        setConfetti([]);
        hasStartedRef.current = false;
        if (onCompleteRef.current) onCompleteRef.current();
        return;
      }
      
      // Update positions
      if (piecesRef.current.length > 0) {
        piecesRef.current = piecesRef.current.map((piece) => ({
          ...piece,
          x: piece.x + piece.velocityX * 0.5,
          y: piece.y + piece.velocityY,
          rotation: piece.rotation + piece.rotationSpeed,
          velocityY: piece.velocityY + 0.05,
        }));
        
        // Throttle state updates for better performance - update every 2 frames
        setConfetti([...piecesRef.current]);
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
  }, [trigger]);

  if (confetti.length === 0) {
    return null;
  }
  
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
    >
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
            borderRadius: piece.id % 3 === 0 ? '50%' : piece.id % 3 === 1 ? '20%' : '0%',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.5)',
            opacity: 0.95,
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
}
