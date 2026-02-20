import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

// Definim modelul "Book". 
const Book = sequelize.define('Book', {
    // Aici listăm coloanele EXACT cum sunt în MySQL
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    book_id_original: {
        type: DataTypes.STRING, 
        allowNull: true,
    },
    isbn13: {
        type: DataTypes.STRING, // varchar(20) în DB
    },
    titlu: {
        type: DataTypes.TEXT, 
    },
    descriere: {
        type: DataTypes.TEXT('medium'), // În MySQL e MEDIUMTEXT
    },
    autor: {
        type: DataTypes.STRING, 
    },
    link_autor: {
        type: DataTypes.TEXT, // text în DB
    },
    genuri: {
        type: DataTypes.STRING(1000), // varchar(1000) în DB
    },
    coperta_url: {
        type: DataTypes.TEXT,
    },
    format_carte: {
        type: DataTypes.STRING, // varchar(100) în DB
    },
    numar_pagini: {
        type: DataTypes.STRING, // varchar(50) în DB
    },
    publication_info: {
        type: DataTypes.STRING, // varchar(255) în DB
    },
    numar_voturi: {
        type: DataTypes.STRING, // varchar(50) în DB
    },
    numar_recenzii_text: {
        type: DataTypes.STRING, // varchar(50) în DB
    },
    rating_mediu: {
        type: DataTypes.STRING, 
    },
    rating_distributie: {
        type: DataTypes.TEXT, // text în DB
    },
    data_adaugare: {
        type: DataTypes.DATE, // datetime în DB
    }
}, {
    // --- OPȚIUNI FOARTE IMPORTANTE ---
    
    // 1. Numele tabelei din MySQL. 
    // ATENȚIE: Dacă folosești tabela din poză, schimbă aici în 'books_goodreads_incercare'. 
    // Dacă ai suprascris tabela veche, lasă 'books_goodreads'.
    tableName: 'books_goodreads_incercare', 
    timestamps: false,
    indexes: [
        {
            unique: false, // Permitem duplicate
            fields: ['book_id_original'] // Creăm index ca să meargă relația
        }
    ]
});

export default Book;