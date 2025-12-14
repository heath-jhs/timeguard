import Layout from "./Layout.jsx";

import EmployeeDashboard from "./EmployeeDashboard";

import AdminDashboard from "./AdminDashboard";

import SetPassword from "./SetPassword";

import Home from "./Home";

import ManagerDashboard from "./ManagerDashboard";

import EnrollUser from "./EnrollUser";

import EXPORT_ALL_CODE from "./EXPORT_ALL_CODE";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    EmployeeDashboard: EmployeeDashboard,
    
    AdminDashboard: AdminDashboard,
    
    SetPassword: SetPassword,
    
    Home: Home,
    
    ManagerDashboard: ManagerDashboard,
    
    EnrollUser: EnrollUser,
    
    EXPORT_ALL_CODE: EXPORT_ALL_CODE,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<EmployeeDashboard />} />
                
                
                <Route path="/EmployeeDashboard" element={<EmployeeDashboard />} />
                
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                
                <Route path="/SetPassword" element={<SetPassword />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/ManagerDashboard" element={<ManagerDashboard />} />
                
                <Route path="/EnrollUser" element={<EnrollUser />} />
                
                <Route path="/EXPORT_ALL_CODE" element={<EXPORT_ALL_CODE />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}