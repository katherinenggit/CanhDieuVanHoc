import useSound from 'use-sound';

export const useGameSound = () => {
  // 1. Khai báo các âm thanh
  const [playCorrect] = useSound('/sounds/correct.mp3', { volume: 0.5 });
  const [playWrong] = useSound('/sounds/wrong.mp3', { volume: 0.5 });
  const [playClick] = useSound('/sounds/click.mp3', { volume: 0.3 });
  const [playVictory] = useSound('/sounds/victory.mp3', { volume: 0.6 });
  const [playTickTock, { stop: stopTickTock }] = useSound('/sounds/tick-tock.mp3', { volume: 0.4 });
const [playPowerUp] = useSound('/sounds/power-up.mp3', { volume: 0.5 });
  
  // 2. Nhạc nền (có chế độ lặp lại và dừng)
  const [playBg, { stop: stopBg }] = useSound('/sounds/bg-music.mp3', { 
    volume: 0.2, 
    loop: true 
  });

  return { playCorrect, playWrong, playClick, playVictory, playBg, stopBg, playTickTock, playPowerUp, stopTickTock };
};