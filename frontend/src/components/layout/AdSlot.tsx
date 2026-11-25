'use client';

import React from 'react';
import { GoogleAdSense, GoogleAdSenseProps } from './GoogleAdSense';

export type AdSlotProps = GoogleAdSenseProps;

export const AdSlot: React.FC<AdSlotProps> = (props) => {
  return <GoogleAdSense {...props} />;
};
