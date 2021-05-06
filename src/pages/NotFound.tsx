import React from 'react';
import { Page, Navbar, MainDisplay, MainHeading } from '@/components';

export const NotFound = () => {
  return (
    <Page>
      <Navbar />
      <MainDisplay>
        <MainHeading>404 Not Found</MainHeading>
      </MainDisplay>
    </Page>
  );
};
