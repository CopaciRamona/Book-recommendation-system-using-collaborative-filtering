import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Recommendation = sequelize.define('Recommendation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    score: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    motiv: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'recommendations',
    timestamps: true
});

export default Recommendation;