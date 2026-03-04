import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import SearchBar from './SearchBar'

const MainLayout = () => {
    return (
        // Am șters "bg-dark" și am pus "backgroundColor: '#09090b'" în style
        <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#09090b' }}>
            {/* Partea din stânga: Bara laterală fixă */}
            <Sidebar />

           <div className="flex-grow-1 d-flex flex-column p-0 overflow-hidden">
                
                {/* 2. BARA DE CĂUTARE SUS (Top Bar) */}
                <div className="p-4 border-bottom border-secondary" style={{ backgroundColor: '#09090b' }}>
                    <SearchBar />
                </div>

                {/* 3. Conținutul Dinamic (Home, Library etc.) se afișează dedesubt */}
                <div className="flex-grow-1 p-4 overflow-auto">
                    <Outlet /> 
                </div>
                 
            </div>
        </div>
    );
};

export default MainLayout;