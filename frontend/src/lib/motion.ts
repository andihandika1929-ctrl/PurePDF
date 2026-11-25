export const SPRINGS = {
  /** Primary tactile interactions: buttons, toggles, hardware switches */
  tactile: {
    type: 'spring' as const,
    stiffness: 460,
    damping: 34,
    mass: 0.75,
  },
  /** Layout transitions: category filter pill (layoutId), Bento grid reflow */
  mechanical: {
    type: 'spring' as const,
    stiffness: 380,
    damping: 32,
    mass: 0.9,
  },
  /** Drawers, modals, mega-menu panels */
  panel: {
    type: 'spring' as const,
    stiffness: 340,
    damping: 30,
    mass: 0.85,
  },
} as const;

export const EASES = {
  /** Crisp industrial deceleration for opacity/clip reveals */
  precision: [0.16, 1, 0.3, 1] as const,
  /** Quick exit curve */
  exit: [0.4, 0, 1, 1] as const,
} as const;
