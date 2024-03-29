import React from 'react';
import { Page, Navbar, MainDisplay, SideDisplay } from '@/components';
import { Link } from 'react-router-dom';

export const Terms = () => {
  return (
    <Page>
      <Navbar />
      <MainDisplay>
        <div className="width-full padding-4 padding-top-24 flex-column-centered">
          <div className="w-richtext max-width-5xl">
            <h1>Terms and Conditions</h1>
            <p>
              The rich text element allows you to create and format headings, paragraphs, blockquotes, images, and video
              all in one place instead of having to add and format them individually. Just double-click and easily
              create content.
            </p>
            <h4>Static and dynamic content editing</h4>
            <p>
              A rich text element can be used with static or dynamic content. For static content, just drop it into any
              page and begin editing. For dynamic content, add a rich text field to any collection and then connect a
              rich text element to that field in the settings panel. Voila!
            </p>
            <h4>How to customize formatting for each rich text</h4>
            <p>
              Headings, paragraphs, blockquotes, figures, images, and figure captions can all be styled after a class is
              added to the rich text element using the "When inside of" nested selector system.
            </p>
          </div>
        </div>
      </MainDisplay>
      <SideDisplay></SideDisplay>
    </Page>
  );
};
