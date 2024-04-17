import { useState } from 'react';

const Navbar = ({ selectedTag, setSelectedTag }) => {
  const tags = [ 'Philosophy', 'Design', 'Gardens', 'Ceramics', 'Technology']; // Replace with your actual tags

  return (
    <nav>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => setSelectedTag(tag)}
          style={{ fontWeight: selectedTag === tag ? 'bold' : 'normal' }}
        >
          {tag}
        </button>
      ))}
    </nav>
  );
};

export default Navbar;