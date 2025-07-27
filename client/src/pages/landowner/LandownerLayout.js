import React from 'react';
import LandownerNavbar from './LandownerNavbar';
import LandownerFooter from './LandownerFooter';

const LandownerLayout = ({ children }) => (
  <>
    <LandownerNavbar />
    <div className="landowner-content">{children}</div>
    <LandownerFooter />
  </>
);

export default LandownerLayout; 