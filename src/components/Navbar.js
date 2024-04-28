import { useState } from 'react';

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
    <nav>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => handleTagClick(tag)}
          style={{ fontWeight: selectedTags.includes(tag) ? 'bold' : 'normal' }}
        >
          {tag}
        </button>
      ))}
    </nav>
  );
};

export default Navbar;