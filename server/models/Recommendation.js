import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Recommendation = sequelize.define('Recommendation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    score: {
        type: DataTypes.FLOAT, // Scorul de similaritate (ex: 0.95)
        allowNull: true
    },
    motiv: {
        type: DataTypes.STRING, // Ex: "Pentru că ai citit X"
        allowNull: true
    }
}, {
    tableName: 'recommendations',
    timestamps: true
});

export default Recommendation;