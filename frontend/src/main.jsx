import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import App from './App.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import PostListing from './pages/PostListing.jsx';
import ListingDetail from './pages/ListingDetail.jsx';
import EditListing from './pages/EditListing.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AuthCallback from './pages/AuthCallback.jsx';
import ChatRedirect from './pages/ChatRedirect.jsx';
import Layout from './components/Layout.jsx';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/post" element={<PostListing />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/listing/:id/edit" element={<EditListing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat/:senderId" element={<ChatRedirect />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
