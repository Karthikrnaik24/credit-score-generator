import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import HomePage from './pages/HomePage';
import OutputPage from './pages/OutputPage';
import LenderPage from './pages/LenderPage';

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/output', element: <OutputPage /> },
  { path: '/lender', element: <LenderPage /> }
]);

export default function App() {
  return <RouterProvider router={router} />;
}
