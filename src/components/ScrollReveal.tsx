import React, { useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

interface ScrollRevealProps {
  children: React.ReactNode;
  threshold?: number;
  className?: string;
  delay?: number;
}

export default function ScrollReveal({ 
  children, 
  threshold = 0.1, 
  className = '',
  delay = 0
}: ScrollRevealProps) {
  // Ref for accessing the container DOM node
  const containerRef = useRef<HTMLDivElement>(null);
  const { ref: intersectionRef, inView } = useInView({
    threshold,
    triggerOnce: true,
    rootMargin: '0px 0px -50px 0px'
  });

  // Helper function to combine refs (one for Intersection Observer, one for us)
  const setRefs = (node: HTMLDivElement | null) => {
    // Assign the node to our ref for DOM queries
    containerRef.current = node;
    // Assign the node to the ref required by useInView
    intersectionRef(node);
  };

  useEffect(() => {
    // Make sure inView is true AND the ref has been assigned
    if (inView && containerRef.current) {
      // Find .stagger-child ONLY within this component
      const staggerChildren = containerRef.current.querySelectorAll('.stagger-child');
      staggerChildren.forEach((child, index) => {
        // Apply timeout with increasing delay for each child
        setTimeout(() => {
          child.classList.add('animate-reveal');
        }, delay + index * 100);
      });
    }
  }, [inView, delay]);

  return (
    <div
      ref={setRefs}
      className={`${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      } transition-all duration-1000 ease-out ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}