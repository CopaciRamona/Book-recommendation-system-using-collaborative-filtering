import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios'; // adaptează calea dacă e nevoie

const SearchBar = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

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

    // Funcție care închide dropdown-ul și golește inputul când dai click pe o carte
    const handleResultClick = () => {
        setSearchQuery('');
        setShowDropdown(false);
    };

    return (
        <div className="position-relative w-100 mx-auto" style={{ maxWidth: '600px' }}>
            {/* Input-ul de căutare */}
            <div className="input-group shadow-sm">
                <span className="input-group-text bg-dark border-secondary text-white-50" style={{ borderRight: 'none', borderRadius: '12px 0 0 12px' }}>
                    🔍
                </span>
                <input 
                    type="text" 
                    className="form-control bg-dark text-light border-secondary shadow-none" 
                    placeholder="Caută o carte după titlu..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ borderLeft: 'none', borderRadius: '0 12px 12px 0' }}
                />
            </div>

            {/* Dropdown-ul Plutitor */}
            {showDropdown && (
                <div 
                    className="position-absolute w-100 mt-2 bg-dark border border-secondary rounded-3 shadow-lg overflow-hidden" 
                    style={{ zIndex: 1050, maxHeight: '400px', overflowY: 'auto', left: 0 }}
                >
                    {isSearching ? (
                        <div className="p-4 text-center text-white-50">
                            <div className="spinner-border spinner-border-sm me-2" role="status" style={{ color: '#c084fc' }}></div>
                            Se caută...
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className="list-group list-group-flush">
                            {searchResults.map(book => (
                                <Link 
                                    key={book.id} 
                                    to={`/book/${book.id}`} 
                                    onClick={handleResultClick} // <-- Ascunde bara când dai click
                                    className="list-group-item list-group-item-action bg-dark text-light border-bottom border-secondary d-flex align-items-center gap-3 p-3 text-decoration-none"
                                >
                                    <img 
                                        src={book.coperta_url || 'https://via.placeholder.com/40x60'} 
                                        alt={book.titlu} 
                                        className="rounded"
                                        style={{ width: '40px', height: '60px', objectFit: 'cover' }} 
                                    />
                                    <div>
                                        <h6 className="mb-1 fw-bold text-white">{book.titlu}</h6>
                                        <small className="text-white-50">{book.autor}</small>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-white-50">
                            Nu am găsit nicio carte pentru "{searchQuery}".
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;