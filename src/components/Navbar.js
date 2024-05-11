import '../Navbar.css';

const Navbar = ({ selectedTags, setSelectedTags }) => {
  const tags = ['Philosophy', 'Gardens', 'Ceramics', 'Human Computer Interaction'];

  const handleTagClick = (tag) => {
    if (selectedTags.length === 1 && selectedTags.includes(tag)) {
      setSelectedTags(tags);
    } else {
      setSelectedTags([tag]);
    }
  };

  const isAllTagsSelected = selectedTags.length === tags.length;

  return (
    <nav className='navbar'>
      {tags.map((tag) => (
        <div
          key={tag}
          className={`tag ${selectedTags.includes(tag) && !isAllTagsSelected ? 'selected' : ''}`}
          onClick={() => handleTagClick(tag)}
          style={{ fontWeight: selectedTags.includes(tag) && !isAllTagsSelected ? 'bold' : 'normal' }}
        >
          {tag}
        </div>
      ))}
    </nav>
  );
};

export default Navbar;