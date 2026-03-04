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
    },
    pagina_curenta: {
        type: DataTypes.INTEGER,
        defaultValue: 0 // Toți pornesc de la pagina 0
    },
    data_incepere: {
        type: DataTypes.DATEONLY, // Salvează formatul YYYY-MM-DD
        allowNull: true
    },
    data_terminare: {
        type: DataTypes.DATEONLY,
        allowNull: true}
    
}, {
    tableName: 'user_books',
    timestamps: true // Stochează created_at și updated_at automat
});

export default UserBook;