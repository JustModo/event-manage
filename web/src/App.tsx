import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import EventList from './pages/EventList';
import EventDetail from './pages/EventDetail';
import AdminDashboard from './pages/AdminDashboard';
import AdminCreateEvent from './pages/AdminCreateEvent';
import AdminEventRegistrations from './pages/AdminEventRegistrations';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/events" replace />} />
        <Route path="/events" element={<EventList />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/create" element={<AdminCreateEvent />} />
        <Route path="/admin/events/:id/registrations" element={<AdminEventRegistrations />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
