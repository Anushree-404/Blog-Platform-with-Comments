import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Link to="/" className="text-indigo-600 font-bold text-lg">
            BlogSpace
          </Link>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} BlogSpace. Built with React & Node.js.
          </p>
          <div className="flex gap-4 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-700">Home</Link>
            <Link to="/register" className="hover:text-gray-700">Sign Up</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
