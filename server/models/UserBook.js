import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserBook = sequelize.define('UserBook', {
    status: {
        type: DataTypes.ENUM('want_to_read', 'reading', 'read'),
        defaultValue: 'want_to_read'
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    pagina_curenta: {
        type: DataTypes.INTEGER,
        defaultValue: 0 
    },
    data_incepere: {
        type: DataTypes.DATEONLY, 
        allowNull: true
    },
    data_terminare: {
        type: DataTypes.DATEONLY,
        allowNull: true}
    
}, {
    tableName: 'user_books',
    timestamps: true 
});

export default UserBook;