// components/Layout.js
import Header from './Header';
import { Outlet } from 'react-router-dom';
// import { ThemeProvider } from './ThemeProvider';

export default function Layout() {
  return (
   
     <>
      <Header />
      <main className="container">
        <Outlet />
      </main>
 </>
  );
}
