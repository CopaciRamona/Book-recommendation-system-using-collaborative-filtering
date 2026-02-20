import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const GoodreadsReview = sequelize.define('GoodreadsReview', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    book_id_original: {
        type: DataTypes.STRING, // ✅ Corectat! Acum e la fel ca în Book.js
        allowNull: true
    },
    user_id: {
        type: DataTypes.BIGINT, 
    },
    user_name: {
        type: DataTypes.STRING, 
    },
    nr_likes: {
        type: DataTypes.STRING, 
    },
    text_recenzie: {
        type: DataTypes.TEXT,
    },
    user_followers: {
        type: DataTypes.STRING, 
    },
    user_total_reviews: {
        type: DataTypes.STRING, 
    },
    data_recenzie: {
        type: DataTypes.STRING, 
    },
    rating: {
        type: DataTypes.STRING, 
    }
}, {
    tableName: 'reviews_goodreads_incercare', 
    timestamps: false
});

export default GoodreadsReview;