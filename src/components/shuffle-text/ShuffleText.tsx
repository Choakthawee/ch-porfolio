'use client'

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText as GSAPSplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import { JSX } from 'react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, GSAPSplitText);
}

export interface ShuffleProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  shuffleDirection?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  maxDelay?: number;
  ease?: string | ((t: number) => number);
  threshold?: number;
  rootMargin?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  textAlign?: React.CSSProperties['textAlign'];
  onShuffleComplete?: () => void;
  shuffleTimes?: number;
  animationMode?: 'random' | 'evenodd';
  loop?: boolean;
  loopDelay?: number;
  stagger?: number;
  scrambleCharset?: string;
  colorFrom?: string;
  colorTo?: string;
  triggerOnce?: boolean;
  respectReducedMotion?: boolean;
  triggerOnHover?: boolean;
}

const Shuffle: React.FC<ShuffleProps> = ({
  text,
  className = '',
  style = {},
  shuffleDirection = 'right',
  duration = 0.35,
  maxDelay = 0,
  ease = 'power3.out',
  threshold = 0.1,
  rootMargin = '-100px',
  tag = 'p',
  textAlign = 'center',
  onShuffleComplete,
  shuffleTimes = 1,
  animationMode = 'evenodd',
  loop = false,
  loopDelay = 0,
  stagger = 0.03,
  scrambleCharset = '',
  colorFrom,
  colorTo,
  triggerOnce = true,
  respectReducedMotion = true,
  triggerOnHover = true
}) => {
  const ref = useRef<HTMLElement>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [ready, setReady] = useState(true);

  const splitRef = useRef<GSAPSplitText | null>(null);
  const wrappersRef = useRef<HTMLElement[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const playingRef = useRef(false);
  const hoverHandlerRef = useRef<((e: Event) => void) | null>(null);

  useEffect(() => {
    if ('fonts' in document) {
      document.fonts.ready.then(() => setFontsLoaded(true));
    } else {
      setFontsLoaded(true);
    }
  }, []);

  const scrollTriggerStart = useMemo(() => {
    const startPct = (1 - threshold) * 100;
    return `top ${startPct}%`;
  }, [threshold]);

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded) return;

      if (respectReducedMotion && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        onShuffleComplete?.();
        return;
      }

      const el = ref.current as HTMLElement;

      const removeHover = () => {
        if (hoverHandlerRef.current && ref.current) {
          ref.current.removeEventListener('mouseenter', hoverHandlerRef.current);
          hoverHandlerRef.current = null;
        }
      };

      const teardown = () => {
        if (tlRef.current) {
          tlRef.current.kill();
          tlRef.current = null;
        }
        if (wrappersRef.current.length) {
          try {
            splitRef.current?.revert();
          } catch (e) { }
          wrappersRef.current = [];
        }
        splitRef.current = null;
        playingRef.current = false;
      };

      const build = () => {
        teardown();

        const computedFont = getComputedStyle(el).fontFamily;

        splitRef.current = new GSAPSplitText(el, {
          type: 'chars',
          charsClass: 'shuffle-char',
          wordsClass: 'shuffle-word',
          linesClass: 'shuffle-line',
        });

        const chars = (splitRef.current.chars || []) as HTMLElement[];
        wrappersRef.current = [];

        const rolls = Math.max(1, Math.floor(shuffleTimes));
        const rand = (set: string) => set.charAt(Math.floor(Math.random() * set.length)) || '';

        chars.forEach(ch => {
          const parent = ch.parentElement;
          if (!parent) return;

          const w = Math.ceil(ch.getBoundingClientRect().width);
          const h = Math.ceil(ch.getBoundingClientRect().height);

          if (w === 0) return;

          const wrap = document.createElement('span');
          wrap.className = 'inline-block overflow-hidden text-left align-bottom';
          Object.assign(wrap.style, {
            width: w + 'px',
            height: shuffleDirection === 'up' || shuffleDirection === 'down' ? h + 'px' : 'auto',
          });

          const inner = document.createElement('span');
          inner.className =
            'inline-block will-change-transform origin-left ' +
            (shuffleDirection === 'up' || shuffleDirection === 'down' ? 'whitespace-normal' : 'whitespace-nowrap');

          parent.insertBefore(wrap, ch);
          wrap.appendChild(inner);

          const firstOrig = ch.cloneNode(true) as HTMLElement;
          firstOrig.style.width = w + 'px';
          firstOrig.style.fontFamily = computedFont;
          firstOrig.style.display = (shuffleDirection === 'up' || shuffleDirection === 'down' ? 'block' : 'inline-block');

          ch.setAttribute('data-orig', '1');
          ch.style.width = w + 'px';
          ch.style.fontFamily = computedFont;
          ch.style.display = (shuffleDirection === 'up' || shuffleDirection === 'down' ? 'block' : 'inline-block');

          inner.appendChild(firstOrig);

          for (let k = 0; k < rolls; k++) {
            const c = ch.cloneNode(true) as HTMLElement;
            if (scrambleCharset) c.textContent = rand(scrambleCharset);
            c.style.width = w + 'px';
            c.style.fontFamily = computedFont;
            c.style.display = (shuffleDirection === 'up' || shuffleDirection === 'down' ? 'block' : 'inline-block');
            inner.appendChild(c);
          }
          inner.appendChild(ch);

          const steps = rolls + 1;
          if (shuffleDirection === 'right' || shuffleDirection === 'down') {
            const firstCopy = inner.firstElementChild as HTMLElement | null;
            const real = inner.lastElementChild as HTMLElement | null;
            if (real) inner.insertBefore(real, inner.firstChild);
            if (firstCopy) inner.appendChild(firstCopy);
          }

          let startX = 0, finalX = 0, startY = 0, finalY = 0;

          if (shuffleDirection === 'right') {
            startX = -steps * w; finalX = 0;
          } else if (shuffleDirection === 'left') {
            startX = 0; finalX = -steps * w;
          } else if (shuffleDirection === 'down') {
            startY = -steps * h; finalY = 0;
          } else if (shuffleDirection === 'up') {
            startY = 0; finalY = -steps * h;
          }

          gsap.set(inner, { x: startX, y: startY, force3D: true });
          inner.setAttribute('data-start-x', String(startX));
          inner.setAttribute('data-final-x', String(finalX));
          inner.setAttribute('data-start-y', String(startY));
          inner.setAttribute('data-final-y', String(finalY));

          if (colorFrom) (inner.style as any).color = colorFrom;
          wrappersRef.current.push(wrap);
        });
      };

      const inners = () => wrappersRef.current.map(w => w.firstElementChild as HTMLElement);

      const randomizeScrambles = () => {
        if (!scrambleCharset) return;
        wrappersRef.current.forEach(w => {
          const strip = w.firstElementChild as HTMLElement;
          if (!strip) return;
          const kids = Array.from(strip.children) as HTMLElement[];
          for (let i = 1; i < kids.length - 1; i++) {
            kids[i].textContent = scrambleCharset.charAt(Math.floor(Math.random() * scrambleCharset.length));
          }
        });
      };

      const play = () => {
        const strips = inners();
        if (!strips.length) return;

        playingRef.current = true;
        const isVertical = shuffleDirection === 'up' || shuffleDirection === 'down';

        const tl = gsap.timeline({
          onComplete: () => {
            playingRef.current = false;
            if (!loop) {
              onShuffleComplete?.();
              armHover();
            }
          },
          repeat: loop ? -1 : 0,
          repeatDelay: loopDelay,
          onRepeat: () => {
            if (scrambleCharset) randomizeScrambles();
            gsap.set(strips, isVertical ? { y: (i, t) => parseFloat(t.getAttribute('data-start-y')!) } : { x: (i, t) => parseFloat(t.getAttribute('data-start-x')!) });
          }
        });

        const vars: gsap.TweenVars = {
          duration,
          ease,
          stagger: animationMode === 'evenodd' ? stagger : undefined,
          force3D: true
        };

        if (isVertical) vars.y = (i, t: any) => parseFloat(t.getAttribute('data-final-y') || '0');
        else vars.x = (i, t: any) => parseFloat(t.getAttribute('data-final-x') || '0');

        if (colorFrom && colorTo) {
          tl.to(strips, { ...vars, color: colorTo }, 0);
        } else {
          tl.to(strips, vars, 0);
        }

        tlRef.current = tl;
      };

      const armHover = () => {
        if (!triggerOnHover || !ref.current) return;
        removeHover();
        const handler = () => {
          if (playingRef.current) return;
          build();
          play();
        };
        hoverHandlerRef.current = handler;
        ref.current.addEventListener('mouseenter', handler);
      };

      const create = () => {
        requestAnimationFrame(() => {
          build();
          if (scrambleCharset) randomizeScrambles();
          play();
          setReady(true);
        });
      };

      const handleResize = () => {
        teardown();
        ScrollTrigger.refresh();
        if (triggerOnce && ready) {
          create();
        }
      };

      window.addEventListener('resize', handleResize);

      const st = ScrollTrigger.create({
        trigger: el,
        start: scrollTriggerStart,
        once: triggerOnce,
        onEnter: create
      });

      return () => {
        window.removeEventListener('resize', handleResize);
        st.kill();
        removeHover();
        teardown();
      };
    },
    {
      dependencies: [text, fontsLoaded, shuffleDirection, shuffleTimes, loop],
      scope: ref
    }
  );

  const baseTw = 'inline-block whitespace-normal break-words will-change-transform uppercase text-2xl leading-none';
  const classes = useMemo(
    () => `${baseTw} ${ready ? 'opacity-100' : 'opacity-0'} ${className}`.trim(),
    [baseTw, ready, className]
  );
  const Tag = (tag || 'p') as keyof JSX.IntrinsicElements;

  return React.createElement(Tag, { ref: ref as any, className: classes, style: { textAlign, ...style } }, text);
};

export default Shuffle;