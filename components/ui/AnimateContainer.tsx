'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';

interface AnimateContainerProps {
  children: React.ReactNode;
  type?: 'fade' | 'slideUp' | 'slideRight' | 'scaleUp' | 'popIn' | 'stagger';
  delay?: number;
  duration?: number;
  className?: string;
}

export const AnimateContainer: React.FC<AnimateContainerProps> = ({
  children,
  type = 'fade',
  delay = 0,
  duration = 0.35,
  className = '',
}) => {
  const getVariants = (): Variants => {
    switch (type) {
      case 'slideUp':
        return {
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -15 },
        };
      case 'slideRight':
        return {
          hidden: { opacity: 0, x: -20 },
          visible: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: 20 },
        };
      case 'scaleUp':
        return {
          hidden: { opacity: 0, scale: 0.94 },
          visible: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.94 },
        };
      case 'popIn':
        return {
          hidden: { opacity: 0, scale: 0.88, y: 12 },
          visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 350, damping: 25 },
          },
          exit: { opacity: 0, scale: 0.9, y: 10 },
        };
      case 'stagger':
        return {
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.08,
              delayChildren: delay,
            },
          },
        };
      case 'fade':
      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
          exit: { opacity: 0 },
        };
    }
  };

  const variants = getVariants();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={variants}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const AnimateItem: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
