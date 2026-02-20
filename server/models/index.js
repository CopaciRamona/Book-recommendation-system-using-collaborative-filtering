import sequelize from '../config/database.js';
import Book from './Book.js';
import User from './User.js';
import UserBook from './UserBook.js';
import Review from './Review.js';
import GoodreadsReview from './GoodreadsReview.js';
import Recommendation from './Recommendation.js';

// === 1. LISTELE DE LECTURĂ (User <-> Book) ===
User.belongsToMany(Book, { through: UserBook, foreignKey: 'userId', as: 'myLibrary' });
Book.belongsToMany(User, { through: UserBook, foreignKey: 'bookId', as: 'readers' });

// === 2. RECENZIILE APLICAȚIEI (User <-> Review <-> Book) ===
User.hasMany(Review, { foreignKey: 'userId', as: 'myReviews', onDelete: 'CASCADE' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });

Book.hasMany(Review, { foreignKey: 'bookId', as: 'appReviews', onDelete: 'CASCADE' });
Review.belongsTo(Book, { foreignKey: 'bookId', as: 'book', onDelete: 'CASCADE' });

User.hasMany(Recommendation, { foreignKey: 'userId', as: 'recommendations', onDelete: 'CASCADE' });
Recommendation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// O Recomandare este legată de o Carte (cartea recomandată)
Book.hasMany(Recommendation, { foreignKey: 'bookId', as: 'recommendationEntries', onDelete: 'CASCADE' });
Recommendation.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });

// === 3. RECENZIILE VECHI GOODREADS (Book <-> GoodreadsReview) ===
Book.hasMany(GoodreadsReview, { 
    sourceKey: 'book_id_original', 
    foreignKey: 'book_id_original', 
    as: 'goodreadsReviews',
    constraints: false
});

GoodreadsReview.belongsTo(Book, { 
    targetKey: 'book_id_original', 
    foreignKey: 'book_id_original', 
    as: 'book', 
    constraints: false
});

export {
    sequelize,
    Book,
    User,
    UserBook,
    Review,
    GoodreadsReview,
    Recommendation
};