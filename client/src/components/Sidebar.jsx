import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Sidebar() {
  const location = useLocation();

  const sections = [
    {
      title: "Main",
      items: [
        { path: '/dashboard', icon: 'fas fa-home', label: 'Dashboard' },
        { path: '/projects', icon: 'fas fa-project-diagram', label: 'Projects' },
        { path: '/team', icon: 'fas fa-users', label: 'Team' },
      ]
    },
    {
      title: "Management",
      items: [
        { path: '/settings', icon: 'fas fa-cog', label: 'Settings' }
      ]
    }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>CollabEase</h2>
      </div>
      <nav className="sidebar-nav">
        {sections.map((section, index) => (
          <div key={index} className="sidebar-section">
            <div className="sidebar-section-label">{section.title}</div>
            {section.items.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item${location.pathname === item.path ? ' active' : ''}`}
              >
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar; 