import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserBook = sequelize.define('UserBook', {
    // Statusul lecturii
    status: {
        type: DataTypes.ENUM('want_to_read', 'reading', 'read'),
        defaultValue: 'want_to_read'
    },
    // Nota dată de user (opțional, rapid)
    rating: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'user_books',
    timestamps: true // Stochează created_at și updated_at automat
});

export default UserBook;