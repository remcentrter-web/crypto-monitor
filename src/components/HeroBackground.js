import React, { useEffect, useRef, useState } from 'react';

const HeroBackground = () => {
  const canvasRef = useRef(null);
  // Залишаємо налаштування прозорості та скролу
  const [opacity, setOpacity] = useState(0.55); 

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const newOpacity = Math.max(0, 0.55 - scrollY / 1400);
      setOpacity(newOpacity);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const initAndDraw = () => {
      canvas.width = document.documentElement.clientWidth;
      canvas.height = window.innerHeight * 0.95;

      const points = [];
      let currentY = canvas.height / 2;
      // Збільшуємо крок по Х, щоб свічки були ширшими і краще видними (було 35)
      const stepX = canvas.width / 50; 

      for (let x = 0; x <= canvas.width + stepX; x += stepX) {
        points.push({ x, y: currentY });
        currentY += (Math.random() - 0.5) * 160; 
        
        if (currentY < canvas.height * 0.1) currentY = canvas.height * 0.1 + Math.random() * 50;
        if (currentY > canvas.height * 0.9) currentY = canvas.height * 0.9 - Math.random() * 50;
      }

      let start = null;
      const duration = 2000;

      const animate = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width * easeOutQuart, canvas.height);
        ctx.clip();

        // 🔥 МАГІЯ СВІЧОК: Малюємо окремі свічки
        for (let i = 0; i < points.length - 1; i++) {
          // Розраховуємо параметри для кожної свічки
          const startX = points[i].x;
          const openPrice = points[i].y;
          const closePrice = points[i+1].y;

          // Визначаємо колір: зелений (ріст) або червоний (падіння)
          const isUp = closePrice <= openPrice;
          const color = isUp ? '#00c087' : '#ff4343';
          
          ctx.strokeStyle = color;
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 10; // Трохи зменшуємо світіння, щоб було чіткіше
          ctx.lineWidth = 1; // Товщина гніту

          // --- Малюємо гніт (wick) ---
          // Генеруємо випадковий гніт для реалістичності
          const wickTop = Math.min(openPrice, closePrice) - Math.random() * 50;
          const wickBottom = Math.max(openPrice, closePrice) + Math.random() * 50;

          ctx.beginPath();
          ctx.moveTo(startX, wickTop);
          ctx.lineTo(startX, wickBottom);
          ctx.stroke();

          // --- Малюємо тіло свічки (body) ---
          // Ширина тіла свічки (80% від stepX)
          const bodyWidth = stepX * 0.8; 
          const bodyX = startX - bodyWidth / 2;
          const bodyTop = Math.min(openPrice, closePrice);
          const bodyHeight = Math.abs(openPrice - closePrice);

          // Зафарбовуємо тіло, якщо свічка росте, і малюємо лише контур, якщо падає
          if (isUp) {
            ctx.fillRect(bodyX, bodyTop, bodyWidth, bodyHeight);
          } else {
            // Для червоних свічок робимо тільки контур для кращого візуального ефекту, як в Binance
            ctx.lineWidth = 2; // Трохи товстіший контур для тіла
            ctx.strokeRect(bodyX, bodyTop, bodyWidth, bodyHeight);
          }
        }
        ctx.restore();

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(animate);
        }
      };

      animationFrameId = requestAnimationFrame(animate);
    };

    initAndDraw();

    const handleResize = () => {
      cancelAnimationFrame(animationFrameId);
      initAndDraw();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div style={{
      position: 'absolute',
      top: '5vh', 
      left: 0,
      width: '100%',
      maxWidth: '100vw',
      overflow: 'hidden',
      height: '95vh',
      zIndex: 0,
      pointerEvents: 'none',
      opacity: opacity,
      filter: 'blur(4px)', // Зменшуємо розмиття, щоб свічки були чіткішими
      transition: 'opacity 0.1s ease-out',
      maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
      WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)'
    }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default HeroBackground;