import '../Navbar.css';

const Navbar = ({ selectedTags, setSelectedTags }) => {
  const tags = ['Philosophy', 'Gardens', 'Ceramics', 'Human Computer Interaction'];

  const handleTagClick = (tag) => {
    if (selectedTags.length === tags.length) {
      setSelectedTags([tag]);
    } else if (selectedTags.includes(tag)) {
      setSelectedTags(tags);
    } else {
      setSelectedTags([tag]);
    }
  };

  return (
    <nav className='navbar'>
      {tags.map((tag) => (
        <div
          key={tag}
          className={`tag ${selectedTags.includes(tag) ? 'selected' : ''}`}
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