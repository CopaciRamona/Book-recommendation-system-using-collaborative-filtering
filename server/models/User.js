import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js'; // Asigură-te că calea e corectă

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // --- OBLIGATORII LA PASUL 1 (REGISTER) ---
    email: {
        type: DataTypes.STRING,
        allowNull: false, // Nu merge fără
        unique: true,
        validate: { isEmail: true }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false // Nu merge fără
    },
    nume: {
        type: DataTypes.STRING, 
        allowNull: false // <--- MODIFICARE: Îl facem obligatoriu din start
    },

    // --- OPȚIONALE (SE COMPLETEAZĂ LA PASUL 2) ---
    // Au toate allowNull: true, deci pot fi goale la început
    
    varsta: {
        type: DataTypes.INTEGER,
        allowNull: true 
    },
    location: {
        type: DataTypes.STRING, 
        allowNull: true
    },
    birthday: {
        type: DataTypes.DATEONLY, 
        allowNull: true
    },
    sex: {
        type: DataTypes.STRING(20), 
        allowNull: true, // <--- MODIFICARE: Fără default, ca să știm dacă a completat sau nu
        defaultValue:'Nu specific'
    },
    genuri_preferate: {
        type: DataTypes.TEXT, // TEXT e mai bun decât STRING pentru liste lungi
        allowNull: true
    },
    profile_picture: {
        type: DataTypes.STRING, 
        allowNull: true
    },
    
    // --- SISTEM ---
    role: {
        type: DataTypes.STRING,
        defaultValue: 'user'
    }
}, {
    tableName: 'users',
    timestamps: true 
});

export default User;