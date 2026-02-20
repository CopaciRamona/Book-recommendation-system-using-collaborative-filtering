import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Review = sequelize.define('Review', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 5 }
    },
    text_recenzie: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'app_reviews',
    timestamps: true
});

export default Review;