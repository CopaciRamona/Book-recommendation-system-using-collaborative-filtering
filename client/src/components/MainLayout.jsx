import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import SearchBar from './SearchBar'

const MainLayout = () => {
    return (

        <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#09090b' }}>
            
            <Sidebar />

           <div className="flex-grow-1 d-flex flex-column p-0 overflow-hidden">
                
               <div className="px-4 d-flex align-items-center" style={{ 
                    height: '86px', 
                    backgroundColor: '#09090b',
                    borderBottom: '1px solid rgba(147, 51, 234, 0.2)' 
                }}>
                    <SearchBar />
                </div>

                
                <div className="flex-grow-1 p-4 overflow-auto">
                    <Outlet /> 
                </div>
                 
            </div>
        </div>
    );
};

export default MainLayout;