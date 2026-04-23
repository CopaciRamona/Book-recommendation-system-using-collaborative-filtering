import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Book = sequelize.define('Book', {
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
        type: DataTypes.STRING, 
    },
    titlu: {
        type: DataTypes.TEXT, 
    },
    descriere: {
        type: DataTypes.TEXT('medium'),
    },
    autor: {
        type: DataTypes.STRING, 
    },
    link_autor: {
        type: DataTypes.TEXT,
    },
    genuri: {
        type: DataTypes.STRING(1000),
    },
    coperta_url: {
        type: DataTypes.TEXT,
    },
    format_carte: {
        type: DataTypes.STRING,
    },
    numar_pagini: {
        type: DataTypes.STRING,
    },
    publication_info: {
        type: DataTypes.STRING,
    },
    numar_voturi: {
        type: DataTypes.STRING,
    },
    numar_recenzii_text: {
        type: DataTypes.STRING,
    },
    rating_mediu: {
        type: DataTypes.STRING, 
    },
    rating_distributie: {
        type: DataTypes.TEXT,
    },
    data_adaugare: {
        type: DataTypes.DATE,
    }
}, {
  
    tableName: 'books_goodreads_incercare', 
    timestamps: false,
    indexes: [
        {
            unique: false, 
            fields: ['book_id_original']
        }
    ]
});

export default Book;