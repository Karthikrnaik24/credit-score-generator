import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import HomePage from './pages/HomePage';
import OutputPage from './pages/OutputPage';

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/output', element: <OutputPage /> }
]);

export default function App() {
  return <RouterProvider router={router} />;
}
