import React from 'react';
import { Page, Navbar, MainDisplay, SideDisplay } from '@/components';
import { Link } from 'react-router-dom';
import NotFound404 from '@/assets/404.png';

export const NotFound = () => {
  return (
    <Page>
      <Navbar />
      <MainDisplay>
        <div className="width-full height-full padding-4 padding-top-28 flex-column-centered">
          <img className="width-full max-width-2xl" src={NotFound404}></img>
          <h1 className="text-align-center">Fren, you lost? Head back home</h1>
          <Link to="/" className="button">
            Head Home
          </Link>
        </div>
      </MainDisplay>
      <SideDisplay></SideDisplay>
    </Page>
  );
};
