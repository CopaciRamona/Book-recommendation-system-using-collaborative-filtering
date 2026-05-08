import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios'; 
import { Search } from 'lucide-react';

const SearchBar = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    
    const searchRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (searchQuery.trim().length === 0) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        if (searchQuery.trim().length >= 2) {
            setShowDropdown(true);
            setIsSearching(true);

            const delaySearch = setTimeout(async () => {
                try {
                    const res = await api.get(`/books/search?q=${searchQuery}`);
                    if (res.data && res.data.books) {
                        setSearchResults(res.data.books);
                    }
                } catch (err) {
                    console.error("Eroare la căutare:", err);
                    setSearchResults([]);
                } finally {
                    setIsSearching(false);
                }
            }, 500);

            return () => clearTimeout(delaySearch);
        }
    }, [searchQuery]);

    const handleResultClick = () => {
        setSearchQuery('');
        setShowDropdown(false);
    };

    return (
        <div ref={searchRef} className="position-relative w-100 mx-auto" style={{ maxWidth: '600px' }}>
            
            
            <style>
                {`
                    .nocturne-search-input::placeholder {
                        color: rgba(255, 255, 255, 0.5) !important;
                        opacity: 1 !important;
                        font-weight: 400 !important;
                    }
                    .nocturne-search-input {
                        color: #ffffff !important;
                    }
                `}
            </style>

            {/* Input-ul de căutare */}
            <div 
                className="input-group shadow-sm" 
                style={{ 
                    backgroundColor: '#27272a',
                    borderRadius: '50px',
                    overflow: 'hidden', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.3s ease',
                    boxShadow: showDropdown ? '0 0 15px rgba(147, 51, 234, 0.15)' : 'none',
                    borderColor: showDropdown ? 'rgba(147, 51, 234, 0.5)' : 'rgba(255, 255, 255, 0.1)'
                }}
            >
                <span 
                    className="input-group-text border-0" 
                    style={{ 
                        backgroundColor: 'transparent', 
                        paddingLeft: '20px',
                        transition: 'color 0.3s ease',
                        color: showDropdown ? '#d8b4fe' : '#a1a1aa'
                    }}
                >
                    <Search size={18} strokeWidth={1.5} />
                </span>
                
                <input 
                    type="text" 
                    className="form-control border-0 shadow-none nocturne-search-input" 
                    placeholder="Search by title ..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.trim().length >= 2 && setShowDropdown(true)}
                    style={{ 
                        backgroundColor: 'transparent', 
                        fontFamily: '"Inter", sans-serif',
                        fontSize: '0.95rem',
                        fontWeight: '500',
                        padding: '12px 20px 12px 10px',
                        outline: 'none',
                        letterSpacing: '0.3px'
                    }}
                />
            </div>

            {/* Dropdown*/}
            {showDropdown && (
                <div 
                    className="position-absolute w-100 mt-2 rounded-3 shadow-lg" 
                    style={{ 
                        zIndex: 1050, 
                        maxHeight: '400px', 
                        overflowY: 'auto', 
                        left: 0,
                        backgroundColor: '#18181b',
                        border: '1px solid rgba(147, 51, 234, 0.3)'
                    }}
                >
                    {isSearching ? (
                        <div className="p-4 text-center text-white-50" style={{ fontFamily: '"Inter", sans-serif', fontSize: '0.9rem' }}>
                            <div className="spinner-border spinner-border-sm me-2" role="status" style={{ color: '#c084fc' }}></div>
                            Searching...
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className="list-group list-group-flush">
                            {searchResults.map(book => (
                                <Link 
                                    key={book.id || book.book_id_original} 
                                    to={`/book/${book.id || book.book_id_original}`} 
                                    onClick={handleResultClick}
                                    className="list-group-item list-group-item-action d-flex align-items-center gap-3 p-3 text-decoration-none"
                                    style={{
                                        backgroundColor: 'transparent',
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        color: '#e4e4e7'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(147, 51, 234, 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <img 
                                        src={book.coperta_url || 'https://via.placeholder.com/40x60?text=No+Image'} 
                                        alt={book.titlu} 
                                        className="rounded"
                                        style={{ width: '40px', height: '60px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} 
                                    />
                                    <div>
                                        <h6 className="mb-1 fw-bold text-white" style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem' }}>{book.titlu}</h6>
                                        <small className="text-white-50" style={{ fontFamily: '"Lora", serif', fontStyle: 'italic' }}>by {book.autor}</small>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-white-50" style={{ fontFamily: '"Inter", sans-serif', fontSize: '0.9rem' }}>
                            No books found for "{searchQuery}".
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;