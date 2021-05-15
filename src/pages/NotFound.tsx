import React from 'react';
import { Page, Navbar, MainDisplay, MainHeading } from '@/components';
import { Link } from 'react-router-dom';

export const NotFound = () => {
  return (
    <Page>
      <Navbar />
      <MainDisplay>
        <div className="width-full height-full padding-4 padding-top-32 flex-column-centered">
          <img className="width-full max-width-2xl" src="/src/assets/404.png"></img>
          <h1 className="text-align-center">Fren, you lost? Head back home</h1>
          <Link to="/" className="button">Head Home</Link>
        </div>
      </MainDisplay>
    </Page>
  );
};
