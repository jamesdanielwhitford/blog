import { useState } from 'react';
import '../Navbar.css';

const Navbar = ({ selectedTags, setSelectedTags }) => {
  const tags = ['Philosophy', 'Gardens', 'Ceramics', 'Human Computer Interaction'];

  const handleTagClick = (tag) => {
    console.log('Clicked tag:', tag);
    if (selectedTags.length === tags.length && selectedTags.includes(tag)) {
      setSelectedTags([tag]);
    } else if (selectedTags.length === 1 && selectedTags.includes(tag)) {
      setSelectedTags(tags);
    } else if (selectedTags.includes(tag)) {
      setSelectedTags((prevTags) => prevTags.filter((t) => t !== tag));
    } else {
      setSelectedTags((prevTags) => [...prevTags, tag]);
    }
  };

  return (
    <nav className='navbar'>
      {tags.map((tag) => (
        <div
          key={tag}
          className={`tag ${selectedTags === tag ? 'selected' : ''}`}
          onClick={() => handleTagClick(tag)}
          style={{ fontWeight: selectedTags.includes(tag) ? 'bold' : 'normal' }}
        >
          {tag}
        </div>
      ))}
    </nav>
  );
};

export default Navbar;